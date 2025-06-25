import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console-logger'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { researchSession } from '@/db/schema'
import { nanoid } from 'nanoid'

const logger = createLogger('api/research/embedded/save')

interface SaveResearchRequest {
  id?: string
  title: string
  question: string
  finalReport: string
  tasks: any[]
  sources: any[]
  reportPlan?: string
  requirement?: string
  userId: string
  workspaceId: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: SaveResearchRequest = await request.json()
    
    // Validate required fields
    if (!body.title || !body.question || !body.finalReport) {
      return NextResponse.json(
        { error: 'Missing required fields: title, question, or finalReport' },
        { status: 400 }
      )
    }

    const currentTime = new Date().toISOString()
    
    // Prepare research session data
    const sessionData = {
      id: body.id || nanoid(),
      title: body.title,
      description: body.requirement || 'Research conducted via embedded Deep Research',
      question: body.question,
      status: 'completed' as const,
      workspaceId: body.workspaceId,
      userId: session.user.id,
      createdAt: currentTime,
      updatedAt: currentTime,
      completedAt: currentTime,
      currentStep: 'Final Report',
      totalTasks: body.tasks?.length || 0,
      completedTasks: body.tasks?.length || 0,
      totalSources: body.sources?.length || 0,
      estimatedDuration: null,
      actualDuration: null,
      aiConfig: {
        provider: 'openai', // Default for embedded research
        thinkingModel: 'gpt-4o',
        taskModel: 'gpt-4o',
      },
      searchConfig: {
        searchProvider: 'tavily',
        maxResults: 10,
        language: 'en',
      },
      reportPlan: body.reportPlan || null,
      finalReport: body.finalReport,
      knowledgeGraph: null,
      // Store embedded research metadata
      metadata: {
        source: 'embedded',
        tasks: body.tasks || [],
        sources: body.sources || [],
        embeddeData: {
          originalId: body.id,
          timestamp: Date.now()
        }
      }
    }

    let result
    
    if (body.id) {
      // Update existing research session
      const existingSession = await db
        .select()
        .from(researchSession)
        .where(eq(researchSession.id, body.id))
        .limit(1)

      if (existingSession.length === 0) {
        return NextResponse.json({ error: 'Research session not found' }, { status: 404 })
      }

      // Verify ownership
      if (existingSession[0].userId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      await db
        .update(researchSession)
        .set({
          ...sessionData,
          createdAt: existingSession[0].createdAt, // Preserve original creation time
          updatedAt: currentTime,
        })
        .where(eq(researchSession.id, body.id))

      result = { id: body.id, updated: true }
    } else {
      // Create new research session
      await db.insert(researchSession).values(sessionData)
      result = { id: sessionData.id, created: true }
    }

    logger.info('Research session saved successfully', {
      id: sessionData.id,
      userId: session.user.id,
      title: body.title,
      isUpdate: !!body.id
    })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    logger.error('Error saving embedded research session:', error)
    return NextResponse.json(
      { error: 'Failed to save research session' },
      { status: 500 }
    )
  }
}