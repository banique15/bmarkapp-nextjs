# Deployment Guide - LLM Consensus Benchmark (Next.js)

This guide walks you through deploying your Next.js LLM Consensus Benchmark application to various platforms.

## 🚀 Quick Deploy to Vercel (Recommended)

Vercel provides the best experience for Next.js applications with zero configuration.

### Prerequisites
- GitHub/GitLab/Bitbucket account
- Vercel account (free)
- Environment variables ready

### Steps

1. **Push to Git Repository**
   ```bash
   git add .
   git commit -m "Initial Next.js migration"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   Add these in Vercel Dashboard → Settings → Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel automatically builds and deploys
   - Get your live URL (e.g., `your-app.vercel.app`)

### Vercel Configuration

The included `vercel.json` optimizes:
- **Function Timeouts**: Extended for LLM API calls
- **CORS Headers**: Proper API access
- **Environment Variables**: Secure configuration
- **Caching**: Optimized for performance

## 🔧 Other Deployment Options

### Netlify

1. **Build Settings**
   ```bash
   # Build command
   npm run build
   
   # Publish directory
   .next
   ```

2. **Environment Variables**
   - Add same variables as Vercel in Netlify Dashboard
   - Deploy settings → Environment variables

### Railway

1. **Deploy from GitHub**
   ```bash
   # Railway will auto-detect Next.js
   # Set environment variables in Railway dashboard
   ```

2. **Configuration**
   - Port: Railway auto-assigns
   - Build: Automatic Next.js detection
   - Environment: Add your variables

### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS deps
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production

   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY . .
   COPY --from=deps /app/node_modules ./node_modules
   RUN npm run build

   FROM node:18-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV production
   
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static

   EXPOSE 3000
   ENV PORT 3000

   CMD ["node", "server.js"]
   ```

2. **Build and Run**
   ```bash
   docker build -t llm-benchmark .
   docker run -p 3000:3000 llm-benchmark
   ```

## 🔐 Environment Variables

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenRouter API
OPENROUTER_API_KEY=sk-or-your-api-key

# Optional: App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Security Notes

- **Never commit** `.env.local` to git
- Use **environment-specific** variables for different stages
- **Rotate API keys** regularly
- Use **Vercel's secret storage** for sensitive data

## ⚡ Performance Optimization

### Build Optimization

The application includes several optimizations:

1. **Bundle Analysis**
   ```bash
   npm run build
   # Check build output for bundle sizes
   ```

2. **Image Optimization**
   - Next.js Image component used
   - Automatic WebP conversion
   - Responsive image loading

3. **Code Splitting**
   - Automatic route-based splitting
   - Dynamic imports for Chart.js
   - Lazy loading of components

### Monitoring

1. **Vercel Analytics** (Recommended)
   ```bash
   npm install @vercel/analytics
   ```
   
   Add to `app/layout.tsx`:
   ```typescript
   import { Analytics } from '@vercel/analytics/react'
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Analytics />
         </body>
       </html>
     )
   }
   ```

2. **Core Web Vitals**
   - Automatic monitoring in Vercel
   - Real User Monitoring (RUM)
   - Performance insights

## 🧪 Testing Deployment

### Pre-deployment Checklist

```bash
# 1. Build locally
npm run build
npm run start

# 2. Type check
npm run type-check

# 3. Lint check
npm run lint

# 4. Test critical paths
# - Model sync
# - Prompt submission
# - Consensus visualization
# - Export functionality
```

### Post-deployment Testing

1. **Functionality Tests**
   - [ ] Model sync from OpenRouter
   - [ ] Prompt submission works
   - [ ] Responses display correctly
   - [ ] Consensus visualization renders
   - [ ] Export CSV works
   - [ ] Error handling works

2. **Performance Tests**
   - [ ] Page load < 3 seconds
   - [ ] API responses < 30 seconds
   - [ ] Charts render smoothly
   - [ ] Mobile responsive

## 🔍 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check Node.js version
   node --version  # Should be 18+
   
   # Clear cache
   rm -rf .next node_modules
   npm install
   npm run build
   ```

2. **Environment Variable Issues**
   ```bash
   # Verify variables are set
   echo $NEXT_PUBLIC_SUPABASE_URL
   
   # Check in production
   # Use Vercel CLI: vercel env ls
   ```

3. **API Timeouts**
   ```bash
   # Check vercel.json function timeouts
   # Increase for slow LLM responses
   ```

4. **Database Connection**
   ```bash
   # Test Supabase connection
   # Check API keys and URLs
   # Verify database permissions
   ```

### Support

- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **OpenRouter**: [openrouter.ai/docs](https://openrouter.ai/docs)

## 📈 Scaling Considerations

### Production Optimizations

1. **Database Optimizations**
   - Index frequent queries
   - Implement connection pooling
   - Use read replicas if needed

2. **API Rate Limiting**
   - Implement rate limiting for OpenRouter
   - Add request queuing
   - Cache model lists

3. **CDN Configuration**
   - Vercel automatically provides CDN
   - Consider additional caching layers
   - Optimize static asset delivery

4. **Monitoring & Alerts**
   - Set up error tracking (Sentry)
   - Monitor API usage costs
   - Track user engagement metrics

Your Next.js LLM Consensus Benchmark is now ready for production deployment! 🎉