'use client'

import { BenchmarkResponse } from '@/store/benchmark-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatTime } from '@/lib/utils'

interface ResponseGridProps {
  responses: BenchmarkResponse[]
}

export function ResponseGrid({ responses }: ResponseGridProps) {
  if (responses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No responses available yet.</p>
        <p className="text-sm mt-1">Submit a prompt to see model responses here.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {responses.map((response, index) => (
        <ResponseCard key={index} response={response} />
      ))}
    </div>
  )
}

interface ResponseCardProps {
  response: BenchmarkResponse
}

function ResponseCard({ response }: ResponseCardProps) {
  const hasError = !!response.error
  const borderColor = hasError ? 'border-red-300' : 'border-blue-300'
  const bgColor = hasError ? 'bg-red-50' : 'bg-blue-50'

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${borderColor} ${bgColor}`}>
      <CardContent className="p-4">
        {/* Model Info */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {response.model.name}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {response.model.provider}
            </p>
          </div>
          {!hasError && (
            <Badge variant="outline" className="ml-2 text-xs">
              {formatTime(response.response_time_ms)}
            </Badge>
          )}
        </div>

        {/* Response Content */}
        <div className="min-h-16 flex items-center justify-center p-4 mb-3 bg-white rounded border border-gray-100">
          {hasError ? (
            <div className="text-center">
              <div className="text-red-600 mb-1">
                <svg className="h-5 w-5 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-xs text-red-600 break-words">
                {response.error}
              </p>
            </div>
          ) : (
            <p className="text-xl font-medium text-center break-words">
              "{response.response_text}"
            </p>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-xs text-gray-500 text-right">
          {hasError ? (
            <span className="text-red-500">Failed</span>
          ) : (
            <>
              <span>Response time: {response.response_time_ms}ms</span>
              {response.usage && (
                <div className="mt-1">
                  <span>Tokens: {response.usage.total_tokens || 'N/A'}</span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export { ResponseCard }