'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ChevronDown,
  ChevronRight,
  Brain,
  Search,
  Settings,
  Save,
  RotateCcw,
  FileText,
  Lightbulb,
  Target,
  Clock,
  Zap,
  BookOpen,
} from 'lucide-react'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

const researchFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  question: z.string().min(1, 'Research question is required').max(1000),
  
  // AI Configuration
  aiProvider: z.string(),
  thinkingModel: z.string(),
  taskModel: z.string(),
  
  // Search Configuration
  searchProvider: z.string(),
  maxResults: z.number().min(1).max(20),
  language: z.string(),
  
  // Advanced Options
  researchDepth: z.enum(['basic', 'intermediate', 'advanced']),
  focusAreas: z.array(z.string()),
  excludeTopics: z.string().optional(),
  timeRange: z.string().optional(),
  includeKnowledge: z.boolean(),
})

type ResearchFormData = z.infer<typeof researchFormSchema>

interface ResearchSession {
  id: string
  title: string
  description?: string
  question: string
  status: 'draft' | 'thinking' | 'planning' | 'researching' | 'writing' | 'completed' | 'paused' | 'failed'
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
  [key: string]: any
}

interface ResearchFormProps {
  session: ResearchSession
  onSessionUpdate: () => void
}

const aiProviders = [
  { value: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
  { value: 'anthropic', label: 'Anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'] },
  { value: 'google', label: 'Google', models: ['gemini-1.5-pro', 'gemini-1.5-flash'] },
]

const searchProviders = [
  { value: 'model', label: 'AI Model Search', icon: '🤖' },
  { value: 'tavily', label: 'Tavily Search', icon: '🔍' },
  { value: 'exa', label: 'Exa Search', icon: '🎯' },
]

const focusAreaOptions = [
  'Market Analysis',
  'Technology Trends',
  'Competitive Intelligence',
  'Academic Research',
  'Industry Reports',
  'News & Current Events',
  'Expert Opinions',
  'Data & Statistics',
  'Case Studies',
  'Best Practices',
]

