import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console-logger'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { researchSession, researchTask, researchSource, researchHistory } from '@/db/schema'

const logger = createLogger('api/research/[id]')

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get('includeHistory') === 'true'
    const includeTasks = searchParams.get('includeTasks') === 'true'
    const includeSources = searchParams.get('includeSources') === 'true'

    // Get the research session
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
      return NextResponse.json({ error: 'Research session not found' }, { status: 404 })
    }

    const sessionData = researchSessionData[0]
    const result: any = { session: sessionData }

    // Optionally include related data
    if (includeTasks) {
      const tasks = await db
        .select()
        .from(researchTask)
        .where(eq(researchTask.sessionId, id))
        .orderBy(researchTask.createdAt)

      result.tasks = tasks
    }

    if (includeSources) {
      const sources = await db
        .select()
        .from(researchSource)
        .where(eq(researchSource.sessionId, id))
        .orderBy(researchSource.relevanceScore)

      result.sources = sources
    }

    if (includeHistory) {
      const history = await db
        .select()
        .from(researchHistory)
        .where(eq(researchHistory.sessionId, id))
        .orderBy(researchHistory.version)

      result.history = history
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error('Error fetching research session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}