'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createAuthHeaders, getStoredCredentials } from '@/lib/credentials'

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState({
    vercelAIGateway: '',
    supabaseUrl: '',
    supabaseKey: ''
  })
  
  const [preferences, setPreferences] = useState({
    autoSync: true,
    defaultModelCount: 5,
    responseTimeout: 30,
    saveHistory: true
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [message, setMessage] = useState('')
  
  // Load existing settings on component mount
  useEffect(() => {
    const stored = getStoredCredentials()
    if (stored) {
      // Handle migration from openrouter to vercelAIGateway
      const oldApiKeys = stored.apiKeys as any
      const migratedApiKeys = {
        vercelAIGateway: oldApiKeys.vercelAIGateway || oldApiKeys.openrouter || '',
        supabaseUrl: oldApiKeys.supabaseUrl || '',
        supabaseKey: oldApiKeys.supabaseKey || ''
      }
      setApiKeys(migratedApiKeys)
      setPreferences(stored.preferences)
    }
  }, [])

  const handleSaveApiKeys = async () => {
    setIsSaving(true)
    setMessage('')
    
    try {
      localStorage.setItem('llm-benchmark-settings', JSON.stringify({ apiKeys, preferences }))
      setMessage('Settings saved successfully!')
    } catch (error) {
      setMessage('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setMessage('')
    
    if (!apiKeys.vercelAIGateway) {
      setMessage('Please enter a Vercel AI Gateway API key to test the connection.')
      setIsTesting(false)
      return
    }
    
    try {
      // First save the settings temporarily
      localStorage.setItem('llm-benchmark-settings', JSON.stringify({ apiKeys, preferences }))
      
      // Create headers with the API key
      const headers = createAuthHeaders({
        'Content-Type': 'application/json'
      })
      
      // Test the connection by trying to sync models
      const response = await fetch('/api/models', {
        method: 'POST',
        headers
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessage(`✅ Connection successful! Synced ${data.models?.length || 0} models.`)
      } else {
        const errorData = await response.json()
        setMessage(`❌ Connection failed: ${errorData.error}`)
      }
    } catch (error) {
      setMessage(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Settings
        </h1>
        <p className="text-xl text-gray-600">
          Configure your API keys and application preferences
        </p>
      </div>

      <div className="space-y-8">
        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Set up your API keys for accessing external services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vercel AI Gateway API Key
                <Badge variant="destructive" className="ml-2">Required</Badge>
              </label>
              <Input
                type="password"
                placeholder="vag_..."
                value={apiKeys.vercelAIGateway}
                onChange={(e) => setApiKeys(prev => ({ ...prev, vercelAIGateway: e.target.value }))}
                className="font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from <a href="https://vercel.com/ai" className="text-blue-600 underline">Vercel AI Gateway</a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supabase Project URL
                <Badge variant="secondary" className="ml-2">Optional</Badge>
              </label>
              <Input
                type="url"
                placeholder="https://your-project.supabase.co"
                value={apiKeys.supabaseUrl}
                onChange={(e) => setApiKeys(prev => ({ ...prev, supabaseUrl: e.target.value }))}
                className="font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supabase Anon Key
                <Badge variant="secondary" className="ml-2">Optional</Badge>
              </label>
              <Input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={apiKeys.supabaseKey}
                onChange={(e) => setApiKeys(prev => ({ ...prev, supabaseKey: e.target.value }))}
                className="font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Required for saving benchmark history. Get from your <a href="https://supabase.com" className="text-blue-600 underline">Supabase project</a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Application Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Application Preferences</CardTitle>
            <CardDescription>
              Customize how the application behaves
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Model Count
                </label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={preferences.defaultModelCount}
                  onChange={(e) => setPreferences(prev => ({ 
                    ...prev, 
                    defaultModelCount: parseInt(e.target.value) || 5 
                  }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of models to select by default
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Timeout (seconds)
                </label>
                <Input
                  type="number"
                  min="10"
                  max="120"
                  value={preferences.responseTimeout}
                  onChange={(e) => setPreferences(prev => ({ 
                    ...prev, 
                    responseTimeout: parseInt(e.target.value) || 30 
                  }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum wait time for model responses
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Auto-sync Models</h4>
                  <p className="text-xs text-gray-500">
                    Automatically fetch latest models on app start
                  </p>
                </div>
                <Button
                  variant={preferences.autoSync ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreferences(prev => ({ ...prev, autoSync: !prev.autoSync }))}
                >
                  {preferences.autoSync ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Save History</h4>
                  <p className="text-xs text-gray-500">
                    Store benchmark results for future reference
                  </p>
                </div>
                <Button
                  variant={preferences.saveHistory ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreferences(prev => ({ ...prev, saveHistory: !prev.saveHistory }))}
                >
                  {preferences.saveHistory ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Manage your stored data and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="w-full">
                Export Data
              </Button>
              <Button variant="outline" className="w-full">
                Clear History
              </Button>
              <Button variant="destructive" className="w-full">
                Reset Settings
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Export your benchmark history or reset the application to default settings
            </p>
          </CardContent>
        </Card>

        {/* Save and Test Buttons */}
        <div className="flex items-center justify-between">
          <div>
            {message && (
              <p className={`text-sm ${message.includes('✅') || message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleTestConnection}
              disabled={isTesting || !apiKeys.vercelAIGateway}
              variant="outline"
              className="min-w-[140px]"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button
              onClick={handleSaveApiKeys}
              disabled={isSaving}
              className="min-w-[120px]"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>

        {/* Environment Variables Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="text-blue-600 mt-1">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1">
                  Environment Variables
                </h4>
                <p className="text-sm text-blue-700">
                  For production use, set these values as environment variables instead of storing them in the browser. 
                  Create a <code className="bg-blue-100 px-1 rounded">.env.local</code> file in your project root.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}