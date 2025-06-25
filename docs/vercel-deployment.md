# TEL Cognitive Platform - Vercel Deployment Guide

This guide explains how to deploy both the TEL Cognitive Platform and Piren Deep Research to Vercel as integrated services.

## Architecture Overview

The deployment consists of two Next.js applications:

1. **TEL Cognitive Platform** (`apps/sim`) - Main application
2. **Deep Research Service** (`apps/deep-research`) - AI research service

Both apps are deployed as separate Vercel projects but work together seamlessly.

## Prerequisites

1. **Vercel Account** with appropriate plan
2. **GitHub Repository** connected to Vercel
3. **Database** - Vercel Postgres (recommended) or external PostgreSQL
4. **API Keys** for AI and search providers

## Quick Start

### 1. **Connect Repository to Vercel**

1. Import your GitHub repository to Vercel
2. Vercel will detect the monorepo structure automatically
3. Create two projects:
   - `tel-cognitive-platform` (from `apps/sim`)
   - `tel-deep-research` (from `apps/deep-research`)

### 2. **Configure Environment Variables**

Copy `.env.vercel.template` to configure your environment:

```bash
cp .env.vercel.template .env.local
# Edit with your actual values
```

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - 32+ character secret
- `ENCRYPTION_KEY` - 32+ character key
- At least one AI provider API key (OpenAI, Anthropic, Google, etc.)
- At least one search provider API key (Tavily recommended)

### 3. **Set Up Database**

