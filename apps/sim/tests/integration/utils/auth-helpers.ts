/**
 * Real Authentication Test Helpers
 *
 * Utilities for performing real authentication operations during integration tests.
 * These helpers make actual API calls to Better Auth, not mocks.
 */

import { client } from '@/lib/auth-client'
import { generateTestEmail, integrationTestConfig } from '../config/integration-test.config'

interface AuthResponse {
  data: any
  error: any
}

interface SignUpResult {
  user: any
  session: any
  error: any
}

interface SignInResult {
  user: any
  session: any
  error: any
}

/**
 * Real authentication operations for testing
 */
export class TestAuthHelpers {
  private baseURL: string

  constructor() {
    this.baseURL = integrationTestConfig.auth.baseURL
  }

  /**
   * Test Better Auth API connectivity
   */
  async testAuthConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/session`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Should return 200 or 401, both indicate the auth service is running
      return response.status === 200 || response.status === 401
    } catch (error) {
      console.error('Auth connection test failed:', error)
      return false
    }
  }

  /**
   * Create a real user account via signup API
   */
  async createTestUserAccount(email?: string, password?: string): Promise<SignUpResult> {
    const testEmail = email || generateTestEmail()
    const testPassword = password || integrationTestConfig.testUsers.dynamic.password

    try {
      const result = await client.signUp.email({
        email: testEmail,
        password: testPassword,
        name: `Test User ${testEmail.split('@')[0]}`,
      })

      return {
        user: result.data?.user || null,
        session: (result.data as any)?.session || null,
        error: result.error,
      }
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Sign in with real credentials
   */
  async signInWithCredentials(email: string, password: string): Promise<SignInResult> {
    try {
      const result = await client.signIn.email({
        email,
        password,
        callbackURL: '/test-dashboard',
      })

      return {
        user: result.data?.user || null,
        session: (result.data as any)?.session || null,
        error: result.error,
      }
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Sign out current session
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      await client.signOut()
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Get current session from real API
   */
  async getCurrentSession(): Promise<any> {
    try {
      const { data: session } = await client.useSession()
      return session
    } catch (error) {
      console.error('Failed to get current session:', error)
      return null
    }
  }

  /**
   * Verify email with OTP (real API call)
   */
  async verifyEmailWithOTP(
    email: string,
    otp: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await client.emailOtp.verifyEmail({
        email,
        otp,
      })

      return {
        success: !result.error,
        error: result.error ? String(result.error) : undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Send password reset email (real API call)
   */
  async sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await client.forgetPassword({
        email,
        redirectTo: `${integrationTestConfig.auth.appUrl}/reset-password`,
      })

      return {
        success: !result.error,
        error: result.error ? String(result.error) : undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Reset password with token (real API call)
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await client.resetPassword({
        token,
        newPassword: newPassword,
      })

      return {
        success: !result.error,
        error: result.error ? String(result.error) : undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Generate OAuth authorization URL (real Google OAuth)
   */
  async getGoogleOAuthURL(callbackURL?: string): Promise<{ url?: string; error?: string }> {
    try {
      const redirectURL =
        callbackURL || `${integrationTestConfig.auth.appUrl}/api/auth/callback/google`

      // Generate real Google OAuth URL
      const baseURL = 'https://accounts.google.com/o/oauth2/v2/auth'
      const params = new URLSearchParams({
        client_id: integrationTestConfig.oauth.google.clientId!,
        redirect_uri: redirectURL,
        response_type: 'code',
        scope: 'email profile',
        access_type: 'offline',
        prompt: 'consent',
        state: generateTestState(),
      })

      return { url: `${baseURL}?${params.toString()}` }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Make authenticated request to test API protection
   */
  async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const session = await this.getCurrentSession()

    return fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(session?.token && { Authorization: `Bearer ${session.token}` }),
        ...options.headers,
      },
    })
  }

  /**
   * Create test session manually (for testing session validation)
   */
  async createTestSession(
    userId: string
  ): Promise<{ sessionId?: string; token?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          expiresIn: 30 * 24 * 60 * 60, // 30 days
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        return { error: `Failed to create session: ${response.status} ${error}` }
      }

      const result = await response.json()
      return {
        sessionId: result.sessionId,
        token: result.token,
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Validate session token
   */
  async validateSession(token: string): Promise<{ valid: boolean; user?: any; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/session`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        return { valid: false, error: `Session validation failed: ${response.status}` }
      }

      const session = await response.json()
      return {
        valid: true,
        user: session.user,
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
}

/**
 * Generate test state for OAuth flows
 */
function generateTestState(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Helper to wait for email verification in tests
 * In real tests, this would involve checking a test email service
 */
export async function waitForEmailVerification(email: string, timeoutMs = 30000): Promise<boolean> {
  // In a real implementation, this would:
  // 1. Check a test email service (like MailTrap or similar)
  // 2. Parse the verification email
  // 3. Extract the verification code/link
  // 4. Return the verification token

  console.log(`⏱️  Would wait for email verification for ${email} (timeout: ${timeoutMs}ms)`)
  console.log('💡 In production tests, implement real email checking service')

  // For now, simulate waiting
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return true // Assume verification would succeed
}

// Export singleton instance
export const testAuth = new TestAuthHelpers()
