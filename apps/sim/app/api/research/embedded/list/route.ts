import { NextRequest, NextResponse } from 'next/server'
import { eq, desc } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console-logger'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { researchSession } from '@/db/schema'

const logger = createLogger('api/research/embedded/list')

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const workspaceId = url.searchParams.get('workspaceId')

    logger.info('Listing embedded research sessions', { 
      userId: session.user.id,
      limit,
      offset,
      workspaceId 
    })

    let query = db
      .select({
        id: researchSession.id,
        title: researchSession.title,
        description: researchSession.description,
        question: researchSession.question,
        status: researchSession.status,
        createdAt: researchSession.createdAt,
        updatedAt: researchSession.updatedAt,
        completedAt: researchSession.completedAt,
        totalTasks: researchSession.totalTasks,
        completedTasks: researchSession.completedTasks,
        totalSources: researchSession.totalSources,
        workspaceId: researchSession.workspaceId
      })
      .from(researchSession)
      .where(eq(researchSession.userId, session.user.id))
      .orderBy(desc(researchSession.updatedAt))
      .limit(limit)
      .offset(offset)

    // Filter by workspace if specified
    if (workspaceId) {
      query = query.where(eq(researchSession.workspaceId, workspaceId))
    }

    const sessions = await query

    // Get total count for pagination
    const totalCountQuery = await db
      .select({ count: researchSession.id })
      .from(researchSession)
      .where(eq(researchSession.userId, session.user.id))

    const totalCount = totalCountQuery.length

    logger.info('Research sessions listed successfully', { 
      count: sessions.length,
      totalCount,
      userId: session.user.id 
    })

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + sessions.length < totalCount
        }
      }
    })

  } catch (error) {
    logger.error('Error listing embedded research sessions:', error)
    return NextResponse.json(
      { error: 'Failed to list research sessions' },
      { status: 500 }
    )
  }
}