'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Download,
  Share2,
  Settings,
  Brain,
  Search,
  FileText,
  BarChart3,
  History,
  BookOpen,
  Users,
  ExternalLink,
  PlusCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useSidebarStore } from '@/stores/sidebar/store'
import { useSession } from '@/lib/auth-client'
import { createLogger } from '@/lib/logs/console-logger'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { ResearchWorkspace } from './components/research-workspace/research-workspace'

const logger = createLogger('ResearchSessionPage')

// Types
interface ResearchSession {
  id: string
  title: string
  description?: string
  question: string
  status: 'draft' | 'thinking' | 'planning' | 'researching' | 'writing' | 'completed' | 'paused' | 'failed'
  workspaceId: string
  userId: string
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
  pausedAt?: string
  currentStep?: string
  totalTasks: number
  completedTasks: number
  totalSources: number
  estimatedDuration?: number
  actualDuration?: number
  aiConfig: {
    provider: string
    thinkingModel: string
    taskModel: string
  }
  searchConfig: {
    searchProvider: string
    maxResults: number
    language: string
  }
  reportPlan?: string
  finalReport?: string
  knowledgeGraph?: string
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
  thinking: { label: 'Thinking', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  planning: { label: 'Planning', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  researching: { label: 'Researching', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  writing: { label: 'Writing', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  paused: { label: 'Paused', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
}

export default function ResearchSessionPage() {
  const params = useParams()
  const router = useRouter()
  const { mode, isExpanded } = useSidebarStore()
  const { data: session } = useSession()
  
  const sessionId = params.id as string
  
  // State
  const [researchSession, setResearchSession] = useState<ResearchSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<'progress' | 'graph' | 'sources' | 'export' | 'history' | 'collaboration' | 'knowledge'>('progress')

  const isSidebarCollapsed =
    mode === 'expanded' ? !isExpanded : mode === 'collapsed' || mode === 'hover'

  // Fetch research session details
  const fetchResearchSession = useCallback(async () => {
    logger.info('fetchResearchSession called', { 
      userId: session?.user?.id, 
      sessionId 
    })

    if (!session?.user?.id || !sessionId) {
      logger.warn('Missing required data for fetching research session', {
        hasUserId: !!session?.user?.id,
        hasSessionId: !!sessionId
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        includeHistory: 'true',
        includeTasks: 'true',
        includeSources: 'true',
      })

      logger.info('Fetching research session', { 
        sessionId, 
        url: `/api/research/${sessionId}?${params.toString()}` 
      })
      const response = await fetch(`/api/research/${sessionId}?${params.toString()}`)
      
      logger.info('Research session API response', { 
        status: response.status, 
        ok: response.ok 
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Research session not found')
        }
        throw new Error(`Failed to fetch research session: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setResearchSession(data.data.session)
      } else {
        throw new Error(data.error || 'Failed to fetch research session')
      }
    } catch (err) {
      console.error('Error fetching research session:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch research session')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, sessionId])

  // Initial load
  useEffect(() => {
    fetchResearchSession()
  }, [fetchResearchSession])

  // Handle research controls
  const handleStartResearch = async () => {
    try {
      const response = await fetch(`/api/research/${sessionId}/stream`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to start research')
      }

      // Refresh session data
      await fetchResearchSession()
    } catch (err) {
      console.error('Error starting research:', err)
    }
  }

  const handlePauseResearch = async () => {
    try {
      const response = await fetch(`/api/research/${sessionId}/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stateSnapshot: {
            status: researchSession?.status,
            currentStep: researchSession?.currentStep,
            timestamp: new Date().toISOString(),
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to pause research')
      }

      // Refresh session data
      await fetchResearchSession()
    } catch (err) {
      console.error('Error pausing research:', err)
    }
  }

  const handleResumeResearch = async () => {
    try {
      const response = await fetch(`/api/research/${sessionId}/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to resume research')
      }

      // Refresh session data
      await fetchResearchSession()
    } catch (err) {
      console.error('Error resuming research:', err)
    }
  }

  const handleContinueResearch = async () => {
    try {
      const additionalInstructions = prompt('Enter additional research instructions (optional):')
      
      const response = await fetch(`/api/research/${sessionId}/continue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          additionalInstructions,
          extendDuration: 20, // 20 minutes for continuation
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to continue research')
      }

      // Refresh session data
      await fetchResearchSession()
    } catch (err) {
      console.error('Error continuing research:', err)
    }
  }

  // Calculate progress
  const getProgressPercentage = () => {
    if (!researchSession) return 0
    if (researchSession.status === 'completed') return 100
    if (researchSession.totalTasks === 0) return 0
    return Math.round((researchSession.completedTasks / researchSession.totalTasks) * 100)
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Not started'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Loading state
  if (loading) {
    return (
      <div
        className={`flex h-screen flex-col transition-padding duration-200 ${
          isSidebarCollapsed ? 'pl-14' : 'pl-60'
        }`}
      >
        <div className='flex-1 flex items-center justify-center'>
          <div className='flex flex-col items-center space-y-4'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
            <p className='text-muted-foreground'>Loading research session...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !researchSession) {
    return (
      <div
        className={`flex h-screen flex-col transition-padding duration-200 ${
          isSidebarCollapsed ? 'pl-14' : 'pl-60'
        }`}
      >
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-center space-y-4'>
            <h2 className='text-lg font-semibold'>Research Session Not Found</h2>
            <p className='text-muted-foreground'>{error || 'The requested research session could not be found.'}</p>
            <Button onClick={() => router.push('/w/research')} className='mt-4'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Research
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const statusStyle = statusConfig[researchSession.status]
  const progress = getProgressPercentage()

  return (
    <div
      className={`flex h-screen flex-col transition-padding duration-200 ${
        isSidebarCollapsed ? 'pl-14' : 'pl-60'
      }`}
    >
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
              <Brain className='h-5 w-5 text-primary' />
              <div>
                <h1 className='font-semibold truncate max-w-md'>{researchSession.title}</h1>
                <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
                  <Badge variant='secondary' className={`text-xs ${statusStyle.color}`}>
                    {statusStyle.label}
                  </Badge>
                  <span>•</span>
                  <span>{formatDate(researchSession.updatedAt)}</span>
                  {researchSession.totalSources > 0 && (
                    <>
                      <span>•</span>
                      <span>{researchSession.totalSources} sources</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex items-center space-x-2'>
            {/* Research Controls */}
            {researchSession.status === 'draft' && (
              <Button onClick={handleStartResearch} className='flex items-center space-x-2'>
                <Play className='h-4 w-4' />
                <span>Start Research</span>
              </Button>
            )}
            
            {(researchSession.status === 'thinking' || 
              researchSession.status === 'planning' || 
              researchSession.status === 'researching' || 
              researchSession.status === 'writing') && (
              <Button onClick={handlePauseResearch} variant='outline' className='flex items-center space-x-2'>
                <Pause className='h-4 w-4' />
                <span>Pause</span>
              </Button>
            )}
            
            {researchSession.status === 'paused' && (
              <Button onClick={handleResumeResearch} className='flex items-center space-x-2'>
                <Play className='h-4 w-4' />
                <span>Resume</span>
              </Button>
            )}
            
            {researchSession.status === 'completed' && (
              <Button onClick={handleContinueResearch} variant='outline' className='flex items-center space-x-2'>
                <PlusCircle className='h-4 w-4' />
                <span>Continue Research</span>
              </Button>
            )}

            {/* Export & Share */}
            {researchSession.finalReport && (
              <Button variant='outline' size='sm'>
                <Download className='h-4 w-4 mr-2' />
                Export
              </Button>
            )}
            
            <Button variant='outline' size='sm'>
              <Share2 className='h-4 w-4 mr-2' />
              Share
            </Button>

            <Button variant='ghost' size='sm'>
              <Settings className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {(researchSession.status === 'researching' || researchSession.status === 'writing') && (
          <div className='px-6 pb-3'>
            <div className='flex items-center justify-between text-sm text-muted-foreground mb-2'>
              <span>
                {researchSession.currentStep || 'Processing'} • {researchSession.completedTasks}/{researchSession.totalTasks} tasks
              </span>
              <span>{progress}% complete</span>
            </div>
            <Progress value={progress} className='h-1.5' />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className='flex-1 overflow-hidden'>
        <ErrorBoundary
          onError={(error, errorInfo) => {
            logger.error('ResearchWorkspace error:', error, errorInfo)
          }}
          resetKeys={[researchSession.id]}
        >
          <ResearchWorkspace
            session={researchSession}
            activePanel={activePanel}
            onPanelChange={setActivePanel}
            onSessionUpdate={fetchResearchSession}
          />
        </ErrorBoundary>
      </div>
    </div>
  )
}