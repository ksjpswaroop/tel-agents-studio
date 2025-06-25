'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ExternalLink, Download, Save, Pause, Play, RotateCcw, Settings, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useSidebarStore } from '@/stores/sidebar/store'
import { useSession } from '@/lib/auth-client'
import { createLogger } from '@/lib/logs/console-logger'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { toast } from 'sonner'

const logger = createLogger('EmbeddedResearchPage')

// PostMessage communication protocol
interface ResearchMessage {
  type: 'save' | 'load' | 'export' | 'pause' | 'resume' | 'continue' | 'status' | 'ready'
  payload?: any
  sessionId?: string
  timestamp: number
}

interface ResearchState {
  id?: string
  title?: string
  status: 'idle' | 'thinking' | 'researching' | 'writing' | 'completed' | 'paused' | 'error'
  progress?: number
  currentStep?: string
  hasUnsavedChanges: boolean
}

const DEEP_RESEARCH_URL = process.env.NEXT_PUBLIC_DEEP_RESEARCH_URL || 'http://localhost:3001'

export default function EmbeddedResearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { mode, isExpanded } = useSidebarStore()
  const { data: session } = useSession()
  
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [researchState, setResearchState] = useState<ResearchState>({
    status: 'idle',
    hasUnsavedChanges: false
  })
  const [isFrameReady, setIsFrameReady] = useState(false)

  const isSidebarCollapsed = mode === 'expanded' ? !isExpanded : mode === 'collapsed' || mode === 'hover'

  // Check for demo parameters
  const demoParam = searchParams.get('demo')
  const [demoData, setDemoData] = useState<any>(null)

  useEffect(() => {
    if (demoParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(demoParam))
        setDemoData(decoded)
        logger.info('Demo mode activated', { demoData: decoded })
      } catch (err) {
        logger.error('Error parsing demo data', err)
      }
    }
  }, [demoParam])

  // Handle messages from the iframe
  const handleMessage = useCallback((event: MessageEvent) => {
    // Security: Check origin
    if (event.origin !== DEEP_RESEARCH_URL.replace(/\/$/, '')) {
      logger.warn('Received message from unexpected origin', { origin: event.origin })
      return
    }

    try {
      const message: ResearchMessage = event.data
      logger.info('Received message from iframe', { type: message.type, sessionId: message.sessionId })

      switch (message.type) {
        case 'ready':
          setIsFrameReady(true)
          setIsLoading(false)
          logger.info('Deep Research iframe is ready')
          break

        case 'status':
          setResearchState(prev => ({
            ...prev,
            ...message.payload,
            hasUnsavedChanges: message.payload?.hasUnsavedChanges ?? prev.hasUnsavedChanges
          }))
          break

        case 'save':
          handleSaveResearch(message.payload)
          break

        case 'export':
          handleExportResearch(message.payload)
          break

        default:
          logger.warn('Unknown message type', { type: message.type })
      }
    } catch (err) {
      logger.error('Error handling iframe message', err)
    }
  }, [])

  // Set up message listener
  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  // Send message to iframe
  const sendMessage = useCallback((message: Omit<ResearchMessage, 'timestamp'>) => {
    if (!iframeRef.current?.contentWindow || !isFrameReady) {
      logger.warn('Cannot send message - iframe not ready')
      return
    }

    const fullMessage: ResearchMessage = {
      ...message,
      timestamp: Date.now()
    }

    logger.info('Sending message to iframe', { type: message.type })
    iframeRef.current.contentWindow.postMessage(fullMessage, DEEP_RESEARCH_URL)
  }, [isFrameReady])

  // Handle save research
  const handleSaveResearch = async (researchData: any) => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to save research')
      return
    }

    try {
      const response = await fetch('/api/research/embedded/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...researchData,
          userId: session.user.id,
          workspaceId: 'default' // TODO: Get from workspace context
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save research')
      }

      const result = await response.json()
      setResearchState(prev => ({
        ...prev,
        id: result.id,
        hasUnsavedChanges: false
      }))

      toast.success('Research saved successfully')
      logger.info('Research saved', { id: result.id })
    } catch (err) {
      logger.error('Error saving research', err)
      toast.error('Failed to save research')
    }
  }

  // Handle export research
  const handleExportResearch = async (exportData: any) => {
    try {
      const response = await fetch('/api/research/embedded/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData)
      })

      if (!response.ok) {
        throw new Error('Failed to export research')
      }

      // Trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = exportData.filename || 'research-export.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Research exported successfully')
    } catch (err) {
      logger.error('Error exporting research', err)
      toast.error('Failed to export research')
    }
  }

  // Control functions
  const handleSave = () => {
    sendMessage({ type: 'save' })
  }

  const handlePause = () => {
    sendMessage({ type: 'pause' })
  }

  const handleResume = () => {
    sendMessage({ type: 'resume' })
  }

  const handleContinue = () => {
    const additionalInstructions = prompt('Enter additional research instructions (optional):')
    sendMessage({ 
      type: 'continue',
      payload: { additionalInstructions }
    })
  }

  const handleExport = (format: string) => {
    sendMessage({ 
      type: 'export',
      payload: { format }
    })
  }

  // Handle iframe load
  const handleIframeLoad = () => {
    logger.info('Iframe loaded')
    // Wait a bit for the iframe to fully initialize
    setTimeout(() => {
      if (!isFrameReady) {
        setIsLoading(false)
        setError('Failed to connect to Deep Research application')
      }
    }, 5000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'thinking': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'researching': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'writing': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'paused': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (error) {
    return (
      <div className={`flex h-screen flex-col transition-padding duration-200 ${
        isSidebarCollapsed ? 'pl-14' : 'pl-60'
      }`}>
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-center space-y-4'>
            <h2 className='text-lg font-semibold'>Deep Research Unavailable</h2>
            <p className='text-muted-foreground'>{error}</p>
            <div className='space-x-2'>
              <Button onClick={() => window.location.reload()}>
                <RotateCcw className='mr-2 h-4 w-4' />
                Retry
              </Button>
              <Button variant='outline' onClick={() => router.push('/w/research')}>
                <ArrowLeft className='mr-2 h-4 w-4' />
                Back to Research
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex h-screen flex-col transition-padding duration-200 ${
      isSidebarCollapsed ? 'pl-14' : 'pl-60'
    }`}>
      {/* Header */}
      <div className='flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='flex h-16 items-center justify-between px-6'>
          <div className='flex items-center space-x-4'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => router.push('/w/research')}
              className='flex items-center space-x-2'
            >
              <ArrowLeft className='h-4 w-4' />
              <span>Research</span>
            </Button>
            
            <Separator orientation='vertical' className='h-6' />
            
            <div className='flex items-center space-x-3'>
              <div className='flex items-center space-x-2'>
                <h1 className='font-semibold'>Deep Research</h1>
                <Badge variant='secondary' className='text-xs'>
                  Embedded
                </Badge>
              </div>
              {researchState.status !== 'idle' && (
                <Badge variant='secondary' className={`text-xs ${getStatusColor(researchState.status)}`}>
                  {researchState.status}
                </Badge>
              )}
              {researchState.hasUnsavedChanges && (
                <Badge variant='outline' className='text-xs text-orange-600'>
                  Unsaved
                </Badge>
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div className='flex items-center space-x-2'>
            <Button 
              onClick={() => router.push('/w/research/embedded/demo')} 
              variant='outline' 
              size='sm'
              className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0'
            >
              <Zap className='h-4 w-4 mr-2' />
              Try Demo
            </Button>

            {isFrameReady && (
              <>
                <Button onClick={handleSave} variant='outline' size='sm' disabled={!researchState.hasUnsavedChanges}>
                  <Save className='h-4 w-4 mr-2' />
                  Save
                </Button>

                {researchState.status === 'paused' && (
                  <Button onClick={handleResume} size='sm'>
                    <Play className='h-4 w-4 mr-2' />
                    Resume
                  </Button>
                )}

                {(researchState.status === 'thinking' || researchState.status === 'researching' || researchState.status === 'writing') && (
                  <Button onClick={handlePause} variant='outline' size='sm'>
                    <Pause className='h-4 w-4 mr-2' />
                    Pause
                  </Button>
                )}

                {researchState.status === 'completed' && (
                  <Button onClick={handleContinue} variant='outline' size='sm'>
                    <RotateCcw className='h-4 w-4 mr-2' />
                    Continue
                  </Button>
                )}

                <Button onClick={() => handleExport('pdf')} variant='outline' size='sm'>
                  <Download className='h-4 w-4 mr-2' />
                  Export
                </Button>
              </>
            )}

            <Button variant='ghost' size='sm' onClick={() => window.open(DEEP_RESEARCH_URL, '_blank')}>
              <ExternalLink className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Iframe */}
      <div className='flex-1 relative'>
        {isLoading && (
          <div className='absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10'>
            <div className='flex flex-col items-center space-y-4'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
              <p className='text-muted-foreground'>Loading Deep Research...</p>
            </div>
          </div>
        )}

        <ErrorBoundary
          onError={(error, errorInfo) => {
            logger.error('Iframe error boundary triggered:', error, errorInfo)
            setError('Deep Research application encountered an error')
          }}
        >
          <iframe
            ref={iframeRef}
            src={DEEP_RESEARCH_URL}
            className='w-full h-full border-0'
            title='Deep Research'
            onLoad={handleIframeLoad}
            sandbox='allow-same-origin allow-scripts allow-forms allow-popups allow-downloads'
          />
        </ErrorBoundary>
      </div>
    </div>
  )
}