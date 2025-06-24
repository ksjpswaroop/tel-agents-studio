# Integration Tests

Real API integration tests that test actual services without mocks. These tests verify that Supabase database, Better Auth, and OAuth integrations work correctly with live services.

## 🎯 Test Categories

### Database Tests (`/database`)
- **Supabase Connectivity**: Real database connection and schema validation
- **Database Operations**: Real CRUD operations with actual data persistence
- Tests connection, authentication, table structure, and data operations

### Authentication Tests (`/auth`)
- **Better Auth Flows**: Real auth API endpoints and session management
- **Email Signup/Login**: Complete email authentication flows with database persistence
- Tests user registration, login, session creation, and password reset

### OAuth Tests (`/oauth`)
- **Google OAuth**: Real Google OAuth URL generation and token validation
- Tests OAuth flow setup, security parameters, and Google API connectivity

### End-to-End Tests (`/e2e`)
- **Complete User Journey**: Full signup → verification → login → access flows
- Tests complete user lifecycle with real API calls and database operations

## 🚀 Running Tests

### All Integration Tests
```bash
npm run test:integration
```

### Specific Categories
```bash
npm run test:integration:database    # Database connectivity and operations
npm run test:integration:auth        # Authentication flows
npm run test:integration:oauth       # OAuth integration
npm run test:integration:e2e         # End-to-end user journeys
```

### Watch Mode
```bash
npm run test:integration:watch       # Watch all integration tests
```

## ⚙️ Configuration

### Environment Variables

Integration tests use real services and require proper configuration:

#### Required Variables
```env
# Database (uses your real Supabase database)
DATABASE_URL=postgresql://user:pass@host:port/db
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Authentication (uses your real Better Auth instance)
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-32-char-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OAuth (uses your real OAuth apps)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### Optional Test-Specific Variables
```env
# Use separate test environment (recommended for safety)
TEST_DATABASE_URL=postgresql://test-db-connection
TEST_BETTER_AUTH_URL=http://localhost:3001
TEST_GOOGLE_CLIENT_ID=test-oauth-app-id
TEST_GOOGLE_CLIENT_SECRET=test-oauth-secret

# Test users (for consistent testing)
TEST_USER_EMAIL=test-user@example.com
TEST_USER_PASSWORD=TestPassword123!

# Test configuration
TEST_CLEANUP=true                    # Auto-cleanup test data (default: true)
TEST_VERBOSE=false                   # Verbose test output (default: false)
SKIP_SLOW_TESTS=false               # Skip slow network tests (default: false)
```

### Test Safety

#### Data Protection
- Tests create records with `test-*` prefixes for easy identification
- Automatic cleanup removes all test data after tests complete
- Use separate test databases when possible to avoid affecting production data

#### Rate Limiting
- Built-in delays between tests to respect API rate limits
- Concurrent request limits to avoid overwhelming services
- Retry logic for network-related failures

## 📋 Test Structure

### Test Utilities

#### `config/integration-test.config.ts`
- Central configuration for all integration tests
- Environment variable validation
- Test user management and ID generation

#### `utils/database-helpers.ts`
- Real database operations (CREATE, READ, UPDATE, DELETE)
- User, session, and OAuth account management
- Database connectivity testing and cleanup

#### `utils/auth-helpers.ts`
- Real authentication API calls
- User registration, login, logout flows
- Session management and validation
- OAuth URL generation and token handling

### Test Patterns

#### Real API Calls
```typescript
// Example: Real user creation
const signupResult = await testAuth.createTestUserAccount(email, password)
expect(signupResult.user).toBeDefined()

// Example: Real database verification
const dbUser = await testDb.getUserByEmail(email)
expect(dbUser).toBeDefined()
```

#### Error Handling
```typescript
// Tests handle both success and expected failure scenarios
if (result.error) {
  console.log('Expected error:', result.error)
  expect(result.error).toBeDefined()
} else {
  expect(result.user).toBeDefined()
}
```

#### Cleanup
```typescript
// Automatic cleanup after tests
afterAll(async () => {
  await testDb.cleanupTestData()
})
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Failures
```
Error: Database connection required for operations tests
```
**Solution**: Verify `DATABASE_URL` and Supabase credentials are correct

#### Authentication Service Unavailable
```
Error: Better Auth service connection required for auth tests
```
**Solution**: Ensure your Next.js app is running on the configured `BETTER_AUTH_URL`

#### OAuth Configuration Issues
```
Error: Google OAuth credentials required for OAuth tests
```
**Solution**: Set up Google OAuth app and configure `GOOGLE_CLIENT_ID/SECRET`

#### Test Data Cleanup Issues
```
Warning: Test data cleanup failed
```
**Solution**: Check database permissions for DELETE operations on test records

### Test Environment Setup

#### Local Development
1. Start your Next.js application: `npm run dev`
2. Ensure database is accessible and tables exist
3. Configure OAuth apps with correct redirect URIs
4. Run tests: `npm run test:integration`

#### CI/CD Environment
1. Use separate test database and OAuth apps
2. Set all required environment variables
3. Ensure test services are reachable from CI environment
4. Consider using test-specific domains/URLs

### Performance Considerations

#### Test Duration
- Database tests: ~2-5 seconds each
- Auth flow tests: ~5-15 seconds each
- OAuth tests: ~5-10 seconds each
- E2E tests: ~20-60 seconds each

#### Optimization Tips
- Run specific test categories instead of all tests
- Use `SKIP_SLOW_TESTS=true` for faster feedback
- Implement test parallelization for independent test suites
- Use local test databases to reduce network latency

## 📚 Best Practices

### Test Data Management
- Always use `generateTestEmail()` for unique test accounts
- Include test identifiers in all created records
- Verify test data cleanup in CI environments
- Use separate test databases for isolation

### Error Handling
- Test both success and failure scenarios
- Handle expected errors gracefully (e.g., registration disabled)
- Validate error messages don't expose sensitive information
- Test network timeout and retry scenarios

### Security Testing
- Verify authentication protections work correctly
- Test session management and expiration
- Validate OAuth security parameters (CSRF protection, HTTPS)
- Ensure rate limiting and abuse protection function

### Maintenance
- Regularly update test credentials and rotate secrets
- Monitor test execution times for performance regressions
- Keep test environment configurations in sync with production
- Review and update test data cleanup procedures