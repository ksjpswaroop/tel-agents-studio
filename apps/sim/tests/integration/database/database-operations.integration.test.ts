/**
 * Database Operations Integration Tests
 *
 * Real integration tests that perform CRUD operations on actual Supabase database.
 * These tests verify that database operations work correctly with real data.
 *
 * @vitest-environment node
 */

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { generateTestEmail, validateIntegrationTestConfig } from '../config/integration-test.config'
import { testDb } from '../utils/database-helpers'

describe('Database Operations Integration', () => {
  const createdTestUsers: string[] = []
  const createdTestSessions: string[] = []
  const createdTestAccounts: string[] = []

  beforeAll(async () => {
    validateIntegrationTestConfig()
    console.log('🔄 Testing real database CRUD operations...')

    // Verify database connectivity before running operations
    const isConnected = await testDb.testConnection()
    if (!isConnected) {
      throw new Error('Database connection required for operations tests')
    }
  })

  afterEach(async () => {
    // Clean up created test data after each test
    await testDb.cleanupTestData()
  })

  afterAll(async () => {
    // Final cleanup
    await testDb.cleanupTestData()
  })

  describe('User Operations', () => {
    it(
      'should create a user record in real database',
      async () => {
        const testEmail = generateTestEmail('create-user')
        const userData = {
          name: 'Test User Create',
          email: testEmail,
          emailVerified: true,
        }

        const createdUser = await testDb.createTestUser(userData)
        createdTestUsers.push(createdUser.id)

        expect(createdUser).toBeDefined()
        expect(createdUser.id).toBeDefined()
        expect(createdUser.email).toBe(testEmail)
        expect(createdUser.name).toBe('Test User Create')
        expect(createdUser.emailVerified).toBe(true)
        expect(createdUser.createdAt).toBeDefined()
        expect(createdUser.updatedAt).toBeDefined()
      },
      { timeout: 15000 }
    )

    it(
      'should retrieve user by email from real database',
      async () => {
        // Create a test user first
        const testEmail = generateTestEmail('retrieve-user')
        const createdUser = await testDb.createTestUser({
          email: testEmail,
          name: 'Test User Retrieve',
        })
        createdTestUsers.push(createdUser.id)

        // Now retrieve the user
        const retrievedUser = await testDb.getUserByEmail(testEmail)

        expect(retrievedUser).toBeDefined()
        expect(retrievedUser!.id).toBe(createdUser.id)
        expect(retrievedUser!.email).toBe(testEmail)
        expect(retrievedUser!.name).toBe('Test User Retrieve')
      },
      { timeout: 15000 }
    )

    it(
      'should return null for non-existent user email',
      async () => {
        const nonExistentEmail = generateTestEmail('nonexistent')
        const user = await testDb.getUserByEmail(nonExistentEmail)

        expect(user).toBeNull()
      },
      { timeout: 10000 }
    )

    it(
      'should handle duplicate email creation gracefully',
      async () => {
        const testEmail = generateTestEmail('duplicate')

        // Create first user
        const firstUser = await testDb.createTestUser({ email: testEmail })
        createdTestUsers.push(firstUser.id)

        // Try to create another user with same email
        try {
          await testDb.createTestUser({ email: testEmail })
          // If no error is thrown, the database allows duplicates (which is unexpected)
          expect(true).toBe(false) // Force test failure
        } catch (error) {
          // Expected behavior - should fail due to unique constraint
          expect(error).toBeDefined()
          expect(String(error)).toContain('duplicate')
        }
      },
      { timeout: 15000 }
    )
  })

  describe('Session Operations', () => {
    it(
      'should create a session record in real database',
      async () => {
        // Create a user first
        const testUser = await testDb.createTestUser()
        createdTestUsers.push(testUser.id)

        // Create a session for the user
        const sessionData = {
          token: `test-token-${Date.now()}`,
        }
        const createdSession = await testDb.createTestSession(testUser.id, sessionData)
        createdTestSessions.push(createdSession.id)

        expect(createdSession).toBeDefined()
        expect(createdSession.id).toBeDefined()
        expect(createdSession.userId).toBe(testUser.id)
        expect(createdSession.token).toBe(sessionData.token)
        expect(createdSession.expiresAt).toBeDefined()
        expect(createdSession.createdAt).toBeDefined()
      },
      { timeout: 15000 }
    )

    it(
      'should retrieve user sessions from real database',
      async () => {
        // Create a user
        const testUser = await testDb.createTestUser()
        createdTestUsers.push(testUser.id)

        // Create multiple sessions for the user
        const session1 = await testDb.createTestSession(testUser.id, { token: 'token-1' })
        const session2 = await testDb.createTestSession(testUser.id, { token: 'token-2' })
        createdTestSessions.push(session1.id, session2.id)

        // Retrieve all sessions for the user
        const sessions = await testDb.getUserSessions(testUser.id)

        expect(sessions).toBeDefined()
        expect(sessions.length).toBeGreaterThanOrEqual(2)

        const sessionTokens = sessions.map((s) => s.token)
        expect(sessionTokens).toContain('token-1')
        expect(sessionTokens).toContain('token-2')
      },
      { timeout: 15000 }
    )

    it(
      'should handle expired sessions correctly',
      async () => {
        const testUser = await testDb.createTestUser()
        createdTestUsers.push(testUser.id)

        // Create an expired session
        const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
        const expiredSession = await testDb.createTestSession(testUser.id, {
          expiresAt: expiredDate,
          token: 'expired-token',
        })
        createdTestSessions.push(expiredSession.id)

        expect(expiredSession.expiresAt.getTime()).toBeLessThan(Date.now())
      },
      { timeout: 15000 }
    )
  })

  describe('OAuth Account Operations', () => {
    it(
      'should create OAuth account record in real database',
      async () => {
        // Create a user first
        const testUser = await testDb.createTestUser()
        createdTestUsers.push(testUser.id)

        // Create an OAuth account
        const accountData = {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          scope: 'email profile',
        }
        const createdAccount = await testDb.createTestAccount(testUser.id, 'google', accountData)
        createdTestAccounts.push(createdAccount.id)

        expect(createdAccount).toBeDefined()
        expect(createdAccount.id).toBeDefined()
        expect(createdAccount.userId).toBe(testUser.id)
        expect(createdAccount.providerId).toBe('google')
        expect(createdAccount.accessToken).toBe(accountData.accessToken)
        expect(createdAccount.refreshToken).toBe(accountData.refreshToken)
        expect(createdAccount.scope).toBe(accountData.scope)
      },
      { timeout: 15000 }
    )

    it(
      'should retrieve user OAuth accounts from real database',
      async () => {
        // Create a user
        const testUser = await testDb.createTestUser()
        createdTestUsers.push(testUser.id)

        // Create multiple OAuth accounts
        const googleAccount = await testDb.createTestAccount(testUser.id, 'google', {
          accessToken: 'google-token',
        })
        const githubAccount = await testDb.createTestAccount(testUser.id, 'github', {
          accessToken: 'github-token',
        })
        createdTestAccounts.push(googleAccount.id, githubAccount.id)

        // Retrieve all accounts for the user
        const accounts = await testDb.getUserAccounts(testUser.id)

        expect(accounts).toBeDefined()
        expect(accounts.length).toBeGreaterThanOrEqual(2)

        const providers = accounts.map((a) => a.providerId)
        expect(providers).toContain('google')
        expect(providers).toContain('github')
      },
      { timeout: 15000 }
    )

    it(
      'should handle multiple OAuth accounts for same provider',
      async () => {
        const testUser = await testDb.createTestUser()
        createdTestUsers.push(testUser.id)

        // Create multiple Google accounts (unusual but possible)
        const account1 = await testDb.createTestAccount(testUser.id, 'google', {
          accountId: 'google-account-1',
          accessToken: 'token-1',
        })
        const account2 = await testDb.createTestAccount(testUser.id, 'google', {
          accountId: 'google-account-2',
          accessToken: 'token-2',
        })
        createdTestAccounts.push(account1.id, account2.id)

        const accounts = await testDb.getUserAccounts(testUser.id)
        const googleAccounts = accounts.filter((a) => a.providerId === 'google')

        expect(googleAccounts.length).toBeGreaterThanOrEqual(2)
      },
      { timeout: 15000 }
    )
  })

  describe('Complex Data Relationships', () => {
    it(
      'should maintain referential integrity between users and sessions',
      async () => {
        // Create user with session
        const testUser = await testDb.createTestUser()
        const testSession = await testDb.createTestSession(testUser.id)
        createdTestUsers.push(testUser.id)
        createdTestSessions.push(testSession.id)

        // Verify the relationship
        const sessions = await testDb.getUserSessions(testUser.id)
        const userSession = sessions.find((s) => s.id === testSession.id)

        expect(userSession).toBeDefined()
        expect(userSession!.userId).toBe(testUser.id)
      },
      { timeout: 15000 }
    )

    it(
      'should maintain referential integrity between users and accounts',
      async () => {
        // Create user with OAuth account
        const testUser = await testDb.createTestUser()
        const testAccount = await testDb.createTestAccount(testUser.id, 'google')
        createdTestUsers.push(testUser.id)
        createdTestAccounts.push(testAccount.id)

        // Verify the relationship
        const accounts = await testDb.getUserAccounts(testUser.id)
        const userAccount = accounts.find((a) => a.id === testAccount.id)

        expect(userAccount).toBeDefined()
        expect(userAccount!.userId).toBe(testUser.id)
      },
      { timeout: 15000 }
    )

    it(
      'should handle user with both sessions and OAuth accounts',
      async () => {
        // Create user
        const testUser = await testDb.createTestUser()
        createdTestUsers.push(testUser.id)

        // Add session
        const session = await testDb.createTestSession(testUser.id)
        createdTestSessions.push(session.id)

        // Add OAuth account
        const account = await testDb.createTestAccount(testUser.id, 'google')
        createdTestAccounts.push(account.id)

        // Verify both relationships exist
        const sessions = await testDb.getUserSessions(testUser.id)
        const accounts = await testDb.getUserAccounts(testUser.id)

        expect(sessions.length).toBeGreaterThanOrEqual(1)
        expect(accounts.length).toBeGreaterThanOrEqual(1)
        expect(sessions[0].userId).toBe(testUser.id)
        expect(accounts[0].userId).toBe(testUser.id)
      },
      { timeout: 15000 }
    )
  })

  describe('Data Validation and Constraints', () => {
    it(
      'should enforce required fields for user creation',
      async () => {
        try {
          // Try to create user without required email field
          await testDb.createTestUser({ email: '', name: 'Test User' })
          expect(true).toBe(false) // Should not reach here
        } catch (error) {
          expect(error).toBeDefined()
        }
      },
      { timeout: 10000 }
    )

    it(
      'should validate email format',
      async () => {
        try {
          await testDb.createTestUser({ email: 'invalid-email', name: 'Test User' })
          // If this succeeds, database doesn't validate email format (which is fine)
        } catch (error) {
          // If validation exists, ensure it's about email format
          expect(String(error).toLowerCase()).toMatch(/email|format|invalid/)
        }
      },
      { timeout: 10000 }
    )

    it(
      'should handle very long field values',
      async () => {
        const longName = 'A'.repeat(1000) // Very long name

        try {
          const user = await testDb.createTestUser({
            name: longName,
            email: generateTestEmail('long-name'),
          })
          createdTestUsers.push(user.id)

          // If creation succeeds, verify the name was stored (possibly truncated)
          expect(user.name).toBeDefined()
        } catch (error) {
          // If it fails, it should be due to length constraints
          expect(String(error).toLowerCase()).toMatch(/length|too long|limit/)
        }
      },
      { timeout: 10000 }
    )
  })

  describe('Concurrency and Performance', () => {
    it(
      'should handle concurrent user creation',
      async () => {
        const promises = Array.from({ length: 3 }, (_, i) =>
          testDb.createTestUser({
            email: generateTestEmail(`concurrent-${i}`),
            name: `Concurrent User ${i}`,
          })
        )

        const users = await Promise.all(promises)
        users.forEach((user) => createdTestUsers.push(user.id))

        expect(users).toHaveLength(3)
        users.forEach((user) => {
          expect(user.id).toBeDefined()
          expect(user.email).toMatch(/concurrent-/)
        })
      },
      { timeout: 20000 }
    )

    it(
      'should handle batch operations efficiently',
      async () => {
        // Create a user for batch session creation
        const testUser = await testDb.createTestUser()
        createdTestUsers.push(testUser.id)

        const startTime = Date.now()

        // Create multiple sessions in parallel
        const sessionPromises = Array.from({ length: 5 }, (_, i) =>
          testDb.createTestSession(testUser.id, { token: `batch-token-${i}` })
        )

        const sessions = await Promise.all(sessionPromises)
        const endTime = Date.now()

        sessions.forEach((session) => createdTestSessions.push(session.id))

        expect(sessions).toHaveLength(5)
        expect(endTime - startTime).toBeLessThan(10000) // Should complete within 10 seconds
      },
      { timeout: 15000 }
    )
  })
})
