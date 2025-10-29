import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService } from "./services/aiService";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { sendOwnerInvitation } from "./email";
import Stripe from "stripe";
import multer from "multer";
import { z } from "zod";
import crypto from "crypto";
import logger from "./logger";
import { performFraudChecks } from "./services/fraudPreventionService";
import { calculateRiskScore } from "./services/businessVerificationService";
import { 
  createCustomer, 
  createTrialSubscription, 
  getOrCreateStripePlans,
  getSubscription,
  createBillingPortalSession,
  listInvoices,
  updateSubscription,
  retryInvoicePayment
} from "./services/stripeService";
import { 
  sendBusinessApprovedEmail, 
  sendBusinessRejectedEmail, 
  sendTrialEndingReminderEmail,
  sendPaymentFailedEmail,
  sendAccountSuspendedEmail,
  sendPaymentSuccessEmail
} from "./services/resendService";
import {
  insertPropertySchema,
  insertUnitSchema,
  insertLeaseSchema,
  insertMaintenanceRequestSchema,
  insertPaymentSchema,
  insertPaymentPlanSchema,
  insertPaymentInstallmentSchema,
  insertScreeningSchema,
  insertTransactionSchema,
  insertInvitationSchema,
  insertTurnTaskSchema,
  insertSmsPreferencesSchema,
  insertAuditLogSchema,
  insertESignatureLogSchema,
  insertUnitInspectionSchema,
  insertDelinquencyPlaybookSchema,
  insertDelinquencyActionSchema,
  insertVendorBidSchema,
  insertWorkCompletionDocSchema,
  insertVendorPaymentRequestSchema,
  insertVendorPaymentSchema,
  insertVendorTransactionSchema,
  insertChartOfAccountsSchema,
  insertJournalEntrySchema,
  insertBankAccountSchema,
  insertPropertyVendorAssignmentSchema,
  type InsertOrganization,
  type Unit,
} from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: STRIPE_SECRET_KEY not set. Payment features will not work.');
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
}) : null;

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

