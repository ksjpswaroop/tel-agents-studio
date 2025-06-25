import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console-logger'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { researchSession, researchHistory } from '@/db/schema'
import { nanoid } from 'nanoid'

const logger = createLogger('api/research/[id]/history')

const CreateHistorySchema = z.object({
  description: z.string().optional(),
  changeType: z.enum(['auto', 'manual', 'restore', 'branch']),
  fullState: z.record(z.any()),
  stepName: z.string().optional(),
  isBookmarked: z.boolean().default(false),
})

const RestoreHistorySchema = z.object({
  versionId: z.string(),
  createBranch: z.boolean().default(false),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'Research session not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const bookmarkedOnly = searchParams.get('bookmarked') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const whereConditions = [eq(researchHistory.sessionId, id)]
    
    if (bookmarkedOnly) {
      whereConditions.push(eq(researchHistory.isBookmarked, true))
    }

    const history = await db
      .select()
      .from(researchHistory)
      .where(and(...whereConditions))
      .orderBy(desc(researchHistory.version))
      .limit(limit)

    return NextResponse.json({
      success: true,
      data: history,
    })
  } catch (error) {
    logger.error('Error fetching research history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'Research session not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = CreateHistorySchema.parse(body)

    // Get the current max version for this session
    const lastHistory = await db
      .select({ version: researchHistory.version })
      .from(researchHistory)
      .where(eq(researchHistory.sessionId, id))
      .orderBy(desc(researchHistory.version))
      .limit(1)

    const nextVersion = (lastHistory[0]?.version || 0) + 1

    const newHistory = await db
      .insert(researchHistory)
      .values({
        id: nanoid(),
        sessionId: id,
        userId: session.user.id,
        version: nextVersion,
        description: validatedData.description,
        changeType: validatedData.changeType,
        fullState: validatedData.fullState,
        stepName: validatedData.stepName,
        isBookmarked: validatedData.isBookmarked,
        createdAt: new Date(),
      })
      .returning()

    logger.info(`Created history entry for session ${id}, version ${nextVersion}`)

    return NextResponse.json({
      success: true,
      data: newHistory[0],
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('Error creating research history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Pause research session
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'pause') {
      // Pause the research session
      const currentSession = await db
        .select()
        .from(researchSession)
        .where(
          and(
            eq(researchSession.id, id),
            eq(researchSession.userId, session.user.id)
          )
        )
        .limit(1)

      if (currentSession.length === 0) {
        return NextResponse.json({ error: 'Research session not found' }, { status: 404 })
      }

      // Update session status to paused
      const updatedSession = await db
        .update(researchSession)
        .set({
          status: 'paused',
          pausedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(researchSession.id, id))
        .returning()

      // Create history entry for pause
      await db.insert(researchHistory).values({
        id: nanoid(),
        sessionId: id,
        userId: session.user.id,
        version: await getNextVersion(id),
        description: 'Research session paused',
        changeType: 'manual',
        fullState: {
          ...currentSession[0],
          status: 'paused',
          pausedAt: new Date().toISOString(),
        },
        stepName: 'paused',
        createdAt: new Date(),
      })

      return NextResponse.json({
        success: true,
        data: updatedSession[0],
      })
    } else if (action === 'resume') {
      // Resume the research session
      const updatedSession = await db
        .update(researchSession)
        .set({
          status: 'researching',
          pausedAt: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(researchSession.id, id),
            eq(researchSession.userId, session.user.id)
          )
        )
        .returning()

      if (updatedSession.length === 0) {
        return NextResponse.json({ error: 'Research session not found' }, { status: 404 })
      }

      // Create history entry for resume
      await db.insert(researchHistory).values({
        id: nanoid(),
        sessionId: id,
        userId: session.user.id,
        version: await getNextVersion(id),
        description: 'Research session resumed',
        changeType: 'manual',
        fullState: {
          ...updatedSession[0],
          status: 'researching',
          pausedAt: null,
        },
        stepName: 'resumed',
        createdAt: new Date(),
      })

      return NextResponse.json({
        success: true,
        data: updatedSession[0],
      })
    } else if (action === 'restore') {
      // Restore from a specific history version
      const body = await request.json()
      const { versionId, createBranch } = RestoreHistorySchema.parse(body)

      // Get the history entry to restore from
      const historyEntry = await db
        .select()
        .from(researchHistory)
        .where(
          and(
            eq(researchHistory.id, versionId),
            eq(researchHistory.sessionId, id)
          )
        )
        .limit(1)

      if (historyEntry.length === 0) {
        return NextResponse.json({ error: 'History version not found' }, { status: 404 })
      }

      const stateToRestore = historyEntry[0].fullState as Record<string, any>

      // Update the research session with the restored state
      const updatedSession = await db
        .update(researchSession)
        .set({
          ...(typeof stateToRestore === 'object' && stateToRestore ? stateToRestore : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(researchSession.id, id),
            eq(researchSession.userId, session.user.id)
          )
        )
        .returning()

      if (updatedSession.length === 0) {
        return NextResponse.json({ error: 'Research session not found' }, { status: 404 })
      }

      // Create history entry for restore
      await db.insert(researchHistory).values({
        id: nanoid(),
        sessionId: id,
        userId: session.user.id,
        version: await getNextVersion(id),
        description: `Restored from version ${historyEntry[0].version}`,
        changeType: createBranch ? 'branch' : 'restore',
        fullState: stateToRestore,
        parentVersionId: versionId,
        stepName: 'restored',
        createdAt: new Date(),
      })

      return NextResponse.json({
        success: true,
        data: updatedSession[0],
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('Error updating research session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getNextVersion(sessionId: string): Promise<number> {
  const lastHistory = await db
    .select({ version: researchHistory.version })
    .from(researchHistory)
    .where(eq(researchHistory.sessionId, sessionId))
    .orderBy(desc(researchHistory.version))
    .limit(1)

  return (lastHistory[0]?.version || 0) + 1
}