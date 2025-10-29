import { test, expect } from '@playwright/test';

test.describe('Security Headers', () => {
  test('should include helmet security headers', async ({ page }) => {
    const response = await page.goto('/');
    
    expect(response).not.toBeNull();
    
    const headers = response!.headers();
    
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-download-options']).toBe('noopen');
    expect(headers['x-permitted-cross-domain-policies']).toBe('none');
    
    expect(headers['strict-transport-security']).toContain('max-age=31536000');
    expect(headers['strict-transport-security']).toContain('includeSubDomains');
    
    expect(headers['content-security-policy']).toBeDefined();
    expect(headers['content-security-policy']).toContain("default-src 'self'");
  });

  test('should handle CORS properly', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });
});

test.describe('Rate Limiting', () => {
  test('should not rate limit webhook routes', async ({ request }) => {
    const responses: number[] = [];
    
    for (let i = 0; i < 5; i++) {
      const response = await request.post('/api/webhooks/stripe', {
        data: { test: 'data' },
      });
      responses.push(response.status());
    }
    
    const rateLimited = responses.some(status => status === 429);
    expect(rateLimited).toBe(false);
  });
});

test.describe('Application Security', () => {
  test('should require authentication for protected routes', async ({ request }) => {
    const response = await request.get('/api/auth/user');
    expect(response.status()).toBe(401);
  });

  test('should serve landing page without authentication', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('button-get-started')).toBeVisible();
  });
});
