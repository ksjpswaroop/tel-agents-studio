import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq, desc, and } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console-logger'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { researchSession } from '@/db/schema'
import { nanoid } from 'nanoid'

const logger = createLogger('api/research')

// Validation schemas
const CreateResearchSessionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  question: z.string().min(1).max(1000),
  workspaceId: z.string(),
  aiConfig: z.object({
    provider: z.string(),
    thinkingModel: z.string(),
    taskModel: z.string(),
  }),
  searchConfig: z.object({
    searchProvider: z.string(),
    maxResults: z.number().min(1).max(20).default(5),
    language: z.string().default('en'),
  }),
})

const UpdateResearchSessionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'thinking', 'planning', 'researching', 'writing', 'completed', 'paused', 'failed']).optional(),
  currentStep: z.string().optional(),
  stateSnapshot: z.record(z.any()).optional(),
  reportPlan: z.string().optional(),
  finalReport: z.string().optional(),
  knowledgeGraph: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    // Build query conditions
    const conditions = [
      eq(researchSession.workspaceId, workspaceId),
      eq(researchSession.userId, session.user.id),
    ]

    if (status) {
      conditions.push(eq(researchSession.status, status as any))
    }

    const sessions = await db
      .select()
      .from(researchSession)
      .where(and(...conditions))
      .orderBy(desc(researchSession.updatedAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      success: true,
      data: sessions,
    })
  } catch (error) {
    logger.error('Error fetching research sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CreateResearchSessionSchema.parse(body)

    const newSession = await db
      .insert(researchSession)
      .values({
        id: nanoid(),
        userId: session.user.id,
        workspaceId: validatedData.workspaceId,
        title: validatedData.title,
        description: validatedData.description,
        question: validatedData.question,
        status: 'draft',
        aiConfig: validatedData.aiConfig,
        searchConfig: validatedData.searchConfig,
        currentStep: 'initialization',
        totalTasks: 0,
        completedTasks: 0,
        totalSources: 0,
        isPublic: false,
        allowCollaborators: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    logger.info(`Created research session: ${newSession[0].id}`)

    return NextResponse.json({
      success: true,
      data: newSession[0],
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('Error creating research session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = UpdateResearchSessionSchema.parse(body)

    // Verify session ownership
    const existingSession = await db
      .select()
      .from(researchSession)
      .where(
        and(
          eq(researchSession.id, sessionId),
          eq(researchSession.userId, session.user.id)
        )
      )
      .limit(1)

    if (existingSession.length === 0) {
      return NextResponse.json({ error: 'Research session not found' }, { status: 404 })
    }

    const updatedSession = await db
      .update(researchSession)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(researchSession.id, sessionId))
      .returning()

    return NextResponse.json({
      success: true,
      data: updatedSession[0],
    })
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Verify session ownership and delete
    const deletedSession = await db
      .delete(researchSession)
      .where(
        and(
          eq(researchSession.id, sessionId),
          eq(researchSession.userId, session.user.id)
        )
      )
      .returning()

    if (deletedSession.length === 0) {
      return NextResponse.json({ error: 'Research session not found' }, { status: 404 })
    }

    logger.info(`Deleted research session: ${sessionId}`)

    return NextResponse.json({
      success: true,
      data: { id: sessionId },
    })
  } catch (error) {
    logger.error('Error deleting research session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}