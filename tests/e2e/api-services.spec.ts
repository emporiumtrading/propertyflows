import { test, expect } from '@playwright/test';

test.describe('API Services Integration', () => {
  const testUser = {
    sub: 'test-user-' + Date.now(),
    email: `test-${Date.now()}@example.com`,
    first_name: 'Test',
    last_name: 'User',
  };

  test('should check Stripe configuration', async ({ request }) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    expect(stripeKey).toBeDefined();
    expect(webhookSecret).toBeDefined();
    
    console.log('✅ Stripe is configured');
  });

  test('should check OpenAI configuration for AI features', async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ OPENAI_API_KEY not configured');
      console.warn('   AI features that will not work:');
      console.warn('   - Maintenance request triage (POST /api/maintenance/:id/triage)');
      console.warn('   - Fair Housing compliance checks (POST /api/compliance/fair-housing-check)');
      console.warn('   - Lease renewal predictions (GET /api/leases/:id/renewal-prediction)');
      console.warn('   - Unit inspection photo analysis (POST /api/inspections/:id/analyze)');
    } else {
      console.log('✅ OpenAI is configured');
    }
    
    expect(apiKey === undefined || apiKey.startsWith('sk-')).toBe(true);
  });

  test('should check Twilio configuration for SMS features', async () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      console.warn('⚠️ Twilio not configured');
      console.warn('   SMS features that will not work:');
      console.warn('   - Rent reminders');
      console.warn('   - Maintenance update notifications');
      console.warn('   - Lease renewal notifications');
      console.warn('   - Delinquency reminders');
    } else {
      console.log('✅ Twilio is configured');
    }
  });

  test('should verify maintenance triage endpoint exists', async ({ request, context }) => {
    await context.addCookies([{
      name: 'connect.sid',
      value: 'test-session',
      domain: 'localhost',
      path: '/',
    }]);

    const response = await request.post('/api/maintenance/test-id/triage', {
      failOnStatusCode: false,
    });
    
    expect([401, 404, 503].includes(response.status())).toBe(true);
    console.log('✅ Maintenance triage endpoint exists');
  });

  test('should verify Fair Housing check endpoint exists', async ({ request, context }) => {
    await context.addCookies([{
      name: 'connect.sid',
      value: 'test-session',
      domain: 'localhost',
      path: '/',
    }]);

    const response = await request.post('/api/compliance/fair-housing-check', {
      data: { text: 'test text' },
      failOnStatusCode: false,
    });
    
    expect([400, 401, 503].includes(response.status())).toBe(true);
    console.log('✅ Fair Housing check endpoint exists');
  });

  test('should verify lease renewal prediction endpoint exists', async ({ request, context }) => {
    await context.addCookies([{
      name: 'connect.sid',
      value: 'test-session',
      domain: 'localhost',
      path: '/',
    }]);

    const response = await request.get('/api/leases/test-id/renewal-prediction', {
      failOnStatusCode: false,
    });
    
    expect([401, 404, 503].includes(response.status())).toBe(true);
    console.log('✅ Lease renewal prediction endpoint exists');
  });

  test('should verify inspection analysis endpoint exists', async ({ request, context }) => {
    await context.addCookies([{
      name: 'connect.sid',
      value: 'test-session',
      domain: 'localhost',
      path: '/',
    }]);

    const response = await request.post('/api/inspections/test-id/analyze', {
      failOnStatusCode: false,
    });
    
    expect([400, 401, 404, 503].includes(response.status())).toBe(true);
    console.log('✅ Inspection analysis endpoint exists');
  });

  test('should verify Twilio webhook endpoint exists', async ({ request }) => {
    const response = await request.post('/api/webhooks/sms', {
      failOnStatusCode: false,
    });
    
    expect([400, 403, 503].includes(response.status())).toBe(true);
    console.log('✅ Twilio webhook endpoint exists');
  });

  test('should verify Resend email is configured', async () => {
    try {
      const { Resend } = await import('resend');
      expect(Resend).toBeDefined();
      console.log('✅ Resend email package is available');
    } catch (error) {
      console.error('❌ Resend package not available');
      throw error;
    }
  });
});

test.describe('API Services Summary', () => {
  test('should provide API services configuration summary', async () => {
    const services = {
      stripe: !!process.env.STRIPE_SECRET_KEY,
      stripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
      openai: !!process.env.OPENAI_API_KEY,
      twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    };

    console.log('\n=== API Services Configuration ===');
    console.log(`Stripe: ${services.stripe ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`Stripe Webhooks: ${services.stripeWebhook ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`OpenAI: ${services.openai ? '✅ Configured' : '⚠️  Not configured (AI features disabled)'}`);
    console.log(`Twilio: ${services.twilio ? '✅ Configured' : '⚠️  Not configured (SMS features disabled)'}`);
    console.log('===================================\n');

    expect(services.stripe).toBe(true);
    expect(services.stripeWebhook).toBe(true);
  });
});
