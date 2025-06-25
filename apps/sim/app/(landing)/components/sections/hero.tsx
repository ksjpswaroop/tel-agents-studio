'use client'

import { useEffect, useState } from 'react'
import { Command, CornerDownLeft, Brain, Building, Code, Zap, Shield, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth-client'
import { GridPattern } from '../grid-pattern'

function Hero() {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(true)
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleNavigate()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAuthenticated])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTransitioning(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  const renderActionUI = () => {
    if (isTransitioning || isPending) {
      return <div className='h-[56px] md:h-[64px]' />
    }
    return (
      <Button
        variant={'secondary'}
        onClick={handleNavigate}
        className='animate-fade-in items-center bg-[#1877F2] px-7 py-6 font-[420] font-geist-sans text-lg text-neutral-100 tracking-normal shadow-[#1877F2]/30 shadow-lg hover:bg-[#1467d3]'
        aria-label='Start using the platform'
      >
        <div className='text-[1.15rem]'>Get Started</div>
        <div className='flex items-center gap-1 pl-2 opacity-80' aria-hidden='true'>
          <Command size={24} />
          <CornerDownLeft />
        </div>
      </Button>
    )
  }

  return (
    <section
      className='animation-container relative min-h-screen overflow-hidden border-[#181818] border-b pt-28 text-white will-change-[opacity,transform] sm:pt-32 md:pt-40'
      aria-label='Main hero section'
    >
      <GridPattern
        x={-5}
        y={-5}
        className='absolute inset-0 z-0 stroke-[#ababab]/5'
        width={90}
        height={90}
        aria-hidden='true'
      />

      <div className='animation-container relative z-20 space-y-12 px-4 text-center'>
        <div className='space-y-4'>
          <h1 className='animation-container animate-fade-up font-semibold text-[42px] leading-[1.10] opacity-0 will-change-[opacity,transform] [animation-delay:200ms] md:text-[68px]'>
            TEL Cognitive Platform
            <br />
            <span className='text-[#1877F2]'>AI Solutions</span>
          </h1>

          <p className='animation-container mx-auto max-w-3xl animate-fade-up font-normal text-base text-neutral-400/80 leading-[1.5] tracking-normal opacity-0 will-change-[opacity,transform] [animation-delay:400ms] md:text-xl'>
            Empowering businesses with advanced AI research, intelligent automation, and custom application development
          </p>

          <div className='animation-container translate-y-[-10px] animate-fade-up pt-4 opacity-0 will-change-[opacity,transform] [animation-delay:600ms]'>
            {renderActionUI()}
          </div>
        </div>

        {/* TEL Products Section */}
        <div className='animation-container animate-fade-up opacity-0 will-change-[opacity,transform] [animation-delay:800ms]'>
          <h2 className='mb-8 font-semibold text-2xl text-white md:text-3xl'>Our Solutions</h2>
          <div className='grid gap-6 md:grid-cols-3'>
            {/* TEL Dep Research */}
            <div className='group rounded-2xl border border-[#333333] bg-[#131313] p-6 transition-all duration-300 hover:border-[#1877F2]/50 hover:shadow-lg hover:shadow-[#1877F2]/10'>
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#1877F2]'>
                <Brain className='h-6 w-6 text-white' />
              </div>
              <h3 className='mb-3 font-semibold text-xl text-white'>TEL Dep Research</h3>
              <p className='text-neutral-400 leading-relaxed'>
                Advanced AI research and development solutions for cutting-edge technological innovations and scientific breakthroughs.
              </p>
            </div>

            {/* TEL-ME */}
            <div className='group rounded-2xl border border-[#333333] bg-[#131313] p-6 transition-all duration-300 hover:border-[#1877F2]/50 hover:shadow-lg hover:shadow-[#1877F2]/10'>
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#1877F2] to-[#1467d3] opacity-60'>
                <Users className='h-6 w-6 text-white' />
              </div>
              <h3 className='mb-3 font-semibold text-xl text-neutral-400'>
                TEL-ME 
                <span className='ml-2 rounded-full bg-[#1877F2]/20 px-2 py-1 text-xs text-[#1877F2]'>Coming Soon</span>
              </h3>
              <p className='text-neutral-500 leading-relaxed'>
                Intelligent automation and workflow management platform designed to streamline business processes and enhance productivity.
              </p>
            </div>

            {/* TEL App Builder */}
            <div className='group rounded-2xl border border-[#333333] bg-[#131313] p-6 transition-all duration-300 hover:border-[#1877F2]/50 hover:shadow-lg hover:shadow-[#1877F2]/10'>
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#1877F2] to-[#1467d3] opacity-60'>
                <Code className='h-6 w-6 text-white' />
              </div>
              <h3 className='mb-3 font-semibold text-xl text-neutral-400'>
                TEL App Builder
                <span className='ml-2 rounded-full bg-[#1877F2]/20 px-2 py-1 text-xs text-[#1877F2]'>Coming Soon</span>
              </h3>
              <p className='text-neutral-500 leading-relaxed'>
                No-code/low-code platform for rapid application development with AI-powered features and seamless integration capabilities.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className='animation-container animate-fade-up opacity-0 will-change-[opacity,transform] [animation-delay:1000ms]'>
          <h2 className='mb-8 font-semibold text-2xl text-white md:text-3xl'>Why Choose TEL?</h2>
          <div className='grid gap-6 md:grid-cols-3'>
            <div className='flex flex-col items-center text-center'>
              <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1877F2]/10'>
                <Zap className='h-8 w-8 text-[#1877F2]' />
              </div>
              <h3 className='mb-2 font-semibold text-lg text-white'>Fast Implementation</h3>
              <p className='text-neutral-400'>Rapid deployment and integration with existing systems for immediate results.</p>
            </div>

            <div className='flex flex-col items-center text-center'>
              <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1877F2]/10'>
                <Shield className='h-8 w-8 text-[#1877F2]' />
              </div>
              <h3 className='mb-2 font-semibold text-lg text-white'>Enterprise Security</h3>
              <p className='text-neutral-400'>Bank-level security and compliance standards to protect your valuable data.</p>
            </div>

            <div className='flex flex-col items-center text-center'>
              <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1877F2]/10'>
                <Building className='h-8 w-8 text-[#1877F2]' />
              </div>
              <h3 className='mb-2 font-semibold text-lg text-white'>Scalable Solutions</h3>
              <p className='text-neutral-400'>Solutions that grow with your business, from startup to enterprise scale.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero