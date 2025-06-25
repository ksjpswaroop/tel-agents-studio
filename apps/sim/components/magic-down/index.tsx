'use client'

import { useState, useRef, memo, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { FilePenLine, Save, Copy, CopyCheck, Eye, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const Editor = dynamic(() => import('./editor'), { ssr: false })
const View = dynamic(() => import('./view'), { ssr: false })

type Props = {
  className?: string
  value: string
  onChange?: (value: string) => void
  readonly?: boolean
  hideTools?: boolean
  autoSave?: boolean
  onSave?: (value: string) => void
  placeholder?: string
}

export function MagicDown({
  value,
  onChange,
  className,
  readonly = false,
  hideTools = false,
  autoSave = false,
  onSave,
  placeholder = 'Enter markdown content...',
}: Props) {
  const [mode, setMode] = useState<'editor' | 'view'>(readonly ? 'view' : 'editor')
  const [isCopied, setIsCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleSave = () => {
    if (onSave) {
      onSave(value)
    }
  }

  return (
    <div className={cn('relative h-full', className)} ref={containerRef}>
      {!hideTools && (
        <div className='absolute top-2 right-2 z-10 flex items-center gap-2'>
          {!readonly && (
            <Button
              size='sm'
              variant='ghost'
              onClick={() => setMode(mode === 'editor' ? 'view' : 'editor')}
              title={mode === 'editor' ? 'Preview' : 'Edit'}
            >
              {mode === 'editor' ? <Eye className='h-4 w-4' /> : <Code className='h-4 w-4' />}
            </Button>
          )}
          
          <Button
            size='sm'
            variant='ghost'
            onClick={handleCopy}
            title='Copy content'
          >
            {isCopied ? <CopyCheck className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
          </Button>
          
          {onSave && !autoSave && (
            <Button
              size='sm'
              variant='ghost'
              onClick={handleSave}
              title='Save'
            >
              <Save className='h-4 w-4' />
            </Button>
          )}
        </div>
      )}

      <div className='h-full overflow-hidden'>
        {mode === 'view' ? (
          <View content={value} className='h-full overflow-auto p-4' />
        ) : (
          <Editor
            value={value}
            onChange={onChange || (() => {})}
            placeholder={placeholder}
            className='h-full'
            autoSave={autoSave}
            onSave={onSave}
          />
        )}
      </div>
    </div>
  )
}

export default memo(MagicDown)