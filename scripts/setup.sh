#!/bin/bash

# LLM Consensus Benchmark - Next.js Setup Script
echo "🚀 Setting up LLM Consensus Benchmark (Next.js)"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -c 2-)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install missing development dependencies
echo "🔧 Installing additional dependencies..."
npm install --save-dev @types/node @types/react @types/react-dom

# Install missing runtime dependencies
echo "📦 Installing missing runtime dependencies..."
npm install tailwindcss-animate clsx tailwind-merge

# Install Radix UI components (optional but recommended)
echo "🎨 Installing UI component dependencies..."
npm install @radix-ui/react-slot @radix-ui/react-checkbox @radix-ui/react-select

# Copy environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local with your actual environment variables:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - OPENROUTER_API_KEY"
fi

# Run type check
echo "🔍 Running type check..."
npm run type-check

# Build the project to ensure everything works
echo "🏗️  Building the project..."
npm run build

echo ""
echo "🎉 Setup complete! Your Next.js LLM Consensus Benchmark is ready."
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your environment variables"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "📚 For more information, see README.md"