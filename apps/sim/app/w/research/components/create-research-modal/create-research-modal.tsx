'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Brain,
  ChevronDown,
  ChevronRight,
  Search,
  Settings,
  Sparkles,
  BookOpen,
  Plus,
  X,
  Lightbulb,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

const createResearchSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  question: z.string().min(1, 'Research question is required').max(1000, 'Question must be less than 1000 characters'),
  
  // Research Configuration (simplified)
  maxResults: z.number().min(1).max(20).default(10),
  language: z.string().default('en'),
  estimatedDuration: z.number().min(5).max(180).default(30),
  includeKnowledge: z.boolean().default(false),
  researchDepth: z.enum(['basic', 'intermediate', 'advanced']).default('intermediate'),
})

type CreateResearchFormData = z.infer<typeof createResearchSchema>

interface CreateResearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  workspaceId: string
}


const researchTemplates = [
  {
    id: 'market-research',
    title: 'Market Research',
    description: 'Analyze market trends, competitors, and opportunities',
    question: 'What are the current market trends and opportunities in [industry/market]?',
    icon: '📊',
  },
  {
    id: 'technology-analysis',
    title: 'Technology Analysis',
    description: 'Research emerging technologies and their implications',
    question: 'What are the latest developments and future prospects of [technology]?',
    icon: '🔬',
  },
  {
    id: 'competitive-analysis',
    title: 'Competitive Analysis',
    description: 'Study competitors and market positioning',
    question: 'How do competitors in [industry] position themselves and what are their strategies?',
    icon: '🎯',
  },
  {
    id: 'academic-research',
    title: 'Academic Research',
    description: 'Conduct scholarly research on any topic',
    question: 'What does the current research say about [topic] and what are the key findings?',
    icon: '🎓',
  },
]

export function CreateResearchModal({ open, onOpenChange, onSuccess, workspaceId }: CreateResearchModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mode, setMode] = useState<'template' | 'custom'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const form = useForm<CreateResearchFormData>({
    resolver: zodResolver(createResearchSchema),
    defaultValues: {
      title: '',
      description: '',
      question: '',
      maxResults: 10,
      language: 'en',
      estimatedDuration: 30,
      includeKnowledge: false,
      researchDepth: 'intermediate',
    },
  })


  const handleTemplateSelect = (template: typeof researchTemplates[0]) => {
    setSelectedTemplate(template.id)
    form.setValue('title', template.title)
    form.setValue('description', template.description)
    form.setValue('question', template.question)
    setMode('custom')
  }

  const handleSubmit = async (data: CreateResearchFormData) => {
    if (!workspaceId) {
      console.error('No workspace ID provided')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        title: data.title,
        description: data.description,
        question: data.question,
        workspaceId,
        // Use standardized configuration
        aiConfig: {
          provider: 'openai',
          thinkingModel: 'gpt-4o',
          taskModel: 'gpt-4o',
        },
        searchConfig: {
          searchProvider: 'tavily',
          maxResults: data.maxResults,
          language: data.language,
        },
      }

      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to create research session')
      }

      const result = await response.json()
      
      if (result.success) {
        form.reset()
        setMode('template')
        setSelectedTemplate(null)
        setIsAdvancedOpen(false)
        onSuccess()
      } else {
        throw new Error(result.error || 'Failed to create research session')
      }
    } catch (error) {
      console.error('Error creating research session:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset()
      setMode('template')
      setSelectedTemplate(null)
      setIsAdvancedOpen(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            <Brain className='h-5 w-5 text-primary' />
            <span>Create New Research Session</span>
          </DialogTitle>
          <DialogDescription>
            Start a comprehensive AI-powered research session on any topic
          </DialogDescription>
        </DialogHeader>

        {mode === 'template' && (
          <div className='space-y-6'>
            {/* Mode Toggle */}
            <div className='flex items-center justify-center space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setMode('custom')}
                className='flex items-center space-x-2'
              >
                <Plus className='h-4 w-4' />
                <span>Start from Scratch</span>
              </Button>
            </div>

            {/* Research Templates */}
            <div className='space-y-3'>
              <h3 className='text-sm font-medium text-muted-foreground'>Choose a Research Template</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {researchTemplates.map((template) => (
                  <div
                    key={template.id}
                    className='relative p-4 border rounded-lg cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors'
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className='flex items-start space-x-3'>
                      <div className='text-2xl'>{template.icon}</div>
                      <div className='flex-1 space-y-1'>
                        <h4 className='font-medium text-sm'>{template.title}</h4>
                        <p className='text-xs text-muted-foreground line-clamp-2'>
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {mode === 'custom' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
              {/* Back to Templates */}
              <div className='flex items-center justify-between'>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => setMode('template')}
                  className='text-muted-foreground hover:text-foreground'
                >
                  ← Back to Templates
                </Button>
                {selectedTemplate && (
                  <Badge variant='secondary' className='text-xs'>
                    {researchTemplates.find(t => t.id === selectedTemplate)?.title}
                  </Badge>
                )}
              </div>

              {/* Basic Information */}
              <div className='space-y-4'>
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Research Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter a descriptive title for your research'
                          {...field}
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Provide additional context or objectives for this research'
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Help the AI understand the purpose and scope of your research
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
                        <span>Research Question</span>
                        <Lightbulb className='h-4 w-4 text-yellow-500' />
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='What specific question would you like the AI to research and answer?'
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Be specific and clear. This question will guide the entire research process.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Advanced Configuration */}
              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <CollapsibleTrigger className='flex items-center justify-between w-full p-2 hover:bg-accent rounded-md'>
                  <div className='flex items-center space-x-2'>
                    <Settings className='h-4 w-4' />
                    <span className='font-medium'>Advanced Configuration</span>
                  </div>
                  {isAdvancedOpen ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
                </CollapsibleTrigger>
                <CollapsibleContent className='space-y-4 mt-4'>
                  
                  {/* Search Configuration */}
                  <div className='space-y-4 p-3 border rounded-lg'>
                    <div className='flex items-center space-x-2'>
                      <Search className='h-4 w-4 text-green-500' />
                      <span className='font-medium'>Search Settings</span>
                    </div>

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
                                <span>Current: {field.value}</span>
                                <span>20</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            More results provide broader coverage but take longer to process
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
                              <SelectItem value='en'>English</SelectItem>
                              <SelectItem value='es'>Spanish</SelectItem>
                              <SelectItem value='fr'>French</SelectItem>
                              <SelectItem value='de'>German</SelectItem>
                              <SelectItem value='zh'>Chinese</SelectItem>
                              <SelectItem value='ja'>Japanese</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Research Settings */}
                  <div className='space-y-4 p-3 border rounded-lg'>
                    <div className='flex items-center space-x-2'>
                      <Sparkles className='h-4 w-4 text-purple-500' />
                      <span className='font-medium'>Research Settings</span>
                    </div>

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
                              <SelectItem value='basic'>Basic - Quick overview</SelectItem>
                              <SelectItem value='intermediate'>Intermediate - Balanced analysis</SelectItem>
                              <SelectItem value='advanced'>Advanced - Comprehensive deep dive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='estimatedDuration'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Duration (minutes)</FormLabel>
                          <FormControl>
                            <div className='space-y-2'>
                              <Slider
                                min={5}
                                max={180}
                                step={5}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className='w-full'
                              />
                              <div className='flex justify-between text-xs text-muted-foreground'>
                                <span>5min</span>
                                <span>Current: {field.value}min</span>
                                <span>3hrs</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Estimated time for the research to complete
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='includeKnowledge'
                      render={({ field }) => (
                        <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                          <div className='space-y-0.5'>
                            <FormLabel className='text-base flex items-center space-x-2'>
                              <BookOpen className='h-4 w-4' />
                              <span>Include Knowledge Base</span>
                            </FormLabel>
                            <FormDescription>
                              Use existing knowledge base content in research
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
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Action Buttons */}
              <div className='flex justify-end space-x-3 pt-4'>
                <Button type='button' variant='outline' onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type='submit' disabled={isSubmitting} className='min-w-32'>
                  {isSubmitting ? (
                    <div className='flex items-center space-x-2'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    <div className='flex items-center space-x-2'>
                      <Brain className='h-4 w-4' />
                      <span>Start Research</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}