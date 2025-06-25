'use client'

import { useMemo, memo } from 'react'
import Markdown, { type Options } from 'react-markdown'
import { cn } from '@/lib/utils'

interface MagicDownViewProps extends Partial<Options> {
  content: string
  className?: string
}

function MagicDownView({ content, className, ...rest }: MagicDownViewProps) {
  const components = useMemo(
    () => ({
      ...rest.components,
      pre: ({ children, className, ...props }: any) => {
        return (
          <pre {...props} className={cn('my-4 overflow-x-auto', className)}>
            {children}
          </pre>
        )
      },
      code: ({ children, className, ...props }: any) => {
        const isInline = !className
        if (isInline) {
          return (
            <code {...props} className='px-1 py-0.5 bg-muted rounded text-sm'>
              {children}
            </code>
          )
        }

        const lang = /language-(\w+)/.exec(className || '')
        if (lang && lang[1] === 'mermaid') {
          // Fallback for mermaid - show as code block for now
          return (
            <pre className='bg-muted/50 p-4 rounded-lg overflow-x-auto'>
              <code {...props} className={cn('block text-sm', className)}>
                {children}
              </code>
            </pre>
          )
        }

        return (
          <pre className='bg-muted/50 p-4 rounded-lg overflow-x-auto my-4'>
            <code {...props} className={cn('block text-sm', className)}>
              {children}
            </code>
          </pre>
        )
      },
      a: ({ children, href = '', ...props }: any) => {
        // Handle audio files
        if (/\.(aac|mp3|opus|wav)$/.test(href)) {
          return (
            <figure className='my-4'>
              <audio controls src={href} className='w-full' />
            </figure>
          )
        }
        // Handle video files
        if (/\.(3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href)) {
          return (
            <video controls className='w-full my-4'>
              <source src={href} />
            </video>
          )
        }
        // Regular links
        return (
          <a
            {...props}
            href={href}
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary hover:underline'
          >
            {children}
          </a>
        )
      },
      img: ({ src, alt, ...props }: any) => {
        return (
          <img
            {...props}
            src={src}
            alt={alt}
            loading='lazy'
            className='max-w-full h-auto rounded-lg my-4'
          />
        )
      },
      table: ({ children, ...props }: any) => {
        return (
          <div className='overflow-x-auto my-4'>
            <table {...props} className='min-w-full'>
              {children}
            </table>
          </div>
        )
      },
    }),
    [rest.components]
  )

  return (
    <div className={cn('prose prose-neutral dark:prose-invert max-w-none', className)}>
      <Markdown
        {...rest}
        components={components}
      >
        {content}
      </Markdown>
    </div>
  )
}

export default memo(MagicDownView)