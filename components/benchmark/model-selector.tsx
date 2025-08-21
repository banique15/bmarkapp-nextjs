'use client'

import { useState } from 'react'
import { useModelsStore } from '@/store/models-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

// Model metadata for enhanced display
const MODEL_METADATA: Record<string, {
  category: string
  speed: 'fast' | 'medium' | 'slow'
  cost: 'low' | 'medium' | 'high'
  description: string
  strengths: string[]
}> = {
  'openai/gpt-4o': {
    category: 'Flagship',
    speed: 'medium',
    cost: 'high',
    description: 'Most advanced GPT model with superior reasoning',
    strengths: ['Reasoning', 'Coding', 'Analysis']
  },
  'openai/gpt-4o-mini': {
    category: 'Efficient',
    speed: 'fast',
    cost: 'low',
    description: 'Fast and cost-effective GPT model',
    strengths: ['Speed', 'Cost-effective', 'General tasks']
  },
  'anthropic/claude-3-5-sonnet': {
    category: 'Flagship',
    speed: 'medium',
    cost: 'high',
    description: 'Latest Claude with enhanced capabilities',
    strengths: ['Writing', 'Analysis', 'Safety']
  },
  'anthropic/claude-3-haiku': {
    category: 'Efficient',
    speed: 'fast',
    cost: 'low',
    description: 'Fast and efficient Claude model',
    strengths: ['Speed', 'Efficiency', 'Simple tasks']
  },
  'google/gemini-pro-1.5': {
    category: 'Advanced',
    speed: 'medium',
    cost: 'medium',
    description: 'Google\'s advanced multimodal model',
    strengths: ['Multimodal', 'Long context', 'Reasoning']
  },
  'meta-llama/llama-3.1-70b-instruct': {
    category: 'Open Source',
    speed: 'medium',
    cost: 'medium',
    description: 'Meta\'s large open-source model',
    strengths: ['Open source', 'Multilingual', 'Instruction following']
  }
}

const PROVIDER_COLORS: Record<string, string> = {
  'openai': 'bg-green-100 text-green-800',
  'anthropic': 'bg-orange-100 text-orange-800',
  'google': 'bg-blue-100 text-blue-800',
  'meta-llama': 'bg-purple-100 text-purple-800',
  'mistralai': 'bg-red-100 text-red-800',
  'cohere': 'bg-indigo-100 text-indigo-800'
}

export function ModelSelector() {
  const [categoryFilter, setCategoryFilter] = useState('all')
  
  const {
    models,
    selectedModelIds,
    isLoading,
    searchTerm,
    providerFilter,
    sortBy,
    setSearchTerm,
    setProviderFilter,
    setSortBy,
    toggleModel,
    selectAllModels,
    deselectAllModels,
    selectRecommendedModels,
    getFilteredModels,
    getProviders,
    updateModelEnabled
  } = useModelsStore()

  const filteredModels = getFilteredModels().filter(model => {
    if (categoryFilter === 'all') return true
    const metadata = MODEL_METADATA[model.model_id]
    return metadata?.category === categoryFilter
  })

  const providers = getProviders()
  const categories = ['all', 'Flagship', 'Advanced', 'Efficient', 'Open Source']

  const handleModelToggle = async (modelId: string) => {
    const model = models.find(m => m.id === modelId)
    if (model) {
      await updateModelEnabled(modelId, !model.enabled)
    }
  }

  const getSpeedIcon = (speed: string) => {
    switch (speed) {
      case 'fast': return '⚡'
      case 'medium': return '⚡⚡'
      case 'slow': return '⚡⚡⚡'
      default: return '⚡'
    }
  }

  const getCostIcon = (cost: string) => {
    switch (cost) {
      case 'low': return '$'
      case 'medium': return '$$'
      case 'high': return '$$$'
      default: return '$'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search models by name, provider, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              aria-label="Filter by provider"
            >
              <option value="all">All Providers</option>
              {providers.map(provider => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              aria-label="Filter by category"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'provider' | 'name' | 'context')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              aria-label="Sort models"
            >
              <option value="provider">Sort by Provider</option>
              <option value="name">Sort by Name</option>
              <option value="context">Sort by Context Length</option>
            </select>
          </div>
        </div>

        {/* Selection Summary */}
        <div className="flex items-center justify-end">
          <Badge variant="secondary" className="text-sm">
            {selectedModelIds.length} of {filteredModels.length} selected
          </Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
        <Button
          variant="outline"
          size="sm"
          onClick={selectRecommendedModels}
          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
        >
          ⭐ Select Recommended
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={selectAllModels}
        >
          Select All Filtered ({filteredModels.length})
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={deselectAllModels}
        >
          Deselect All
        </Button>
      </div>

      {/* Models Display - Compact Single Column */}
      {filteredModels.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-lg font-medium">No models match your criteria</p>
          <p className="text-sm mt-1">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto px-4">
          {filteredModels.map((model) => {
            const metadata = MODEL_METADATA[model.model_id]
            const isRecommended = ['openai/gpt-4o', 'anthropic/claude-3-5-sonnet', 'google/gemini-pro-1.5', 'meta-llama/llama-3.1-70b-instruct'].includes(model.model_id)
            const providerColor = PROVIDER_COLORS[model.provider] || 'bg-gray-100 text-gray-800'

            return (
              <Card
                key={model.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md mx-4 ${
                  model.enabled
                    ? 'ring-2 ring-blue-500 bg-blue-50 shadow-sm'
                    : 'hover:border-blue-300 hover:bg-gray-50'
                }`}
                onClick={() => handleModelToggle(model.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={model.enabled}
                        onChange={() => handleModelToggle(model.id)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${model.name}`}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900 truncate text-sm">
                            {model.name}
                          </h3>
                          {isRecommended && (
                            <Badge variant="default" className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800">
                              ⭐
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className={`text-xs px-2 py-0.5 ${providerColor}`}>
                            {model.provider}
                          </Badge>
                          {metadata && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 text-gray-600">
                              {metadata.category}
                            </Badge>
                          )}
                          {metadata?.strengths && (
                            <div className="hidden sm:flex space-x-1">
                              {metadata.strengths.slice(0, 2).map((strength, index) => (
                                <Badge key={index} variant="outline" className="text-xs px-1.5 py-0 text-gray-500 border-gray-300">
                                  {strength}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      {metadata && (
                        <div className="flex items-center space-x-2">
                          <span title={`Speed: ${metadata.speed}`} className="text-sm">
                            {getSpeedIcon(metadata.speed)}
                          </span>
                          <span title={`Cost: ${metadata.cost}`} className="font-mono text-xs">
                            {getCostIcon(metadata.cost)}
                          </span>
                        </div>
                      )}
                      {model.context_length && (
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {model.context_length >= 1000000
                            ? `${(model.context_length / 1000000).toFixed(1)}M`
                            : `${(model.context_length / 1000).toFixed(0)}K`
                          } ctx
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Enhanced Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-4">
        <div>
          Showing <strong>{filteredModels.length}</strong> of <strong>{models.length}</strong> models
          {categoryFilter !== 'all' && ` in ${categoryFilter}`}
          {providerFilter !== 'all' && ` from ${providerFilter}`}
        </div>
        <div className="flex items-center space-x-4">
          <span>
            <strong>{selectedModelIds.length}</strong> selected
          </span>
          {selectedModelIds.length > 0 && (
            <Badge variant="secondary">
              Ready to benchmark
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}