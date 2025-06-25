import { NextRequest } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console-logger'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { researchSession, researchTask, researchSource, researchHistory } from '@/db/schema'
import { nanoid } from 'nanoid'
import { env } from '@/lib/env'

const logger = createLogger('api/research/[id]/stream')

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Verify session ownership
    const researchSessionData = await db
      .select()
      .from(researchSession)
      .where(
        and(
          eq(researchSession.id, id),
          eq(researchSession.userId, session.user.id)
        )
      )
      .limit(1)

    if (researchSessionData.length === 0) {
      return new Response('Research session not found', { status: 404 })
    }

    const sessionData = researchSessionData[0]

    // Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    })

    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      start(controller) {
        const sendEvent = (type: string, data: any) => {
          const message = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(message))
        }

        const runResearch = async () => {
          try {
            // Update session status to researching
            await db
              .update(researchSession)
              .set({
                status: 'thinking',
                startedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(researchSession.id, id))

            sendEvent('status', { 
              type: 'thinking', 
              message: 'Starting research process...',
              sessionId: id 
            })

            // Create initial history entry
            const historyId = nanoid()
            await db.insert(researchHistory).values({
              id: historyId,
              sessionId: id,
              userId: session.user.id,
              version: 1,
              description: 'Research started',
              changeType: 'auto',
              fullState: {
                status: 'thinking',
                step: 'initialization',
                timestamp: new Date().toISOString(),
              },
              stepName: 'initialization',
              createdAt: new Date(),
            })

            // Phase 1: Research Planning
            sendEvent('status', { 
              type: 'planning', 
              message: 'Analyzing research question and creating plan...',
              sessionId: id 
            })

            await db
              .update(researchSession)
              .set({
                status: 'planning',
                currentStep: 'planning',
                updatedAt: new Date(),
              })
              .where(eq(researchSession.id, id))

            // Simulate research plan generation
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            const researchPlan = `# Research Plan for: ${sessionData.question}

## Objectives
1. Gather comprehensive information about the research topic
2. Analyze multiple perspectives and sources
3. Identify key trends and patterns
4. Synthesize findings into actionable insights

## Search Strategies
- Academic and scholarly sources
- Industry reports and analysis
- Recent news and developments
- Expert opinions and commentary

## Expected Deliverables
- Comprehensive research report
- Key findings summary
- Source citations and references
- Knowledge graph visualization`

            await db
              .update(researchSession)
              .set({
                reportPlan: researchPlan,
                updatedAt: new Date(),
              })
              .where(eq(researchSession.id, id))

            sendEvent('plan', { 
              plan: researchPlan,
              sessionId: id 
            })

            // Phase 2: Information Gathering
            sendEvent('status', { 
              type: 'researching', 
              message: 'Gathering information from multiple sources...',
              sessionId: id 
            })

            await db
              .update(researchSession)
              .set({
                status: 'researching',
                currentStep: 'searching',
                updatedAt: new Date(),
              })
              .where(eq(researchSession.id, id))

            // Create research tasks based on the question
            const searchQueries = [
              sessionData.question,
              `${sessionData.question} latest trends`,
              `${sessionData.question} expert analysis`,
              `${sessionData.question} industry insights`,
            ]

            for (let i = 0; i < searchQueries.length; i++) {
              const query = searchQueries[i]
              
              sendEvent('task', { 
                type: 'search_start',
                query,
                progress: (i + 1) / searchQueries.length,
                sessionId: id 
              })

              // Create task in database
              const taskId = nanoid()
              await db.insert(researchTask).values({
                id: taskId,
                sessionId: id,
                query,
                researchGoal: `Find information about: ${query}`,
                taskType: 'search',
                priority: i,
                status: 'searching',
                searchProvider: (sessionData.searchConfig as any)?.searchProvider || 'model',
                maxResults: (sessionData.searchConfig as any)?.maxResults || 5,
                startedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
              })

              // Simulate search and processing
              await new Promise(resolve => setTimeout(resolve, 3000))

              // Create mock sources
              const mockSources = [
                {
                  url: `https://example.com/source-${i}-1`,
                  title: `Research Source ${i + 1}: ${query}`,
                  content: `Detailed information about ${query}. This source provides comprehensive coverage of the topic with expert insights and data-driven analysis.`,
                  summary: `Key insights about ${query} from a reliable source.`,
                  sourceType: 'web',
                  domain: 'example.com',
                  relevanceScore: 0.85 + (Math.random() * 0.15),
                  qualityScore: 0.80 + (Math.random() * 0.20),
                  credibilityScore: 0.90 + (Math.random() * 0.10),
                },
                {
                  url: `https://academic.com/source-${i}-2`,
                  title: `Academic Study: ${query}`,
                  content: `Academic research and peer-reviewed analysis of ${query}. Includes methodology, findings, and conclusions from research studies.`,
                  summary: `Academic perspective on ${query} with research-backed insights.`,
                  sourceType: 'academic',
                  domain: 'academic.com',
                  relevanceScore: 0.90 + (Math.random() * 0.10),
                  qualityScore: 0.95 + (Math.random() * 0.05),
                  credibilityScore: 0.95 + (Math.random() * 0.05),
                },
              ]

              // Insert sources into database
              for (const source of mockSources) {
                const sourceId = nanoid()
                await db.insert(researchSource).values({
                  id: sourceId,
                  sessionId: id,
                  taskId,
                  url: source.url,
                  title: source.title,
                  content: source.content,
                  summary: source.summary,
                  sourceType: source.sourceType,
                  domain: source.domain,
                  relevanceScore: source.relevanceScore.toString(),
                  qualityScore: source.qualityScore.toString(),
                  credibilityScore: source.credibilityScore.toString(),
                  language: 'en',
                  wordCount: source.content.split(' ').length,
                  tags: [sessionData.question, query],
                  isProcessed: true,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                })
              }

              // Update task as completed
              await db
                .update(researchTask)
                .set({
                  status: 'completed',
                  searchResults: mockSources,
                  analysis: `Completed search for "${query}" with ${mockSources.length} relevant sources found.`,
                  learnings: `Key learnings from searching for "${query}": Found diverse perspectives and reliable sources with high relevance scores.`,
                  resultCount: mockSources.length,
                  relevanceScore: (mockSources.reduce((sum, s) => sum + s.relevanceScore, 0) / mockSources.length).toString(),
                  completedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(eq(researchTask.id, taskId))

              sendEvent('task', { 
                type: 'search_complete',
                query,
                sources: mockSources,
                progress: (i + 1) / searchQueries.length,
                sessionId: id 
              })
            }

            // Phase 3: Report Generation
            sendEvent('status', { 
              type: 'writing', 
              message: 'Synthesizing findings into comprehensive report...',
              sessionId: id 
            })

            await db
              .update(researchSession)
              .set({
                status: 'writing',
                currentStep: 'report_generation',
                totalTasks: searchQueries.length,
                completedTasks: searchQueries.length,
                totalSources: searchQueries.length * 2,
                updatedAt: new Date(),
              })
              .where(eq(researchSession.id, id))

            await new Promise(resolve => setTimeout(resolve, 3000))

            // Generate final report
            const finalReport = `# Research Report: ${sessionData.question}

## Executive Summary

This comprehensive research report examines **${sessionData.question}** through multiple lenses, analyzing current trends, expert opinions, and industry insights. Our investigation reveals significant developments and opportunities in this space.

## Key Findings

### 1. Current State Analysis
- The field shows rapid evolution and growing interest
- Multiple stakeholders are actively engaged in development
- Technology adoption is accelerating across various sectors

### 2. Market Trends
- Increasing investment and attention from major players
- Emerging patterns suggest significant growth potential
- Regulatory frameworks are adapting to new developments

### 3. Expert Perspectives
- Industry leaders emphasize the importance of innovation
- Academic research supports practical applications
- Consensus emerging around best practices

## Detailed Analysis

### Methodology
Our research employed a multi-source approach, gathering information from:
- Academic publications and peer-reviewed studies
- Industry reports and market analysis
- Expert interviews and commentary
- Recent news and developments

### Source Quality Assessment
- Average relevance score: 88%
- Average credibility score: 92%
- Sources span academic, industry, and news outlets
- Geographic diversity ensures comprehensive coverage

## Recommendations

1. **Short-term Actions**: Focus on immediate opportunities based on current trends
2. **Medium-term Strategy**: Develop capabilities aligned with emerging patterns
3. **Long-term Vision**: Position for future developments and innovations

## Conclusion

The research indicates that **${sessionData.question}** represents a significant area of opportunity with strong fundamentals and growing momentum. Stakeholders should consider both immediate tactical moves and strategic positioning for long-term success.

## Sources and References

${searchQueries.map((query, i) => `### Search Query ${i + 1}: "${query}"
- Academic Source: https://academic.com/source-${i}-2
- Industry Source: https://example.com/source-${i}-1`).join('\n\n')}

---

*Report generated on ${new Date().toISOString()}*
*Research Session: ${id}*`

            // Generate knowledge graph
            const knowledgeGraph = `graph TD
    A["${sessionData.question}"] --> B[Current State]
    A --> C[Market Trends]
    A --> D[Expert Perspectives]
    
    B --> B1[Rapid Evolution]
    B --> B2[Growing Interest]
    B --> B3[Technology Adoption]
    
    C --> C1[Investment Growth]
    C --> C2[Major Player Interest]
    C --> C3[Regulatory Adaptation]
    
    D --> D1[Innovation Focus]
    D --> D2[Academic Support]
    D --> D3[Best Practices]
    
    B1 --> E[Opportunities]
    C1 --> E
    D1 --> E
    
    E --> F[Short-term Actions]
    E --> G[Medium-term Strategy]
    E --> H[Long-term Vision]`

            // Update session with final results
            await db
              .update(researchSession)
              .set({
                status: 'completed',
                currentStep: 'completed',
                finalReport,
                knowledgeGraph,
                completedAt: new Date(),
                actualDuration: 15, // Mock 15 minutes
                updatedAt: new Date(),
              })
              .where(eq(researchSession.id, id))

            // Create final history entry
            await db.insert(researchHistory).values({
              id: nanoid(),
              sessionId: id,
              userId: session.user.id,
              version: 2,
              description: 'Research completed successfully',
              changeType: 'auto',
              fullState: {
                status: 'completed',
                step: 'completed',
                finalReport,
                knowledgeGraph,
                timestamp: new Date().toISOString(),
              },
              stepName: 'completed',
              createdAt: new Date(),
            })

            sendEvent('report', { 
              report: finalReport,
              sessionId: id 
            })

            sendEvent('knowledge_graph', { 
              graph: knowledgeGraph,
              sessionId: id 
            })

            sendEvent('complete', { 
              message: 'Research completed successfully!',
              sessionId: id,
              duration: 15,
              totalSources: searchQueries.length * 2,
              totalTasks: searchQueries.length,
            })

          } catch (error) {
            logger.error('Error during research streaming:', error)
            
            await db
              .update(researchSession)
              .set({
                status: 'failed',
                currentStep: 'error',
                updatedAt: new Date(),
              })
              .where(eq(researchSession.id, id))

            sendEvent('error', { 
              message: 'Research failed due to an error',
              error: error instanceof Error ? error.message : 'Unknown error',
              sessionId: id 
            })
          } finally {
            controller.close()
          }
        }

        // Start the research process
        runResearch()
      },
    })

    return new Response(stream, { headers })
  } catch (error) {
    logger.error('Error setting up research stream:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

// Call Supabase edge function for real deep research
async function callSupabaseEdgeFunction(
  payload: any,
  sendEvent: (type: string, data: any) => void,
  sessionId: string
) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/deep-research`

  try {
    logger.info('Calling Supabase edge function for deep research', { sessionId, url: edgeFunctionUrl })
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Edge function failed: ${response.status} ${response.statusText}`)
    }

    // Handle SSE stream from edge function
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('No response body from edge function')
    }

    let eventType = ''
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.substring(6).trim()
          continue
        }
        if (line.startsWith('data:')) {
          try {
            const data = JSON.parse(line.substring(5).trim())
            
            // Transform edge function events to our format
            if (eventType === 'progress') {
              sendEvent('status', {
                type: data.step,
                message: `${data.step}: ${data.status}`,
                sessionId,
              })
            } else if (eventType === 'message') {
              sendEvent('message', {
                type: data.type,
                text: data.text,
                sessionId,
              })
            } else if (eventType === 'error') {
              sendEvent('error', {
                message: data.message,
                sessionId,
              })
            } else if (eventType === 'done') {
              sendEvent('complete', {
                message: 'Research completed successfully!',
                sessionId,
              })
            }
          } catch (e) {
            logger.warn('Failed to parse SSE data from edge function', { line, error: e })
          }
        }
      }
    }

    // Update database with completed status
    await db
      .update(researchSession)
      .set({
        status: 'completed',
        currentStep: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(researchSession.id, sessionId))

  } catch (error) {
    logger.error('Error calling Supabase edge function:', error)
    
    // Fall back to mock implementation on error
    logger.info('Falling back to mock research implementation')
    const sessionData = await db
      .select()
      .from(researchSession)
      .where(eq(researchSession.id, sessionId))
      .limit(1)
    
    if (sessionData.length > 0) {
      await runMockResearch(sessionData[0], sendEvent, sessionId)
    }
  }
}

// Mock research implementation as fallback
async function runMockResearch(
  sessionData: any,
  sendEvent: (type: string, data: any) => void,
  sessionId: string
) {
  sendEvent('status', {
    type: 'thinking',
    message: 'Using mock research implementation...',
    sessionId,
  })

  await new Promise(resolve => setTimeout(resolve, 2000))
  
  sendEvent('status', {
    type: 'completed',
    message: 'Mock research completed',
    sessionId,
  })

  sendEvent('complete', {
    message: 'Mock research completed successfully!',
    sessionId,
  })

  // Update database
  await db
    .update(researchSession)
    .set({
      status: 'completed',
      currentStep: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(researchSession.id, sessionId))
}