async function parseFileToJson(file: Express.Multer.File): Promise<any[]> {
  const filename = file.originalname.toLowerCase();
  
  if (filename.endsWith('.csv')) {
    const Papa = (await import('papaparse')).default;
    const fileContent = file.buffer.toString('utf-8');
    const result = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });
    return result.data;
  } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
    const XLSX = (await import('xlsx')).default;
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet);
  } else {
    throw new Error('Unsupported file format. Please upload CSV or Excel files.');
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        logger.warn(`User not found after authentication: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      logger.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Development-only role switching for testing
  if (process.env.NODE_ENV === 'development') {
    app.post('/api/dev/switch-role', isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { role } = req.body;

        const validRoles = ['admin', 'property_manager', 'landlord', 'tenant', 'vendor'];
        if (!validRoles.includes(role)) {
          return res.status(400).json({ message: "Invalid role" });
        }

        const updatedUser = await storage.updateUser(userId, { role });
        res.json(updatedUser);
      } catch (error) {
        console.error("Error switching role:", error);
        res.status(500).json({ message: "Failed to switch role" });
      }
    });

    app.post('/api/dev/test-login', async (req: any, res) => {
      try {
        const { userId } = req.body;
        
        if (!userId) {
          return res.status(400).json({ message: "userId required" });
        }

        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const testUser = {
          id: user.id,
          claims: {
            sub: user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            aud: "test-client",
            iss: "test-issuer",
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000),
          },
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          access_token: "test-token",
          refresh_token: "test-refresh-token",
        };

        req.logIn(testUser, (err: any) => {
          if (err) {
            return res.status(500).json({ message: "Login failed" });
          }
          res.json({ message: "Test login successful", user });
        });
      } catch (error) {
        console.error("Error in test login:", error);
        res.status(500).json({ message: "Test login failed" });
      }
    });
  }

  // Stripe Webhook Handler (Public Route - No Auth Required)
  app.post('/api/webhooks/stripe', async (req: any, res) => {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return res.status(400).json({ error: 'Missing signature or webhook secret' });
    }

    let event: Stripe.Event;

    try {
      const { constructWebhookEvent } = await import('./services/stripeService');
      event = constructWebhookEvent(req.rawBody as Buffer, sig as string, webhookSecret);
    } catch (err: any) {
      logger.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    logger.info(`Received webhook event: ${event.type}`, { eventId: event.id });

    try {
      switch (event.type) {
        case 'customer.subscription.trial_will_end': {
          const subscription = event.data.object as Stripe.Subscription;
          const org = await storage.getOrganizationByStripeCustomerId(subscription.customer as string);
          
          if (org && subscription.trial_end) {
            const trialEndDate = new Date(subscription.trial_end * 1000);
            const now = new Date();
            const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            try {
              await sendTrialEndingReminderEmail(
                org.contactEmail!,
                org.name!,
                daysRemaining,
                trialEndDate.toLocaleDateString()
              );
              logger.info(`Trial ending reminder email sent to ${org.contactEmail}`);
            } catch (emailError) {
              logger.error('Failed to send trial ending reminder:', emailError);
            }
            
            logger.info(`Trial ending soon for organization: ${org.name}`, {
              orgId: org.id,
              trialEnd: subscription.trial_end,
              daysRemaining,
            });
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const org = await storage.getOrganizationByStripeCustomerId(subscription.customer as string);
          
          if (org) {
            const statusMap: Record<string, string> = {
              'active': 'active',
              'trialing': 'trialing',
              'past_due': 'past_due',
              'canceled': 'canceled',
              'unpaid': 'suspended',
            };

            const newStatus = statusMap[subscription.status] || org.status;
            
            await storage.updateOrganization(org.id, {
              status: newStatus as any,
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0]?.price.id,
            });

            logger.info(`Updated organization subscription status`, {
              orgId: org.id,
              oldStatus: org.status,
              newStatus,
              stripeStatus: subscription.status,
            });
          }
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          const org = await storage.getOrganizationByStripeCustomerId(invoice.customer as string);
          
          if (org) {
            const updateData: Partial<InsertOrganization> = {
              status: 'active',
              paymentFailedAt: null as any,
              paymentRetryCount: 0,
            };
            
            await storage.updateOrganization(org.id, updateData);

            try {
              await sendPaymentSuccessEmail(
                org.contactEmail!,
                org.name!,
                invoice.amount_paid || 0,
                invoice.hosted_invoice_url || ''
              );
              logger.info(`Payment success email sent to ${org.contactEmail}`);
            } catch (emailError) {
              logger.error('Failed to send payment success email:', emailError);
            }

            logger.info(`Payment succeeded for organization: ${org.name}`, {
              orgId: org.id,
              invoiceId: invoice.id,
              amount: invoice.amount_paid,
              resetFailureTracking: true,
            });
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const org = await storage.getOrganizationByStripeCustomerId(invoice.customer as string);
          
          if (org) {
            const now = new Date();
            const firstFailureTimestamp = org.paymentFailedAt || now;
            const newRetryCount = (org.paymentRetryCount || 0) + 1;
            
            const gracePeriodDays = org.gracePeriodDays || 14;
            const gracePeriodEnd = new Date(firstFailureTimestamp);
            gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);
            
            const isGracePeriodExpired = now > gracePeriodEnd;
            const newStatus = isGracePeriodExpired ? 'suspended' : 'past_due';
            
            const updateData: Partial<InsertOrganization> = {
              status: newStatus,
              paymentFailedAt: firstFailureTimestamp as any,
              paymentRetryCount: newRetryCount,
            };
            
            await storage.updateOrganization(org.id, updateData);

            try {
              if (isGracePeriodExpired) {
                await sendAccountSuspendedEmail(
                  org.contactEmail!,
                  org.name!,
                  invoice.amount_due || 0
                );
                logger.info(`Account suspended email sent to ${org.contactEmail}`);
              } else {
                const nextRetryDate = invoice.next_payment_attempt 
                  ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString()
                  : 'Soon';
                await sendPaymentFailedEmail(
                  org.contactEmail!,
                  org.name!,
                  invoice.amount_due || 0,
                  nextRetryDate,
                  gracePeriodEnd.toLocaleDateString()
                );
                logger.info(`Payment failed email sent to ${org.contactEmail}`);
              }
            } catch (emailError) {
              logger.error('Failed to send payment failure email:', emailError);
            }

            logger.error(`Payment failed for organization: ${org.name}`, {
              orgId: org.id,
              invoiceId: invoice.id,
              stripeAttemptCount: invoice.attempt_count,
              paymentRetryCount: newRetryCount,
              gracePeriodExpired: isGracePeriodExpired,
              newStatus,
              paymentFailedAt: firstFailureTimestamp.toISOString(),
              gracePeriodEnd: gracePeriodEnd.toISOString(),
            });
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const org = await storage.getOrganizationByStripeCustomerId(subscription.customer as string);
          
          if (org) {
            await storage.updateOrganization(org.id, {
              status: 'canceled',
            });

            logger.info(`Subscription canceled for organization: ${org.name}`, {
              orgId: org.id,
              subscriptionId: subscription.id,
            });
          }
          break;
        }

        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      logger.error(`Error processing webhook: ${error.message}`, { eventType: event.type });
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Business Registration (Public Route)
  app.post('/api/organizations/register', async (req: any, res) => {
    try {
      const {
        businessName,
        businessEmail,
        businessPhone,
        businessAddress,
        businessLicense,
        taxId,
        contactName,
        website,
      } = req.body;

      if (!businessName || !businessEmail || !businessPhone || !businessAddress || !businessLicense || !taxId) {
        return res.status(400).json({ message: "All required fields must be provided" });
      }

      const fraudCheck = await performFraudChecks({
        businessEmail,
        businessPhone,
      });

      if (!fraudCheck.passed) {
        const organization = await storage.createOrganization({
          name: businessName,
          contactEmail: businessEmail,
          contactPhone: businessPhone,
          businessAddress,
          businessLicense,
          taxId,
          verificationStatus: 'rejected',
          rejectionReason: `Fraud check failed: ${fraudCheck.flags.join(', ')}`,
        });

        await storage.createBusinessVerificationLog({
          organizationId: organization.id!,
          verificationType: 'fraud_check',
          status: 'rejected',
          provider: 'internal',
          metadata: {
            fraudScore: fraudCheck.score,
            flags: fraudCheck.flags,
            details: fraudCheck.details,
          },
          verifiedBy: null,
          notes: `Fraud check failed: ${fraudCheck.flags.join('. ')}`,
        });

        return res.status(400).json({
          message: "Registration rejected due to security concerns",
          details: fraudCheck.flags,
        });
      }

      const verificationResult = await calculateRiskScore({
        businessName,
        businessLicense,
        taxId,
        businessAddress,
        businessEmail,
        businessPhone,
      });

      const organization = await storage.createOrganization({
        name: businessName,
        contactEmail: businessEmail,
        contactPhone: businessPhone,
        businessAddress,
        businessLicense,
        taxId,
        website: website || null,
        verificationStatus: verificationResult.status,
        verifiedAt: verificationResult.status === 'approved' ? new Date() : null,
      });

      await storage.createBusinessVerificationLog({
        organizationId: organization.id!,
        verificationType: 'automated',
        status: verificationResult.status,
        provider: 'internal',
        metadata: {
          riskScore: verificationResult.riskScore,
          reasons: verificationResult.reasons,
          fraudCheck,
          ...verificationResult.metadata,
        },
        verifiedBy: null,
        notes: verificationResult.reasons.join('. '),
      });

      res.status(201).json({
        success: true,
        organization: {
          id: organization.id,
          name: organization.name,
          verificationStatus: organization.verificationStatus,
        },
        verificationStatus: verificationResult.status,
        message: verificationResult.status === 'approved'
          ? 'Business verified successfully!'
          : verificationResult.status === 'manual_review'
          ? 'Your application requires manual review'
          : 'Registration submitted for review',
      });
    } catch (error: any) {
      logger.error('Error registering business:', error);
      res.status(500).json({ message: "Failed to register business. Please try again." });
    }
  });

  // Admin approval queue endpoints
  app.get('/api/admin/organizations/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const organizations = await storage.getOrganizationsForApproval();
      
      res.json(organizations);
    } catch (error: any) {
      logger.error('Error fetching pending organizations:', error);
      res.status(500).json({ message: "Failed to fetch pending organizations" });
    }
  });

  app.post('/api/admin/organizations/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      logger.info(`Approval attempt by user ${userId}`, {
        userExists: !!user,
        userRole: user?.role,
        userEmail: user?.email,
      });
      
      if (!user || user.role !== 'admin') {
        logger.warn(`Admin access denied for user ${userId}`, {
          userExists: !!user,
          userRole: user?.role,
        });
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const organization = await storage.approveOrganization(id, userId);
      
      const planName = (organization.subscriptionPlan || 'starter').toLowerCase() as 'starter' | 'professional' | 'enterprise';
      
      try {
        const customer = await createCustomer(organization.contactEmail!, organization.name!);
        logger.info(`Stripe customer created: ${customer.id}`);
        
        const plans = await getOrCreateStripePlans();
        const planInfo = plans[planName];
        
        if (!planInfo || !planInfo.priceId) {
          throw new Error(`Invalid plan: ${planName}`);
        }
        
        const PLAN_TRIAL_DAYS = {
          starter: 14,
          professional: 14,
          enterprise: 30,
        };
        const trialDays = PLAN_TRIAL_DAYS[planName];
        
        const subscription = await createTrialSubscription(
          customer.id,
          planInfo.priceId,
          trialDays
        );
        
        const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
        
        await storage.updateOrganization(id, {
          stripeCustomerId: customer.id,
          stripeSubscriptionId: subscription.id,
          stripePriceId: planInfo.priceId,
          status: 'trialing',
          trialEndsAt: trialEnd,
        });
        
        logger.info(`Stripe subscription created for organization ${id}`, {
          customerId: customer.id,
          subscriptionId: subscription.id,
          priceId: planInfo.priceId,
        });
      } catch (stripeError) {
        logger.error('Failed to create Stripe subscription:', stripeError);
        return res.status(500).json({ 
          message: "Organization approved but Stripe subscription creation failed",
          error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
        });
      }
      
      try {
        await sendBusinessApprovedEmail(
          organization.contactEmail!,
          organization.name!,
          organization.subscriptionPlan || 'Starter'
        );
        logger.info(`Approval email sent to ${organization.contactEmail}`);
      } catch (emailError) {
        logger.error('Failed to send approval email:', emailError);
      }
      
      const updatedOrg = await storage.getOrganization(id);
      
      res.json({
        success: true,
        organization: updatedOrg,
        message: 'Organization approved and trial subscription activated',
      });
    } catch (error: any) {
      logger.error('Error approving organization:', error);
      res.status(500).json({ message: "Failed to approve organization" });
    }
  });

  app.post('/api/admin/organizations/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const organization = await storage.rejectOrganization(id, reason, userId);
      
      try {
        await sendBusinessRejectedEmail(
          organization.contactEmail!,
          organization.name!,
          reason
        );
        logger.info(`Rejection email sent to ${organization.contactEmail}`);
      } catch (emailError) {
        logger.error('Failed to send rejection email:', emailError);
      }
      
      res.json({
        success: true,
        organization,
        message: 'Organization rejected successfully',
      });
    } catch (error: any) {
      logger.error('Error rejecting organization:', error);
      res.status(500).json({ message: "Failed to reject organization" });
    }
  });

  // Admin endpoint to update grace period for specific organization
  app.patch('/api/admin/organizations/:id/grace-period', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { gracePeriodDays } = req.body;
      
      if (typeof gracePeriodDays !== 'number' || gracePeriodDays < 0 || gracePeriodDays > 90) {
        return res.status(400).json({ 
          message: "Grace period must be a number between 0 and 90 days" 
        });
      }

      const organization = await storage.updateOrganization(id, {
        gracePeriodDays,
      });
      
      logger.info(`Grace period updated for organization ${organization.name}`, {
        orgId: id,
        newGracePeriod: gracePeriodDays,
        updatedBy: userId,
      });

      res.json({
        success: true,
        organization,
        message: `Grace period set to ${gracePeriodDays} days`,
      });
    } catch (error: any) {
      logger.error('Error updating grace period:', error);
      res.status(500).json({ message: "Failed to update grace period" });
    }
  });

  // Admin endpoint to manually retry payment for an organization
  app.post('/api/admin/organizations/:id/retry-payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const organization = await storage.getOrganization(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      if (!organization.stripeSubscriptionId) {
        return res.status(400).json({ 
          message: "No active subscription found for this organization" 
        });
      }

      const subscription = await getSubscription(organization.stripeSubscriptionId);
      const latestInvoice = subscription.latest_invoice;
      
      if (!latestInvoice || typeof latestInvoice === 'string') {
        return res.status(400).json({ 
          message: "No invoice found to retry" 
        });
      }

      if (latestInvoice.status === 'paid') {
        return res.status(400).json({ 
          message: "Latest invoice is already paid" 
        });
      }

      await retryInvoicePayment(latestInvoice.id);
      
      logger.info(`Manual payment retry initiated for organization ${organization.name}`, {
        orgId: id,
        invoiceId: latestInvoice.id,
        initiatedBy: userId,
      });

      res.json({
        success: true,
        message: 'Payment retry initiated successfully',
        invoiceId: latestInvoice.id,
      });
    } catch (error: any) {
      logger.error('Error retrying payment:', error);
      res.status(500).json({ 
        message: error.message || "Failed to retry payment" 
      });
    }
  });

  // Admin endpoint to override suspension (reactivate suspended account)
  app.post('/api/admin/organizations/:id/override-suspension', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { newStatus } = req.body;
      
      if (!['active', 'past_due', 'trialing'].includes(newStatus)) {
        return res.status(400).json({ 
          message: "New status must be 'active', 'past_due', or 'trialing'" 
        });
      }

      const organization = await storage.getOrganization(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      if (organization.status !== 'suspended') {
        return res.status(400).json({ 
          message: `Organization status is ${organization.status}, not suspended` 
        });
      }

      const updatedOrg = await storage.updateOrganization(id, {
        status: newStatus as 'active' | 'past_due' | 'trialing',
        paymentFailedAt: newStatus === 'active' ? null : organization.paymentFailedAt,
      });
      
      logger.info(`Suspension override for organization ${organization.name}`, {
        orgId: id,
        oldStatus: 'suspended',
        newStatus,
        overriddenBy: userId,
      });

      res.json({
        success: true,
        organization: updatedOrg,
        message: `Organization reactivated with status: ${newStatus}`,
      });
    } catch (error: any) {
      logger.error('Error overriding suspension:', error);
      res.status(500).json({ message: "Failed to override suspension" });
    }
  });

  // Admin endpoint to check and suspend organizations with expired grace periods
  app.post('/api/admin/organizations/check-grace-periods', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const allOrganizations = await storage.getOrganizations();
      const pastDueOrgs = allOrganizations.filter(org => org.status === 'past_due' && org.paymentFailedAt);
      
      const now = new Date();
      const suspended: string[] = [];
      const stillInGracePeriod: string[] = [];
      
      for (const org of pastDueOrgs) {
        if (!org.paymentFailedAt) continue;
        
        const gracePeriodDays = org.gracePeriodDays || 14;
        const gracePeriodEnd = new Date(org.paymentFailedAt);
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);
        
        if (now > gracePeriodEnd) {
          await storage.updateOrganization(org.id, {
            status: 'suspended',
          });
          suspended.push(org.name);
          
          logger.info(`Organization suspended due to expired grace period`, {
            orgId: org.id,
            orgName: org.name,
            paymentFailedAt: org.paymentFailedAt,
            gracePeriodEnd: gracePeriodEnd.toISOString(),
          });
        } else {
          stillInGracePeriod.push(org.name);
        }
      }
      
      res.json({
        success: true,
        summary: {
          totalPastDue: pastDueOrgs.length,
          suspended: suspended.length,
          stillInGracePeriod: stillInGracePeriod.length,
        },
        suspended,
        stillInGracePeriod,
        message: `Checked ${pastDueOrgs.length} organizations. Suspended ${suspended.length}.`,
      });
    } catch (error: any) {
      logger.error('Error checking grace periods:', error);
      res.status(500).json({ message: "Failed to check grace periods" });
    }
  });

  // Trial activation endpoint (public - no auth required yet, organization not linked to user)
  app.post('/api/organizations/:id/activate-trial', async (req: any, res) => {
    try {
      const { id } = req.params;
      const { planType = 'starter' } = req.body;

      const organization = await storage.getOrganization(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      if (organization.verificationStatus !== 'approved') {
        return res.status(400).json({ 
          message: "Organization must be approved before activating trial" 
        });
      }

      if (organization.stripeCustomerId) {
        return res.status(400).json({ 
          message: "Trial already activated for this organization" 
        });
      }

      const stripeCustomer = await createCustomer(
        organization.contactEmail!,
        organization.name!
      );

      const stripePlans = await getOrCreateStripePlans();
      const selectedPlan = stripePlans[planType.toLowerCase() as keyof typeof stripePlans];
      
      if (!selectedPlan) {
        return res.status(400).json({ message: "Invalid plan type" });
      }

      const trialDays = planType === 'enterprise' ? 30 : 14;
      
      const subscription = await createTrialSubscription(
        stripeCustomer.id,
        selectedPlan.priceId,
        trialDays
      );

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + trialDays);

      await storage.updateOrganization(id, {
        stripeCustomerId: stripeCustomer.id,
        stripeSubscriptionId: subscription.id,
        stripePriceId: selectedPlan.priceId,
        trialEndsAt: trialEndDate,
        status: 'trialing',
      });

      res.json({
        success: true,
        message: 'Trial activated successfully',
        subscription: {
          id: subscription.id,
          trialEnd: trialEndDate,
          planType,
        },
      });
    } catch (error: any) {
      logger.error('Error activating trial:', error);
      res.status(500).json({ message: "Failed to activate trial" });
    }
  });

  // Subscription Portal routes (authenticated property managers)
  app.get('/api/subscription/current', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.organizationId) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const organization = await storage.getOrganization(user.organizationId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      let subscriptionDetails = null;
      if (organization.stripeSubscriptionId) {
        try {
          const subscription = await getSubscription(organization.stripeSubscriptionId);
          subscriptionDetails = {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: subscription.current_period_end,
            currentPeriodStart: subscription.current_period_start,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            trialEnd: subscription.trial_end,
          };
        } catch (error) {
          logger.error('Error fetching Stripe subscription:', error);
        }
      }

      res.json({
        organization: {
          id: organization.id,
          name: organization.name,
          status: organization.status,
          subscriptionPlan: organization.subscriptionPlan,
          trialEndsAt: organization.trialEndsAt,
          gracePeriodDays: organization.gracePeriodDays,
          paymentFailedAt: organization.paymentFailedAt,
        },
        subscription: subscriptionDetails,
      });
    } catch (error: any) {
      logger.error('Error fetching subscription:', error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post('/api/subscription/billing-portal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.organizationId) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const organization = await storage.getOrganization(user.organizationId);
      
      if (!organization || !organization.stripeCustomerId) {
        return res.status(400).json({ 
          message: "No Stripe customer found. Please activate your trial first." 
        });
      }

      const returnUrl = `${req.headers.origin || 'http://localhost:5000'}/settings/subscription`;
      const session = await createBillingPortalSession(
        organization.stripeCustomerId,
        returnUrl
      );

      res.json({ url: session.url });
    } catch (error: any) {
      logger.error('Error creating billing portal session:', error);
      res.status(500).json({ message: "Failed to create billing portal session" });
    }
  });

  app.get('/api/subscription/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.organizationId) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const organization = await storage.getOrganization(user.organizationId);
      
      if (!organization || !organization.stripeCustomerId) {
        return res.json({ invoices: [] });
      }

      const invoices = await listInvoices(organization.stripeCustomerId);
      
      const formattedInvoices = invoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        amount: inv.amount_paid,
        amountDue: inv.amount_due,
        status: inv.status,
        created: inv.created,
        dueDate: inv.due_date,
        paidAt: inv.status_transitions?.paid_at,
        invoicePdf: inv.invoice_pdf,
        hostedInvoiceUrl: inv.hosted_invoice_url,
      }));

      res.json({ invoices: formattedInvoices });
    } catch (error: any) {
      logger.error('Error fetching invoices:', error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post('/api/subscription/change-plan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.organizationId) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const { newPlan } = req.body;
      
      if (!['starter', 'professional', 'enterprise'].includes(newPlan)) {
        return res.status(400).json({ message: "Invalid plan type" });
      }

      const organization = await storage.getOrganization(user.organizationId);
      
      if (!organization || !organization.stripeSubscriptionId) {
        return res.status(400).json({ 
          message: "No active subscription found" 
        });
      }

      const stripePlans = await getOrCreateStripePlans();
      const selectedPlan = stripePlans[newPlan as keyof typeof stripePlans];
      
      if (!selectedPlan) {
        return res.status(400).json({ message: "Invalid plan configuration" });
      }

      await updateSubscription(
        organization.stripeSubscriptionId,
        selectedPlan.priceId
      );

      await storage.updateOrganization(organization.id, {
        stripePriceId: selectedPlan.priceId,
        subscriptionPlan: newPlan,
      });

      res.json({
        success: true,
        message: `Successfully changed to ${newPlan} plan`,
      });
    } catch (error: any) {
      logger.error('Error changing plan:', error);
      res.status(500).json({ message: "Failed to change plan" });
    }
  });

  // AI Chatbot routes
  app.post('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { title } = req.body;
      const conversation = await storage.createConversation({
        title: title || `Chat - ${new Date().toLocaleDateString()}`,
        createdById: userId,
        lastMessageAt: new Date(),
      });

      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversationsByUser(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/conversations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      if (conversation.createdById !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getConversationMessages(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { content } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      if (conversation.createdById !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const previousMessages = await storage.getConversationMessages(id);
      
      const userMessage = await storage.createConversationMessage({
        conversationId: id,
        role: 'user',
        content,
      });

      const aiResponse = await aiService.chatWithAssistant(user, content, previousMessages);

      const assistantMessage = await storage.createConversationMessage({
        conversationId: id,
        role: 'assistant',
        content: aiResponse.message,
      });

      res.json({
        userMessage,
        assistantMessage,
        metadata: aiResponse.metadata,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post('/api/chat/smart-reply', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { context, recipientRole } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const reply = await aiService.generateSmartReply(user, context, recipientRole);
      res.json(reply);
    } catch (error) {
      console.error("Error generating smart reply:", error);
      res.status(500).json({ message: "Failed to generate smart reply" });
    }
  });

  app.post('/api/chat/summarize', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { conversationId } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const conversation = await storage.getConversation(conversationId);
      if (!conversation || conversation.createdById !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getConversationMessages(conversationId);
      const summary = await aiService.summarizeConversation(messages);

      await storage.updateConversation(conversationId, {
        title: summary.substring(0, 100),
      });

      res.json({ summary });
    } catch (error) {
      console.error("Error summarizing conversation:", error);
      res.status(500).json({ message: "Failed to summarize conversation" });
    }
  });

  // User/Tenant routes
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const { role } = req.query;
      const users = await storage.getUsersByRole(role as string);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser || (currentUser.role !== 'property_manager' && currentUser.role !== 'landlord' && currentUser.role !== 'admin')) {
        return res.status(403).json({ message: "Unauthorized to create users" });
      }

      const createUserSchema = z.object({
        email: z.string().email(),
        firstName: z.string(),
        lastName: z.string(),
        role: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        companyName: z.string().optional(),
        taxId: z.string().optional(),
      });

      const validatedData = createUserSchema.parse(req.body);
      
      const invitationToken = crypto.randomBytes(32).toString('hex');
      const userRole = validatedData.role || 'tenant';
      
      const newUser = await storage.upsertUser({
        ...validatedData,
        role: userRole,
        invitationStatus: 'pending',
        invitationToken: invitationToken,
        invitationSentAt: new Date(),
      } as any);
      
      if (userRole === 'landlord' || userRole === 'tenant') {
        try {
          await sendOwnerInvitation(
            newUser.email!,
            `${newUser.firstName} ${newUser.lastName}`,
            invitationToken
          );
          console.log(`Invitation email sent to ${newUser.email}`);
        } catch (emailError) {
          console.error("Failed to send invitation email:", emailError);
        }
      }
      
      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const targetUserId = req.params.id;

      // Users can only update their own profile or managers/landlords can update tenants
      if (userId !== targetUserId) {
        const user = await storage.getUser(userId);
        if (user?.role !== 'property_manager' && user?.role !== 'landlord') {
          return res.status(403).json({ message: "Unauthorized to update this user" });
        }
      }

      const updateSchema = z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        profileImageUrl: z.string().optional(),
        preferredCurrency: z.string().optional(),
        timezone: z.string().optional(),
        language: z.string().optional(),
        marketingEmailsEnabled: z.boolean().optional(),
        dataProcessingConsent: z.boolean().optional(),
        gdprConsentGiven: z.boolean().optional(),
      });

      const validatedData = updateSchema.parse(req.body);
      
      const updateData: any = { ...validatedData };
      if (validatedData.gdprConsentGiven !== undefined) {
        updateData.gdprConsentDate = validatedData.gdprConsentGiven ? new Date() : null;
      }
      
      const updatedUser = await storage.updateUser(targetUserId, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const targetUserId = req.params.id;

      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "Current user not found" });
      }

      // Only admins and property managers can delete users
      if (currentUser.role !== 'admin' && currentUser.role !== 'property_manager') {
        return res.status(403).json({ message: "Unauthorized to delete users" });
      }

      // Cannot delete yourself
      if (userId === targetUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has active leases
      const activeLeases = await storage.getLeasesByTenant(targetUserId);
      const hasActiveLeases = activeLeases.some(lease => lease.status === 'active');
      
      if (hasActiveLeases) {
        return res.status(400).json({ 
          message: "Cannot delete user with active leases. Please terminate all leases first." 
        });
      }

      await storage.deleteUser(targetUserId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Invitation routes
  app.post('/api/invitations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== 'property_manager' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Only administrators and property managers can send invitations" });
      }

      // Admins can invite property_manager, property managers cannot
      if (user.role === 'property_manager' && req.body.role === 'property_manager') {
        return res.status(403).json({ message: "Only administrators can invite property managers" });
      }

      const validationSchema = insertInvitationSchema.omit({ token: true, status: true, invitedBy: true, expiresAt: true });
      const validatedData = validationSchema.parse(req.body);

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      const invitation = await storage.createInvitation({
        ...validatedData,
        invitedBy: userId,
        token,
        status: 'pending',
        expiresAt,
      });

      try {
        const { sendInvitationEmail } = await import('./services/resendService.js');
        const inviterName = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.firstName || user.email;
        await sendInvitationEmail(
          validatedData.email,
          validatedData.role,
          token,
          inviterName || undefined
        );
        logger.info(`Invitation email sent successfully to ${validatedData.email}`);
      } catch (emailError: any) {
        logger.warn(`Failed to send invitation email to ${validatedData.email}: ${emailError.message || emailError}`);
      }

      res.json(invitation);
    } catch (error) {
      logger.error(`Error creating invitation: ${error}`);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  app.get('/api/invitations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== 'property_manager' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Only administrators and property managers can view invitations" });
      }

      const invitations = await storage.getInvitations(userId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.get('/api/invitations/verify/:token', async (req: any, res) => {
    try {
      const { token } = req.params;
      const invitation = await storage.getInvitationByToken(token);

      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: "Invitation already used or expired" });
      }

      if (new Date() > new Date(invitation.expiresAt)) {
        await storage.expireInvitation(invitation.id);
        return res.status(400).json({ message: "Invitation has expired" });
      }

      res.json({ 
        email: invitation.email, 
        role: invitation.role,
        valid: true 
      });
    } catch (error) {
      console.error("Error verifying invitation:", error);
      res.status(500).json({ message: "Failed to verify invitation" });
    }
  });

  app.post('/api/invitations/accept/:token', isAuthenticated, async (req: any, res) => {
    try {
      const { token } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const invitation = await storage.getInvitationByToken(token);

      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: "Invitation already used or expired" });
      }

      if (new Date() > new Date(invitation.expiresAt)) {
        await storage.expireInvitation(invitation.id);
        return res.status(400).json({ message: "Invitation has expired" });
      }

      if (user.email !== invitation.email) {
        return res.status(400).json({ 
          message: `This invitation is for ${invitation.email}, but you're logged in as ${user.email}. Please log out and sign in with ${invitation.email} to accept this invitation.`
        });
      }

      await storage.acceptInvitation(token);
      await storage.updateUser(userId, { 
        role: invitation.role,
        invitationStatus: 'accepted',
        organizationId: invitation.organizationId || undefined,
      });

      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Property routes
  app.post('/api/properties', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertPropertySchema.parse({
        ...req.body,
        managerId: userId,
      });
      const property = await storage.createProperty(validatedData);
      
      const onboardingProgress = await storage.getOnboardingProgress(userId);
      if (onboardingProgress && !onboardingProgress.completed) {
        await storage.updateOnboardingProgress(userId, {
          createdPropertyId: property.id,
        });
      }
      
      res.json(property);
    } catch (error) {
      console.error("Error creating property:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  app.get('/api/properties', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let properties;
      if (user.role === 'admin') {
        // Admins see all properties
        properties = await storage.getProperties(undefined, undefined);
      } else if (user.role === 'landlord') {
        properties = await storage.getProperties(undefined, userId);
      } else if (user.role === 'tenant') {
        // Tenants see properties where they have active leases
        const tenantUnits = await storage.getUnitsByTenant(userId);
        const propertyIds = [...new Set(tenantUnits.map(unit => unit.propertyId))];
        properties = [];
        for (const propertyId of propertyIds) {
          const property = await storage.getProperty(propertyId);
          if (property) {
            properties.push(property);
          }
        }
      } else {
        // Property managers see properties they manage
        properties = await storage.getProperties(userId);
      }
      
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get('/api/properties/:id', isAuthenticated, async (req: any, res) => {
    try {
      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.patch('/api/properties/:id', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertPropertySchema.partial().parse(req.body);
      const property = await storage.updateProperty(req.params.id, validatedData);
      res.json(property);
    } catch (error) {
      console.error("Error updating property:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  app.delete('/api/properties/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteProperty(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting property:", error);
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // Unit routes
  app.post('/api/units', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertUnitSchema.parse(req.body);
      const unit = await storage.createUnit(validatedData);
      res.json(unit);
    } catch (error) {
      console.error("Error creating unit:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create unit" });
    }
  });

  app.get('/api/units', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let units;
      if (user.role === 'admin') {
        // Admins see all units
        const properties = await storage.getProperties(undefined, undefined);
        const propertyIds = properties.map(p => p.id);
        units = [];
        for (const propertyId of propertyIds) {
          const propertyUnits = await storage.getUnitsByProperty(propertyId);
          units.push(...propertyUnits);
        }
      } else if (user.role === 'tenant') {
        // Tenants can only see units they have active leases for
        units = await storage.getUnitsByTenant(userId);
      } else if (user.role === 'property_manager') {
        // Managers can see units in their managed properties
        const properties = await storage.getProperties(userId, undefined);
        const propertyIds = properties.map(p => p.id);
        units = [];
        for (const propertyId of propertyIds) {
          const propertyUnits = await storage.getUnitsByProperty(propertyId);
          units.push(...propertyUnits);
        }
      } else if (user.role === 'landlord') {
        // Landlords can see units in their owned properties
        const properties = await storage.getProperties(undefined, userId);
        const propertyIds = properties.map(p => p.id);
        units = [];
        for (const propertyId of propertyIds) {
          const propertyUnits = await storage.getUnitsByProperty(propertyId);
          units.push(...propertyUnits);
        }
      } else {
        // Vendors and others see no units
        units = [];
      }

      res.json(units);
    } catch (error) {
      console.error("Error fetching units:", error);
      res.status(500).json({ message: "Failed to fetch units" });
    }
  });

  app.get('/api/properties/:propertyId/units', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const property = await storage.getProperty(req.params.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Check authorization: admins see all, landlords see owned, managers see managed
      const isAuthorized = 
        user.role === 'admin' || 
        (user.role === 'landlord' && property.ownerId === userId) ||
        (user.role === 'property_manager' && property.managerId === userId);

      if (!isAuthorized) {
        return res.status(403).json({ message: "You don't have permission to view units for this property" });
      }

      const units = await storage.getUnitsByProperty(req.params.propertyId);
      res.json(units);
    } catch (error) {
      console.error("Error fetching units:", error);
      res.status(500).json({ message: "Failed to fetch units" });
    }
  });

  app.patch('/api/units/:id', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertUnitSchema.partial().parse(req.body);
      const unit = await storage.updateUnit(req.params.id, validatedData);
      res.json(unit);
    } catch (error) {
      console.error("Error updating unit:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update unit" });
    }
  });

  app.delete('/api/units/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteUnit(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting unit:", error);
      res.status(500).json({ message: "Failed to delete unit" });
    }
  });

  // Lease routes
  app.post('/api/leases', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertLeaseSchema.parse(req.body);
      const lease = await storage.createLease(validatedData);
      res.json(lease);
    } catch (error) {
      console.error("Error creating lease:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lease" });
    }
  });

  app.get('/api/leases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { propertyId, unitId, status } = req.query;

      if (user.role === 'tenant') {
        const tenantLeases = await storage.getLeasesByTenant(userId);
        res.json(tenantLeases);
      } else if (user.role === 'admin') {
        // Admins see all leases
        const leases = await storage.getLeases({
          propertyId: propertyId as string,
          unitId: unitId as string,
          status: status as string,
        });
        res.json(leases);
      } else if (user.role === 'property_manager') {
        // Property managers only see leases for properties they manage
        const properties = await storage.getProperties(userId, undefined);
        const allLeases = await storage.getLeases({
          propertyId: propertyId as string,
          unitId: unitId as string,
          status: status as string,
        });
        const propertyIds = new Set(properties.map(p => p.id));
        const filteredLeases = [];
        for (const lease of allLeases) {
          const unit = await storage.getUnit(lease.unitId);
          if (unit && propertyIds.has(unit.propertyId)) {
            filteredLeases.push(lease);
          }
        }
        res.json(filteredLeases);
      } else if (user.role === 'landlord') {
        // Landlords only see leases for properties they own
        const properties = await storage.getProperties(undefined, userId);
        const allLeases = await storage.getLeases({
          propertyId: propertyId as string,
          unitId: unitId as string,
          status: status as string,
        });
        const propertyIds = new Set(properties.map(p => p.id));
        const filteredLeases = [];
        for (const lease of allLeases) {
          const unit = await storage.getUnit(lease.unitId);
          if (unit && propertyIds.has(unit.propertyId)) {
            filteredLeases.push(lease);
          }
        }
        res.json(filteredLeases);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching leases:", error);
      res.status(500).json({ message: "Failed to fetch leases" });
    }
  });

  app.get('/api/leases/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const lease = await storage.getLease(req.params.id);
      if (!lease) {
        return res.status(404).json({ message: "Lease not found" });
      }

      // Check authorization: admins see all, tenants see own leases, landlords/managers see leases for their properties
      if (user.role === 'admin') {
        return res.json(lease);
      }

      if (user.role === 'tenant' && lease.tenantId === userId) {
        return res.json(lease);
      }

      // For landlords and managers, check if lease is for their property
      if (user.role === 'landlord' || user.role === 'property_manager') {
        const unit = await storage.getUnit(lease.unitId);
        if (unit) {
          const property = await storage.getProperty(unit.propertyId);
          if (property && (
            (user.role === 'landlord' && property.ownerId === userId) ||
            (user.role === 'property_manager' && property.managerId === userId)
          )) {
            return res.json(lease);
          }
        }
      }

      return res.status(403).json({ message: "You don't have permission to view this lease" });
    } catch (error) {
      console.error("Error fetching lease:", error);
      res.status(500).json({ message: "Failed to fetch lease" });
    }
  });

  app.get('/api/leases/unit/:unitId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const unit = await storage.getUnit(req.params.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }

      // Check authorization: admins see all, landlords/managers see leases for their properties
      if (user.role === 'admin') {
        const leases = await storage.getLeasesByUnit(req.params.unitId);
        return res.json(leases);
      }

      if (user.role === 'landlord' || user.role === 'property_manager') {
        const property = await storage.getProperty(unit.propertyId);
        if (property && (
          (user.role === 'landlord' && property.ownerId === userId) ||
          (user.role === 'property_manager' && property.managerId === userId)
        )) {
          const leases = await storage.getLeasesByUnit(req.params.unitId);
          return res.json(leases);
        }
      }

      // Tenants can only see leases for units they currently lease
      if (user.role === 'tenant') {
        const leases = await storage.getLeasesByUnit(req.params.unitId);
        const userLeases = leases.filter(lease => lease.tenantId === userId);
        return res.json(userLeases);
      }

      return res.status(403).json({ message: "You don't have permission to view leases for this unit" });
    } catch (error) {
      console.error("Error fetching leases:", error);
      res.status(500).json({ message: "Failed to fetch leases" });
    }
  });

  app.get('/api/leases/tenant/:tenantId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const targetTenantId = req.params.tenantId;

      // Check authorization: admins see all, tenants see only their own
      if (user.role === 'admin') {
        const leases = await storage.getLeasesByTenant(targetTenantId);
        return res.json(leases);
      }

      if (user.role === 'tenant' && userId === targetTenantId) {
        const leases = await storage.getLeasesByTenant(targetTenantId);
        return res.json(leases);
      }

      // For landlords and managers, verify the tenant is in one of their properties
      if (user.role === 'landlord' || user.role === 'property_manager') {
        const properties = user.role === 'landlord' 
          ? await storage.getProperties(undefined, userId)
          : await storage.getProperties(userId, undefined);
        
        const propertyIds = new Set(properties.map(p => p.id));
        const tenantLeases = await storage.getLeasesByTenant(targetTenantId);
        
        // Filter leases to only those in the user's properties
        const authorizedLeases = [];
        for (const lease of tenantLeases) {
          const unit = await storage.getUnit(lease.unitId);
          if (unit && propertyIds.has(unit.propertyId)) {
            authorizedLeases.push(lease);
          }
        }

        if (authorizedLeases.length > 0) {
          return res.json(authorizedLeases);
        }
      }

      return res.status(403).json({ message: "You don't have permission to view leases for this tenant" });
    } catch (error) {
      console.error("Error fetching leases:", error);
      res.status(500).json({ message: "Failed to fetch leases" });
    }
  });

  app.patch('/api/leases/:id', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertLeaseSchema.partial().parse(req.body);
      const lease = await storage.updateLease(req.params.id, validatedData);
      res.json(lease);
    } catch (error) {
      console.error("Error updating lease:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update lease" });
    }
  });

  app.post('/api/leases/upload-document', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { ObjectStorageService } = await import('./objectStorage.js');
      const objectStorageService = new ObjectStorageService();
      const { objectStorageClient } = await import('./objectStorage.js');

      const privateDir = objectStorageService.getPrivateObjectDir();
      const filename = `lease-documents/${crypto.randomBytes(16).toString('hex')}-${req.file.originalname}`;
      const fullPath = `${privateDir}/${filename}`;

      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        metadata: {
          uploadedBy: req.user.claims.sub,
          originalName: req.file.originalname,
        },
      });

      const documentUrl = `/objects/${filename}`;
      
      res.json({ 
        documentUrl,
        message: "File uploaded successfully" 
      });
    } catch (error) {
      console.error("Error uploading lease document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.post('/api/leases/generate-document', isAuthenticated, async (req: any, res) => {
    try {
      const { unitId, tenantId, startDate, endDate, monthlyRent, securityDeposit } = req.body;

      const unit = await storage.getUnit(unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }

      const property = await storage.getProperty(unit.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      const tenant = await storage.getUser(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "Current user not found" });
      }

      const { generateLeaseDocument } = await import('./services/openaiService.js');
      const result = await generateLeaseDocument({
        propertyAddress: `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`,
        unitNumber: unit.unitNumber,
        landlordName: `${currentUser.firstName} ${currentUser.lastName}`,
        tenantName: `${tenant.firstName} ${tenant.lastName}`,
        startDate,
        endDate,
        monthlyRent,
        securityDeposit,
        stateJurisdiction: property.state,
      });

      if (!result) {
        return res.status(500).json({ message: "Failed to generate lease document" });
      }

      res.json(result);
    } catch (error) {
      console.error("Error generating lease document:", error);
      res.status(500).json({ message: "Failed to generate lease document" });
    }
  });

  app.post('/api/leases/:id/send-for-signature', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'property_manager' && user.role !== 'landlord')) {
        return res.status(403).json({ message: "Only property managers, landlords, and admins can send leases for signature" });
      }

      const lease = await storage.getLease(req.params.id);
      if (!lease) {
        return res.status(404).json({ message: "Lease not found" });
      }

      const tenant = await storage.getUser(lease.tenantId);
      if (!tenant || !tenant.email) {
        return res.status(404).json({ message: "Tenant email not found" });
      }

      const unit = await storage.getUnit(lease.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }

      const property = await storage.getProperty(unit.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      const { sendLeaseSignatureRequest } = await import('./services/resendService.js');
      await sendLeaseSignatureRequest(
        tenant.email,
        `${tenant.firstName} ${tenant.lastName}`,
        `${property.address}, ${property.city}, ${property.state}`,
        unit.unitNumber,
        lease.id
      );

      res.json({ success: true, message: "Signature request sent successfully" });
    } catch (error) {
      console.error("Error sending lease for signature:", error);
      res.status(500).json({ message: "Failed to send lease for signature" });
    }
  });

  app.post('/api/leases/:id/sign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const lease = await storage.getLease(req.params.id);
      
      if (!lease) {
        return res.status(404).json({ message: "Lease not found" });
      }

      if (lease.tenantId !== userId) {
        return res.status(403).json({ message: "You can only sign your own leases" });
      }

      if (lease.status !== 'pending_signature') {
        return res.status(400).json({ message: "This lease is not pending signature" });
      }

      const crypto = require('crypto');
      const documentHash = lease.documentUrl 
        ? crypto.createHash('sha256').update(lease.documentUrl).digest('hex')
        : crypto.createHash('sha256').update(JSON.stringify(lease)).digest('hex');

      const eSignatureLog = await storage.createESignatureLog({
        leaseId: lease.id,
        signedBy: userId,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        documentHash: documentHash,
      });

      const updatedLease = await storage.updateLease(lease.id, {
        status: 'active',
        signedAt: new Date(),
      });

      res.json({ 
        success: true, 
        message: "Lease signed successfully",
        lease: updatedLease,
        signature: eSignatureLog
      });
    } catch (error) {
      console.error("Error signing lease:", error);
      res.status(500).json({ message: "Failed to sign lease" });
    }
  });

  function parseObjectPath(path: string): { bucketName: string; objectName: string } {
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }
    const pathParts = path.split("/");
    if (pathParts.length < 3) {
      throw new Error("Invalid path: must contain at least a bucket name");
    }
    const bucketName = pathParts[1];
    const objectName = pathParts.slice(2).join("/");
    return { bucketName, objectName };
  }

  // Maintenance routes
  app.post('/api/maintenance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only tenants can create maintenance requests
      if (user.role !== 'tenant') {
        return res.status(403).json({ message: "Only tenants can create maintenance requests" });
      }

      const validatedData = insertMaintenanceRequestSchema.parse({
        ...req.body,
        tenantId: userId,
      });

      // Verify the tenant has an active lease for the unit
      const leases = await storage.getLeasesByTenant(userId);
      const hasActiveLease = leases.some(
        lease => lease.unitId === validatedData.unitId && lease.status === 'active'
      );

      if (!hasActiveLease) {
        return res.status(403).json({ message: "You can only create maintenance requests for units you currently lease" });
      }

      // Smart Routing: Auto-assign to default vendor if enabled (only if not already assigned)
      if (!validatedData.assignedToId) {
        const unit = await storage.getUnit(validatedData.unitId);
        if (unit) {
          const property = await storage.getProperty(unit.propertyId);
          if (property && property.smartRoutingEnabled && property.defaultVendorId) {
            // Automatically assign to the property's default vendor
            validatedData.assignedToId = property.defaultVendorId;
            validatedData.status = 'assigned';
          }
        }
      }

      const request = await storage.createMaintenanceRequest(validatedData);
      res.json(request);
    } catch (error) {
      console.error("Error creating maintenance request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create maintenance request" });
    }
  });

  app.get('/api/maintenance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { status, priority } = req.query;
      let requests: any[] = [];

      if (user.role === 'admin') {
        // Admins see all maintenance requests
        requests = await storage.getMaintenanceRequests({
          status: status as string,
          priority: priority as string,
        });
      } else if (user.role === 'tenant') {
        // Tenants can only see their own requests
        requests = await storage.getMaintenanceRequests({
          tenantId: userId,
          status: status as string,
          priority: priority as string,
        });
      } else if (user.role === 'property_manager') {
        // Managers can see requests for properties they manage
        const properties = await storage.getProperties(userId, undefined);
        const allRequests = await storage.getMaintenanceRequests({
          status: status as string,
          priority: priority as string,
        });
        
        // Filter requests to only those in managed properties
        const managedPropertyIds = new Set(properties.map(p => p.id));
        const managedRequests = [];
        for (const request of allRequests) {
          const unit = await storage.getUnit(request.unitId);
          if (unit && managedPropertyIds.has(unit.propertyId)) {
            managedRequests.push(request);
          }
        }
        requests = managedRequests;
      } else if (user.role === 'landlord') {
        // Landlords can see requests for properties they own
        const properties = await storage.getProperties(undefined, userId);
        const allRequests = await storage.getMaintenanceRequests({
          status: status as string,
          priority: priority as string,
        });
        
        // Filter requests to only those in owned properties
        const ownedPropertyIds = new Set(properties.map(p => p.id));
        const ownedRequests = [];
        for (const request of allRequests) {
          const unit = await storage.getUnit(request.unitId);
          if (unit && ownedPropertyIds.has(unit.propertyId)) {
            ownedRequests.push(request);
          }
        }
        requests = ownedRequests;
      } else {
        // Vendors and others see no requests
        requests = [];
      }

      res.json(requests);
    } catch (error) {
      console.error("Error fetching maintenance requests:", error);
      res.status(500).json({ message: "Failed to fetch maintenance requests" });
    }
  });

  app.patch('/api/maintenance/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only admins, property managers and landlords can update maintenance requests
      if (user.role !== 'admin' && user.role !== 'property_manager' && user.role !== 'landlord') {
        return res.status(403).json({ message: "Only administrators, property managers and landlords can update maintenance requests" });
      }

      // Get the maintenance request to verify it exists
      const maintenanceRequest = await storage.getMaintenanceRequest(req.params.id);
      if (!maintenanceRequest) {
        return res.status(404).json({ message: "Maintenance request not found" });
      }

      // Admins can update any request, skip authorization checks
      if (user.role !== 'admin') {
        // Get the unit and property to verify the user manages/owns it
        const unit = await storage.getUnit(maintenanceRequest.unitId);
        if (!unit) {
          return res.status(404).json({ message: "Unit not found" });
        }

        const property = await storage.getProperty(unit.propertyId);
        if (!property) {
          return res.status(404).json({ message: "Property not found" });
        }

        // Verify the user is the manager or owner of the property
        if (user.role === 'property_manager' && property.managerId !== userId) {
          return res.status(403).json({ message: "You can only update maintenance requests for properties you manage" });
        }

        if (user.role === 'landlord' && property.ownerId !== userId) {
          return res.status(403).json({ message: "You can only update maintenance requests for properties you own" });
        }
      }

      // Only allow updating specific fields to prevent unauthorized changes
      const updateSchema = z.object({
        status: z.enum(['open', 'assigned', 'in_progress', 'completed', 'cancelled']).optional(),
        assignedToId: z.string().nullable().optional(),
        estimatedCost: z.string().optional(),
        actualCost: z.string().optional(),
        completedAt: z.date().optional(),
      });

      const validatedData = updateSchema.parse(req.body);
      
      // Auto-set completedAt when status changes to completed
      if (validatedData.status === 'completed' && !validatedData.completedAt) {
        validatedData.completedAt = new Date();
      }

      const request = await storage.updateMaintenanceRequest(req.params.id, validatedData);
      res.json(request);
    } catch (error) {
      console.error("Error updating maintenance request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update maintenance request" });
    }
  });

  app.post('/api/maintenance/upload-photos', isAuthenticated, upload.array('photos', 5), async (req: any, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const { ObjectStorageService } = await import('./objectStorage.js');
      const objectStorageService = new ObjectStorageService();
      const { objectStorageClient } = await import('./objectStorage.js');

      const privateDir = objectStorageService.getPrivateObjectDir();
      const photoUrls: string[] = [];

      for (const file of req.files) {
        const filename = `maintenance-photos/${crypto.randomBytes(16).toString('hex')}-${file.originalname}`;
        const fullPath = `${privateDir}/${filename}`;

        const { bucketName, objectName } = parseObjectPath(fullPath);
        const bucket = objectStorageClient.bucket(bucketName);
        const fileObj = bucket.file(objectName);

        await fileObj.save(file.buffer, {
          contentType: file.mimetype,
          metadata: {
            uploadedBy: req.user.claims.sub,
            originalName: file.originalname,
          },
        });

        photoUrls.push(`/objects/${filename}`);
      }
      
      res.json({ 
        photoUrls,
        message: `${photoUrls.length} photo(s) uploaded successfully` 
      });
    } catch (error) {
      console.error("Error uploading maintenance photos:", error);
      res.status(500).json({ message: "Failed to upload photos" });
    }
  });

  // Payment routes
  app.post('/api/payments/create-intent', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const { amount, leaseId, paymentMethod } = req.body;
      
      // Calculate processing fee based on payment method
      let processingFee = 0;
      if (paymentMethod === 'ach') {
        processingFee = 0.50;
      } else if (paymentMethod === 'debit_card') {
        processingFee = (amount * 0.024) + 0.30;
      } else if (paymentMethod === 'credit_card') {
        processingFee = (amount * 0.029) + 0.30;
      } else {
        processingFee = (amount * 0.029) + 0.30;
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round((amount + processingFee) * 100),
        currency: "usd",
        metadata: {
          leaseId,
          paymentMethod,
          processingFee: processingFee.toFixed(2),
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        processingFee: processingFee.toFixed(2),
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  app.get('/api/payments/fee-quote', isAuthenticated, async (req: any, res) => {
    try {
      const { amount, method } = req.query;
      const paymentAmount = parseFloat(amount as string);

      let processingFee = 0;
      if (method === 'ach') {
        processingFee = 0.50;
      } else if (method === 'debit_card') {
        processingFee = (paymentAmount * 0.024) + 0.30;
      } else if (method === 'credit_card') {
        processingFee = (paymentAmount * 0.029) + 0.30;
      } else {
        processingFee = (paymentAmount * 0.029) + 0.30;
      }

      res.json({
        amount: paymentAmount,
        processingFee: parseFloat(processingFee.toFixed(2)),
        total: parseFloat((paymentAmount + processingFee).toFixed(2)),
        method,
      });
    } catch (error) {
      console.error("Error calculating fee quote:", error);
      res.status(500).json({ message: "Failed to calculate fee quote" });
    }
  });

  app.post('/api/payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertPaymentSchema.parse({
        ...req.body,
        tenantId: userId,
      });
      const payment = await storage.createPayment(validatedData);
      res.json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.get('/api/payments', isAuthenticated, async (req: any, res) => {
    try {
      const { leaseId, tenantId, status } = req.query;
      const payments = await storage.getPayments({
        leaseId: leaseId as string,
        tenantId: tenantId as string,
        status: status as string,
      });
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get('/api/payments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Check authorization: admins see all, tenants see own payments, landlords/managers see payments for their properties
      if (user.role === 'admin') {
        return res.json(payment);
      }

      if (user.role === 'tenant' && payment.tenantId === userId) {
        return res.json(payment);
      }

      // For landlords and managers, check if payment is for their property
      if (user.role === 'landlord' || user.role === 'property_manager') {
        const lease = await storage.getLease(payment.leaseId);
        if (lease) {
          const unit = await storage.getUnit(lease.unitId);
          if (unit) {
            const property = await storage.getProperty(unit.propertyId);
            if (property && (
              (user.role === 'landlord' && property.ownerId === userId) ||
              (user.role === 'property_manager' && property.managerId === userId)
            )) {
              return res.json(payment);
            }
          }
        }
      }

      return res.status(403).json({ message: "You don't have permission to view this payment" });
    } catch (error) {
      console.error("Error fetching payment:", error);
      res.status(500).json({ message: "Failed to fetch payment" });
    }
  });

  app.get('/api/payments/tenant/:tenantId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const targetTenantId = req.params.tenantId;

      // Check authorization: admins see all, tenants see only their own
      if (user.role === 'admin') {
        const payments = await storage.getPaymentsByTenant(targetTenantId);
        return res.json(payments);
      }

      if (user.role === 'tenant' && userId === targetTenantId) {
        const payments = await storage.getPaymentsByTenant(targetTenantId);
        return res.json(payments);
      }

      // For landlords and managers, verify the tenant is in one of their properties
      if (user.role === 'landlord' || user.role === 'property_manager') {
        const properties = user.role === 'landlord' 
          ? await storage.getProperties(undefined, userId)
          : await storage.getProperties(userId, undefined);
        
        const propertyIds = new Set(properties.map(p => p.id));
        const tenantLeases = await storage.getLeasesByTenant(targetTenantId);
        
        // Check if any of the tenant's leases are in the user's properties
        let isAuthorized = false;
        for (const lease of tenantLeases) {
          const unit = await storage.getUnit(lease.unitId);
          if (unit && propertyIds.has(unit.propertyId)) {
            isAuthorized = true;
            break;
          }
        }

        if (isAuthorized) {
          const payments = await storage.getPaymentsByTenant(targetTenantId);
          return res.json(payments);
        }
      }

      return res.status(403).json({ message: "You don't have permission to view payments for this tenant" });
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.patch('/api/payments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertPaymentSchema.partial().parse(req.body);
      const payment = await storage.updatePayment(req.params.id, validatedData);
      res.json(payment);
    } catch (error) {
      console.error("Error updating payment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update payment" });
    }
  });

  // Payment Plan routes
  app.post('/api/payment-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'tenant') {
        return res.status(403).json({ message: "Only tenants can create payment plans" });
      }

      const validatedData = insertPaymentPlanSchema.parse({
        ...req.body,
        tenantId: userId,
      });

      const lease = await storage.getLease(validatedData.leaseId);
      if (!lease) {
        return res.status(404).json({ message: "Lease not found" });
      }

      if (lease.tenantId !== userId) {
        return res.status(403).json({ message: "You can only create payment plans for your own leases" });
      }

      const plan = await storage.createPaymentPlan(validatedData);
      
      const installments = [];
      for (let i = 0; i < plan.numberOfInstallments; i++) {
        const dueDate = new Date(plan.startDate);
        if (plan.frequency === 'weekly') {
          dueDate.setDate(dueDate.getDate() + (i * 7));
        } else if (plan.frequency === 'biweekly') {
          dueDate.setDate(dueDate.getDate() + (i * 14));
        } else {
          dueDate.setMonth(dueDate.getMonth() + i);
        }
        
        const installment = await storage.createPaymentInstallment({
          paymentPlanId: plan.id,
          installmentNumber: i + 1,
          amount: plan.installmentAmount,
          dueDate: dueDate.toISOString().split('T')[0],
          status: 'pending',
        });
        installments.push(installment);
      }
      
      res.json({ plan, installments });
    } catch (error) {
      console.error("Error creating payment plan:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create payment plan" });
    }
  });

  app.get('/api/payment-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { leaseId, tenantId, status } = req.query;

      if (user.role === 'tenant') {
        const plans = await storage.getPaymentPlans({
          tenantId: userId,
          leaseId: leaseId as string,
          status: status as string,
        });
        res.json(plans);
      } else if (user.role === 'admin' || user.role === 'property_manager') {
        const plans = await storage.getPaymentPlans({
          leaseId: leaseId as string,
          tenantId: tenantId as string,
          status: status as string,
        });
        res.json(plans);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching payment plans:", error);
      res.status(500).json({ message: "Failed to fetch payment plans" });
    }
  });

  app.get('/api/payment-plans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const plan = await storage.getPaymentPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Payment plan not found" });
      }

      if (user.role === 'tenant' && plan.tenantId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(plan);
    } catch (error) {
      console.error("Error fetching payment plan:", error);
      res.status(500).json({ message: "Failed to fetch payment plan" });
    }
  });

  app.get('/api/payment-plans/:id/installments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const plan = await storage.getPaymentPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Payment plan not found" });
      }

      if (user.role === 'tenant' && plan.tenantId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const installments = await storage.getPaymentInstallments(req.params.id);
      res.json(installments);
    } catch (error) {
      console.error("Error fetching installments:", error);
      res.status(500).json({ message: "Failed to fetch installments" });
    }
  });

  app.patch('/api/payment-plans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const existingPlan = await storage.getPaymentPlan(req.params.id);
      if (!existingPlan) {
        return res.status(404).json({ message: "Payment plan not found" });
      }

      if (user.role === 'tenant' && existingPlan.tenantId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertPaymentPlanSchema.partial().parse(req.body);
      const plan = await storage.updatePaymentPlan(req.params.id, validatedData);
      res.json(plan);
    } catch (error) {
      console.error("Error updating payment plan:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update payment plan" });
    }
  });

  app.patch('/api/payment-installments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validatedData = insertPaymentInstallmentSchema.partial().parse(req.body);
      const existingInstallment = await storage.getPaymentInstallment(req.params.id);
      
      if (!existingInstallment) {
        return res.status(404).json({ message: "Installment not found" });
      }

      const plan = await storage.getPaymentPlan(existingInstallment.paymentPlanId);
      if (!plan) {
        return res.status(404).json({ message: "Payment plan not found" });
      }

      if (user.role === 'tenant' && plan.tenantId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const installment = await storage.updatePaymentInstallment(req.params.id, validatedData);
      
      if (validatedData.status === 'paid') {
        const allInstallments = await storage.getPaymentInstallments(installment.paymentPlanId);
        const plan = await storage.getPaymentPlan(installment.paymentPlanId);
        
        if (plan) {
          const paidInstallments = allInstallments.filter(i => i.status === 'paid');
          const paidAmount = paidInstallments.reduce((sum, i) => sum + parseFloat(i.amount), 0);
          const remainingAmount = parseFloat(plan.totalAmount) - paidAmount;
          
          const allPaid = allInstallments.every(i => i.status === 'paid');
          await storage.updatePaymentPlan(plan.id, {
            paidAmount: paidAmount.toString(),
            remainingAmount: remainingAmount.toString(),
            status: allPaid ? 'completed' : 'active',
          });
        }
      }
      
      res.json(installment);
    } catch (error) {
      console.error("Error updating installment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update installment" });
    }
  });

  // Screening routes
  app.post('/api/screenings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const screeningSchema = insertScreeningSchema.extend({
        propertyId: insertScreeningSchema.shape.propertyId.optional(),
      });
      const validatedData = screeningSchema.parse({
        ...req.body,
        applicantId: userId,
      });
      const screening = await storage.createScreening(validatedData);
      res.json(screening);
    } catch (error) {
      console.error("Error creating screening:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create screening" });
    }
  });

  app.get('/api/screenings', isAuthenticated, async (req: any, res) => {
    try {
      const { propertyId, status } = req.query;
      const screenings = await storage.getScreenings({
        propertyId: propertyId as string,
        status: status as string,
      });
      res.json(screenings);
    } catch (error) {
      console.error("Error fetching screenings:", error);
      res.status(500).json({ message: "Failed to fetch screenings" });
    }
  });

  app.get('/api/screenings/property/:propertyId', isAuthenticated, async (req: any, res) => {
    try {
      const screenings = await storage.getScreeningsByProperty(req.params.propertyId);
      res.json(screenings);
    } catch (error) {
      console.error("Error fetching screenings:", error);
      res.status(500).json({ message: "Failed to fetch screenings" });
    }
  });

  app.patch('/api/screenings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertScreeningSchema.partial().parse(req.body);
      const screening = await storage.updateScreening(req.params.id, validatedData);
      res.json(screening);
    } catch (error) {
      console.error("Error updating screening:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update screening" });
    }
  });

  app.delete('/api/screenings/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteScreening(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting screening:", error);
      res.status(500).json({ message: "Failed to delete screening" });
    }
  });

  // Transaction routes
  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const { propertyId, startDate, endDate } = req.query;
      const transactions = await storage.getTransactions({
        propertyId: propertyId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/transactions/property/:propertyId', isAuthenticated, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      const transactions = await storage.getTransactionsByProperty(
        req.params.propertyId,
        startDate as string,
        endDate as string
      );
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Turnboard / Turn Task routes
  app.post('/api/turn-tasks', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertTurnTaskSchema.parse(req.body);
      const task = await storage.createTurnTask(validatedData);
      res.json(task);
    } catch (error) {
      console.error("Error creating turn task:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create turn task" });
    }
  });

  app.get('/api/turn-tasks', isAuthenticated, async (req: any, res) => {
    try {
      const { unitId, status, assignedToId } = req.query;
      const tasks = await storage.getTurnTasks({
        unitId: unitId as string,
        status: status as string,
        assignedToId: assignedToId as string,
      });
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching turn tasks:", error);
      res.status(500).json({ message: "Failed to fetch turn tasks" });
    }
  });

  app.patch('/api/turn-tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updated = await storage.updateTurnTask(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating turn task:", error);
      res.status(500).json({ message: "Failed to update turn task" });
    }
  });

  // SMS Preferences routes
  app.get('/api/sms-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prefs = await storage.getSmsPreferences(userId);
      res.json(prefs || { optedIn: false });
    } catch (error) {
      console.error("Error fetching SMS preferences:", error);
      res.status(500).json({ message: "Failed to fetch SMS preferences" });
    }
  });

  app.post('/api/sms-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertSmsPreferencesSchema.parse({ ...req.body, userId });
      const prefs = await storage.upsertSmsPreferences(validatedData);
      res.json(prefs);
    } catch (error) {
      console.error("Error updating SMS preferences:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update SMS preferences" });
    }
  });

  // Delinquency Playbook routes
  app.post('/api/delinquency-playbooks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !['admin', 'property_manager', 'landlord'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertDelinquencyPlaybookSchema.parse(req.body);
      
      if (validatedData.propertyId) {
        const property = await storage.getProperty(validatedData.propertyId);
        if (!property) {
          return res.status(404).json({ message: "Property not found" });
        }
        
        if (user.role === 'landlord' && property.ownerId !== userId) {
          return res.status(403).json({ message: "Access denied - not your property" });
        }
        
        if (user.role === 'property_manager' && property.managerId !== userId && property.ownerId !== userId) {
          return res.status(403).json({ message: "Access denied - you are not assigned to manage this property" });
        }
      }

      const playbook = await storage.createDelinquencyPlaybook(validatedData);
      res.json(playbook);
    } catch (error) {
      console.error("Error creating delinquency playbook:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create delinquency playbook" });
    }
  });

  app.get('/api/delinquency-playbooks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!['admin', 'property_manager', 'landlord'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied - insufficient permissions" });
      }

      const { propertyId, isActive } = req.query;
      let playbooks = await storage.getDelinquencyPlaybooks({
        propertyId: propertyId as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      });

      if (user.role === 'landlord') {
        const filtered = [];
        for (const p of playbooks) {
          if (!p.propertyId) continue;
          const property = await storage.getProperty(p.propertyId);
          if (property?.ownerId === userId) {
            filtered.push(p);
          }
        }
        playbooks = filtered;
      }

      if (user.role === 'property_manager') {
        const filtered = [];
        for (const p of playbooks) {
          if (!p.propertyId) continue;
          const property = await storage.getProperty(p.propertyId);
          if (property?.managerId === userId || property?.ownerId === userId) {
            filtered.push(p);
          }
        }
        playbooks = filtered;
      }

      res.json(playbooks);
    } catch (error) {
      console.error("Error fetching delinquency playbooks:", error);
      res.status(500).json({ message: "Failed to fetch delinquency playbooks" });
    }
  });

  app.get('/api/delinquency-playbooks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!['admin', 'property_manager', 'landlord'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied - insufficient permissions" });
      }

      const playbook = await storage.getDelinquencyPlaybook(req.params.id);
      if (!playbook) {
        return res.status(404).json({ message: "Playbook not found" });
      }

      if (playbook.propertyId && user.role !== 'admin') {
        const property = await storage.getProperty(playbook.propertyId);
        if (!property) {
          return res.status(404).json({ message: "Property not found" });
        }

        if (user.role === 'landlord' && property.ownerId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        if (user.role === 'property_manager' && property.managerId !== userId && property.ownerId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      res.json(playbook);
    } catch (error) {
      console.error("Error fetching delinquency playbook:", error);
      res.status(500).json({ message: "Failed to fetch delinquency playbook" });
    }
  });

  app.patch('/api/delinquency-playbooks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !['admin', 'property_manager', 'landlord'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const playbook = await storage.getDelinquencyPlaybook(req.params.id);
      if (!playbook) {
        return res.status(404).json({ message: "Playbook not found" });
      }

      if (playbook.propertyId && user.role !== 'admin') {
        const property = await storage.getProperty(playbook.propertyId);
        if (!property) {
          return res.status(404).json({ message: "Property not found" });
        }

        if (user.role === 'landlord' && property.ownerId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        if (user.role === 'property_manager' && property.managerId !== userId && property.ownerId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const updated = await storage.updateDelinquencyPlaybook(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating delinquency playbook:", error);
      res.status(500).json({ message: "Failed to update delinquency playbook" });
    }
  });

  // Delinquency Check (manual trigger)
  app.post('/api/delinquency-check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied - admin only" });
      }

      const { runDelinquencyCheck } = await import('./services/delinquencyService.js');
      await runDelinquencyCheck();
      
      res.json({ message: "Delinquency check completed successfully" });
    } catch (error) {
      console.error("Error running delinquency check:", error);
      res.status(500).json({ message: "Failed to run delinquency check" });
    }
  });

  // Delinquency Action routes
  app.get('/api/delinquency-actions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { paymentId, playbookId, tenantId } = req.query;
      let actions = await storage.getDelinquencyActions({
        paymentId: paymentId as string,
        playbookId: playbookId as string,
        tenantId: tenantId as string,
      });

      if (user.role === 'tenant') {
        actions = actions.filter(a => a.tenantId === userId);
      }

      if (user.role === 'landlord' || user.role === 'property_manager') {
        const allProperties = await storage.getProperties();
        const authorizedPropertyIds = new Set<string>();
        
        for (const property of allProperties) {
          if (user.role === 'landlord' && property.ownerId === userId) {
            authorizedPropertyIds.add(property.id);
          }
          if (user.role === 'property_manager' && (property.managerId === userId || property.ownerId === userId)) {
            authorizedPropertyIds.add(property.id);
          }
        }
        
        const authorizedPaymentIds = new Set<string>();
        const allLeases = await storage.getLeases({});
        const allPayments = await storage.getPayments({});
        
        for (const payment of allPayments) {
          const lease = allLeases.find(l => l.id === payment.leaseId);
          if (!lease) continue;
          
          const unit = await storage.getUnit(lease.unitId);
          if (!unit) continue;
          
          if (authorizedPropertyIds.has(unit.propertyId)) {
            authorizedPaymentIds.add(payment.id);
          }
        }
        
        actions = actions.filter(a => authorizedPaymentIds.has(a.paymentId));
      }

      res.json(actions);
    } catch (error) {
      console.error("Error fetching delinquency actions:", error);
      res.status(500).json({ message: "Failed to fetch delinquency actions" });
    }
  });

  // Delinquency Dashboard
  app.get('/api/delinquency-dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const allPayments = await storage.getPayments({});
      const allLeases = await storage.getLeases({});
      const allProperties = await storage.getProperties();
      
      const allUnits: Unit[] = [];
      for (const property of allProperties) {
        const propertyUnits = await storage.getUnitsByProperty(property.id);
        allUnits.push(...propertyUnits);
      }
      
      const allUsers = await storage.getUsersByRole();
      const allActions = await storage.getDelinquencyActions({});

      const authorizedPropertyIds = new Set<string>();
      if (user.role === 'admin') {
        allProperties.forEach(p => authorizedPropertyIds.add(p.id));
      } else if (user.role === 'landlord') {
        allProperties.filter(p => p.ownerId === userId).forEach(p => authorizedPropertyIds.add(p.id));
      } else if (user.role === 'property_manager') {
        allProperties.filter(p => p.managerId === userId || p.ownerId === userId).forEach(p => authorizedPropertyIds.add(p.id));
      }

      const now = new Date();
      const delinquentCases = [];
      const delinquentTenantIds = new Set<string>();
      let totalOverdue = 0;

      for (const payment of allPayments) {
        if (payment.status !== 'pending' || !payment.dueDate || new Date(payment.dueDate) > now) {
          continue;
        }

        const lease = allLeases.find(l => l.id === payment.leaseId);
        if (!lease) continue;

        const unit = allUnits.find(u => u.id === lease.unitId);
        if (!unit) continue;

        if (!authorizedPropertyIds.has(unit.propertyId)) continue;

        const property = allProperties.find(p => p.id === unit.propertyId);
        const tenant = allUsers.find(u => u.id === lease.tenantId);
        const actions = allActions.filter(a => a.paymentId === payment.id).sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );

        const daysOverdue = Math.floor((now.getTime() - new Date(payment.dueDate!).getTime()) / (1000 * 60 * 60 * 24));
        totalOverdue += parseFloat(payment.amount);
        delinquentTenantIds.add(lease.tenantId);

        delinquentCases.push({
          paymentId: payment.id,
          tenantId: lease.tenantId,
          tenantName: tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown',
          propertyName: property?.name || 'Unknown',
          unitNumber: unit.unitNumber,
          amount: payment.amount,
          dueDate: payment.dueDate,
          daysOverdue,
          lastActionDate: actions[0]?.createdAt || null,
          lastActionType: actions[0]?.actionType || null,
          actionsCount: actions.length,
        });
      }

      delinquentCases.sort((a, b) => b.daysOverdue - a.daysOverdue);

      const recentActions = allActions
        .filter(action => {
          const payment = allPayments.find(p => p.id === action.paymentId);
          if (!payment) return false;
          const lease = allLeases.find(l => l.id === payment.leaseId);
          if (!lease) return false;
          const unit = allUnits.find(u => u.id === lease.unitId);
          if (!unit) return false;
          return authorizedPropertyIds.has(unit.propertyId);
        })
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 20)
        .map(action => {
          const payment = allPayments.find(p => p.id === action.paymentId);
          const lease = payment ? allLeases.find(l => l.id === payment.leaseId) : null;
          const tenant = lease ? allUsers.find(u => u.id === lease.tenantId) : null;
          const unit = lease ? allUnits.find(u => u.id === lease.unitId) : null;
          const property = unit ? allProperties.find(p => p.id === unit.propertyId) : null;

          return {
            id: action.id,
            executedAt: action.createdAt,
            actionType: action.actionType,
            status: action.status,
            tenantName: tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown',
            propertyName: property?.name || 'Unknown',
            unitNumber: unit?.unitNumber || 'Unknown',
            amount: payment?.amount || 0,
          };
        });

      res.json({
        summary: {
          totalDelinquent: delinquentTenantIds.size,
          totalOverdue,
          activePlaybooks: await storage.getDelinquencyPlaybooks({}).then(p => p.filter(pb => pb.isActive).length),
          recentActionsCount: recentActions.length,
        },
        delinquentCases,
        recentActions,
      });
    } catch (error) {
      console.error("Error fetching delinquency dashboard:", error);
      res.status(500).json({ message: "Failed to fetch delinquency dashboard" });
    }
  });

  // AI Maintenance Triage route
  app.post('/api/maintenance/:id/triage', isAuthenticated, async (req: any, res) => {
    try {
      const maintenanceRequest = await storage.getMaintenanceRequest(req.params.id);
      if (!maintenanceRequest) {
        return res.status(404).json({ message: "Maintenance request not found" });
      }

      const { triageMaintenanceRequest } = await import('./services/openaiService.js');
      const result = await triageMaintenanceRequest(
        maintenanceRequest.description,
        maintenanceRequest.priority
      );

      if (result) {
        const triageResult = await storage.createAiTriageResult({
          maintenanceRequestId: maintenanceRequest.id,
          urgencyLevel: result.urgencyLevel,
          category: result.category,
          rootCause: result.rootCause,
          suggestedActions: result.suggestedActions,
          estimatedCost: result.estimatedCost?.toString(),
          selfServiceSteps: result.selfServiceSteps,
        });
        res.json(triageResult);
      } else {
        res.status(503).json({ message: "AI triage service unavailable" });
      }
    } catch (error) {
      console.error("Error in AI triage:", error);
      res.status(500).json({ message: "Failed to triage maintenance request" });
    }
  });

  app.get('/api/maintenance/:id/triage', isAuthenticated, async (req: any, res) => {
    try {
      const result = await storage.getAiTriageResult(req.params.id);
      res.json(result || null);
    } catch (error) {
      console.error("Error fetching triage result:", error);
      res.status(500).json({ message: "Failed to fetch triage result" });
    }
  });

  // Fair Housing Compliance checker
  app.post('/api/compliance/fair-housing-check', isAuthenticated, async (req: any, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const { checkFairHousingCompliance } = await import('./services/openaiService.js');
      const result = await checkFairHousingCompliance(text);
      res.json(result);
    } catch (error) {
      console.error("Error in Fair Housing check:", error);
      res.status(500).json({ message: "Failed to check Fair Housing compliance" });
    }
  });

  // Lease Renewal AI - Churn Prediction
  app.post('/api/leases/:id/renewal-prediction', isAuthenticated, async (req: any, res) => {
    try {
      const lease = await storage.getLease(req.params.id);
      if (!lease) {
        return res.status(404).json({ message: "Lease not found" });
      }

      const user = req.user;
      const userId = user.claims.sub;

      const unit = await storage.getUnit(lease.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }

      const property = await storage.getProperty(unit.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (user.role === 'tenant' && lease.tenantId !== userId) {
        return res.status(403).json({ message: "Access denied - not your lease" });
      }

      if (user.role === 'landlord' && property.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied - not your property" });
      }

      if (user.role === 'property_manager' && property.managerId !== userId && property.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied - you are not assigned to manage this property" });
      }

      const existingPrediction = await storage.getLeaseRenewalPrediction(req.params.id);
      if (existingPrediction && !req.body.force) {
        return res.json(existingPrediction);
      }

      const payments = await storage.getPayments({ leaseId: lease.id });
      const maintenanceRequests = await storage.getMaintenanceRequests({ unitId: lease.unitId });

      const onTimePayments = payments.filter(p => 
        p.status === 'completed' && 
        p.paidAt && 
        new Date(p.paidAt) <= new Date(p.dueDate)
      ).length;
      const latePayments = payments.filter(p => 
        p.status === 'completed' && 
        p.paidAt && 
        new Date(p.paidAt) > new Date(p.dueDate)
      ).length;
      const missedPayments = payments.filter(p => p.status === 'failed' || p.status === 'pending').length;

      const daysUntilExpiry = Math.ceil((new Date(lease.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const tenantDuration = Math.ceil((Date.now() - new Date(lease.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30));

      const { predictLeaseRenewal } = await import('./services/openaiService.js');
      const aiResult = await predictLeaseRenewal({
        monthlyRent: lease.monthlyRent,
        daysUntilExpiry,
        tenantDuration,
        paymentHistory: { onTime: onTimePayments, late: latePayments, missed: missedPayments },
        maintenanceRequests: maintenanceRequests.length,
        marketRentComparison: `Current rent: $${lease.monthlyRent}, Market average (assumed): $${parseFloat(lease.monthlyRent) * 1.05}`,
      });

      if (!aiResult) {
        return res.status(503).json({ 
          message: "AI service unavailable", 
          details: "OPENAI_API_KEY not configured or API call failed",
          leaseId: lease.id 
        });
      }

      const prediction = await storage.createLeaseRenewalPrediction({
        leaseId: lease.id,
        tenantId: lease.tenantId,
        daysUntilExpiry,
        churnRisk: aiResult.churnRisk,
        churnProbability: aiResult.churnProbability.toString(),
        riskFactors: aiResult.riskFactors,
        recommendedIncentives: aiResult.recommendedIncentives,
        suggestedRenewalTerms: aiResult.suggestedRenewalTerms,
        aiReasoning: aiResult.aiReasoning,
      });

      res.json(prediction);
    } catch (error) {
      console.error("Error in lease renewal prediction:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ 
        message: "Failed to predict lease renewal", 
        details: errorMessage,
        leaseId: req.params.id 
      });
    }
  });

  app.get('/api/leases/:id/renewal-prediction', isAuthenticated, async (req: any, res) => {
    try {
      const lease = await storage.getLease(req.params.id);
      if (!lease) {
        return res.status(404).json({ message: "Lease not found" });
      }

      const user = req.user;
      if (user.role === 'tenant' && lease.tenantId !== user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      const prediction = await storage.getLeaseRenewalPrediction(req.params.id);
      res.json(prediction || null);
    } catch (error) {
      console.error("Error fetching renewal prediction:", error);
      res.status(500).json({ message: "Failed to fetch renewal prediction" });
    }
  });

  // Unit Inspection routes (Move-in/out AI)
  app.post('/api/inspections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = req.user;
      const validatedData = insertUnitInspectionSchema.parse({ ...req.body, inspectorId: userId });
      
      const unit = await storage.getUnit(validatedData.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }

      const property = await storage.getProperty(unit.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (user.role === 'landlord' && property.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied - not your property" });
      }

      if (user.role === 'property_manager' && property.managerId !== userId && property.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied - you are not assigned to manage this property" });
      }

      if (validatedData.leaseId) {
        const lease = await storage.getLease(validatedData.leaseId);
        if (!lease) {
          return res.status(400).json({ message: "Invalid leaseId - lease not found" });
        }
        if (lease.unitId !== validatedData.unitId) {
          return res.status(400).json({ message: "Lease does not match unit" });
        }
        if (user.role === 'tenant' && lease.tenantId !== userId) {
          return res.status(403).json({ message: "Access denied - not your lease" });
        }
      }

      const inspection = await storage.createUnitInspection(validatedData);
      res.json(inspection);
    } catch (error) {
      console.error("Error creating inspection:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to create inspection", details: errorMessage });
    }
  });

  app.get('/api/inspections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const inspection = await storage.getUnitInspection(req.params.id);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }

      const unit = await storage.getUnit(inspection.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }

      const property = await storage.getProperty(unit.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      const userId = req.user.claims.sub;
      if (req.user.role === 'property_manager' && property.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(inspection);
    } catch (error) {
      console.error("Error fetching inspection:", error);
      res.status(500).json({ message: "Failed to fetch inspection" });
    }
  });

  app.get('/api/inspections', isAuthenticated, async (req: any, res) => {
    try {
      const { unitId, inspectionType, leaseId } = req.query;
      const user = req.user;
      const userId = user.claims.sub;
      
      let inspections = await storage.getUnitInspections({
        unitId: unitId as string,
        inspectionType: inspectionType as string,
        leaseId: leaseId as string,
      });

      if (user.role === 'tenant') {
        const filteredInspections = [];
        for (const inspection of inspections) {
          if (inspection.leaseId) {
            const lease = await storage.getLease(inspection.leaseId);
            if (lease && lease.tenantId === userId) {
              filteredInspections.push(inspection);
            }
          }
        }
        inspections = filteredInspections;
      } else if (user.role === 'landlord') {
        const filteredInspections = [];
        for (const inspection of inspections) {
          const unit = await storage.getUnit(inspection.unitId);
          if (unit) {
            const property = await storage.getProperty(unit.propertyId);
            if (property && property.ownerId === userId) {
              filteredInspections.push(inspection);
            }
          }
        }
        inspections = filteredInspections;
      }

      res.json(inspections);
    } catch (error) {
      console.error("Error fetching inspections:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to fetch inspections", details: errorMessage });
    }
  });

  app.post('/api/inspections/:id/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const inspection = await storage.getUnitInspection(req.params.id);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }

      const unit = await storage.getUnit(inspection.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }

      const property = await storage.getProperty(unit.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      const user = req.user;
      const userId = user.claims.sub;

      if (user.role === 'landlord' && property.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied - not your property" });
      }

      if (inspection.aiAnalysisComplete && !req.body.force) {
        return res.json(inspection);
      }

      if (!inspection.photoUrls || inspection.photoUrls.length === 0) {
        return res.status(400).json({ message: "No photos to analyze" });
      }

      let moveInPhotos: string[] | undefined;
      if (inspection.inspectionType === 'move_out' && inspection.leaseId) {
        const moveInInspections = await storage.getUnitInspections({
          unitId: inspection.unitId,
          inspectionType: 'move_in',
          leaseId: inspection.leaseId,
        });
        
        if (moveInInspections.length > 0) {
          const baselineInspection = moveInInspections[0];
          const baselineUnit = await storage.getUnit(baselineInspection.unitId);
          if (baselineUnit && baselineUnit.propertyId === unit.propertyId) {
            moveInPhotos = baselineInspection.photoUrls;
          } else {
            return res.status(400).json({ message: "Baseline inspection does not match property" });
          }
        }
      }

      const { analyzeMoveInOutPhotos } = await import('./services/openaiService.js');
      const aiResult = await analyzeMoveInOutPhotos(
        inspection.photoUrls,
        inspection.inspectionType as 'move_in' | 'move_out',
        moveInPhotos
      );

      if (!aiResult) {
        return res.status(503).json({ 
          message: "AI analysis service unavailable", 
          details: "OPENAI_API_KEY not configured or API call failed",
          inspectionId: inspection.id 
        });
      }

      const updatedInspection = await storage.updateUnitInspection(inspection.id, {
        aiAnalysisComplete: true,
        aiAnalysisData: aiResult as any,
        estimatedDamageCost: aiResult.totalEstimatedCost.toString(),
      });

      res.json(updatedInspection);
    } catch (error) {
      console.error("Error analyzing inspection photos:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ 
        message: "Failed to analyze inspection photos", 
        details: errorMessage,
        inspectionId: req.params.id 
      });
    }
  });

  // Audit log routes
  app.post('/api/audit-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertAuditLogSchema.parse({ ...req.body, userId });
      const log = await storage.createAuditLog(validatedData);
      res.json(log);
    } catch (error) {
      console.error("Error creating audit log:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create audit log" });
    }
  });

  app.get('/api/audit-logs', isAuthenticated, async (req: any, res) => {
    try {
      const { entityType, entityId, userId } = req.query;
      const logs = await storage.getAuditLogs({
        entityType: entityType as string,
        entityId: entityId as string,
        userId: userId as string,
      });
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // E-signature log routes
  app.post('/api/e-signature-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertESignatureLogSchema.parse({ 
        ...req.body, 
        signedBy: userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      const log = await storage.createESignatureLog(validatedData);
      res.json(log);
    } catch (error) {
      console.error("Error creating e-signature log:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create e-signature log" });
    }
  });

  app.get('/api/e-signature-logs/lease/:leaseId', isAuthenticated, async (req: any, res) => {
    try {
      const logs = await storage.getESignatureLogsByLease(req.params.leaseId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching e-signature logs:", error);
      res.status(500).json({ message: "Failed to fetch e-signature logs" });
    }
  });

  // SMS webhook receiver (for two-way communication)
  // Vendor bid routes
  app.post('/api/vendor-bids', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ message: "Only vendors can create bids" });
      }

      const validatedData = insertVendorBidSchema.omit({ vendorId: true }).parse(req.body);
      const bid = await storage.createVendorBid({
        ...validatedData,
        vendorId: userId,
      });
      res.status(201).json(bid);
    } catch (error) {
      console.error("Error creating vendor bid:", error);
      res.status(500).json({ message: "Failed to create vendor bid" });
    }
  });

  app.get('/api/vendor-bids', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const filters: any = {};
      
      if (user.role === 'vendor') {
        filters.vendorId = userId;
      }
      
      if (req.query.jobId) filters.jobId = req.query.jobId;
      if (req.query.jobType) filters.jobType = req.query.jobType;
      if (req.query.status) filters.status = req.query.status;

      const bids = await storage.getVendorBids(filters);
      res.json(bids);
    } catch (error) {
      console.error("Error fetching vendor bids:", error);
      res.status(500).json({ message: "Failed to fetch vendor bids" });
    }
  });

  app.patch('/api/vendor-bids/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const bid = await storage.getVendorBid(req.params.id);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }

      if (user.role === 'vendor' && bid.vendorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updated = await storage.updateVendorBid(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating vendor bid:", error);
      res.status(500).json({ message: "Failed to update vendor bid" });
    }
  });

  // Property Vendor Assignment routes
  app.post('/api/property-vendor-assignments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'property_manager' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Only property managers can assign vendors" });
      }

      const validatedData = insertPropertyVendorAssignmentSchema.parse(req.body);
      const assignment = await storage.createPropertyVendorAssignment(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating property-vendor assignment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create property-vendor assignment" });
    }
  });

  app.get('/api/property-vendor-assignments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'property_manager' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Only property managers can view assignments" });
      }

      const assignments = await storage.getAllPropertyVendorAssignments();
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching all property-vendor assignments:", error);
      res.status(500).json({ message: "Failed to fetch property-vendor assignments" });
    }
  });

  app.get('/api/property-vendor-assignments/:propertyId', isAuthenticated, async (req: any, res) => {
    try {
      const assignments = await storage.getPropertyVendorAssignments(req.params.propertyId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching property-vendor assignments:", error);
      res.status(500).json({ message: "Failed to fetch property-vendor assignments" });
    }
  });

  app.delete('/api/property-vendor-assignments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'property_manager' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Only property managers can remove vendor assignments" });
      }

      await storage.deletePropertyVendorAssignment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting property-vendor assignment:", error);
      res.status(500).json({ message: "Failed to delete property-vendor assignment" });
    }
  });

  // Vendor Document routes
  app.post('/api/vendor-documents', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'property_manager' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Only property managers can upload vendor documents" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { vendorId, documentType } = req.body;
      if (!vendorId) {
        return res.status(400).json({ message: "Vendor ID is required" });
      }

      const { ObjectStorageService } = await import('./objectStorage.js');
      const objectStorageService = new ObjectStorageService();
      const { objectStorageClient } = await import('./objectStorage.js');

      const filename = `vendor-docs/${vendorId}/${Date.now()}-${req.file.originalname}`;
      const objectName = `.private/${filename}`;
      
      const bucket = objectStorageClient.bucket('repl-default-bucket-' + process.env.REPL_ID);
      const file = bucket.file(objectName);

      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        metadata: {
          uploadedBy: userId,
          originalName: req.file.originalname,
          vendorId,
        },
      });

      const document = await storage.createVendorDocument({
        vendorId,
        fileName: req.file.originalname,
        fileUrl: `/objects/${filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        documentType: documentType || 'general',
        uploadedBy: userId,
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading vendor document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.get('/api/vendor-documents/:vendorId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (user.role === 'vendor' && userId !== req.params.vendorId) {
        return res.status(403).json({ message: "Vendors can only view their own documents" });
      }

      if (user.role !== 'property_manager' && user.role !== 'admin' && user.role !== 'vendor') {
        return res.status(403).json({ message: "Unauthorized to view vendor documents" });
      }

      const documents = await storage.getVendorDocuments(req.params.vendorId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching vendor documents:", error);
      res.status(500).json({ message: "Failed to fetch vendor documents" });
    }
  });

  app.delete('/api/vendor-documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'property_manager' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Only property managers can delete vendor documents" });
      }

      const document = await storage.getVendorDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const { objectStorageClient } = await import('./objectStorage.js');
      const bucket = objectStorageClient.bucket('repl-default-bucket-' + process.env.REPL_ID);
      
      const filePath = document.fileUrl.replace('/objects/', '');
      const objectName = `.private/${filePath}`;
      const file = bucket.file(objectName);
      
      try {
        await file.delete();
      } catch (storageError) {
        console.error("Error deleting file from storage:", storageError);
      }

      await storage.deleteVendorDocument(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vendor document:", error);
      res.status(500).json({ message: "Failed to delete vendor document" });
    }
  });

  // Upload bid attachment
  app.post('/api/bid-attachments/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ message: "Only vendors can upload bid attachments" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { objectStorageClient } = await import('./objectStorage.js');
      const filename = `bid-attachments/${userId}/${Date.now()}-${req.file.originalname}`;
      const objectName = `.private/${filename}`;
      
      const bucket = objectStorageClient.bucket('repl-default-bucket-' + process.env.REPL_ID);
      const file = bucket.file(objectName);

      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        metadata: {
          uploadedBy: userId,
          originalName: req.file.originalname,
        },
      });

      const fileUrl = `/objects/${filename}`;
      res.status(201).json({ 
        fileName: req.file.originalname,
        fileUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });
    } catch (error) {
      console.error("Error uploading bid attachment:", error);
      res.status(500).json({ message: "Failed to upload bid attachment" });
    }
  });

  // Upload work completion photo
  app.post('/api/work-completion-photos/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ message: "Only vendors can upload work completion photos" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { objectStorageClient } = await import('./objectStorage.js');
      const filename = `work-completion/${userId}/${Date.now()}-${req.file.originalname}`;
      const objectName = `.private/${filename}`;
      
      const bucket = objectStorageClient.bucket('repl-default-bucket-' + process.env.REPL_ID);
      const file = bucket.file(objectName);

      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        metadata: {
          uploadedBy: userId,
          originalName: req.file.originalname,
        },
      });

      const fileUrl = `/objects/${filename}`;
      res.status(201).json({ 
        fileName: req.file.originalname,
        fileUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });
    } catch (error) {
      console.error("Error uploading work completion photo:", error);
      res.status(500).json({ message: "Failed to upload work completion photo" });
    }
  });

  // Get all vendors (for property managers)
  app.get('/api/vendors', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'property_manager' && user.role !== 'admin' && user.role !== 'landlord')) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const vendors = await storage.getUsersByRole('vendor');
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  // Object storage routes for vendor bid attachments
  // Referenced from blueprint: javascript_object_storage
  app.post('/api/objects/upload', isAuthenticated, async (req: any, res) => {
    try {
      const { ObjectStorageService } = await import('./objectStorage.js');
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  app.get('/objects/:objectPath(*)', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { ObjectStorageService, ObjectNotFoundError } = await import('./objectStorage.js');
      const { ObjectPermission } = await import('./objectAcl.js');
      const objectStorageService = new ObjectStorageService();
      
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.sendStatus(403);
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error: any) {
      console.error("Error serving object:", error);
      const { ObjectNotFoundError } = await import('./objectStorage.js');
      if (error instanceof ObjectNotFoundError || error.name === 'ObjectNotFoundError') {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.patch('/api/vendor-bids/:id/attachments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ message: "Only vendors can update bid attachments" });
      }

      const bid = await storage.getVendorBid(req.params.id);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }

      if (bid.vendorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { attachmentUrls } = req.body;
      if (!Array.isArray(attachmentUrls)) {
        return res.status(400).json({ message: "attachmentUrls must be an array" });
      }

      const { ObjectStorageService } = await import('./objectStorage.js');
      const objectStorageService = new ObjectStorageService();
      
      const normalizedUrls = await Promise.all(
        attachmentUrls.map(async (url: string) => {
          const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(url, {
            owner: userId,
            visibility: "public",
          });
          return normalizedPath;
        })
      );

      const updated = await storage.updateVendorBid(req.params.id, {
        attachmentUrls: normalizedUrls,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating bid attachments:", error);
      res.status(500).json({ message: "Failed to update bid attachments" });
    }
  });

  // Work completion docs routes
  app.post('/api/work-completion-docs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ message: "Only vendors can submit work completion docs" });
      }

      const validatedData = insertWorkCompletionDocSchema.omit({ vendorId: true }).parse(req.body);
      const doc = await storage.createWorkCompletionDoc({
        ...validatedData,
        vendorId: userId,
      });
      res.status(201).json(doc);
    } catch (error) {
      console.error("Error creating work completion doc:", error);
      res.status(500).json({ message: "Failed to create work completion doc" });
    }
  });

  app.get('/api/work-completion-docs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const filters: any = {};
      
      if (user.role === 'vendor') {
        filters.vendorId = userId;
      }
      
      if (req.query.jobId) filters.jobId = req.query.jobId;
      if (req.query.jobType) filters.jobType = req.query.jobType;

      const docs = await storage.getWorkCompletionDocs(filters);
      res.json(docs);
    } catch (error) {
      console.error("Error fetching work completion docs:", error);
      res.status(500).json({ message: "Failed to fetch work completion docs" });
    }
  });

  // Vendor job listings (maintenance + turn tasks combined)
  app.get('/api/vendor-jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ message: "Only vendors can view job listings" });
      }

      const assignedMaintenanceJobs = await storage.getMaintenanceRequests({ assignedToId: userId });
      const assignedTurnJobs = await storage.getTurnTasks({ assignedToId: userId });
      
      const openMaintenanceJobs = await storage.getMaintenanceRequests({ status: 'open' });
      const pendingTurnJobs = await storage.getTurnTasks({ status: 'pending' });
      
      const jobs = [
        ...assignedMaintenanceJobs.map(j => ({ ...j, jobType: 'maintenance' })),
        ...assignedTurnJobs.map(j => ({ ...j, jobType: 'turn_task' })),
        ...openMaintenanceJobs.filter(j => !j.assignedToId).map(j => ({ ...j, jobType: 'maintenance' })),
        ...pendingTurnJobs.filter(j => !j.assignedToId).map(j => ({ ...j, jobType: 'turn_task' }))
      ];

      res.json(jobs);
    } catch (error) {
      console.error("Error fetching vendor jobs:", error);
      res.status(500).json({ message: "Failed to fetch vendor jobs" });
    }
  });

  // Vendor payment request routes
  app.post('/api/vendor-payment-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ message: "Only vendors can create payment requests" });
      }

      const validatedData = insertVendorPaymentRequestSchema.omit({ vendorId: true }).parse(req.body);
      const request = await storage.createVendorPaymentRequest({
        ...validatedData,
        vendorId: userId,
      });
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating vendor payment request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create payment request" });
    }
  });

  app.get('/api/vendor-payment-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const filters: any = {};
      
      if (user.role === 'vendor') {
        filters.vendorId = userId;
      } else if (user.role === 'property_manager' || user.role === 'landlord' || user.role === 'admin') {
        if (req.query.vendorId) filters.vendorId = req.query.vendorId;
      } else {
        return res.status(403).json({ message: "Unauthorized to view payment requests" });
      }
      
      if (req.query.status) filters.status = req.query.status;
      if (req.query.jobType) filters.jobType = req.query.jobType;

      const requests = await storage.getVendorPaymentRequests(filters);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching vendor payment requests:", error);
      res.status(500).json({ message: "Failed to fetch payment requests" });
    }
  });

  app.patch('/api/vendor-payment-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const request = await storage.getVendorPaymentRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Payment request not found" });
      }

      if (user.role === 'vendor' && request.vendorId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this request" });
      }

      if ((user.role === 'property_manager' || user.role === 'landlord' || user.role === 'admin') && req.body.status === 'approved') {
        req.body.approvedBy = userId;
        req.body.approvedAt = new Date();
      }

      const validatedData = insertVendorPaymentRequestSchema.partial().parse(req.body);
      const updated = await storage.updateVendorPaymentRequest(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating vendor payment request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update payment request" });
    }
  });

  // Vendor payment routes
  app.post('/api/vendor-payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'property_manager' && user.role !== 'landlord' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Only property managers, landlords, and admins can create vendor payments" });
      }

      const validatedData = insertVendorPaymentSchema.parse(req.body);
      const payment = await storage.createVendorPayment(validatedData);

      if (validatedData.paymentRequestId) {
        await storage.updateVendorPaymentRequest(validatedData.paymentRequestId, {
          status: 'paid',
          paidAt: new Date(),
        });
      }

      await storage.createVendorTransaction({
        vendorId: validatedData.vendorId,
        type: 'payment',
        amount: validatedData.amount,
        description: validatedData.description || 'Payment received',
        vendorPaymentId: payment.id,
        vendorPaymentRequestId: validatedData.paymentRequestId || undefined,
        date: new Date().toISOString().split('T')[0],
      });

      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating vendor payment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.get('/api/vendor-payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const filters: any = {};
      
      if (user.role === 'vendor') {
        filters.vendorId = userId;
      } else if (user.role === 'property_manager' || user.role === 'landlord' || user.role === 'admin') {
        if (req.query.vendorId) filters.vendorId = req.query.vendorId;
      } else {
        return res.status(403).json({ message: "Unauthorized to view payments" });
      }
      
      if (req.query.status) filters.status = req.query.status;

      const payments = await storage.getVendorPayments(filters);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching vendor payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Vendor transaction routes
  app.get('/api/vendor-transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const filters: any = {};
      
      if (user.role === 'vendor') {
        filters.vendorId = userId;
      } else if (user.role === 'property_manager' || user.role === 'landlord' || user.role === 'admin') {
        if (req.query.vendorId) filters.vendorId = req.query.vendorId;
      } else {
        return res.status(403).json({ message: "Unauthorized to view transactions" });
      }
      
      if (req.query.type) filters.type = req.query.type;

      const transactions = await storage.getVendorTransactions(filters);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching vendor transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Vendor-specific Stripe Connect routes
  app.post('/api/vendor/stripe/connect/account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ message: "Only vendors can connect Stripe accounts" });
      }

      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      if (user.stripeAccountId) {
        return res.json({ accountId: user.stripeAccountId });
      }

      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email || undefined,
        capabilities: {
          transfers: { requested: true },
        },
      });

      await storage.updateUser(userId, {
        stripeAccountId: account.id,
      });

      res.json({ accountId: account.id });
    } catch (error) {
      console.error("Error creating vendor Stripe Connect account:", error);
      res.status(500).json({ message: "Failed to create Stripe account" });
    }
  });

  app.post('/api/vendor/stripe/connect/onboarding-link', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ message: "Only vendors can create onboarding links" });
      }

      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      if (!user.stripeAccountId) {
        const account = await stripe.accounts.create({
          type: 'express',
          email: user.email || undefined,
          capabilities: {
            transfers: { requested: true },
          },
        });

        await storage.updateUser(userId, {
          stripeAccountId: account.id,
        });

        user = await storage.getUser(userId);
      }

      const baseUrl = process.env.REPL_SLUG 
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
        : 'http://localhost:5000';

      const accountLink = await stripe.accountLinks.create({
        account: user!.stripeAccountId!,
        refresh_url: `${baseUrl}/vendor/finance`,
        return_url: `${baseUrl}/vendor/finance`,
        type: 'account_onboarding',
      });

      res.json({ url: accountLink.url });
    } catch (error) {
      console.error("Error creating vendor onboarding link:", error);
      res.status(500).json({ message: "Failed to create onboarding link" });
    }
  });

  app.get('/api/vendor/stripe/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ message: "Only vendors can check balance" });
      }

      if (!user.stripeAccountId) {
        return res.status(400).json({ message: "No Stripe account connected" });
      }

      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const balance = await stripe.balance.retrieve({
        stripeAccount: user.stripeAccountId,
      });

      res.json({
        available: balance.available,
        pending: balance.pending,
      });
    } catch (error) {
      console.error("Error fetching vendor balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  app.post('/api/vendor/payouts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ message: "Only vendors can request payouts" });
      }

      if (!user.stripeAccountId || !user.stripeOnboardingComplete) {
        return res.status(400).json({ message: "Stripe account not set up" });
      }

      const { amount, description } = req.body;

      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const payout = await stripe.payouts.create(
        {
          amount: Math.round(amount * 100),
          currency: 'usd',
          description: description || 'Payout from PropertyFlows',
          method: 'instant',
        },
        {
          stripeAccount: user.stripeAccountId,
        }
      );

      const paymentRecord = await storage.createVendorPayment({
        vendorId: userId,
        amount: amount.toString(),
        currency: 'usd',
        status: 'processing',
        stripePayoutId: payout.id,
        description,
        arrivalDate: new Date(payout.arrival_date * 1000),
      });

      await storage.createVendorTransaction({
        vendorId: userId,
        type: 'payment',
        amount: `-${amount}`,
        description: `Payout: ${description || 'Vendor payout'}`,
        vendorPaymentId: paymentRecord.id,
        date: new Date().toISOString().split('T')[0],
      });

      res.json(paymentRecord);
    } catch (error: any) {
      console.error("Error creating vendor payout:", error);
      const failureReason = error.message || 'Unknown error';
      res.status(500).json({ message: failureReason });
    }
  });

  // Vendor QuickBooks Integration Routes
  app.get('/api/vendor/quickbooks/auth-url', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ message: "Only vendors can connect QuickBooks" });
      }

      const { getQuickBooksAuthUrl } = await import('./services/quickbooksService.js');
      const { randomBytes } = await import('crypto');
      
      const nonce = randomBytes(32).toString('hex');
      const expiresAt = Date.now() + (15 * 60 * 1000);
      
      qbOAuthNonces.set(nonce, { userId, expiresAt });
      
      const authUrl = getQuickBooksAuthUrl(req, nonce);
      
      if (!authUrl) {
        return res.status(500).json({ message: "QuickBooks credentials not configured" });
      }

      res.json({ url: authUrl });
    } catch (error) {
      console.error("Error generating vendor QuickBooks auth URL:", error);
      res.status(500).json({ message: "Failed to generate authorization URL" });
    }
  });

  app.get('/api/vendor/quickbooks/callback', async (req: any, res) => {
    try {
      const { code, state, realmId } = req.query;
      
      if (!code || !state || !realmId) {
        return res.redirect('/vendor-portal/settings?error=quickbooks_auth_failed');
      }

      const nonceData = qbOAuthNonces.get(state as string);
      if (!nonceData) {
        return res.redirect('/vendor-portal/settings?error=quickbooks_auth_expired');
      }
      
      if (nonceData.expiresAt < Date.now()) {
        qbOAuthNonces.delete(state as string);
        return res.redirect('/vendor-portal/settings?error=quickbooks_auth_expired');
      }
      
      const userId = nonceData.userId;
      qbOAuthNonces.delete(state as string);

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'vendor') {
        return res.redirect('/vendor-portal/settings?error=quickbooks_auth_failed');
      }

      const { exchangeAuthCode } = await import('./services/quickbooksService.js');
      const tokens = await exchangeAuthCode(req, code as string);
      
      if (!tokens) {
        return res.redirect('/vendor-portal/settings?error=quickbooks_auth_failed');
      }

      const existingConnection = await storage.getQuickBooksConnection(userId);
      if (existingConnection) {
        await storage.deleteQuickBooksConnection(existingConnection.id);
      }

      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
      
      await storage.createQuickBooksConnection({
        userId,
        realmId: realmId as string,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      });

      res.redirect('/vendor-portal/settings?success=quickbooks_connected');
    } catch (error) {
      console.error("Error in vendor QuickBooks callback:", error);
      res.redirect('/vendor-portal/settings?error=quickbooks_auth_failed');
    }
  });

  app.get('/api/vendor/quickbooks/connection', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ message: "Only vendors can check QuickBooks connection" });
      }

      const connection = await storage.getQuickBooksConnection(userId);
      
      if (!connection) {
        return res.json({ connected: false });
      }

      res.json({
        connected: true,
        companyName: connection.companyName,
        lastSynced: connection.updatedAt,
      });
    } catch (error) {
      console.error("Error fetching vendor QuickBooks connection:", error);
      res.status(500).json({ message: "Failed to fetch connection status" });
    }
  });

  app.delete('/api/vendor/quickbooks/connection', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ message: "Only vendors can disconnect QuickBooks" });
      }

      const connection = await storage.getQuickBooksConnection(userId);
      
      if (!connection) {
        return res.status(404).json({ message: "No QuickBooks connection found" });
      }

      await storage.deleteQuickBooksConnection(connection.id);

      res.json({ message: "QuickBooks disconnected successfully" });
    } catch (error) {
      console.error("Error disconnecting vendor QuickBooks:", error);
      res.status(500).json({ message: "Failed to disconnect QuickBooks" });
    }
  });

  app.post('/api/vendor/quickbooks/sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'vendor') {
        return res.status(403).json({ message: "Only vendors can sync to QuickBooks" });
      }

      const connection = await storage.getQuickBooksConnection(userId);
      
      if (!connection) {
        return res.status(404).json({ message: "QuickBooks not connected" });
      }

      const transactions = await storage.getVendorTransactionsByVendorId(userId);
      
      const { syncTransactionsToQuickBooks } = await import('./services/quickbooksService.js');
      const syncResults = await syncTransactionsToQuickBooks(req, connection, transactions);

      res.json({
        message: "Transactions synced successfully",
        synced: syncResults.synced,
        failed: syncResults.failed,
        total: transactions.length,
      });
    } catch (error) {
      console.error("Error syncing vendor transactions to QuickBooks:", error);
      res.status(500).json({ message: "Failed to sync transactions" });
    }
  });

  // Stripe Connect & Payout routes (for landlords)
  app.post('/api/stripe/connect/account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'landlord') {
        return res.status(403).json({ message: "Only landlords can connect Stripe accounts" });
      }

      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      if (user.stripeAccountId) {
        return res.json({ accountId: user.stripeAccountId });
      }

      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email || undefined,
        capabilities: {
          transfers: { requested: true },
        },
      });

      await storage.updateUser(userId, {
        stripeAccountId: account.id,
      });

      res.json({ accountId: account.id });
    } catch (error) {
      console.error("Error creating Stripe Connect account:", error);
      res.status(500).json({ message: "Failed to create Stripe account" });
    }
  });

  app.post('/api/stripe/connect/onboarding-link', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      if (!user.stripeAccountId) {
        const account = await stripe.accounts.create({
          type: 'express',
          email: user.email || undefined,
          capabilities: {
            transfers: { requested: true },
          },
        });

        user = await storage.updateUser(userId, {
          stripeAccountId: account.id,
        });
      }

      const returnUrl = `${req.protocol}://${req.get('host')}/payouts`;
      const refreshUrl = `${req.protocol}://${req.get('host')}/payouts`;

      const accountLink = await stripe.accountLinks.create({
        account: user.stripeAccountId!,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      res.json({ url: accountLink.url });
    } catch (error) {
      console.error("Error creating onboarding link:", error);
      res.status(500).json({ message: "Failed to create onboarding link" });
    }
  });

  app.get('/api/stripe/account/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeAccountId) {
        return res.json({ connected: false, onboardingComplete: false });
      }

      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const account = await stripe.accounts.retrieve(user.stripeAccountId);
      const onboardingComplete = account.details_submitted && account.charges_enabled;

      if (onboardingComplete && !user.stripeOnboardingComplete) {
        await storage.updateUser(userId, {
          stripeOnboardingComplete: true,
        });
      }

      res.json({
        connected: true,
        onboardingComplete,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      });
    } catch (error) {
      console.error("Error fetching account status:", error);
      res.status(500).json({ message: "Failed to fetch account status" });
    }
  });

  app.get('/api/stripe/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeAccountId) {
        return res.status(400).json({ message: "No Stripe account connected" });
      }

      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const balance = await stripe.balance.retrieve({
        stripeAccount: user.stripeAccountId,
      });

      res.json({
        available: balance.available,
        pending: balance.pending,
      });
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  app.post('/api/payouts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'landlord') {
        return res.status(403).json({ message: "Only landlords can request payouts" });
      }

      if (!user.stripeAccountId || !user.stripeOnboardingComplete) {
        return res.status(400).json({ message: "Stripe account not set up" });
      }

      const { amount, description } = req.body;

      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const payout = await stripe.payouts.create(
        {
          amount: Math.round(amount * 100),
          currency: 'usd',
          description: description || 'Payout from PropertyFlows',
          method: 'instant',
        },
        {
          stripeAccount: user.stripeAccountId,
        }
      );

      const payoutRecord = await storage.createPayout({
        landlordId: userId,
        amount: amount.toString(),
        currency: 'usd',
        status: 'processing',
        stripePayoutId: payout.id,
        description,
        arrivalDate: new Date(payout.arrival_date * 1000),
      });

      res.json(payoutRecord);
    } catch (error: any) {
      console.error("Error creating payout:", error);
      
      const failureReason = error.message || 'Unknown error';
      res.status(500).json({ message: failureReason });
    }
  });

  app.get('/api/payouts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const payouts = await storage.getPayouts({
        landlordId: userId,
      });

      res.json(payouts);
    } catch (error) {
      console.error("Error fetching payouts:", error);
      res.status(500).json({ message: "Failed to fetch payouts" });
    }
  });

  // QuickBooks Integration routes
  const qbOAuthNonces = new Map<string, { userId: string; expiresAt: number }>();
  
  setInterval(() => {
    const now = Date.now();
    for (const [nonce, data] of qbOAuthNonces.entries()) {
      if (data.expiresAt < now) {
        qbOAuthNonces.delete(nonce);
      }
    }
  }, 60000);
  
  app.get('/api/quickbooks/auth-url', isAuthenticated, async (req: any, res) => {
    try {
      const { getQuickBooksAuthUrl } = await import('./services/quickbooksService.js');
      const { randomBytes } = await import('crypto');
      
      const userId = req.user.claims.sub;
      const nonce = randomBytes(32).toString('hex');
      const expiresAt = Date.now() + (15 * 60 * 1000);
      
      qbOAuthNonces.set(nonce, { userId, expiresAt });
      
      const authUrl = getQuickBooksAuthUrl(req, nonce);
      
      if (!authUrl) {
        return res.status(500).json({ message: "QuickBooks credentials not configured" });
      }

      res.json({ url: authUrl });
    } catch (error) {
      console.error("Error generating QuickBooks auth URL:", error);
      res.status(500).json({ message: "Failed to generate authorization URL" });
    }
  });

  app.get('/api/quickbooks/callback', async (req: any, res) => {
    try {
      const { code, state, realmId } = req.query;
      
      if (!code || !state || !realmId) {
        return res.redirect('/settings?error=quickbooks_auth_failed');
      }

      const nonceData = qbOAuthNonces.get(state as string);
      if (!nonceData) {
        return res.redirect('/settings?error=quickbooks_auth_expired');
      }
      
      if (nonceData.expiresAt < Date.now()) {
        qbOAuthNonces.delete(state as string);
        return res.redirect('/settings?error=quickbooks_auth_expired');
      }
      
      const userId = nonceData.userId;
      qbOAuthNonces.delete(state as string);

      const { exchangeAuthCode } = await import('./services/quickbooksService.js');
      const tokens = await exchangeAuthCode(req, code as string);
      
      if (!tokens) {
        return res.redirect('/settings?error=quickbooks_auth_failed');
      }

      const existingConnection = await storage.getQuickBooksConnection(userId);
      if (existingConnection) {
        await storage.deleteQuickBooksConnection(existingConnection.id);
      }

      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
      
      await storage.createQuickBooksConnection({
        userId,
        realmId: realmId as string,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      });

      res.redirect('/settings?success=quickbooks_connected');
    } catch (error) {
      console.error("Error in QuickBooks callback:", error);
      res.redirect('/settings?error=quickbooks_auth_failed');
    }
  });

  app.get('/api/quickbooks/connection', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connection = await storage.getQuickBooksConnection(userId);
      
      if (!connection) {
        return res.json({ connected: false });
      }

      res.json({
        connected: true,
        companyName: connection.companyName,
        lastSynced: connection.updatedAt,
      });
    } catch (error) {
      console.error("Error fetching QuickBooks connection:", error);
      res.status(500).json({ message: "Failed to fetch connection status" });
    }
  });

  app.delete('/api/quickbooks/connection', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connection = await storage.getQuickBooksConnection(userId);
      
      if (!connection) {
        return res.status(404).json({ message: "No QuickBooks connection found" });
      }

      await storage.deleteQuickBooksConnection(connection.id);
      res.json({ message: "QuickBooks disconnected successfully" });
    } catch (error) {
      console.error("Error disconnecting QuickBooks:", error);
      res.status(500).json({ message: "Failed to disconnect QuickBooks" });
    }
  });

  app.get('/api/quickbooks/accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connection = await storage.getQuickBooksConnection(userId);
      
      if (!connection) {
        return res.status(404).json({ message: "QuickBooks not connected" });
      }

      const { getChartOfAccounts } = await import('./services/quickbooksService.js');
      const accounts = await getChartOfAccounts(connection.accessToken, connection.realmId);
      
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching QuickBooks accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.post('/api/quickbooks/sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connection = await storage.getQuickBooksConnection(userId);
      
      if (!connection) {
        return res.status(404).json({ message: "QuickBooks not connected" });
      }

      const { startDate, endDate, accountMappings } = req.body;
      
      const transactionsToSync = await storage.getTransactions({
        startDate,
        endDate,
      });

      const { batchSyncTransactions } = await import('./services/quickbooksService.js');
      
      const mappedTransactions = transactionsToSync.map(t => ({
        date: new Date(t.date).toISOString().split('T')[0],
        type: t.type as 'income' | 'expense',
        category: t.category,
        description: t.description || '',
        amount: parseFloat(t.amount),
        accountId: accountMappings[t.category] || '1',
      }));

      const result = await batchSyncTransactions(
        connection.accessToken,
        connection.realmId,
        mappedTransactions
      );

      await storage.updateQuickBooksConnection(connection.id, {
        isActive: true,
      });

      res.json({
        success: result.success,
        failed: result.failed,
        total: transactionsToSync.length,
      });
    } catch (error) {
      console.error("Error syncing to QuickBooks:", error);
      res.status(500).json({ message: "Failed to sync transactions" });
    }
  });

  app.post('/api/quickbooks/account-mappings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connection = await storage.getQuickBooksConnection(userId);
      
      if (!connection) {
        return res.status(404).json({ message: "QuickBooks not connected" });
      }

      const { mappings } = req.body;
      
      for (const mapping of mappings) {
        await storage.createQuickBooksAccountMapping({
          connectionId: connection.id,
          propertyFlowsCategory: mapping.category,
          quickbooksAccountId: mapping.accountId,
          quickbooksAccountName: mapping.accountName,
        });
      }

      res.json({ message: "Account mappings saved" });
    } catch (error) {
      console.error("Error saving account mappings:", error);
      res.status(500).json({ message: "Failed to save mappings" });
    }
  });

  app.get('/api/quickbooks/account-mappings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connection = await storage.getQuickBooksConnection(userId);
      
      if (!connection) {
        return res.status(404).json({ message: "QuickBooks not connected" });
      }

      const mappings = await storage.getQuickBooksAccountMappings(connection.id);
      res.json(mappings);
    } catch (error) {
      console.error("Error fetching account mappings:", error);
      res.status(500).json({ message: "Failed to fetch mappings" });
    }
  });

  // Tenant Marketplace routes
  app.get('/api/marketplace/units', async (req: any, res) => {
    try {
      const { minRent, maxRent, bedrooms, bathrooms, city, state } = req.query;

      const allUnits = await storage.getAllUnits();
      let filteredUnits = allUnits.filter(u => u.status === 'vacant');
      
      if (minRent) {
        const min = parseFloat(minRent);
        filteredUnits = filteredUnits.filter(u => u.monthlyRent >= min);
      }
      
      if (maxRent) {
        const max = parseFloat(maxRent);
        filteredUnits = filteredUnits.filter(u => u.monthlyRent <= max);
      }
      
      if (bedrooms && bedrooms !== 'any') {
        const bedroomFilter = parseInt(bedrooms);
        if (bedroomFilter === 4) {
          filteredUnits = filteredUnits.filter(u => u.bedrooms >= 4);
        } else {
          filteredUnits = filteredUnits.filter(u => u.bedrooms === bedroomFilter);
        }
      }
      
      if (bathrooms && bathrooms !== 'any') {
        const bathroomFilter = parseInt(bathrooms);
        if (bathroomFilter === 3) {
          filteredUnits = filteredUnits.filter(u => u.bathrooms >= 3);
        } else {
          filteredUnits = filteredUnits.filter(u => u.bathrooms === bathroomFilter);
        }
      }

      let unitsWithProperties = await Promise.all(
        filteredUnits.map(async (unit: Unit) => {
          const property = await storage.getProperty(unit.propertyId);
          return {
            ...unit,
            property,
          };
        })
      );

      if (city) {
        const cityLower = city.toLowerCase();
        unitsWithProperties = unitsWithProperties.filter(u => 
          u.property?.city?.toLowerCase().includes(cityLower)
        );
      }
      
      if (state) {
        const stateLower = state.toLowerCase();
        unitsWithProperties = unitsWithProperties.filter(u => 
          u.property?.state?.toLowerCase().includes(stateLower)
        );
      }

      res.json(unitsWithProperties);
    } catch (error) {
      console.error("Error fetching marketplace units:", error);
      res.status(500).json({ message: "Failed to fetch units" });
    }
  });

  // Data Import routes
  app.post('/api/import/properties', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'property_manager')) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const data = await parseFileToJson(req.file);

      const imported = [];
      const errors = [];

      for (let i = 0; i < data.length; i++) {
        const row: any = data[i];
        try {
          const propertyData = {
            name: row.name || row.Name,
            address: row.address || row.Address,
            city: row.city || row.City,
            state: row.state || row.State,
            zipCode: row.zipCode || row.zipcode || row.ZipCode || row.Zipcode,
            propertyType: (row.propertyType || row.PropertyType || 'residential_single_family').toLowerCase(),
            totalUnits: parseInt(row.totalUnits || row.TotalUnits || '1'),
            managerId: user.role === 'property_manager' ? user.id : undefined,
            ownerId: user.role === 'landlord' ? user.id : undefined,
          };

          const property = await storage.createProperty(propertyData);
          imported.push(property);
        } catch (error) {
          errors.push({ row: i + 1, error: (error as Error).message });
        }
      }

      res.json({ imported: imported.length, errors, data: imported });
    } catch (error) {
      console.error("Error importing properties:", error);
      res.status(500).json({ message: "Failed to import properties" });
    }
  });

  app.post('/api/import/units', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'property_manager')) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const data = await parseFileToJson(req.file);

      const imported = [];
      const errors = [];

      for (let i = 0; i < data.length; i++) {
        const row: any = data[i];
        try {
          const bathrooms = parseFloat(row.bathrooms || row.Bathrooms || '1');
          const monthlyRent = parseFloat(row.monthlyRent || row.MonthlyRent || row.rent || row.Rent);
          
          if (isNaN(bathrooms)) {
            throw new Error('Invalid bathrooms value');
          }
          if (isNaN(monthlyRent)) {
            throw new Error('Invalid monthlyRent value');
          }
          
          const unitData = {
            propertyId: row.propertyId || row.PropertyId,
            unitNumber: row.unitNumber || row.UnitNumber,
            bedrooms: parseInt(row.bedrooms || row.Bedrooms || '1'),
            bathrooms: bathrooms.toString(),
            squareFeet: parseInt(row.squareFeet || row.SquareFeet || '0'),
            monthlyRent: monthlyRent.toString(),
            status: (row.status || row.Status || 'vacant').toLowerCase(),
          };

          const unit = await storage.createUnit(unitData);
          imported.push(unit);
        } catch (error) {
          errors.push({ row: i + 1, error: (error as Error).message });
        }
      }

      res.json({ imported: imported.length, errors, data: imported });
    } catch (error) {
      console.error("Error importing units:", error);
      res.status(500).json({ message: "Failed to import units" });
    }
  });

  app.post('/api/import/tenants', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'property_manager')) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const Papa = (await import('papaparse')).default;
      const fileContent = req.file.buffer.toString('utf-8');
      
      const result = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });

      const imported = [];
      const errors = [];
      const duplicates = [];

      for (let i = 0; i < result.data.length; i++) {
        const row: any = result.data[i];
        try {
          const email = row.email || row.Email;
          
          const existingUser = await storage.getUser(email);
          if (existingUser) {
            duplicates.push({ row: i + 1, email });
            continue;
          }

          const userData = {
            id: crypto.randomUUID(),
            email,
            firstName: row.firstName || row.FirstName,
            lastName: row.lastName || row.LastName,
            role: 'tenant',
          };

          const tenant = await storage.upsertUser(userData);
          imported.push(tenant);
        } catch (error) {
          errors.push({ row: i + 1, error: (error as Error).message });
        }
      }

      res.json({ imported: imported.length, errors, duplicates, data: imported });
    } catch (error) {
      console.error("Error importing tenants:", error);
      res.status(500).json({ message: "Failed to import tenants" });
    }
  });

  app.post('/api/import/leases', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'property_manager')) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const data = await parseFileToJson(req.file);

      const imported = [];
      const errors = [];

      for (let i = 0; i < data.length; i++) {
        const row: any = data[i];
        try {
          const leaseData = {
            unitId: row.unitId || row.UnitId,
            tenantId: row.tenantId || row.TenantId,
            startDate: row.startDate || row.StartDate,
            endDate: row.endDate || row.EndDate,
            monthlyRent: parseFloat(row.monthlyRent || row.MonthlyRent),
            securityDeposit: parseFloat(row.securityDeposit || row.SecurityDeposit || '0'),
            status: (row.status || row.Status || 'active').toLowerCase(),
          };

          const validatedData = insertLeaseSchema.parse(leaseData);
          const lease = await storage.createLease(validatedData);
          imported.push(lease);
        } catch (error) {
          errors.push({ row: i + 1, error: (error as Error).message });
        }
      }

      res.json({ imported: imported.length, errors, data: imported });
    } catch (error) {
      console.error("Error importing leases:", error);
      res.status(500).json({ message: "Failed to import leases" });
    }
  });

  // Data Export routes
  app.get('/api/export/tenants', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const tenants = await storage.getUsersByRole('tenant');

      const Papa = (await import('papaparse')).default;
      const csv = Papa.unparse(tenants);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=tenants.csv');
      res.send(csv);
    } catch (error) {
      console.error("Error exporting tenants:", error);
      res.status(500).json({ message: "Failed to export tenants" });
    }
  });

  app.get('/api/export/leases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const leases = await storage.getLeases({});

      const Papa = (await import('papaparse')).default;
      const csv = Papa.unparse(leases);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=leases.csv');
      res.send(csv);
    } catch (error) {
      console.error("Error exporting leases:", error);
      res.status(500).json({ message: "Failed to export leases" });
    }
  });

  app.get('/api/export/properties', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const properties = user.role === 'admin' 
        ? await storage.getProperties()
        : await storage.getProperties(undefined, user.id);

      const Papa = (await import('papaparse')).default;
      const csv = Papa.unparse(properties);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=properties.csv');
      res.send(csv);
    } catch (error) {
      console.error("Error exporting properties:", error);
      res.status(500).json({ message: "Failed to export properties" });
    }
  });

  app.get('/api/export/units', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const units = await storage.getAllUnits();
      
      const Papa = (await import('papaparse')).default;
      const csv = Papa.unparse(units);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=units.csv');
      res.send(csv);
    } catch (error) {
      console.error("Error exporting units:", error);
      res.status(500).json({ message: "Failed to export units" });
    }
  });

  app.post('/api/webhooks/sms', async (req, res) => {
    try {
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      if (!twilioAuthToken) {
        console.warn('Twilio webhook received but TWILIO_AUTH_TOKEN not configured');
        return res.status(503).send('Twilio not configured');
      }

      const twilioSignature = req.get('X-Twilio-Signature') || '';
      const url = `https://${req.get('host')}${req.originalUrl}`;
      
      const twilio = (await import('twilio')).default;
      const isValid = twilio.validateRequest(
        twilioAuthToken,
        twilioSignature,
        url,
        req.body
      );

      if (!isValid) {
        console.error('Invalid Twilio signature - potential spoofing attempt');
        return res.status(403).send('Forbidden: Invalid signature');
      }

      const { processTwilioWebhook, sendSMS, sendWhatsApp } = await import('./services/twilioService.js');
      const incomingMessage = processTwilioWebhook(req.body);
      
      if (!incomingMessage) {
        return res.status(400).send('Invalid webhook payload');
      }

      const phoneNumber = incomingMessage.from.replace(/^whatsapp:/, '');
      console.log(`Received ${incomingMessage.type} from ${phoneNumber}: "${incomingMessage.message}"`);

      const lowerMessage = incomingMessage.message.toLowerCase();
      let responseText = '';

      if (lowerMessage.includes('rent') || lowerMessage.includes('payment')) {
        responseText = "For rent payments, please visit your tenant portal or reply with BALANCE to check your current balance.";
      } else if (lowerMessage.includes('maintenance') || lowerMessage.includes('repair')) {
        responseText = "To submit a maintenance request, please log in to your tenant portal or reply with MAINTENANCE followed by your issue.";
      } else if (lowerMessage.includes('balance')) {
        responseText = "To check your balance, please log in to your tenant portal or call our office.";
      } else if (lowerMessage.includes('help')) {
        responseText = "PropertyFlows Support - Reply: RENT for payment info, MAINTENANCE for repairs, BALANCE for account balance, or visit your tenant portal.";
      } else {
        responseText = "Thank you for your message. Our team will respond shortly. For immediate assistance, log in to your tenant portal or call our office.";
      }

      if (incomingMessage.type === 'whatsapp') {
        await sendWhatsApp(phoneNumber, responseText);
      } else {
        await sendSMS(phoneNumber, responseText);
      }

      console.log(`Auto-response sent to ${phoneNumber}: "${responseText}"`);
      res.status(200).send('<Response></Response>');
    } catch (error) {
      console.error('Error processing Twilio webhook:', error);
      res.status(500).send('<Response></Response>');
    }
  });

  app.post('/api/webhooks/stripe', async (req, res) => {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.warn('Stripe webhook received but STRIPE_WEBHOOK_SECRET not configured');
        return res.status(503).json({ error: 'Webhook secret not configured' });
      }

      if (!stripe) {
        return res.status(503).json({ error: 'Stripe not configured' });
      }

      const signature = req.get('stripe-signature');
      if (!signature) {
        return res.status(400).json({ error: 'No signature provided' });
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(
          req.rawBody as Buffer,
          signature,
          webhookSecret
        );
      } catch (err: any) {
        logger.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).json({ error: 'Invalid signature' });
      }

      logger.info(`[Stripe Webhook] Received event: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as any;
          const stripePaymentIntentId = paymentIntent.id;
          
          const payments = await storage.getPayments();
          const payment = payments.find((p: any) => p.stripePaymentIntentId === stripePaymentIntentId);
          
          if (payment) {
            await storage.updatePayment(payment.id, {
              status: 'completed',
              paidAt: new Date(),
            });
            logger.info(`[Stripe Webhook] Payment ${payment.id} marked as completed`);
          } else {
            const metadata = paymentIntent.metadata || {};
            const leaseId = metadata.leaseId;
            const paymentMethod = metadata.paymentMethod || 'credit_card';
            const processingFee = parseFloat(metadata.processingFee || '0');
            const amount = paymentIntent.amount / 100;
            const rentAmount = amount - processingFee;
            
            if (leaseId) {
              const lease = await storage.getLease(leaseId);
              if (lease) {
                const newPayment = await storage.createPayment({
                  leaseId: leaseId,
                  tenantId: lease.tenantId,
                  amount: rentAmount.toString(),
                  paymentMethod: paymentMethod,
                  status: 'completed',
                  dueDate: new Date().toISOString(),
                  paidAt: new Date(),
                  stripePaymentIntentId: stripePaymentIntentId,
                  processingFee: processingFee.toString(),
                });
                logger.info(`[Stripe Webhook] Created payment record ${newPayment.id} for lease ${leaseId}`);
              } else {
                logger.warn(`[Stripe Webhook] Lease ${leaseId} not found for payment intent ${stripePaymentIntentId}`);
              }
            } else {
              logger.warn(`[Stripe Webhook] No leaseId in metadata for payment intent ${stripePaymentIntentId}`);
            }
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as any;
          const stripePaymentIntentId = paymentIntent.id;
          
          const payments = await storage.getPayments();
          const payment = payments.find((p: any) => p.stripePaymentIntentId === stripePaymentIntentId);
          
          if (payment) {
            await storage.updatePayment(payment.id, {
              status: 'failed',
            });
            logger.info(`[Stripe Webhook] Payment ${payment.id} marked as failed`);
          } else {
            logger.warn(`[Stripe Webhook] Payment not found for intent ${stripePaymentIntentId}`);
          }
          break;
        }

        case 'payout.paid': {
          const payout = event.data.object as any;
          const stripePayoutId = payout.id;
          
          const payouts = await storage.getPayouts();
          const dbPayout = payouts.find((p: any) => p.stripePayoutId === stripePayoutId);
          
          if (dbPayout) {
            await storage.updatePayout(dbPayout.id, {
              status: 'completed',
              arrivalDate: new Date(payout.arrival_date * 1000),
            });
            logger.info(`[Stripe Webhook] Payout ${dbPayout.id} marked as completed`);
          } else {
            logger.warn(`[Stripe Webhook] Payout not found for Stripe payout ${stripePayoutId}`);
          }
          break;
        }

        case 'payout.failed': {
          const payout = event.data.object as any;
          const stripePayoutId = payout.id;
          
          const payouts = await storage.getPayouts();
          const dbPayout = payouts.find((p: any) => p.stripePayoutId === stripePayoutId);
          
          if (dbPayout) {
            await storage.updatePayout(dbPayout.id, {
              status: 'failed',
              failureReason: payout.failure_message || 'Payout failed',
            });
            logger.info(`[Stripe Webhook] Payout ${dbPayout.id} marked as failed: ${payout.failure_message}`);
          } else {
            logger.warn(`[Stripe Webhook] Payout not found for Stripe payout ${stripePayoutId}`);
          }
          break;
        }

        case 'payout.canceled': {
          const payout = event.data.object as any;
          const stripePayoutId = payout.id;
          
          const payouts = await storage.getPayouts();
          const dbPayout = payouts.find((p: any) => p.stripePayoutId === stripePayoutId);
          
          if (dbPayout) {
            await storage.updatePayout(dbPayout.id, {
              status: 'canceled',
            });
            logger.info(`[Stripe Webhook] Payout ${dbPayout.id} marked as canceled`);
          } else {
            logger.warn(`[Stripe Webhook] Payout not found for Stripe payout ${stripePayoutId}`);
          }
          break;
        }

        case 'account.updated': {
          const account = event.data.object as any;
          const stripeAccountId = account.id;
          
          const isVerified = account.charges_enabled && account.payouts_enabled;
          const verificationStatus = isVerified ? 'verified' : 
            account.requirements?.currently_due?.length > 0 ? 'pending' : 'unverified';
          
          logger.info(`[Stripe Webhook] Account ${stripeAccountId} updated: ${verificationStatus}`);
          break;
        }

        case 'charge.refunded': {
          const charge = event.data.object as any;
          const paymentIntentId = charge.payment_intent;
          
          if (paymentIntentId) {
            const payments = await storage.getPayments();
            const payment = payments.find((p: any) => p.stripePaymentIntentId === paymentIntentId);
            
            if (payment) {
              await storage.updatePayment(payment.id, {
                status: 'refunded',
              });
              logger.info(`[Stripe Webhook] Payment ${payment.id} marked as refunded`);
            }
          }
          break;
        }

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('[Stripe Webhook] Error processing webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  app.post('/api/stripe/connect/account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role !== 'landlord') {
        return res.status(403).json({ message: "Only landlords can create Stripe Connect accounts" });
      }

      if (!stripe) {
        return res.status(503).json({ message: "Stripe not configured" });
      }

      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        ...(user.email ? { email: user.email } : {}),
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          userId,
        },
      });

      await storage.updateUser(userId, {
        stripeAccountId: account.id,
      });

      res.json({ 
        accountId: account.id,
        message: "Stripe Connect account created successfully" 
      });
    } catch (error) {
      console.error("Error creating Stripe Connect account:", error);
      res.status(500).json({ message: "Failed to create Stripe Connect account" });
    }
  });

  app.post('/api/stripe/connect/onboarding-link', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.stripeAccountId) {
        return res.status(400).json({ message: "No Stripe Connect account found" });
      }

      if (!stripe) {
        return res.status(503).json({ message: "Stripe not configured" });
      }

      const host = `${req.protocol}://${req.get('host')}`;
      
      const accountLink = await stripe.accountLinks.create({
        account: user.stripeAccountId,
        refresh_url: `${host}/settings?stripe_refresh=true`,
        return_url: `${host}/settings?stripe_success=true`,
        type: 'account_onboarding',
      });

      res.json({ url: accountLink.url });
    } catch (error) {
      console.error("Error creating onboarding link:", error);
      res.status(500).json({ message: "Failed to create onboarding link" });
    }
  });

  app.get('/api/stripe/account/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.stripeAccountId) {
        return res.json({ 
          connected: false,
          accountId: null,
          chargesEnabled: false,
          payoutsEnabled: false,
          detailsSubmitted: false
        });
      }

      if (!stripe) {
        return res.status(503).json({ message: "Stripe not configured" });
      }

      const account = await stripe.accounts.retrieve(user.stripeAccountId);

      res.json({
        connected: true,
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements,
      });
    } catch (error) {
      console.error("Error fetching Stripe account status:", error);
      res.status(500).json({ message: "Failed to fetch account status" });
    }
  });

  app.get('/api/stripe/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.stripeAccountId) {
        return res.status(400).json({ message: "No Stripe Connect account found" });
      }

      if (!stripe) {
        return res.status(503).json({ message: "Stripe not configured" });
      }

      const balance = await stripe.balance.retrieve({
        stripeAccount: user.stripeAccountId,
      });

      const available = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;
      const pending = balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100;

      res.json({
        available,
        pending,
        currency: 'usd',
      });
    } catch (error) {
      console.error("Error fetching Stripe balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  app.get('/api/chart-of-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const accounts = await storage.getChartOfAccounts(req.user.claims.sub);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching chart of accounts:", error);
      res.status(500).json({ message: "Failed to fetch chart of accounts" });
    }
  });

  app.post('/api/chart-of-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertChartOfAccountsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid account data", errors: parsed.error });
      }

      const account = await storage.createChartOfAccount({
        ...parsed.data,
        userId: req.user.claims.sub,
      });
      res.status(201).json(account);
    } catch (error) {
      console.error("Error creating chart of account:", error);
      res.status(500).json({ message: "Failed to create chart of account" });
    }
  });

  app.patch('/api/chart-of-accounts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { userId, createdById, ...updateData } = req.body;
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }
      
      const account = await storage.updateChartOfAccount(id, updateData, req.user.claims.sub);
      if (!account) {
        return res.status(404).json({ message: "Chart of account not found or unauthorized" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error updating chart of account:", error);
      res.status(500).json({ message: "Failed to update chart of account" });
    }
  });

  app.get('/api/journal-entries', isAuthenticated, async (req: any, res) => {
    try {
      const entries = await storage.getJournalEntries(req.user.claims.sub);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  app.post('/api/journal-entries', isAuthenticated, async (req: any, res) => {
    try {
      const { entry, lineItems } = req.body;
      
      if (!entry || !lineItems || !Array.isArray(lineItems)) {
        return res.status(400).json({ message: "Invalid journal entry data" });
      }
      
      const entryData = {
        ...entry,
        createdById: req.user.claims.sub,
        status: 'draft',
      };
      
      const created = await storage.createJournalEntry(entryData, lineItems);
      res.status(201).json(created);
    } catch (error: any) {
      console.error("Error creating journal entry:", error);
      res.status(500).json({ message: error.message || "Failed to create journal entry" });
    }
  });

  app.post('/api/journal-entries/:id/post', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const posted = await storage.postJournalEntry(id);
      res.json(posted);
    } catch (error) {
      console.error("Error posting journal entry:", error);
      res.status(500).json({ message: "Failed to post journal entry" });
    }
  });

  app.post('/api/journal-entries/:id/void', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const voided = await storage.voidJournalEntry(id);
      res.json(voided);
    } catch (error) {
      console.error("Error voiding journal entry:", error);
      res.status(500).json({ message: "Failed to void journal entry" });
    }
  });

  app.get('/api/journal-entries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const result = await storage.getJournalEntryWithLineItems(id);
      if (!result) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error fetching journal entry:", error);
      res.status(500).json({ message: "Failed to fetch journal entry" });
    }
  });

  app.get('/api/bank-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const accounts = await storage.getBankAccounts(req.user.claims.sub);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      res.status(500).json({ message: "Failed to fetch bank accounts" });
    }
  });

  app.post('/api/bank-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const validated = insertBankAccountSchema.parse(req.body);
      const account = await storage.createBankAccount({
        ...validated,
        userId: req.user.claims.sub,
      });
      res.status(201).json(account);
    } catch (error: any) {
      console.error("Error creating bank account:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid bank account data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bank account" });
    }
  });

  app.get('/api/integrations', isAuthenticated, async (req: any, res) => {
    try {
      const integrations = await storage.getIntegrations();
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.get('/api/integration-categories', isAuthenticated, async (req: any, res) => {
    try {
      const categories = await storage.getIntegrationCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching integration categories:", error);
      res.status(500).json({ message: "Failed to fetch integration categories" });
    }
  });

  app.get('/api/integration-connections', isAuthenticated, async (req: any, res) => {
    try {
      const connections = await storage.getIntegrationConnections(req.user.claims.sub);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching integration connections:", error);
      res.status(500).json({ message: "Failed to fetch integration connections" });
    }
  });

  app.post('/api/integration-connections', isAuthenticated, async (req: any, res) => {
    try {
      const connection = await storage.createIntegrationConnection({
        ...req.body,
        userId: req.user.claims.sub,
      });
      res.status(201).json(connection);
    } catch (error) {
      console.error("Error creating integration connection:", error);
      res.status(500).json({ message: "Failed to create integration connection" });
    }
  });

  app.delete('/api/integration-connections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteIntegrationConnection(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting integration connection:", error);
      res.status(500).json({ message: "Failed to delete integration connection" });
    }
  });

  app.post('/api/integrations/plaid/link-token', isAuthenticated, async (req: any, res) => {
    try {
      const { createLinkToken } = await import('./services/plaidService.js');
      const linkToken = await createLinkToken(req.user.claims.sub);
      
      if (!linkToken) {
        return res.status(503).json({ message: "Plaid service not configured" });
      }
      
      res.json({ linkToken });
    } catch (error) {
      console.error("Error creating Plaid link token:", error);
      res.status(500).json({ message: "Failed to create link token" });
    }
  });

  app.post('/api/integrations/plaid/verify', isAuthenticated, async (req: any, res) => {
    try {
      const { publicToken } = req.body;
      const { verifyBankAccount } = await import('./services/plaidService.js');
      const result = await verifyBankAccount(publicToken);
      res.json(result);
    } catch (error) {
      console.error("Error verifying bank account:", error);
      res.status(500).json({ message: "Failed to verify bank account" });
    }
  });

  app.post('/api/integrations/docusign/send-envelope', isAuthenticated, async (req: any, res) => {
    try {
      const { sendEnvelopeForSignature } = await import('./services/docusignService.js');
      const result = await sendEnvelopeForSignature(req.body);
      res.json(result);
    } catch (error) {
      console.error("Error sending DocuSign envelope:", error);
      res.status(500).json({ message: "Failed to send envelope" });
    }
  });

  app.get('/api/integrations/docusign/envelope/:envelopeId', isAuthenticated, async (req: any, res) => {
    try {
      const { getEnvelopeStatus } = await import('./services/docusignService.js');
      const status = await getEnvelopeStatus(req.params.envelopeId);
      
      if (!status) {
        return res.status(404).json({ message: "Envelope not found" });
      }
      
      res.json(status);
    } catch (error) {
      console.error("Error getting envelope status:", error);
      res.status(500).json({ message: "Failed to get envelope status" });
    }
  });

  app.post('/api/integrations/zillow/sync-unit', isAuthenticated, async (req: any, res) => {
    try {
      const { syncUnitToZillow } = await import('./services/zillowService.js');
      const result = await syncUnitToZillow(req.body);
      res.json(result);
    } catch (error) {
      console.error("Error syncing unit to Zillow:", error);
      res.status(500).json({ message: "Failed to sync unit" });
    }
  });

  app.get('/api/integrations/zillow/listing/:listingId', isAuthenticated, async (req: any, res) => {
    try {
      const { getListingStatus } = await import('./services/zillowService.js');
      const status = await getListingStatus(req.params.listingId);
      
      if (!status) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      res.json(status);
    } catch (error) {
      console.error("Error getting listing status:", error);
      res.status(500).json({ message: "Failed to get listing status" });
    }
  });

  app.get('/api/onboarding', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let progress = await storage.getOnboardingProgress(userId);
      
      if (!progress) {
        progress = await storage.createOnboardingProgress({
          userId,
          currentStep: 'welcome',
          completedSteps: [],
          skipped: false,
          completed: false,
        });
      }
      
      res.json(progress);
    } catch (error) {
      console.error("Error fetching onboarding progress:", error);
      res.status(500).json({ message: "Failed to fetch onboarding progress" });
    }
  });

  app.patch('/api/onboarding', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { currentStep, completedSteps, skipped, completed } = req.body;
      
      const progress = await storage.updateOnboardingProgress(userId, {
        ...(currentStep && { currentStep }),
        ...(completedSteps && { completedSteps }),
        ...(skipped !== undefined && { skipped }),
        ...(completed !== undefined && { 
          completed,
          ...(completed && { completedAt: new Date() })
        }),
      });
      
      res.json(progress);
    } catch (error) {
      console.error("Error updating onboarding progress:", error);
      res.status(500).json({ message: "Failed to update onboarding progress" });
    }
  });

  app.post('/api/mfa/enroll', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.email) {
        return res.status(400).json({ message: "User email is required for MFA enrollment" });
      }
      
      const { mfaService } = await import('./services/mfaService.js');
      const enrollmentData = await mfaService.enrollMfa(user.email);
      const hashedBackupCodes = mfaService.hashBackupCodes(enrollmentData.backupCodes);
      
      let mfaSettings = await storage.getMfaSettings(userId);
      
      if (!mfaSettings) {
        mfaSettings = await storage.createMfaSettings({
          userId,
          totpSecret: enrollmentData.secret,
          totpEnabled: false,
          backupCodes: hashedBackupCodes,
        });
      } else {
        mfaSettings = await storage.updateMfaSettings(userId, {
          totpSecret: enrollmentData.secret,
          backupCodes: hashedBackupCodes,
        });
      }
      
      res.json({
        qrCodeDataUrl: enrollmentData.qrCodeDataUrl,
        backupCodes: enrollmentData.backupCodes,
        otpauthUrl: enrollmentData.otpauthUrl,
      });
    } catch (error) {
      console.error("Error enrolling MFA:", error);
      res.status(500).json({ message: "Failed to enroll MFA" });
    }
  });

  app.post('/api/mfa/verify-enrollment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { token } = req.body;
      
      const mfaSettings = await storage.getMfaSettings(userId);
      
      if (!mfaSettings?.totpSecret) {
        return res.status(400).json({ message: "MFA enrollment not started" });
      }
      
      const { mfaService } = await import('./services/mfaService.js');
      const isValid = mfaService.verifyTotpToken(mfaSettings.totpSecret, token);
      
      if (!isValid) {
        return res.status(400).json({ message: "Invalid verification code" });
      }
      
      await storage.updateMfaSettings(userId, {
        totpEnabled: true,
      });
      
      res.json({ message: "MFA enabled successfully" });
    } catch (error) {
      console.error("Error verifying MFA enrollment:", error);
      res.status(500).json({ message: "Failed to verify MFA enrollment" });
    }
  });

  app.get('/api/mfa/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const mfaSettings = await storage.getMfaSettings(userId);
      
      res.json({
        enabled: mfaSettings?.totpEnabled || false,
        hasBackupCodes: (mfaSettings?.backupCodes?.length || 0) > 0,
      });
    } catch (error) {
      console.error("Error getting MFA status:", error);
      res.status(500).json({ message: "Failed to get MFA status" });
    }
  });

  app.delete('/api/mfa', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      await storage.updateMfaSettings(userId, {
        totpEnabled: false,
        totpSecret: null,
        backupCodes: [],
      });
      
      res.json({ message: "MFA disabled successfully" });
    } catch (error) {
      console.error("Error disabling MFA:", error);
      res.status(500).json({ message: "Failed to disable MFA" });
    }
  });

  app.post('/api/mfa/verify-login', async (req: any, res) => {
    try {
      const { token, rememberDevice, isBackupCode } = req.body;
      const session = req.session as any;
      
      if (!session.requiresMfa || !session.mfaUserId || !session.pendingUser) {
        return res.status(400).json({ message: "MFA verification not required" });
      }
      
      const userId = session.mfaUserId;
      const mfaSettings = await storage.getMfaSettings(userId);
      
      if (!mfaSettings?.totpEnabled) {
        return res.status(400).json({ message: "MFA not enabled for this user" });
      }
      
      const { mfaService } = await import('./services/mfaService.js');
      let isValid = false;
      
      if (isBackupCode) {
        const result = mfaService.verifyBackupCode(token, mfaSettings.backupCodes || []);
        isValid = result.valid;
        
        if (isValid) {
          await storage.updateMfaSettings(userId, {
            backupCodes: result.remainingCodes,
          });
        }
      } else {
        isValid = mfaService.verifyTotpToken(mfaSettings.totpSecret!, token);
      }
      
      if (!isValid) {
        return res.status(400).json({ message: "Invalid verification code" });
      }
      
      const pendingUser = session.pendingUser;
      delete session.requiresMfa;
      delete session.mfaUserId;
      delete session.pendingUser;
      
      req.logIn(pendingUser, async (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        
        if (rememberDevice) {
          const deviceFingerprint = mfaService.generateDeviceFingerprint(
            req.get('user-agent') || '',
            req.ip || ''
          );
          
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);
          
          await storage.createTrustedDevice({
            userId,
            deviceFingerprint,
            deviceName: req.get('user-agent') || 'Unknown Device',
            lastUsedAt: new Date(),
            expiresAt,
          });
        }
        
        res.json({ message: "MFA verification successful" });
      });
    } catch (error) {
      console.error("Error verifying MFA login:", error);
      res.status(500).json({ message: "Failed to verify MFA" });
    }
  });

  app.get('/api/mfa/check-required', async (req: any, res) => {
    try {
      const session = req.session as any;
      res.json({
        requiresMfa: session.requiresMfa || false,
      });
    } catch (error) {
      console.error("Error checking MFA requirement:", error);
      res.status(500).json({ message: "Failed to check MFA requirement" });
    }
  });

  app.get('/api/mfa/trusted-devices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.cleanupExpiredTrustedDevices(userId);
      
      const devices = await storage.getTrustedDevices(userId);
      res.json(devices);
    } catch (error) {
      console.error("Error fetching trusted devices:", error);
      res.status(500).json({ message: "Failed to fetch trusted devices" });
    }
  });

  app.delete('/api/mfa/trusted-devices/:deviceId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { deviceId } = req.params;
      
      await storage.revokeTrustedDevice(parseInt(deviceId));
      
      res.json({ message: "Device revoked successfully" });
    } catch (error) {
      console.error("Error revoking trusted device:", error);
      res.status(500).json({ message: "Failed to revoke device" });
    }
  });

  app.post('/api/gdpr/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const properties = await storage.getProperties(userId, undefined);
      const leases = await storage.getLeases({ userId });
      const payments = await storage.getPayments({ userId });
      const maintenanceRequests = await storage.getMaintenanceRequests({ tenantId: userId });
      
      const userData = {
        user,
        properties,
        leases,
        payments,
        maintenanceRequests,
        exportDate: new Date().toISOString(),
        gdprCompliance: true,
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="propertyflows-data-${userId}.json"`);
      res.json(userData);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  app.delete('/api/gdpr/delete-account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      await storage.deleteUser(userId);
      
      res.json({ message: "Account deletion initiated. You will be logged out shortly." });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  app.get('/api/metrics', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { perfMonitor } = await import('./performance.js');
      const metrics = perfMonitor.getMetrics();
      
      const summary: Record<string, {
        count: number;
        total: number;
        avg: number;
        min: number;
        max: number;
      }> = {};

      metrics.forEach(metric => {
        if (!summary[metric.name]) {
          summary[metric.name] = { count: 0, total: 0, avg: 0, min: Infinity, max: 0 };
        }
        
        const stats = summary[metric.name];
        stats.count++;
        stats.total += metric.duration;
        stats.min = Math.min(stats.min, metric.duration);
        stats.max = Math.max(stats.max, metric.duration);
        stats.avg = stats.total / stats.count;
      });

      res.json({
        totalRequests: metrics.length,
        summary: Object.entries(summary).map(([name, stats]) => ({
          endpoint: name,
          ...stats,
        })).sort((a, b) => b.avg - a.avg),
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  app.post('/api/csp-report', (req, res) => {
    if (req.body && req.body['csp-report']) {
      console.warn('CSP Violation:', JSON.stringify(req.body['csp-report'], null, 2));
    }
    res.status(204).end();
  });

  // Data Import System - CSV/Excel bulk import for migrations
  const Papa = await import('papaparse');
  const xlsx = await import('xlsx');
  const { autoDetectFieldMapping, validateFieldMapping } = await import('./utils/field-mapping.js');
  const {
    normalizePhone,
    normalizeEmail,
    normalizeName,
    normalizeAddress,
    normalizeState,
    normalizeZipCode,
    normalizeCurrency,
    normalizeDate,
    normalizeStatus,
    normalizePriority,
  } = await import('./utils/data-normalization.js');

  // Upload and parse CSV/Excel file
  app.post('/api/import/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'admin' && user.role !== 'property_manager')) {
        return res.status(403).json({ message: 'Admin or property manager access required' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { dataType, source } = req.body;
      if (!dataType) {
        return res.status(400).json({ message: 'dataType is required' });
      }

      let headers: string[] = [];
      let rows: any[] = [];

      // Parse from buffer (memoryStorage provides buffer, not path)
      if (req.file.mimetype === 'text/csv') {
        const csvText = req.file.buffer.toString('utf-8');
        const parsed = Papa.default.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim(),
        });
        
        headers = parsed.meta.fields || [];
        rows = parsed.data;
      } else {
        // Excel file
        const workbook = xlsx.default.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.default.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (data.length > 0) {
          headers = data[0].map((h: any) => String(h || '').trim());
          rows = data.slice(1).map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          }).filter(row => Object.values(row).some(v => v !== undefined && v !== ''));
        }
      }

      // Auto-detect field mapping
      const autoMapping = autoDetectFieldMapping(headers, dataType, source || 'generic_csv');
      const validation = validateFieldMapping(autoMapping, dataType);

      // Create import job - store parsed rows for later execution
      const importJob = await storage.createImportJob({
        userId: user.id,
        dataType,
        source: source || 'generic_csv',
        fileName: req.file.originalname,
        status: 'pending',
        totalRows: rows.length,
        fieldMapping: autoMapping,
        importedData: rows, // Store all rows for later execution
      });

      res.json({
        jobId: importJob.id,
        headers,
        rowCount: rows.length,
        preview: rows.slice(0, 10),
        autoMapping,
        validation,
      });
    } catch (error: any) {
      console.error('Error uploading import file:', error);
      res.status(500).json({ message: error.message || 'Failed to upload file' });
    }
  });

  // Update field mapping for import job
  app.patch('/api/import/:jobId/mapping', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user.role !== 'admin' && user.role !== 'property_manager') {
        return res.status(403).json({ message: 'Admin or property manager access required' });
      }

      const { jobId } = req.params;
      const { mapping } = req.body;

      const job = await storage.getImportJob(jobId);
      if (!job) {
        return res.status(404).json({ message: 'Import job not found' });
      }

      if (job.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const validation = validateFieldMapping(mapping, job.dataType);
      if (!validation.valid) {
        return res.status(400).json({
          message: 'Invalid field mapping',
          missingFields: validation.missingFields,
        });
      }

      await storage.updateImportJob(jobId, { fieldMapping: mapping });

      res.json({ message: 'Field mapping updated successfully', validation });
    } catch (error: any) {
      console.error('Error updating field mapping:', error);
      res.status(500).json({ message: error.message || 'Failed to update field mapping' });
    }
  });

  // Execute import
  app.post('/api/import/:jobId/execute', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user.role !== 'admin' && user.role !== 'property_manager') {
        return res.status(403).json({ message: 'Admin or property manager access required' });
      }

      const { jobId } = req.params;
      const { dryRun } = req.body;

      const job = await storage.getImportJob(jobId);
      if (!job) {
        return res.status(404).json({ message: 'Import job not found' });
      }

      if (job.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      await storage.updateImportJob(jobId, {
        status: 'importing',
        startedAt: new Date().toISOString(),
      });

      // Use stored rows from importedData
      const rows = job.importedData as any[] || [];
      
      if (rows.length === 0) {
        throw new Error('No data found in import job. Please upload the file again.');
      }

      const mapping = job.fieldMapping as Record<string, string>;
      const errors: any[] = [];
      let successCount = 0;
      let failureCount = 0;

      // Import data based on type
      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i];
          const normalizedData: any = {};

          // Map fields
          for (const [targetField, sourceField] of Object.entries(mapping)) {
            normalizedData[targetField] = row[sourceField];
          }

          // Normalize data based on type
          if (job.dataType === 'properties') {
            const propertyData = {
              name: normalizeName(normalizedData.name),
              address: normalizeAddress(normalizedData.address),
              city: normalizeName(normalizedData.city),
              state: normalizeState(normalizedData.state),
              zipCode: normalizeZipCode(normalizedData.zipCode),
              propertyType: normalizePropertyType(normalizedData.type || normalizedData.propertyType) || 'residential_single_family',
              totalUnits: parseInt(normalizedData.totalUnits) || 0,
              managerId: user.role === 'property_manager' ? user.id : undefined,
              ownerId: user.role === 'landlord' ? user.id : undefined,
            };

            if (!dryRun) {
              await storage.createProperty(propertyData);
            }
            successCount++;
          } else if (job.dataType === 'units') {
            // Find property by name
            const properties = await storage.getProperties(user.id, undefined);
            const property = properties.find(p => 
              p.name?.toLowerCase() === normalizedData.propertyName?.toLowerCase()
            );

            if (!property) {
              throw new Error(`Property not found: ${normalizedData.propertyName}`);
            }

            const unitData = {
              propertyId: property.id,
              unitNumber: normalizedData.unitNumber,
              bedrooms: parseInt(normalizedData.bedrooms) || 0,
              bathrooms: parseFloat(normalizedData.bathrooms) || 0,
              squareFeet: parseInt(normalizedData.squareFeet) || 0,
              monthlyRent: normalizeCurrency(normalizedData.monthlyRent) || 0,
              status: normalizeStatus(normalizedData.status, 'unit') || 'vacant',
            };

            if (!dryRun) {
              await storage.createUnit(unitData);
            }
            successCount++;
          } else if (job.dataType === 'tenants') {
            // Find property and unit
            const properties = await storage.getProperties(user.id, undefined);
            const property = properties.find(p => 
              p.name?.toLowerCase() === normalizedData.propertyName?.toLowerCase()
            );

            if (!property) {
              throw new Error(`Property not found: ${normalizedData.propertyName}`);
            }

            const units = await storage.getUnits(property.id);
            const unit = units.find(u => 
              u.unitNumber?.toLowerCase() === normalizedData.unitNumber?.toLowerCase()
            );

            if (!unit) {
              throw new Error(`Unit not found: ${normalizedData.unitNumber}`);
            }

            // Create user/tenant via invitation
            const tenantData = {
              email: normalizeEmail(normalizedData.email)!,
              role: 'tenant' as const,
              invitedBy: user.id,
              status: 'pending' as const,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            };

            if (!dryRun && normalizedData.email) {
              await storage.createInvitation(tenantData);
            }
            successCount++;
          }

          await storage.updateImportJob(jobId, {
            processedRows: i + 1,
            successfulRows: successCount,
            failedRows: failureCount,
          });
        } catch (error: any) {
          failureCount++;
          errors.push({
            row: i + 1,
            error: error.message,
            data: rows[i],
          });

          await storage.createImportError({
            importJobId: jobId,
            rowNumber: i + 1,
            errorType: 'import_error',
            errorMessage: error.message,
            rawData: rows[i],
          });
        }
      }

      await storage.updateImportJob(jobId, {
        status: errors.length > rows.length / 2 ? 'failed' : 'completed',
        completedAt: new Date().toISOString(),
        validationErrors: errors,
        successfulRows: successCount,
        failedRows: failureCount,
      });

      res.json({
        message: dryRun ? 'Dry run completed' : 'Import completed',
        totalRows: rows.length,
        successfulRows: successCount,
        failedRows: failureCount,
        errors: errors.slice(0, 100), // Limit errors in response
      });
    } catch (error: any) {
      console.error('Error executing import:', error);
      
      await storage.updateImportJob(req.params.jobId, {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date().toISOString(),
      });

      res.status(500).json({ message: error.message || 'Import failed' });
    }
  });

  // Get import job status
  app.get('/api/import/:jobId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const { jobId } = req.params;

      const job = await storage.getImportJob(jobId);
      if (!job) {
        return res.status(404).json({ message: 'Import job not found' });
      }

      if (job.userId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      res.json(job);
    } catch (error: any) {
      console.error('Error fetching import job:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch import job' });
    }
  });

  // Get all import jobs for user
  app.get('/api/import', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user.role !== 'admin' && user.role !== 'property_manager') {
        return res.status(403).json({ message: 'Admin or property manager access required' });
      }

      const jobs = await storage.getImportJobs(user.id);
      res.json(jobs);
    } catch (error: any) {
      console.error('Error fetching import jobs:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch import jobs' });
    }
  });

  // Rollback import
  app.delete('/api/import/:jobId/rollback', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required for rollback' });
      }

      const { jobId } = req.params;
      const job = await storage.getImportJob(jobId);

      if (!job) {
        return res.status(404).json({ message: 'Import job not found' });
      }

      if (job.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      // Mark as rolled back (actual rollback would require tracking imported IDs)
      await storage.updateImportJob(jobId, {
        status: 'rolled_back',
      });

      res.json({ message: 'Import marked as rolled back' });
    } catch (error: any) {
      console.error('Error rolling back import:', error);
      res.status(500).json({ message: error.message || 'Rollback failed' });
    }
  });

  // ============================================
  // SUBSCRIPTION MANAGEMENT ROUTES (Admin Only)
  // ============================================

  // Seed default subscription plans
  app.post("/api/admin/subscription-plans/seed", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { seedSubscriptionPlans } = await import('./seedSubscriptionPlans');
      await seedSubscriptionPlans();

      res.json({ message: 'Subscription plans seeded successfully' });
    } catch (error: any) {
      logger.error('Error seeding subscription plans:', error);
      res.status(500).json({ message: error.message || 'Failed to seed plans' });
    }
  });

  // Get all subscription plans
  app.get("/api/admin/subscription-plans", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error: any) {
      logger.error('Error fetching subscription plans:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch plans' });
    }
  });

  // Get single subscription plan
  app.get("/api/admin/subscription-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const plan = await storage.getSubscriptionPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      res.json(plan);
    } catch (error: any) {
      logger.error('Error fetching subscription plan:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch plan' });
    }
  });

  // Create subscription plan
  app.post("/api/admin/subscription-plans", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const plan = await storage.createSubscriptionPlan(req.body);
      res.status(201).json(plan);
    } catch (error: any) {
      logger.error('Error creating subscription plan:', error);
      res.status(500).json({ message: error.message || 'Failed to create plan' });
    }
  });

  // Update subscription plan
  app.put("/api/admin/subscription-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const plan = await storage.updateSubscriptionPlan(req.params.id, req.body);
      res.json(plan);
    } catch (error: any) {
      logger.error('Error updating subscription plan:', error);
      res.status(500).json({ message: error.message || 'Failed to update plan' });
    }
  });

  // Delete (archive) subscription plan
  app.delete("/api/admin/subscription-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      await storage.deleteSubscriptionPlan(req.params.id);
      res.json({ message: 'Plan deleted successfully' });
    } catch (error: any) {
      logger.error('Error deleting subscription plan:', error);
      res.status(500).json({ message: error.message || 'Failed to delete plan' });
    }
  });

  // Get all organizations
  app.get("/api/admin/organizations", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const organizations = await storage.getOrganizations();
      res.json(organizations);
    } catch (error: any) {
      logger.error('Error fetching organizations:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch organizations' });
    }
  });

  // Get single organization
  app.get("/api/admin/organizations/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const organization = await storage.getOrganization(req.params.id);
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found' });
      }

      res.json(organization);
    } catch (error: any) {
      logger.error('Error fetching organization:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch organization' });
    }
  });

  // Update organization subscription
  app.put("/api/admin/organizations/:id/subscription", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { subscriptionPlanId, status } = req.body;
      const organization = await storage.updateOrganizationSubscription(
        req.params.id,
        subscriptionPlanId,
        status
      );

      res.json(organization);
    } catch (error: any) {
      logger.error('Error updating organization subscription:', error);
      res.status(500).json({ message: error.message || 'Failed to update subscription' });
    }
  });

  // Extend trial period
  app.post("/api/admin/organizations/:id/extend-trial", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { days } = req.body;
      if (!days || days <= 0) {
        return res.status(400).json({ message: 'Days must be a positive number' });
      }

      const organization = await storage.extendOrganizationTrial(req.params.id, days);
      res.json(organization);
    } catch (error: any) {
      logger.error('Error extending trial:', error);
      res.status(500).json({ message: error.message || 'Failed to extend trial' });
    }
  });

  // Toggle suspend/unsuspend organization
  app.post("/api/admin/organizations/:id/toggle-suspend", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const organization = await storage.toggleOrganizationSuspension(req.params.id);
      res.json(organization);
    } catch (error: any) {
      logger.error('Error toggling suspension:', error);
      res.status(500).json({ message: error.message || 'Failed to toggle suspension' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
