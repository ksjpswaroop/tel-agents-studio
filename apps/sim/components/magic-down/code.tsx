'use client'

import { memo, useState } from 'react'
import { Copy, CopyCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CodeProps {
  children: React.ReactNode
  lang?: string
  className?: string
}

function Code({ children, lang, className }: CodeProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    try {
      const textContent = (children as any)?.props?.children || ''
      await navigator.clipboard.writeText(String(textContent))
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  return (
    <div className='relative group my-4'>
      {lang && (
        <div className='flex items-center justify-between px-4 py-2 bg-muted/50 rounded-t-lg border-b'>
          <span className='text-xs font-medium text-muted-foreground uppercase'>
            {lang}
          </span>
          <Button
            size='sm'
            variant='ghost'
            onClick={handleCopy}
            className='opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0'
          >
            {isCopied ? (
              <CopyCheck className='h-3 w-3 text-green-500' />
            ) : (
              <Copy className='h-3 w-3' />
            )}
          </Button>
        </div>
      )}
      <div className={cn(
        'relative overflow-x-auto',
        !lang && 'group-hover:opacity-90 transition-opacity'
      )}>
        {!lang && (
          <Button
            size='sm'
            variant='ghost'
            onClick={handleCopy}
            className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 z-10'
          >
            {isCopied ? (
              <CopyCheck className='h-3 w-3 text-green-500' />
            ) : (
              <Copy className='h-3 w-3' />
            )}
          </Button>
        )}
        <pre className={cn(
          'p-4 bg-muted/50 text-sm font-mono overflow-x-auto',
          lang ? 'rounded-b-lg' : 'rounded-lg',
          className
        )}>
          {children}
        </pre>
      </div>
    </div>
  )
}

export default memo(Code)