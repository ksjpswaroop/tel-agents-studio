import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console-logger'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { researchSession } from '@/db/schema'

const logger = createLogger('api/research/embedded/load')

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('Loading embedded research session', { id, userId: session.user.id })

    // Fetch the research session
    const sessions = await db
      .select()
      .from(researchSession)
      .where(eq(researchSession.id, id))
      .limit(1)

    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Research session not found' }, { status: 404 })
    }

    const sessionData = sessions[0]

    // Verify ownership
    if (sessionData.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Transform the data for the embedded research app
    const embeddedData = {
      id: sessionData.id,
      title: sessionData.title,
      question: sessionData.question,
      finalReport: sessionData.finalReport,
      reportPlan: sessionData.reportPlan,
      status: sessionData.status,
      createdAt: sessionData.createdAt,
      updatedAt: sessionData.updatedAt,
      completedAt: sessionData.completedAt,
      totalTasks: sessionData.totalTasks,
      completedTasks: sessionData.completedTasks,
      totalSources: sessionData.totalSources,
      // Extract embedded research specific data from metadata
      tasks: sessionData.metadata?.tasks || [],
      sources: sessionData.metadata?.sources || [],
      requirement: sessionData.description,
      // Add compatibility fields for the embedded app
      embeddedMetadata: {
        originalSource: 'tel-platform',
        savedAt: sessionData.updatedAt,
        aiConfig: sessionData.aiConfig,
        searchConfig: sessionData.searchConfig
      }
    }

    logger.info('Research session loaded successfully', { 
      id, 
      title: sessionData.title,
      userId: session.user.id 
    })

    return NextResponse.json({
      success: true,
      data: embeddedData
    })

  } catch (error) {
    logger.error('Error loading embedded research session:', error)
    return NextResponse.json(
      { error: 'Failed to load research session' },
      { status: 500 }
    )
  }
}