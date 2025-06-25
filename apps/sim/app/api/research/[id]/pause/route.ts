import { NextRequest, NextResponse } from 'next/server'
import { eq, and, count } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console-logger'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { researchSession, researchHistory } from '@/db/schema'
import { nanoid } from 'nanoid'

const logger = createLogger('api/research/[id]/pause')

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body for state snapshot
    const body = await request.json().catch(() => ({}))
    const { stateSnapshot } = body

    // Verify session ownership and that it's pausable
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

    const currentSession = researchSessionData[0]
    
    // Check if session can be paused
    const pausableStatuses = ['thinking', 'planning', 'researching', 'writing']
    if (!pausableStatuses.includes(currentSession.status)) {
      return NextResponse.json(
        { error: `Cannot pause session in ${currentSession.status} status` },
        { status: 400 }
      )
    }

    // Calculate duration if session was running
    let actualDuration = currentSession.actualDuration
    if (currentSession.startedAt && !actualDuration) {
      const startTime = new Date(currentSession.startedAt).getTime()
      const pauseTime = Date.now()
      actualDuration = Math.floor((pauseTime - startTime) / 1000 / 60) // minutes
    }

    // Update session to paused status
    const updatedSession = await db
      .update(researchSession)
      .set({
        status: 'paused',
        pausedAt: new Date(),
        actualDuration,
        stateSnapshot: stateSnapshot || currentSession.stateSnapshot,
        updatedAt: new Date(),
      })
      .where(eq(researchSession.id, id))
      .returning()

    // Create history entry
    await db.insert(researchHistory).values({
      id: nanoid(),
      sessionId: id,
      userId: session.user.id,
      version: (await db
        .select({ count: count() })
        .from(researchHistory)
        .where(eq(researchHistory.sessionId, id))
      )[0]?.count as number + 1 || 1,
      description: 'Research session paused',
      changeType: 'user_action',
      fullState: {
        status: 'paused',
        pausedAt: new Date().toISOString(),
        duration: actualDuration,
        snapshot: stateSnapshot,
      },
      stepName: 'paused',
      createdAt: new Date(),
    })

    logger.info(`Research session paused: ${id}`)

    return NextResponse.json({
      success: true,
      data: updatedSession[0],
    })
  } catch (error) {
    logger.error('Error pausing research session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}