'use client'

import { useState } from 'react'
import {
  Download,
  FileText,
  File,
  Image,
  Code,
  Mail,
  Share2,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Copy,
  Archive,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'

interface ResearchSession {
  id: string
  title: string
  status: 'draft' | 'thinking' | 'planning' | 'researching' | 'writing' | 'completed' | 'paused' | 'failed'
  finalReport?: string
  reportPlan?: string
  totalSources: number
  [key: string]: any
}

interface ExportFormat {
  id: string
  name: string
  icon: any
  extension: string
  description: string
  features: string[]
  available: boolean
}

interface ExportJob {
  id: string
  format: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  createdAt: string
  downloadUrl?: string
  error?: string
}

interface ExportPanelProps {
  session: ResearchSession
  onExportComplete: () => void
}

const exportFormats: ExportFormat[] = [
  {
    id: 'pdf',
    name: 'PDF Report',
    icon: FileText,
    extension: 'pdf',
    description: 'Professional formatted report with citations',
    features: ['Formatted layout', 'Table of contents', 'Citations', 'Charts & graphs'],
    available: true,
  },
  {
    id: 'docx',
    name: 'Word Document',
    icon: File,
    extension: 'docx',
    description: 'Editable document for further customization',
    features: ['Editable text', 'Track changes', 'Comments', 'Style templates'],
    available: true,
  },
  {
    id: 'markdown',
    name: 'Markdown',
    icon: Code,
    extension: 'md',
    description: 'Plain text format for developers',
    features: ['Version control', 'GitHub compatible', 'Plain text', 'Easy editing'],
    available: true,
  },
  {
    id: 'html',
    name: 'Web Page',
    icon: Code,
    extension: 'html',
    description: 'Interactive web format with navigation',
    features: ['Interactive links', 'Responsive design', 'Search function', 'Shareable'],
    available: true,
  },
  {
    id: 'presentation',
    name: 'Presentation',
    icon: Image,
    extension: 'pptx',
    description: 'Slide deck for presentations',
    features: ['Key findings', 'Visual charts', 'Speaker notes', 'Custom themes'],
    available: false,
  },
  {
    id: 'api',
    name: 'JSON Data',
    icon: Code,
    extension: 'json',
    description: 'Raw data for API integration',
    features: ['Structured data', 'API compatible', 'Machine readable', 'Custom processing'],
    available: true,
  },
]

const formatPresets = {
  executive: {
    name: 'Executive Summary',
    description: 'Concise report focusing on key findings and recommendations',
    settings: {
      includeMethodology: false,
      includeRawData: false,
      includeAppendix: false,
      summaryLength: 'short',
    },
  },
  academic: {
    name: 'Academic Paper',
    description: 'Comprehensive report with full methodology and citations',
    settings: {
      includeMethodology: true,
      includeRawData: true,
      includeAppendix: true,
      summaryLength: 'long',
    },
  },
  business: {
    name: 'Business Report',
    description: 'Professional report with actionable insights',
    settings: {
      includeMethodology: true,
      includeRawData: false,
      includeAppendix: true,
      summaryLength: 'medium',
    },
  },
}

export function ExportPanel({ session, onExportComplete }: ExportPanelProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf')
  const [selectedPreset, setSelectedPreset] = useState<string>('business')
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportSettings, setExportSettings] = useState({
    includeKnowledgeGraph: true,
    includeSources: true,
    includeMethodology: true,
    includeRawData: false,
    includeAppendix: true,
    customTitle: '',
    customDescription: '',
    watermark: false,
    password: '',
  })

  const selectedFormatInfo = exportFormats.find(f => f.id === selectedFormat)

  const handleExport = async () => {
    if (!selectedFormatInfo?.available) return

    setIsExporting(true)
    const newJob: ExportJob = {
      id: `export-${Date.now()}`,
      format: selectedFormat,
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString(),
    }

    setExportJobs(prev => [newJob, ...prev])

    try {
      // Simulate export process
      const job = newJob
      setExportJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'processing' } : j))

      // Simulate progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 500))
        setExportJobs(prev => prev.map(j => 
          j.id === job.id ? { ...j, progress: i } : j
        ))
      }

      // Complete the job
      setExportJobs(prev => prev.map(j => 
        j.id === job.id ? { 
          ...j, 
          status: 'completed',
          progress: 100,
          downloadUrl: `https://example.com/downloads/${job.id}.${selectedFormatInfo.extension}`
        } : j
      ))

      onExportComplete()
    } catch (error) {
      setExportJobs(prev => prev.map(j => 
        j.id === newJob.id ? { 
          ...j, 
          status: 'failed',
          error: 'Export failed. Please try again.'
        } : j
      ))
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownload = (job: ExportJob) => {
    if (job.downloadUrl) {
      window.open(job.downloadUrl, '_blank')
    }
  }

  const handleShare = () => {
    // Share functionality would go here
    console.log('Sharing research report...')
  }

  const handleEmailReport = () => {
    // Email functionality would go here
    console.log('Emailing research report...')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const canExport = session.status === 'completed' || session.finalReport

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='p-4 border-b'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center space-x-2'>
            <Download className='h-4 w-4 text-primary' />
            <h3 className='font-medium'>Export Research</h3>
          </div>
          {canExport && (
            <Badge variant='secondary' className='text-xs'>
              Ready to export
            </Badge>
          )}
        </div>

        {!canExport && (
          <div className='p-3 bg-muted/50 rounded-lg'>
            <div className='flex items-center space-x-2 text-sm'>
              <Clock className='h-4 w-4 text-muted-foreground' />
              <span className='text-muted-foreground'>
                Export will be available when research is complete
              </span>
            </div>
          </div>
        )}
      </div>

      <ScrollArea className='flex-1'>
        <div className='p-4 space-y-6'>
          {canExport && (
            <>
              {/* Format Selection */}
              <div className='space-y-4'>
                <h4 className='font-medium text-sm'>Choose Export Format</h4>
                <div className='grid grid-cols-1 gap-2'>
                  {exportFormats.map((format) => {
                    const Icon = format.icon
                    return (
                      <Card
                        key={format.id}
                        className={`cursor-pointer transition-colors ${
                          selectedFormat === format.id
                            ? 'ring-2 ring-primary bg-accent/50'
                            : 'hover:bg-accent/50'
                        } ${!format.available ? 'opacity-50' : ''}`}
                        onClick={() => format.available && setSelectedFormat(format.id)}
                      >
                        <CardContent className='p-3'>
                          <div className='flex items-start space-x-3'>
                            <Icon className='h-4 w-4 text-primary mt-0.5' />
                            <div className='flex-1'>
                              <div className='flex items-center space-x-2 mb-1'>
                                <h5 className='font-medium text-sm'>{format.name}</h5>
                                <Badge variant='outline' className='text-xs'>
                                  .{format.extension}
                                </Badge>
                                {!format.available && (
                                  <Badge variant='secondary' className='text-xs'>
                                    Coming Soon
                                  </Badge>
                                )}
                              </div>
                              <p className='text-xs text-muted-foreground mb-2'>
                                {format.description}
                              </p>
                              <div className='flex flex-wrap gap-1'>
                                {format.features.slice(0, 2).map((feature, index) => (
                                  <Badge key={index} variant='outline' className='text-xs px-1 py-0'>
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              <Separator />

              {/* Export Settings */}
              <Tabs defaultValue='preset' className='space-y-4'>
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='preset'>Presets</TabsTrigger>
                  <TabsTrigger value='custom'>Custom</TabsTrigger>
                </TabsList>

                <TabsContent value='preset' className='space-y-4'>
                  <h4 className='font-medium text-sm'>Report Presets</h4>
                  <div className='space-y-2'>
                    {Object.entries(formatPresets).map(([key, preset]) => (
                      <Card
                        key={key}
                        className={`cursor-pointer transition-colors ${
                          selectedPreset === key
                            ? 'ring-2 ring-primary bg-accent/50'
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => setSelectedPreset(key)}
                      >
                        <CardContent className='p-3'>
                          <h5 className='font-medium text-sm mb-1'>{preset.name}</h5>
                          <p className='text-xs text-muted-foreground'>
                            {preset.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value='custom' className='space-y-4'>
                  <h4 className='font-medium text-sm'>Custom Settings</h4>
                  
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='title'>Custom Title</Label>
                      <Input
                        id='title'
                        placeholder='Leave empty to use research title'
                        value={exportSettings.customTitle}
                        onChange={(e) => setExportSettings(prev => ({ ...prev, customTitle: e.target.value }))}
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='description'>Custom Description</Label>
                      <Textarea
                        id='description'
                        placeholder='Add a custom description'
                        rows={2}
                        value={exportSettings.customDescription}
                        onChange={(e) => setExportSettings(prev => ({ ...prev, customDescription: e.target.value }))}
                      />
                    </div>

                    <div className='space-y-3'>
                      <h5 className='font-medium text-sm'>Include Sections</h5>
                      
                      <div className='space-y-2'>
                        {[
                          { key: 'includeKnowledgeGraph', label: 'Knowledge Graph' },
                          { key: 'includeSources', label: 'Source Citations' },
                          { key: 'includeMethodology', label: 'Research Methodology' },
                          { key: 'includeRawData', label: 'Raw Data & Analysis' },
                          { key: 'includeAppendix', label: 'Appendix' },
                        ].map((setting) => (
                          <div key={setting.key} className='flex items-center justify-between'>
                            <Label htmlFor={setting.key} className='text-sm'>
                              {setting.label}
                            </Label>
                            <Switch
                              id={setting.key}
                              checked={exportSettings[setting.key as keyof typeof exportSettings] as boolean}
                              onCheckedChange={(checked) =>
                                setExportSettings(prev => ({ ...prev, [setting.key]: checked }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedFormat === 'pdf' && (
                      <div className='space-y-3'>
                        <h5 className='font-medium text-sm'>PDF Options</h5>
                        
                        <div className='flex items-center justify-between'>
                          <Label htmlFor='watermark' className='text-sm'>
                            Add Watermark
                          </Label>
                          <Switch
                            id='watermark'
                            checked={exportSettings.watermark}
                            onCheckedChange={(checked) =>
                              setExportSettings(prev => ({ ...prev, watermark: checked }))
                            }
                          />
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='password'>Password Protection (Optional)</Label>
                          <Input
                            id='password'
                            type='password'
                            placeholder='Enter password'
                            value={exportSettings.password}
                            onChange={(e) => setExportSettings(prev => ({ ...prev, password: e.target.value }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <Separator />

              {/* Export Actions */}
              <div className='space-y-3'>
                <Button
                  onClick={handleExport}
                  disabled={!canExport || isExporting || !selectedFormatInfo?.available}
                  className='w-full'
                >
                  {isExporting ? (
                    <div className='flex items-center space-x-2'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                      <span>Exporting...</span>
                    </div>
                  ) : (
                    <div className='flex items-center space-x-2'>
                      <Download className='h-4 w-4' />
                      <span>Export as {selectedFormatInfo?.name}</span>
                    </div>
                  )}
                </Button>

                <div className='grid grid-cols-2 gap-2'>
                  <Button variant='outline' onClick={handleShare} disabled={!canExport}>
                    <Share2 className='h-4 w-4 mr-2' />
                    Share Link
                  </Button>
                  <Button variant='outline' onClick={handleEmailReport} disabled={!canExport}>
                    <Mail className='h-4 w-4 mr-2' />
                    Email Report
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Export History */}
          {exportJobs.length > 0 && (
            <>
              <Separator />
              
              <div className='space-y-4'>
                <h4 className='font-medium text-sm'>Export History</h4>
                
                <div className='space-y-2'>
                  {exportJobs.map((job) => {
                    const format = exportFormats.find(f => f.id === job.format)
                    const Icon = format?.icon || Download

                    return (
                      <Card key={job.id}>
                        <CardContent className='p-3'>
                          <div className='flex items-center justify-between mb-2'>
                            <div className='flex items-center space-x-2'>
                              <Icon className='h-4 w-4 text-primary' />
                              <span className='font-medium text-sm'>{format?.name}</span>
                              <Badge
                                variant={
                                  job.status === 'completed' ? 'default' :
                                  job.status === 'failed' ? 'destructive' : 'secondary'
                                }
                                className='text-xs'
                              >
                                {job.status === 'processing' && (
                                  <div className='animate-spin rounded-full h-2 w-2 border-b border-white mr-1'></div>
                                )}
                                {job.status}
                              </Badge>
                            </div>
                            <span className='text-xs text-muted-foreground'>
                              {formatDate(job.createdAt)}
                            </span>
                          </div>

                          {job.status === 'processing' && (
                            <div className='mb-2'>
                              <Progress value={job.progress} className='h-1' />
                              <div className='text-xs text-muted-foreground mt-1'>
                                {job.progress}% complete
                              </div>
                            </div>
                          )}

                          {job.status === 'completed' && job.downloadUrl && (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleDownload(job)}
                              className='w-full'
                            >
                              <Download className='h-3 w-3 mr-2' />
                              Download
                            </Button>
                          )}

                          {job.status === 'failed' && job.error && (
                            <div className='text-xs text-red-600 mt-1'>
                              {job.error}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Export Tips */}
          <Card className='bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800'>
            <CardContent className='p-3'>
              <div className='flex items-start space-x-2'>
                <Sparkles className='h-4 w-4 text-blue-600 mt-0.5' />
                <div className='space-y-1'>
                  <h5 className='font-medium text-sm text-blue-900 dark:text-blue-100'>
                    Export Tips
                  </h5>
                  <ul className='text-xs text-blue-800 dark:text-blue-200 space-y-1'>
                    <li>• PDF format is best for sharing and printing</li>
                    <li>• Word documents can be further edited</li>
                    <li>• Markdown is perfect for developers and version control</li>
                    <li>• Include methodology for academic or business reports</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}