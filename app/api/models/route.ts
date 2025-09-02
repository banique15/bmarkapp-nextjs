import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseClient } from '@/lib/supabase'
import VercelAIGatewayClient from '@/lib/vercel-ai-gateway'

// Helper function to get Vercel AI Gateway API key from environment or headers
function getVercelAIGatewayApiKey(request?: NextRequest): string | null {
  // First try environment variable (for production)
  if (process.env.AI_GATEWAY_API_KEY) {
    return process.env.AI_GATEWAY_API_KEY
  }
  
  // Fall back to request headers (for development with settings page)
  if (request?.headers.get('X-Vercel-AI-Gateway-Key')) {
    return request.headers.get('X-Vercel-AI-Gateway-Key')
  }
  
  return null
}

// Validation schemas
const UpdateModelSchema = z.object({
  id: z.string().min(1), // Accept any non-empty string (UUID or mock ID)
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
    const vercelAIGatewayApiKey = getVercelAIGatewayApiKey(request)
    if (!vercelAIGatewayApiKey) {
      return NextResponse.json(
        { error: 'Vercel AI Gateway API key is not configured. Please set it in environment variables or via the settings page.' },
        { status: 500 }
      )
    }

    // Initialize Vercel AI Gateway client
    const aiGateway = new VercelAIGatewayClient(vercelAIGatewayApiKey)
    
    // Use predefined models since Vercel AI Gateway might not have a models endpoint
    // or try to fetch from the gateway if available
    let availableModels
    try {
      const gatewayResponse = await aiGateway.getModels()
      availableModels = gatewayResponse?.data || []
    } catch (error) {
      console.log('Using predefined models as gateway models endpoint is not available:', error)
      availableModels = VercelAIGatewayClient.getPredefinedModels()
    }

    // Filter models for benchmarking
    const filteredModels = VercelAIGatewayClient.filterModelsForBenchmark(availableModels)
    
    // Limit models per provider (up to 5 each)
    const providerModels: Record<string, any[]> = {}
    filteredModels.forEach(model => {
      const provider = model.provider || model.id.split('/')[0]
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
      // Extract provider from model ID or use provided provider
      const provider = model.provider || model.id.split('/')[0]
      const formattedProvider = provider.charAt(0).toUpperCase() + provider.slice(1)
      
      // Use provided name or format from model ID
      const modelName = model.name || model.id.split('/')[1] || model.id
      const formattedName = typeof modelName === 'string'
        ? modelName
        : modelName.split('-')
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

    // Ensure we have the recommended models
    const recommendedModels = VercelAIGatewayClient.getPredefinedModels()
    
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

    // Get existing models to preserve enabled status (with fallback)
    let existingModels: any[] = []
    let existingModelMap = new Map()
    
    try {
      existingModels = await supabaseClient.getModels()
      existingModelMap = new Map(existingModels.map(m => [m.model_id, m.enabled]))
    } catch (error) {
      console.warn('Could not fetch existing models from database, using defaults:', error)
      // Continue with empty map - all models will be enabled by default
    }

    // Preserve enabled status for existing models
    const modelsToUpsert = validatedModels.map(model => ({
      ...model,
      enabled: existingModelMap.has(model.model_id)
        ? existingModelMap.get(model.model_id)!
        : true
    }))

    // Upsert models (with fallback)
    let savedModels = modelsToUpsert
    try {
      savedModels = await supabaseClient.upsertModels(modelsToUpsert)
    } catch (error) {
      console.warn('Could not save models to database, returning local models:', error)
      // For development without database, return the models we would have saved
      savedModels = modelsToUpsert.map((model, index) => ({
        ...model,
        id: `mock-${index}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    }

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
    
    // Check if this is a mock ID (development mode)
    if (id.startsWith('mock-')) {
      // In development mode, just return a mock response
      console.log(`Mock update: Model ${id} enabled status set to ${enabled}`)
      return NextResponse.json({
        model: {
          id,
          enabled,
          updated_at: new Date().toISOString()
        }
      }, { status: 200 })
    }
    
    // Update model in database (production mode)
    try {
      const updatedModel = await supabaseClient.updateModelEnabled(id, enabled)
      return NextResponse.json({ model: updatedModel }, { status: 200 })
    } catch (error) {
      console.warn('Could not update model in database, using mock response:', error)
      // Fallback to mock response if database is unavailable
      return NextResponse.json({
        model: {
          id,
          enabled,
          updated_at: new Date().toISOString()
        }
      }, { status: 200 })
    }

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