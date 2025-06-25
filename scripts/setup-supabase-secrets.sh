#!/bin/bash

# Setup Supabase Edge Function Secrets for Deep Research
# This script sets up the required API keys as Supabase secrets

echo "🔧 Setting up Supabase Edge Function Secrets for Deep Research"
echo "============================================================"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project root. Please run this from the project root."
    exit 1
fi

echo "📋 This script will set up the following secrets:"
echo "  - OPENAI_API_KEY"
echo "  - TAVILY_API_KEY"
echo "  - EXA_API_KEY"
echo "  - FIRECRAWL_API_KEY"
echo "  - GOOGLE_GENERATIVE_AI_API_KEY"
echo "  - ANTHROPIC_API_KEY"
echo ""

# Function to securely read API key
read_api_key() {
    local service_name=$1
    echo -n "Enter $service_name API key (leave empty to skip): "
    read -s api_key
    echo ""
    echo "$api_key"
}

# Function to set Supabase secret
set_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if [ -n "$secret_value" ]; then
        echo "Setting $secret_name..."
        echo "$secret_value" | supabase secrets set $secret_name --stdin
        if [ $? -eq 0 ]; then
            echo "✅ $secret_name set successfully"
        else
            echo "❌ Failed to set $secret_name"
        fi
    else
        echo "⏭️  Skipping $secret_name (empty value)"
    fi
}

echo "🔑 Please provide your API keys:"
echo ""

# Read API keys
OPENAI_KEY=$(read_api_key "OpenAI")
TAVILY_KEY=$(read_api_key "Tavily")
EXA_KEY=$(read_api_key "Exa")
FIRECRAWL_KEY=$(read_api_key "Firecrawl")
GOOGLE_KEY=$(read_api_key "Google Generative AI")
ANTHROPIC_KEY=$(read_api_key "Anthropic")

echo ""
echo "🚀 Setting up secrets..."
echo ""

# Set the secrets
set_secret "OPENAI_API_KEY" "$OPENAI_KEY"
set_secret "TAVILY_API_KEY" "$TAVILY_KEY"
set_secret "EXA_API_KEY" "$EXA_KEY"
set_secret "FIRECRAWL_API_KEY" "$FIRECRAWL_KEY"
set_secret "GOOGLE_GENERATIVE_AI_API_KEY" "$GOOGLE_KEY"
set_secret "ANTHROPIC_API_KEY" "$ANTHROPIC_KEY"

echo ""
echo "✅ Supabase secrets setup completed!"
echo ""
echo "📝 Next steps:"
echo "1. Deploy the edge function: supabase functions deploy deep-research"
echo "2. Test the function: supabase functions invoke deep-research --body '{\"query\":\"test\"}'"
echo "3. Update your application to use the edge function endpoint"
echo ""
echo "🔗 Edge function will be available at:"
echo "https://your-project-ref.supabase.co/functions/v1/deep-research"