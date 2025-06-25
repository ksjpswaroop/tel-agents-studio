'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  ExternalLink,
  FileText,
  Globe,
  Book,
  Video,
  Image,
  Archive,
  Filter,
  SortAsc,
  SortDesc,
  Bookmark,
  BookmarkCheck,
  MoreVertical,
  Copy,
  Download,
  Eye,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'

interface Source {
  id: string
  title: string
  url: string
  type: 'web' | 'pdf' | 'academic' | 'news' | 'video' | 'image' | 'book'
  domain: string
  description: string
  content?: string
  timestamp: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  relevanceScore: number
  credibilityScore: number
  extractedText?: string
  metadata: {
    author?: string
    publishDate?: string
    tags?: string[]
    wordCount?: number
    readTime?: number
    language?: string
  }
  saved: boolean
  cited: boolean
}

interface SourcesPanelProps {
  sessionId: string
  totalSources: number
}

const sourceTypeConfig = {
  web: { icon: Globe, color: 'text-blue-500', label: 'Web' },
  pdf: { icon: FileText, color: 'text-red-500', label: 'PDF' },
  academic: { icon: Book, color: 'text-purple-500', label: 'Academic' },
  news: { icon: FileText, color: 'text-green-500', label: 'News' },
  video: { icon: Video, color: 'text-orange-500', label: 'Video' },
  image: { icon: Image, color: 'text-pink-500', label: 'Image' },
  book: { icon: Book, color: 'text-indigo-500', label: 'Book' },
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-gray-500', label: 'Pending' },
  processing: { icon: Search, color: 'text-blue-500', label: 'Processing' },
  completed: { icon: CheckCircle, color: 'text-green-500', label: 'Completed' },
  failed: { icon: AlertCircle, color: 'text-red-500', label: 'Failed' },
}

// Mock data generator
const generateMockSources = (sessionId: string, count: number): Source[] => {
  const sources: Source[] = []
  const domains = ['arxiv.org', 'nature.com', 'openai.com', 'techcrunch.com', 'wired.com', 'mit.edu', 'stanford.edu']
  const types: Source['type'][] = ['web', 'pdf', 'academic', 'news', 'video']
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const domain = domains[Math.floor(Math.random() * domains.length)]
    
    sources.push({
      id: `source-${i + 1}`,
      title: `Research Source ${i + 1}: AI Development Trends`,
      url: `https://${domain}/research/ai-trends-${i + 1}`,
      type,
      domain,
      description: `This source discusses recent developments in artificial intelligence, focusing on large language models and their applications in various domains.`,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: Math.random() > 0.8 ? 'processing' : 'completed',
      relevanceScore: 0.7 + Math.random() * 0.3,
      credibilityScore: 0.6 + Math.random() * 0.4,
      metadata: {
        author: `Author ${i + 1}`,
        publishDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['AI', 'Machine Learning', 'Research'],
        wordCount: 1500 + Math.floor(Math.random() * 3000),
        readTime: 5 + Math.floor(Math.random() * 10),
        language: 'en',
      },
      saved: Math.random() > 0.7,
      cited: Math.random() > 0.6,
    })
  }
  
  return sources
}

