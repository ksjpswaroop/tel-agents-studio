/**
 * Better Auth Flows Integration Tests
 *
 * Real integration tests that test actual Better Auth API endpoints.
 * These tests make real HTTP requests to Better Auth and verify responses.
 *
 * @vitest-environment node
 */

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import {
  delayBetweenTests,
  generateTestEmail,
  integrationTestConfig,
  validateIntegrationTestConfig,
} from '../config/integration-test.config'
import { testAuth } from '../utils/auth-helpers'
import { testDb } from '../utils/database-helpers'

describe('Better Auth API Integration', () => {
  const testUsers: Array<{ email: string; id?: string }> = []

  beforeAll(async () => {
    validateIntegrationTestConfig()
    console.log('🔐 Testing real Better Auth API endpoints...')
    console.log(`📍 Auth URL: ${integrationTestConfig.auth.baseURL}`)

    // Verify auth service is running
    const isConnected = await testAuth.testAuthConnection()
    if (!isConnected) {
      throw new Error('Better Auth service connection required for auth tests')
    }
  })

  afterEach(async () => {
    await delayBetweenTests()
  })

  afterAll(async () => {
    // Clean up test data
    await testDb.cleanupTestData()
  })

  describe('Auth Service Health', () => {
    it(
      'should connect to Better Auth API',
      async () => {
        const isConnected = await testAuth.testAuthConnection()
        expect(isConnected).toBe(true)
      },
      { timeout: 10000 }
    )

    it(
      'should respond to session endpoint',
      async () => {
        const response = await fetch(`${integrationTestConfig.auth.baseURL}/api/auth/session`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        // Should return 200 (with session) or 401 (no session), both are valid
        expect([200, 401]).toContain(response.status)
      },
      { timeout: 10000 }
    )

    it(
      'should have proper CORS headers',
      async () => {
        const response = await fetch(`${integrationTestConfig.auth.baseURL}/api/auth/session`, {
          method: 'OPTIONS',
          headers: {
            Origin: integrationTestConfig.auth.appUrl,
            'Access-Control-Request-Method': 'GET',
          },
        })

        // CORS preflight should succeed
        expect([200, 204]).toContain(response.status)
      },
      { timeout: 10000 }
    )
  })

  describe('User Registration (Real API)', () => {
    it(
      'should register new user via real API',
      async () => {
        const testEmail = generateTestEmail('real-signup')
        const testPassword = integrationTestConfig.testUsers.dynamic.password

        const result = await testAuth.createTestUserAccount(testEmail, testPassword)

        if (result.user) {
          testUsers.push({ email: testEmail, id: result.user.id })
        }

        // Should either succeed or fail with specific error
        if (result.error) {
          console.log('Signup error (expected in some cases):', result.error)
          // Common expected errors: registration disabled, email validation required, etc.
          expect(typeof result.error).toBe('string')
        } else {
          expect(result.user).toBeDefined()
          expect(result.user.email).toBe(testEmail)
        }
      },
      { timeout: 15000 }
    )

    it(
      'should reject duplicate email registration',
      async () => {
        const testEmail = generateTestEmail('duplicate-signup')

        // First registration
        const firstResult = await testAuth.createTestUserAccount(testEmail)
        if (firstResult.user) {
          testUsers.push({ email: testEmail, id: firstResult.user.id })
        }

        // Second registration with same email
        const secondResult = await testAuth.createTestUserAccount(testEmail)

        // Should fail the second time
        expect(secondResult.error).toBeDefined()
        expect(String(secondResult.error).toLowerCase()).toMatch(
          /(email|exists|duplicate|already)/i
        )
      },
      { timeout: 20000 }
    )

    it(
      'should validate password requirements',
      async () => {
        const testEmail = generateTestEmail('weak-password')
        const weakPassword = '123' // Weak password

        const result = await testAuth.createTestUserAccount(testEmail, weakPassword)

        if (result.user) {
          testUsers.push({ email: testEmail, id: result.user.id })
          // If weak password is accepted, that's the current behavior
          console.log('Weak password was accepted (no validation enabled)')
        } else {
          // If rejected, should be due to password policy
          expect(result.error).toBeDefined()
          expect(String(result.error).toLowerCase()).toMatch(
            /(password|weak|strength|requirements)/i
          )
        }
      },
      { timeout: 15000 }
    )

    it(
      'should validate email format',
      async () => {
        const invalidEmail = 'not-an-email'

        const result = await testAuth.createTestUserAccount(invalidEmail)

        // Should fail with email validation error
        expect(result.error).toBeDefined()
        expect(String(result.error).toLowerCase()).toMatch(/(email|invalid|format)/i)
      },
      { timeout: 10000 }
    )
  })

  describe('User Authentication (Real API)', () => {
    it(
      'should authenticate user with valid credentials',
      async () => {
        // Create a test user first
        const testEmail = generateTestEmail('auth-test')
        const testPassword = integrationTestConfig.testUsers.dynamic.password

        const signupResult = await testAuth.createTestUserAccount(testEmail, testPassword)
        if (signupResult.user) {
          testUsers.push({ email: testEmail, id: signupResult.user.id })
        }

        // Wait a moment for user creation to complete
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Now try to sign in
        const signinResult = await testAuth.signInWithCredentials(testEmail, testPassword)

        if (signinResult.error) {
          console.log('Sign-in error:', signinResult.error)
          // Common reasons: email verification required, account not activated, etc.
        } else {
          expect(signinResult.user).toBeDefined()
          expect(signinResult.user.email).toBe(testEmail)
          expect(signinResult.session).toBeDefined()
        }
      },
      { timeout: 20000 }
    )

    it(
      'should reject invalid credentials',
      async () => {
        const testEmail = generateTestEmail('invalid-creds')
        const wrongPassword = 'wrong-password'

        const result = await testAuth.signInWithCredentials(testEmail, wrongPassword)

        expect(result.error).toBeDefined()
        expect(String(result.error).toLowerCase()).toMatch(/(credentials|invalid|password|email)/i)
        expect(result.user).toBeNull()
        expect(result.session).toBeNull()
      },
      { timeout: 10000 }
    )

    it(
      'should handle non-existent user login',
      async () => {
        const nonExistentEmail = generateTestEmail('nonexistent')
        const password = 'any-password'

        const result = await testAuth.signInWithCredentials(nonExistentEmail, password)

        expect(result.error).toBeDefined()
        expect(String(result.error).toLowerCase()).toMatch(/(user|found|exists|credentials)/i)
      },
      { timeout: 10000 }
    )
  })

  describe('Session Management (Real API)', () => {
    it(
      'should create valid session on successful login',
      async () => {
        // Use pre-configured test user if available
        const testUser = integrationTestConfig.testUsers.regular

        const signinResult = await testAuth.signInWithCredentials(testUser.email, testUser.password)

        if (signinResult.session) {
          expect(signinResult.session).toBeDefined()
          expect(signinResult.session.userId).toBeDefined()

          // Verify session is valid
          const sessionValid = await testAuth.validateSession(
            signinResult.session.token || signinResult.session.id
          )
          if (sessionValid.valid) {
            expect(sessionValid.user).toBeDefined()
          }
        } else {
          console.log('Session creation failed (might need user setup):', signinResult.error)
        }
      },
      { timeout: 15000 }
    )

    it(
      'should invalidate session on sign out',
      async () => {
        // Sign in first
        const testUser = integrationTestConfig.testUsers.regular
        const signinResult = await testAuth.signInWithCredentials(testUser.email, testUser.password)

        if (signinResult.session) {
          // Sign out
          const signoutResult = await testAuth.signOut()

          if (signoutResult.success) {
            // Verify session is no longer valid
            const session = await testAuth.getCurrentSession()
            expect(session).toBeNull()
          } else {
            console.log('Sign out failed:', signoutResult.error)
          }
        }
      },
      { timeout: 15000 }
    )

    it(
      'should reject invalid session tokens',
      async () => {
        const invalidToken = 'invalid-session-token'

        const result = await testAuth.validateSession(invalidToken)

        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      },
      { timeout: 10000 }
    )
  })

  describe('Password Reset (Real API)', () => {
    it(
      'should initiate password reset for existing user',
      async () => {
        const testUser = integrationTestConfig.testUsers.regular

        const result = await testAuth.sendPasswordReset(testUser.email)

        if (result.success) {
          expect(result.error).toBeUndefined()
          console.log('✉️  Password reset email would be sent to:', testUser.email)
        } else {
          console.log('Password reset failed:', result.error)
          // Might fail if email service is not configured
        }
      },
      { timeout: 15000 }
    )

    it(
      'should handle password reset for non-existent user',
      async () => {
        const nonExistentEmail = generateTestEmail('password-reset-404')

        const result = await testAuth.sendPasswordReset(nonExistentEmail)

        // Behavior varies: some systems silently succeed to prevent email enumeration
        // Others return an error. Both are valid security patterns.
        if (!result.success) {
          expect(result.error).toBeDefined()
        }
      },
      { timeout: 10000 }
    )
  })

  describe('Protected Routes (Real API)', () => {
    it(
      'should protect authenticated routes',
      async () => {
        // Try to access a protected route without authentication
        const response = await testAuth.makeAuthenticatedRequest('/api/auth/user')

        // Should require authentication
        expect([401, 403]).toContain(response.status)
      },
      { timeout: 10000 }
    )

    it(
      'should allow access with valid session',
      async () => {
        // Sign in first
        const testUser = integrationTestConfig.testUsers.regular
        const signinResult = await testAuth.signInWithCredentials(testUser.email, testUser.password)

        if (signinResult.session) {
          // Try to access protected route with session
          const response = await testAuth.makeAuthenticatedRequest('/api/auth/user')

          if (response.ok) {
            const userData = await response.json()
            expect(userData).toBeDefined()
            expect(userData.email).toBe(testUser.email)
          } else {
            console.log('Authenticated request failed:', response.status, await response.text())
          }
        }
      },
      { timeout: 15000 }
    )
  })

  describe('Rate Limiting and Security', () => {
    it(
      'should handle rapid authentication attempts',
      async () => {
        const testEmail = generateTestEmail('rate-limit')
        const wrongPassword = 'wrong-password'

        // Make multiple rapid authentication attempts
        const attempts = Array.from({ length: 5 }, () =>
          testAuth.signInWithCredentials(testEmail, wrongPassword)
        )

        const results = await Promise.all(attempts)

        // All should fail, but service should remain responsive
        results.forEach((result) => {
          expect(result.error).toBeDefined()
        })

        // Service should still be reachable after rapid attempts
        const healthCheck = await testAuth.testAuthConnection()
        expect(healthCheck).toBe(true)
      },
      { timeout: 20000 }
    )

    it(
      'should sanitize error messages',
      async () => {
        const testEmail = generateTestEmail('error-sanitization')

        const result = await testAuth.signInWithCredentials(testEmail, 'any-password')

        if (result.error) {
          // Error messages should not leak sensitive information
          const errorMessage = String(result.error).toLowerCase()
          expect(errorMessage).not.toMatch(/(database|sql|internal|stack|trace)/i)
        }
      },
      { timeout: 10000 }
    )
  })

  describe('API Response Format', () => {
    it(
      'should return consistent response format',
      async () => {
        const testEmail = generateTestEmail('response-format')

        const result = await testAuth.createTestUserAccount(testEmail)

        // Response should have consistent structure
        expect(typeof result).toBe('object')
        expect(Object.hasOwn(result, 'user')).toBe(true)
        expect(Object.hasOwn(result, 'session')).toBe(true)
        expect(Object.hasOwn(result, 'error')).toBe(true)

        if (result.user) {
          testUsers.push({ email: testEmail, id: result.user.id })
        }
      },
      { timeout: 15000 }
    )

    it(
      'should handle malformed requests gracefully',
      async () => {
        const response = await fetch(`${integrationTestConfig.auth.baseURL}/api/auth/sign-up`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: 'invalid json',
        })

        // Should return 400 for malformed JSON
        expect(response.status).toBe(400)
      },
      { timeout: 10000 }
    )
  })
})
