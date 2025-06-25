'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Play, Zap, FileText, TrendingUp, Code, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useSidebarStore } from '@/stores/sidebar/store'
import { createLogger } from '@/lib/logs/console-logger'

const logger = createLogger('EmbeddedResearchDemo')

interface DemoUseCase {
  id: string
  title: string
  description: string
  category: string
  question: string
  expectedOutputs: string[]
  estimatedTime: string
  complexity: 'Beginner' | 'Intermediate' | 'Advanced'
  icon: React.ReactNode
  demoQuery?: string
  sampleKnowledge?: string[]
}

const DEMO_USE_CASES: DemoUseCase[] = [
  {
    id: 'ai-trends-2024',
    title: 'AI Industry Trends Analysis 2024',
    description: 'Comprehensive market analysis of artificial intelligence trends, key players, and future predictions for 2024.',
    category: 'Market Research',
    question: 'What are the major AI industry trends in 2024, key market players, technological breakthroughs, and future predictions?',
    expectedOutputs: [
      'Market size and growth projections',
      'Key technological breakthroughs',
      'Major industry players and their strategies',
      'Emerging use cases and applications',
      'Investment trends and funding patterns',
      'Regulatory landscape and challenges'
    ],
    estimatedTime: '15-20 minutes',
    complexity: 'Intermediate',
    icon: <TrendingUp className='h-6 w-6' />,
    demoQuery: 'AI industry trends 2024 market analysis technological breakthroughs key players',
    sampleKnowledge: [
      'AI Market Reports 2024',
      'Technology Investment Trends',
      'Industry Analysis Documents'
    ]
  },
  {
    id: 'nextjs-vs-react',
    title: 'Next.js vs React Framework Comparison',
    description: 'Technical comparison of Next.js against other React frameworks, covering performance, features, and use cases.',
    category: 'Technical Analysis',
    question: 'How does Next.js compare to other React frameworks like Nuxt.js, Gatsby, and Remix in terms of performance, features, developer experience, and ideal use cases?',
    expectedOutputs: [
      'Performance benchmarks and comparisons',
      'Feature set analysis',
      'Developer experience evaluation',
      'Use case recommendations',
      'Learning curve assessment',
      'Community and ecosystem comparison'
    ],
    estimatedTime: '10-15 minutes',
    complexity: 'Advanced',
    icon: <Code className='h-6 w-6' />,
    demoQuery: 'Next.js vs React frameworks comparison Nuxt Gatsby Remix performance features',
    sampleKnowledge: [
      'React Framework Documentation',
      'Performance Benchmarks',
      'Developer Survey Results'
    ]
  },
  {
    id: 'climate-change-impacts',
    title: 'Climate Change Economic Impacts',
    description: 'Academic research on the economic impacts of climate change across different sectors and regions.',
    category: 'Academic Research',
    question: 'What are the current and projected economic impacts of climate change on different sectors (agriculture, energy, finance) and geographical regions?',
    expectedOutputs: [
      'Sector-specific impact analysis',
      'Regional economic projections',
      'Cost-benefit analysis of mitigation strategies',
      'Policy recommendations',
      'Timeline of expected changes',
      'Risk assessment frameworks'
    ],
    estimatedTime: '20-25 minutes',
    complexity: 'Advanced',
    icon: <FileText className='h-6 w-6' />,
    demoQuery: 'climate change economic impacts sectors agriculture energy finance regional analysis',
    sampleKnowledge: [
      'IPCC Climate Reports',
      'Economic Impact Studies',
      'Sector Analysis Documents'
    ]
  },
  {
    id: 'competitor-analysis',
    title: 'SaaS Competitor Analysis',
    description: 'Business intelligence research on SaaS competitors, market positioning, and strategic opportunities.',
    category: 'Business Intelligence',
    question: 'Analyze the competitive landscape for project management SaaS tools, including market leaders, pricing strategies, feature differentiation, and market opportunities.',
    expectedOutputs: [
      'Competitive landscape overview',
      'Pricing strategy analysis',
      'Feature comparison matrix',
      'Market positioning insights',
      'SWOT analysis of key players',
      'Opportunity identification'
    ],
    estimatedTime: '12-18 minutes',
    complexity: 'Intermediate',
    icon: <Lightbulb className='h-6 w-6' />,
    demoQuery: 'project management SaaS competitors pricing features market analysis opportunities',
    sampleKnowledge: [
      'SaaS Market Reports',
      'Competitor Product Documentation',
      'Industry Analysis'
    ]
  }
]

