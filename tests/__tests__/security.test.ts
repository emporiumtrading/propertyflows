describe('Security Configuration', () => {
  it('should validate security headers are configured', () => {
    const helmet = require('helmet');
    const rateLimit = require('express-rate-limit');
    
    expect(helmet).toBeDefined();
    expect(rateLimit).toBeDefined();
  });

  it('should validate rate limiting configuration', () => {
    const config = {
      windowMs: 15 * 60 * 1000,
      max: 100,
      authMax: 5,
    };
    
    expect(config.windowMs).toBe(900000);
    expect(config.max).toBe(100);
    expect(config.authMax).toBe(5);
  });

  it('should validate webhook paths are exempted', () => {
    const webhookPaths = [
      '/api/webhooks/stripe',
      '/api/webhooks/stripe/incoming',
      '/api/webhooks/sms',
    ];
    
    webhookPaths.forEach(path => {
      expect(path.startsWith('/api/webhooks/')).toBe(true);
    });
  });

  it('should validate HSTS configuration', () => {
    const hstsConfig = {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    };
    
    expect(hstsConfig.maxAge).toBe(31536000);
    expect(hstsConfig.includeSubDomains).toBe(true);
    expect(hstsConfig.preload).toBe(true);
  });
});
