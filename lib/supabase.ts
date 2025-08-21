import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Model {
  id: string
  name: string
  provider: string
  model_id: string
  enabled: boolean
  context_length: number
  created_at?: string
  updated_at?: string
}

export interface Prompt {
  id: string
  text: string
  created_at: string
  updated_at?: string
}

export interface Response {
  id: string
  prompt_id: string
  model_id: string
  response_text: string
  response_time_ms: number
  created_at: string
  model?: Model
}

export interface ConsensusGroup {
  id: string
  prompt_id: string
  group_name: string
  count: number
  percentage: number
  color: string
  models?: string[]  // Optional since database doesn't have this column yet
  created_at: string
}

// Supabase client with enhanced error handling
export class SupabaseClient {
  private client = supabase

  async getModels(): Promise<Model[]> {
    try {
      const { data, error } = await this.client
        .from('models')
        .select('*')
        .order('provider', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch models: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error fetching models:', error)
      throw error
    }
  }

  async updateModelEnabled(id: string, enabled: boolean): Promise<Model> {
    try {
      const { data, error } = await this.client
        .from('models')
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update model: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error updating model:', error)
      throw error
    }
  }

  async upsertModels(models: Omit<Model, 'id' | 'created_at' | 'updated_at'>[]): Promise<Model[]> {
    try {
      const { data, error } = await this.client
        .from('models')
        .upsert(models, { onConflict: 'model_id' })
        .select()

      if (error) {
        throw new Error(`Failed to upsert models: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error upserting models:', error)
      throw error
    }
  }

  async savePrompt(text: string): Promise<Prompt> {
    try {
      const { data, error } = await this.client
        .from('prompts')
        .insert({ text })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to save prompt: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error saving prompt:', error)
      throw error
    }
  }

  async saveResponses(responses: Omit<Response, 'id' | 'created_at'>[]): Promise<Response[]> {
    try {
      const { data, error } = await this.client
        .from('responses')
        .insert(responses)
        .select(`
          *,
          model:models(*)
        `)

      if (error) {
        throw new Error(`Failed to save responses: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error saving responses:', error)
      throw error
    }
  }

  async saveConsensusGroups(groups: Omit<ConsensusGroup, 'id' | 'created_at'>[]): Promise<ConsensusGroup[]> {
    try {
      const { data, error } = await this.client
        .from('consensus_groups')
        .insert(groups)
        .select()

      if (error) {
        throw new Error(`Failed to save consensus groups: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error saving consensus groups:', error)
      throw error
    }
  }

  async getPromptHistory(limit = 50): Promise<Prompt[]> {
    try {
      const { data, error } = await this.client
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(`Failed to fetch prompt history: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error fetching prompt history:', error)
      throw error
    }
  }

  async getPromptWithResults(promptId: string): Promise<{
    prompt: Prompt
    responses: Response[]
    consensusGroups: ConsensusGroup[]
  } | null> {
    try {
      const [promptResult, responsesResult, consensusResult] = await Promise.all([
        this.client.from('prompts').select('*').eq('id', promptId).single(),
        this.client.from('responses').select(`
          *,
          model:models(*)
        `).eq('prompt_id', promptId),
        this.client.from('consensus_groups').select('*').eq('prompt_id', promptId)
      ])

      if (promptResult.error) {
        throw new Error(`Failed to fetch prompt: ${promptResult.error.message}`)
      }

      return {
        prompt: promptResult.data,
        responses: responsesResult.data || [],
        consensusGroups: consensusResult.data || []
      }
    } catch (error) {
      console.error('Error fetching prompt with results:', error)
      throw error
    }
  }
}

export const supabaseClient = new SupabaseClient()