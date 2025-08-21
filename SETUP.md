# BMarkApp Setup Guide

A comprehensive guide to setting up your LLM Consensus Benchmarking application.

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd BMarkApp-NextJS
   npm install
   ```

2. **Set up Supabase Database** (Choose one method below)

3. **Configure API Keys** (via Settings page or environment variables)

4. **Start the Application**
   ```bash
   npm run dev
   ```

## Database Setup

### Option 1: Automatic Setup (Recommended)

1. Go to `/setup` in your application
2. Click "Run Automatic Setup"
3. The system will create all required tables automatically

### Option 2: Manual Setup

1. Copy the contents of [`database/schema.sql`](database/schema.sql)
2. Go to your [Supabase Dashboard](https://app.supabase.com)
3. Navigate to SQL Editor → New Query
4. Paste the SQL and click "Run"
5. Verify setup at `/setup` in your app

### Option 3: Step-by-Step Manual Setup

If you prefer to understand each step:

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Database Schema**
   ```sql
   -- Enable UUID extension
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

   -- Create all tables (see database/schema.sql for complete script)
   ```

3. **Configure Row Level Security**
   - The schema includes RLS policies for security
   - Modify policies as needed for your use case

## Environment Configuration

### Option 1: Environment Variables (Production)

Create `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Option 2: Settings Page (Development)

1. Go to `/settings` in your application
2. Enter your API keys:
   - **OpenRouter API Key**: Get from [openrouter.ai](https://openrouter.ai)
   - **Supabase URL**: From your Supabase project settings
   - **Supabase Anon Key**: From your Supabase project API settings
3. Click "Test Connection" to verify
4. Click "Save Settings"

## API Keys Required

### OpenRouter API Key (Required)
- Sign up at [openrouter.ai](https://openrouter.ai)
- Go to "API Keys" in your dashboard
- Create a new API key
- **Cost**: Pay-per-use, typically $0.001-$0.01 per benchmark

### Supabase (Required for data persistence)
- Sign up at [supabase.com](https://supabase.com)
- Create a new project (free tier available)
- Get your project URL and anon key from Settings → API

## Verification Steps

1. **Database Setup**: Visit `/setup` to check database status
2. **API Configuration**: Visit `/settings` to test connections
3. **Model Sync**: The app should sync available models automatically
4. **Run Benchmark**: Try a simple prompt like "What is 2+2?"

## Troubleshooting

### "Could not find column" Errors
- Your database schema is incomplete
- Run the setup process again
- Check the `/setup` page for status

### "OpenRouter API key not configured"
- Add your API key via Settings page or `.env.local`
- Verify the key is valid at [openrouter.ai](https://openrouter.ai)

### "Empty response from model" Errors
- Normal behavior - some models may not respond
- Try different models or prompts
- Check your OpenRouter account has credits

### Connection Issues
- Verify Supabase project is active
- Check API keys are correct
- Ensure RLS policies allow access

## Architecture

### Files Created
- `database/schema.sql` - Complete database schema
- `app/api/setup/route.ts` - Setup API endpoint
- `app/setup/page.tsx` - Setup UI page
- `lib/credentials.ts` - Credential management

### Database Tables
- `models` - Available LLM models
- `prompts` - Benchmark prompts submitted
- `responses` - Individual model responses
- `consensus_groups` - Response clustering results

### Security
- Row Level Security (RLS) enabled
- Public access policies (modify as needed)
- API keys stored securely (localStorage for dev, env vars for prod)

## Development vs Production

### Development
- Use Settings page for API keys
- Local Supabase project
- `npm run dev` for hot reloading

### Production
- Use environment variables for all secrets
- Production Supabase project
- Deploy to Vercel/Netlify with proper env vars

## Need Help?

1. Check the `/setup` page for database status
2. Review browser console for detailed errors
3. Verify all API keys are correctly configured
4. Ensure Supabase project is active and accessible

## Optional Enhancements

- **Custom Models**: Add more models in the database
- **Authentication**: Implement user-specific data
- **Analytics**: Track usage patterns
- **Export**: Add data export functionality