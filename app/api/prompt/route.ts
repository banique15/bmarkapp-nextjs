import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseClient } from '@/lib/supabase'
import VercelAIGatewayClient from '@/lib/vercel-ai-gateway'
import { ConsensusAnalyzer } from '@/lib/consensus-analyzer'

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
const PromptRequestSchema = z.object({
  text: z.string().min(1, 'Prompt text is required').max(1000, 'Prompt too long'),
  modelIds: z.array(z.string().min(1)).min(1, 'At least one model must be selected'),
})

// POST: Process prompt with selected models
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const { text, modelIds } = PromptRequestSchema.parse(body)
    
    // Get Vercel AI Gateway API key
    const vercelAIGatewayApiKey = getVercelAIGatewayApiKey(request)
    if (!vercelAIGatewayApiKey) {
      return NextResponse.json(
        { error: 'Vercel AI Gateway API key is not configured. Please set it in environment variables or via the settings page.' },
        { status: 500 }
      )
    }

    // Get selected models from database
    const allModels = await supabaseClient.getModels()
    const selectedModels = allModels.filter(model => modelIds.includes(model.id))
    
    if (selectedModels.length === 0) {
      return NextResponse.json(
        { error: 'No valid models selected.' },
        { status: 400 }
      )
    }

    // Save prompt to database
    const savedPrompt = await supabaseClient.savePrompt(text)

    // Initialize Vercel AI Gateway client
    const aiGateway = new VercelAIGatewayClient(vercelAIGatewayApiKey)
    
    // Get model IDs for Vercel AI Gateway
    const modelAIGatewayIds = selectedModels.map(model => model.model_id)
    
    // Send requests to all models in batches
    const batchResults = await aiGateway.batchCompletion(
      modelAIGatewayIds,
      text,
      {
        maxTokens: 10,
        temperature: 0.7,
        systemPrompt: 'You are a helpful assistant. Respond with a single word only.',
        timeout: 30000,
        concurrency: 5
      }
    )

    // Process results and prepare responses
    const responses: Array<{
      prompt_id: string
      model_id: string
      response_text: string
      response_time_ms: number
    }> = []

    const processedResults = batchResults.map(batchResult => {
      const model = selectedModels.find(m => m.model_id === batchResult.modelId)
      
      if (batchResult.error || !batchResult.result || !model) {
        return {
          model: model || { id: 'unknown', name: 'Unknown', provider: 'Unknown' },
          response_text: batchResult.error || 'Error',
          response_time_ms: 0,
          error: batchResult.error || 'Unknown error'
        }
      }

      // Add to database responses
      responses.push({
        prompt_id: savedPrompt.id,
        model_id: model.id,
        response_text: batchResult.result.text,
        response_time_ms: batchResult.result.timeMs
      })

      return {
        model: {
          id: model.id,
          name: model.name,
          provider: model.provider
        },
        response_text: batchResult.result.text,
        response_time_ms: batchResult.result.timeMs,
        usage: batchResult.result.usage
      }
    })

    // Save responses to database if any were successful
    let savedResponses: any[] = []
    if (responses.length > 0) {
      savedResponses = await supabaseClient.saveResponses(responses)
    }

    // Analyze consensus
    const consensusAnalysis = ConsensusAnalyzer.analyzeConsensus(
      savedResponses.map(response => ({
        id: response.id,
        model_id: response.model_id,
        response_text: response.response_text,
        response_time_ms: response.response_time_ms,
        model: response.model
      }))
    )

    // Save consensus groups to database
    let savedConsensusGroups: any[] = []
    if (consensusAnalysis.groups.length > 0) {
      const consensusGroupsToSave = consensusAnalysis.groups.map(group => ({
        prompt_id: savedPrompt.id,
        group_name: group.groupName,
        count: group.count,
        percentage: group.percentage,
        color: group.color
        // Note: models field removed temporarily due to database schema mismatch
      }))
      
      try {
        savedConsensusGroups = await supabaseClient.saveConsensusGroups(consensusGroupsToSave)
      } catch (error) {
        console.error('Failed to save consensus groups, continuing without saving:', error)
        // Continue without saving consensus groups to database
      }
    }

    // Generate insights
    const insights = ConsensusAnalyzer.generateInsights(consensusAnalysis)
    const summaryStats = ConsensusAnalyzer.getSummaryStats(consensusAnalysis)

    return NextResponse.json({
      prompt: savedPrompt,
      responses: processedResults,
      consensus_groups: consensusAnalysis.groups,
      insights,
      summary: summaryStats,
      total_models: selectedModels.length,
      successful_responses: responses.length,
      failed_responses: selectedModels.length - responses.length
    }, { status: 200 })

  } catch (error) {
    console.error('Error processing prompt:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process prompt' },
      { status: 500 }
    )
  }
}

// GET: Get prompt history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const promptId = searchParams.get('id')

    if (promptId) {
      // Get specific prompt with results
      const promptWithResults = await supabaseClient.getPromptWithResults(promptId)
      
      if (!promptWithResults) {
        return NextResponse.json(
          { error: 'Prompt not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(promptWithResults, { status: 200 })
    } else {
      // Get prompt history
      const prompts = await supabaseClient.getPromptHistory(limit)
      
      return NextResponse.json({ prompts }, { status: 200 })
    }
  } catch (error) {
    console.error('Error fetching prompt data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch prompt data' },
      { status: 500 }
    )
  }
}