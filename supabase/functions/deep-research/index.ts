// Import required modules for Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Import types
interface DeepResearchRequest {
  query: string
  aiConfig: {
    provider: string
    thinkingModel: string
    taskModel: string
  }
  searchConfig: {
    searchProvider: string
    maxResults: number
    language: string
  }
  workspaceId: string
  sessionId: string
}

interface DeepResearchOptions {
  AIProvider: {
    apiKey: string
    provider: string
    thinkingModel: string
    taskModel: string
  }
  searchProvider: {
    apiKey: string
    provider: string
    maxResult: number
  }
  language: string
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get secrets from environment (configured via Supabase secrets)
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY')
    const EXA_API_KEY = Deno.env.get('EXA_API_KEY')
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')
    const GOOGLE_GENERATIVE_AI_API_KEY = Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY')
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

    if (!OPENAI_API_KEY || !TAVILY_API_KEY) {
      throw new Error('Required API keys not configured in Supabase secrets')
    }

    // Parse request body
    const { query, aiConfig, searchConfig, workspaceId, sessionId }: DeepResearchRequest = await req.json()

    if (!query || !workspaceId || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: query, workspaceId, sessionId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build Deep Research options using environment API keys
    const deepResearchOptions: DeepResearchOptions = {
      AIProvider: {
        apiKey: aiConfig.provider === 'openai' ? OPENAI_API_KEY :
                aiConfig.provider === 'anthropic' ? ANTHROPIC_API_KEY :
                aiConfig.provider === 'google' ? GOOGLE_GENERATIVE_AI_API_KEY :
                OPENAI_API_KEY, // Default to OpenAI
        provider: aiConfig.provider || 'openai',
        thinkingModel: aiConfig.thinkingModel || 'gpt-4o',
        taskModel: aiConfig.taskModel || 'gpt-4o',
      },
      searchProvider: {
        apiKey: searchConfig.searchProvider === 'tavily' ? TAVILY_API_KEY :
                searchConfig.searchProvider === 'exa' ? EXA_API_KEY :
                searchConfig.searchProvider === 'firecrawl' ? FIRECRAWL_API_KEY :
                TAVILY_API_KEY, // Default to Tavily
        provider: searchConfig.searchProvider || 'tavily',
        maxResult: searchConfig.maxResults || 10,
      },
      language: searchConfig.language || 'en',
    }

    // Create readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Send initial message
        const encoder = new TextEncoder()
        
        // Helper function to send SSE data
        const sendSSE = (event: string, data: any) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(message))
        }

        // Start the deep research process
        performDeepResearch(query, deepResearchOptions, sendSSE)
          .then(() => {
            sendSSE('done', { message: 'Research completed' })
            controller.close()
          })
          .catch((error) => {
            sendSSE('error', { message: error.message })
            controller.close()
          })
      }
    })

    // Return SSE response
    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Deep Research Edge Function Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Deep Research implementation
async function performDeepResearch(
  query: string, 
  options: DeepResearchOptions, 
  sendSSE: (event: string, data: any) => void
) {
  try {
    // Step 1: Initialize research
    sendSSE('progress', { step: 'initialization', status: 'start' })
    sendSSE('message', { type: 'text', text: '🔍 Starting deep research...\n\n' })

    // Step 2: Generate research plan
    sendSSE('progress', { step: 'planning', status: 'start' })
    sendSSE('message', { type: 'text', text: '📋 Creating research plan...\n\n' })
    
    const researchPlan = await generateResearchPlan(query, options)
    sendSSE('progress', { step: 'planning', status: 'end', data: researchPlan })

    // Step 3: Generate search queries
    sendSSE('progress', { step: 'query-generation', status: 'start' })
    const searchQueries = await generateSearchQueries(researchPlan, options)
    sendSSE('progress', { step: 'query-generation', status: 'end', data: searchQueries })

    // Step 4: Execute searches
    sendSSE('progress', { step: 'searching', status: 'start' })
    const searchResults = await executeSearches(searchQueries, options, sendSSE)
    sendSSE('progress', { step: 'searching', status: 'end', data: searchResults })

    // Step 5: Generate final report
    sendSSE('progress', { step: 'writing', status: 'start' })
    const finalReport = await generateFinalReport(query, researchPlan, searchResults, options, sendSSE)
    sendSSE('progress', { step: 'writing', status: 'end', data: finalReport })

    sendSSE('progress', { step: 'completed', status: 'end' })

  } catch (error) {
    console.error('Error in performDeepResearch:', error)
    sendSSE('error', { message: error.message })
  }
}

