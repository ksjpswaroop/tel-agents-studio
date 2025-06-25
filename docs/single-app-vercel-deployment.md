# TEL Cognitive Platform - Single App Vercel Deployment

This guide explains how to deploy the TEL Cognitive Platform with integrated Deep Research functionality as a single application on Vercel.

## Overview

The TEL Cognitive Platform now includes integrated Deep Research capabilities in a single Next.js application, providing:

- **Unified Codebase** - All features in one repository
- **Integrated UI** - Seamless navigation between platform and research features
- **Shared Resources** - Database, authentication, and components
- **Single Deployment** - One Vercel project instead of multiple services
- **Better Performance** - Direct function calls instead of HTTP requests between services

## Architecture

```
TEL Cognitive Platform (Single App)
├── Main Platform Features
│   ├── Workflows & Automation
│   ├── Knowledge Management  
│   ├── User Authentication
│   └── Database Integration
└── Deep Research Features
    ├── AI Provider Integration (/api/ai/*)
    ├── Search Provider Integration (/api/search/*)
    ├── Research UI Components
    ├── SSE Streaming (/api/sse/*)
    └── Research Workflows (/w/research/*)
```

## Quick Start

### 1. **Connect to Vercel**

1. Import your GitHub repository to Vercel
2. Vercel will detect this as a Next.js monorepo
3. Configure the build settings:
   - **Build Command**: `turbo run build --filter=sim`
   - **Output Directory**: `apps/sim/.next`
   - **Install Command**: `bun install`

### 2. **Environment Variables**

Copy and configure environment variables from `.env.single-app.template`:

```bash
cp .env.single-app.template .env.local
# Edit with your actual values
```

**Required Variables:**
```env
# Database
DATABASE_URL=postgresql://username:password@host:5432/database

# Authentication  
BETTER_AUTH_SECRET=your-secure-32-char-secret
ENCRYPTION_KEY=your-secure-32-char-key

# At least one AI provider
OPENAI_API_KEY=your-openai-key
# OR
ANTHROPIC_API_KEY=your-anthropic-key

# At least one search provider  
TAVILY_API_KEY=your-tavily-key
```

### 3. **Deploy**

```bash
# Using Vercel CLI
vercel

# Or push to your connected GitHub repository for automatic deployment
```

## Configuration Details

### Project Structure

```
apps/sim/                           # Main application
├── app/
│   ├── api/
│   │   ├── ai/                    # AI provider endpoints
│   │   ├── search/                # Search provider endpoints
│   │   ├── sse/                   # Research streaming
│   │   ├── mcp/                   # Model Context Protocol
│   │   └── ... (existing APIs)
│   ├── w/
│   │   ├── research/              # Research pages
│   │   └── ... (existing pages)
│   └── ...
├── components/
│   ├── research/                  # Research components
│   └── ... (existing components)
├── lib/
│   ├── research/                  # Research utilities
│   └── ... (existing utilities)
└── stores/
    ├── research/                  # Research state management
    └── ... (existing stores)
```

### Vercel Configuration

The root `vercel.json` configures:

- **Build Command**: Uses Turbo to build only the main app
- **Function Timeouts**: 5 minutes for APIs, 15 minutes for SSE
- **Streaming Support**: Special headers for Server-Sent Events
- **Caching**: Appropriate cache headers for different endpoints

### Database Setup

**Recommended: Vercel Postgres**
```bash
# Create database
vercel postgres create

# Get connection string
vercel env pull .env.local
```

**Alternative: External PostgreSQL**
- Ensure pgvector extension is available
- Update `DATABASE_URL` with your connection string

### AI and Search Providers

**Supported AI Providers:**
- OpenAI (GPT models)
- Anthropic (Claude models) 
- Google (Gemini models)
- DeepSeek, xAI, Mistral
- Azure OpenAI, OpenRouter
- Ollama (local deployment)

