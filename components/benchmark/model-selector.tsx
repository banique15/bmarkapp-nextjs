'use client'

import { useModelsStore } from '@/store/models-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

export function ModelSelector() {
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

  const filteredModels = getFilteredModels()
  const providers = getProviders()

  const handleModelToggle = async (modelId: string) => {
    const model = models.find(m => m.id === modelId)
    if (model) {
      await updateModelEnabled(modelId, !model.enabled)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Providers</option>
          {providers.map(provider => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'provider' | 'name' | 'context')}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="provider">Sort by Provider</option>
          <option value="name">Sort by Name</option>
          <option value="context">Sort by Context</option>
        </select>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={selectRecommendedModels}
        >
          Select Recommended
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={selectAllModels}
        >
          Select All Filtered
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={deselectAllModels}
        >
          Deselect All
        </Button>
        <div className="ml-auto">
          <Badge variant="secondary">
            {selectedModelIds.length} selected
          </Badge>
        </div>
      </div>

      {/* Models Grid */}
      {filteredModels.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No models match your search criteria.</p>
          <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {filteredModels.map((model) => (
            <Card
              key={model.id}
              className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                model.enabled
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:border-blue-300'
              }`}
              onClick={() => handleModelToggle(model.id)}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={model.enabled}
                  onChange={() => handleModelToggle(model.id)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {model.name}
                    </h3>
                    {['openai/gpt-4o', 'anthropic/claude-3-5-sonnet', 'google/gemini-pro-1.5'].includes(model.model_id) && (
                      <Badge variant="default" className="text-xs">★</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {model.provider}
                  </p>
                  {model.context_length && (
                    <p className="text-xs text-gray-400">
                      {model.context_length.toLocaleString()} tokens
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="text-sm text-gray-600 border-t pt-4">
        Showing {filteredModels.length} of {models.length} models •{' '}
        {selectedModelIds.length} selected
      </div>
    </div>
  )
}