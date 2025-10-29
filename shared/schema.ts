import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("property_manager"), // admin, property_manager, landlord, tenant, vendor
  phone: varchar("phone"),
  address: varchar("address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  companyName: varchar("company_name"),
  taxId: varchar("tax_id"),
  invitationStatus: varchar("invitation_status").default("pending"), // pending, accepted, expired
  invitationToken: varchar("invitation_token"),
  invitationSentAt: timestamp("invitation_sent_at"),
  stripeAccountId: varchar("stripe_account_id"),
  stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false),
  preferredCurrency: varchar("preferred_currency").default('USD'),
  timezone: varchar("timezone").default('America/New_York'),
  language: varchar("language").default('en'),
  gdprConsentGiven: boolean("gdpr_consent_given").default(false),
  gdprConsentDate: timestamp("gdpr_consent_date"),
  marketingEmailsEnabled: boolean("marketing_emails_enabled").default(true),
  dataProcessingConsent: boolean("data_processing_consent").default(false),
  organizationId: varchar("organization_id"),
  isOrgAdmin: boolean("is_org_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// MFA (Two-Factor Authentication) Settings
export const mfaSettings = pgTable("mfa_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  totpSecret: varchar("totp_secret"),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  backupCodes: jsonb("backup_codes").$type<string[]>(),
  lastUsedBackupCode: varchar("last_used_backup_code"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMfaSettingsSchema = createInsertSchema(mfaSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMfaSettings = z.infer<typeof insertMfaSettingsSchema>;
export type MfaSettings = typeof mfaSettings.$inferSelect;

// Trusted Devices for MFA (Remember This Device)
export const trustedDevices = pgTable("trusted_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  deviceFingerprint: varchar("device_fingerprint").notNull(),
  deviceName: varchar("device_name"),
  lastUsedAt: timestamp("last_used_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTrustedDeviceSchema = createInsertSchema(trustedDevices).omit({
  id: true,
  createdAt: true,
});
export type InsertTrustedDevice = z.infer<typeof insertTrustedDeviceSchema>;
export type TrustedDevice = typeof trustedDevices.$inferSelect;

// Invitation status and role enums
export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'expired'
]);

export const invitationRoleEnum = pgEnum('invitation_role', [
  'tenant',
  'landlord',
  'vendor',
  'property_manager'
]);

// Invitations table for user invitations
export const invitations = pgTable("invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  role: invitationRoleEnum("role").notNull(),
  invitedBy: varchar("invited_by").references(() => users.id).notNull(),
  token: varchar("token").notNull().unique(),
  status: invitationStatusEnum("status").notNull().default('pending'),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvitationSchema = createInsertSchema(invitations).omit({
  id: true,
  createdAt: true,
});
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type Invitation = typeof invitations.$inferSelect;

// Subscription System Enums
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'suspended'
]);

export const verificationStatusEnum = pgEnum('verification_status', [
  'pending',
  'approved',
  'rejected',
  'manual_review'
]);

export const billingIntervalEnum = pgEnum('billing_interval', [
  'monthly',
  'annual'
]);

// Subscription Plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  billingInterval: billingIntervalEnum("billing_interval").notNull().default('monthly'),
  trialDays: integer("trial_days").notNull().default(14),
  isActive: boolean("is_active").notNull().default(true),
  stripePriceId: varchar("stripe_price_id"),
  stripeProductId: varchar("stripe_product_id"),
  features: jsonb("features").$type<{
    maxProperties: number;
    maxUnits: number;
    maxTenants: number;
    maxPropertyManagers: number;
    maxOwners: number;
    maxVendors: number;
    maxStorage: number;
    features: {
      aiMaintenance: boolean;
      fairHousing: boolean;
      bulkImport: boolean;
      quickbooksSync: boolean;
      advancedReporting: boolean;
      whiteLabel: boolean;
      apiAccess: boolean;
      prioritySupport: boolean;
      smsNotifications: boolean;
      eSignatures: boolean;
      multiCurrency: boolean;
      vendorPortal: boolean;
      ownerPortal: boolean;
    };
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// Organizations (for multi-user subscriptions)
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  website: varchar("website"),
  subscriptionPlan: varchar("subscription_plan"),
  adminUserId: varchar("admin_user_id").references(() => users.id),
  subscriptionPlanId: varchar("subscription_plan_id").references(() => subscriptionPlans.id),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripePriceId: varchar("stripe_price_id"),
  status: subscriptionStatusEnum("status").notNull().default('trialing'),
  trialEndsAt: timestamp("trial_ends_at"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  gracePeriodDays: integer("grace_period_days").default(14),
  paymentFailedAt: timestamp("payment_failed_at"),
  paymentRetryCount: integer("payment_retry_count").default(0),
  verificationStatus: verificationStatusEnum("verification_status").notNull().default('pending'),
  businessLicense: varchar("business_license"),
  taxId: varchar("tax_id"),
  businessAddress: text("business_address"),
  businessPhone: varchar("business_phone"),
  verifiedAt: timestamp("verified_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

// Business Verification Logs (audit trail for verification process)
export const businessVerificationLogs = pgTable("business_verification_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  verificationType: varchar("verification_type").notNull(),
  status: varchar("status").notNull(),
  provider: varchar("provider").notNull(),
  metadata: jsonb("metadata"),
  verifiedBy: varchar("verified_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBusinessVerificationLogSchema = createInsertSchema(businessVerificationLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertBusinessVerificationLog = z.infer<typeof insertBusinessVerificationLogSchema>;
export type BusinessVerificationLog = typeof businessVerificationLogs.$inferSelect;

// Subscription History (audit trail)
export const subscriptionHistory = pgTable("subscription_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  fromPlanId: varchar("from_plan_id").references(() => subscriptionPlans.id),
  toPlanId: varchar("to_plan_id").references(() => subscriptionPlans.id),
  reason: varchar("reason"),
  changedBy: varchar("changed_by").references(() => users.id),
  stripeEventId: varchar("stripe_event_id"),
  effectiveDate: timestamp("effective_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubscriptionHistorySchema = createInsertSchema(subscriptionHistory).omit({
  id: true,
  createdAt: true,
});
export type InsertSubscriptionHistory = z.infer<typeof insertSubscriptionHistorySchema>;
export type SubscriptionHistory = typeof subscriptionHistory.$inferSelect;

// Usage Metrics (track resource usage against limits)
export const usageMetrics = pgTable("usage_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull().unique(),
  currentProperties: integer("current_properties").notNull().default(0),
  currentUnits: integer("current_units").notNull().default(0),
  currentTenants: integer("current_tenants").notNull().default(0),
  currentPropertyManagers: integer("current_property_managers").notNull().default(0),
  currentOwners: integer("current_owners").notNull().default(0),
  currentVendors: integer("current_vendors").notNull().default(0),
  currentStorage: integer("current_storage").notNull().default(0),
  lastCalculated: timestamp("last_calculated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUsageMetricsSchema = createInsertSchema(usageMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUsageMetrics = z.infer<typeof insertUsageMetricsSchema>;
export type UsageMetrics = typeof usageMetrics.$inferSelect;

// Property Types
export const propertyTypeEnum = pgEnum('property_type', [
  'residential_multi_family',
  'residential_single_family',
  'commercial',
  'mixed_use'
]);

// Properties
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  address: text("address").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  zipCode: varchar("zip_code").notNull(),
  propertyType: propertyTypeEnum("property_type").notNull(),
  totalUnits: integer("total_units").notNull().default(0),
  imageUrl: varchar("image_url"),
  ownerId: varchar("owner_id").references(() => users.id),
  managerId: varchar("manager_id").references(() => users.id),
  smartRoutingEnabled: boolean("smart_routing_enabled").default(false),
  defaultVendorId: varchar("default_vendor_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

// Property Vendor Assignments
export const propertyVendorAssignments = pgTable("property_vendor_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").references(() => properties.id).notNull(),
  vendorId: varchar("vendor_id").references(() => users.id).notNull(),
  specialties: text("specialties").array(),
  isPreferred: boolean("is_preferred").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPropertyVendorAssignmentSchema = createInsertSchema(propertyVendorAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPropertyVendorAssignment = z.infer<typeof insertPropertyVendorAssignmentSchema>;
export type PropertyVendorAssignment = typeof propertyVendorAssignments.$inferSelect;

// Vendor Documents
export const vendorDocuments = pgTable("vendor_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => users.id).notNull(),
  fileName: varchar("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  documentType: varchar("document_type"),
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVendorDocumentSchema = createInsertSchema(vendorDocuments).omit({
  id: true,
  createdAt: true,
});
export type InsertVendorDocument = z.infer<typeof insertVendorDocumentSchema>;
export type VendorDocument = typeof vendorDocuments.$inferSelect;

// Units
export const unitStatusEnum = pgEnum('unit_status', ['vacant', 'occupied', 'maintenance']);

export const units = pgTable("units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").references(() => properties.id).notNull(),
  unitNumber: varchar("unit_number").notNull(),
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  squareFeet: integer("square_feet"),
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }).notNull(),
  status: unitStatusEnum("status").notNull().default('vacant'),
  description: text("description"),
  amenities: text("amenities").array(),
  photoUrls: text("photo_urls").array(),
  availableDate: date("available_date"),
  petPolicy: varchar("pet_policy"),
  parkingIncluded: boolean("parking_included").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUnitSchema = createInsertSchema(units).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type Unit = typeof units.$inferSelect;

// Leases
export const leaseStatusEnum = pgEnum('lease_status', [
  'active',
  'pending_signature',
  'expired',
  'terminated'
]);

export const leases = pgTable("leases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  unitId: varchar("unit_id").references(() => units.id).notNull(),
  tenantId: varchar("tenant_id").references(() => users.id).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }).notNull(),
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }).notNull(),
  status: leaseStatusEnum("status").notNull().default('pending_signature'),
  documentUrl: varchar("document_url"),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeaseSchema = createInsertSchema(leases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLease = z.infer<typeof insertLeaseSchema>;
export type Lease = typeof leases.$inferSelect;

// Maintenance Requests
export const maintenanceStatusEnum = pgEnum('maintenance_status', [
  'open',
  'assigned',
  'in_progress',
  'completed',
  'cancelled'
]);

export const maintenancePriorityEnum = pgEnum('maintenance_priority', [
  'low',
  'medium',
  'high',
  'urgent'
]);

export const maintenanceRequests = pgTable("maintenance_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  unitId: varchar("unit_id").references(() => units.id).notNull(),
  tenantId: varchar("tenant_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  priority: maintenancePriorityEnum("priority").notNull().default('medium'),
  status: maintenanceStatusEnum("status").notNull().default('open'),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  photoUrls: text("photo_urls").array(),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;
export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;

// Payments
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded'
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'ach',
  'debit_card',
  'credit_card',
  'apple_pay',
  'google_pay'
]);

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leaseId: varchar("lease_id").references(() => leases.id).notNull(),
  tenantId: varchar("tenant_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  processingFee: decimal("processing_fee", { precision: 10, scale: 2 }).notNull().default('0'),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  status: paymentStatusEnum("status").notNull().default('pending'),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  paidAt: timestamp("paid_at"),
  dueDate: date("due_date").notNull(),
  isAutopay: boolean("is_autopay").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Payment Plans (for partial payments and installments)
export const paymentPlanStatusEnum = pgEnum('payment_plan_status', [
  'active',
  'completed',
  'cancelled',
  'defaulted'
]);

export const paymentPlans = pgTable("payment_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leaseId: varchar("lease_id").references(() => leases.id).notNull(),
  tenantId: varchar("tenant_id").references(() => users.id).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).notNull(),
  numberOfInstallments: integer("number_of_installments").notNull(),
  installmentAmount: decimal("installment_amount", { precision: 10, scale: 2 }).notNull(),
  frequency: varchar("frequency").notNull().default('monthly'),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: paymentPlanStatusEnum("status").notNull().default('active'),
  reason: text("reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPaymentPlanSchema = createInsertSchema(paymentPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPaymentPlan = z.infer<typeof insertPaymentPlanSchema>;
export type PaymentPlan = typeof paymentPlans.$inferSelect;

// Payment Plan Installments
export const installmentStatusEnum = pgEnum('installment_status', [
  'pending',
  'paid',
  'late',
  'missed'
]);

export const paymentInstallments = pgTable("payment_installments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentPlanId: varchar("payment_plan_id").references(() => paymentPlans.id).notNull(),
  installmentNumber: integer("installment_number").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  paidDate: date("paid_date"),
  paymentId: varchar("payment_id").references(() => payments.id),
  status: installmentStatusEnum("status").notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPaymentInstallmentSchema = createInsertSchema(paymentInstallments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPaymentInstallment = z.infer<typeof insertPaymentInstallmentSchema>;
export type PaymentInstallment = typeof paymentInstallments.$inferSelect;

// Tenant Screening
export const screeningStatusEnum = pgEnum('screening_status', [
  'pending',
  'in_progress',
  'completed',
  'approved',
  'denied'
]);

export const screenings = pgTable("screenings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicantId: varchar("applicant_id").references(() => users.id).notNull(),
  propertyId: varchar("property_id").references(() => properties.id),
  unitId: varchar("unit_id").references(() => units.id),
  status: screeningStatusEnum("status").notNull().default('pending'),
  creditScore: integer("credit_score"),
  backgroundCheckResult: text("background_check_result"),
  evictionHistory: boolean("eviction_history"),
  incomeVerified: boolean("income_verified"),
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertScreeningSchema = createInsertSchema(screenings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertScreening = z.infer<typeof insertScreeningSchema>;
export type Screening = typeof screenings.$inferSelect;

// Transactions (for accounting)
export const transactionTypeEnum = pgEnum('transaction_type', [
  'income',
  'expense'
]);

export const transactionCategoryEnum = pgEnum('transaction_category', [
  'rent',
  'late_fee',
  'pet_rent',
  'parking_fee',
  'maintenance',
  'utilities',
  'insurance',
  'property_tax',
  'management_fee',
  'other'
]);

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").references(() => properties.id).notNull(),
  type: transactionTypeEnum("type").notNull(),
  category: transactionCategoryEnum("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  date: date("date").notNull(),
  paymentId: varchar("payment_id").references(() => payments.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Delinquency Playbooks (automated payment reminders)
export const delinquencyPlaybooks = pgTable("delinquency_playbooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  propertyId: varchar("property_id").references(() => properties.id),
  isActive: boolean("is_active").notNull().default(true),
  gracePeriodDays: integer("grace_period_days").notNull().default(3),
  reminderIntervals: jsonb("reminder_intervals").notNull(),
  offerPaymentPlanAfterDays: integer("offer_payment_plan_after_days").default(7),
  escalateToLegalAfterDays: integer("escalate_to_legal_after_days").default(30),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDelinquencyPlaybookSchema = createInsertSchema(delinquencyPlaybooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDelinquencyPlaybook = z.infer<typeof insertDelinquencyPlaybookSchema>;
export type DelinquencyPlaybook = typeof delinquencyPlaybooks.$inferSelect;

// Delinquency Actions (track reminders sent)
export const delinquencyActionStatusEnum = pgEnum('delinquency_action_status', [
  'pending',
  'sent',
  'delivered',
  'failed',
  'responded'
]);

export const delinquencyActions = pgTable("delinquency_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentId: varchar("payment_id").references(() => payments.id).notNull(),
  playbookId: varchar("playbook_id").references(() => delinquencyPlaybooks.id).notNull(),
  tenantId: varchar("tenant_id").references(() => users.id).notNull(),
  daysOverdue: integer("days_overdue").notNull(),
  actionType: varchar("action_type").notNull(),
  messageTemplate: text("message_template").notNull(),
  messageSent: text("message_sent"),
  status: delinquencyActionStatusEnum("status").notNull().default('pending'),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  respondedAt: timestamp("responded_at"),
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDelinquencyActionSchema = createInsertSchema(delinquencyActions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDelinquencyAction = z.infer<typeof insertDelinquencyActionSchema>;
export type DelinquencyAction = typeof delinquencyActions.$inferSelect;

// Audit Logs (for compliance tracking)
export const auditLogEntityEnum = pgEnum('audit_log_entity', [
  'property',
  'unit',
  'lease',
  'payment',
  'maintenance',
  'transaction',
  'user',
  'screening'
]);

export const auditLogActionEnum = pgEnum('audit_log_action', [
  'create',
  'update',
  'delete',
  'status_change',
  'payment_processed',
  'document_signed'
]);

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: auditLogEntityEnum("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  action: auditLogActionEnum("action").notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  changes: jsonb("changes"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// E-Signature Logs (for legal compliance)
export const eSignatureLogs = pgTable("e_signature_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leaseId: varchar("lease_id").references(() => leases.id).notNull(),
  signedBy: varchar("signed_by").references(() => users.id).notNull(),
  ipAddress: varchar("ip_address").notNull(),
  userAgent: text("user_agent"),
  documentHash: varchar("document_hash").notNull(),
  signedAt: timestamp("signed_at").defaultNow(),
});

export const insertESignatureLogSchema = createInsertSchema(eSignatureLogs).omit({
  id: true,
  signedAt: true,
});
export type InsertESignatureLog = z.infer<typeof insertESignatureLogSchema>;
export type ESignatureLog = typeof eSignatureLogs.$inferSelect;

// SMS Preferences (for tenant communication)
export const smsPreferences = pgTable("sms_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  phoneNumber: varchar("phone_number"),
  optedIn: boolean("opted_in").default(false),
  rentReminders: boolean("rent_reminders").default(true),
  maintenanceUpdates: boolean("maintenance_updates").default(true),
  leaseRenewals: boolean("lease_renewals").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSmsPreferencesSchema = createInsertSchema(smsPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSmsPreferences = z.infer<typeof insertSmsPreferencesSchema>;
export type SmsPreferences = typeof smsPreferences.$inferSelect;

// Turn Tasks (for turnboard/field operations)
export const turnTaskStatusEnum = pgEnum('turn_task_status', [
  'pending',
  'in_progress',
  'completed',
  'blocked'
]);

export const turnTaskTypeEnum = pgEnum('turn_task_type', [
  'cleaning',
  'painting',
  'repairs',
  'inspection',
  'hvac',
  'plumbing',
  'electrical',
  'flooring',
  'appliances',
  'landscaping'
]);

export const turnTasks = pgTable("turn_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  unitId: varchar("unit_id").references(() => units.id),
  title: varchar("title").notNull(),
  type: turnTaskTypeEnum("type").notNull(),
  status: turnTaskStatusEnum("status").notNull().default('pending'),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTurnTaskSchema = createInsertSchema(turnTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTurnTask = z.infer<typeof insertTurnTaskSchema>;
export type TurnTask = typeof turnTasks.$inferSelect;

// AI Triage Results (for maintenance request AI analysis)
export const aiTriageResults = pgTable("ai_triage_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  maintenanceRequestId: varchar("maintenance_request_id").references(() => maintenanceRequests.id).notNull(),
  urgencyLevel: varchar("urgency_level").notNull(),
  category: varchar("category"),
  rootCause: text("root_cause"),
  suggestedActions: text("suggested_actions").array(),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  selfServiceSteps: text("self_service_steps").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiTriageResultSchema = createInsertSchema(aiTriageResults).omit({
  id: true,
  createdAt: true,
});
export type InsertAiTriageResult = z.infer<typeof insertAiTriageResultSchema>;
export type AiTriageResult = typeof aiTriageResults.$inferSelect;

// Lease Renewal Predictions (AI churn prediction)
export const churnRiskEnum = pgEnum('churn_risk', [
  'low',
  'medium',
  'high',
  'critical'
]);

export const leaseRenewalPredictions = pgTable("lease_renewal_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leaseId: varchar("lease_id").references(() => leases.id).notNull(),
  tenantId: varchar("tenant_id").references(() => users.id).notNull(),
  daysUntilExpiry: integer("days_until_expiry").notNull(),
  churnRisk: churnRiskEnum("churn_risk").notNull(),
  churnProbability: decimal("churn_probability", { precision: 5, scale: 2 }).notNull(),
  riskFactors: jsonb("risk_factors").notNull(),
  recommendedIncentives: jsonb("recommended_incentives").notNull(),
  suggestedRenewalTerms: jsonb("suggested_renewal_terms"),
  aiReasoning: text("ai_reasoning"),
  notificationSent: boolean("notification_sent").notNull().default(false),
  notifiedAt: timestamp("notified_at"),
  tenantResponse: varchar("tenant_response"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeaseRenewalPredictionSchema = createInsertSchema(leaseRenewalPredictions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLeaseRenewalPrediction = z.infer<typeof insertLeaseRenewalPredictionSchema>;
export type LeaseRenewalPrediction = typeof leaseRenewalPredictions.$inferSelect;

// Move-in/out Inspections (AI photo comparison and damage estimation)
export const inspectionTypeEnum = pgEnum('inspection_type', ['move_in', 'move_out', 'routine']);
export const damageTypeEnum = pgEnum('damage_type', ['none', 'minor', 'moderate', 'major', 'severe']);

export const unitInspections = pgTable("unit_inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  unitId: varchar("unit_id").references(() => units.id).notNull(),
  leaseId: varchar("lease_id").references(() => leases.id),
  inspectionType: inspectionTypeEnum("inspection_type").notNull(),
  inspectorId: varchar("inspector_id").references(() => users.id).notNull(),
  inspectionDate: timestamp("inspection_date").notNull(),
  photoUrls: text("photo_urls").array().notNull(),
  notes: text("notes"),
  aiAnalysisComplete: boolean("ai_analysis_complete").notNull().default(false),
  aiAnalysisData: jsonb("ai_analysis_data"),
  estimatedDamageCost: decimal("estimated_damage_cost", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUnitInspectionSchema = createInsertSchema(unitInspections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUnitInspection = z.infer<typeof insertUnitInspectionSchema>;
export type UnitInspection = typeof unitInspections.$inferSelect;

// Relations
export const propertiesRelations = relations(properties, ({ many, one }) => ({
  units: many(units),
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
  }),
  manager: one(users, {
    fields: [properties.managerId],
    references: [users.id],
  }),
  transactions: many(transactions),
  screenings: many(screenings),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  property: one(properties, {
    fields: [units.propertyId],
    references: [properties.id],
  }),
  leases: many(leases),
  maintenanceRequests: many(maintenanceRequests),
}));

export const leasesRelations = relations(leases, ({ one, many }) => ({
  unit: one(units, {
    fields: [leases.unitId],
    references: [units.id],
  }),
  tenant: one(users, {
    fields: [leases.tenantId],
    references: [users.id],
  }),
  payments: many(payments),
}));

export const maintenanceRequestsRelations = relations(maintenanceRequests, ({ one }) => ({
  unit: one(units, {
    fields: [maintenanceRequests.unitId],
    references: [units.id],
  }),
  tenant: one(users, {
    fields: [maintenanceRequests.tenantId],
    references: [users.id],
  }),
  assignedTo: one(users, {
    fields: [maintenanceRequests.assignedToId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  lease: one(leases, {
    fields: [payments.leaseId],
    references: [leases.id],
  }),
  tenant: one(users, {
    fields: [payments.tenantId],
    references: [users.id],
  }),
}));

export const paymentPlansRelations = relations(paymentPlans, ({ one, many }) => ({
  lease: one(leases, {
    fields: [paymentPlans.leaseId],
    references: [leases.id],
  }),
  tenant: one(users, {
    fields: [paymentPlans.tenantId],
    references: [users.id],
  }),
  installments: many(paymentInstallments),
}));

export const paymentInstallmentsRelations = relations(paymentInstallments, ({ one }) => ({
  paymentPlan: one(paymentPlans, {
    fields: [paymentInstallments.paymentPlanId],
    references: [paymentPlans.id],
  }),
  payment: one(payments, {
    fields: [paymentInstallments.paymentId],
    references: [payments.id],
  }),
}));

export const screeningsRelations = relations(screenings, ({ one }) => ({
  applicant: one(users, {
    fields: [screenings.applicantId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [screenings.propertyId],
    references: [properties.id],
  }),
  unit: one(units, {
    fields: [screenings.unitId],
    references: [units.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  property: one(properties, {
    fields: [transactions.propertyId],
    references: [properties.id],
  }),
  payment: one(payments, {
    fields: [transactions.paymentId],
    references: [payments.id],
  }),
}));

export const delinquencyPlaybooksRelations = relations(delinquencyPlaybooks, ({ one, many }) => ({
  property: one(properties, {
    fields: [delinquencyPlaybooks.propertyId],
    references: [properties.id],
  }),
  actions: many(delinquencyActions),
}));

export const delinquencyActionsRelations = relations(delinquencyActions, ({ one }) => ({
  payment: one(payments, {
    fields: [delinquencyActions.paymentId],
    references: [payments.id],
  }),
  playbook: one(delinquencyPlaybooks, {
    fields: [delinquencyActions.playbookId],
    references: [delinquencyPlaybooks.id],
  }),
  tenant: one(users, {
    fields: [delinquencyActions.tenantId],
    references: [users.id],
  }),
}));

export const leaseRenewalPredictionsRelations = relations(leaseRenewalPredictions, ({ one }) => ({
  lease: one(leases, {
    fields: [leaseRenewalPredictions.leaseId],
    references: [leases.id],
  }),
  tenant: one(users, {
    fields: [leaseRenewalPredictions.tenantId],
    references: [users.id],
  }),
}));

export const vendorBidStatusEnum = pgEnum('vendor_bid_status', [
  'pending',
  'accepted',
  'rejected',
  'withdrawn'
]);

export const vendorBidJobTypeEnum = pgEnum('vendor_bid_job_type', [
  'maintenance',
  'turn_task'
]);

export const vendorBids = pgTable("vendor_bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => users.id).notNull(),
  jobType: vendorBidJobTypeEnum("job_type").notNull(),
  jobId: varchar("job_id").notNull(),
  bidAmount: decimal("bid_amount", { precision: 10, scale: 2 }).notNull(),
  estimatedDays: integer("estimated_days"),
  notes: text("notes"),
  attachmentUrls: text("attachment_urls").array(),
  status: vendorBidStatusEnum("status").notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVendorBidSchema = createInsertSchema(vendorBids).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVendorBid = z.infer<typeof insertVendorBidSchema>;
export type VendorBid = typeof vendorBids.$inferSelect;

export const workCompletionDocs = pgTable("work_completion_docs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => users.id).notNull(),
  jobType: vendorBidJobTypeEnum("job_type").notNull(),
  jobId: varchar("job_id").notNull(),
  photoUrls: text("photo_urls").array(),
  invoiceUrl: varchar("invoice_url"),
  notes: text("notes"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const insertWorkCompletionDocSchema = createInsertSchema(workCompletionDocs).omit({
  id: true,
  submittedAt: true,
});
export type InsertWorkCompletionDoc = z.infer<typeof insertWorkCompletionDocSchema>;
export type WorkCompletionDoc = typeof workCompletionDocs.$inferSelect;

export const vendorBidsRelations = relations(vendorBids, ({ one }) => ({
  vendor: one(users, {
    fields: [vendorBids.vendorId],
    references: [users.id],
  }),
}));

export const workCompletionDocsRelations = relations(workCompletionDocs, ({ one }) => ({
  vendor: one(users, {
    fields: [workCompletionDocs.vendorId],
    references: [users.id],
  }),
}));

export const vendorPaymentRequestStatusEnum = pgEnum('vendor_payment_request_status', [
  'pending',
  'approved',
  'paid',
  'rejected',
  'cancelled'
]);

export const vendorPaymentRequests = pgTable("vendor_payment_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => users.id).notNull(),
  bidId: varchar("bid_id").references(() => vendorBids.id),
  workCompletionDocId: varchar("work_completion_doc_id").references(() => workCompletionDocs.id),
  jobType: vendorBidJobTypeEnum("job_type").notNull(),
  jobId: varchar("job_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  status: vendorPaymentRequestStatusEnum("status").notNull().default('pending'),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVendorPaymentRequestSchema = createInsertSchema(vendorPaymentRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVendorPaymentRequest = z.infer<typeof insertVendorPaymentRequestSchema>;
export type VendorPaymentRequest = typeof vendorPaymentRequests.$inferSelect;

export const vendorPaymentRequestsRelations = relations(vendorPaymentRequests, ({ one }) => ({
  vendor: one(users, {
    fields: [vendorPaymentRequests.vendorId],
    references: [users.id],
  }),
  bid: one(vendorBids, {
    fields: [vendorPaymentRequests.bidId],
    references: [vendorBids.id],
  }),
  workCompletionDoc: one(workCompletionDocs, {
    fields: [vendorPaymentRequests.workCompletionDocId],
    references: [workCompletionDocs.id],
  }),
}));

export const vendorPaymentStatusEnum = pgEnum('vendor_payment_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded'
]);

export const vendorPayments = pgTable("vendor_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => users.id).notNull(),
  paymentRequestId: varchar("payment_request_id").references(() => vendorPaymentRequests.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('usd'),
  status: vendorPaymentStatusEnum("status").notNull().default('pending'),
  stripePayoutId: varchar("stripe_payout_id"),
  failureReason: text("failure_reason"),
  description: text("description"),
  arrivalDate: timestamp("arrival_date"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertVendorPaymentSchema = createInsertSchema(vendorPayments).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});
export type InsertVendorPayment = z.infer<typeof insertVendorPaymentSchema>;
export type VendorPayment = typeof vendorPayments.$inferSelect;

export const vendorPaymentsRelations = relations(vendorPayments, ({ one }) => ({
  vendor: one(users, {
    fields: [vendorPayments.vendorId],
    references: [users.id],
  }),
  paymentRequest: one(vendorPaymentRequests, {
    fields: [vendorPayments.paymentRequestId],
    references: [vendorPaymentRequests.id],
  }),
}));

export const vendorTransactionTypeEnum = pgEnum('vendor_transaction_type', [
  'payment',
  'adjustment',
  'refund'
]);

export const vendorTransactions = pgTable("vendor_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => users.id).notNull(),
  type: vendorTransactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  vendorPaymentId: varchar("vendor_payment_id").references(() => vendorPayments.id),
  vendorPaymentRequestId: varchar("vendor_payment_request_id").references(() => vendorPaymentRequests.id),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVendorTransactionSchema = createInsertSchema(vendorTransactions).omit({
  id: true,
  createdAt: true,
});
export type InsertVendorTransaction = z.infer<typeof insertVendorTransactionSchema>;
export type VendorTransaction = typeof vendorTransactions.$inferSelect;

export const vendorTransactionsRelations = relations(vendorTransactions, ({ one }) => ({
  vendor: one(users, {
    fields: [vendorTransactions.vendorId],
    references: [users.id],
  }),
  payment: one(vendorPayments, {
    fields: [vendorTransactions.vendorPaymentId],
    references: [vendorPayments.id],
  }),
  paymentRequest: one(vendorPaymentRequests, {
    fields: [vendorTransactions.vendorPaymentRequestId],
    references: [vendorPaymentRequests.id],
  }),
}));

export const payoutStatusEnum = pgEnum('payout_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'canceled'
]);

export const payouts = pgTable("payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  landlordId: varchar("landlord_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('usd'),
  status: payoutStatusEnum("status").notNull().default('pending'),
  stripePayoutId: varchar("stripe_payout_id"),
  failureReason: text("failure_reason"),
  description: text("description"),
  arrivalDate: timestamp("arrival_date"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertPayoutSchema = createInsertSchema(payouts).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});
export type InsertPayout = z.infer<typeof insertPayoutSchema>;
export type Payout = typeof payouts.$inferSelect;

export const payoutsRelations = relations(payouts, ({ one }) => ({
  landlord: one(users, {
    fields: [payouts.landlordId],
    references: [users.id],
  }),
}));

// Listing Syndication
export const syndicationPlatformEnum = pgEnum('syndication_platform', [
  'zillow',
  'trulia',
  'hotpads',
  'apartmentsdotcom',
  'realtordotcom'
]);

export const syndicationStatusEnum = pgEnum('syndication_status', [
  'pending',
  'active',
  'paused',
  'error',
  'removed'
]);

export const listingSyndications = pgTable("listing_syndications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  unitId: varchar("unit_id").references(() => units.id).notNull(),
  platform: syndicationPlatformEnum("platform").notNull(),
  externalListingId: varchar("external_listing_id"),
  status: syndicationStatusEnum("status").notNull().default('pending'),
  lastSyncedAt: timestamp("last_synced_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertListingSyndicationSchema = createInsertSchema(listingSyndications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertListingSyndication = z.infer<typeof insertListingSyndicationSchema>;
export type ListingSyndication = typeof listingSyndications.$inferSelect;

export const listingSyndicationsRelations = relations(listingSyndications, ({ one }) => ({
  unit: one(units, {
    fields: [listingSyndications.unitId],
    references: [units.id],
  }),
}));

// QuickBooks Integration
export const quickbooksConnections = pgTable("quickbooks_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  realmId: varchar("realm_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  companyName: varchar("company_name"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQuickBooksConnectionSchema = createInsertSchema(quickbooksConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertQuickBooksConnection = z.infer<typeof insertQuickBooksConnectionSchema>;
export type QuickBooksConnection = typeof quickbooksConnections.$inferSelect;

export const quickbooksAccountMappings = pgTable("quickbooks_account_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").references(() => quickbooksConnections.id).notNull(),
  propertyFlowsCategory: varchar("propertyflows_category").notNull(),
  quickbooksAccountId: varchar("quickbooks_account_id").notNull(),
  quickbooksAccountName: varchar("quickbooks_account_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuickBooksAccountMappingSchema = createInsertSchema(quickbooksAccountMappings).omit({
  id: true,
  createdAt: true,
});
export type InsertQuickBooksAccountMapping = z.infer<typeof insertQuickBooksAccountMappingSchema>;
export type QuickBooksAccountMapping = typeof quickbooksAccountMappings.$inferSelect;

export const quickbooksConnectionsRelations = relations(quickbooksConnections, ({ one, many }) => ({
  user: one(users, {
    fields: [quickbooksConnections.userId],
    references: [users.id],
  }),
  accountMappings: many(quickbooksAccountMappings),
}));

export const quickbooksAccountMappingsRelations = relations(quickbooksAccountMappings, ({ one }) => ({
  connection: one(quickbooksConnections, {
    fields: [quickbooksAccountMappings.connectionId],
    references: [quickbooksConnections.id],
  }),
}));

export const conversationStatusEnum = pgEnum('conversation_status', ['active', 'archived', 'closed']);
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system']);

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title"),
  status: conversationStatusEnum("status").notNull().default('active'),
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export const conversationMessages = pgTable("conversation_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  userId: varchar("user_id").references(() => users.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConversationMessageSchema = createInsertSchema(conversationMessages).omit({
  id: true,
  createdAt: true,
});
export type InsertConversationMessage = z.infer<typeof insertConversationMessageSchema>;
export type ConversationMessage = typeof conversationMessages.$inferSelect;

export const conversationParticipants = pgTable("conversation_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants).omit({
  id: true,
  joinedAt: true,
});
export type InsertConversationParticipant = z.infer<typeof insertConversationParticipantSchema>;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;

export const aiArtifactTypeEnum = pgEnum('ai_artifact_type', [
  'lease_document',
  'communication_draft',
  'pricing_recommendation',
  'financial_forecast',
  'property_insight',
  'payment_plan',
  'screening_analysis',
  'document_analysis',
  'vendor_recommendation',
  'compliance_check'
]);

export const aiArtifacts = pgTable("ai_artifacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: aiArtifactTypeEnum("type").notNull(),
  entityType: varchar("entity_type"),
  entityId: varchar("entity_id"),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  approved: boolean("approved").default(false),
  approvedById: varchar("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiArtifactSchema = createInsertSchema(aiArtifacts).omit({
  id: true,
  createdAt: true,
});
export type InsertAiArtifact = z.infer<typeof insertAiArtifactSchema>;
export type AiArtifact = typeof aiArtifacts.$inferSelect;

export const aiRecommendations = pgTable("ai_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(),
  entityType: varchar("entity_type"),
  entityId: varchar("entity_id"),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  priority: varchar("priority").notNull(),
  actionData: jsonb("action_data"),
  status: varchar("status").notNull().default('pending'),
  implementedAt: timestamp("implemented_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiRecommendationSchema = createInsertSchema(aiRecommendations).omit({
  id: true,
  createdAt: true,
});
export type InsertAiRecommendation = z.infer<typeof insertAiRecommendationSchema>;
export type AiRecommendation = typeof aiRecommendations.$inferSelect;

export const aiAuditLogs = pgTable("ai_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: varchar("action").notNull(),
  entityType: varchar("entity_type"),
  entityId: varchar("entity_id"),
  prompt: text("prompt"),
  response: text("response"),
  metadata: jsonb("metadata"),
  tokensUsed: integer("tokens_used"),
  cost: decimal("cost", { precision: 10, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiAuditLogSchema = createInsertSchema(aiAuditLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertAiAuditLog = z.infer<typeof insertAiAuditLogSchema>;
export type AiAuditLog = typeof aiAuditLogs.$inferSelect;

// =============================================
// ADVANCED ACCOUNTING TABLES
// =============================================

// Chart of Accounts
export const accountTypeEnum = pgEnum('account_type', [
  'asset',
  'liability',
  'equity',
  'revenue',
  'expense'
]);

export const accountSubtypeEnum = pgEnum('account_subtype', [
  'cash',
  'accounts_receivable',
  'accounts_payable',
  'fixed_asset',
  'current_liability',
  'long_term_liability',
  'operating_income',
  'operating_expense',
  'other_income',
  'other_expense',
  'equity'
]);

export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountNumber: varchar("account_number").notNull().unique(),
  accountName: varchar("account_name").notNull(),
  accountType: accountTypeEnum("account_type").notNull(),
  accountSubtype: accountSubtypeEnum("account_subtype").notNull(),
  parentAccountId: varchar("parent_account_id"),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default('0'),
  isActive: boolean("is_active").notNull().default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertChartOfAccountsSchema = createInsertSchema(chartOfAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertChartOfAccounts = z.infer<typeof insertChartOfAccountsSchema>;
export type ChartOfAccounts = typeof chartOfAccounts.$inferSelect;

// Journal Entries (Double-Entry Bookkeeping)
export const journalEntryStatusEnum = pgEnum('journal_entry_status', [
  'draft',
  'posted',
  'voided'
]);

export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entryNumber: varchar("entry_number").notNull().unique(),
  entryDate: date("entry_date").notNull(),
  description: text("description").notNull(),
  propertyId: varchar("property_id").references(() => properties.id),
  status: journalEntryStatusEnum("status").notNull().default('draft'),
  totalDebit: decimal("total_debit", { precision: 15, scale: 2 }).notNull().default('0'),
  totalCredit: decimal("total_credit", { precision: 15, scale: 2 }).notNull().default('0'),
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  postedAt: timestamp("posted_at"),
  voidedAt: timestamp("voided_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;

// Journal Entry Line Items
export const journalEntryLineItems = pgTable("journal_entry_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  journalEntryId: varchar("journal_entry_id").references(() => journalEntries.id).notNull(),
  accountId: varchar("account_id").references(() => chartOfAccounts.id).notNull(),
  debitAmount: decimal("debit_amount", { precision: 15, scale: 2 }).notNull().default('0'),
  creditAmount: decimal("credit_amount", { precision: 15, scale: 2 }).notNull().default('0'),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJournalEntryLineItemSchema = createInsertSchema(journalEntryLineItems).omit({
  id: true,
  createdAt: true,
});
export type InsertJournalEntryLineItem = z.infer<typeof insertJournalEntryLineItemSchema>;
export type JournalEntryLineItem = typeof journalEntryLineItems.$inferSelect;

// Bank Accounts
export const bankAccounts = pgTable("bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountName: varchar("account_name").notNull(),
  bankName: varchar("bank_name").notNull(),
  accountNumber: varchar("account_number").notNull(),
  routingNumber: varchar("routing_number"),
  accountType: varchar("account_type").notNull(), // checking, savings
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default('0'),
  chartAccountId: varchar("chart_account_id").references(() => chartOfAccounts.id),
  propertyId: varchar("property_id").references(() => properties.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;

// Bank Transactions
export const bankTransactions = pgTable("bank_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bankAccountId: varchar("bank_account_id").references(() => bankAccounts.id).notNull(),
  transactionDate: date("transaction_date").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  transactionType: varchar("transaction_type").notNull(), // debit, credit
  category: varchar("category"),
  isReconciled: boolean("is_reconciled").notNull().default(false),
  reconciledAt: timestamp("reconciled_at"),
  journalEntryId: varchar("journal_entry_id").references(() => journalEntries.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBankTransactionSchema = createInsertSchema(bankTransactions).omit({
  id: true,
  createdAt: true,
});
export type InsertBankTransaction = z.infer<typeof insertBankTransactionSchema>;
export type BankTransaction = typeof bankTransactions.$inferSelect;

// Bank Reconciliations
export const reconciliationStatusEnum = pgEnum('reconciliation_status', [
  'in_progress',
  'completed',
  'locked'
]);

export const bankReconciliations = pgTable("bank_reconciliations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bankAccountId: varchar("bank_account_id").references(() => bankAccounts.id).notNull(),
  reconciliationDate: date("reconciliation_date").notNull(),
  statementBalance: decimal("statement_balance", { precision: 15, scale: 2 }).notNull(),
  bookBalance: decimal("book_balance", { precision: 15, scale: 2 }).notNull(),
  difference: decimal("difference", { precision: 15, scale: 2 }).notNull().default('0'),
  status: reconciliationStatusEnum("status").notNull().default('in_progress'),
  reconciledById: varchar("reconciled_by_id").references(() => users.id),
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBankReconciliationSchema = createInsertSchema(bankReconciliations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBankReconciliation = z.infer<typeof insertBankReconciliationSchema>;
export type BankReconciliation = typeof bankReconciliations.$inferSelect;

// Budgets
export const budgetPeriodEnum = pgEnum('budget_period', [
  'monthly',
  'quarterly',
  'annually'
]);

export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  propertyId: varchar("property_id").references(() => properties.id),
  accountId: varchar("account_id").references(() => chartOfAccounts.id).notNull(),
  budgetedAmount: decimal("budgeted_amount", { precision: 15, scale: 2 }).notNull(),
  actualAmount: decimal("actual_amount", { precision: 15, scale: 2 }).notNull().default('0'),
  variance: decimal("variance", { precision: 15, scale: 2 }).notNull().default('0'),
  period: budgetPeriodEnum("period").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

// Tax Forms (1099, W-9, etc.)
export const taxFormTypeEnum = pgEnum('tax_form_type', [
  'form_1099_misc',
  'form_1099_nec',
  'form_w9',
  'form_1098'
]);

export const taxForms = pgTable("tax_forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formType: taxFormTypeEnum("form_type").notNull(),
  taxYear: integer("tax_year").notNull(),
  recipientId: varchar("recipient_id").references(() => users.id).notNull(),
  propertyId: varchar("property_id").references(() => properties.id),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  formData: jsonb("form_data").notNull(),
  documentUrl: varchar("document_url"),
  submittedToIRS: boolean("submitted_to_irs").notNull().default(false),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTaxFormSchema = createInsertSchema(taxForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTaxForm = z.infer<typeof insertTaxFormSchema>;
export type TaxForm = typeof taxForms.$inferSelect;

// =============================================
// INTEGRATION MARKETPLACE TABLES
// =============================================

// Integration Categories
export const integrationCategories = pgTable("integration_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  icon: varchar("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIntegrationCategorySchema = createInsertSchema(integrationCategories).omit({
  id: true,
  createdAt: true,
});
export type InsertIntegrationCategory = z.infer<typeof insertIntegrationCategorySchema>;
export type IntegrationCategory = typeof integrationCategories.$inferSelect;

// Integrations
export const integrationStatusEnum = pgEnum('integration_status', [
  'active',
  'beta',
  'coming_soon',
  'deprecated'
]);

export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  categoryId: varchar("category_id").references(() => integrationCategories.id).notNull(),
  description: text("description").notNull(),
  longDescription: text("long_description"),
  logoUrl: varchar("logo_url"),
  websiteUrl: varchar("website_url"),
  documentationUrl: varchar("documentation_url"),
  status: integrationStatusEnum("status").notNull().default('active'),
  requiresAuth: boolean("requires_auth").notNull().default(true),
  authType: varchar("auth_type"), // oauth, api_key, basic
  isPopular: boolean("is_popular").notNull().default(false),
  installCount: integer("install_count").notNull().default(0),
  rating: decimal("rating", { precision: 2, scale: 1 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;

// Integration Connections (user-specific installations)
export const connectionStatusEnum = pgEnum('connection_status', [
  'active',
  'inactive',
  'error',
  'pending'
]);

export const integrationConnections = pgTable("integration_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationId: varchar("integration_id").references(() => integrations.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  propertyId: varchar("property_id").references(() => properties.id),
  status: connectionStatusEnum("status").notNull().default('active'),
  credentials: jsonb("credentials"), // encrypted
  settings: jsonb("settings"),
  lastSyncAt: timestamp("last_sync_at"),
  lastErrorAt: timestamp("last_error_at"),
  lastErrorMessage: text("last_error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIntegrationConnectionSchema = createInsertSchema(integrationConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIntegrationConnection = z.infer<typeof insertIntegrationConnectionSchema>;
export type IntegrationConnection = typeof integrationConnections.$inferSelect;

// Integration Events (webhook logs, sync history)
export const integrationEvents = pgTable("integration_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").references(() => integrationConnections.id).notNull(),
  eventType: varchar("event_type").notNull(),
  eventData: jsonb("event_data"),
  status: varchar("status").notNull(), // success, error, pending
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIntegrationEventSchema = createInsertSchema(integrationEvents).omit({
  id: true,
  createdAt: true,
});
export type InsertIntegrationEvent = z.infer<typeof insertIntegrationEventSchema>;
export type IntegrationEvent = typeof integrationEvents.$inferSelect;

// Onboarding Progress Tracking
export const onboardingStepEnum = pgEnum('onboarding_step', [
  'welcome',
  'add_property',
  'add_units',
  'setup_payments',
  'invite_team',
  'complete'
]);

export const onboardingProgress = pgTable("onboarding_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  currentStep: onboardingStepEnum("current_step").notNull().default('welcome'),
  completedSteps: jsonb("completed_steps").$type<string[]>().notNull().default([]),
  createdPropertyId: varchar("created_property_id"),
  skipped: boolean("skipped").notNull().default(false),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOnboardingProgressSchema = createInsertSchema(onboardingProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOnboardingProgress = z.infer<typeof insertOnboardingProgressSchema>;
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;

// Data Import System for migrations from competing software
export const importDataTypeEnum = pgEnum('import_data_type', [
  'properties',
  'units',
  'tenants',
  'leases',
  'vendors',
  'maintenance_requests',
  'transactions'
]);

export const importSourceEnum = pgEnum('import_source', [
  'appfolio',
  'buildium',
  'yardi',
  'rentmanager',
  'generic_csv'
]);

export const importStatusEnum = pgEnum('import_status', [
  'pending',
  'parsing',
  'validating',
  'importing',
  'completed',
  'failed',
  'rolled_back'
]);

// Import Jobs - tracks each bulk import operation
export const importJobs = pgTable("import_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  dataType: importDataTypeEnum("data_type").notNull(),
  source: importSourceEnum("source").notNull(),
  fileName: varchar("file_name").notNull(),
  filePath: text("file_path"),
  status: importStatusEnum("status").notNull().default('pending'),
  totalRows: integer("total_rows").default(0),
  processedRows: integer("processed_rows").default(0),
  successfulRows: integer("successful_rows").default(0),
  failedRows: integer("failed_rows").default(0),
  fieldMapping: jsonb("field_mapping").$type<Record<string, string>>(),
  validationErrors: jsonb("validation_errors").$type<Array<{row: number, field: string, error: string}>>(),
  importedData: jsonb("imported_data").$type<any[]>(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertImportJobSchema = createInsertSchema(importJobs).omit({
  id: true,
  createdAt: true,
});
export type InsertImportJob = z.infer<typeof insertImportJobSchema>;
export type ImportJob = typeof importJobs.$inferSelect;

// Field Mapping Templates - pre-configured mappings for different systems
export const fieldMappingTemplates = pgTable("field_mapping_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  source: importSourceEnum("source").notNull(),
  dataType: importDataTypeEnum("data_type").notNull(),
  mapping: jsonb("mapping").$type<Record<string, string>>().notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFieldMappingTemplateSchema = createInsertSchema(fieldMappingTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFieldMappingTemplate = z.infer<typeof insertFieldMappingTemplateSchema>;
export type FieldMappingTemplate = typeof fieldMappingTemplates.$inferSelect;

// Import Errors - detailed error logging
export const importErrors = pgTable("import_errors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  importJobId: varchar("import_job_id").references(() => importJobs.id).notNull(),
  rowNumber: integer("row_number").notNull(),
  fieldName: varchar("field_name"),
  errorType: varchar("error_type").notNull(),
  errorMessage: text("error_message").notNull(),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertImportErrorSchema = createInsertSchema(importErrors).omit({
  id: true,
  createdAt: true,
});
export type InsertImportError = z.infer<typeof insertImportErrorSchema>;
export type ImportError = typeof importErrors.$inferSelect;

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [conversations.createdById],
    references: [users.id],
  }),
  messages: many(conversationMessages),
  participants: many(conversationParticipants),
}));

export const conversationMessagesRelations = relations(conversationMessages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationMessages.conversationId],
    references: [conversations.id],
  }),
  user: one(users, {
    fields: [conversationMessages.userId],
    references: [users.id],
  }),
}));

export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationParticipants.conversationId],
    references: [conversations.id],
  }),
  user: one(users, {
    fields: [conversationParticipants.userId],
    references: [users.id],
  }),
}));
