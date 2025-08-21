-- BMarkApp Database Schema
-- Run this in your Supabase SQL Editor to set up all required tables

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
    models TEXT[], -- Array of model names
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

-- Create policies for public access (adjust as needed for your security requirements)
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

-- Insert some example data (optional)
-- You can remove this section if you prefer to start with empty tables
INSERT INTO models (name, provider, model_id, enabled, context_length) VALUES
    ('GPT-4o', 'OpenAI', 'openai/gpt-4o', true, 128000),
    ('Claude 3.5 Sonnet', 'Anthropic', 'anthropic/claude-3-5-sonnet', true, 200000),
    ('Gemini Pro 1.5', 'Google', 'google/gemini-pro-1.5', true, 2000000)
ON CONFLICT (model_id) DO NOTHING;