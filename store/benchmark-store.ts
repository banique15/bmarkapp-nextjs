import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { ConsensusGroup, ConsensusAnalysis } from '@/lib/consensus-analyzer'

interface BenchmarkResponse {
  model: {
    id: string
    name: string
    provider: string
  }
  response_text: string
  response_time_ms: number
  error?: string
  usage?: any
}

interface BenchmarkState {
  // Current benchmark state
  prompt: string
  isProcessing: boolean
  responses: BenchmarkResponse[]
  consensusGroups: ConsensusGroup[]
  insights: string[]
  summary: any
  error: string | null
  
  // History and results
  promptHistory: any[]
  currentPromptId: string | null
  
  // UI state
  showExamples: boolean
  selectedTab: 'responses' | 'consensus' | 'insights'
  
  // Actions
  setPrompt: (prompt: string) => void
  setProcessing: (processing: boolean) => void
  setResponses: (responses: BenchmarkResponse[]) => void
  setConsensusGroups: (groups: ConsensusGroup[]) => void
  setInsights: (insights: string[]) => void
  setSummary: (summary: any) => void
  setError: (error: string | null) => void
  setShowExamples: (show: boolean) => void
  setSelectedTab: (tab: 'responses' | 'consensus' | 'insights') => void
  clearResults: () => void
  submitPrompt: (modelIds: string[]) => Promise<void>
  loadHistory: () => Promise<void>
  loadPromptResults: (promptId: string) => Promise<void>
  exportResults: () => void
}

const EXAMPLE_PROMPTS = [
  "What is the capital of France?",
  "What is the largest planet in our solar system?",
  "What color is the sky?",
  "What is the chemical symbol for gold?",
  "What is the tallest mountain on Earth?"
]

export const useBenchmarkStore = create<BenchmarkState>()(
  devtools(
    (set, get) => ({
      // Initial state
      prompt: '',
      isProcessing: false,
      responses: [],
      consensusGroups: [],
      insights: [],
      summary: null,
      error: null,
      promptHistory: [],
      currentPromptId: null,
      showExamples: false,
      selectedTab: 'responses',

      // Actions
      setPrompt: (prompt: string) => set({ prompt }),

      setProcessing: (processing: boolean) => set({ isProcessing: processing }),

      setResponses: (responses: BenchmarkResponse[]) => set({ responses }),

      setConsensusGroups: (groups: ConsensusGroup[]) => set({ consensusGroups: groups }),

      setInsights: (insights: string[]) => set({ insights }),

      setSummary: (summary: any) => set({ summary }),

      setError: (error: string | null) => set({ error }),

      setShowExamples: (show: boolean) => set({ showExamples: show }),

      setSelectedTab: (tab: 'responses' | 'consensus' | 'insights') => set({ selectedTab: tab }),

      clearResults: () => set({
        responses: [],
        consensusGroups: [],
        insights: [],
        summary: null,
        error: null,
        currentPromptId: null
      }),

      submitPrompt: async (modelIds: string[]) => {
        const { prompt } = get()
        
        if (!prompt.trim()) {
          set({ error: 'Please enter a prompt' })
          return
        }

        if (modelIds.length === 0) {
          set({ error: 'Please select at least one model' })
          return
        }

        set({ 
          isProcessing: true, 
          error: null,
          responses: [],
          consensusGroups: [],
          insights: [],
          summary: null
        })

        try {
          const response = await fetch('/api/prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: prompt,
              modelIds
            })
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Failed to process prompt')
          }

          set({
            responses: data.responses,
            consensusGroups: data.consensus_groups,
            insights: data.insights,
            summary: data.summary,
            currentPromptId: data.prompt?.id
          })

          // Refresh history to include new prompt
          get().loadHistory()

        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to process prompt'
          })
        } finally {
          set({ isProcessing: false })
        }
      },

      loadHistory: async () => {
        try {
          const response = await fetch('/api/prompt')
          const data = await response.json()

          if (response.ok) {
            set({ promptHistory: data.prompts })
          }
        } catch (error) {
          console.error('Failed to load prompt history:', error)
        }
      },

      loadPromptResults: async (promptId: string) => {
        set({ isProcessing: true, error: null })

        try {
          const response = await fetch(`/api/prompt?id=${promptId}`)
          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Failed to load prompt results')
          }

          // Convert responses to expected format
          const formattedResponses = data.responses.map((r: any) => ({
            model: {
              id: r.model_id,
              name: r.model?.name || 'Unknown',
              provider: r.model?.provider || 'Unknown'
            },
            response_text: r.response_text,
            response_time_ms: r.response_time_ms
          }))

          set({
            prompt: data.prompt.text,
            responses: formattedResponses,
            consensusGroups: data.consensusGroups || [],
            currentPromptId: promptId
          })

        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load prompt results'
          })
        } finally {
          set({ isProcessing: false })
        }
      },

      exportResults: () => {
        const { prompt, consensusGroups } = get()
        
        if (consensusGroups.length === 0) {
          set({ error: 'No results to export' })
          return
        }

        // Create CSV content
        const headers = ['Response', 'Count', 'Percentage', 'Models']
        const rows = consensusGroups.map(group => [
          `"${group.groupName.replace(/"/g, '""')}"`,
          group.count.toString(),
          group.percentage.toFixed(1),
          `"${group.models.join(', ').replace(/"/g, '""')}"`
        ])

        const csvContent = [
          `# LLM Consensus Analysis`,
          `# Prompt: "${prompt.replace(/"/g, '""')}"`,
          `# Generated: ${new Date().toISOString()}`,
          ``,
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n')

        // Create download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `llm-consensus-${new Date().toISOString().slice(0, 10)}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    }),
    { name: 'benchmark-store' }
  )
)

export { EXAMPLE_PROMPTS }
export type { BenchmarkResponse }