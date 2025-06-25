'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import NavClient from './nav-client'

interface NavWrapperProps {
  onOpenTypeformLink: () => void
}

export default function NavWrapper({ onOpenTypeformLink }: NavWrapperProps) {
  // Use a client-side component to wrap the navigation
  // This avoids trying to use server-side UA detection
  // which has compatibility challenges

  const pathname = usePathname()
  const [initialIsMobile, setInitialIsMobile] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  useEffect(() => {
    // Set initial mobile state based on window width
    setInitialIsMobile(window.innerWidth < 768)

    // Slight delay to ensure smooth animations with other elements
    setTimeout(() => {
      setIsLoaded(true)
    }, 100)
  }, [])

  return (
    <>
      <AnimatePresence mode='wait'>
        {!isLoaded ? (
          <motion.div
            key='loading'
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className='absolute top-1 right-0 left-0 z-30 px-4 py-8'
          >
            <div className='relative mx-auto flex max-w-7xl items-center justify-between'>
              <div className='flex-1' />
              <div className='flex flex-1 justify-end'>
                <div className='h-[43px] w-[43px]' />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key='loaded'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <NavClient
              initialIsMobile={initialIsMobile}
              currentPath={pathname}
              onContactClick={onOpenTypeformLink}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
