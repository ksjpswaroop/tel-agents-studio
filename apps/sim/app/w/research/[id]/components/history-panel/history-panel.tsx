'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  History,
  Play,
  Pause,
  RotateCcw,
  Clock,
  GitBranch,
  Save,
  Download,
  Trash2,
  Copy,
  Eye,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  SkipForward,
  SkipBack,
  FastForward,
  Rewind,
  Volume2,
  VolumeX,
  Settings,
  Calendar,
  User,
  FileText,
  Bookmark,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HistoryEntry {
  id: string
  timestamp: string
  type: 'checkpoint' | 'action' | 'result' | 'error' | 'milestone'
  title: string
  description: string
  data?: any
  duration?: number
  userId?: string
  userName?: string
  canRestore: boolean
}

interface ResearchVersion {
  id: string
  version: string
  createdAt: string
  title: string
  description: string
  status: 'completed' | 'partial' | 'archived'
  changes: number
  userId: string
  userName: string
  isCurrent: boolean
}

interface ReplaySession {
  id: string
  name: string
  duration: number
  totalSteps: number
  createdAt: string
  isRecording: boolean
}

interface HistoryPanelProps {
  sessionId: string
  onRestore: () => void
}

const historyTypeConfig = {
  checkpoint: { icon: Save, color: 'text-blue-500', label: 'Checkpoint' },
  action: { icon: Play, color: 'text-green-500', label: 'Action' },
  result: { icon: CheckCircle, color: 'text-emerald-500', label: 'Result' },
  error: { icon: AlertCircle, color: 'text-red-500', label: 'Error' },
  milestone: { icon: GitBranch, color: 'text-purple-500', label: 'Milestone' },
}

// Mock data generators
const generateMockHistory = (sessionId: string): HistoryEntry[] => {
  const entries: HistoryEntry[] = []
  const now = Date.now()
  
  const events = [
    { type: 'milestone', title: 'Research Started', description: 'Initial research session created' },
    { type: 'checkpoint', title: 'Configuration Saved', description: 'AI and search settings configured' },
    { type: 'action', title: 'Research Plan Generated', description: 'AI created comprehensive research strategy' },
    { type: 'action', title: 'Source Search #1', description: 'Searched for academic papers on AI trends' },
    { type: 'result', title: '15 Sources Found', description: 'Relevant sources identified and analyzed' },
    { type: 'checkpoint', title: 'Progress Checkpoint', description: 'Interim results saved' },
    { type: 'action', title: 'Source Search #2', description: 'Expanded search to industry reports' },
    { type: 'result', title: '8 Additional Sources', description: 'Industry insights and market data collected' },
    { type: 'milestone', title: 'Research Phase Complete', description: 'All source gathering completed' },
    { type: 'action', title: 'Report Generation', description: 'AI began synthesizing findings' },
    { type: 'milestone', title: 'Research Completed', description: 'Final report generated successfully' },
  ]
  
  events.forEach((event, index) => {
    entries.push({
      id: `history-${index + 1}`,
      timestamp: new Date(now - (events.length - index) * 10 * 60 * 1000).toISOString(),
      type: event.type as any,
      title: event.title,
      description: event.description,
      duration: Math.floor(Math.random() * 300) + 30,
      userId: 'user-1',
      userName: 'Research Team',
      canRestore: event.type === 'checkpoint' || event.type === 'milestone',
    })
  })
  
  return entries
}

const generateMockVersions = (sessionId: string): ResearchVersion[] => {
  return [
    {
      id: 'v3',
      version: '3.0',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      title: 'Final Research Report',
      description: 'Complete analysis with all sources and findings',
      status: 'completed',
      changes: 45,
      userId: 'user-1',
      userName: 'Research Team',
      isCurrent: true,
    },
    {
      id: 'v2',
      version: '2.1',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      title: 'Interim Report Draft',
      description: 'Initial findings with partial source analysis',
      status: 'partial',
      changes: 28,
      userId: 'user-1',
      userName: 'Research Team',
      isCurrent: false,
    },
    {
      id: 'v1',
      version: '1.0',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      title: 'Research Plan',
      description: 'Initial research configuration and methodology',
      status: 'completed',
      changes: 12,
      userId: 'user-1',
      userName: 'Research Team',
      isCurrent: false,
    },
  ]
}

