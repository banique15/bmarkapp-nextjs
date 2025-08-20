'use client'

import { useEffect } from 'react'
import { useModelsStore } from '@/store/models-store'
import { useBenchmarkStore } from '@/store/benchmark-store'
import { PromptForm } from './prompt-form'
import { ModelSelector } from './model-selector'
import { ResponseGrid } from './response-grid'
import { ConsensusView } from './consensus-view'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function BenchmarkClient() {
  const {
    models,
    selectedModelIds,
    isLoading: modelsLoading,
    error: modelsError,
    syncModels,
    getSelectedModels
  } = useModelsStore()

  const {
    prompt,
    isProcessing,
    responses,
    consensusGroups,
    insights,
    error: benchmarkError,
    selectedTab,
    setSelectedTab,
    clearResults,
    submitPrompt
  } = useBenchmarkStore()

  // Load models on mount
  useEffect(() => {
    if (models.length === 0) {
      syncModels()
    }
  }, [models.length, syncModels])

  const handleSubmit = async () => {
    if (selectedModelIds.length === 0) {
      return
    }
    await submitPrompt(selectedModelIds)
  }

  const selectedModels = getSelectedModels()
  const hasResults = responses.length > 0

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {(modelsError || benchmarkError) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="text-red-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-red-700 text-sm">
                {modelsError || benchmarkError}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prompt Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Enter a Prompt</CardTitle>
          <CardDescription>
            Enter a prompt that will elicit a single-word response from the LLMs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PromptForm 
            onSubmit={handleSubmit}
            isProcessing={isProcessing}
            disabled={selectedModelIds.length === 0}
          />
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Selected models:</span>
              <Badge variant="secondary">
                {selectedModelIds.length}
              </Badge>
            </div>
            {hasResults && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearResults}
                disabled={isProcessing}
              >
                Clear Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Model Selection Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Model Selection</CardTitle>
              <CardDescription>
                Choose which LLMs to include in your benchmark.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={syncModels}
              disabled={modelsLoading}
            >
              {modelsLoading ? 'Syncing...' : 'Sync Models'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ModelSelector />
        </CardContent>
      </Card>

      {/* Results Section */}
      {hasResults && (
        <>
          {/* Tab Navigation */}
          <div className="flex space-x-1 border-b">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'responses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setSelectedTab('responses')}
            >
              Responses ({responses.length})
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'consensus'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setSelectedTab('consensus')}
            >
              Consensus ({consensusGroups.length} groups)
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'insights'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setSelectedTab('insights')}
            >
              Insights ({insights.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {selectedTab === 'responses' && (
              <Card>
                <CardHeader>
                  <CardTitle>Model Responses</CardTitle>
                  <CardDescription>
                    Individual responses from each selected model
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponseGrid responses={responses} />
                </CardContent>
              </Card>
            )}

            {selectedTab === 'consensus' && (
              <Card>
                <CardHeader>
                  <CardTitle>Consensus Analysis</CardTitle>
                  <CardDescription>
                    Visualization of response patterns and consensus groups
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ConsensusView 
                    groups={consensusGroups}
                    responses={responses}
                  />
                </CardContent>
              </Card>
            )}

            {selectedTab === 'insights' && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Insights</CardTitle>
                  <CardDescription>
                    Automated analysis of the consensus patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.map((insight, index) => (
                      <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">{insight}</p>
                      </div>
                    ))}
                    {insights.length === 0 && (
                      <p className="text-gray-500 text-sm">No insights available yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Processing State */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div>
                <p className="text-lg font-medium">Processing your prompt...</p>
                <p className="text-sm text-gray-600">
                  Querying {selectedModelIds.length} models simultaneously
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}