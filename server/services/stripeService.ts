import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

export async function createPaymentIntent(amount: number, currency: string = 'usd') {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent;
}

export async function createCustomer(email: string, name?: string) {
  const customer = await stripe.customers.create({
    email,
    name,
  });

  return customer;
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

export async function calculateProcessingFee(amount: number, paymentMethod: string): Promise<number> {
  // ACH: $0.50 flat
  if (paymentMethod === 'ach') {
    return 0.50;
  }
  
  // Card: 2.9% + $0.30
  if (paymentMethod === 'card') {
    return (amount * 0.029) + 0.30;
  }

  return 0;
}

export { stripe };

export const SUBSCRIPTION_PLANS = {
  STARTER: {
    name: 'Starter',
    priceMonthly: 4900,
    trialDays: 14,
  },
  PROFESSIONAL: {
    name: 'Professional',
    priceMonthly: 14900,
    trialDays: 14,
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceMonthly: 49900,
    trialDays: 30,
  },
};

export interface StripePlanCache {
  starter: { productId: string; priceId: string };
  professional: { productId: string; priceId: string };
  enterprise: { productId: string; priceId: string };
}

export async function getOrCreateStripePlans(): Promise<StripePlanCache> {
  const cache: StripePlanCache = {
    starter: { productId: '', priceId: '' },
    professional: { productId: '', priceId: '' },
    enterprise: { productId: '', priceId: '' },
  };

  for (const [key, config] of Object.entries(SUBSCRIPTION_PLANS)) {
    const cacheKey = key.toLowerCase() as keyof StripePlanCache;
    
    const products = await stripe.products.list({ limit: 100 });
    let product = products.data.find((p) => p.name === config.name);
    
    if (!product) {
      product = await stripe.products.create({
        name: config.name,
        metadata: { plan: key },
      });
    }
    
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
    });
    
    let price = prices.data.find(
      (p) => p.unit_amount === config.priceMonthly && p.recurring?.interval === 'month'
    );
    
    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: config.priceMonthly,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
      });
    }
    
    cache[cacheKey] = {
      productId: product.id,
      priceId: price.id,
    };
  }
  
  return cache;
}

export async function createTrialSubscription(
  customerId: string,
  priceId: string,
  trialDays: number
) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: trialDays,
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
  });
  
  return subscription;
}

export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId);
}

export async function updateSubscription(subscriptionId: string, priceId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: priceId,
      },
    ],
    proration_behavior: 'create_prorations',
  });
}

export async function retryInvoicePayment(invoiceId: string) {
  return await stripe.invoices.pay(invoiceId);
}

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

export async function getCustomer(customerId: string) {
  return await stripe.customers.retrieve(customerId);
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session;
}

export async function listInvoices(customerId: string, limit: number = 10) {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });
  return invoices.data;
}

export async function getInvoice(invoiceId: string) {
  return await stripe.invoices.retrieve(invoiceId);
}
