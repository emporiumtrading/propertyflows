# Testing Guide

## Overview
PropertyFlows includes a comprehensive testing infrastructure for unit tests, E2E tests, and performance profiling.

## Test Infrastructure

### Unit Testing (Jest)
**Configuration:** `jest.config.js`
**Test Location:** `tests/__tests__/**/*.test.ts`

**Running Tests:**
```bash
# Run all unit tests
npx jest

# Watch mode for development
npx jest --watch

# Generate coverage report
npx jest --coverage
```

**Example Test:**
```typescript
import request from 'supertest';

describe('API Tests', () => {
  it('should return 401 for unauthorized requests', async () => {
    const response = await request(app)
      .get('/api/auth/user');
    expect(response.status).toBe(401);
  });
});
```

### End-to-End Testing (Playwright)
**Configuration:** `playwright.config.ts`
**Test Location:** `tests/e2e/**/*.spec.ts`

**Running E2E Tests:**
```bash
# Run all E2E tests
npx playwright test

# Run with UI mode for debugging
npx playwright test --ui

# Run specific test file
npx playwright test tests/e2e/landing.spec.ts

# Generate HTML report
npx playwright show-report
```

**Example E2E Test:**
```typescript
import { test, expect } from '@playwright/test';

test('landing page loads correctly', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('button-get-started')).toBeVisible();
});
```

### Performance Testing
**Tool:** Custom load testing utility
**Location:** `tests/performance/load-test.ts`

**Running Load Tests:**
```bash
# Basic load test
npx tsx tests/performance/load-test.ts

# Custom configuration (edit the file)
# - url: Target endpoint
# - duration: Test duration in ms
# - concurrency: Concurrent requests
```

**Load Test Output:**
```
=== Load Test Results ===
Total Requests: 1000
Successful: 998
Failed: 2
Avg Response Time: 45.23ms
Min Response Time: 12.50ms
Max Response Time: 234.12ms
Requests/sec: 100.45
Error Rate: 0.20%
========================
```

## Performance Monitoring

### Built-in Performance Monitor
**Location:** `server/performance.ts`

**Usage in Code:**
```typescript
import { perfMonitor, measurePerformance } from './performance';

// Decorator for automatic measurement
class MyService {
  @measurePerformance
  async myMethod() {
    // Method implementation
  }
}

// Manual measurement
perfMonitor.startMeasure('operation-name');
// ... do work
perfMonitor.endMeasure('operation-name');

// Async measurement
const result = await perfMonitor.measureAsync('async-operation', async () => {
  return await someAsyncWork();
});

// Get metrics
const metrics = perfMonitor.getMetrics();
const avgDuration = perfMonitor.getAverageByName('operation-name');

// Log summary
perfMonitor.logSummary();
```

**Performance Alerts:**
Operations taking >1000ms automatically log a warning.

## Test Coverage

### Security Testing
- Rate limiting validation
- Security header verification
- Authentication flow testing
- Input validation

### Integration Testing
- Database operations
- API endpoint responses
- Error handling
- Webhook processing

### E2E Testing
- User workflows
- Navigation flows
- Form submissions
- UI interactions

## Continuous Integration

### Pre-commit Checks
```bash
# Type checking
npm run check

# Unit tests
npx jest

# E2E tests
npx playwright test
```

### CI/CD Pipeline (Recommended)
```yaml
steps:
  - Install dependencies
  - Run type checks (npm run check)
  - Run unit tests (npx jest)
  - Run E2E tests (npx playwright test --project=chromium)
  - Generate coverage report
  - Deploy if all tests pass
```

## Best Practices

### Writing Unit Tests
1. Test one thing per test
2. Use descriptive test names
3. Mock external dependencies
4. Test edge cases and error conditions
5. Aim for >80% code coverage

### Writing E2E Tests
1. Use data-testid attributes for selectors
2. Test complete user workflows
3. Handle async operations properly
4. Clean up test data
5. Keep tests independent

### Performance Testing
1. Test under realistic load
2. Monitor response times
3. Track resource usage
4. Test edge cases (high load, slow network)
5. Profile slow operations

## Debugging

### Debug Unit Tests
```bash
# Run specific test
npx jest -t "test name"

# Run in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Debug E2E Tests
```bash
# Run with headed browser
npx playwright test --headed

# Debug mode with step-through
npx playwright test --debug

# Generate trace
npx playwright test --trace on
```

### Debug Performance Issues
```typescript
// Enable detailed logging
perfMonitor.logSummary();

// Get slow operations
const metrics = perfMonitor.getMetrics()
  .filter(m => m.duration > 1000)
  .sort((a, b) => b.duration - a.duration);
```

## Troubleshooting

### Common Issues

**Jest fails to run:**
- Check NODE_ENV is set to 'test'
- Verify test database is accessible
- Clear Jest cache: `npx jest --clearCache`

**Playwright tests timeout:**
- Increase timeout in playwright.config.ts
- Ensure dev server is running
- Check network connectivity

**Load tests show errors:**
- Verify target URL is correct
- Check rate limiting isn't blocking requests
- Ensure server has sufficient resources

## Test Data

### Setup Test Database
```bash
# Create test database
createdb propertyflows_test

# Set test environment
export DATABASE_URL="postgresql://user:pass@localhost:5432/propertyflows_test"

# Run migrations
npm run db:push
```

### Seed Test Data
Create seed scripts in `tests/fixtures/` for consistent test data.

## Reporting

### Coverage Reports
```bash
# Generate HTML coverage report
npx jest --coverage --coverageReporters=html

# View report
open coverage/index.html
```

### E2E Test Reports
```bash
# Generate Playwright HTML report
npx playwright test --reporter=html

# View report
npx playwright show-report
```

## Maintenance

### Update Dependencies
```bash
# Update testing packages
npm update @playwright/test jest ts-jest

# Check for security vulnerabilities
npm audit
```

### Clean Up
```bash
# Remove old test artifacts
rm -rf coverage/
rm -rf playwright-report/
rm -rf test-results/

# Clear Jest cache
npx jest --clearCache
```
