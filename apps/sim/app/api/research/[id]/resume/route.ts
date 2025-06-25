import { NextRequest, NextResponse } from 'next/server'
import { eq, and, count } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console-logger'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { researchSession, researchHistory } from '@/db/schema'
import { nanoid } from 'nanoid'

const logger = createLogger('api/research/[id]/resume')

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify session ownership and that it's resumable
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
    
    // Check if session can be resumed
    if (currentSession.status !== 'paused') {
      return NextResponse.json(
        { error: `Cannot resume session in ${currentSession.status} status` },
        { status: 400 }
      )
    }

    // Determine the status to resume to
    // If there's a state snapshot, try to restore the previous status
    let resumeStatus = 'thinking' // default
    let resumeStep = 'initialization'
    
    if (currentSession.stateSnapshot) {
      const snapshot = currentSession.stateSnapshot as any
      if (snapshot.status && ['thinking', 'planning', 'researching', 'writing'].includes(snapshot.status)) {
        resumeStatus = snapshot.status
        resumeStep = snapshot.step || snapshot.currentStep || resumeStep
      }
    }

    // Update session to resume status
    const updatedSession = await db
      .update(researchSession)
      .set({
        status: resumeStatus as any,
        currentStep: resumeStep,
        startedAt: new Date(), // Reset start time for duration calculation
        pausedAt: null,
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
      description: 'Research session resumed',
      changeType: 'user_action',
      fullState: {
        status: resumeStatus,
        resumedAt: new Date().toISOString(),
        resumedFrom: 'paused',
      },
      stepName: 'resumed',
      createdAt: new Date(),
    })

    logger.info(`Research session resumed: ${id} -> ${resumeStatus}`)

    return NextResponse.json({
      success: true,
      data: updatedSession[0],
    })
  } catch (error) {
    logger.error('Error resuming research session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}