'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Network,
  Maximize2,
  Minimize2,
  RotateCcw,
  Download,
  Search,
  Filter,
  Zap,
  FileText,
  ExternalLink,
  Play,
  Pause,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ResearchSession {
  id: string
  title: string
  status: 'draft' | 'thinking' | 'planning' | 'researching' | 'writing' | 'completed' | 'paused' | 'failed'
  knowledgeGraph?: string
  [key: string]: any
}

interface GraphNode {
  id: string
  label: string
  type: 'topic' | 'concept' | 'source' | 'finding' | 'question'
  size: number
  color: string
  data: {
    description?: string
    source?: string
    url?: string
    confidence?: number
    relevance?: number
  }
}

interface GraphEdge {
  from: string
  to: string
  label?: string
  type: 'relates_to' | 'supports' | 'contradicts' | 'derives_from' | 'answers'
  weight: number
  color: string
}

interface KnowledgeGraphProps {
  session: ResearchSession
  knowledgeGraph?: string
}

const nodeTypeConfig = {
  topic: { color: '#3b82f6', icon: '🏷️', label: 'Topic' },
  concept: { color: '#8b5cf6', icon: '💡', label: 'Concept' },
  source: { color: '#10b981', icon: '📄', label: 'Source' },
  finding: { color: '#f59e0b', icon: '🔍', label: 'Finding' },
  question: { color: '#ef4444', icon: '❓', label: 'Question' },
}

const edgeTypeConfig = {
  relates_to: { color: '#6b7280', label: 'Related to' },
  supports: { color: '#10b981', label: 'Supports' },
  contradicts: { color: '#ef4444', label: 'Contradicts' },
  derives_from: { color: '#8b5cf6', label: 'Derived from' },
  answers: { color: '#3b82f6', label: 'Answers' },
}

// Mock data generator for demonstration
const generateMockGraphData = (sessionId: string) => {
  const nodes: GraphNode[] = [
    {
      id: 'main-topic',
      label: 'AI Research Trends',
      type: 'topic',
      size: 30,
      color: nodeTypeConfig.topic.color,
      data: {
        description: 'Main research topic focusing on current AI trends',
        relevance: 1.0,
        confidence: 0.95,
      },
    },
    {
      id: 'llm-progress',
      label: 'Large Language Models',
      type: 'concept',
      size: 25,
      color: nodeTypeConfig.concept.color,
      data: {
        description: 'Recent developments in LLM technology',
        relevance: 0.9,
        confidence: 0.88,
      },
    },
    {
      id: 'multimodal-ai',
      label: 'Multimodal AI',
      type: 'concept',
      size: 22,
      color: nodeTypeConfig.concept.color,
      data: {
        description: 'AI systems that process multiple types of data',
        relevance: 0.85,
        confidence: 0.82,
      },
    },
    {
      id: 'source-1',
      label: 'OpenAI Research Paper',
      type: 'source',
      size: 18,
      color: nodeTypeConfig.source.color,
      data: {
        description: 'Recent paper on GPT architecture improvements',
        source: 'OpenAI',
        url: 'https://openai.com/research/gpt-4',
        confidence: 0.92,
      },
    },
    {
      id: 'finding-1',
      label: 'Performance Gains',
      type: 'finding',
      size: 20,
      color: nodeTypeConfig.finding.color,
      data: {
        description: '40% improvement in reasoning tasks',
        confidence: 0.87,
        relevance: 0.9,
      },
    },
    {
      id: 'question-1',
      label: 'Scalability Concerns',
      type: 'question',
      size: 16,
      color: nodeTypeConfig.question.color,
      data: {
        description: 'How will these improvements scale with larger models?',
        confidence: 0.65,
      },
    },
  ]

  const edges: GraphEdge[] = [
    {
      from: 'main-topic',
      to: 'llm-progress',
      type: 'relates_to',
      weight: 0.9,
      color: edgeTypeConfig.relates_to.color,
    },
    {
      from: 'main-topic',
      to: 'multimodal-ai',
      type: 'relates_to',
      weight: 0.8,
      color: edgeTypeConfig.relates_to.color,
    },
    {
      from: 'llm-progress',
      to: 'source-1',
      type: 'derives_from',
      weight: 0.85,
      color: edgeTypeConfig.derives_from.color,
    },
    {
      from: 'source-1',
      to: 'finding-1',
      type: 'supports',
      weight: 0.92,
      color: edgeTypeConfig.supports.color,
    },
    {
      from: 'finding-1',
      to: 'question-1',
      type: 'relates_to',
      weight: 0.7,
      color: edgeTypeConfig.relates_to.color,
    },
  ]

  return { nodes, edges }
}

