interface StoredCredentials {
  apiKeys: {
    openrouter: string
    supabaseUrl: string
    supabaseKey: string
  }
  preferences: {
    autoSync: boolean
    defaultModelCount: number
    responseTimeout: number
    saveHistory: boolean
  }
}

export function getStoredCredentials(): StoredCredentials | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem('llm-benchmark-settings')
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error('Error parsing stored credentials:', error)
    return null
  }
}

export function getOpenRouterApiKey(): string | null {
  // First try environment variable (for production)
  if (process.env.OPENROUTER_API_KEY) {
    return process.env.OPENROUTER_API_KEY
  }
  
  // Fall back to localStorage (for development)
  const stored = getStoredCredentials()
  return stored?.apiKeys?.openrouter || null
}

export function getSupabaseCredentials(): { url: string | null; key: string | null } {
  // First try environment variables (for production)
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (envUrl && envKey) {
    return { url: envUrl, key: envKey }
  }
  
  // Fall back to localStorage (for development)
  const stored = getStoredCredentials()
  return {
    url: stored?.apiKeys?.supabaseUrl || envUrl || null,
    key: stored?.apiKeys?.supabaseKey || envKey || null
  }
}

export function createAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const stored = getStoredCredentials()
  const headers: Record<string, string> = { ...additionalHeaders }
  
  if (stored?.apiKeys?.openrouter) {
    headers['X-OpenRouter-API-Key'] = stored.apiKeys.openrouter
  }
  
  if (stored?.apiKeys?.supabaseUrl) {
    headers['X-Supabase-URL'] = stored.apiKeys.supabaseUrl
  }
  
  if (stored?.apiKeys?.supabaseKey) {
    headers['X-Supabase-Key'] = stored.apiKeys.supabaseKey
  }
  
  return headers
}