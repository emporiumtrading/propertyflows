import Stripe from 'stripe';

describe('API Integration Tests', () => {
  describe('Stripe Integration', () => {
    it('should have Stripe configured', () => {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      expect(stripeKey).toBeDefined();
      expect(stripeKey).toContain('sk_');
    });

    it('should have Stripe webhook secret configured', () => {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      expect(webhookSecret).toBeDefined();
      expect(webhookSecret).toContain('whsec_');
    });

    it('should create Stripe instance successfully', () => {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (stripeKey) {
        const stripe = new Stripe(stripeKey, {
          apiVersion: '2025-09-30.clover',
        });
        expect(stripe).toBeDefined();
      }
    });
  });

  describe('OpenAI Integration', () => {
    it('should check if OpenAI API key is configured', () => {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        console.warn('⚠️ OPENAI_API_KEY not configured - AI features will not work');
      }
      
      expect(apiKey === undefined || apiKey.startsWith('sk-')).toBe(true);
    });
  });

  describe('Twilio Integration', () => {
    it('should check if Twilio credentials are configured', () => {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      
      if (!accountSid || !authToken) {
        console.warn('⚠️ Twilio credentials not configured - SMS features will not work');
      }
      
      expect(accountSid === undefined || accountSid.startsWith('AC')).toBe(true);
    });
  });

  describe('Resend Integration', () => {
    it('should verify Resend is imported', async () => {
      const { Resend } = await import('resend');
      expect(Resend).toBeDefined();
    });
  });
});