export function ResearchForm({ session, onSessionUpdate }: ResearchFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    advanced: false,
    ai: false,
    search: false,
    focus: false,
  })

  const form = useForm<ResearchFormData>({
    resolver: zodResolver(researchFormSchema),
    defaultValues: {
      title: session.title,
      description: session.description || '',
      question: session.question,
      aiProvider: session.aiConfig.provider,
      thinkingModel: session.aiConfig.thinkingModel,
      taskModel: session.aiConfig.taskModel,
      searchProvider: session.searchConfig.searchProvider,
      maxResults: session.searchConfig.maxResults,
      language: session.searchConfig.language,
      researchDepth: 'intermediate',
      focusAreas: [],
      excludeTopics: '',
      timeRange: '',
      includeKnowledge: false,
    },
  })

  const selectedProvider = aiProviders.find(p => p.value === form.watch('aiProvider'))
  const canEdit = session.status === 'draft' || session.status === 'paused'

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleSave = async (data: ResearchFormData) => {
    if (!canEdit) return

    setIsSaving(true)
    try {
      const payload = {
        title: data.title,
        description: data.description,
        question: data.question,
        aiConfig: {
          provider: data.aiProvider,
          thinkingModel: data.thinkingModel,
          taskModel: data.taskModel,
        },
        searchConfig: {
          searchProvider: data.searchProvider,
          maxResults: data.maxResults,
          language: data.language,
        },
      }

      const response = await fetch(`/api/research?id=${session.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setIsEditing(false)
        onSessionUpdate()
      } else {
        console.error('Failed to update research session')
      }
    } catch (error) {
      console.error('Error updating research session:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    form.reset()
    setIsEditing(false)
  }

  return (
    <ScrollArea className='h-full'>
      <div className='p-4 space-y-6'>
        {/* Edit Mode Toggle */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Badge variant={canEdit ? 'secondary' : 'outline'} className='text-xs'>
              {session.status}
            </Badge>
            {!canEdit && (
              <span className='text-xs text-muted-foreground'>
                Cannot edit while research is active
              </span>
            )}
          </div>
          {canEdit && !isEditing && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsEditing(true)}
              className='flex items-center space-x-2'
            >
              <Settings className='h-3 w-3' />
              <span>Edit</span>
            </Button>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className='space-y-6'>
            
            {/* Basic Information Section */}
            <Collapsible 
              open={expandedSections.basic} 
              onOpenChange={() => toggleSection('basic')}
            >
              <CollapsibleTrigger className='flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors'>
                <div className='flex items-center space-x-2'>
                  <FileText className='h-4 w-4 text-primary' />
                  <span className='font-medium'>Basic Information</span>
                </div>
                {expandedSections.basic ? 
                  <ChevronDown className='h-4 w-4' /> : 
                  <ChevronRight className='h-4 w-4' />
                }
              </CollapsibleTrigger>
              
              <CollapsibleContent className='space-y-4 mt-4'>
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center space-x-2'>
                        <Target className='h-3 w-3' />
                        <span>Research Title</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditing}
                          placeholder='Enter a descriptive title'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled={!isEditing}
                          placeholder='Provide context and objectives'
                          rows={2}
                        />
                      </FormControl>
                      <FormDescription>
                        Help the AI understand the purpose and scope
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='question'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center space-x-2'>
                        <Lightbulb className='h-3 w-3 text-yellow-500' />
                        <span>Research Question</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled={!isEditing}
                          placeholder='What specific question should the AI research?'
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Be specific and clear. This guides the entire research process.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Advanced Configuration */}
            {isEditing && (
              <>
                <Separator />
                
                <Collapsible 
                  open={expandedSections.advanced} 
                  onOpenChange={() => toggleSection('advanced')}
                >
                  <CollapsibleTrigger className='flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors'>
                    <div className='flex items-center space-x-2'>
                      <Zap className='h-4 w-4 text-orange-500' />
                      <span className='font-medium'>Advanced Options</span>
                    </div>
                    {expandedSections.advanced ? 
                      <ChevronDown className='h-4 w-4' /> : 
                      <ChevronRight className='h-4 w-4' />
                    }
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className='space-y-4 mt-4'>
                    <FormField
                      control={form.control}
                      name='researchDepth'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Research Depth</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select research depth' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='basic'>
                                <div className='flex items-center space-x-2'>
                                  <Badge variant='outline' className='text-xs'>Quick</Badge>
                                  <span>Basic Overview</span>
                                </div>
                              </SelectItem>
                              <SelectItem value='intermediate'>
                                <div className='flex items-center space-x-2'>
                                  <Badge variant='outline' className='text-xs'>Balanced</Badge>
                                  <span>Intermediate Analysis</span>
                                </div>
                              </SelectItem>
                              <SelectItem value='advanced'>
                                <div className='flex items-center space-x-2'>
                                  <Badge variant='outline' className='text-xs'>Deep</Badge>
                                  <span>Comprehensive Study</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='timeRange'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center space-x-2'>
                            <Clock className='h-3 w-3' />
                            <span>Time Range Focus</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select time focus' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='recent'>Recent (Last 6 months)</SelectItem>
                              <SelectItem value='current-year'>Current Year</SelectItem>
                              <SelectItem value='last-year'>Last Year</SelectItem>
                              <SelectItem value='last-5-years'>Last 5 Years</SelectItem>
                              <SelectItem value='historical'>Historical Analysis</SelectItem>
                              <SelectItem value='all'>All Time Periods</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Focus the research on specific time periods
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='excludeTopics'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exclude Topics</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder='Topics or keywords to exclude from research'
                              rows={2}
                            />
                          </FormControl>
                          <FormDescription>
                            Comma-separated list of topics to avoid
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>

                {/* AI Configuration */}
                <Collapsible 
                  open={expandedSections.ai} 
                  onOpenChange={() => toggleSection('ai')}
                >
                  <CollapsibleTrigger className='flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors'>
                    <div className='flex items-center space-x-2'>
                      <Brain className='h-4 w-4 text-blue-500' />
                      <span className='font-medium'>AI Configuration</span>
                    </div>
                    {expandedSections.ai ? 
                      <ChevronDown className='h-4 w-4' /> : 
                      <ChevronRight className='h-4 w-4' />
                    }
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className='space-y-4 mt-4'>
                    <div className='grid grid-cols-1 gap-4'>
                      <FormField
                        control={form.control}
                        name='aiProvider'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>AI Provider</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select AI provider' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {aiProviders.map((provider) => (
                                  <SelectItem key={provider.value} value={provider.value}>
                                    {provider.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='thinkingModel'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Thinking Model</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select thinking model' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {selectedProvider?.models.map((model) => (
                                  <SelectItem key={model} value={model}>
                                    {model}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              For high-level planning and analysis
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='taskModel'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Task Model</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select task model' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {selectedProvider?.models.map((model) => (
                                  <SelectItem key={model} value={model}>
                                    {model}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              For specific tasks and research execution
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Search Configuration */}
                <Collapsible 
                  open={expandedSections.search} 
                  onOpenChange={() => toggleSection('search')}
                >
                  <CollapsibleTrigger className='flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors'>
                    <div className='flex items-center space-x-2'>
                      <Search className='h-4 w-4 text-green-500' />
                      <span className='font-medium'>Search Configuration</span>
                    </div>
                    {expandedSections.search ? 
                      <ChevronDown className='h-4 w-4' /> : 
                      <ChevronRight className='h-4 w-4' />
                    }
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className='space-y-4 mt-4'>
                    <FormField
                      control={form.control}
                      name='searchProvider'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Search Provider</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select search provider' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {searchProviders.map((provider) => (
                                <SelectItem key={provider.value} value={provider.value}>
                                  <div className='flex items-center space-x-2'>
                                    <span>{provider.icon}</span>
                                    <span>{provider.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='maxResults'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Results per Search</FormLabel>
                          <FormControl>
                            <div className='space-y-2'>
                              <Slider
                                min={1}
                                max={20}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className='w-full'
                              />
                              <div className='flex justify-between text-xs text-muted-foreground'>
                                <span>1</span>
                                <span className='font-medium'>{field.value} results</span>
                                <span>20</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            More results = broader coverage but longer processing
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='language'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Research Language</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select language' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='en'>🇺🇸 English</SelectItem>
                              <SelectItem value='es'>🇪🇸 Spanish</SelectItem>
                              <SelectItem value='fr'>🇫🇷 French</SelectItem>
                              <SelectItem value='de'>🇩🇪 German</SelectItem>
                              <SelectItem value='zh'>🇨🇳 Chinese</SelectItem>
                              <SelectItem value='ja'>🇯🇵 Japanese</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>

                {/* Knowledge Integration */}
                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-sm flex items-center space-x-2'>
                      <BookOpen className='h-4 w-4 text-purple-500' />
                      <span>Knowledge Integration</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <FormField
                      control={form.control}
                      name='includeKnowledge'
                      render={({ field }) => (
                        <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                          <div className='space-y-0.5'>
                            <FormLabel className='text-base'>Use Knowledge Base</FormLabel>
                            <FormDescription>
                              Include existing knowledge base content in research
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </>
            )}

            {/* Save Actions */}
            {isEditing && (
              <div className='flex justify-end space-x-3 pt-4 border-t'>
                <Button 
                  type='button' 
                  variant='outline' 
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <RotateCcw className='h-3 w-3 mr-2' />
                  Cancel
                </Button>
                <Button 
                  type='submit' 
                  disabled={isSaving}
                  className='min-w-24'
                >
                  {isSaving ? (
                    <div className='flex items-center space-x-2'>
                      <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white'></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className='flex items-center space-x-2'>
                      <Save className='h-3 w-3' />
                      <span>Save</span>
                    </div>
                  )}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </div>
    </ScrollArea>
  )
}