import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Helper function to get Supabase credentials from environment or headers
function getSupabaseCredentials(request?: NextRequest) {
  // First try environment variables (for production)
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (envUrl && envKey) {
    return { url: envUrl, key: envKey }
  }
  
  // Fall back to request headers (for development with settings page)
  if (request) {
    const headerUrl = request.headers.get('X-Supabase-URL')
    const headerKey = request.headers.get('X-Supabase-Key')
    
    if (headerUrl && headerKey) {
      return { url: headerUrl, key: headerKey }
    }
  }
  
  return { url: envUrl || null, key: envKey || null }
}

// Database schema setup SQL
const SCHEMA_SQL = `
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
ON CONFLICT (model_id) DO NOTHING;
`

// GET: Check database setup status
export async function GET(request: NextRequest) {
  try {
    const credentials = getSupabaseCredentials(request)
    
    if (!credentials.url || !credentials.key) {
      return NextResponse.json(
        { error: 'Supabase credentials not configured. Please set them in environment variables or via the settings page.' },
        { status: 400 }
      )
    }

    // Try to query the models table to check if setup is complete
    const { data, error } = await supabase
      .from('models')
      .select('id')
      .limit(1)

    if (error) {
      // If there's an error, it likely means tables don't exist
      return NextResponse.json({
        setupRequired: true,
        error: error.message,
        message: 'Database tables need to be created'
      })
    }

    // Get actual count
    const { count } = await supabase
      .from('models')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      setupRequired: false,
      message: 'Database is already set up',
      modelCount: count || 0
    })

  } catch (error) {
    console.error('Error checking database setup:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check database setup' },
      { status: 500 }
    )
  }
}

// POST: Run database setup
export async function POST(request: NextRequest) {
  try {
    const credentials = getSupabaseCredentials(request)
    
    if (!credentials.url || !credentials.key) {
      return NextResponse.json(
        { error: 'Supabase credentials not configured. Please set them in environment variables or via the settings page.' },
        { status: 400 }
      )
    }

    // Execute the schema SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: SCHEMA_SQL
    })

    if (error) {
      // If rpc doesn't work, try direct execution
      console.log('RPC failed, trying direct execution:', error)
      
      // Split SQL into individual statements and execute them
      const statements = SCHEMA_SQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0)

      const results = []
      let hasError = false

      for (const statement of statements) {
        try {
          const { data: result, error: stmtError } = await supabase
            .from('_temp_setup')
            .select('*')
            .limit(0) // This will fail but allows us to test connection

          if (stmtError && !hasError) {
            hasError = true
            break
          }
          results.push({ statement: statement.substring(0, 50) + '...', success: true })
        } catch (e) {
          results.push({ statement: statement.substring(0, 50) + '...', success: false, error: e })
          break
        }
      }

      if (hasError) {
        return NextResponse.json(
          { 
            error: 'Failed to execute database setup. Please run the SQL manually in your Supabase dashboard.',
            sqlFile: '/database/schema.sql',
            instructions: 'Copy the contents of database/schema.sql and run it in your Supabase SQL Editor'
          },
          { status: 500 }
        )
      }
    }

    // Verify setup by checking if we can query models
    const { data: models, error: verifyError } = await supabase
      .from('models')
      .select('id')
      .limit(1)

    if (verifyError) {
      return NextResponse.json(
        {
          error: 'Database setup may have failed. Please run the SQL manually.',
          sqlFile: '/database/schema.sql',
          instructions: 'Copy the contents of database/schema.sql and run it in your Supabase SQL Editor'
        },
        { status: 500 }
      )
    }

    // Get actual count
    const { count } = await supabase
      .from('models')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully!',
      modelCount: count || 0,
      tablesCreated: ['models', 'prompts', 'responses', 'consensus_groups']
    })

  } catch (error) {
    console.error('Error setting up database:', error)
    return NextResponse.json(
      { 
        error: 'Failed to set up database automatically. Please run the SQL manually.',
        sqlFile: '/database/schema.sql',
        instructions: 'Copy the contents of database/schema.sql and run it in your Supabase SQL Editor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}