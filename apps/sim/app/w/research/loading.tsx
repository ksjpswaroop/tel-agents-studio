'use client'

import { FileSearch } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useSidebarStore } from '@/stores/sidebar/store'

export default function ResearchLoading() {
  const { mode, isExpanded } = useSidebarStore()
  const isSidebarCollapsed =
    mode === 'expanded' ? !isExpanded : mode === 'collapsed' || mode === 'hover'

  return (
    <div
      className={`flex h-screen flex-col transition-padding duration-200 ${
        isSidebarCollapsed ? 'pl-14' : 'pl-60'
      }`}
    >
      {/* Header */}
      <div className='flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='flex h-16 items-center justify-between px-6'>
          <div className='flex items-center space-x-4'>
            <FileSearch className='h-6 w-6 text-primary' />
            <div>
              <Skeleton className='h-6 w-32' />
              <Skeleton className='h-4 w-48 mt-1' />
            </div>
          </div>
          
          <Skeleton className='h-10 w-32' />
        </div>
      </div>

      {/* Main Content */}
      <div className='flex flex-1 overflow-hidden'>
        <div className='flex flex-1 flex-col overflow-hidden'>
          <div className='flex-1 overflow-auto p-6'>
            {/* Search and Filter Bar */}
            <div className='mb-6 flex items-center justify-between space-x-4'>
              <div className='flex flex-1 items-center space-x-4'>
                <Skeleton className='h-10 w-80' />
                <div className='flex items-center space-x-2'>
                  <Skeleton className='h-8 w-12' />
                  <Skeleton className='h-8 w-20' />
                  <Skeleton className='h-8 w-16' />
                  <Skeleton className='h-8 w-16' />
                </div>
              </div>
            </div>

            {/* Research Sessions Grid Skeleton */}
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className='rounded-lg border bg-card p-6 space-y-4'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1 space-y-2'>
                      <Skeleton className='h-5 w-3/4' />
                      <Skeleton className='h-4 w-16' />
                    </div>
                  </div>
                  
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-4 w-2/3' />
                  </div>
                  
                  <div className='bg-muted/50 rounded-md p-3'>
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-4 w-3/4 mt-1' />
                  </div>
                  
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-4'>
                      <Skeleton className='h-3 w-16' />
                      <Skeleton className='h-3 w-12' />
                    </div>
                    <Skeleton className='h-3 w-20' />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}