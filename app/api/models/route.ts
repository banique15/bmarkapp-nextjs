import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseClient } from '@/lib/supabase'
import OpenRouterClient from '@/lib/openrouter'

// Helper function to get OpenRouter API key from environment or headers
function getOpenRouterApiKey(request?: NextRequest): string | null {
  // First try environment variable (for production)
  if (process.env.OPENROUTER_API_KEY) {
    return process.env.OPENROUTER_API_KEY
  }
  
  // Fall back to request headers (for development with settings page)
  if (request?.headers.get('X-OpenRouter-API-Key')) {
    return request.headers.get('X-OpenRouter-API-Key')
  }
  
  return null
}

// Validation schemas
const UpdateModelSchema = z.object({
  id: z.string().uuid(),
  enabled: z.boolean(),
})

const ModelSchema = z.object({
  name: z.string(),
  provider: z.string(),
  model_id: z.string(),
  enabled: z.boolean(),
  context_length: z.number(),
})

// GET: Fetch all models
export async function GET() {
  try {
    const models = await supabaseClient.getModels()
    
    return NextResponse.json({ models }, { status: 200 })
  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch models' },
      { status: 500 }
    )
  }
}

// POST: Sync models from OpenRouter
export async function POST(request: NextRequest) {
  try {
    const openRouterApiKey = getOpenRouterApiKey(request)
    if (!openRouterApiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key is not configured. Please set it in environment variables or via the settings page.' },
        { status: 500 }
      )
    }

    // Initialize OpenRouter client
    const openRouter = new OpenRouterClient(openRouterApiKey)
    
    // Fetch models from OpenRouter
    const openRouterResponse = await openRouter.getModels()
    
    if (!openRouterResponse?.data) {
      return NextResponse.json(
        { error: 'Failed to fetch models from OpenRouter.' },
        { status: 500 }
      )
    }

    // Filter models for benchmarking
    const filteredModels = OpenRouterClient.filterModelsForBenchmark(openRouterResponse.data)
    
    // Limit models per provider (up to 5 each)
    const providerModels: Record<string, any[]> = {}
    filteredModels.forEach(model => {
      const [provider] = model.id.split('/')
      if (!providerModels[provider]) {
        providerModels[provider] = []
      }
      
      if (providerModels[provider].length < 5) {
        providerModels[provider].push(model)
      }
    })

    // Flatten the provider models
    const selectedModels = Object.values(providerModels).flat()
    
    // Process models for our database
    const models = selectedModels.map(model => {
      // Extract provider from model ID
      const [provider, modelName] = model.id.split('/')
      const formattedProvider = provider.charAt(0).toUpperCase() + provider.slice(1)
      
      // Format model name
      const formattedName = modelName
        .split('-')
        .map((part: string) => {
          if (/^\d+$/.test(part)) {
            return part
          }
          return part.charAt(0).toUpperCase() + part.slice(1)
        })
        .join(' ')

      return {
        name: formattedName,
        provider: formattedProvider,
        model_id: model.id,
        enabled: true,
        context_length: model.context_length || 4096
      }
    })

    // Add recommended models if they're not already included
    const recommendedModels = [
      { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', context_length: 128000 },
      { id: 'anthropic/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', context_length: 200000 },
      { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'Google', context_length: 2000000 },
      { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'Meta', context_length: 131072 },
      { id: 'mistralai/mistral-large', name: 'Mistral Large', provider: 'Mistral AI', context_length: 128000 },
      { id: 'cohere/command-r-plus', name: 'Command R+', provider: 'Cohere', context_length: 128000 }
    ]

    recommendedModels.forEach(recModel => {
      if (!models.some(m => m.model_id === recModel.id)) {
        models.push({
          name: recModel.name,
          provider: recModel.provider,
          model_id: recModel.id,
          enabled: true,
          context_length: recModel.context_length
        })
      }
    })

    // Validate models
    const validatedModels = models.map(model => ModelSchema.parse(model))

    // Get existing models to preserve enabled status
    const existingModels = await supabaseClient.getModels()
    const existingModelMap = new Map(existingModels.map(m => [m.model_id, m.enabled]))

    // Preserve enabled status for existing models
    const modelsToUpsert = validatedModels.map(model => ({
      ...model,
      enabled: existingModelMap.has(model.model_id) 
        ? existingModelMap.get(model.model_id)! 
        : true
    }))

    // Upsert models
    const savedModels = await supabaseClient.upsertModels(modelsToUpsert)

    return NextResponse.json({
      message: `Successfully synced ${savedModels.length} models.`,
      models: savedModels
    }, { status: 200 })

  } catch (error) {
    console.error('Error syncing models:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync models' },
      { status: 500 }
    )
  }
}

// PUT: Update model enabled status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const { id, enabled } = UpdateModelSchema.parse(body)
    
    // Update model in database
    const updatedModel = await supabaseClient.updateModelEnabled(id, enabled)

    return NextResponse.json({ model: updatedModel }, { status: 200 })
  } catch (error) {
    console.error('Error updating model:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update model' },
      { status: 500 }
    )
  }
}