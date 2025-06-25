'use client'

import { useState, useEffect } from 'react'
import {
  BookOpen,
  Search,
  Plus,
  FileText,
  Upload,
  X,
  ExternalLink,
  Filter,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useKnowledgeBasesList } from '@/hooks/use-knowledge'

interface KnowledgeBase {
  id: string
  name: string
  description?: string
  tokenCount: number
  documentCount?: number
  embeddingModel: string
  createdAt: string
  updatedAt: string
}

interface SearchResult {
  id: string
  content: string
  similarity: number
  documentName: string
  knowledgeBaseName: string
  metadata?: any
}

interface KnowledgePanelProps {
  sessionId: string
  workspaceId: string
  onKnowledgeUpdate?: () => void
}

export function KnowledgePanel({ sessionId, workspaceId, onKnowledgeUpdate }: KnowledgePanelProps) {
  const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [expandedBases, setExpandedBases] = useState<Set<string>>(new Set())

  const { 
    knowledgeBases = [], 
    isLoading: isLoadingKnowledgeBases 
  } = useKnowledgeBasesList()

  // Search across selected knowledge bases
  const handleSearch = async () => {
    if (!searchQuery.trim() || selectedKnowledgeBases.length === 0) return

    setIsSearching(true)
    try {
      const response = await fetch('/api/knowledge/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          knowledgeBaseIds: selectedKnowledgeBases,
          topK: 10,
          similarityThreshold: 0.7,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
      }
    } catch (error) {
      console.error('Error searching knowledge:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Toggle knowledge base selection
  const toggleKnowledgeBase = (kbId: string) => {
    setSelectedKnowledgeBases(prev =>
      prev.includes(kbId)
        ? prev.filter(id => id !== kbId)
        : [...prev, kbId]
    )
  }

  // Toggle expanded state for knowledge base
  const toggleExpanded = (kbId: string) => {
    setExpandedBases(prev => {
      const newSet = new Set(prev)
      if (newSet.has(kbId)) {
        newSet.delete(kbId)
      } else {
        newSet.add(kbId)
      }
      return newSet
    })
  }

  // Handle Enter key in search input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Clear search results
  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
  }

  // Format file size
  const formatTokenCount = (count: number) => {
    if (count < 1000) return `${count} tokens`
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K tokens`
    return `${(count / 1000000).toFixed(1)}M tokens`
  }

  return (
    <div className='h-full flex flex-col space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <BookOpen className='h-5 w-5 text-primary' />
          <h3 className='font-semibold'>Knowledge Base</h3>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size='sm' variant='outline'>
              <Upload className='h-4 w-4 mr-2' />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
              <DialogDescription>
                Upload files to attach to this research session
              </DialogDescription>
            </DialogHeader>
            <div className='p-4'>
              <p className='text-sm text-muted-foreground'>
                File upload functionality will be integrated here.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue='browse' className='flex-1 flex flex-col'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='browse'>Browse</TabsTrigger>
          <TabsTrigger value='search'>Search</TabsTrigger>
        </TabsList>

        {/* Browse Knowledge Bases */}
        <TabsContent value='browse' className='flex-1 flex flex-col space-y-3'>
          {isLoadingKnowledgeBases ? (
            <div className='flex items-center justify-center p-8'>
              <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
            </div>
          ) : knowledgeBases.length === 0 ? (
            <div className='text-center p-8 text-muted-foreground'>
              <BookOpen className='h-8 w-8 mx-auto mb-2 opacity-50' />
              <p className='text-sm'>No knowledge bases found</p>
            </div>
          ) : (
            <ScrollArea className='flex-1'>
              <div className='space-y-2'>
                {knowledgeBases.map((kb: KnowledgeBase) => (
                  <Card key={kb.id} className='p-3'>
                    <div className='space-y-2'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1 space-y-1'>
                          <div className='flex items-center space-x-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-6 w-6 p-0'
                              onClick={() => toggleExpanded(kb.id)}
                            >
                              {expandedBases.has(kb.id) ? (
                                <ChevronDown className='h-3 w-3' />
                              ) : (
                                <ChevronRight className='h-3 w-3' />
                              )}
                            </Button>
                            <h4 className='font-medium text-sm leading-none'>{kb.name}</h4>
                          </div>
                          {kb.description && (
                            <p className='text-xs text-muted-foreground line-clamp-2'>
                              {kb.description}
                            </p>
                          )}
                        </div>
                        <div className='flex items-center space-x-2'>
                          <Button
                            size='sm'
                            variant={selectedKnowledgeBases.includes(kb.id) ? 'default' : 'outline'}
                            onClick={() => toggleKnowledgeBase(kb.id)}
                            className='h-7 text-xs'
                          >
                            {selectedKnowledgeBases.includes(kb.id) ? 'Selected' : 'Select'}
                          </Button>
                        </div>
                      </div>

                      <div className='flex items-center space-x-2 text-xs text-muted-foreground'>
                        <Badge variant='secondary' className='text-xs'>
                          {formatTokenCount(kb.tokenCount)}
                        </Badge>
                        <span>•</span>
                        <span>{kb.embeddingModel}</span>
                      </div>

                      {expandedBases.has(kb.id) && (
                        <Collapsible open={true}>
                          <CollapsibleContent>
                            <div className='pt-2 space-y-2'>
                              <Separator />
                              <div className='text-xs text-muted-foreground'>
                                <p>Created: {new Date(kb.createdAt).toLocaleDateString()}</p>
                                <p>Updated: {new Date(kb.updatedAt).toLocaleDateString()}</p>
                              </div>
                              <Button
                                size='sm'
                                variant='ghost'
                                className='h-7 text-xs'
                                onClick={() => window.open(`/w/knowledge/${kb.id}`, '_blank')}
                              >
                                <ExternalLink className='h-3 w-3 mr-1' />
                                View Details
                              </Button>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Selected Knowledge Bases Summary */}
          {selectedKnowledgeBases.length > 0 && (
            <div className='border-t pt-3'>
              <div className='flex items-center justify-between mb-2'>
                <p className='text-sm font-medium'>
                  Selected ({selectedKnowledgeBases.length})
                </p>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => setSelectedKnowledgeBases([])}
                  className='h-6 text-xs'
                >
                  Clear All
                </Button>
              </div>
              <div className='flex flex-wrap gap-1'>
                {selectedKnowledgeBases.map(kbId => {
                  const kb = knowledgeBases.find((k: KnowledgeBase) => k.id === kbId)
                  return kb ? (
                    <Badge key={kbId} variant='secondary' className='text-xs'>
                      {kb.name}
                      <Button
                        size='sm'
                        variant='ghost'
                        className='h-3 w-3 p-0 ml-1'
                        onClick={() => toggleKnowledgeBase(kbId)}
                      >
                        <X className='h-2 w-2' />
                      </Button>
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Search Knowledge */}
        <TabsContent value='search' className='flex-1 flex flex-col space-y-3'>
          <div className='space-y-2'>
            <div className='flex space-x-2'>
              <Input
                placeholder='Search knowledge...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className='flex-1'
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim() || selectedKnowledgeBases.length === 0}
                size='sm'
              >
                {isSearching ? (
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                ) : (
                  <Search className='h-4 w-4' />
                )}
              </Button>
            </div>

            {selectedKnowledgeBases.length === 0 && (
              <p className='text-xs text-muted-foreground'>
                Select knowledge bases to search
              </p>
            )}
          </div>

          {/* Search Results */}
          <ScrollArea className='flex-1'>
            {searchResults.length > 0 ? (
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-medium'>
                    {searchResults.length} results
                  </p>
                  <Button size='sm' variant='ghost' onClick={clearSearch} className='h-6 text-xs'>
                    Clear
                  </Button>
                </div>
                {searchResults.map((result, index) => (
                  <Card key={index} className='p-3'>
                    <div className='space-y-2'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <p className='text-sm leading-relaxed'>{result.content}</p>
                        </div>
                        <Badge variant='outline' className='text-xs ml-2'>
                          {Math.round(result.similarity * 100)}%
                        </Badge>
                      </div>
                      <div className='flex items-center space-x-2 text-xs text-muted-foreground'>
                        <FileText className='h-3 w-3' />
                        <span>{result.documentName}</span>
                        <span>•</span>
                        <span>{result.knowledgeBaseName}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : searchQuery && !isSearching ? (
              <div className='text-center p-8 text-muted-foreground'>
                <Search className='h-8 w-8 mx-auto mb-2 opacity-50' />
                <p className='text-sm'>No results found</p>
              </div>
            ) : null}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}