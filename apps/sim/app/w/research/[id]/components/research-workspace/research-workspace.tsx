'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  BookOpen,
  Download,
  FileText,
  History,
  Network,
  Play,
  Search,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ResearchForm } from '../research-form/research-form'
import { ResearchProgress } from '../research-progress/research-progress'
import { KnowledgeGraph } from '../knowledge-graph/knowledge-graph'
import { SourcesPanel } from '../sources-panel/sources-panel'
import { ExportPanel } from '../export-panel/export-panel'
import { HistoryPanel } from '../history-panel/history-panel'
import { CollaborationPanel } from '../collaboration-panel/collaboration-panel'
import { KnowledgePanel } from '../knowledge-panel/knowledge-panel'
import { MagicDown } from '@/components/magic-down'

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

interface ResearchWorkspaceProps {
  session: ResearchSession
  activePanel: 'progress' | 'graph' | 'sources' | 'export' | 'history' | 'collaboration' | 'knowledge'
  onPanelChange: (panel: 'progress' | 'graph' | 'sources' | 'export' | 'history' | 'collaboration' | 'knowledge') => void
  onSessionUpdate: () => void
}

const panelConfig = {
  progress: {
    label: 'Progress',
    icon: BarChart3,
    description: 'Real-time research progress and status',
  },
  graph: {
    label: 'Knowledge Graph',
    icon: Network,
    description: 'Interactive knowledge connections',
  },
  sources: {
    label: 'Sources',
    icon: Search,
    description: 'Research sources and references',
  },
  export: {
    label: 'Export',
    icon: Download,
    description: 'Export research in multiple formats',
  },
  history: {
    label: 'History',
    icon: History,
    description: 'Version history and recordings',
  },
  collaboration: {
    label: 'Collaboration',
    icon: Users,
    description: 'Share and collaborate on research',
  },
  knowledge: {
    label: 'Knowledge',
    icon: BookOpen,
    description: 'Browse and search knowledge base',
  },
}

