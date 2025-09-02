import { generateText } from 'ai'

interface VercelAIModel {
  id: string
  name: string
  description?: string
  context_length: number
  pricing?: {
    prompt: string
    completion: string
  }
  provider: string
}

interface VercelAIResponse {
  data: VercelAIModel[]
}

export class VercelAIGatewayClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getModels(): Promise<VercelAIResponse> {
    try {
      // Check if API key is provided
      if (!this.apiKey || this.apiKey.trim() === '') {
        console.warn('No Vercel AI Gateway API key provided, using predefined models')
        return {
          data: VercelAIGatewayClient.getPredefinedModels()
        }
      }

      // For now, return predefined models since the AI Gateway doesn't expose a models endpoint directly
      // according to the documentation
      console.log('Using predefined models for Vercel AI Gateway')
      return {
        data: VercelAIGatewayClient.getPredefinedModels()
      }
    } catch (error) {
      console.error('Error with Vercel AI Gateway:', error)
      console.log('Falling back to predefined models')
      return {
        data: VercelAIGatewayClient.getPredefinedModels()
      }
    }
  }

  async getCompletion(
    modelId: string, 
    prompt: string, 
    options: {
      maxTokens?: number
      temperature?: number
      systemPrompt?: string
      timeout?: number
    } = {}
  ): Promise<{ text: string; timeMs: number; usage?: any }> {
    const startTime = Date.now()
    
    const {
      temperature = 0.7,
      systemPrompt = 'You are a helpful assistant. Please provide a clear, concise response to the user\'s question.',
      timeout = 30000
    } = options

    try {
      // Check if API key is provided
      if (!this.apiKey || this.apiKey.trim() === '') {
        throw new Error('Vercel AI Gateway API key is required')
      }

      // Set the environment variable for the AI SDK to use
      process.env.AI_GATEWAY_API_KEY = this.apiKey

      // Use the AI SDK directly with the model ID
      // According to the documentation, the AI Gateway provider will default to using AI_GATEWAY_API_KEY
      const result = await generateText({
        model: modelId, // Use the model ID directly (e.g., 'openai/gpt-4o')
        system: systemPrompt,
        prompt: prompt,
        temperature: temperature,
        maxRetries: 3,
        abortSignal: AbortSignal.timeout(timeout),
      })

      const endTime = Date.now()
      
      return {
        text: result.text,
        timeMs: endTime - startTime,
        usage: result.usage
      }
    } catch (error) {
      const endTime = Date.now()
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`)
      }
      
      console.error(`Error getting completion from ${modelId}:`, error)
      throw new Error(`Failed to get completion: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async batchCompletion(
    modelIds: string[], 
    prompt: string, 
    options: {
      maxTokens?: number
      temperature?: number
      systemPrompt?: string
      timeout?: number
      concurrency?: number
    } = {}
  ): Promise<Array<{ modelId: string; result?: { text: string; timeMs: number; usage?: any }; error?: string }>> {
    const { concurrency = 5 } = options
    
    // Process requests in batches to avoid overwhelming the API
    const results: Array<{ modelId: string; result?: { text: string; timeMs: number; usage?: any }; error?: string }> = []
    
    for (let i = 0; i < modelIds.length; i += concurrency) {
      const batch = modelIds.slice(i, i + concurrency)
      
      const batchPromises = batch.map(async (modelId) => {
        try {
          const result = await this.getCompletion(modelId, prompt, options)
          return { modelId, result }
        } catch (error) {
          console.error(`Error for model ${modelId}:`, error)
          return { 
            modelId, 
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Small delay between batches to be respectful to the API
      if (i + concurrency < modelIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    return results
  }

  // Helper method to extract provider from model ID
  private extractProvider(modelId: string): string {
    const [provider] = modelId.split('/')
    return provider.charAt(0).toUpperCase() + provider.slice(1)
  }

  // Utility method to filter and select models for benchmarking
  static filterModelsForBenchmark(models: VercelAIModel[]): VercelAIModel[] {
    return models.filter(model => {
      const modelId = model.id.toLowerCase()
      
      // Exclude free, vision, and preview models
      return !modelId.includes(':free') && 
             !modelId.includes('vision') && 
             !modelId.includes('preview') &&
             !modelId.includes('beta') &&
             model.context_length >= 2000 // Ensure reasonable context length
    })
  }

  // Get recommended models for quick setup
  static getRecommendedModelIds(): string[] {
    return [
      'openai/gpt-4o',
      'anthropic/claude-3-5-sonnet',
      'google/gemini-pro-1.5',
      'meta-llama/llama-3.1-70b-instruct',
      'mistralai/mistral-large',
      'cohere/command-r-plus'
    ]
  }

  // Get predefined models list (since Vercel AI Gateway doesn't have a models endpoint)
  static getPredefinedModels(): VercelAIModel[] {
    return [
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        context_length: 128000,
        description: 'Most capable GPT-4 model'
      },
      {
        id: 'openai/gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        context_length: 128000,
        description: 'Faster and cheaper GPT-4o model'
      },
      {
        id: 'openai/gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'OpenAI',
        context_length: 16385,
        description: 'Fast and efficient model'
      },
      {
        id: 'anthropic/claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        context_length: 200000,
        description: 'Most intelligent Claude model'
      },
      {
        id: 'anthropic/claude-3-haiku',
        name: 'Claude 3 Haiku',
        provider: 'Anthropic',
        context_length: 200000,
        description: 'Fastest Claude model'
      },
      {
        id: 'google/gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'Google',
        context_length: 2000000,
        description: 'Google\'s most capable model'
      },
      {
        id: 'google/gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        provider: 'Google',
        context_length: 1000000,
        description: 'Fast and efficient Gemini model'
      },
      {
        id: 'meta-llama/llama-3.1-70b-instruct',
        name: 'Llama 3.1 70B',
        provider: 'Meta',
        context_length: 131072,
        description: 'Meta\'s large language model'
      },
      {
        id: 'meta-llama/llama-3.1-8b-instruct',
        name: 'Llama 3.1 8B',
        provider: 'Meta',
        context_length: 131072,
        description: 'Smaller, faster Llama model'
      },
      {
        id: 'mistralai/mistral-large',
        name: 'Mistral Large',
        provider: 'Mistral AI',
        context_length: 128000,
        description: 'Mistral\'s most capable model'
      },
      {
        id: 'mistralai/mistral-small',
        name: 'Mistral Small',
        provider: 'Mistral AI',
        context_length: 32000,
        description: 'Efficient Mistral model'
      },
      {
        id: 'cohere/command-r-plus',
        name: 'Command R+',
        provider: 'Cohere',
        context_length: 128000,
        description: 'Cohere\'s advanced model'
      }
    ]
  }
}

export default VercelAIGatewayClient