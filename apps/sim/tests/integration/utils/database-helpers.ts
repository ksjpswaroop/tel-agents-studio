/**
 * Real Database Test Helpers
 *
 * Utilities for performing real database operations during integration tests.
 * These helpers interact with the actual test database, not mocks.
 */

import { generateTestId, integrationTestConfig } from '../config/integration-test.config'

interface TestUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string | null
  createdAt: Date
  updatedAt: Date
}

interface TestSession {
  id: string
  userId: string
  expiresAt: Date
  token: string
  createdAt: Date
  updatedAt: Date
}

interface TestAccount {
  id: string
  accountId: string
  providerId: string
  userId: string
  accessToken?: string | null
  refreshToken?: string | null
  idToken?: string | null
  accessTokenExpiresAt?: Date | null
  scope?: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Real database operations for testing
 */
export class TestDatabaseHelpers {
  private baseUrl: string
  private anonKey: string
  private serviceKey: string | undefined

  constructor() {
    this.baseUrl = integrationTestConfig.database.supabaseUrl!
    this.anonKey = integrationTestConfig.database.supabaseAnonKey!
    this.serviceKey = integrationTestConfig.database.supabaseServiceKey

    if (!this.baseUrl || !this.anonKey) {
      throw new Error('Supabase configuration is required for integration tests')
    }
  }

  /**
   * Test database connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/v1/user?limit=1`, {
        method: 'GET',
        headers: {
          apikey: this.anonKey,
          Authorization: `Bearer ${this.anonKey}`,
          'Content-Type': 'application/json',
        },
      })

      return response.ok
    } catch (error) {
      console.error('Database connection test failed:', error)
      return false
    }
  }

  /**
   * Create a test user in the real database
   */
  async createTestUser(userData: Partial<TestUser> = {}): Promise<TestUser> {
    const testUserId = generateTestId('user')
    const now = new Date()

    const user: TestUser = {
      id: testUserId,
      name: userData.name || `Test User ${testUserId}`,
      email: userData.email || `${testUserId}@example.com`,
      emailVerified: userData.emailVerified ?? true,
      image: userData.image || null,
      createdAt: now,
      updatedAt: now,
      ...userData,
    }

    const response = await fetch(`${this.baseUrl}/rest/v1/user`, {
      method: 'POST',
      headers: {
        apikey: this.anonKey,
        Authorization: `Bearer ${this.serviceKey || this.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(user),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create test user: ${response.status} ${error}`)
    }

    const [createdUser] = await response.json()
    return createdUser
  }

  /**
   * Create a test session in the real database
   */
  async createTestSession(
    userId: string,
    sessionData: Partial<TestSession> = {}
  ): Promise<TestSession> {
    const testSessionId = generateTestId('session')
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

    const session: TestSession = {
      id: testSessionId,
      userId,
      expiresAt,
      token: generateTestId('token'),
      createdAt: now,
      updatedAt: now,
      ...sessionData,
    }

    const response = await fetch(`${this.baseUrl}/rest/v1/session`, {
      method: 'POST',
      headers: {
        apikey: this.anonKey,
        Authorization: `Bearer ${this.serviceKey || this.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(session),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create test session: ${response.status} ${error}`)
    }

    const [createdSession] = await response.json()
    return createdSession
  }

  /**
   * Create a test OAuth account in the real database
   */
  async createTestAccount(
    userId: string,
    providerId: string,
    accountData: Partial<TestAccount> = {}
  ): Promise<TestAccount> {
    const testAccountId = generateTestId('account')
    const now = new Date()

    const account: TestAccount = {
      id: testAccountId,
      accountId: generateTestId('oauth'),
      providerId,
      userId,
      accessToken: accountData.accessToken || generateTestId('access'),
      refreshToken: accountData.refreshToken || generateTestId('refresh'),
      idToken: accountData.idToken,
      accessTokenExpiresAt:
        accountData.accessTokenExpiresAt || new Date(now.getTime() + 3600 * 1000),
      scope: accountData.scope || 'email profile',
      createdAt: now,
      updatedAt: now,
      ...accountData,
    }

    const response = await fetch(`${this.baseUrl}/rest/v1/account`, {
      method: 'POST',
      headers: {
        apikey: this.anonKey,
        Authorization: `Bearer ${this.serviceKey || this.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(account),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create test account: ${response.status} ${error}`)
    }

    const [createdAccount] = await response.json()
    return createdAccount
  }

  /**
   * Get user by email from real database
   */
  async getUserByEmail(email: string): Promise<TestUser | null> {
    const response = await fetch(
      `${this.baseUrl}/rest/v1/user?email=eq.${encodeURIComponent(email)}&limit=1`,
      {
        method: 'GET',
        headers: {
          apikey: this.anonKey,
          Authorization: `Bearer ${this.anonKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const users = await response.json()
    return users.length > 0 ? users[0] : null
  }

  /**
   * Get user sessions from real database
   */
  async getUserSessions(userId: string): Promise<TestSession[]> {
    const response = await fetch(`${this.baseUrl}/rest/v1/session?user_id=eq.${userId}`, {
      method: 'GET',
      headers: {
        apikey: this.anonKey,
        Authorization: `Bearer ${this.anonKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return []
    }

    return await response.json()
  }

  /**
   * Get user OAuth accounts from real database
   */
  async getUserAccounts(userId: string): Promise<TestAccount[]> {
    const response = await fetch(`${this.baseUrl}/rest/v1/account?user_id=eq.${userId}`, {
      method: 'GET',
      headers: {
        apikey: this.anonKey,
        Authorization: `Bearer ${this.anonKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return []
    }

    return await response.json()
  }

  /**
   * Clean up test data by deleting records with test identifiers
   */
  async cleanupTestData(): Promise<void> {
    if (!integrationTestConfig.test.cleanup) {
      console.log('Test cleanup disabled, skipping...')
      return
    }

    try {
      // Delete test sessions
      await fetch(`${this.baseUrl}/rest/v1/session?id=like.*test-*`, {
        method: 'DELETE',
        headers: {
          apikey: this.anonKey,
          Authorization: `Bearer ${this.serviceKey || this.anonKey}`,
          'Content-Type': 'application/json',
        },
      })

      // Delete test accounts
      await fetch(`${this.baseUrl}/rest/v1/account?id=like.*test-*`, {
        method: 'DELETE',
        headers: {
          apikey: this.anonKey,
          Authorization: `Bearer ${this.serviceKey || this.anonKey}`,
          'Content-Type': 'application/json',
        },
      })

      // Delete test users
      await fetch(`${this.baseUrl}/rest/v1/user?id=like.*test-*`, {
        method: 'DELETE',
        headers: {
          apikey: this.anonKey,
          Authorization: `Bearer ${this.serviceKey || this.anonKey}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Test data cleanup completed')
    } catch (error) {
      console.error('Test data cleanup failed:', error)
    }
  }

  /**
   * Execute custom SQL query (if service key is available)
   */
  async executeQuery(query: string): Promise<any> {
    if (!this.serviceKey) {
      throw new Error('Service key required for custom queries')
    }

    const response = await fetch(`${this.baseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        apikey: this.anonKey,
        Authorization: `Bearer ${this.serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Query failed: ${response.status} ${error}`)
    }

    return await response.json()
  }
}

// Export singleton instance
export const testDb = new TestDatabaseHelpers()
