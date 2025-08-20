'use client'

import { useState } from 'react'
import { useBenchmarkStore, EXAMPLE_PROMPTS } from '@/store/benchmark-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PromptFormProps {
  onSubmit: () => void
  isProcessing: boolean
  disabled?: boolean
}

export function PromptForm({ onSubmit, isProcessing, disabled }: PromptFormProps) {
  const { 
    prompt, 
    setPrompt, 
    showExamples, 
    setShowExamples 
  } = useBenchmarkStore()
  
  const [localPrompt, setLocalPrompt] = useState(prompt)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!localPrompt.trim() || isProcessing || disabled) return
    
    setPrompt(localPrompt.trim())
    onSubmit()
  }

  const handleExampleClick = (examplePrompt: string) => {
    setLocalPrompt(examplePrompt)
    setPrompt(examplePrompt)
    setShowExamples(false)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          type="text"
          value={localPrompt}
          onChange={(e) => setLocalPrompt(e.target.value)}
          placeholder="e.g., What is the capital of France?"
          className="flex-1"
          disabled={isProcessing}
          maxLength={500}
        />
        <Button
          type="submit"
          disabled={!localPrompt.trim() || isProcessing || disabled}
          className="min-w-[100px]"
        >
          {isProcessing ? 'Processing...' : 'Submit'}
        </Button>
      </form>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowExamples(!showExamples)}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          {showExamples ? 'Hide' : 'Show'} example prompts
        </button>
        
        {localPrompt.length > 0 && (
          <span className="text-xs text-gray-500">
            {localPrompt.length}/500 characters
          </span>
        )}
      </div>

      {showExamples && (
        <div className="p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Example Prompts (click to use):
          </h3>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="text-sm bg-white px-3 py-2 rounded border border-gray-300 hover:bg-gray-100 hover:border-blue-300 transition-colors"
                disabled={isProcessing}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {disabled && (
        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-3">
          Please select at least one model before submitting a prompt.
        </div>
      )}
    </div>
  )
}