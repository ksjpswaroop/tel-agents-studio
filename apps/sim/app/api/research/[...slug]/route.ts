import { NextRequest, NextResponse } from 'next/server'

const DEEP_RESEARCH_URL = process.env.DEEP_RESEARCH_URL || 'http://localhost:3001'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleRequest(request, params, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleRequest(request, params, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleRequest(request, params, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleRequest(request, params, 'DELETE')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleRequest(request, params, 'PATCH')
}

async function handleRequest(
  request: NextRequest,
  params: { slug: string[] },
  method: string
) {
  try {
    const { searchParams } = new URL(request.url)
    const path = params.slug.join('/')
    
    // Build the target URL
    const targetUrl = new URL(`/api/${path}`, DEEP_RESEARCH_URL)
    searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value)
    })

    // Get request body if present
    let body: BodyInit | undefined
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.text()
      } catch (error) {
        // Body might be empty or already consumed
        body = undefined
      }
    }

    // Forward headers (excluding some that shouldn't be forwarded)
    const headers = new Headers()
    const skipHeaders = [
      'host',
      'connection',
      'x-forwarded-for',
      'x-forwarded-proto',
      'x-forwarded-host',
      'x-real-ip',
      'x-vercel-id',
      'x-vercel-deployment-url',
      'x-vercel-trace',
    ]

    request.headers.forEach((value, key) => {
      if (!skipHeaders.includes(key.toLowerCase())) {
        headers.set(key, value)
      }
    })

    // Set content-type if body exists
    if (body && !headers.has('content-type')) {
      headers.set('content-type', 'application/json')
    }

    // Make the request to deep research service
    const response = await fetch(targetUrl.toString(), {
      method,
      headers,
      body,
      // Don't follow redirects automatically
      redirect: 'manual',
    })

    // Handle redirects
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (location) {
        return NextResponse.redirect(location, response.status)
      }
    }

    // Create response with proper headers
    const responseHeaders = new Headers()
    
    // Copy response headers (excluding some that shouldn't be forwarded)
    const skipResponseHeaders = [
      'connection',
      'keep-alive',
      'transfer-encoding',
      'upgrade',
      'x-powered-by',
    ]

    response.headers.forEach((value, key) => {
      if (!skipResponseHeaders.includes(key.toLowerCase())) {
        responseHeaders.set(key, value)
      }
    })

    // Handle streaming responses (like SSE)
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      })
    }

    // Handle regular responses
    const responseBody = await response.text()
    
    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })

  } catch (error) {
    console.error('Deep Research API proxy error:', error)
    
    return NextResponse.json(
      { 
        error: 'Deep Research service unavailable',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}