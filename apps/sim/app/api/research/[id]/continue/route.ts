import { NextRequest, NextResponse } from 'next/server'
import { eq, and, count } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console-logger'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { researchSession, researchHistory } from '@/db/schema'
import { nanoid } from 'nanoid'

const logger = createLogger('api/research/[id]/continue')

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body for additional instructions
    const body = await request.json().catch(() => ({}))
    const { additionalInstructions, extendDuration } = body

    // Verify session ownership and that it's continuable
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
    
    // Check if session can be continued
    if (currentSession.status !== 'completed') {
      return NextResponse.json(
        { error: `Cannot continue session in ${currentSession.status} status. Only completed sessions can be continued.` },
        { status: 400 }
      )
    }

    // Create a continuation instruction based on existing research
    let continuationContext = ''
    if (currentSession.finalReport) {
      continuationContext = `Previous research has been completed on: "${currentSession.question}"\n\n`
      continuationContext += `Previous findings summary:\n${currentSession.finalReport.substring(0, 500)}...\n\n`
    }
    
    if (additionalInstructions) {
      continuationContext += `Additional research instructions: ${additionalInstructions}\n\n`
    }
    
    continuationContext += 'Please extend this research with new insights, updated information, or deeper analysis.'

    // Calculate new estimated duration
    const originalDuration = currentSession.estimatedDuration || 30
    const newDuration = extendDuration || Math.floor(originalDuration * 0.7) // Default to 70% of original

    // Update session to continue research
    const updatedSession = await db
      .update(researchSession)
      .set({
        status: 'thinking',
        currentStep: 'continuation_planning',
        startedAt: new Date(),
        pausedAt: null,
        completedAt: null,
        estimatedDuration: newDuration,
        // Store continuation context in state snapshot
        stateSnapshot: {
          type: 'continuation',
          originalSessionId: id,
          continuationContext,
          additionalInstructions,
          previousReport: currentSession.finalReport,
          previousPlan: currentSession.reportPlan,
        },
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
      description: 'Research session continued with additional investigation',
      changeType: 'user_action',
      fullState: {
        status: 'thinking',
        continuedAt: new Date().toISOString(),
        additionalInstructions,
        extendDuration: newDuration,
      },
      stepName: 'continued',
      createdAt: new Date(),
    })

    logger.info(`Research session continued: ${id}`)

    return NextResponse.json({
      success: true,
      data: updatedSession[0],
      message: 'Research session will continue with additional investigation',
    })
  } catch (error) {
    logger.error('Error continuing research session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}