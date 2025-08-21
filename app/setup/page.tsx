'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createAuthHeaders } from '@/lib/credentials'

interface SetupStatus {
  setupRequired: boolean
  message: string
  modelCount?: number
  error?: string
}

export default function SetupPage() {
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [setupResult, setSetupResult] = useState<any>(null)

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    setIsChecking(true)
    try {
      const headers = createAuthHeaders()
      const response = await fetch('/api/setup', { headers })
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      setStatus({
        setupRequired: true,
        message: 'Failed to check database status',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsChecking(false)
    }
  }

  const runSetup = async () => {
    setIsSettingUp(true)
    setSetupResult(null)
    try {
      const headers = createAuthHeaders({ 'Content-Type': 'application/json' })
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers
      })
      const data = await response.json()
      setSetupResult(data)
      
      // Refresh status after setup
      if (data.success) {
        await checkSetupStatus()
      }
    } catch (error) {
      setSetupResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      })
    } finally {
      setIsSettingUp(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const schemaSQL = `-- BMarkApp Database Schema
-- Copy and paste this into your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Models table
CREATE TABLE IF NOT EXISTS models (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    model_id VARCHAR(255) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT true,
    context_length INTEGER DEFAULT 4096,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompts table
CREATE TABLE IF NOT EXISTS prompts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Responses table
CREATE TABLE IF NOT EXISTS responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
    model_id UUID REFERENCES models(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    response_time_ms INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consensus groups table
CREATE TABLE IF NOT EXISTS consensus_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    count INTEGER NOT NULL,
    percentage DECIMAL(5,2),
    color VARCHAR(7) NOT NULL,
    models TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_models_model_id ON models(model_id);
CREATE INDEX IF NOT EXISTS idx_models_enabled ON models(enabled);
CREATE INDEX IF NOT EXISTS idx_responses_prompt_id ON responses(prompt_id);
CREATE INDEX IF NOT EXISTS idx_responses_model_id ON responses(model_id);
CREATE INDEX IF NOT EXISTS idx_consensus_groups_prompt_id ON consensus_groups(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE consensus_groups ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Enable read access for all users" ON models FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON models FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON models FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON models FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON prompts FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON prompts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON prompts FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON prompts FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON responses FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON responses FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON responses FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON consensus_groups FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON consensus_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON consensus_groups FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON consensus_groups FOR DELETE USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON prompts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some example data
INSERT INTO models (name, provider, model_id, enabled, context_length) VALUES
    ('GPT-4o', 'OpenAI', 'openai/gpt-4o', true, 128000),
    ('Claude 3.5 Sonnet', 'Anthropic', 'anthropic/claude-3-5-sonnet', true, 200000),
    ('Gemini Pro 1.5', 'Google', 'google/gemini-pro-1.5', true, 2000000)
ON CONFLICT (model_id) DO NOTHING;`

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Database Setup
        </h1>
        <p className="text-xl text-gray-600">
          Set up your Supabase database for BMarkApp
        </p>
      </div>

      <div className="space-y-6">
        {/* Status Check */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Database Status</CardTitle>
                <CardDescription>Check if your database is properly configured</CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={checkSetupStatus}
                disabled={isChecking}
              >
                {isChecking ? 'Checking...' : 'Check Status'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {status ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Badge variant={status.setupRequired ? "destructive" : "default"}>
                    {status.setupRequired ? "Setup Required" : "Ready"}
                  </Badge>
                  {status.modelCount !== undefined && (
                    <Badge variant="secondary">
                      {status.modelCount} models
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{status.message}</p>
                {status.error && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    Error: {status.error}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Click "Check Status" to verify your database setup</p>
            )}
          </CardContent>
        </Card>

        {/* Automatic Setup */}
        <Card>
          <CardHeader>
            <CardTitle>Option 1: Automatic Setup</CardTitle>
            <CardDescription>Try to set up the database automatically</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              This will attempt to create all required tables and policies automatically.
            </p>
            
            <Button 
              onClick={runSetup}
              disabled={isSettingUp || (!status?.setupRequired)}
              className="w-full"
            >
              {isSettingUp ? 'Setting up...' : 'Run Automatic Setup'}
            </Button>

            {setupResult && (
              <div className="mt-4 p-4 rounded-lg border">
                {setupResult.success ? (
                  <div className="text-green-700 bg-green-50 p-3 rounded">
                    <p className="font-medium">✅ {setupResult.message}</p>
                    {setupResult.tablesCreated && (
                      <p className="text-sm mt-2">
                        Created tables: {setupResult.tablesCreated.join(', ')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-red-700 bg-red-50 p-3 rounded">
                    <p className="font-medium">❌ Setup Failed</p>
                    <p className="text-sm mt-2">{setupResult.error}</p>
                    {setupResult.instructions && (
                      <p className="text-sm mt-2">{setupResult.instructions}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Setup */}
        <Card>
          <CardHeader>
            <CardTitle>Option 2: Manual Setup</CardTitle>
            <CardDescription>Copy and run the SQL manually in your Supabase dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Steps:</h4>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                <li>Go to your <a href="https://app.supabase.com" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Supabase Dashboard</a></li>
                <li>Select your project</li>
                <li>Go to "SQL Editor" in the left sidebar</li>
                <li>Click "New Query"</li>
                <li>Copy the SQL below and paste it into the editor</li>
                <li>Click "Run" to execute the query</li>
                <li>Come back and click "Check Status" to verify</li>
              </ol>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Database Schema SQL:</h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(schemaSQL)}
                >
                  Copy SQL
                </Button>
              </div>
              <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                {schemaSQL}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>After setting up your database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start"
                onClick={() => window.location.href = '/settings'}
              >
                <span className="font-medium">Configure Settings</span>
                <span className="text-sm text-gray-600 mt-1">
                  Set up your OpenRouter API key
                </span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start"
                onClick={() => window.location.href = '/'}
              >
                <span className="font-medium">Start Benchmarking</span>
                <span className="text-sm text-gray-600 mt-1">
                  Run your first consensus test
                </span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start"
                onClick={checkSetupStatus}
              >
                <span className="font-medium">Verify Setup</span>
                <span className="text-sm text-gray-600 mt-1">
                  Check database status again
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}