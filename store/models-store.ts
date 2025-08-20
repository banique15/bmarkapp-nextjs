import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Model } from '@/lib/supabase'

interface ModelsState {
  models: Model[]
  selectedModelIds: string[]
  isLoading: boolean
  error: string | null
  searchTerm: string
  providerFilter: string
  sortBy: 'provider' | 'name' | 'context'
  
  // Actions
  setModels: (models: Model[]) => void
  toggleModel: (modelId: string) => void
  selectAllModels: () => void
  deselectAllModels: () => void
  selectRecommendedModels: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSearchTerm: (term: string) => void
  setProviderFilter: (provider: string) => void
  setSortBy: (sortBy: 'provider' | 'name' | 'context') => void
  getFilteredModels: () => Model[]
  getSelectedModels: () => Model[]
  getProviders: () => string[]
  syncModels: () => Promise<void>
  updateModelEnabled: (modelId: string, enabled: boolean) => Promise<void>
}

const RECOMMENDED_MODEL_IDS = [
  'openai/gpt-4o',
  'anthropic/claude-3-5-sonnet',
  'google/gemini-pro-1.5',
  'meta-llama/llama-3.1-70b-instruct',
  'mistralai/mistral-large',
  'cohere/command-r-plus'
]

export const useModelsStore = create<ModelsState>()(
  devtools(
    persist(
      (set, get) => ({
        models: [],
        selectedModelIds: [],
        isLoading: false,
        error: null,
        searchTerm: '',
        providerFilter: 'all',
        sortBy: 'provider',

        setModels: (models) =>
          set({ models, selectedModelIds: models.filter(m => m.enabled).map(m => m.id) }),

        toggleModel: (modelId) =>
          set((state) => {
            const model = state.models.find(m => m.id === modelId)
            if (!model) return state

            const updatedModels = state.models.map(m =>
              m.id === modelId ? { ...m, enabled: !m.enabled } : m
            )

            return {
              models: updatedModels,
              selectedModelIds: updatedModels.filter(m => m.enabled).map(m => m.id)
            }
          }),

        selectAllModels: () =>
          set((state) => {
            const filteredModels = get().getFilteredModels()
            const updatedModels = state.models.map(model =>
              filteredModels.some(fm => fm.id === model.id)
                ? { ...model, enabled: true }
                : model
            )

            return {
              models: updatedModels,
              selectedModelIds: updatedModels.filter(m => m.enabled).map(m => m.id)
            }
          }),

        deselectAllModels: () =>
          set((state) => {
            const filteredModels = get().getFilteredModels()
            const updatedModels = state.models.map(model =>
              filteredModels.some(fm => fm.id === model.id)
                ? { ...model, enabled: false }
                : model
            )

            return {
              models: updatedModels,
              selectedModelIds: updatedModels.filter(m => m.enabled).map(m => m.id)
            }
          }),

        selectRecommendedModels: () =>
          set((state) => {
            const updatedModels = state.models.map(model => ({
              ...model,
              enabled: RECOMMENDED_MODEL_IDS.includes(model.model_id)
            }))

            return {
              models: updatedModels,
              selectedModelIds: updatedModels.filter(m => m.enabled).map(m => m.id)
            }
          }),

        setLoading: (loading) => set({ isLoading: loading }),

        setError: (error) => set({ error }),

        setSearchTerm: (term) => set({ searchTerm: term }),

        setProviderFilter: (provider) => set({ providerFilter: provider }),

        setSortBy: (sortBy) => set({ sortBy }),

        getFilteredModels: () => {
          const { models, searchTerm, providerFilter, sortBy } = get()
          
          // Filter by search term and provider
          let filtered = models.filter(model => {
            const matchesSearch = searchTerm === '' ||
              model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              model.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
              model.model_id.toLowerCase().includes(searchTerm.toLowerCase())
            
            const matchesProvider = providerFilter === 'all' || model.provider === providerFilter
            
            return matchesSearch && matchesProvider
          })

          // Sort models
          filtered.sort((a, b) => {
            switch (sortBy) {
              case 'name':
                return a.name.localeCompare(b.name)
              case 'context':
                return (b.context_length || 0) - (a.context_length || 0)
              case 'provider':
              default:
                return a.provider === b.provider
                  ? a.name.localeCompare(b.name)
                  : a.provider.localeCompare(b.provider)
            }
          })

          return filtered
        },

        getSelectedModels: () => {
          const { models, selectedModelIds } = get()
          return models.filter(model => selectedModelIds.includes(model.id))
        },

        getProviders: () => {
          const { models } = get()
          return [...new Set(models.map(model => model.provider))].sort()
        },

        syncModels: async () => {
          set({ isLoading: true, error: null })
          
          try {
            const response = await fetch('/api/models', { method: 'POST' })
            const data = await response.json()
            
            if (!response.ok) {
              throw new Error(data.error || 'Failed to sync models')
            }
            
            set({ 
              models: data.models,
              selectedModelIds: data.models.filter((m: Model) => m.enabled).map((m: Model) => m.id)
            })
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to sync models' })
          } finally {
            set({ isLoading: false })
          }
        },

        updateModelEnabled: async (modelId: string, enabled: boolean) => {
          // Optimistic update
          get().toggleModel(modelId)
          
          try {
            const response = await fetch('/api/models', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: modelId, enabled })
            })
            
            const data = await response.json()
            
            if (!response.ok) {
              // Revert optimistic update
              get().toggleModel(modelId)
              throw new Error(data.error || 'Failed to update model')
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update model' })
          }
        }
      }),
      {
        name: 'models-store',
        partialize: (state) => ({
          searchTerm: state.searchTerm,
          providerFilter: state.providerFilter,
          sortBy: state.sortBy
        })
      }
    ),
    { name: 'models-store' }
  )
)