export function SourcesPanel({ sessionId, totalSources }: SourcesPanelProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'relevance' | 'credibility' | 'date' | 'title'>('relevance')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)

  // Fetch sources
  const fetchSources = useCallback(async () => {
    setLoading(true)
    try {
      // In a real implementation, this would fetch from the API
      // const response = await fetch(`/api/research/${sessionId}/sources`)
      
      // For now, generate mock data
      const mockSources = generateMockSources(sessionId, totalSources || 15)
      setSources(mockSources)
    } catch (error) {
      console.error('Error fetching sources:', error)
    } finally {
      setLoading(false)
    }
  }, [sessionId, totalSources])

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  // Filter and sort sources
  const filteredSources = sources
    .filter((source) => {
      const matchesSearch = source.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.domain.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = filterType === 'all' || source.type === filterType
      const matchesStatus = filterStatus === 'all' || source.status === filterStatus
      return matchesSearch && matchesType && matchesStatus
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'relevance':
          comparison = a.relevanceScore - b.relevanceScore
          break
        case 'credibility':
          comparison = a.credibilityScore - b.credibilityScore
          break
        case 'date':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleSaveSource = async (sourceId: string) => {
    setSources(prev => prev.map(source => 
      source.id === sourceId ? { ...source, saved: !source.saved } : source
    ))
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
  }

  const handleViewSource = (source: Source) => {
    setSelectedSource(source)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getSourceStats = () => {
    const completed = sources.filter(s => s.status === 'completed').length
    const processing = sources.filter(s => s.status === 'processing').length
    const avgRelevance = sources.length > 0 ? sources.reduce((sum, s) => sum + s.relevanceScore, 0) / sources.length : 0
    const avgCredibility = sources.length > 0 ? sources.reduce((sum, s) => sum + s.credibilityScore, 0) / sources.length : 0
    
    return { completed, processing, avgRelevance, avgCredibility }
  }

  const stats = getSourceStats()

  if (loading) {
    return (
      <div className='p-4 flex items-center justify-center h-64'>
        <div className='text-center space-y-2'>
          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto'></div>
          <p className='text-sm text-muted-foreground'>Loading sources...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='p-4 border-b'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-2'>
            <Search className='h-4 w-4 text-primary' />
            <h3 className='font-medium'>Research Sources</h3>
            <Badge variant='secondary' className='text-xs'>
              {sources.length} found
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className='grid grid-cols-2 gap-3 mb-4'>
          <div className='text-center p-2 bg-muted/50 rounded-lg'>
            <div className='text-sm font-semibold'>{stats.completed}/{sources.length}</div>
            <div className='text-xs text-muted-foreground'>Processed</div>
          </div>
          <div className='text-center p-2 bg-muted/50 rounded-lg'>
            <div className='text-sm font-semibold'>{Math.round(stats.avgRelevance * 100)}%</div>
            <div className='text-xs text-muted-foreground'>Avg Relevance</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className='space-y-3'>
          <div className='relative'>
            <Search className='absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground' />
            <Input
              placeholder='Search sources...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-7 h-8 text-xs'
            />
          </div>

          <div className='grid grid-cols-2 gap-2'>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className='h-8 text-xs'>
                <SelectValue placeholder='Type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Types</SelectItem>
                {Object.entries(sourceTypeConfig).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    <div className='flex items-center space-x-2'>
                      <config.icon className={`h-3 w-3 ${config.color}`} />
                      <span>{config.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className='h-8 text-xs'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='relevance'>Relevance</SelectItem>
                <SelectItem value='credibility'>Credibility</SelectItem>
                <SelectItem value='date'>Date</SelectItem>
                <SelectItem value='title'>Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Sources List */}
      <div className='flex-1 overflow-hidden'>
        <Tabs defaultValue='all' className='h-full flex flex-col'>
          <TabsList className='grid w-full grid-cols-3 h-9 mx-4 mt-2'>
            <TabsTrigger value='all' className='text-xs'>All ({sources.length})</TabsTrigger>
            <TabsTrigger value='saved' className='text-xs'>
              Saved ({sources.filter(s => s.saved).length})
            </TabsTrigger>
            <TabsTrigger value='cited' className='text-xs'>
              Cited ({sources.filter(s => s.cited).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value='all' className='flex-1 mt-2'>
            <ScrollArea className='h-full'>
              <div className='space-y-2 p-4 pt-0'>
                {filteredSources.map((source) => {
                  const TypeIcon = sourceTypeConfig[source.type].icon
                  const StatusIcon = statusConfig[source.status].icon

                  return (
                    <Card key={source.id} className='p-3 hover:bg-accent/50 transition-colors'>
                      <div className='space-y-3'>
                        {/* Header */}
                        <div className='flex items-start justify-between'>
                          <div className='flex items-start space-x-3 flex-1'>
                            <div className='flex-shrink-0'>
                              <TypeIcon className={`h-4 w-4 ${sourceTypeConfig[source.type].color}`} />
                            </div>
                            <div className='flex-1 min-w-0'>
                              <h4 className='font-medium text-sm line-clamp-2 mb-1'>
                                {source.title}
                              </h4>
                              <div className='flex items-center space-x-2 text-xs text-muted-foreground mb-2'>
                                <span>{source.domain}</span>
                                <span>•</span>
                                <span>{formatDate(source.timestamp)}</span>
                                <StatusIcon className={`h-3 w-3 ${statusConfig[source.status].color}`} />
                              </div>
                              <p className='text-xs text-muted-foreground line-clamp-2'>
                                {source.description}
                              </p>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                                <MoreVertical className='h-3 w-3' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem onClick={() => handleViewSource(source)}>
                                <Eye className='h-3 w-3 mr-2' />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(source.url, '_blank')}>
                                <ExternalLink className='h-3 w-3 mr-2' />
                                Open Source
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyUrl(source.url)}>
                                <Copy className='h-3 w-3 mr-2' />
                                Copy URL
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleSaveSource(source.id)}>
                                {source.saved ? (
                                  <>
                                    <BookmarkCheck className='h-3 w-3 mr-2' />
                                    Unsave
                                  </>
                                ) : (
                                  <>
                                    <Bookmark className='h-3 w-3 mr-2' />
                                    Save
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Metrics */}
                        <div className='flex items-center space-x-4'>
                          <div className='flex items-center space-x-2'>
                            <span className='text-xs text-muted-foreground'>Relevance:</span>
                            <div className='flex items-center space-x-1'>
                              <Progress value={source.relevanceScore * 100} className='w-12 h-1' />
                              <span className='text-xs font-medium'>
                                {Math.round(source.relevanceScore * 100)}%
                              </span>
                            </div>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <span className='text-xs text-muted-foreground'>Credibility:</span>
                            <div className='flex items-center space-x-1'>
                              <Progress value={source.credibilityScore * 100} className='w-12 h-1' />
                              <span className='text-xs font-medium'>
                                {Math.round(source.credibilityScore * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Tags */}
                        {source.metadata.tags && source.metadata.tags.length > 0 && (
                          <div className='flex flex-wrap gap-1'>
                            {source.metadata.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant='secondary' className='text-xs px-1 py-0'>
                                {tag}
                              </Badge>
                            ))}
                            {source.metadata.tags.length > 3 && (
                              <Badge variant='outline' className='text-xs px-1 py-0'>
                                +{source.metadata.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-2'>
                            {source.saved && (
                              <Badge variant='outline' className='text-xs'>
                                <BookmarkCheck className='h-2 w-2 mr-1' />
                                Saved
                              </Badge>
                            )}
                            {source.cited && (
                              <Badge variant='outline' className='text-xs'>
                                <Star className='h-2 w-2 mr-1' />
                                Cited
                              </Badge>
                            )}
                          </div>
                          <div className='flex items-center space-x-1'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleViewSource(source)}
                              className='h-6 px-2 text-xs'
                            >
                              <Eye className='h-3 w-3 mr-1' />
                              View
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => window.open(source.url, '_blank')}
                              className='h-6 px-2 text-xs'
                            >
                              <ExternalLink className='h-3 w-3 mr-1' />
                              Open
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}

                {filteredSources.length === 0 && (
                  <div className='text-center py-12'>
                    <Search className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                    <h3 className='font-medium mb-2'>No sources found</h3>
                    <p className='text-sm text-muted-foreground'>
                      {searchQuery ? 'Try adjusting your search criteria' : 'Sources will appear as research progresses'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value='saved' className='flex-1 mt-2'>
            <ScrollArea className='h-full'>
              <div className='space-y-2 p-4 pt-0'>
                {sources.filter(s => s.saved).map((source) => (
                  <div key={source.id}>
                    {/* Same source card structure as above */}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value='cited' className='flex-1 mt-2'>
            <ScrollArea className='h-full'>
              <div className='space-y-2 p-4 pt-0'>
                {sources.filter(s => s.cited).map((source) => (
                  <div key={source.id}>
                    {/* Same source card structure as above */}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}