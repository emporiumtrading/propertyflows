import Stripe from 'stripe';
import { withExternalCall } from './utils/errorHandling';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

// Calculate processing fee based on payment method
export function calculateProcessingFee(amount: number, method: string): number {
  switch (method) {
    case 'ach':
      return 0.50; // Flat $0.50 for ACH
    case 'debit_card':
      return amount * 0.024 + 0.30; // 2.4% + $0.30
    case 'credit_card':
    case 'apple_pay':
    case 'google_pay':
      return amount * 0.029 + 0.30; // 2.9% + $0.30
    default:
      return 0;
  }
}

// Create payment intent for rent payment
export async function createRentPaymentIntent(
  amount: number,
  paymentMethod: string,
  customerEmail: string,
  metadata: { tenantId: string; leaseId: string; unitId: string }
): Promise<Stripe.PaymentIntent | null> {
  try {
    const processingFee = calculateProcessingFee(amount, paymentMethod);
    const totalAmount = Math.round((amount + processingFee) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      payment_method_types: ['card', 'us_bank_account'],
      receipt_email: customerEmail,
      metadata: {
        ...metadata,
        processingFee: processingFee.toString(),
      },
    });

    return paymentIntent;
  } catch (error: any) {
    console.error('[Stripe] Failed to create payment intent:', {
      error: error?.message,
      code: error?.code,
      type: error?.type,
    });
    throw error;
  }
}

// Create customer for recurring payments
export async function createStripeCustomer(
  email: string,
  name: string,
  userId: string
): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    return customer;
  } catch (error: any) {
    console.error('[Stripe] Failed to create customer:', {
      error: error?.message,
      code: error?.code,
      email,
    });
    throw error;
  }
}

// Setup autopay subscription
export async function createAutopaySubscription(
  customerId: string,
  amount: number,
  paymentMethodId: string
): Promise<Stripe.Subscription | null> {
  try {
    const price = await stripe.prices.create({
      unit_amount: Math.round(amount * 100),
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: 1,
      },
      product_data: {
        name: 'Monthly Rent Payment',
      },
    });

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  } catch (error: any) {
    console.error('[Stripe] Failed to create autopay subscription:', {
      error: error?.message,
      code: error?.code,
      customerId,
    });
    throw error;
  }
}

// Process partial payment
export async function processPartialPayment(
  amount: number,
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | null> {
  try {
    const paymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
      amount: Math.round(amount * 100),
    });

    return paymentIntent;
  } catch (error: any) {
    console.error('[Stripe] Failed to process partial payment:', {
      error: error?.message,
      code: error?.code,
      paymentIntentId,
    });
    throw error;
  }
}

// Create refund
export async function createRefund(
  paymentIntentId: string,
  amount?: number
): Promise<Stripe.Refund | null> {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    return refund;
  } catch (error: any) {
    console.error('[Stripe] Failed to create refund:', {
      error: error?.message,
      code: error?.code,
      paymentIntentId,
    });
    throw error;
  }
}