export function KnowledgeGraph({ session, knowledgeGraph }: KnowledgeGraphProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNodeType, setSelectedNodeType] = useState<string>('all')
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [viewMode, setViewMode] = useState<'graph' | 'tree' | 'force'>('graph')
  const graphRef = useRef<HTMLDivElement>(null)

  // Generate or parse graph data
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({
    nodes: [],
    edges: [],
  })

  useEffect(() => {
    if (knowledgeGraph) {
      try {
        const parsed = JSON.parse(knowledgeGraph)
        setGraphData(parsed)
      } catch (error) {
        console.error('Error parsing knowledge graph:', error)
        setGraphData(generateMockGraphData(session.id))
      }
    } else {
      setGraphData(generateMockGraphData(session.id))
    }
  }, [knowledgeGraph, session.id])

  // Filter nodes based on search and type
  const filteredNodes = graphData.nodes.filter((node) => {
    const matchesSearch = node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.data.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedNodeType === 'all' || node.type === selectedNodeType
    return matchesSearch && matchesType
  })

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node)
  }

  const handleResetView = () => {
    setSearchQuery('')
    setSelectedNodeType('all')
    setSelectedNode(null)
  }

  const handleExportGraph = () => {
    // Export functionality would go here
    console.log('Exporting graph data:', graphData)
  }

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating)
  }

  const getNodeStats = () => {
    const stats = {
      total: graphData.nodes.length,
      topics: graphData.nodes.filter(n => n.type === 'topic').length,
      concepts: graphData.nodes.filter(n => n.type === 'concept').length,
      sources: graphData.nodes.filter(n => n.type === 'source').length,
      findings: graphData.nodes.filter(n => n.type === 'finding').length,
      questions: graphData.nodes.filter(n => n.type === 'question').length,
    }
    return stats
  }

  const stats = getNodeStats()

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* Header */}
      <div className='p-4 border-b'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-2'>
            <Network className='h-4 w-4 text-primary' />
            <h3 className='font-medium'>Knowledge Graph</h3>
            <Badge variant='secondary' className='text-xs'>
              {stats.total} nodes
            </Badge>
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={toggleAnimation}
              className='h-7 w-7 p-0'
            >
              {isAnimating ? <Pause className='h-3 w-3' /> : <Play className='h-3 w-3' />}
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleExportGraph}
              className='h-7 w-7 p-0'
            >
              <Download className='h-3 w-3' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setIsFullscreen(!isFullscreen)}
              className='h-7 w-7 p-0'
            >
              {isFullscreen ? <Minimize2 className='h-3 w-3' /> : <Maximize2 className='h-3 w-3' />}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className='flex items-center space-x-2 mb-3'>
          <div className='relative flex-1'>
            <Search className='absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground' />
            <Input
              placeholder='Search nodes...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-7 h-8 text-xs'
            />
          </div>
          <Select value={selectedNodeType} onValueChange={setSelectedNodeType}>
            <SelectTrigger className='w-32 h-8 text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              {Object.entries(nodeTypeConfig).map(([type, config]) => (
                <SelectItem key={type} value={type}>
                  <div className='flex items-center space-x-2'>
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant='outline'
            size='sm'
            onClick={handleResetView}
            className='h-8 px-2'
          >
            <RotateCcw className='h-3 w-3' />
          </Button>
        </div>

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
          <TabsList className='grid w-full grid-cols-3 h-8'>
            <TabsTrigger value='graph' className='text-xs'>Graph</TabsTrigger>
            <TabsTrigger value='tree' className='text-xs'>Tree</TabsTrigger>
            <TabsTrigger value='force' className='text-xs'>Force</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className='flex-1 flex overflow-hidden'>
        {/* Main Graph Area */}
        <div className='flex-1 relative'>
          <div
            ref={graphRef}
            className='w-full h-full bg-muted/20 rounded-lg border-2 border-dashed border-muted flex items-center justify-center'
          >
            {session.status === 'completed' ? (
              <div className='text-center space-y-4'>
                <Network className='h-16 w-16 text-muted-foreground mx-auto' />
                <div>
                  <h3 className='font-medium text-lg mb-2'>Interactive Knowledge Graph</h3>
                  <p className='text-sm text-muted-foreground mb-4'>
                    Explore the connections between research topics, sources, and findings
                  </p>
                  <div className='grid grid-cols-2 gap-4 max-w-md mx-auto text-xs'>
                    <div className='text-center'>
                      <div className='font-semibold text-blue-600'>{stats.concepts}</div>
                      <div className='text-muted-foreground'>Concepts</div>
                    </div>
                    <div className='text-center'>
                      <div className='font-semibold text-green-600'>{stats.sources}</div>
                      <div className='text-muted-foreground'>Sources</div>
                    </div>
                    <div className='text-center'>
                      <div className='font-semibold text-yellow-600'>{stats.findings}</div>
                      <div className='text-muted-foreground'>Findings</div>
                    </div>
                    <div className='text-center'>
                      <div className='font-semibold text-red-600'>{stats.questions}</div>
                      <div className='text-muted-foreground'>Questions</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className='text-center space-y-4'>
                <Network className='h-12 w-12 text-muted-foreground mx-auto' />
                <div>
                  <h3 className='font-medium'>Knowledge Graph</h3>
                  <p className='text-sm text-muted-foreground'>
                    Graph will be built as research progresses
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Floating Controls */}
          <div className='absolute bottom-4 right-4 flex flex-col space-y-2'>
            <Button
              variant='secondary'
              size='sm'
              onClick={() => setViewMode('graph')}
              className={`h-8 w-8 p-0 ${viewMode === 'graph' ? 'bg-primary text-primary-foreground' : ''}`}
            >
              <Network className='h-3 w-3' />
            </Button>
            <Button
              variant='secondary'
              size='sm'
              onClick={handleResetView}
              className='h-8 w-8 p-0'
            >
              <RotateCcw className='h-3 w-3' />
            </Button>
          </div>
        </div>

        {/* Side Panel */}
        <div className='w-80 border-l flex flex-col'>
          <div className='p-4 border-b'>
            <h4 className='font-medium text-sm'>Node Details</h4>
          </div>
          
          <ScrollArea className='flex-1'>
            <div className='p-4'>
              {selectedNode ? (
                <div className='space-y-4'>
                  <div className='flex items-start space-x-3'>
                    <div
                      className='w-3 h-3 rounded-full mt-1'
                      style={{ backgroundColor: selectedNode.color }}
                    />
                    <div className='flex-1'>
                      <h4 className='font-medium text-sm'>{selectedNode.label}</h4>
                      <Badge variant='outline' className='text-xs mt-1'>
                        {nodeTypeConfig[selectedNode.type].icon} {nodeTypeConfig[selectedNode.type].label}
                      </Badge>
                    </div>
                  </div>

                  {selectedNode.data.description && (
                    <div>
                      <h5 className='text-xs font-medium mb-1'>Description</h5>
                      <p className='text-xs text-muted-foreground'>
                        {selectedNode.data.description}
                      </p>
                    </div>
                  )}

                  {selectedNode.data.confidence && (
                    <div>
                      <h5 className='text-xs font-medium mb-1'>Confidence</h5>
                      <div className='flex items-center space-x-2'>
                        <div className='flex-1 h-2 bg-muted rounded-full overflow-hidden'>
                          <div
                            className='h-full bg-primary rounded-full'
                            style={{ width: `${selectedNode.data.confidence * 100}%` }}
                          />
                        </div>
                        <span className='text-xs text-muted-foreground'>
                          {Math.round(selectedNode.data.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedNode.data.url && (
                    <div>
                      <h5 className='text-xs font-medium mb-1'>Source</h5>
                      <Button
                        variant='outline'
                        size='sm'
                        className='w-full justify-start text-xs'
                        onClick={() => window.open(selectedNode.data.url, '_blank')}
                      >
                        <ExternalLink className='h-3 w-3 mr-2' />
                        View Source
                      </Button>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <h5 className='text-xs font-medium mb-2'>Connections</h5>
                    <div className='space-y-2'>
                      {graphData.edges
                        .filter(edge => edge.from === selectedNode.id || edge.to === selectedNode.id)
                        .map((edge, index) => {
                          const connectedNodeId = edge.from === selectedNode.id ? edge.to : edge.from
                          const connectedNode = graphData.nodes.find(n => n.id === connectedNodeId)
                          if (!connectedNode) return null

                          return (
                            <div
                              key={index}
                              className='flex items-center space-x-2 p-2 bg-muted/50 rounded text-xs cursor-pointer hover:bg-muted'
                              onClick={() => handleNodeClick(connectedNode)}
                            >
                              <div
                                className='w-2 h-2 rounded-full'
                                style={{ backgroundColor: connectedNode.color }}
                              />
                              <span className='flex-1'>{connectedNode.label}</span>
                              <Badge variant='outline' className='text-xs'>
                                {edgeTypeConfig[edge.type].label}
                              </Badge>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className='text-center space-y-4'>
                  <div className='text-muted-foreground'>
                    <Network className='h-8 w-8 mx-auto mb-2' />
                    <p className='text-sm'>Select a node to view details</p>
                  </div>
                  
                  {/* Node Type Legend */}
                  <div className='space-y-2'>
                    <h5 className='text-xs font-medium'>Node Types</h5>
                    {Object.entries(nodeTypeConfig).map(([type, config]) => (
                      <div key={type} className='flex items-center space-x-2 text-xs'>
                        <div
                          className='w-2 h-2 rounded-full'
                          style={{ backgroundColor: config.color }}
                        />
                        <span>{config.icon} {config.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}