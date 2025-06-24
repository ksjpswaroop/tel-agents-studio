/**
 * Integration Test Configuration
 *
 * Configuration for real API integration tests that hit live services.
 * Uses separate test environment variables to avoid affecting production.
 */

export const integrationTestConfig = {
  // Test environment flags
  isIntegrationTest: true,
  skipSlowTests: process.env.SKIP_SLOW_TESTS === 'true',

  // Database configuration (uses real Supabase test database)
  database: {
    url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    supabaseUrl: process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey:
      process.env.TEST_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceKey: process.env.TEST_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY,
  },

  // Authentication configuration (uses real Better Auth test instance)
  auth: {
    baseURL:
      process.env.TEST_BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    secret: process.env.TEST_BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET,
    appUrl: process.env.TEST_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // OAuth configuration (uses real test OAuth apps)
  oauth: {
    google: {
      clientId: process.env.TEST_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.TEST_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: process.env.TEST_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.TEST_GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET,
    },
  },

  // Test user accounts (real accounts for testing)
  testUsers: {
    regular: {
      email: process.env.TEST_USER_EMAIL || 'test-user@example.com',
      password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
      id: 'test-user-id',
    },
    admin: {
      email: process.env.TEST_ADMIN_EMAIL || 'admin-test@example.com',
      password: process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!',
      id: 'test-admin-id',
    },
    // Dynamic test user (created during tests)
    dynamic: {
      emailPrefix: 'integration-test',
      domain: 'example.com',
      password: 'IntegrationTest123!',
    },
  },

  // Test configuration
  test: {
    timeout: 30000, // 30 seconds for real API calls
    retries: 2, // Retry failed tests due to network issues
    cleanup: process.env.TEST_CLEANUP !== 'false', // Auto cleanup test data
    verbose: process.env.TEST_VERBOSE === 'true',
  },

  // Rate limiting for API calls
  rateLimit: {
    delayBetweenTests: 100, // ms delay between tests
    maxConcurrentRequests: 5,
  },
}

// Validation function to ensure required test configuration is present
export function validateIntegrationTestConfig(): void {
  const required = ['database.url', 'auth.baseURL', 'auth.secret']

  const missing: string[] = []

  for (const path of required) {
    const keys = path.split('.')
    let current: any = integrationTestConfig

    for (const key of keys) {
      current = current?.[key]
      if (current === undefined || current === null || current === '') {
        missing.push(path)
        break
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required integration test configuration: ${missing.join(', ')}`)
  }
}

// Helper to generate unique test identifiers
export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Helper to generate unique test email addresses
export function generateTestEmail(prefix?: string): string {
  const emailPrefix = prefix || integrationTestConfig.testUsers.dynamic.emailPrefix
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 5)
  return `${emailPrefix}-${timestamp}-${random}@${integrationTestConfig.testUsers.dynamic.domain}`
}

// Helper to wait between API calls to respect rate limits
export function delayBetweenTests(): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, integrationTestConfig.rateLimit.delayBetweenTests)
  )
}

// Export types for TypeScript
export type IntegrationTestConfig = typeof integrationTestConfig
export type TestUser = typeof integrationTestConfig.testUsers.regular