export default function EmbeddedResearchDemoPage() {
  const router = useRouter()
  const { mode, isExpanded } = useSidebarStore()
  const [selectedUseCase, setSelectedUseCase] = useState<DemoUseCase | null>(null)

  const isSidebarCollapsed = mode === 'expanded' ? !isExpanded : mode === 'collapsed' || mode === 'hover'

  const startDemo = (useCase: DemoUseCase) => {
    logger.info('Starting demo use case', { useCaseId: useCase.id, title: useCase.title })
    
    // Encode the demo data to pass to the embedded research page
    const demoData = encodeURIComponent(JSON.stringify({
      question: useCase.question,
      title: `Demo: ${useCase.title}`,
      category: useCase.category,
      isDemo: true,
      useCaseId: useCase.id
    }))
    
    // Navigate to embedded research with demo parameters
    router.push(`/w/research/embedded?demo=${demoData}`)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Market Research': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'Technical Analysis': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'Academic Research': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'Business Intelligence': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
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
              onClick={() => router.push('/w/research/embedded')}
              className='flex items-center space-x-2'
            >
              <ArrowLeft className='h-4 w-4' />
              <span>Back to Research</span>
            </Button>
            
            <Separator orientation='vertical' className='h-6' />
            
            <div className='flex items-center space-x-3'>
              <Zap className='h-5 w-5 text-primary' />
              <div>
                <h1 className='font-semibold'>Deep Research Demo</h1>
                <p className='text-sm text-muted-foreground'>Try sample use cases</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 overflow-auto p-6'>
        <div className='max-w-6xl mx-auto space-y-6'>
          {/* Introduction */}
          <div className='text-center space-y-4'>
            <h2 className='text-3xl font-bold'>Experience Deep Research</h2>
            <p className='text-lg text-muted-foreground max-w-3xl mx-auto'>
              Explore the power of AI-driven research with these curated use cases. Each demo showcases different types of research 
              from market analysis to technical comparisons, demonstrating the full capabilities of our Deep Research platform.
            </p>
          </div>

          {/* Use Cases Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {DEMO_USE_CASES.map((useCase) => (
              <Card key={useCase.id} className='relative group hover:shadow-lg transition-shadow'>
                <CardHeader className='pb-4'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='p-2 rounded-lg bg-primary/10'>
                        {useCase.icon}
                      </div>
                      <div className='space-y-1'>
                        <CardTitle className='text-lg'>{useCase.title}</CardTitle>
                        <div className='flex items-center space-x-2'>
                          <Badge variant='secondary' className={`text-xs ${getCategoryColor(useCase.category)}`}>
                            {useCase.category}
                          </Badge>
                          <Badge variant='outline' className={`text-xs ${getComplexityColor(useCase.complexity)}`}>
                            {useCase.complexity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className='space-y-4'>
                  <CardDescription className='text-sm leading-relaxed'>
                    {useCase.description}
                  </CardDescription>
                  
                  <div className='space-y-3'>
                    <div>
                      <h4 className='text-sm font-medium mb-2'>Research Question:</h4>
                      <p className='text-xs text-muted-foreground italic bg-muted/50 p-2 rounded'>
                        "{useCase.question}"
                      </p>
                    </div>
                    
                    <div>
                      <h4 className='text-sm font-medium mb-2'>Expected Outputs:</h4>
                      <ul className='text-xs text-muted-foreground space-y-1'>
                        {useCase.expectedOutputs.slice(0, 3).map((output, index) => (
                          <li key={index} className='flex items-center space-x-2'>
                            <div className='w-1 h-1 rounded-full bg-primary' />
                            <span>{output}</span>
                          </li>
                        ))}
                        {useCase.expectedOutputs.length > 3 && (
                          <li className='text-xs text-muted-foreground/70'>
                            +{useCase.expectedOutputs.length - 3} more insights...
                          </li>
                        )}
                      </ul>
                    </div>
                    
                    <div className='flex items-center justify-between pt-2'>
                      <span className='text-xs text-muted-foreground'>
                        Est. time: {useCase.estimatedTime}
                      </span>
                      <Button 
                        onClick={() => startDemo(useCase)}
                        size='sm'
                        className='group-hover:bg-primary group-hover:text-primary-foreground transition-colors'
                      >
                        <Play className='h-3 w-3 mr-2' />
                        Try Demo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* How it Works */}
          <div className='mt-12 p-6 bg-muted/50 rounded-lg'>
            <h3 className='text-xl font-semibold mb-4 text-center'>How Deep Research Works</h3>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              {[
                { step: '1', title: 'Question Analysis', desc: 'AI analyzes your research question and breaks it down into focused sub-topics' },
                { step: '2', title: 'Information Gathering', desc: 'Searches multiple sources and knowledge bases to collect relevant information' },
                { step: '3', title: 'Content Synthesis', desc: 'Processes and synthesizes information from various sources into coherent insights' },
                { step: '4', title: 'Report Generation', desc: 'Produces comprehensive reports with citations, analysis, and actionable recommendations' }
              ].map((item) => (
                <div key={item.step} className='text-center space-y-2'>
                  <div className='w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold mx-auto'>
                    {item.step}
                  </div>
                  <h4 className='font-medium text-sm'>{item.title}</h4>
                  <p className='text-xs text-muted-foreground'>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}