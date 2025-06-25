'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth-client'
import useIsMobile from '../hooks/use-is-mobile'

function Footer() {
  const router = useRouter()
  const { isMobile, mounted } = useIsMobile()
  const { data: session, isPending } = useSession()
  const isAuthenticated = !isPending && !!session?.user


  const handleNavigate = () => {
    if (typeof window !== 'undefined') {
      // Check if user has an active session
      if (isAuthenticated) {
        router.push('/w')
      } else {
        // Check if user has logged in before
        const hasLoggedInBefore =
          localStorage.getItem('has_logged_in_before') === 'true' ||
          document.cookie.includes('has_logged_in_before=true')

        if (hasLoggedInBefore) {
          // User has logged in before but doesn't have an active session
          router.push('/login')
        } else {
          // User has never logged in before
          router.push('/signup')
        }
      }
    }
  }

  if (!mounted) {
    return <section className='flex w-full p-4 md:p-9' />
  }

  // If on mobile, render without animations
  if (isMobile) {
    return (
      <section className='flex w-full p-4 md:p-9'>
        <div className='flex w-full flex-col rounded-3xl bg-[#1a1a1a] p-6 sm:p-10 md:p-16'>
          <div className='flex h-full w-full flex-col justify-between md:flex-row'>
            {/* Left side content */}
            <div className='flex flex-col justify-between'>
              <p className='max-w-lg font-light text-5xl text-[#1877F2] leading-[1.1] md:text-6xl'>
                Ready to transform your business with AI?
              </p>
              <div className='mt-4 pt-4 md:mt-auto md:pt-8'>
                <Button
                  className='w-fit bg-[#1877F2] text-white transition-colors duration-500 hover:bg-[#1467d3]'
                  size={'lg'}
                  variant={'secondary'}
                  onClick={handleNavigate}
                >
                  Get Started
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>
    )
  }

  return (
    <motion.section
      className='flex w-full p-4 md:p-9'
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay: 0.05, ease: 'easeOut' }}
    >
      <motion.div
        className='flex w-full flex-col rounded-3xl bg-[#1a1a1a] p-6 sm:p-10 md:p-16'
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
      >
        <motion.div
          className='flex h-full w-full flex-col justify-between md:flex-row'
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
        >
          {/* Left side content */}
          <div className='flex flex-col justify-between'>
            <motion.p
              className='max-w-lg font-light text-5xl text-[#1877F2] leading-[1.1] md:text-6xl'
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: 0.18, ease: 'easeOut' }}
            >
              Ready to transform your business with AI?
            </motion.p>
            <motion.div
              className='mt-4 pt-4 md:mt-auto md:pt-8'
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: 0.22, ease: 'easeOut' }}
            >
              <Button
                className='w-fit bg-[#1877F2] text-white transition-colors duration-500 hover:bg-[#1467d3]'
                size={'lg'}
                variant={'secondary'}
                onClick={handleNavigate}
              >
                Get Started
              </Button>
            </motion.div>
          </div>

        </motion.div>
      </motion.div>
    </motion.section>
  )
}

export default Footer
