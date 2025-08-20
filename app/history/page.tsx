import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HistoryPage() {
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

      <Suspense fallback={<HistorySkeleton />}>
        <HistoryContent />
      </Suspense>
    </div>
  )
}

function HistoryContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recent Benchmarks</CardTitle>
          <CardDescription>
            Your most recent prompt submissions and their consensus results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No benchmark history available yet.</p>
            <p className="text-sm mt-1">
              Start by running a benchmark from the main page.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trending Prompts</CardTitle>
          <CardDescription>
            Popular prompts and their typical consensus patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { prompt: "What is the capital of France?", consensus: 98, responses: 12 },
              { prompt: "What color is the sky?", consensus: 95, responses: 8 },
              { prompt: "What is 2+2?", consensus: 100, responses: 15 },
            ].map((item, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2 truncate">"{item.prompt}"</h3>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{item.consensus}% consensus</span>
                    <span>{item.responses} responses</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}