// Generate research plan using AI
async function generateResearchPlan(query: string, options: DeepResearchOptions): Promise<string> {
  const prompt = `You are a research assistant. Create a comprehensive research plan for the following query:

Query: ${query}

Create a structured research plan that outlines:
1. Key topics to investigate
2. Specific questions to answer
3. Types of sources to search for
4. Expected outcomes

Respond in markdown format.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.AIProvider.apiKey}`,
      },
      body: JSON.stringify({
        model: options.AIProvider.thinkingModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('Error generating research plan:', error)
    return `# Research Plan for: ${query}\n\nThis research will explore the key aspects of the query to provide comprehensive insights.`
  }
}

// Generate search queries
async function generateSearchQueries(researchPlan: string, options: DeepResearchOptions): Promise<string[]> {
  const prompt = `Based on this research plan, generate 3-5 specific search queries that will help gather comprehensive information:

Research Plan:
${researchPlan}

Generate search queries that are:
- Specific and targeted
- Diverse in scope
- Likely to return high-quality results

Return only the search queries, one per line.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.AIProvider.apiKey}`,
      },
      body: JSON.stringify({
        model: options.AIProvider.taskModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.5,
      }),
    })

    const data = await response.json()
    const queries = data.choices[0].message.content.split('\n').filter((q: string) => q.trim().length > 0)
    return queries.slice(0, 5) // Limit to 5 queries
  } catch (error) {
    console.error('Error generating search queries:', error)
    return [`research ${options.language === 'en' ? 'about' : 'sur'} ${researchPlan.split('\n')[0]}`]
  }
}

// Execute searches using Tavily API
async function executeSearches(
  queries: string[], 
  options: DeepResearchOptions, 
  sendSSE: (event: string, data: any) => void
): Promise<any[]> {
  const results = []

  for (const query of queries) {
    sendSSE('message', { type: 'text', text: `🔍 Searching: ${query}\n` })
    
    try {
      const searchResult = await searchWithTavily(query, options)
      results.push({ query, result: searchResult })
      
      sendSSE('message', { 
        type: 'text', 
        text: `✅ Found ${searchResult.results?.length || 0} results\n\n` 
      })
    } catch (error) {
      console.error(`Error searching for "${query}":`, error)
      results.push({ query, result: { error: error.message } })
    }
  }

  return results
}

// Search using Tavily API
async function searchWithTavily(query: string, options: DeepResearchOptions) {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.searchProvider.apiKey}`,
      },
      body: JSON.stringify({
        query,
        search_depth: 'advanced',
        max_results: options.searchProvider.maxResult,
        include_answer: true,
        include_raw_content: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Tavily search error:', error)
    throw error
  }
}

// Generate final report
async function generateFinalReport(
  originalQuery: string,
  researchPlan: string,
  searchResults: any[],
  options: DeepResearchOptions,
  sendSSE: (event: string, data: any) => void
): Promise<string> {
  sendSSE('message', { type: 'text', text: '📝 Generating comprehensive report...\n\n' })

  const searchContent = searchResults.map(sr => {
    if (sr.result.error) return `Query: ${sr.query}\nError: ${sr.result.error}`
    return `Query: ${sr.query}\nResults: ${JSON.stringify(sr.result, null, 2)}`
  }).join('\n\n---\n\n')

  const prompt = `Create a comprehensive research report based on the following information:

Original Query: ${originalQuery}

Research Plan:
${researchPlan}

Search Results:
${searchContent}

Please write a detailed, well-structured report that:
1. Answers the original query comprehensively
2. Synthesizes information from multiple sources
3. Provides key insights and findings
4. Includes relevant citations and references
5. Is formatted in clear markdown

The report should be professional, informative, and actionable.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.AIProvider.apiKey}`,
      },
      body: JSON.stringify({
        model: options.AIProvider.thinkingModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    })

    const data = await response.json()
    const report = data.choices[0].message.content

    sendSSE('message', { type: 'text', text: report })
    return report
  } catch (error) {
    console.error('Error generating final report:', error)
    const fallbackReport = `# Research Report: ${originalQuery}\n\nBased on the research conducted, here are the key findings...\n\n*Full report generation encountered an error: ${error.message}*`
    sendSSE('message', { type: 'text', text: fallbackReport })
    return fallbackReport
  }
}

console.log("Deep Research Edge Function loaded")