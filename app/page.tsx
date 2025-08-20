import { Suspense } from 'react'
import { BenchmarkClient } from '@/components/benchmark/benchmark-client'
import { ModelsProvider } from '@/components/models/models-provider'

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          LLM Consensus Benchmark
        </h1>
        <p className="text-xl text-gray-600">
          Compare single-word responses from multiple LLMs and visualize their consensus
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <ModelsProvider>
          <BenchmarkClient />
        </ModelsProvider>
      </Suspense>
    </div>
  )
}