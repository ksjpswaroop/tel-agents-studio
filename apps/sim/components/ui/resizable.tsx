'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ResizablePanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  direction: 'horizontal' | 'vertical'
}

interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultSize?: number
  minSize?: number
  maxSize?: number
}

interface ResizableHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  withHandle?: boolean
}

const ResizablePanelGroup = React.forwardRef<HTMLDivElement, ResizablePanelGroupProps>(
  ({ className, direction, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          direction === 'horizontal' ? 'flex-row' : 'flex-col',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ResizablePanelGroup.displayName = 'ResizablePanelGroup'

const ResizablePanel = React.forwardRef<HTMLDivElement, ResizablePanelProps>(
  ({ className, style, children, defaultSize, minSize, maxSize, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex-1', className)}
        style={{
          ...(defaultSize && { flexBasis: `${defaultSize}%` }),
          ...(minSize && { minWidth: `${minSize}%` }),
          ...(maxSize && { maxWidth: `${maxSize}%` }),
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ResizablePanel.displayName = 'ResizablePanel'

const ResizableHandle = React.forwardRef<HTMLDivElement, ResizableHandleProps>(
  ({ className, withHandle, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90',
          className
        )}
        {...props}
      >
        {withHandle && (
          <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
            <div className="h-2.5 w-[3px] rounded-[1px] bg-foreground/25" />
          </div>
        )}
      </div>
    )
  }
)
ResizableHandle.displayName = 'ResizableHandle'

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }