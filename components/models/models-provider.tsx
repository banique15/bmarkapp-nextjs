'use client'

import { useEffect } from 'react'
import { useModelsStore } from '@/store/models-store'

interface ModelsProviderProps {
  children: React.ReactNode
}

export function ModelsProvider({ children }: ModelsProviderProps) {
  const { models, syncModels } = useModelsStore()

  // Initialize models on mount
  useEffect(() => {
    if (models.length === 0) {
      syncModels()
    }
  }, [models.length, syncModels])

  return <>{children}</>
}