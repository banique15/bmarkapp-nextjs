'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createAuthHeaders } from '@/lib/credentials'

interface HistoryPrompt {
  id: string
  text: string
  created_at: string
  updated_at?: string
}

interface HistoryResponse {
  id: string
  prompt_id: string
  model_id: string
  response_text: string
  response_time_ms: number
  created_at: string
  model?: {
    id: string
    name: string
    provider: string
  }
}

interface ConsensusGroup {
  id: string
  prompt_id: string
  group_name: string
  count: number
  percentage?: number
  color: string
  models?: string[]
  created_at: string
}

export default function HistoryPage() {
  const [prompts, setPrompts] = useState<HistoryPrompt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const [promptDetails, setPromptDetails] = useState<{
    prompt: HistoryPrompt
    responses: HistoryResponse[]
    consensusGroups: ConsensusGroup[]
  } | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const headers = createAuthHeaders()
      const response = await fetch('/api/prompt', { headers })
      const data = await response.json()
      
      if (response.ok) {
        const allPrompts = data.prompts || []
        
        // Sort by creation date (most recent first) - show all benchmarks as created
        allPrompts.sort((a: HistoryPrompt, b: HistoryPrompt) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        
        setPrompts(allPrompts)
      } else {
        setError(data.error || 'Failed to load history')
      }
    } catch (err) {
      setError('Failed to load history')
      console.error('Error loading history:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPromptDetails = async (promptId: string) => {
    try {
      const headers = createAuthHeaders()
      const response = await fetch(`/api/prompt?id=${promptId}`, { headers })
      const data = await response.json()
      
      if (response.ok) {
        setPromptDetails(data)
        setSelectedPrompt(promptId)
      } else {
        setError(data.error || 'Failed to load prompt details')
      }
    } catch (err) {
      setError('Failed to load prompt details')
      console.error('Error loading prompt details:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (selectedPrompt && promptDetails) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Prompt Details
            </h1>
            <p className="text-xl text-gray-600">
              Results for: "{promptDetails.prompt.text}"
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setSelectedPrompt(null)}
          >
            ← Back to History
          </Button>
        </div>

        <div className="space-y-6">
          {/* Prompt Info */}
          <Card>
            <CardHeader>
              <CardTitle>Prompt Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700">Created</h4>
                  <p className="text-sm text-gray-600">{formatDate(promptDetails.prompt.created_at)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Total Responses</h4>
                  <p className="text-sm text-gray-600">{promptDetails.responses.length}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Consensus Groups</h4>
                  <p className="text-sm text-gray-600">{promptDetails.consensusGroups.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Responses */}
          <Card>
            <CardHeader>
              <CardTitle>Model Responses</CardTitle>
              <CardDescription>Individual responses from each model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {promptDetails.responses.map((response) => (
                  <div key={response.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">{response.model?.name || 'Unknown Model'}</span>
                        <Badge variant="secondary" className="ml-2">
                          {response.model?.provider || 'Unknown'}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {response.response_time_ms}ms
                      </span>
                    </div>
                    <p className="text-gray-700 bg-gray-50 p-2 rounded">
                      "{response.response_text}"
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Consensus Groups */}
          {promptDetails.consensusGroups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Consensus Groups</CardTitle>
                <CardDescription>Response patterns and agreement levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {promptDetails.consensusGroups.map((group) => (
                    <div key={group.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">"{group.group_name}"</span>
                        <div className="flex items-center space-x-2">
                          <Badge style={{ backgroundColor: group.color }}>
                            {group.count} models
                          </Badge>
                          {group.percentage && (
                            <Badge variant="outline">
                              {group.percentage.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Benchmark History
        </h1>
        <p className="text-xl text-gray-600">
          Review past consensus benchmark results and comparisons
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
            <Button 
              variant="outline" 
              onClick={loadHistory}
              className="mt-2"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Benchmarks</CardTitle>
                <CardDescription>
                  Your most recent prompt submissions and their consensus results
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={loadHistory}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : prompts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No benchmark history available yet.</p>
                <p className="text-sm mt-1">
                  Start by running a benchmark from the main page.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {prompts.map((prompt) => (
                  <Card 
                    key={prompt.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => loadPromptDetails(prompt.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium mb-1 truncate">
                            "{prompt.text}"
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(prompt.created_at)}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          View Details →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common benchmarking tasks and utilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start"
                onClick={() => window.location.href = '/'}
              >
                <span className="font-medium">New Benchmark</span>
                <span className="text-sm text-gray-600 mt-1">
                  Run a fresh consensus test
                </span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start"
                onClick={() => window.location.href = '/settings'}
              >
                <span className="font-medium">Settings</span>
                <span className="text-sm text-gray-600 mt-1">
                  Configure API keys and preferences
                </span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start"
                onClick={loadHistory}
                disabled={isLoading}
              >
                <span className="font-medium">Refresh History</span>
                <span className="text-sm text-gray-600 mt-1">
                  Reload recent benchmarks
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}