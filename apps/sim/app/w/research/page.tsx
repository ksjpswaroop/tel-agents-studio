'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  FileSearch,
  Clock,
  CheckCircle,
  PauseCircle,
  PlayCircle,
  Calendar,
  Filter,
  MoreVertical,
  Trash2,
  Eye,
  Download,
  Share2,
  Calendar as CalendarIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useSidebarStore } from '@/stores/sidebar/store'
import { useSession } from '@/lib/auth-client'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'
import { createLogger } from '@/lib/logs/console-logger'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { CreateResearchModal } from './components/create-research-modal/create-research-modal'

const logger = createLogger('ResearchPage')

// Types for Research Sessions
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
  draft: { label: 'Draft', color: 'secondary', icon: FileSearch },
  thinking: { label: 'Thinking', color: 'blue', icon: Clock },
  planning: { label: 'Planning', color: 'yellow', icon: Clock },
  researching: { label: 'Researching', color: 'blue', icon: Search },
  writing: { label: 'Writing', color: 'purple', icon: Clock },
  completed: { label: 'Completed', color: 'green', icon: CheckCircle },
  paused: { label: 'Paused', color: 'orange', icon: PauseCircle },
  failed: { label: 'Failed', color: 'red', icon: FileSearch },
}

export default function ResearchPage() {
  const router = useRouter()
  const { mode, isExpanded } = useSidebarStore()
  const { data: session } = useSession()
  const { activeWorkspaceId } = useWorkflowRegistry()
  
  // State
  const [researchSessions, setResearchSessions] = useState<ResearchSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const isSidebarCollapsed =
    mode === 'expanded' ? !isExpanded : mode === 'collapsed' || mode === 'hover'

  // Get current workspace ID
  const currentWorkspaceId = activeWorkspaceId

  // Fetch research sessions
  const fetchResearchSessions = useCallback(async () => {
    logger.info('fetchResearchSessions called', { 
      userId: session?.user?.id, 
      currentWorkspaceId, 
      selectedStatus 
    })

    if (!session?.user?.id || !currentWorkspaceId) {
      logger.warn('Missing required data for fetching research sessions', {
        hasUserId: !!session?.user?.id,
        hasWorkspaceId: !!currentWorkspaceId
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        workspaceId: currentWorkspaceId,
        limit: '50',
        offset: '0',
      })

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      logger.info('Fetching research sessions', { url: `/api/research?${params.toString()}` })
      const response = await fetch(`/api/research?${params.toString()}`)
      
      logger.info('Research API response', { 
        status: response.status, 
        ok: response.ok 
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch research sessions: ${response.status}`)
      }

      const data = await response.json()
      logger.info('Research API data', data)
      
      if (data.success) {
        const sessions = data.data || []
        logger.info('Setting research sessions', { count: sessions.length })
        setResearchSessions(sessions)
      } else {
        throw new Error(data.error || 'Failed to fetch research sessions')
      }
    } catch (err) {
      logger.error('Error fetching research sessions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch research sessions')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, currentWorkspaceId, selectedStatus])

  // Initial load and refetch when dependencies change
  useEffect(() => {
    fetchResearchSessions()
  }, [fetchResearchSessions])

  // Filter and sort sessions
  const filteredSessions = researchSessions
    .filter(session => {
      const matchesSearch = searchQuery === '' || 
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.question.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = selectedStatus === 'all' || session.status === selectedStatus

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })

  // Handle session actions
  const handleViewSession = (sessionId: string) => {
    router.push(`/w/research/${sessionId}`)
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this research session?')) return

    try {
      const response = await fetch(`/api/research?id=${sessionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchResearchSessions()
      } else {
        console.error('Failed to delete research session')
      }
    } catch (err) {
      console.error('Error deleting research session:', err)
    }
  }

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false)
    fetchResearchSessions()
  }

  // Format utilities
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'In progress'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const getProgressPercentage = (session: ResearchSession) => {
    if (session.status === 'completed') return 100
    if (session.totalTasks === 0) return 0
    return Math.round((session.completedTasks / session.totalTasks) * 100)
  }

  // Render loading state
  if (loading) {
    return (
      <div
        className={`flex h-screen flex-col transition-padding duration-200 ${
          isSidebarCollapsed ? 'pl-14' : 'pl-60'
        }`}
      >
        {/* Header Skeleton */}
        <div className='flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
          <div className='flex h-16 items-center justify-between px-6'>
            <div className='flex items-center space-x-4'>
              <FileSearch className='h-6 w-6 text-primary' />
              <div>
                <Skeleton className='h-6 w-32' />
                <Skeleton className='h-4 w-48 mt-1' />
              </div>
            </div>
            <Skeleton className='h-10 w-32' />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className='flex flex-1 overflow-hidden'>
          <div className='flex flex-1 flex-col overflow-hidden'>
            <div className='flex-1 overflow-auto p-6'>
              {/* Search Bar Skeleton */}
              <div className='mb-6 flex items-center justify-between space-x-4'>
                <div className='flex flex-1 items-center space-x-4'>
                  <Skeleton className='h-10 w-80' />
                  <div className='flex items-center space-x-2'>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className='h-8 w-20' />
                    ))}
                  </div>
                </div>
              </div>

              {/* Sessions Grid Skeleton */}
              <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className='space-y-4'>
                    <CardHeader className='pb-3'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1 space-y-2'>
                          <Skeleton className='h-5 w-3/4' />
                          <Skeleton className='h-4 w-16' />
                        </div>
                        <Skeleton className='h-8 w-8' />
                      </div>
                      <Skeleton className='h-4 w-full' />
                      <Skeleton className='h-4 w-2/3' />
                    </CardHeader>
                    <CardContent className='pt-0 space-y-3'>
                      <div className='bg-muted/50 rounded-md p-3'>
                        <Skeleton className='h-4 w-full' />
                        <Skeleton className='h-4 w-3/4 mt-1' />
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-4'>
                          <Skeleton className='h-3 w-16' />
                          <Skeleton className='h-3 w-12' />
                        </div>
                        <Skeleton className='h-3 w-20' />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
            <FileSearch className='h-6 w-6 text-primary' />
            <div>
              <h1 className='text-xl font-semibold'>Deep Research</h1>
              <p className='text-sm text-muted-foreground'>
                Conduct comprehensive research with AI assistance
              </p>
            </div>
          </div>
          
          <Button 
            className='bg-primary hover:bg-primary/90'
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className='mr-2 h-4 w-4' />
            New Research
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex flex-1 overflow-hidden'>
        <div className='flex flex-1 flex-col overflow-hidden'>
          <div className='flex-1 overflow-auto p-6'>
            {/* Search and Filter Bar */}
            <div className='mb-6 flex items-center justify-between space-x-4'>
              <div className='flex flex-1 items-center space-x-4'>
                <div className='relative flex-1 max-w-md'>
                  <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    placeholder='Search research sessions...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-10'
                  />
                </div>
                
                {/* Status Filter */}
                <div className='flex items-center space-x-2'>
                  <Button
                    variant={selectedStatus === 'all' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setSelectedStatus('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={selectedStatus === 'completed' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setSelectedStatus('completed')}
                  >
                    Completed
                  </Button>
                  <Button
                    variant={selectedStatus === 'researching' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setSelectedStatus('researching')}
                  >
                    Active
                  </Button>
                  <Button
                    variant={selectedStatus === 'paused' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setSelectedStatus('paused')}
                  >
                    Paused
                  </Button>
                </div>

                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={(value: 'updated' | 'created' | 'title') => setSortBy(value)}>
                  <SelectTrigger className='w-32'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='updated'>Last Updated</SelectItem>
                    <SelectItem value='created'>Date Created</SelectItem>
                    <SelectItem value='title'>Title</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className='mb-6 rounded-lg border border-red-200 bg-red-50 p-4'>
                <div className='flex items-center space-x-2'>
                  <div className='text-sm text-red-800'>
                    <strong>Error:</strong> {error}
                  </div>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={fetchResearchSessions}
                    className='ml-auto'
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {/* Research Sessions Grid */}
            {filteredSessions.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-16 text-center'>
                <FileSearch className='h-12 w-12 text-muted-foreground mb-4' />
                <h3 className='text-lg font-semibold mb-2'>No research sessions found</h3>
                <p className='text-muted-foreground mb-6 max-w-md'>
                  {searchQuery || selectedStatus !== 'all'
                    ? 'Try adjusting your search terms or filters'
                    : 'Start your first research session to explore topics with AI assistance'
                  }
                </p>
                <Button 
                  className='bg-primary hover:bg-primary/90'
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Create Research Session
                </Button>
              </div>
            ) : (
              <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {filteredSessions.map((session) => {
                  const config = statusConfig[session.status]
                  const StatusIcon = config.icon
                  const progress = getProgressPercentage(session)

                  return (
                    <Card 
                      key={session.id} 
                      className='hover:shadow-md transition-shadow cursor-pointer group'
                      onClick={() => handleViewSession(session.id)}
                    >
                      <CardHeader className='pb-3'>
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <CardTitle className='text-lg leading-tight mb-2 group-hover:text-primary transition-colors'>
                              {session.title}
                            </CardTitle>
                            <div className='flex items-center space-x-2'>
                              <Badge 
                                variant='secondary'
                                className={`text-xs ${
                                  config.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                  config.color === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                  config.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                  config.color === 'orange' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                                  config.color === 'purple' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                                  config.color === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                  ''
                                }`}
                              >
                                <StatusIcon className='mr-1 h-3 w-3' />
                                {config.label}
                              </Badge>
                              {session.status === 'researching' && (
                                <div className='text-xs text-muted-foreground'>
                                  {progress}% complete
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                                <MoreVertical className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                handleViewSession(session.id)
                              }}>
                                <Eye className='mr-2 h-4 w-4' />
                                View Details
                              </DropdownMenuItem>
                              {session.status === 'paused' && (
                                <DropdownMenuItem>
                                  <PlayCircle className='mr-2 h-4 w-4' />
                                  Resume Research
                                </DropdownMenuItem>
                              )}
                              {session.finalReport && (
                                <DropdownMenuItem>
                                  <Download className='mr-2 h-4 w-4' />
                                  Export Report
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Share2 className='mr-2 h-4 w-4' />
                                Share Research
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className='text-red-600'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteSession(session.id)
                                }}
                              >
                                <Trash2 className='mr-2 h-4 w-4' />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {session.description && (
                          <CardDescription className='text-sm text-muted-foreground line-clamp-2'>
                            {session.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      
                      <CardContent className='pt-0'>
                        <div className='space-y-3'>
                          <div className='bg-muted/50 rounded-md p-3'>
                            <p className='text-sm font-medium text-foreground line-clamp-2'>
                              "{session.question}"
                            </p>
                          </div>
                          
                          {/* Progress bar for active research */}
                          {session.status === 'researching' && session.totalTasks > 0 && (
                            <div className='space-y-1'>
                              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                                <span>Progress</span>
                                <span>{session.completedTasks}/{session.totalTasks} tasks</span>
                              </div>
                              <div className='w-full bg-muted rounded-full h-1.5'>
                                <div 
                                  className='bg-primary h-1.5 rounded-full transition-all duration-300'
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          <div className='flex items-center justify-between text-xs text-muted-foreground'>
                            <div className='flex items-center space-x-4'>
                              <span>{session.totalSources} sources</span>
                              <span>{formatDuration(session.actualDuration || session.estimatedDuration || null)}</span>
                            </div>
                            <span>{formatDate(session.updatedAt)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Research Modal */}
      <CreateResearchModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
        workspaceId={currentWorkspaceId || ''}
      />
    </div>
  )
}