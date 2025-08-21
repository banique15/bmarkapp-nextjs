interface OpenRouterModel {
  id: string
  name: string
  description?: string
  context_length: number
  pricing: {
    prompt: string
    completion: string
  }
  top_provider?: {
    max_completion_tokens?: number
  }
}

interface OpenRouterResponse {
  data: OpenRouterModel[]
}

interface CompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class OpenRouterClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.baseUrl = 'https://openrouter.ai/api/v1'
  }

  async getModels(): Promise<OpenRouterResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching models from OpenRouter:', error)
      throw new Error(`Failed to fetch models: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      maxTokens = 50,
      temperature = 0.7,
      systemPrompt = 'You are a helpful assistant. Please provide a clear, concise response to the user\'s question.',
      timeout = 30000
    } = options

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'LLM Consensus Benchmark'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: modelId,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature,
          stream: false
        })
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('OpenRouter error response:', response.status, errorText)
        let errorMessage = errorText
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error?.message || errorData.error || errorText
        } catch (e) {
          // errorText is already set
        }
        throw new Error(`OpenRouter API error (${response.status}): ${errorMessage}`)
      }
      
      const data: CompletionResponse = await response.json()
      const endTime = Date.now()
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response choices returned from OpenRouter')
      }

      const content = data.choices[0].message.content?.trim()
      if (!content) {
        throw new Error('Empty response from model')
      }
      
      return {
        text: content,
        timeMs: endTime - startTime,
        usage: data.usage
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

  // Utility method to filter and select models for benchmarking
  static filterModelsForBenchmark(models: OpenRouterModel[]): OpenRouterModel[] {
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
}

export default OpenRouterClient