export function ResearchWorkspace({
  session,
  activePanel,
  onPanelChange,
  onSessionUpdate,
}: ResearchWorkspaceProps) {
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault()
            onPanelChange('progress')
            break
          case '2':
            e.preventDefault()
            onPanelChange('graph')
            break
          case '3':
            e.preventDefault()
            onPanelChange('sources')
            break
          case '4':
            e.preventDefault()
            onPanelChange('export')
            break
          case '5':
            e.preventDefault()
            onPanelChange('history')
            break
          case '6':
            e.preventDefault()
            onPanelChange('collaboration')
            break
          case 'f':
            e.preventDefault()
            setIsFullscreen(!isFullscreen)
            break
          case 'b':
            e.preventDefault()
            setLeftPanelCollapsed(!leftPanelCollapsed)
            break
          case 'n':
            e.preventDefault()
            setRightPanelCollapsed(!rightPanelCollapsed)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    activePanel,
    onPanelChange,
    isFullscreen,
    leftPanelCollapsed,
    rightPanelCollapsed,
  ])

  const renderPanelContent = () => {
    switch (activePanel) {
      case 'progress':
        return (
          <ResearchProgress
            session={session}
            onSessionUpdate={onSessionUpdate}
          />
        )
      case 'graph':
        return (
          <KnowledgeGraph
            session={session}
            knowledgeGraph={session.knowledgeGraph}
          />
        )
      case 'sources':
        return (
          <SourcesPanel
            sessionId={session.id}
            totalSources={session.totalSources}
          />
        )
      case 'export':
        return (
          <ExportPanel
            session={session}
            onExportComplete={() => {
              // Handle export completion
            }}
          />
        )
      case 'history':
        return (
          <HistoryPanel
            sessionId={session.id}
            onRestore={onSessionUpdate}
          />
        )
      case 'collaboration':
        return (
          <CollaborationPanel
            session={session}
            onShare={() => {
              // Handle sharing
            }}
          />
        )
      case 'knowledge':
        return (
          <KnowledgePanel
            sessionId={session.id}
            workspaceId={session.workspaceId}
            onKnowledgeUpdate={onSessionUpdate}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className={`flex h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <ResizablePanelGroup direction='horizontal' className='h-full'>
        {/* Left Panel - Research Form */}
        {!leftPanelCollapsed && (
          <>
            <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
              <div className='h-full flex flex-col'>
                <div className='p-4 border-b flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <FileText className='h-4 w-4 text-primary' />
                    <h3 className='font-medium'>Research Configuration</h3>
                  </div>
                  <div className='flex items-center space-x-1'>
                    {isFullscreen && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setIsFullscreen(false)}
                        className='h-7 w-7 p-0'
                      >
                        <Minimize2 className='h-3 w-3' />
                      </Button>
                    )}
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setLeftPanelCollapsed(true)}
                      className='h-7 w-7 p-0'
                    >
                      <ChevronLeft className='h-3 w-3' />
                    </Button>
                  </div>
                </div>
                
                <div className='flex-1 overflow-auto'>
                  <ResearchForm
                    session={session}
                    onSessionUpdate={onSessionUpdate}
                  />
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        {/* Main Content Area */}
        <ResizablePanel defaultSize={leftPanelCollapsed ? 60 : 40} minSize={30}>
          <div className='h-full flex flex-col'>
            {/* Research Question Display */}
            <div className='p-4 border-b'>
              <div className='flex items-start justify-between'>
                <div className='flex-1 space-y-2'>
                  <div className='flex items-center space-x-2'>
                    {leftPanelCollapsed && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setLeftPanelCollapsed(false)}
                        className='h-7 w-7 p-0'
                      >
                        <ChevronRight className='h-3 w-3' />
                      </Button>
                    )}
                    <h2 className='text-lg font-semibold'>Research Question</h2>
                  </div>
                  <div className='bg-muted/50 rounded-lg p-4'>
                    <p className='text-sm leading-relaxed'>{session.question}</p>
                  </div>
                  {session.description && (
                    <p className='text-sm text-muted-foreground'>{session.description}</p>
                  )}
                </div>
                
                {!isFullscreen && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setIsFullscreen(true)}
                    className='ml-2 h-7 w-7 p-0'
                  >
                    <Maximize2 className='h-3 w-3' />
                  </Button>
                )}
              </div>
            </div>

            {/* Main Research Display */}
            <div className='flex-1 overflow-auto p-4'>
              {session.status === 'draft' ? (
                <div className='flex flex-col items-center justify-center h-full text-center space-y-4'>
                  <div className='p-8 border-2 border-dashed border-muted rounded-lg'>
                    <Play className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                    <h3 className='text-lg font-semibold mb-2'>Ready to Start Research</h3>
                    <p className='text-muted-foreground mb-4 max-w-md'>
                      Your research session is configured and ready. Click "Start Research" to begin the AI-powered research process.
                    </p>
                    <Badge variant='outline' className='text-xs'>
                      Estimated duration: {session.estimatedDuration || 30} minutes
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className='space-y-6'>
                  {/* Report Plan */}
                  {session.reportPlan && (
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-base flex items-center space-x-2'>
                          <FileText className='h-4 w-4' />
                          <span>Research Plan</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='p-0'>
                        <MagicDown
                          value={session.reportPlan}
                          readonly={true}
                          hideTools={false}
                          className='min-h-[400px] border-0'
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Final Report */}
                  {session.finalReport && (
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-base flex items-center space-x-2'>
                          <FileText className='h-4 w-4' />
                          <span>Research Report</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='p-0'>
                        <MagicDown
                          value={session.finalReport}
                          readonly={true}
                          hideTools={false}
                          className='min-h-[600px] border-0'
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Live Progress for Active Research */}
                  {(session.status === 'thinking' || 
                    session.status === 'planning' || 
                    session.status === 'researching' || 
                    session.status === 'writing') && (
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-base flex items-center space-x-2'>
                          <BarChart3 className='h-4 w-4' />
                          <span>Live Research Progress</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResearchProgress
                          session={session}
                          onSessionUpdate={onSessionUpdate}
                          embedded={true}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>

        {/* Right Panel - Tools and Analysis */}
        {!rightPanelCollapsed && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <div className='h-full flex flex-col'>
                <div className='border-b'>
                  <div className='p-4 flex items-center justify-between'>
                    <h3 className='font-medium'>Research Tools</h3>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setRightPanelCollapsed(true)}
                      className='h-7 w-7 p-0'
                    >
                      <ChevronRight className='h-3 w-3' />
                    </Button>
                  </div>

                  {/* Panel Tabs */}
                  <Tabs value={activePanel} onValueChange={(value) => onPanelChange(value as any)}>
                    <TabsList className='flex flex-wrap w-full h-auto p-1 gap-1'>
                      {Object.entries(panelConfig).map(([key, config]) => {
                        const Icon = config.icon
                        return (
                          <TabsTrigger
                            key={key}
                            value={key}
                            className='flex flex-col items-center p-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 min-w-0'
                          >
                            <Icon className='h-3 w-3 mb-1' />
                            <span className='hidden sm:inline'>{config.label}</span>
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>
                  </Tabs>
                </div>

                {/* Panel Content */}
                <div className='flex-1 overflow-auto'>
                  {renderPanelContent()}
                </div>
              </div>
            </ResizablePanel>
          </>
        )}

        {/* Collapsed Right Panel Button */}
        {rightPanelCollapsed && (
          <div className='w-12 border-l flex flex-col'>
            <div className='p-2 border-b'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setRightPanelCollapsed(false)}
                className='h-8 w-8 p-0'
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
            </div>
            
            <div className='flex flex-col space-y-1 p-1'>
              {Object.entries(panelConfig).map(([key, config]) => {
                const Icon = config.icon
                return (
                  <Button
                    key={key}
                    variant={activePanel === key ? 'default' : 'ghost'}
                    size='sm'
                    onClick={() => {
                      onPanelChange(key as any)
                      setRightPanelCollapsed(false)
                    }}
                    className='h-8 w-8 p-0'
                    title={config.label}
                  >
                    <Icon className='h-3 w-3' />
                  </Button>
                )
              })}
            </div>
          </div>
        )}
      </ResizablePanelGroup>

      {/* Keyboard Shortcuts Info */}
      {isFullscreen && (
        <div className='fixed bottom-4 right-4 bg-background/95 backdrop-blur border rounded-lg p-3 text-xs text-muted-foreground space-y-1'>
          <div>⌘+F: Toggle fullscreen</div>
          <div>⌘+B: Toggle left panel</div>
          <div>⌘+N: Toggle right panel</div>
          <div>⌘+1-6: Switch panels</div>
        </div>
      )}
    </div>
  )
}