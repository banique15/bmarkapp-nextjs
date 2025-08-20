'use client'

import { useEffect, useRef } from 'react'
import { ConsensusGroup } from '@/lib/consensus-analyzer'
import { BenchmarkResponse } from '@/store/benchmark-store'
import { useBenchmarkStore } from '@/store/benchmark-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPercentage } from '@/lib/utils'

interface ConsensusViewProps {
  groups: ConsensusGroup[]
  responses: BenchmarkResponse[]
}

export function ConsensusView({ groups, responses }: ConsensusViewProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<any>(null)
  const { exportResults } = useBenchmarkStore()

  // Chart.js integration
  useEffect(() => {
    if (!chartRef.current || groups.length === 0) return

    // Dynamic import of Chart.js to avoid SSR issues
    import('chart.js/auto').then((Chart) => {
      const ctx = chartRef.current?.getContext('2d')
      if (!ctx) return

      // Destroy existing chart
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }

      // Create new chart
      chartInstanceRef.current = new Chart.default(ctx, {
        type: 'doughnut',
        data: {
          labels: groups.map(group => group.groupName),
          datasets: [{
            data: groups.map(group => group.count),
            backgroundColor: groups.map(group => group.color),
            borderColor: groups.map(group => group.color + '80'),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  const label = context.label || ''
                  const value = context.raw as number
                  const total = groups.reduce((a, b) => a + b.count, 0)
                  const percentage = Math.round((value / total) * 100)
                  return `${label}: ${value} (${percentage}%)`
                }
              }
            }
          }
        }
      })
    })

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }
    }
  }, [groups])

  if (groups.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No consensus data available yet.</p>
        <p className="text-sm mt-1">Submit a prompt to see consensus analysis here.</p>
      </div>
    )
  }

  const totalResponses = responses.length
  const largestGroup = groups[0]
  const consensusLevel = largestGroup?.percentage || 0

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-xs text-gray-500">Total Models</p>
                <p className="text-lg font-semibold">{totalResponses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-xs text-gray-500">Consensus Level</p>
                <p className="text-lg font-semibold">{formatPercentage(consensusLevel)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div>
                <p className="text-xs text-gray-500">Unique Responses</p>
                <p className="text-lg font-semibold">{groups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <div>
                <p className="text-xs text-gray-500">Top Response</p>
                <p className="text-lg font-semibold truncate">
                  {largestGroup?.groupName || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Response Distribution</CardTitle>
            <CardDescription>
              Visual breakdown of consensus groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-64 md:h-80">
              <canvas ref={chartRef} className="w-full h-full"></canvas>
            </div>
          </CardContent>
        </Card>

        {/* Groups Legend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Response Groups</CardTitle>
                <CardDescription>
                  Detailed breakdown by response
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportResults}
              >
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {groups.map((group, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: group.color }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        "{group.groupName}"
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {group.models.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-3">
                    <Badge variant="secondary" className="text-xs">
                      {group.count}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatPercentage(group.percentage)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consensus Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Consensus Analysis</CardTitle>
          <CardDescription>
            Understanding the response patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {consensusLevel >= 80 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-1">Strong Consensus</h4>
                <p className="text-sm text-green-700">
                  {formatPercentage(consensusLevel)} of models agreed on "{largestGroup.groupName}". 
                  This indicates a high level of agreement across different AI systems.
                </p>
              </div>
            )}

            {consensusLevel >= 50 && consensusLevel < 80 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-1">Moderate Consensus</h4>
                <p className="text-sm text-yellow-700">
                  {formatPercentage(consensusLevel)} of models agreed on "{largestGroup.groupName}". 
                  There's some agreement, but also notable diversity in responses.
                </p>
              </div>
            )}

            {consensusLevel < 50 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-1">Low Consensus</h4>
                <p className="text-sm text-red-700">
                  Only {formatPercentage(consensusLevel)} of models agreed on the top response. 
                  This indicates high diversity and potential ambiguity in the prompt.
                </p>
              </div>
            )}

            {groups.length === 1 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-1">Perfect Agreement</h4>
                <p className="text-sm text-blue-700">
                  All models provided the same response: "{largestGroup.groupName}". 
                  This suggests the prompt has a clear, unambiguous answer.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}