**Option A: Vercel Postgres (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Create Postgres database
vercel postgres create

# Get connection details and update environment variables
```

**Option B: External PostgreSQL**
- Use any PostgreSQL database with pgvector extension
- Update `DATABASE_URL` in environment variables

### 4. **Deploy Applications**

**Main Application:**
```bash
vercel --cwd apps/sim
```

**Deep Research Service:**
```bash
vercel --cwd apps/deep-research
```

### 5. **Configure Custom Domains (Optional)**

1. Set up custom domains in Vercel dashboard
2. Update `NEXT_PUBLIC_APP_URL` and `DEEP_RESEARCH_URL`
3. Redeploy both applications

## Configuration Details

### Project Structure

```
tel-agents-studio/
├── apps/
│   ├── sim/                 # Main TEL application
│   │   ├── vercel.json     # Main app Vercel config
│   │   └── ...
│   └── deep-research/       # Deep research service
│       ├── vercel.json     # Research service config
│       └── ...
├── vercel.json             # Root Vercel config
└── .env.vercel.template    # Environment template
```

### API Integration

The main app proxies research requests to the deep research service:

- **Research API**: `your-app.vercel.app/api/research/*` → Deep Research Service
- **Main App**: `your-app.vercel.app` → TEL Cognitive Platform

### Environment Variables

**Main Application (apps/sim):**
```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secret
ENCRYPTION_KEY=your-key
DEEP_RESEARCH_URL=https://your-deep-research.vercel.app
# OAuth, email, monitoring variables...
```

**Deep Research Service (apps/deep-research):**
```env
# AI Provider Keys
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key
GOOGLE_GENERATIVE_AI_API_KEY=your-key

# Search Provider Keys  
TAVILY_API_KEY=your-key
FIRECRAWL_API_KEY=your-key
```

### Build Configuration

Both apps use Turbo for optimized builds:

**Main App (`apps/sim/vercel.json`):**
```json
{
  "buildCommand": "cd ../.. && turbo run build --filter=sim",
  "installCommand": "bun install"
}
```

**Deep Research (`apps/deep-research/vercel.json`):**
```json
{
  "buildCommand": "cd ../.. && turbo run build --filter=deep-research", 
  "installCommand": "pnpm install"
}
```

## Production Setup

### 1. **Database Migration**

```bash
# Run migrations after database setup
cd apps/sim
bun run db:migrate
```

### 2. **Environment Variables in Vercel**

Set these in Vercel Dashboard → Project Settings → Environment Variables:

**For Both Projects:**
- `NODE_ENV` = `production`
- `NEXT_TELEMETRY_DISABLED` = `1`

**Main App Only:**
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `ENCRYPTION_KEY`
- `DEEP_RESEARCH_URL`
- OAuth credentials
- Email service keys

**Deep Research Only:**
- AI provider API keys
- Search provider API keys

### 3. **Custom Domains**

1. **Main App**: `platform.yourdomain.com`
2. **Deep Research**: `research.yourdomain.com`
3. Update environment variables accordingly

### 4. **Monitoring Setup**

Optional Sentry integration:
```env
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

## Development Workflow

### Local Development

```bash
# Install dependencies
bun install

# Start both services
turbo run dev

# Access applications
# Main app: http://localhost:3000
# Deep research: http://localhost:3001
```

### Preview Deployments

Vercel automatically creates preview deployments for:
- Pull requests
- Branch pushes

Both services get preview URLs that work together.

### Production Deployments

Deploy to production:
```bash
# Deploy main app
vercel --cwd apps/sim --prod

# Deploy deep research  
vercel --cwd apps/deep-research --prod
```

## Scaling Considerations

### Performance

**Function Timeouts:**
- Regular API routes: 300s (5 minutes)
- SSE endpoints: 900s (15 minutes)
- Research operations: Up to 15 minutes

**Memory Limits:**
- Vercel Pro: Up to 3GB per function
- Adjust based on AI model requirements

### Cost Optimization

1. **Use appropriate Vercel plan** based on usage
2. **Optimize function timeouts** for different endpoints
3. **Monitor bandwidth** for large research outputs
4. **Use Vercel Edge Functions** for lightweight operations

### High Availability

1. **Multiple regions** via Vercel Edge Network
2. **Database replicas** for read scaling
3. **CDN optimization** for static assets
4. **Error monitoring** with Sentry

## Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Check build logs in Vercel dashboard
# Ensure all dependencies are listed in package.json
# Verify Turbo configuration
```

**Environment Variable Issues:**
```bash
# Verify all required variables are set
# Check variable names match exactly
# Ensure no spaces in values
```

**API Proxy Errors:**
```bash
# Verify DEEP_RESEARCH_URL is correct
# Check network connectivity between services
# Review function timeout settings
```

**Database Connection:**
```bash
# Test connection string format
# Verify database exists and is accessible
# Check firewall/security group settings
```

### Debugging

**Function Logs:**
- View in Vercel Dashboard → Functions → Logs
- Use `console.log` for debugging
- Check Error reporting

**Performance Monitoring:**
```bash
# Enable Vercel Analytics
# Monitor function execution times
# Track API response times
```

## Security

### Best Practices

1. **Environment Variables**: Never commit secrets to repository
2. **API Keys**: Use separate keys for development/production
3. **CORS**: Configured automatically for cross-service communication
4. **Headers**: Security headers configured in `vercel.json`

### Access Control

1. **Authentication**: Better Auth integration
2. **Rate Limiting**: Configure in Vercel settings
3. **Domain Restrictions**: Use environment-specific URLs

## Backup & Recovery

### Database Backup

**Vercel Postgres:**
- Automatic daily backups
- Point-in-time recovery available
- Export via Vercel CLI

**External Database:**
- Follow provider backup procedures
- Test restore procedures regularly

### Application Backup

1. **Code**: Version controlled in GitHub
2. **Environment**: Document all environment variables
3. **Configuration**: Vercel settings exportable

## Support

### Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Turbo Monorepo Guide](https://turbo.build/repo/docs)

### Getting Help

1. **Check function logs** in Vercel dashboard
2. **Review environment variables** configuration
3. **Test locally** before deploying
4. **Monitor error rates** and performance metrics

## Migration from Other Platforms

### From Docker/VPS

1. **Export database** to PostgreSQL dump
2. **Set up Vercel Postgres** and import data
3. **Configure environment variables** in Vercel
4. **Update DNS** to point to Vercel URLs

### From Other Serverless Platforms

1. **Review function timeouts** and memory limits
2. **Adjust build configuration** for Vercel
3. **Test API integrations** thoroughly
4. **Monitor performance** after migration

---

## Quick Reference

### Deployment Commands
```bash
# Deploy preview
vercel

# Deploy production
vercel --prod

# View logs
vercel logs [deployment-url]

# Environment variables
vercel env add [name] [value]
```

### Important URLs
- **Main App**: `https://your-app.vercel.app`
- **Deep Research**: `https://your-deep-research.vercel.app`
- **API Proxy**: `https://your-app.vercel.app/api/research/*`

### Key Files
- `vercel.json` - Deployment configuration
- `.env.vercel.template` - Environment template
- `turbo.json` - Monorepo build configuration