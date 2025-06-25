import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console-logger'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { researchSession, researchKnowledgeLink, knowledgeBase, document } from '@/db/schema'
import { nanoid } from 'nanoid'

const logger = createLogger('api/research/[id]/knowledge')


const LinkKnowledgeSchema = z.object({
  knowledgeBaseId: z.string(),
  documentId: z.string().optional(),
  linkType: z.enum(['source', 'context', 'output', 'reference']),
  usageContext: z.string().optional(),
  relevanceScore: z.number().min(0).max(1).optional(),
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

    // Get linked knowledge bases with details
    const linkedKnowledge = await db
      .select({
        linkId: researchKnowledgeLink.id,
        linkType: researchKnowledgeLink.linkType,
        usageContext: researchKnowledgeLink.usageContext,
        relevanceScore: researchKnowledgeLink.relevanceScore,
        accessCount: researchKnowledgeLink.accessCount,
        lastAccessedAt: researchKnowledgeLink.lastAccessedAt,
        createdAt: researchKnowledgeLink.createdAt,
        
        // Knowledge base details
        knowledgeBaseId: knowledgeBase.id,
        knowledgeBaseName: knowledgeBase.name,
        knowledgeBaseDescription: knowledgeBase.description,
        
        // Document details (if linked to specific document)
        documentId: document.id,
        documentFilename: document.filename,
        documentFileSize: document.fileSize,
      })
      .from(researchKnowledgeLink)
      .leftJoin(knowledgeBase, eq(researchKnowledgeLink.knowledgeBaseId, knowledgeBase.id))
      .leftJoin(document, eq(researchKnowledgeLink.documentId, document.id))
      .where(eq(researchKnowledgeLink.sessionId, id))
      .orderBy(desc(researchKnowledgeLink.relevanceScore))

    return NextResponse.json({
      success: true,
      data: linkedKnowledge,
    })
  } catch (error) {
    logger.error('Error fetching linked knowledge:', error)
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
    const validatedData = LinkKnowledgeSchema.parse(body)

    // Verify knowledge base exists and user has access
    const knowledgeBaseData = await db
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.id, validatedData.knowledgeBaseId))
      .limit(1)

    if (knowledgeBaseData.length === 0) {
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 })
    }

    // If documentId is provided, verify it exists
    if (validatedData.documentId) {
      const documentData = await db
        .select()
        .from(document)
        .where(
          and(
            eq(document.id, validatedData.documentId),
            eq(document.knowledgeBaseId, validatedData.knowledgeBaseId)
          )
        )
        .limit(1)

      if (documentData.length === 0) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }
    }

    // Check if link already exists
    const existingLink = await db
      .select()
      .from(researchKnowledgeLink)
      .where(
        and(
          eq(researchKnowledgeLink.sessionId, id),
          eq(researchKnowledgeLink.knowledgeBaseId, validatedData.knowledgeBaseId),
          validatedData.documentId 
            ? eq(researchKnowledgeLink.documentId, validatedData.documentId)
            : isNull(researchKnowledgeLink.documentId)
        )
      )
      .limit(1)

    if (existingLink.length > 0) {
      // Update existing link
      const updatedLink = await db
        .update(researchKnowledgeLink)
        .set({
          linkType: validatedData.linkType,
          usageContext: validatedData.usageContext,
          relevanceScore: validatedData.relevanceScore?.toString(),
          accessCount: existingLink[0].accessCount + 1,
          lastAccessedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(researchKnowledgeLink.id, existingLink[0].id))
        .returning()

      return NextResponse.json({
        success: true,
        data: updatedLink[0],
        message: 'Knowledge link updated',
      })
    } else {
      // Create new link
      const newLink = await db
        .insert(researchKnowledgeLink)
        .values({
          id: nanoid(),
          sessionId: id,
          knowledgeBaseId: validatedData.knowledgeBaseId,
          documentId: validatedData.documentId,
          linkType: validatedData.linkType,
          usageContext: validatedData.usageContext,
          relevanceScore: validatedData.relevanceScore?.toString(),
          accessCount: 1,
          lastAccessedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      logger.info(`Linked knowledge base ${validatedData.knowledgeBaseId} to research session ${id}`)

      return NextResponse.json({
        success: true,
        data: newLink[0],
        message: 'Knowledge base linked successfully',
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('Error linking knowledge base:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get('linkId')

    if (!linkId) {
      return NextResponse.json({ error: 'Link ID is required' }, { status: 400 })
    }

    // Verify session ownership and delete link
    const deletedLink = await db
      .delete(researchKnowledgeLink)
      .where(
        and(
          eq(researchKnowledgeLink.id, linkId),
          eq(researchKnowledgeLink.sessionId, id)
        )
      )
      .returning()

    if (deletedLink.length === 0) {
      return NextResponse.json({ error: 'Knowledge link not found' }, { status: 404 })
    }

    // Verify the research session belongs to the user
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

    logger.info(`Unlinked knowledge base from research session ${id}`)

    return NextResponse.json({
      success: true,
      data: { id: linkId },
      message: 'Knowledge link removed successfully',
    })
  } catch (error) {
    logger.error('Error unlinking knowledge base:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}