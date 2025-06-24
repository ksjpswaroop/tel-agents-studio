'use server'

import { isProd } from '@/lib/environment'

export async function getOAuthProviderStatus() {
  // Force GitHub and Google OAuth to be unavailable
  const githubAvailable = false

  const googleAvailable = false

  return { githubAvailable, googleAvailable, isProduction: isProd }
}
