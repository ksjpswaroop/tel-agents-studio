# Deep Research API Keys Setup

This document outlines the API keys required for the Deep Research functionality in TEL Cognitive Platform and how to configure them using Supabase edge functions.

## Overview

The Deep Research feature integrates with multiple AI and search providers to deliver comprehensive research capabilities. API keys are securely stored as Supabase edge function secrets rather than in the application environment.

## Required API Keys

### AI Providers

#### OpenAI (Required - Default Provider)
- **Key**: `OPENAI_API_KEY`
- **Description**: Primary AI provider for deep research
- **Models Used**: 
  - Thinking Model: `gpt-4o`
  - Task Model: `gpt-4o`
- **Where to Get**: [OpenAI API Keys](https://platform.openai.com/api-keys)
- **Pricing**: Pay-per-use based on tokens consumed

#### Anthropic (Optional)
- **Key**: `ANTHROPIC_API_KEY`
- **Description**: Alternative AI provider for Claude models
- **Models Supported**: `claude-3-5-sonnet`, `claude-3-haiku`
- **Where to Get**: [Anthropic Console](https://console.anthropic.com/)

#### Google Generative AI (Optional)
- **Key**: `GOOGLE_GENERATIVE_AI_API_KEY`
- **Description**: Google's Gemini models
- **Models Supported**: `gemini-1.5-pro`, `gemini-1.5-flash`
- **Where to Get**: [Google AI Studio](https://aistudio.google.com/app/apikey)

### Search Providers

#### Tavily (Required - Default Search Provider)
- **Key**: `TAVILY_API_KEY`
- **Description**: Primary search provider optimized for research
- **Features**: Real-time web search, research-focused results
- **Where to Get**: [Tavily API](https://tavily.com/)
- **Free Tier**: 1,000 searches/month

#### Exa (Optional)
- **Key**: `EXA_API_KEY`
- **Description**: Semantic search for high-quality content
- **Features**: AI-powered search, neural search capabilities
- **Where to Get**: [Exa](https://exa.ai/)

#### Firecrawl (Optional)
- **Key**: `FIRECRAWL_API_KEY`
- **Description**: Web scraping and data extraction
- **Features**: Clean content extraction, multiple formats
- **Where to Get**: [Firecrawl](https://firecrawl.dev/)

## Setup Instructions

### Prerequisites

1. **Supabase CLI installed**:
   ```bash
   npm install -g supabase
   ```

2. **Supabase project initialized**:
   ```bash
   supabase init
   ```

### Step 1: Run the Setup Script

Execute the provided setup script to configure all API keys:

```bash
chmod +x scripts/setup-supabase-secrets.sh
./scripts/setup-supabase-secrets.sh
```

### Step 2: Manual Configuration (Alternative)

If you prefer to set secrets manually:

```bash
# Set OpenAI API Key (Required)
echo "your-openai-api-key" | supabase secrets set OPENAI_API_KEY --stdin

# Set Tavily API Key (Required)
echo "your-tavily-api-key" | supabase secrets set TAVILY_API_KEY --stdin

# Set optional providers
echo "your-anthropic-key" | supabase secrets set ANTHROPIC_API_KEY --stdin
echo "your-google-key" | supabase secrets set GOOGLE_GENERATIVE_AI_API_KEY --stdin
echo "your-exa-key" | supabase secrets set EXA_API_KEY --stdin
echo "your-firecrawl-key" | supabase secrets set FIRECRAWL_API_KEY --stdin
```

### Step 3: Deploy Edge Function

Deploy the deep research edge function:

```bash
supabase functions deploy deep-research
```

### Step 4: Configure Application

Update your environment variables to include Supabase configuration:

```env
# Add to your .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Verification

### Test Edge Function

Test the edge function deployment:

```bash
supabase functions invoke deep-research --body '{
  "query": "test research query",
  "aiConfig": {
    "provider": "openai",
    "thinkingModel": "gpt-4o",
    "taskModel": "gpt-4o"
  },
  "searchConfig": {
    "searchProvider": "tavily",
    "maxResults": 5,
    "language": "en"
  },
  "workspaceId": "test-workspace",
  "sessionId": "test-session"
}'
```

### Check Secret Configuration

List configured secrets:

```bash
supabase secrets list
```

## Security Best Practices

### Key Management
- **Never commit API keys** to version control
- **Use separate keys** for development and production
- **Rotate keys regularly** according to provider recommendations
- **Monitor usage** to detect unusual activity

### Access Control
- **Restrict API key permissions** where possible
- **Set usage limits** on provider dashboards
- **Monitor costs** and set billing alerts
- **Use read-only keys** when available

### Edge Function Security
- API keys are stored as **Supabase secrets** (encrypted at rest)
- Keys are **never exposed** to client-side code
- **CORS restrictions** limit function access
- **Authentication required** for function calls

## Cost Management

### Monitoring Usage
1. **OpenAI Usage**: Monitor at [OpenAI Usage Dashboard](https://platform.openai.com/usage)
2. **Tavily Usage**: Check your Tavily dashboard
3. **Set Billing Alerts**: Configure alerts for all providers

### Optimization Tips
- **Adjust max results** in search configuration to control costs
- **Use smaller models** for task execution where appropriate
- **Cache results** to avoid duplicate searches
- **Monitor session duration** to prevent runaway processes

## Troubleshooting

### Common Issues

#### Edge Function Not Found
```bash
# Redeploy the function
supabase functions deploy deep-research
```

#### Authentication Errors
```bash
# Check if secrets are set correctly
supabase secrets list
```

#### API Key Invalid
- Verify key format and validity on provider dashboard
- Check for whitespace or special characters
- Ensure key has required permissions

#### Rate Limiting
- Check provider usage limits
- Implement exponential backoff in edge function
- Consider upgrading to higher tier plans

### Debug Mode

Enable debug logging in the edge function by checking the Supabase function logs:

```bash
supabase functions logs deep-research
```

## Environment-Specific Configuration

### Development
- Use **development/sandbox keys** where available
- Set **lower usage limits** to prevent accidental costs
- Enable **verbose logging** for debugging

### Production
- Use **production keys** with appropriate limits
- Configure **monitoring and alerting**
- Set up **cost controls** and budgets
- Enable **error tracking** and logging

## Support and Resources

### Provider Documentation
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Google AI API Documentation](https://ai.google.dev/)
- [Tavily API Documentation](https://docs.tavily.com/)

### Supabase Resources
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Managing Secrets](https://supabase.com/docs/guides/functions/secrets)
- [Function Logging](https://supabase.com/docs/guides/functions/logging)

### TEL Cognitive Platform
- Check the main README for general setup instructions
- Review environment configuration in `lib/env.ts`
- See API integration examples in `piren-deep-research/` directory