**Supported Search Providers:**
- Tavily (recommended)
- Firecrawl (web scraping)
- Exa (semantic search)
- SearXNG (self-hosted)
- Bocha

## Deployment Features

### Research Functionality

Access integrated research features at:
- **Research Dashboard**: `/w/research`
- **Individual Research**: `/w/research/[id]`
- **Research API**: `/api/ai/*`, `/api/search/*`, `/api/sse/*`

### Function Configuration

| Endpoint | Timeout | Purpose |
|----------|---------|---------|
| `/api/ai/**` | 5 minutes | AI provider requests |
| `/api/search/**` | 5 minutes | Search provider requests |
| `/api/sse/**` | 15 minutes | Streaming research sessions |
| `/api/mcp/**` | 5 minutes | Model Context Protocol |

### Streaming Support

Research sessions use Server-Sent Events (SSE) for real-time updates:
- Live research progress
- Streaming AI responses
- Task completion updates
- Source discovery notifications

## Development

### Local Development

```bash
# Install dependencies
bun install

# Start development server
turbo run dev --filter=sim

# Access application
# Main app: http://localhost:3000
# Research: http://localhost:3000/w/research
```

### Environment Setup

```bash
# Copy environment template
cp .env.single-app.template apps/sim/.env.local

# Configure database (development)
bun run db:push

# Run migrations
bun run db:migrate
```

## Production Considerations

### Performance

- **Cold Start Optimization**: Turbo build reduces bundle size
- **Function Limits**: 15-minute timeout for long research sessions
- **Memory Usage**: Optimized for Vercel's memory limits
- **Caching**: Strategic caching for static assets and API responses

### Security

- **Environment Variables**: All secrets properly configured
- **CORS**: Configured for research API endpoints
- **Rate Limiting**: Consider adding rate limiting for AI/search APIs
- **API Keys**: Separate keys for production vs development

### Monitoring

```env
# Optional: Sentry integration
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

### Scaling

- **Vercel Pro**: Required for production usage
- **Database**: Use connection pooling for high traffic
- **AI Providers**: Multiple API keys for higher rate limits
- **Caching**: Consider Redis for session data

## Troubleshooting

### Common Issues

**Build Failures:**
- Ensure all dependencies are in `package.json`
- Check Turbo configuration in `turbo.json`
- Verify build command targets correct app

**API Timeouts:**
- Research sessions may need full 15-minute timeout
- Check function configuration in `vercel.json`
- Monitor function execution logs

**Environment Variables:**
- Verify all required variables are set in Vercel dashboard
- Check variable names match exactly
- Ensure no spaces in values

**Import Errors:**
- Update import paths for moved research components
- Check path aliases in `tsconfig.json`
- Verify all research utilities are properly copied

### Debug Commands

```bash
# Check build locally
turbo run build --filter=sim

# Test specific API endpoints
curl http://localhost:3000/api/ai/openai/models

# Check environment variables
vercel env ls
```

## Migration from Multi-App Setup

If migrating from the previous two-app setup:

1. **Remove old projects** from Vercel dashboard
2. **Update DNS** to point to single app
3. **Migrate data** if using separate databases
4. **Update API calls** that referenced separate deep-research URL

## Support

- **Documentation**: Check component documentation in `/components/research/`
- **API Reference**: Explore `/api/` endpoints for integration
- **Environment**: Use `.env.single-app.template` as reference
- **Issues**: Monitor Vercel function logs for debugging

## Benefits Summary

✅ **Simplified Deployment** - One project instead of two
✅ **Better Integration** - Shared authentication and database
✅ **Improved Performance** - No network latency between services  
✅ **Easier Development** - Single dev environment
✅ **Cost Effective** - Single Vercel project pricing
✅ **Unified UI** - Seamless user experience
✅ **Shared Components** - Reusable UI elements
✅ **Single Domain** - No CORS issues or complex routing

The integrated approach provides a much cleaner and more maintainable solution while preserving all the powerful deep research capabilities.