const generateMockReplaySessions = (sessionId: string): ReplaySession[] => {
  return [
    {
      id: 'replay-1',
      name: 'Complete Research Process',
      duration: 1800, // 30 minutes
      totalSteps: 11,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isRecording: false,
    },
    {
      id: 'replay-2',
      name: 'Source Discovery Phase',
      duration: 600, // 10 minutes
      totalSteps: 5,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      isRecording: false,
    },
  ]
}

export function HistoryPanel({ sessionId, onRestore }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [versions, setVersions] = useState<ResearchVersion[]>([])
  const [replaySessions, setReplaySessions] = useState<ReplaySession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)
  
  // Replay controls
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [autoPlay, setAutoPlay] = useState(true)
  const [showDetails, setShowDetails] = useState(true)
  const [currentReplaySession, setCurrentReplaySession] = useState<ReplaySession | null>(null)

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // In a real implementation, these would be API calls
      const historyData = generateMockHistory(sessionId)
      const versionsData = generateMockVersions(sessionId)
      const replayData = generateMockReplaySessions(sessionId)
      
      setHistory(historyData)
      setVersions(versionsData)
      setReplaySessions(replayData)
    } catch (error) {
      console.error('Error fetching history data:', error)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Replay controls
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleStepForward = () => {
    if (currentStep < history.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleStepBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleRestart = () => {
    setCurrentStep(0)
    setIsPlaying(false)
  }

  const handleRestore = async (entry: HistoryEntry) => {
    try {
      // In a real implementation, this would call the API to restore the session state
      console.log('Restoring to checkpoint:', entry.id)
      onRestore()
    } catch (error) {
      console.error('Error restoring checkpoint:', error)
    }
  }

  const handleCreateCheckpoint = async () => {
    try {
      // Create a new checkpoint
      const newCheckpoint: HistoryEntry = {
        id: `checkpoint-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'checkpoint',
        title: 'Manual Checkpoint',
        description: 'User-created checkpoint',
        userId: 'current-user',
        userName: 'You',
        canRestore: true,
      }
      
      setHistory(prev => [newCheckpoint, ...prev])
    } catch (error) {
      console.error('Error creating checkpoint:', error)
    }
  }

  const handleStartReplay = (replaySession: ReplaySession) => {
    setCurrentReplaySession(replaySession)
    setCurrentStep(0)
    setIsPlaying(false)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className='p-4 flex items-center justify-center h-64'>
        <div className='text-center space-y-2'>
          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto'></div>
          <p className='text-sm text-muted-foreground'>Loading history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='p-4 border-b'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center space-x-2'>
            <History className='h-4 w-4 text-primary' />
            <h3 className='font-medium'>Research History</h3>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={handleCreateCheckpoint}
            className='text-xs'
          >
            <Save className='h-3 w-3 mr-1' />
            Checkpoint
          </Button>
        </div>
      </div>

      <Tabs defaultValue='timeline' className='flex-1 flex flex-col'>
        <TabsList className='grid w-full grid-cols-3 mx-4 mt-2'>
          <TabsTrigger value='timeline' className='text-xs'>Timeline</TabsTrigger>
          <TabsTrigger value='versions' className='text-xs'>Versions</TabsTrigger>
          <TabsTrigger value='replay' className='text-xs'>Replay</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value='timeline' className='flex-1 mt-2'>
          <ScrollArea className='h-full'>
            <div className='p-4 space-y-3'>
              {history.map((entry, index) => {
                const TypeIcon = historyTypeConfig[entry.type].icon
                const isLast = index === history.length - 1

                return (
                  <div key={entry.id} className='relative'>
                    {/* Timeline line */}
                    {!isLast && (
                      <div className='absolute left-6 top-8 w-0.5 h-8 bg-border'></div>
                    )}
                    
                    <div className='flex items-start space-x-3'>
                      <div className={`flex-shrink-0 p-2 rounded-lg bg-muted/50`}>
                        <TypeIcon className={`h-3 w-3 ${historyTypeConfig[entry.type].color}`} />
                      </div>
                      
                      <div className='flex-1 space-y-1'>
                        <div className='flex items-center justify-between'>
                          <h4 className='font-medium text-sm'>{entry.title}</h4>
                          <span className='text-xs text-muted-foreground'>
                            {formatDate(entry.timestamp)}
                          </span>
                        </div>
                        
                        <p className='text-xs text-muted-foreground'>
                          {entry.description}
                        </p>
                        
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-2'>
                            <Badge variant='outline' className='text-xs'>
                              {historyTypeConfig[entry.type].label}
                            </Badge>
                            {entry.duration && (
                              <Badge variant='secondary' className='text-xs'>
                                {formatDuration(entry.duration)}
                              </Badge>
                            )}
                          </div>
                          
                          {entry.canRestore && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                                  <Settings className='h-3 w-3' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end'>
                                <DropdownMenuItem onClick={() => handleRestore(entry)}>
                                  <RotateCcw className='h-3 w-3 mr-2' />
                                  Restore
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedEntry(entry)}>
                                  <Eye className='h-3 w-3 mr-2' />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className='h-3 w-3 mr-2' />
                                  Copy Info
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Versions Tab */}
        <TabsContent value='versions' className='flex-1 mt-2'>
          <ScrollArea className='h-full'>
            <div className='p-4 space-y-3'>
              {versions.map((version) => (
                <Card key={version.id} className={version.isCurrent ? 'ring-2 ring-primary' : ''}>
                  <CardContent className='p-3'>
                    <div className='flex items-start justify-between mb-2'>
                      <div className='space-y-1'>
                        <div className='flex items-center space-x-2'>
                          <h4 className='font-medium text-sm'>{version.title}</h4>
                          <Badge variant='outline' className='text-xs'>
                            v{version.version}
                          </Badge>
                          {version.isCurrent && (
                            <Badge variant='default' className='text-xs'>
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          {version.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className='flex items-center justify-between text-xs text-muted-foreground mb-3'>
                      <div className='flex items-center space-x-3'>
                        <span>{formatDate(version.createdAt)}</span>
                        <span>•</span>
                        <span>{version.changes} changes</span>
                        <span>•</span>
                        <span>{version.userName}</span>
                      </div>
                      <Badge
                        variant={version.status === 'completed' ? 'default' : 'secondary'}
                        className='text-xs'
                      >
                        {version.status}
                      </Badge>
                    </div>
                    
                    <div className='flex items-center space-x-2'>
                      <Button variant='outline' size='sm' className='text-xs'>
                        <Eye className='h-3 w-3 mr-1' />
                        Preview
                      </Button>
                      {!version.isCurrent && (
                        <Button variant='outline' size='sm' className='text-xs'>
                          <RotateCcw className='h-3 w-3 mr-1' />
                          Restore
                        </Button>
                      )}
                      <Button variant='outline' size='sm' className='text-xs'>
                        <Download className='h-3 w-3 mr-1' />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Replay Tab */}
        <TabsContent value='replay' className='flex-1 mt-2'>
          <div className='flex flex-col h-full'>
            {/* Replay Controls */}
            <div className='p-4 border-b space-y-4'>
              {/* Main Controls */}
              <div className='flex items-center justify-center space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleRestart}
                  className='h-8 w-8 p-0'
                >
                  <Rewind className='h-3 w-3' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleStepBack}
                  className='h-8 w-8 p-0'
                >
                  <SkipBack className='h-3 w-3' />
                </Button>
                <Button
                  variant={isPlaying ? 'default' : 'outline'}
                  size='sm'
                  onClick={handlePlayPause}
                  className='h-8 w-8 p-0'
                >
                  {isPlaying ? <Pause className='h-3 w-3' /> : <Play className='h-3 w-3' />}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleStepForward}
                  className='h-8 w-8 p-0'
                >
                  <SkipForward className='h-3 w-3' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentStep(history.length - 1)}
                  className='h-8 w-8 p-0'
                >
                  <FastForward className='h-3 w-3' />
                </Button>
              </div>

              {/* Progress Bar */}
              <div className='space-y-2'>
                <div className='flex justify-between text-xs text-muted-foreground'>
                  <span>Step {currentStep + 1} of {history.length}</span>
                  <span>{formatDuration(currentStep * 60)}</span>
                </div>
                <Slider
                  value={[currentStep]}
                  max={history.length - 1}
                  step={1}
                  onValueChange={(value) => setCurrentStep(value[0])}
                  className='w-full'
                />
              </div>

              {/* Settings */}
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div className='flex items-center justify-between'>
                  <Label>Speed</Label>
                  <Select value={playbackSpeed.toString()} onValueChange={(value) => setPlaybackSpeed(parseFloat(value))}>
                    <SelectTrigger className='w-20 h-6 text-xs'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='0.5'>0.5x</SelectItem>
                      <SelectItem value='1'>1x</SelectItem>
                      <SelectItem value='2'>2x</SelectItem>
                      <SelectItem value='4'>4x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex items-center justify-between'>
                  <Label>Auto-play</Label>
                  <Switch checked={autoPlay} onCheckedChange={setAutoPlay} />
                </div>
              </div>
            </div>

            {/* Current Step Display */}
            {history[currentStep] && (
              <div className='p-4 border-b'>
                <Card>
                  <CardContent className='p-3'>
                    <div className='flex items-start space-x-3'>
                      <div className='flex-shrink-0 p-2 rounded-lg bg-primary/10'>
                        {React.createElement(historyTypeConfig[history[currentStep].type].icon, {
                          className: `h-4 w-4 ${historyTypeConfig[history[currentStep].type].color}`
                        })}
                      </div>
                      <div className='flex-1'>
                        <h4 className='font-medium text-sm mb-1'>
                          {history[currentStep].title}
                        </h4>
                        <p className='text-xs text-muted-foreground mb-2'>
                          {history[currentStep].description}
                        </p>
                        <div className='flex items-center space-x-2'>
                          <Badge variant='outline' className='text-xs'>
                            {historyTypeConfig[history[currentStep].type].label}
                          </Badge>
                          <span className='text-xs text-muted-foreground'>
                            {formatDate(history[currentStep].timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Saved Replay Sessions */}
            <ScrollArea className='flex-1'>
              <div className='p-4 space-y-3'>
                <h4 className='font-medium text-sm'>Saved Replay Sessions</h4>
                
                {replaySessions.map((session) => (
                  <Card key={session.id}>
                    <CardContent className='p-3'>
                      <div className='flex items-center justify-between mb-2'>
                        <h5 className='font-medium text-sm'>{session.name}</h5>
                        <Badge variant='outline' className='text-xs'>
                          {session.totalSteps} steps
                        </Badge>
                      </div>
                      
                      <div className='flex items-center justify-between text-xs text-muted-foreground mb-3'>
                        <span>{formatDuration(session.duration)}</span>
                        <span>{formatDate(session.createdAt)}</span>
                      </div>
                      
                      <div className='flex items-center space-x-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleStartReplay(session)}
                          className='text-xs'
                        >
                          <Play className='h-3 w-3 mr-1' />
                          Replay
                        </Button>
                        <Button variant='outline' size='sm' className='text-xs'>
                          <Download className='h-3 w-3 mr-1' />
                          Export
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Button variant='outline' className='w-full text-xs'>
                  <Bookmark className='h-3 w-3 mr-2' />
                  Save Current Session
                </Button>
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}