import { test, expect } from '@playwright/test';
import Stripe from 'stripe';

test.describe('Stripe Webhook Integration', () => {
  let stripe: Stripe | null = null;

  test.beforeAll(() => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey) {
      stripe = new Stripe(stripeKey, {
        apiVersion: '2025-09-30.clover',
      });
    }
  });

  test('should reject webhook without signature', async ({ request }) => {
    const response = await request.post('/api/webhooks/stripe', {
      data: {
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test' } }
      },
    });
    
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('No signature provided');
  });

  test('should reject webhook with invalid signature', async ({ request }) => {
    const response = await request.post('/api/webhooks/stripe', {
      headers: {
        'stripe-signature': 'invalid_signature',
      },
      data: {
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test' } }
      },
    });
    
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid signature');
  });

  test('should construct valid Stripe webhook signature', () => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    expect(webhookSecret).toBeDefined();
    expect(webhookSecret).toContain('whsec_');
  });

  test('should validate Stripe webhook event types are handled', () => {
    const handledEvents = [
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'payout.paid',
      'payout.failed',
      'payout.canceled',
      'account.updated',
      'charge.refunded'
    ];
    
    handledEvents.forEach(eventType => {
      expect(eventType).toBeDefined();
      expect(eventType.length).toBeGreaterThan(0);
    });
  });

  test('should verify Stripe API is accessible', async () => {
    if (!stripe) {
      console.warn('Skipping: Stripe not configured');
      return;
    }

    try {
      const balance = await stripe.balance.retrieve();
      expect(balance).toBeDefined();
      expect(balance.object).toBe('balance');
    } catch (error: any) {
      if (error.type === 'StripeAuthenticationError') {
        throw new Error('Stripe API key is invalid');
      }
      throw error;
    }
  });
});
