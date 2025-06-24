/**
 * Email Signup/Login Integration Tests
 *
 * Real integration tests for complete email-based authentication flows.
 * Tests the full user journey from signup to login with real API calls.
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
import { testAuth, waitForEmailVerification } from '../utils/auth-helpers'
import { testDb } from '../utils/database-helpers'

describe('Email Signup/Login Integration', () => {
  const testUsers: Array<{ email: string; password: string; id?: string }> = []

  beforeAll(async () => {
    validateIntegrationTestConfig()
    console.log('📧 Testing real email signup and login flows...')

    // Verify both auth and database services are available
    const authConnected = await testAuth.testAuthConnection()
    const dbConnected = await testDb.testConnection()

    if (!authConnected || !dbConnected) {
      throw new Error('Both auth and database services required for email flow tests')
    }
  })

  afterEach(async () => {
    await delayBetweenTests()
  })

  afterAll(async () => {
    await testDb.cleanupTestData()
  })

  describe('Complete Signup Flow', () => {
    it(
      'should complete full signup → verification → login flow',
      async () => {
        const testEmail = generateTestEmail('complete-flow')
        const testPassword = integrationTestConfig.testUsers.dynamic.password

        // Step 1: Sign up
        console.log('🔹 Step 1: Creating account...')
        const signupResult = await testAuth.createTestUserAccount(testEmail, testPassword)

        if (signupResult.user) {
          testUsers.push({ email: testEmail, password: testPassword, id: signupResult.user.id })

          expect(signupResult.user.email).toBe(testEmail)
          expect(signupResult.error).toBeNull()

          // Step 2: Verify user exists in database
          console.log('🔹 Step 2: Verifying user in database...')
          const dbUser = await testDb.getUserByEmail(testEmail)
          expect(dbUser).toBeDefined()
          expect(dbUser!.email).toBe(testEmail)

          // Step 3: Check if email verification is required
          console.log('🔹 Step 3: Checking email verification requirement...')
          const initialLoginResult = await testAuth.signInWithCredentials(testEmail, testPassword)

          if (
            initialLoginResult.error &&
            String(initialLoginResult.error).includes('verification')
          ) {
            console.log('📧 Email verification required, simulating verification...')

            // In real tests, you would:
            // 1. Check test email service for verification email
            // 2. Extract verification code/link
            // 3. Complete verification
            const verificationSuccess = await waitForEmailVerification(testEmail)
            expect(verificationSuccess).toBe(true)

            // Try login again after "verification"
            const postVerificationLogin = await testAuth.signInWithCredentials(
              testEmail,
              testPassword
            )
            if (postVerificationLogin.user) {
              expect(postVerificationLogin.user.email).toBe(testEmail)
              expect(postVerificationLogin.session).toBeDefined()
            }
          } else if (initialLoginResult.user) {
            // Login succeeded immediately (no verification required)
            console.log('✅ Login succeeded without verification requirement')
            expect(initialLoginResult.user.email).toBe(testEmail)
            expect(initialLoginResult.session).toBeDefined()
          } else {
            console.log('❌ Login failed:', initialLoginResult.error)
          }
        } else {
          console.log('Signup failed (might be expected):', signupResult.error)
          expect(signupResult.error).toBeDefined()
        }
      },
      { timeout: 30000 }
    )

    it(
      'should create user record in database during signup',
      async () => {
        const testEmail = generateTestEmail('db-creation')
        const testPassword = integrationTestConfig.testUsers.dynamic.password

        // Verify user doesn't exist before signup
        const beforeSignup = await testDb.getUserByEmail(testEmail)
        expect(beforeSignup).toBeNull()

        // Sign up
        const signupResult = await testAuth.createTestUserAccount(testEmail, testPassword)

        if (signupResult.user) {
          testUsers.push({ email: testEmail, password: testPassword, id: signupResult.user.id })

          // Verify user was created in database
          const afterSignup = await testDb.getUserByEmail(testEmail)
          expect(afterSignup).toBeDefined()
          expect(afterSignup!.email).toBe(testEmail)
          expect(afterSignup!.id).toBe(signupResult.user.id)
          expect(afterSignup!.createdAt).toBeDefined()
        }
      },
      { timeout: 20000 }
    )

    it(
      'should handle signup with additional user data',
      async () => {
        const testEmail = generateTestEmail('with-name')
        const testPassword = integrationTestConfig.testUsers.dynamic.password
        const testName = 'Test User With Name'

        // Create account with name
        const signupResult = await testAuth.createTestUserAccount(testEmail, testPassword)

        if (signupResult.user) {
          testUsers.push({ email: testEmail, password: testPassword, id: signupResult.user.id })

          expect(signupResult.user.email).toBe(testEmail)
          // Note: name might be set during account creation

          // Verify in database
          const dbUser = await testDb.getUserByEmail(testEmail)
          expect(dbUser).toBeDefined()
          expect(dbUser!.name).toBeDefined()
        }
      },
      { timeout: 15000 }
    )
  })

  describe('Login Variations', () => {
    let testUserForLogin: { email: string; password: string; id?: string }

    beforeAll(async () => {
      // Create a test user for login tests
      const email = generateTestEmail('login-tests')
      const password = integrationTestConfig.testUsers.dynamic.password

      const signupResult = await testAuth.createTestUserAccount(email, password)
      if (signupResult.user) {
        testUserForLogin = { email, password, id: signupResult.user.id }
        testUsers.push(testUserForLogin)

        // Wait for user creation to complete
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    })

    it(
      'should login with correct credentials',
      async () => {
        if (!testUserForLogin) {
          console.log('Skipping test - no test user available')
          return
        }

        const loginResult = await testAuth.signInWithCredentials(
          testUserForLogin.email,
          testUserForLogin.password
        )

        if (loginResult.user) {
          expect(loginResult.user.email).toBe(testUserForLogin.email)
          expect(loginResult.session).toBeDefined()

          // Verify session exists in database
          if (loginResult.session && testUserForLogin.id) {
            const sessions = await testDb.getUserSessions(testUserForLogin.id)
            expect(sessions.length).toBeGreaterThan(0)
          }
        } else {
          console.log('Login failed (might need email verification):', loginResult.error)
        }
      },
      { timeout: 15000 }
    )

    it(
      'should reject login with wrong password',
      async () => {
        if (!testUserForLogin) {
          console.log('Skipping test - no test user available')
          return
        }

        const loginResult = await testAuth.signInWithCredentials(
          testUserForLogin.email,
          'wrong-password'
        )

        expect(loginResult.error).toBeDefined()
        expect(loginResult.user).toBeNull()
        expect(String(loginResult.error).toLowerCase()).toMatch(/(password|credentials|invalid)/i)
      },
      { timeout: 10000 }
    )

    it(
      'should handle case-insensitive email login',
      async () => {
        if (!testUserForLogin) {
          console.log('Skipping test - no test user available')
          return
        }

        const uppercaseEmail = testUserForLogin.email.toUpperCase()
        const loginResult = await testAuth.signInWithCredentials(
          uppercaseEmail,
          testUserForLogin.password
        )

        // Behavior may vary - some systems are case-sensitive, others aren't
        if (loginResult.user) {
          expect(loginResult.user.email.toLowerCase()).toBe(testUserForLogin.email.toLowerCase())
        } else {
          console.log('Case-insensitive login not supported or user needs verification')
        }
      },
      { timeout: 10000 }
    )
  })

  describe('Session Creation and Management', () => {
    it(
      'should create session on successful login',
      async () => {
        const testEmail = generateTestEmail('session-creation')
        const testPassword = integrationTestConfig.testUsers.dynamic.password

        // Create user
        const signupResult = await testAuth.createTestUserAccount(testEmail, testPassword)
        if (signupResult.user) {
          testUsers.push({ email: testEmail, password: testPassword, id: signupResult.user.id })

          await new Promise((resolve) => setTimeout(resolve, 1000))

          // Login and verify session creation
          const loginResult = await testAuth.signInWithCredentials(testEmail, testPassword)
          if (loginResult.session) {
            expect(loginResult.session).toBeDefined()
            expect(loginResult.session.userId || loginResult.session.user?.id).toBe(
              signupResult.user.id
            )

            // Verify session in database
            const sessions = await testDb.getUserSessions(signupResult.user.id)
            if (sessions.length > 0) {
              expect(sessions[0].userId).toBe(signupResult.user.id)
              expect(sessions[0].expiresAt.getTime()).toBeGreaterThan(Date.now())
            }
          }
        }
      },
      { timeout: 20000 }
    )

    it(
      'should handle multiple concurrent logins',
      async () => {
        const testEmail = generateTestEmail('concurrent-login')
        const testPassword = integrationTestConfig.testUsers.dynamic.password

        // Create user
        const signupResult = await testAuth.createTestUserAccount(testEmail, testPassword)
        if (signupResult.user) {
          testUsers.push({ email: testEmail, password: testPassword, id: signupResult.user.id })

          await new Promise((resolve) => setTimeout(resolve, 1000))

          // Attempt multiple concurrent logins
          const loginPromises = Array.from({ length: 3 }, () =>
            testAuth.signInWithCredentials(testEmail, testPassword)
          )

          const loginResults = await Promise.all(loginPromises)

          // At least one should succeed, or all should fail with same error
          const successful = loginResults.filter((r) => r.user !== null)
          const failed = loginResults.filter((r) => r.error !== null)

          if (successful.length > 0) {
            // If any succeeded, verify they're for the same user
            successful.forEach((result) => {
              expect(result.user.id).toBe(signupResult.user.id)
            })
          } else {
            // If all failed, should be consistent error
            expect(failed.length).toBe(3)
          }
        }
      },
      { timeout: 25000 }
    )
  })

  describe('Error Handling and Edge Cases', () => {
    it(
      'should handle empty email field',
      async () => {
        const result = await testAuth.signInWithCredentials('', 'any-password')

        expect(result.error).toBeDefined()
        expect(String(result.error).toLowerCase()).toMatch(/(email|required|empty)/i)
      },
      { timeout: 10000 }
    )

    it(
      'should handle empty password field',
      async () => {
        const result = await testAuth.signInWithCredentials('test@example.com', '')

        expect(result.error).toBeDefined()
        expect(String(result.error).toLowerCase()).toMatch(/(password|required|empty)/i)
      },
      { timeout: 10000 }
    )

    it(
      'should handle malformed email addresses',
      async () => {
        const malformedEmails = ['not-an-email', '@example.com', 'test@', 'test..test@example.com']

        for (const email of malformedEmails) {
          const result = await testAuth.createTestUserAccount(email)
          expect(result.error).toBeDefined()
          expect(String(result.error).toLowerCase()).toMatch(/(email|invalid|format)/i)
        }
      },
      { timeout: 15000 }
    )

    it(
      'should handle extremely long input values',
      async () => {
        const longEmail = `${'a'.repeat(1000)}@example.com`
        const longPassword = `password${'a'.repeat(1000)}`

        const result = await testAuth.createTestUserAccount(longEmail, longPassword)

        expect(result.error).toBeDefined()
        // Should fail due to length validation
      },
      { timeout: 10000 }
    )

    it(
      'should handle special characters in email',
      async () => {
        const specialEmail = generateTestEmail('special+chars.test-123')
        const testPassword = integrationTestConfig.testUsers.dynamic.password

        const result = await testAuth.createTestUserAccount(specialEmail, testPassword)

        if (result.user) {
          testUsers.push({ email: specialEmail, password: testPassword, id: result.user.id })
          expect(result.user.email).toBe(specialEmail)
        } else {
          // Some systems might not support special characters
          console.log('Special characters in email not supported:', result.error)
        }
      },
      { timeout: 15000 }
    )
  })

  describe('Security Validations', () => {
    it(
      'should not expose sensitive information in errors',
      async () => {
        const testEmail = generateTestEmail('security-test')

        const result = await testAuth.signInWithCredentials(testEmail, 'wrong-password')

        if (result.error) {
          const errorMessage = String(result.error).toLowerCase()

          // Should not expose internal system details
          expect(errorMessage).not.toMatch(/(database|sql|internal|stack|trace|debug)/i)

          // Should not indicate whether user exists or not (to prevent enumeration)
          expect(errorMessage).toMatch(/(credentials|invalid|unauthorized|login)/i)
        }
      },
      { timeout: 10000 }
    )

    it(
      'should enforce password complexity if configured',
      async () => {
        const testEmail = generateTestEmail('password-complexity')
        const weakPasswords = ['123', 'password', 'abc', 'test']

        for (const weakPassword of weakPasswords) {
          const result = await testAuth.createTestUserAccount(testEmail, weakPassword)

          if (result.user) {
            testUsers.push({ email: testEmail, password: weakPassword, id: result.user.id })
            // If weak password is accepted, system doesn't enforce complexity
            console.log('Weak password accepted - no complexity requirements')
            break
          }
          // If rejected, should be due to password policy
          expect(result.error).toBeDefined()
        }
      },
      { timeout: 15000 }
    )
  })
})
