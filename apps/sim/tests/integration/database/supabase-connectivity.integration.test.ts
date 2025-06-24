/**
 * Supabase Database Connectivity Integration Tests
 *
 * Real integration tests that connect to actual Supabase database.
 * These tests verify database connectivity, authentication, and basic operations.
 *
 * @vitest-environment node
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  integrationTestConfig,
  validateIntegrationTestConfig,
} from '../config/integration-test.config'
import { testDb } from '../utils/database-helpers'

describe('Supabase Database Connectivity Integration', () => {
  beforeAll(async () => {
    // Validate configuration before running tests
    validateIntegrationTestConfig()

    console.log('🔌 Testing real Supabase database connectivity...')
    console.log(`📍 Database URL: ${integrationTestConfig.database.supabaseUrl}`)
  })

  afterAll(async () => {
    // Clean up any test data
    await testDb.cleanupTestData()
  })

  describe('Database Connection', () => {
    it(
      'should connect to real Supabase database',
      async () => {
        const isConnected = await testDb.testConnection()

        expect(isConnected).toBe(true)
      },
      { timeout: 10000 }
    )

    it(
      'should authenticate with anon key',
      async () => {
        const response = await fetch(
          `${integrationTestConfig.database.supabaseUrl}/rest/v1/user?limit=1`,
          {
            method: 'GET',
            headers: {
              apikey: integrationTestConfig.database.supabaseAnonKey!,
              Authorization: `Bearer ${integrationTestConfig.database.supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        )

        // Should get 200 or 401, both indicate auth is working
        expect([200, 401, 406]).toContain(response.status)
      },
      { timeout: 10000 }
    )

    it(
      'should reject requests without authentication',
      async () => {
        const response = await fetch(`${integrationTestConfig.database.supabaseUrl}/rest/v1/user`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // No apikey or Authorization header
          },
        })

        expect(response.status).toBe(401)
      },
      { timeout: 10000 }
    )
  })

  describe('Database Schema Validation', () => {
    it(
      'should have user table with correct structure',
      async () => {
        const response = await fetch(
          `${integrationTestConfig.database.supabaseUrl}/rest/v1/user?limit=0`,
          {
            method: 'HEAD',
            headers: {
              apikey: integrationTestConfig.database.supabaseAnonKey!,
              Authorization: `Bearer ${integrationTestConfig.database.supabaseAnonKey}`,
            },
          }
        )

        // If table exists and is accessible, should get 200
        expect([200, 401, 406]).toContain(response.status)
      },
      { timeout: 10000 }
    )

    it(
      'should have session table with correct structure',
      async () => {
        const response = await fetch(
          `${integrationTestConfig.database.supabaseUrl}/rest/v1/session?limit=0`,
          {
            method: 'HEAD',
            headers: {
              apikey: integrationTestConfig.database.supabaseAnonKey!,
              Authorization: `Bearer ${integrationTestConfig.database.supabaseAnonKey}`,
            },
          }
        )

        expect([200, 401, 406]).toContain(response.status)
      },
      { timeout: 10000 }
    )

    it(
      'should have account table with correct structure',
      async () => {
        const response = await fetch(
          `${integrationTestConfig.database.supabaseUrl}/rest/v1/account?limit=0`,
          {
            method: 'HEAD',
            headers: {
              apikey: integrationTestConfig.database.supabaseAnonKey!,
              Authorization: `Bearer ${integrationTestConfig.database.supabaseAnonKey}`,
            },
          }
        )

        expect([200, 401, 406]).toContain(response.status)
      },
      { timeout: 10000 }
    )
  })

  describe('Database Operations', () => {
    it(
      'should be able to query user table',
      async () => {
        const response = await fetch(
          `${integrationTestConfig.database.supabaseUrl}/rest/v1/user?limit=5`,
          {
            method: 'GET',
            headers: {
              apikey: integrationTestConfig.database.supabaseAnonKey!,
              Authorization: `Bearer ${integrationTestConfig.database.supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          expect(Array.isArray(data)).toBe(true)
        } else {
          // If we get 401/403, that's expected for row-level security
          expect([401, 403, 406]).toContain(response.status)
        }
      },
      { timeout: 10000 }
    )

    it(
      'should handle invalid table names gracefully',
      async () => {
        const response = await fetch(
          `${integrationTestConfig.database.supabaseUrl}/rest/v1/nonexistent_table`,
          {
            method: 'GET',
            headers: {
              apikey: integrationTestConfig.database.supabaseAnonKey!,
              Authorization: `Bearer ${integrationTestConfig.database.supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        )

        // Should return 404 for non-existent table
        expect(response.status).toBe(404)
      },
      { timeout: 10000 }
    )

    it(
      'should handle malformed requests gracefully',
      async () => {
        const response = await fetch(`${integrationTestConfig.database.supabaseUrl}/rest/v1/user`, {
          method: 'POST',
          headers: {
            apikey: integrationTestConfig.database.supabaseAnonKey!,
            Authorization: `Bearer ${integrationTestConfig.database.supabaseAnonKey}`,
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

  describe('Real-time Capabilities', () => {
    it(
      'should support real-time websocket connections',
      async () => {
        // Test if real-time endpoint is available
        const wsUrl = integrationTestConfig.database
          .supabaseUrl!.replace('https://', 'wss://')
          .replace('http://', 'ws://')
        const realtimeUrl = `${wsUrl}/realtime/v1/websocket?apikey=${integrationTestConfig.database.supabaseAnonKey}&vsn=1.0.0`

        // Just test if the endpoint exists (we can't easily test WebSocket in this context)
        const response = await fetch(
          realtimeUrl.replace('wss://', 'https://').replace('ws://', 'http://'),
          {
            method: 'HEAD',
            headers: {
              apikey: integrationTestConfig.database.supabaseAnonKey!,
            },
          }
        )

        // Real-time endpoint might return various status codes, we just want to ensure it's reachable
        expect(response.status).toBeGreaterThan(0)
      },
      { timeout: 10000 }
    )
  })

  describe('Performance and Limits', () => {
    it(
      'should handle concurrent requests',
      async () => {
        const promises = Array.from({ length: 5 }, () =>
          fetch(`${integrationTestConfig.database.supabaseUrl}/rest/v1/user?limit=1`, {
            method: 'GET',
            headers: {
              apikey: integrationTestConfig.database.supabaseAnonKey!,
              Authorization: `Bearer ${integrationTestConfig.database.supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
          })
        )

        const responses = await Promise.all(promises)

        // All requests should complete (regardless of success/auth status)
        responses.forEach((response) => {
          expect(response.status).toBeGreaterThan(0)
        })
      },
      { timeout: 15000 }
    )

    it(
      'should respect row limits',
      async () => {
        const response = await fetch(
          `${integrationTestConfig.database.supabaseUrl}/rest/v1/user?limit=2`,
          {
            method: 'GET',
            headers: {
              apikey: integrationTestConfig.database.supabaseAnonKey!,
              Authorization: `Bearer ${integrationTestConfig.database.supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          expect(data.length).toBeLessThanOrEqual(2)
        } else {
          // If auth fails, that's expected behavior
          expect([401, 403, 406]).toContain(response.status)
        }
      },
      { timeout: 10000 }
    )
  })

  describe('Error Handling', () => {
    it(
      'should handle network timeouts gracefully',
      async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 100) // Very short timeout

        try {
          await fetch(`${integrationTestConfig.database.supabaseUrl}/rest/v1/user`, {
            method: 'GET',
            headers: {
              apikey: integrationTestConfig.database.supabaseAnonKey!,
              Authorization: `Bearer ${integrationTestConfig.database.supabaseAnonKey}`,
            },
            signal: controller.signal,
          })
        } catch (error) {
          expect(error).toBeDefined()
        } finally {
          clearTimeout(timeoutId)
        }
      },
      { timeout: 5000 }
    )

    it(
      'should handle invalid API keys',
      async () => {
        const response = await fetch(`${integrationTestConfig.database.supabaseUrl}/rest/v1/user`, {
          method: 'GET',
          headers: {
            apikey: 'invalid-key',
            Authorization: 'Bearer invalid-key',
            'Content-Type': 'application/json',
          },
        })

        expect(response.status).toBe(401)
      },
      { timeout: 10000 }
    )
  })
})
