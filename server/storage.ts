import {
  users,
  properties,
  propertyVendorAssignments,
  vendorDocuments,
  units,
  leases,
  maintenanceRequests,
  payments,
  paymentPlans,
  paymentInstallments,
  screenings,
  transactions,
  invitations,
  auditLogs,
  eSignatureLogs,
  smsPreferences,
  turnTasks,
  aiTriageResults,
  delinquencyPlaybooks,
  delinquencyActions,
  conversations,
  conversationMessages,
  conversationParticipants,
  aiAuditLogs,
  aiArtifacts,
  aiRecommendations,
  importJobs,
  importErrors,
  fieldMappingTemplates,
  type User,
  type UpsertUser,
  type Property,
  type InsertProperty,
  type PropertyVendorAssignment,
  type InsertPropertyVendorAssignment,
  type VendorDocument,
  type InsertVendorDocument,
  type Unit,
  type InsertUnit,
  type Lease,
  type InsertLease,
  type MaintenanceRequest,
  type InsertMaintenanceRequest,
  type Payment,
  type InsertPayment,
  type PaymentPlan,
  type InsertPaymentPlan,
  type PaymentInstallment,
  type InsertPaymentInstallment,
  type Screening,
  type InsertScreening,
  type Transaction,
  type InsertTransaction,
  type Invitation,
  type InsertInvitation,
  type AuditLog,
  type InsertAuditLog,
  type ESignatureLog,
  type InsertESignatureLog,
  type SmsPreferences,
  type InsertSmsPreferences,
  type TurnTask,
  type InsertTurnTask,
  type AiTriageResult,
  type InsertAiTriageResult,
  type DelinquencyPlaybook,
  type InsertDelinquencyPlaybook,
  type DelinquencyAction,
  type InsertDelinquencyAction,
  type Conversation,
  type InsertConversation,
  type ConversationMessage,
  type InsertConversationMessage,
  type AiAuditLog,
  type InsertAiAuditLog,
  type AiArtifact,
  type InsertAiArtifact,
  type ImportJob,
  type InsertImportJob,
  type ImportError,
  type InsertImportError,
  type FieldMappingTemplate,
  type InsertFieldMappingTemplate,
  type AiRecommendation,
  type InsertAiRecommendation,
  vendorBids,
  type VendorBid,
  type InsertVendorBid,
  workCompletionDocs,
  type WorkCompletionDoc,
  type InsertWorkCompletionDoc,
  vendorPaymentRequests,
  type VendorPaymentRequest,
  type InsertVendorPaymentRequest,
  vendorPayments,
  type VendorPayment,
  type InsertVendorPayment,
  vendorTransactions,
  type VendorTransaction,
  type InsertVendorTransaction,
  payouts,
  type Payout,
  type InsertPayout,
  quickbooksConnections,
  type QuickBooksConnection,
  type InsertQuickBooksConnection,
  quickbooksAccountMappings,
  type QuickBooksAccountMapping,
  type InsertQuickBooksAccountMapping,
  leaseRenewalPredictions,
  type LeaseRenewalPrediction,
  type InsertLeaseRenewalPrediction,
  unitInspections,
  type UnitInspection,
  type InsertUnitInspection,
  chartOfAccounts,
  type ChartOfAccounts,
  type InsertChartOfAccounts,
  journalEntries,
  type JournalEntry,
  type InsertJournalEntry,
  journalEntryLineItems,
  type JournalEntryLineItem,
  type InsertJournalEntryLineItem,
  bankAccounts,
  type BankAccount,
  type InsertBankAccount,
  integrations,
  type Integration,
  integrationCategories,
  type IntegrationCategory,
  integrationConnections,
  type IntegrationConnection,
  type InsertIntegrationConnection,
  onboardingProgress,
  type OnboardingProgress,
  type InsertOnboardingProgress,
  mfaSettings,
  type MfaSettings,
  type InsertMfaSettings,
  trustedDevices,
  type TrustedDevice,
  type InsertTrustedDevice,
  subscriptionPlans,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  organizations,
  type Organization,
  type InsertOrganization,
  businessVerificationLogs,
  type BusinessVerificationLog,
  type InsertBusinessVerificationLog,
  subscriptionHistory,
  type SubscriptionHistory,
  type InsertSubscriptionHistory,
  usageMetrics,
  type UsageMetrics,
  type InsertUsageMetrics,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql, inArray } from "drizzle-orm";
import logger from "./logger";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByRole(role?: string): Promise<User[]>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Property operations
  createProperty(property: InsertProperty): Promise<Property>;
  getProperty(id: string): Promise<Property | undefined>;
  getProperties(managerId?: string, ownerId?: string): Promise<Property[]>;
  updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property>;
  deleteProperty(id: string): Promise<void>;
  
  // Property Vendor Assignment operations
  createPropertyVendorAssignment(assignment: InsertPropertyVendorAssignment): Promise<PropertyVendorAssignment>;
  getAllPropertyVendorAssignments(): Promise<PropertyVendorAssignment[]>;
  getPropertyVendorAssignments(propertyId: string): Promise<PropertyVendorAssignment[]>;
  getVendorPropertiesAssignments(vendorId: string): Promise<PropertyVendorAssignment[]>;
  deletePropertyVendorAssignment(id: string): Promise<void>;
  
  // Vendor Document operations
  createVendorDocument(document: InsertVendorDocument): Promise<VendorDocument>;
  getVendorDocuments(vendorId: string): Promise<VendorDocument[]>;
  getVendorDocument(id: string): Promise<VendorDocument | undefined>;
  deleteVendorDocument(id: string): Promise<void>;
  
  // Unit operations
  createUnit(unit: InsertUnit): Promise<Unit>;
  getUnit(id: string): Promise<Unit | undefined>;
  getAllUnits(): Promise<Unit[]>;
  getUnitsByProperty(propertyId: string): Promise<Unit[]>;
  getUnitsByTenant(tenantId: string): Promise<Unit[]>;
  updateUnit(id: string, unit: Partial<InsertUnit>): Promise<Unit>;
  deleteUnit(id: string): Promise<void>;
  
  // Lease operations
  createLease(lease: InsertLease): Promise<Lease>;
  getLease(id: string): Promise<Lease | undefined>;
  getLeases(filters: { propertyId?: string; unitId?: string; status?: string }): Promise<Lease[]>;
  getLeasesByTenant(tenantId: string): Promise<Lease[]>;
  getLeasesByUnit(unitId: string): Promise<Lease[]>;
  getActiveLeaseByUnit(unitId: string): Promise<Lease | undefined>;
  updateLease(id: string, lease: Partial<InsertLease>): Promise<Lease>;
  
  // Maintenance operations
  createMaintenanceRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest>;
  getMaintenanceRequest(id: string): Promise<MaintenanceRequest | undefined>;
  getMaintenanceRequests(filters?: {
    unitId?: string;
    tenantId?: string;
    status?: string;
    priority?: string;
    assignedToId?: string;
  }): Promise<MaintenanceRequest[]>;
  updateMaintenanceRequest(id: string, request: Partial<InsertMaintenanceRequest>): Promise<MaintenanceRequest>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPayments(filters?: { leaseId?: string; tenantId?: string; status?: string }): Promise<Payment[]>;
  getPaymentsByLease(leaseId: string): Promise<Payment[]>;
  getPaymentsByTenant(tenantId: string): Promise<Payment[]>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment>;
  
  // Payment Plan operations
  createPaymentPlan(plan: InsertPaymentPlan): Promise<PaymentPlan>;
  getPaymentPlan(id: string): Promise<PaymentPlan | undefined>;
  getPaymentPlans(filters?: { leaseId?: string; tenantId?: string; status?: string }): Promise<PaymentPlan[]>;
  updatePaymentPlan(id: string, plan: Partial<InsertPaymentPlan>): Promise<PaymentPlan>;
  
  // Payment Installment operations
  createPaymentInstallment(installment: InsertPaymentInstallment): Promise<PaymentInstallment>;
  getPaymentInstallment(id: string): Promise<PaymentInstallment | undefined>;
  getPaymentInstallments(paymentPlanId: string): Promise<PaymentInstallment[]>;
  updatePaymentInstallment(id: string, installment: Partial<InsertPaymentInstallment>): Promise<PaymentInstallment>;
  
  // Screening operations
  createScreening(screening: InsertScreening): Promise<Screening>;
  getScreening(id: string): Promise<Screening | undefined>;
  getScreenings(filters?: { propertyId?: string; status?: string }): Promise<Screening[]>;
  getScreeningsByProperty(propertyId: string): Promise<Screening[]>;
  updateScreening(id: string, screening: Partial<InsertScreening>): Promise<Screening>;
  deleteScreening(id: string): Promise<void>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactions(filters?: { propertyId?: string; type?: string; startDate?: string; endDate?: string }): Promise<Transaction[]>;
  getTransactionsByProperty(propertyId: string, startDate?: string, endDate?: string): Promise<Transaction[]>;
  
  // Invitation operations
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  getInvitations(invitedBy: string): Promise<Invitation[]>;
  getInvitationByToken(token: string): Promise<Invitation | undefined>;
  getPendingInvitationByEmail(email: string): Promise<Invitation | undefined>;
  acceptInvitation(token: string): Promise<Invitation>;
  expireInvitation(id: string): Promise<void>;
  
  // Dashboard analytics
  getDashboardStats(managerId: string): Promise<{
    totalProperties: number;
    totalUnits: number;
    occupiedUnits: number;
    monthlyRevenue: number;
    openMaintenanceRequests: number;
  }>;
  
  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: { entityType?: string; entityId?: string; userId?: string }): Promise<AuditLog[]>;
  
  // E-signature log operations
  createESignatureLog(log: InsertESignatureLog): Promise<ESignatureLog>;
  getESignatureLogsByLease(leaseId: string): Promise<ESignatureLog[]>;
  
  // SMS preferences operations
  getSmsPreferences(userId: string): Promise<SmsPreferences | undefined>;
  upsertSmsPreferences(prefs: InsertSmsPreferences): Promise<SmsPreferences>;
  
  // Turn task operations
  createTurnTask(task: InsertTurnTask): Promise<TurnTask>;
  getTurnTask(id: string): Promise<TurnTask | undefined>;
  getTurnTasks(filters?: { unitId?: string; status?: string; assignedToId?: string }): Promise<TurnTask[]>;
  updateTurnTask(id: string, task: Partial<InsertTurnTask>): Promise<TurnTask>;
  
  // AI triage operations
  createAiTriageResult(result: InsertAiTriageResult): Promise<AiTriageResult>;
  getAiTriageResult(maintenanceRequestId: string): Promise<AiTriageResult | undefined>;
  
  // Delinquency playbook operations
  createDelinquencyPlaybook(playbook: InsertDelinquencyPlaybook): Promise<DelinquencyPlaybook>;
  getDelinquencyPlaybook(id: string): Promise<DelinquencyPlaybook | undefined>;
  getDelinquencyPlaybooks(filters?: { propertyId?: string; isActive?: boolean }): Promise<DelinquencyPlaybook[]>;
  updateDelinquencyPlaybook(id: string, playbook: Partial<InsertDelinquencyPlaybook>): Promise<DelinquencyPlaybook>;
  
  // Delinquency action operations
  createDelinquencyAction(action: InsertDelinquencyAction): Promise<DelinquencyAction>;
  getDelinquencyAction(id: string): Promise<DelinquencyAction | undefined>;
  getDelinquencyActions(filters?: { paymentId?: string; playbookId?: string; tenantId?: string }): Promise<DelinquencyAction[]>;
  updateDelinquencyAction(id: string, action: Partial<InsertDelinquencyAction>): Promise<DelinquencyAction>;
  
  // Vendor bid operations
  createVendorBid(bid: InsertVendorBid): Promise<VendorBid>;
  getVendorBid(id: string): Promise<VendorBid | undefined>;
  getVendorBids(filters?: { vendorId?: string; jobType?: string; jobId?: string; status?: string }): Promise<VendorBid[]>;
  updateVendorBid(id: string, bid: Partial<InsertVendorBid>): Promise<VendorBid>;
  
  // Work completion doc operations
  createWorkCompletionDoc(doc: InsertWorkCompletionDoc): Promise<WorkCompletionDoc>;
  getWorkCompletionDocs(filters?: { vendorId?: string; jobType?: string; jobId?: string }): Promise<WorkCompletionDoc[]>;
  
  // Vendor payment request operations
  createVendorPaymentRequest(request: InsertVendorPaymentRequest): Promise<VendorPaymentRequest>;
  getVendorPaymentRequest(id: string): Promise<VendorPaymentRequest | undefined>;
  getVendorPaymentRequests(filters?: { vendorId?: string; status?: string; jobType?: string }): Promise<VendorPaymentRequest[]>;
  updateVendorPaymentRequest(id: string, request: Partial<InsertVendorPaymentRequest>): Promise<VendorPaymentRequest>;
  
  // Vendor payment operations
  createVendorPayment(payment: InsertVendorPayment): Promise<VendorPayment>;
  getVendorPayment(id: string): Promise<VendorPayment | undefined>;
  getVendorPayments(filters?: { vendorId?: string; status?: string }): Promise<VendorPayment[]>;
  updateVendorPayment(id: string, payment: Partial<InsertVendorPayment>): Promise<VendorPayment>;
  
  // Vendor transaction operations
  createVendorTransaction(transaction: InsertVendorTransaction): Promise<VendorTransaction>;
  getVendorTransactions(filters?: { vendorId?: string; type?: string }): Promise<VendorTransaction[]>;
  
  // Payout operations
  createPayout(payout: InsertPayout): Promise<Payout>;
  getPayout(id: string): Promise<Payout | undefined>;
  getPayouts(filters?: { landlordId?: string; status?: string }): Promise<Payout[]>;
  updatePayout(id: string, payout: Partial<InsertPayout>): Promise<Payout>;
  
  // QuickBooks integration operations
  createQuickBooksConnection(connection: InsertQuickBooksConnection): Promise<QuickBooksConnection>;
  getQuickBooksConnection(userId: string): Promise<QuickBooksConnection | undefined>;
  updateQuickBooksConnection(id: string, connection: Partial<InsertQuickBooksConnection>): Promise<QuickBooksConnection>;
  deleteQuickBooksConnection(id: string): Promise<void>;
  
  createQuickBooksAccountMapping(mapping: InsertQuickBooksAccountMapping): Promise<QuickBooksAccountMapping>;
  getQuickBooksAccountMappings(connectionId: string): Promise<QuickBooksAccountMapping[]>;
  deleteQuickBooksAccountMapping(id: string): Promise<void>;
  
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationsByUser(userId: string): Promise<Conversation[]>;
  updateConversation(id: string, conversation: Partial<InsertConversation>): Promise<Conversation>;
  
  createConversationMessage(message: InsertConversationMessage): Promise<ConversationMessage>;
  getConversationMessages(conversationId: string): Promise<ConversationMessage[]>;
  
  createAiAuditLog(log: InsertAiAuditLog): Promise<AiAuditLog>;
  getAiAuditLogs(filters?: { userId?: string; action?: string }): Promise<AiAuditLog[]>;
  
  createAiArtifact(artifact: InsertAiArtifact): Promise<AiArtifact>;
  getAiArtifacts(filters?: { type?: string; entityType?: string; entityId?: string; createdById?: string }): Promise<AiArtifact[]>;
  updateAiArtifact(id: string, artifact: Partial<InsertAiArtifact>): Promise<AiArtifact>;
  
  createAiRecommendation(recommendation: InsertAiRecommendation): Promise<AiRecommendation>;
  getAiRecommendations(filters?: { type?: string; entityType?: string; entityId?: string; status?: string }): Promise<AiRecommendation[]>;
  updateAiRecommendation(id: string, recommendation: Partial<InsertAiRecommendation>): Promise<AiRecommendation>;
  
  // Chart of Accounts operations
  getChartOfAccounts(): Promise<ChartOfAccounts[]>;
  createChartOfAccount(account: InsertChartOfAccounts): Promise<ChartOfAccounts>;
  updateChartOfAccount(id: string, account: Partial<InsertChartOfAccounts>): Promise<ChartOfAccounts>;
  
  // Journal Entry operations
  getJournalEntries(): Promise<JournalEntry[]>;
  createJournalEntry(entry: InsertJournalEntry, lineItems: InsertJournalEntryLineItem[]): Promise<JournalEntry>;
  postJournalEntry(id: string): Promise<JournalEntry>;
  voidJournalEntry(id: string): Promise<JournalEntry>;
  getJournalEntryWithLineItems(id: string): Promise<{ entry: JournalEntry; lineItems: JournalEntryLineItem[] } | undefined>;
  
  // Bank Account operations
  getBankAccounts(): Promise<BankAccount[]>;
  
  // Integration operations
  getIntegrations(): Promise<Integration[]>;
  getIntegrationCategories(): Promise<IntegrationCategory[]>;
  getIntegrationConnections(userId: string): Promise<IntegrationConnection[]>;
  createIntegrationConnection(connection: InsertIntegrationConnection): Promise<IntegrationConnection>;
  deleteIntegrationConnection(id: string): Promise<void>;
  
  // Onboarding operations
  getOnboardingProgress(userId: string): Promise<OnboardingProgress | undefined>;
  createOnboardingProgress(progress: InsertOnboardingProgress): Promise<OnboardingProgress>;
  updateOnboardingProgress(userId: string, progress: Partial<InsertOnboardingProgress>): Promise<OnboardingProgress>;
  
  // MFA operations
  getMfaSettings(userId: string): Promise<MfaSettings | undefined>;
  createMfaSettings(settings: InsertMfaSettings): Promise<MfaSettings>;
  updateMfaSettings(userId: string, settings: Partial<InsertMfaSettings>): Promise<MfaSettings>;
  getTrustedDevice(userId: string, fingerprint: string): Promise<TrustedDevice | undefined>;
  createTrustedDevice(device: InsertTrustedDevice): Promise<TrustedDevice>;
  deleteTrustedDevice(id: string): Promise<void>;
  cleanupExpiredTrustedDevices(userId: string): Promise<void>;
  
  // Subscription Plan operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan>;
  deleteSubscriptionPlan(id: string): Promise<void>;
  
  // Organization operations
  getOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationByStripeCustomerId(stripeCustomerId: string): Promise<Organization | undefined>;
  getOrganizationByContactEmail(email: string): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, organization: Partial<InsertOrganization>): Promise<Organization>;
  updateOrganizationSubscription(id: string, subscriptionPlanId: string, status: string): Promise<Organization>;
  extendOrganizationTrial(id: string, days: number): Promise<Organization>;
  toggleOrganizationSuspension(id: string): Promise<Organization>;
  getOrganizationsForApproval(): Promise<Array<Organization & { latestLog?: BusinessVerificationLog }>>;
  approveOrganization(id: string, verifiedBy: string): Promise<Organization>;
  rejectOrganization(id: string, reason: string, verifiedBy: string): Promise<Organization>;
  
  // Business Verification Logs operations
  createBusinessVerificationLog(log: InsertBusinessVerificationLog): Promise<BusinessVerificationLog>;
  getBusinessVerificationLogs(organizationId: string): Promise<BusinessVerificationLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUserByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email))
      .limit(1);
    
    if (existingUserByEmail.length > 0 && existingUserByEmail[0].id !== userData.id) {
      const { id, ...updateData } = userData;
      const [updated] = await db
        .update(users)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(users.email, userData.email))
        .returning();
      return updated;
    }
    
    const { id, ...updateData } = userData;
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...updateData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsersByRole(role?: string): Promise<User[]> {
    if (role) {
      return await db.select().from(users).where(eq(users.role, role));
    }
    return await db.select().from(users);
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    // Delete related records in correct order to avoid foreign key constraint violations
    // Note: Only delete if user has no active leases (checked in route handler)
    
    // Get all payment plans for this user to delete their installments
    const userPaymentPlans = await db.select().from(paymentPlans).where(eq(paymentPlans.tenantId, id));
    for (const plan of userPaymentPlans) {
      await db.delete(paymentInstallments).where(eq(paymentInstallments.paymentPlanId, plan.id));
    }
    
    // Now delete payment plans and payments
    await db.delete(paymentPlans).where(eq(paymentPlans.tenantId, id));
    await db.delete(payments).where(eq(payments.tenantId, id));
    
    // Delete other tenant-related records
    await db.delete(maintenanceRequests).where(eq(maintenanceRequests.tenantId, id));
    await db.delete(screenings).where(eq(screenings.applicantId, id));
    await db.delete(delinquencyActions).where(eq(delinquencyActions.tenantId, id));
    await db.delete(leaseRenewalPredictions).where(eq(leaseRenewalPredictions.tenantId, id));
    await db.delete(unitInspections).where(eq(unitInspections.inspectorId, id));
    
    // Delete user-specific settings and logs
    await db.delete(auditLogs).where(eq(auditLogs.userId, id));
    await db.delete(eSignatureLogs).where(eq(eSignatureLogs.signedBy, id));
    await db.delete(smsPreferences).where(eq(smsPreferences.userId, id));
    await db.delete(mfaSettings).where(eq(mfaSettings.userId, id));
    await db.delete(trustedDevices).where(eq(trustedDevices.userId, id));
    await db.delete(conversationParticipants).where(eq(conversationParticipants.userId, id));
    await db.delete(quickbooksConnections).where(eq(quickbooksConnections.userId, id));
    await db.delete(integrationConnections).where(eq(integrationConnections.userId, id));
    await db.delete(onboardingProgress).where(eq(onboardingProgress.userId, id));
    await db.delete(aiAuditLogs).where(eq(aiAuditLogs.userId, id));
    
    // Delete leases (should already be terminated, but clean up anyway)
    await db.delete(leases).where(eq(leases.tenantId, id));
    
    // Finally delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  // Property operations
  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await db.insert(properties).values(property).returning();
    return newProperty;
  }

  async getProperty(id: string): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async getProperties(managerId?: string, ownerId?: string): Promise<Property[]> {
    let query = db.select().from(properties);
    
    if (managerId) {
      query = query.where(eq(properties.managerId, managerId)) as any;
    } else if (ownerId) {
      query = query.where(eq(properties.ownerId, ownerId)) as any;
    }
    
    return await query;
  }

  async updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property> {
    const [updated] = await db
      .update(properties)
      .set({ ...property, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return updated;
  }

  async deleteProperty(id: string): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
  }

  // Property Vendor Assignment operations
  async createPropertyVendorAssignment(assignment: InsertPropertyVendorAssignment): Promise<PropertyVendorAssignment> {
    const [newAssignment] = await db.insert(propertyVendorAssignments).values(assignment).returning();
    return newAssignment;
  }

  async getAllPropertyVendorAssignments(): Promise<PropertyVendorAssignment[]> {
    return await db.select().from(propertyVendorAssignments);
  }

  async getPropertyVendorAssignments(propertyId: string): Promise<PropertyVendorAssignment[]> {
    return await db.select().from(propertyVendorAssignments).where(eq(propertyVendorAssignments.propertyId, propertyId));
  }

  async getVendorPropertiesAssignments(vendorId: string): Promise<PropertyVendorAssignment[]> {
    return await db.select().from(propertyVendorAssignments).where(eq(propertyVendorAssignments.vendorId, vendorId));
  }

  async deletePropertyVendorAssignment(id: string): Promise<void> {
    await db.delete(propertyVendorAssignments).where(eq(propertyVendorAssignments.id, id));
  }

  // Vendor Document operations
  async createVendorDocument(document: InsertVendorDocument): Promise<VendorDocument> {
    const [newDocument] = await db.insert(vendorDocuments).values(document).returning();
    return newDocument;
  }

  async getVendorDocuments(vendorId: string): Promise<VendorDocument[]> {
    return await db.select().from(vendorDocuments).where(eq(vendorDocuments.vendorId, vendorId)).orderBy(desc(vendorDocuments.createdAt));
  }

  async getVendorDocument(id: string): Promise<VendorDocument | undefined> {
    const [document] = await db.select().from(vendorDocuments).where(eq(vendorDocuments.id, id));
    return document;
  }

  async deleteVendorDocument(id: string): Promise<void> {
    await db.delete(vendorDocuments).where(eq(vendorDocuments.id, id));
  }

  // Unit operations
  async createUnit(unit: InsertUnit): Promise<Unit> {
    const [newUnit] = await db.insert(units).values(unit).returning();
    return newUnit;
  }

  async getUnit(id: string): Promise<Unit | undefined> {
    const [unit] = await db.select().from(units).where(eq(units.id, id));
    return unit;
  }

  async getAllUnits(): Promise<Unit[]> {
    return await db.select().from(units);
  }

  async getUnitsByProperty(propertyId: string): Promise<Unit[]> {
    return await db.select().from(units).where(eq(units.propertyId, propertyId));
  }

  async getUnitsByTenant(tenantId: string): Promise<Unit[]> {
    // Get units where the tenant has an active lease
    const activeLeases = await db
      .select()
      .from(leases)
      .where(
        and(
          eq(leases.tenantId, tenantId),
          eq(leases.status, 'active')
        )
      );
    
    const unitIds = activeLeases.map(lease => lease.unitId);
    if (unitIds.length === 0) {
      return [];
    }

    const tenantUnits = await db
      .select()
      .from(units)
      .where(inArray(units.id, unitIds));
    
    return tenantUnits;
  }

  async updateUnit(id: string, unit: Partial<InsertUnit>): Promise<Unit> {
    const [updated] = await db
      .update(units)
      .set({ ...unit, updatedAt: new Date() })
      .where(eq(units.id, id))
      .returning();
    return updated;
  }

  async deleteUnit(id: string): Promise<void> {
    await db.delete(units).where(eq(units.id, id));
  }

  // Lease operations
  async createLease(lease: InsertLease): Promise<Lease> {
    const [newLease] = await db.insert(leases).values(lease).returning();
    return newLease;
  }

  async getLease(id: string): Promise<Lease | undefined> {
    const [lease] = await db.select().from(leases).where(eq(leases.id, id));
    return lease;
  }

  async getLeases(filters: { propertyId?: string; unitId?: string; status?: string }): Promise<Lease[]> {
    let query = db.select().from(leases);
    const conditions = [];

    if (filters.unitId) conditions.push(eq(leases.unitId, filters.unitId));
    if (filters.status) conditions.push(eq(leases.status, filters.status));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    let allLeases = await query.orderBy(desc(leases.createdAt));

    // Filter by propertyId if provided (requires joining with units)
    if (filters.propertyId) {
      const propertyUnits = await this.getUnitsByProperty(filters.propertyId);
      const unitIds = new Set(propertyUnits.map(u => u.id));
      allLeases = allLeases.filter(lease => unitIds.has(lease.unitId));
    }

    return allLeases;
  }

  async getLeasesByTenant(tenantId: string): Promise<Lease[]> {
    return await db.select().from(leases).where(eq(leases.tenantId, tenantId)).orderBy(desc(leases.createdAt));
  }

  async getLeasesByUnit(unitId: string): Promise<Lease[]> {
    return await db.select().from(leases).where(eq(leases.unitId, unitId)).orderBy(desc(leases.createdAt));
  }

  async getActiveLeaseByUnit(unitId: string): Promise<Lease | undefined> {
    const [lease] = await db
      .select()
      .from(leases)
      .where(and(eq(leases.unitId, unitId), eq(leases.status, 'active')))
      .limit(1);
    return lease;
  }

  async updateLease(id: string, lease: Partial<InsertLease>): Promise<Lease> {
    const [updated] = await db
      .update(leases)
      .set({ ...lease, updatedAt: new Date() })
      .where(eq(leases.id, id))
      .returning();
    return updated;
  }

  // Maintenance operations
  async createMaintenanceRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest> {
    const [newRequest] = await db.insert(maintenanceRequests).values(request).returning();
    return newRequest;
  }

  async getMaintenanceRequest(id: string): Promise<MaintenanceRequest | undefined> {
    const [request] = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, id));
    return request;
  }

  async getMaintenanceRequests(filters?: {
    unitId?: string;
    tenantId?: string;
    status?: string;
    priority?: string;
    assignedToId?: string;
  }): Promise<MaintenanceRequest[]> {
    let query = db.select().from(maintenanceRequests);
    const conditions = [];

    if (filters?.unitId) conditions.push(eq(maintenanceRequests.unitId, filters.unitId));
    if (filters?.tenantId) conditions.push(eq(maintenanceRequests.tenantId, filters.tenantId));
    if (filters?.status) conditions.push(eq(maintenanceRequests.status, filters.status as any));
    if (filters?.priority) conditions.push(eq(maintenanceRequests.priority, filters.priority as any));
    if (filters?.assignedToId) conditions.push(eq(maintenanceRequests.assignedToId, filters.assignedToId));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(maintenanceRequests.createdAt));
  }

  async updateMaintenanceRequest(id: string, request: Partial<InsertMaintenanceRequest>): Promise<MaintenanceRequest> {
    const [updated] = await db
      .update(maintenanceRequests)
      .set({ ...request, updatedAt: new Date() })
      .where(eq(maintenanceRequests.id, id))
      .returning();
    return updated;
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPayments(filters?: { leaseId?: string; tenantId?: string; status?: string }): Promise<Payment[]> {
    let query = db.select().from(payments);
    const conditions = [];
    
    if (filters?.leaseId) {
      conditions.push(eq(payments.leaseId, filters.leaseId));
    }
    if (filters?.tenantId) {
      conditions.push(eq(payments.tenantId, filters.tenantId));
    }
    if (filters?.status) {
      conditions.push(eq(payments.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(payments.createdAt));
  }

  async getPaymentsByLease(leaseId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.leaseId, leaseId)).orderBy(desc(payments.createdAt));
  }

  async getPaymentsByTenant(tenantId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.tenantId, tenantId)).orderBy(desc(payments.createdAt));
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment> {
    const [updated] = await db
      .update(payments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  // Payment Plan operations
  async createPaymentPlan(plan: InsertPaymentPlan): Promise<PaymentPlan> {
    const [newPlan] = await db.insert(paymentPlans).values(plan).returning();
    return newPlan;
  }

  async getPaymentPlan(id: string): Promise<PaymentPlan | undefined> {
    const [plan] = await db.select().from(paymentPlans).where(eq(paymentPlans.id, id));
    return plan;
  }

  async getPaymentPlans(filters?: { leaseId?: string; tenantId?: string; status?: string }): Promise<PaymentPlan[]> {
    let query = db.select().from(paymentPlans);
    const conditions = [];
    
    if (filters?.leaseId) {
      conditions.push(eq(paymentPlans.leaseId, filters.leaseId));
    }
    if (filters?.tenantId) {
      conditions.push(eq(paymentPlans.tenantId, filters.tenantId));
    }
    if (filters?.status) {
      conditions.push(eq(paymentPlans.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(paymentPlans.createdAt));
  }

  async updatePaymentPlan(id: string, plan: Partial<InsertPaymentPlan>): Promise<PaymentPlan> {
    const [updated] = await db
      .update(paymentPlans)
      .set({ ...plan, updatedAt: new Date() })
      .where(eq(paymentPlans.id, id))
      .returning();
    return updated;
  }

  // Payment Installment operations
  async createPaymentInstallment(installment: InsertPaymentInstallment): Promise<PaymentInstallment> {
    const [newInstallment] = await db.insert(paymentInstallments).values(installment).returning();
    return newInstallment;
  }

  async getPaymentInstallment(id: string): Promise<PaymentInstallment | undefined> {
    const [installment] = await db.select().from(paymentInstallments).where(eq(paymentInstallments.id, id));
    return installment;
  }

  async getPaymentInstallments(paymentPlanId: string): Promise<PaymentInstallment[]> {
    return await db
      .select()
      .from(paymentInstallments)
      .where(eq(paymentInstallments.paymentPlanId, paymentPlanId))
      .orderBy(paymentInstallments.installmentNumber);
  }

  async updatePaymentInstallment(id: string, installment: Partial<InsertPaymentInstallment>): Promise<PaymentInstallment> {
    const [updated] = await db
      .update(paymentInstallments)
      .set({ ...installment, updatedAt: new Date() })
      .where(eq(paymentInstallments.id, id))
      .returning();
    return updated;
  }

  // Screening operations
  async createScreening(screening: InsertScreening): Promise<Screening> {
    const [newScreening] = await db.insert(screenings).values(screening).returning();
    return newScreening;
  }

  async getScreening(id: string): Promise<Screening | undefined> {
    const [screening] = await db.select().from(screenings).where(eq(screenings.id, id));
    return screening;
  }

  async getScreenings(filters?: { propertyId?: string; status?: string }): Promise<Screening[]> {
    let query = db.select().from(screenings);
    const conditions = [];
    
    if (filters?.propertyId) {
      conditions.push(eq(screenings.propertyId, filters.propertyId));
    }
    if (filters?.status) {
      conditions.push(eq(screenings.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(screenings.createdAt));
  }

  async getScreeningsByProperty(propertyId: string): Promise<Screening[]> {
    return await db.select().from(screenings).where(eq(screenings.propertyId, propertyId)).orderBy(desc(screenings.createdAt));
  }

  async updateScreening(id: string, screening: Partial<InsertScreening>): Promise<Screening> {
    const [updated] = await db
      .update(screenings)
      .set({ ...screening, updatedAt: new Date() })
      .where(eq(screenings.id, id))
      .returning();
    return updated;
  }

  async deleteScreening(id: string): Promise<void> {
    await db.delete(screenings).where(eq(screenings.id, id));
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async getTransactions(filters?: { propertyId?: string; type?: string; startDate?: string; endDate?: string }): Promise<Transaction[]> {
    let query = db.select().from(transactions);
    const conditions = [];
    
    if (filters?.propertyId) {
      conditions.push(eq(transactions.propertyId, filters.propertyId));
    }
    if (filters?.type) {
      conditions.push(eq(transactions.type, filters.type));
    }
    if (filters?.startDate) {
      conditions.push(gte(transactions.date, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(transactions.date, filters.endDate));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(transactions.date));
  }

  async getTransactionsByProperty(propertyId: string, startDate?: string, endDate?: string): Promise<Transaction[]> {
    const conditions = [eq(transactions.propertyId, propertyId)];

    if (startDate) {
      conditions.push(gte(transactions.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(transactions.date, endDate));
    }

    return await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date));
  }

  // Dashboard analytics
  async getDashboardStats(managerId: string): Promise<{
    totalProperties: number;
    totalUnits: number;
    occupiedUnits: number;
    monthlyRevenue: number;
    openMaintenanceRequests: number;
  }> {
    const propertiesList = await this.getProperties(managerId);
    const totalProperties = propertiesList.length;

    let totalUnits = 0;
    let occupiedUnits = 0;
    let monthlyRevenue = 0;
    let openMaintenanceCount = 0;

    for (const property of propertiesList) {
      const propertyUnits = await this.getUnitsByProperty(property.id);
      totalUnits += propertyUnits.length;

      for (const unit of propertyUnits) {
        if (unit.status === 'occupied') {
          occupiedUnits++;
          monthlyRevenue += parseFloat(unit.monthlyRent || '0');
        }
      }

      const maintenanceReqs = await db
        .select()
        .from(maintenanceRequests)
        .where(
          and(
            sql`${maintenanceRequests.unitId} IN (SELECT id FROM ${units} WHERE ${units.propertyId} = ${property.id})`,
            sql`${maintenanceRequests.status} IN ('open', 'assigned', 'in_progress')`
          )
        );
      openMaintenanceCount += maintenanceReqs.length;
    }

    return {
      totalProperties,
      totalUnits,
      occupiedUnits,
      monthlyRevenue,
      openMaintenanceRequests: openMaintenanceCount,
    };
  }

  // Invitation operations
  async createInvitation(invitation: InsertInvitation): Promise<Invitation> {
    const [newInvitation] = await db.insert(invitations).values(invitation).returning();
    return newInvitation;
  }

  async getInvitations(invitedBy: string): Promise<Invitation[]> {
    return await db
      .select()
      .from(invitations)
      .where(eq(invitations.invitedBy, invitedBy))
      .orderBy(desc(invitations.createdAt));
  }

  async getInvitationByToken(token: string): Promise<Invitation | undefined> {
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token));
    return invitation;
  }

  async getPendingInvitationByEmail(email: string): Promise<Invitation | undefined> {
    const normalizedEmail = email.toLowerCase();
    const results = await db
      .select()
      .from(invitations)
      .where(and(
        sql`LOWER(${invitations.email}) = ${normalizedEmail}`,
        eq(invitations.status, 'pending')
      ));
    
    if (results.length > 0) {
      logger.info(`Found pending invitation for ${normalizedEmail}`, { id: results[0].id, role: results[0].role });
    } else {
      logger.info(`No pending invitation found for ${normalizedEmail}`);
    }
    
    return results[0];
  }

  async acceptInvitation(token: string): Promise<Invitation> {
    const [accepted] = await db
      .update(invitations)
      .set({ status: 'accepted' })
      .where(eq(invitations.token, token))
      .returning();
    return accepted;
  }

  async expireInvitation(id: string): Promise<void> {
    await db
      .update(invitations)
      .set({ status: 'expired' })
      .where(eq(invitations.id, id));
  }
  
  // Audit log operations
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }
  
  async getAuditLogs(filters?: { entityType?: string; entityId?: string; userId?: string }): Promise<AuditLog[]> {
    const conditions = [];
    if (filters?.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType as any));
    if (filters?.entityId) conditions.push(eq(auditLogs.entityId, filters.entityId));
    if (filters?.userId) conditions.push(eq(auditLogs.userId, filters.userId));
    
    return await db
      .select()
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt));
  }
  
  // E-signature log operations
  async createESignatureLog(log: InsertESignatureLog): Promise<ESignatureLog> {
    const [newLog] = await db.insert(eSignatureLogs).values(log).returning();
    return newLog;
  }
  
  async getESignatureLogsByLease(leaseId: string): Promise<ESignatureLog[]> {
    return await db
      .select()
      .from(eSignatureLogs)
      .where(eq(eSignatureLogs.leaseId, leaseId))
      .orderBy(desc(eSignatureLogs.signedAt));
  }
  
  // SMS preferences operations
  async getSmsPreferences(userId: string): Promise<SmsPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(smsPreferences)
      .where(eq(smsPreferences.userId, userId));
    return prefs;
  }
  
  async upsertSmsPreferences(prefs: InsertSmsPreferences): Promise<SmsPreferences> {
    const [upserted] = await db
      .insert(smsPreferences)
      .values(prefs)
      .onConflictDoUpdate({
        target: smsPreferences.userId,
        set: {
          ...prefs,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }
  
  // Turn task operations
  async createTurnTask(task: InsertTurnTask): Promise<TurnTask> {
    const [newTask] = await db.insert(turnTasks).values(task).returning();
    return newTask;
  }
  
  async getTurnTask(id: string): Promise<TurnTask | undefined> {
    const [task] = await db.select().from(turnTasks).where(eq(turnTasks.id, id));
    return task;
  }
  
  async getTurnTasks(filters?: { unitId?: string; status?: string; assignedToId?: string }): Promise<TurnTask[]> {
    const conditions = [];
    if (filters?.unitId) conditions.push(eq(turnTasks.unitId, filters.unitId));
    if (filters?.status) conditions.push(eq(turnTasks.status, filters.status as any));
    if (filters?.assignedToId) conditions.push(eq(turnTasks.assignedToId, filters.assignedToId));
    
    return await db
      .select()
      .from(turnTasks)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(turnTasks.createdAt));
  }
  
  async updateTurnTask(id: string, task: Partial<InsertTurnTask>): Promise<TurnTask> {
    const [updated] = await db
      .update(turnTasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(turnTasks.id, id))
      .returning();
    return updated;
  }
  
  // AI triage operations
  async createAiTriageResult(result: InsertAiTriageResult): Promise<AiTriageResult> {
    const [newResult] = await db.insert(aiTriageResults).values(result).returning();
    return newResult;
  }
  
  async getAiTriageResult(maintenanceRequestId: string): Promise<AiTriageResult | undefined> {
    const [result] = await db
      .select()
      .from(aiTriageResults)
      .where(eq(aiTriageResults.maintenanceRequestId, maintenanceRequestId))
      .orderBy(desc(aiTriageResults.createdAt))
      .limit(1);
    return result;
  }
  
  // Delinquency playbook operations
  async createDelinquencyPlaybook(playbook: InsertDelinquencyPlaybook): Promise<DelinquencyPlaybook> {
    const [newPlaybook] = await db.insert(delinquencyPlaybooks).values(playbook).returning();
    return newPlaybook;
  }
  
  async getDelinquencyPlaybook(id: string): Promise<DelinquencyPlaybook | undefined> {
    const [playbook] = await db.select().from(delinquencyPlaybooks).where(eq(delinquencyPlaybooks.id, id));
    return playbook;
  }
  
  async getDelinquencyPlaybooks(filters?: { propertyId?: string; isActive?: boolean }): Promise<DelinquencyPlaybook[]> {
    const conditions = [];
    if (filters?.propertyId) conditions.push(eq(delinquencyPlaybooks.propertyId, filters.propertyId));
    if (filters?.isActive !== undefined) conditions.push(eq(delinquencyPlaybooks.isActive, filters.isActive));
    
    return await db
      .select()
      .from(delinquencyPlaybooks)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(delinquencyPlaybooks.createdAt));
  }
  
  async updateDelinquencyPlaybook(id: string, playbook: Partial<InsertDelinquencyPlaybook>): Promise<DelinquencyPlaybook> {
    const [updated] = await db
      .update(delinquencyPlaybooks)
      .set({ ...playbook, updatedAt: new Date() })
      .where(eq(delinquencyPlaybooks.id, id))
      .returning();
    return updated;
  }
  
  // Delinquency action operations
  async createDelinquencyAction(action: InsertDelinquencyAction): Promise<DelinquencyAction> {
    const [newAction] = await db.insert(delinquencyActions).values(action).returning();
    return newAction;
  }
  
  async getDelinquencyAction(id: string): Promise<DelinquencyAction | undefined> {
    const [action] = await db.select().from(delinquencyActions).where(eq(delinquencyActions.id, id));
    return action;
  }
  
  async getDelinquencyActions(filters?: { paymentId?: string; playbookId?: string; tenantId?: string }): Promise<DelinquencyAction[]> {
    const conditions = [];
    if (filters?.paymentId) conditions.push(eq(delinquencyActions.paymentId, filters.paymentId));
    if (filters?.playbookId) conditions.push(eq(delinquencyActions.playbookId, filters.playbookId));
    if (filters?.tenantId) conditions.push(eq(delinquencyActions.tenantId, filters.tenantId));
    
    return await db
      .select()
      .from(delinquencyActions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(delinquencyActions.createdAt));
  }
  
  async updateDelinquencyAction(id: string, action: Partial<InsertDelinquencyAction>): Promise<DelinquencyAction> {
    const [updated] = await db
      .update(delinquencyActions)
      .set({ ...action, updatedAt: new Date() })
      .where(eq(delinquencyActions.id, id))
      .returning();
    return updated;
  }
  
  // Lease renewal prediction operations
  async createLeaseRenewalPrediction(prediction: InsertLeaseRenewalPrediction): Promise<LeaseRenewalPrediction> {
    const [newPrediction] = await db.insert(leaseRenewalPredictions).values(prediction).returning();
    return newPrediction;
  }
  
  async getLeaseRenewalPrediction(leaseId: string): Promise<LeaseRenewalPrediction | undefined> {
    const [prediction] = await db
      .select()
      .from(leaseRenewalPredictions)
      .where(eq(leaseRenewalPredictions.leaseId, leaseId))
      .orderBy(desc(leaseRenewalPredictions.createdAt))
      .limit(1);
    return prediction;
  }
  
  async updateLeaseRenewalPrediction(id: string, prediction: Partial<InsertLeaseRenewalPrediction>): Promise<LeaseRenewalPrediction> {
    const [updated] = await db
      .update(leaseRenewalPredictions)
      .set({ ...prediction, updatedAt: new Date() })
      .where(eq(leaseRenewalPredictions.id, id))
      .returning();
    return updated;
  }
  
  // Unit inspection operations
  async createUnitInspection(inspection: InsertUnitInspection): Promise<UnitInspection> {
    const [newInspection] = await db.insert(unitInspections).values(inspection).returning();
    return newInspection;
  }
  
  async getUnitInspection(id: string): Promise<UnitInspection | undefined> {
    const [inspection] = await db.select().from(unitInspections).where(eq(unitInspections.id, id));
    return inspection;
  }
  
  async getUnitInspections(filters?: { unitId?: string; inspectionType?: string; leaseId?: string }): Promise<UnitInspection[]> {
    const conditions = [];
    if (filters?.unitId) conditions.push(eq(unitInspections.unitId, filters.unitId));
    if (filters?.inspectionType) conditions.push(eq(unitInspections.inspectionType, filters.inspectionType as any));
    if (filters?.leaseId) conditions.push(eq(unitInspections.leaseId, filters.leaseId));
    
    return await db
      .select()
      .from(unitInspections)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(unitInspections.inspectionDate));
  }
  
  async updateUnitInspection(id: string, inspection: Partial<InsertUnitInspection>): Promise<UnitInspection> {
    const [updated] = await db
      .update(unitInspections)
      .set({ ...inspection, updatedAt: new Date() })
      .where(eq(unitInspections.id, id))
      .returning();
    return updated;
  }
  
  // Vendor bid operations
  async createVendorBid(bid: InsertVendorBid): Promise<VendorBid> {
    const [newBid] = await db.insert(vendorBids).values(bid).returning();
    return newBid;
  }
  
  async getVendorBid(id: string): Promise<VendorBid | undefined> {
    const [bid] = await db.select().from(vendorBids).where(eq(vendorBids.id, id));
    return bid;
  }
  
  async getVendorBids(filters?: { vendorId?: string; jobType?: string; jobId?: string; status?: string }): Promise<VendorBid[]> {
    const conditions = [];
    if (filters?.vendorId) conditions.push(eq(vendorBids.vendorId, filters.vendorId));
    if (filters?.jobType) conditions.push(eq(vendorBids.jobType, filters.jobType as any));
    if (filters?.jobId) conditions.push(eq(vendorBids.jobId, filters.jobId));
    if (filters?.status) conditions.push(eq(vendorBids.status, filters.status as any));
    
    return await db
      .select()
      .from(vendorBids)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(vendorBids.createdAt));
  }
  
  async updateVendorBid(id: string, bid: Partial<InsertVendorBid>): Promise<VendorBid> {
    const [updated] = await db
      .update(vendorBids)
      .set({ ...bid, updatedAt: new Date() })
      .where(eq(vendorBids.id, id))
      .returning();
    return updated;
  }
  
  // Work completion doc operations
  async createWorkCompletionDoc(doc: InsertWorkCompletionDoc): Promise<WorkCompletionDoc> {
    const [newDoc] = await db.insert(workCompletionDocs).values(doc).returning();
    return newDoc;
  }
  
  async getWorkCompletionDocs(filters?: { vendorId?: string; jobType?: string; jobId?: string }): Promise<WorkCompletionDoc[]> {
    const conditions = [];
    if (filters?.vendorId) conditions.push(eq(workCompletionDocs.vendorId, filters.vendorId));
    if (filters?.jobType) conditions.push(eq(workCompletionDocs.jobType, filters.jobType as any));
    if (filters?.jobId) conditions.push(eq(workCompletionDocs.jobId, filters.jobId));
    
    return await db
      .select()
      .from(workCompletionDocs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(workCompletionDocs.submittedAt));
  }
  
  // Vendor payment request operations
  async createVendorPaymentRequest(request: InsertVendorPaymentRequest): Promise<VendorPaymentRequest> {
    const [newRequest] = await db.insert(vendorPaymentRequests).values(request).returning();
    return newRequest;
  }
  
  async getVendorPaymentRequest(id: string): Promise<VendorPaymentRequest | undefined> {
    const [request] = await db.select().from(vendorPaymentRequests).where(eq(vendorPaymentRequests.id, id));
    return request;
  }
  
  async getVendorPaymentRequests(filters?: { vendorId?: string; status?: string; jobType?: string }): Promise<VendorPaymentRequest[]> {
    const conditions = [];
    if (filters?.vendorId) conditions.push(eq(vendorPaymentRequests.vendorId, filters.vendorId));
    if (filters?.status) conditions.push(eq(vendorPaymentRequests.status, filters.status as any));
    if (filters?.jobType) conditions.push(eq(vendorPaymentRequests.jobType, filters.jobType as any));
    
    return await db
      .select()
      .from(vendorPaymentRequests)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(vendorPaymentRequests.createdAt));
  }
  
  async updateVendorPaymentRequest(id: string, request: Partial<InsertVendorPaymentRequest>): Promise<VendorPaymentRequest> {
    const [updated] = await db
      .update(vendorPaymentRequests)
      .set({ ...request, updatedAt: new Date() })
      .where(eq(vendorPaymentRequests.id, id))
      .returning();
    return updated;
  }
  
  // Vendor payment operations
  async createVendorPayment(payment: InsertVendorPayment): Promise<VendorPayment> {
    const [newPayment] = await db.insert(vendorPayments).values(payment).returning();
    return newPayment;
  }
  
  async getVendorPayment(id: string): Promise<VendorPayment | undefined> {
    const [payment] = await db.select().from(vendorPayments).where(eq(vendorPayments.id, id));
    return payment;
  }
  
  async getVendorPayments(filters?: { vendorId?: string; status?: string }): Promise<VendorPayment[]> {
    const conditions = [];
    if (filters?.vendorId) conditions.push(eq(vendorPayments.vendorId, filters.vendorId));
    if (filters?.status) conditions.push(eq(vendorPayments.status, filters.status as any));
    
    return await db
      .select()
      .from(vendorPayments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(vendorPayments.createdAt));
  }
  
  async updateVendorPayment(id: string, payment: Partial<InsertVendorPayment>): Promise<VendorPayment> {
    const [updated] = await db
      .update(vendorPayments)
      .set({ ...payment, completedAt: payment.status === 'completed' ? new Date() : undefined })
      .where(eq(vendorPayments.id, id))
      .returning();
    return updated;
  }
  
  // Vendor transaction operations
  async createVendorTransaction(transaction: InsertVendorTransaction): Promise<VendorTransaction> {
    const [newTransaction] = await db.insert(vendorTransactions).values(transaction).returning();
    return newTransaction;
  }
  
  async getVendorTransactions(filters?: { vendorId?: string; type?: string }): Promise<VendorTransaction[]> {
    const conditions = [];
    if (filters?.vendorId) conditions.push(eq(vendorTransactions.vendorId, filters.vendorId));
    if (filters?.type) conditions.push(eq(vendorTransactions.type, filters.type as any));
    
    return await db
      .select()
      .from(vendorTransactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(vendorTransactions.date));
  }
  
  // Payout operations
  async createPayout(payout: InsertPayout): Promise<Payout> {
    const [newPayout] = await db.insert(payouts).values(payout).returning();
    return newPayout;
  }
  
  async getPayout(id: string): Promise<Payout | undefined> {
    const [payout] = await db.select().from(payouts).where(eq(payouts.id, id));
    return payout;
  }
  
  async getPayouts(filters?: { landlordId?: string; status?: string }): Promise<Payout[]> {
    const conditions = [];
    if (filters?.landlordId) conditions.push(eq(payouts.landlordId, filters.landlordId));
    if (filters?.status) conditions.push(eq(payouts.status, filters.status as any));
    
    return await db
      .select()
      .from(payouts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(payouts.createdAt));
  }
  
  async updatePayout(id: string, payout: Partial<InsertPayout>): Promise<Payout> {
    const [updated] = await db
      .update(payouts)
      .set({ ...payout, completedAt: payout.status === 'completed' ? new Date() : undefined })
      .where(eq(payouts.id, id))
      .returning();
    return updated;
  }
  
  // QuickBooks integration operations
  async createQuickBooksConnection(connection: InsertQuickBooksConnection): Promise<QuickBooksConnection> {
    const [newConnection] = await db.insert(quickbooksConnections).values(connection).returning();
    return newConnection;
  }
  
  async getQuickBooksConnection(userId: string): Promise<QuickBooksConnection | undefined> {
    const [connection] = await db
      .select()
      .from(quickbooksConnections)
      .where(and(
        eq(quickbooksConnections.userId, userId),
        eq(quickbooksConnections.isActive, true)
      ));
    return connection;
  }
  
  async updateQuickBooksConnection(id: string, connection: Partial<InsertQuickBooksConnection>): Promise<QuickBooksConnection> {
    const [updated] = await db
      .update(quickbooksConnections)
      .set({ ...connection, updatedAt: new Date() })
      .where(eq(quickbooksConnections.id, id))
      .returning();
    return updated;
  }
  
  async deleteQuickBooksConnection(id: string): Promise<void> {
    await db.delete(quickbooksConnections).where(eq(quickbooksConnections.id, id));
  }
  
  async createQuickBooksAccountMapping(mapping: InsertQuickBooksAccountMapping): Promise<QuickBooksAccountMapping> {
    const [newMapping] = await db.insert(quickbooksAccountMappings).values(mapping).returning();
    return newMapping;
  }
  
  async getQuickBooksAccountMappings(connectionId: string): Promise<QuickBooksAccountMapping[]> {
    return await db
      .select()
      .from(quickbooksAccountMappings)
      .where(eq(quickbooksAccountMappings.connectionId, connectionId));
  }
  
  async deleteQuickBooksAccountMapping(id: string): Promise<void> {
    await db.delete(quickbooksAccountMappings).where(eq(quickbooksAccountMappings.id, id));
  }
  
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [created] = await db.insert(conversations).values(conversation).returning();
    return created;
  }
  
  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }
  
  async getConversationsByUser(userId: string): Promise<Conversation[]> {
    return db.select().from(conversations).where(eq(conversations.createdById, userId)).orderBy(desc(conversations.lastMessageAt));
  }
  
  async updateConversation(id: string, conversation: Partial<InsertConversation>): Promise<Conversation> {
    const [updated] = await db.update(conversations).set(conversation).where(eq(conversations.id, id)).returning();
    return updated;
  }
  
  async createConversationMessage(message: InsertConversationMessage): Promise<ConversationMessage> {
    const now = new Date();
    const [created] = await db.insert(conversationMessages).values({
      ...message,
      createdAt: now,
    }).returning();
    
    await db.update(conversations)
      .set({ lastMessageAt: now })
      .where(eq(conversations.id, message.conversationId));
    
    return created;
  }
  
  async getConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
    return db.select().from(conversationMessages).where(eq(conversationMessages.conversationId, conversationId)).orderBy(conversationMessages.createdAt);
  }
  
  async createAiAuditLog(log: InsertAiAuditLog): Promise<AiAuditLog> {
    const [created] = await db.insert(aiAuditLogs).values(log).returning();
    return created;
  }
  
  async getAiAuditLogs(filters?: { userId?: string; action?: string }): Promise<AiAuditLog[]> {
    let query = db.select().from(aiAuditLogs);
    
    if (filters?.userId) {
      query = query.where(eq(aiAuditLogs.userId, filters.userId));
    }
    if (filters?.action) {
      query = query.where(eq(aiAuditLogs.action, filters.action));
    }
    
    return query.orderBy(desc(aiAuditLogs.createdAt));
  }
  
  async createAiArtifact(artifact: InsertAiArtifact): Promise<AiArtifact> {
    const [created] = await db.insert(aiArtifacts).values(artifact).returning();
    return created;
  }
  
  async getAiArtifacts(filters?: { type?: string; entityType?: string; entityId?: string; createdById?: string }): Promise<AiArtifact[]> {
    let query = db.select().from(aiArtifacts);
    
    if (filters?.type) {
      query = query.where(eq(aiArtifacts.type, filters.type as any));
    }
    if (filters?.entityType) {
      query = query.where(eq(aiArtifacts.entityType, filters.entityType));
    }
    if (filters?.entityId) {
      query = query.where(eq(aiArtifacts.entityId, filters.entityId));
    }
    if (filters?.createdById) {
      query = query.where(eq(aiArtifacts.createdById, filters.createdById));
    }
    
    return query.orderBy(desc(aiArtifacts.createdAt));
  }
  
  async updateAiArtifact(id: string, artifact: Partial<InsertAiArtifact>): Promise<AiArtifact> {
    const [updated] = await db.update(aiArtifacts).set(artifact).where(eq(aiArtifacts.id, id)).returning();
    return updated;
  }
  
  async createAiRecommendation(recommendation: InsertAiRecommendation): Promise<AiRecommendation> {
    const [created] = await db.insert(aiRecommendations).values(recommendation).returning();
    return created;
  }
  
  async getAiRecommendations(filters?: { type?: string; entityType?: string; entityId?: string; status?: string }): Promise<AiRecommendation[]> {
    let query = db.select().from(aiRecommendations);
    
    if (filters?.type) {
      query = query.where(eq(aiRecommendations.type, filters.type));
    }
    if (filters?.entityType) {
      query = query.where(eq(aiRecommendations.entityType, filters.entityType));
    }
    if (filters?.entityId) {
      query = query.where(eq(aiRecommendations.entityId, filters.entityId));
    }
    if (filters?.status) {
      query = query.where(eq(aiRecommendations.status, filters.status));
    }
    
    return query.orderBy(desc(aiRecommendations.createdAt));
  }
  
  async updateAiRecommendation(id: string, recommendation: Partial<InsertAiRecommendation>): Promise<AiRecommendation> {
    const [updated] = await db.update(aiRecommendations).set(recommendation).where(eq(aiRecommendations.id, id)).returning();
    return updated;
  }

  async getChartOfAccounts(userId?: string): Promise<ChartOfAccounts[]> {
    if (userId) {
      return db.select().from(chartOfAccounts)
        .where(eq(chartOfAccounts.userId, userId))
        .orderBy(chartOfAccounts.accountNumber);
    }
    return db.select().from(chartOfAccounts).orderBy(chartOfAccounts.accountNumber);
  }

  async createChartOfAccount(account: InsertChartOfAccounts): Promise<ChartOfAccounts> {
    const [created] = await db.insert(chartOfAccounts).values(account).returning();
    return created;
  }

  async updateChartOfAccount(id: string, account: Partial<InsertChartOfAccounts>, userId?: string): Promise<ChartOfAccounts | null> {
    const whereConditions = userId 
      ? and(eq(chartOfAccounts.id, id), eq(chartOfAccounts.userId, userId))
      : eq(chartOfAccounts.id, id);
    
    const [updated] = await db.update(chartOfAccounts)
      .set(account)
      .where(whereConditions)
      .returning();
    
    return updated || null;
  }

  async getJournalEntries(userId?: string): Promise<JournalEntry[]> {
    if (userId) {
      return db.select().from(journalEntries)
        .where(eq(journalEntries.createdById, userId))
        .orderBy(desc(journalEntries.entryDate));
    }
    return db.select().from(journalEntries).orderBy(desc(journalEntries.entryDate));
  }

  async createJournalEntry(entry: InsertJournalEntry, lineItems: InsertJournalEntryLineItem[]): Promise<JournalEntry> {
    const totalDebit = lineItems.reduce((sum, item) => sum + parseFloat(item.debitAmount), 0);
    const totalCredit = lineItems.reduce((sum, item) => sum + parseFloat(item.creditAmount), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error('Journal entry must be balanced: total debits must equal total credits');
    }
    
    const [createdEntry] = await db.insert(journalEntries).values({
      ...entry,
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
    }).returning();
    
    await db.insert(journalEntryLineItems).values(
      lineItems.map(item => ({
        ...item,
        journalEntryId: createdEntry.id,
      }))
    );
    
    return createdEntry;
  }

  async postJournalEntry(id: string): Promise<JournalEntry> {
    const [posted] = await db.update(journalEntries)
      .set({ status: 'posted', postedAt: new Date() })
      .where(eq(journalEntries.id, id))
      .returning();
    return posted;
  }

  async voidJournalEntry(id: string): Promise<JournalEntry> {
    const [voided] = await db.update(journalEntries)
      .set({ status: 'voided', voidedAt: new Date() })
      .where(eq(journalEntries.id, id))
      .returning();
    return voided;
  }

  async getJournalEntryWithLineItems(id: string): Promise<{ entry: JournalEntry; lineItems: JournalEntryLineItem[] } | undefined> {
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    if (!entry) return undefined;
    
    const lineItems = await db.select().from(journalEntryLineItems).where(eq(journalEntryLineItems.journalEntryId, id));
    return { entry, lineItems };
  }

  async getBankAccounts(userId?: string): Promise<BankAccount[]> {
    if (userId) {
      return db.select().from(bankAccounts)
        .where(and(eq(bankAccounts.isActive, true), eq(bankAccounts.userId, userId)));
    }
    return db.select().from(bankAccounts).where(eq(bankAccounts.isActive, true));
  }

  async createBankAccount(account: InsertBankAccount): Promise<BankAccount> {
    const [created] = await db.insert(bankAccounts).values({
      ...account,
      isActive: true,
    }).returning();
    return created;
  }

  async getIntegrations(): Promise<Integration[]> {
    return db.select().from(integrations).orderBy(integrations.installCount);
  }

  async getIntegrationCategories(): Promise<IntegrationCategory[]> {
    return db.select().from(integrationCategories).orderBy(integrationCategories.sortOrder);
  }

  async getIntegrationConnections(userId: string): Promise<IntegrationConnection[]> {
    return db.select().from(integrationConnections).where(eq(integrationConnections.userId, userId));
  }

  async createIntegrationConnection(connection: InsertIntegrationConnection): Promise<IntegrationConnection> {
    const [created] = await db.insert(integrationConnections).values(connection).returning();
    return created;
  }

  async deleteIntegrationConnection(id: string): Promise<void> {
    await db.delete(integrationConnections).where(eq(integrationConnections.id, id));
  }

  async getOnboardingProgress(userId: string): Promise<OnboardingProgress | undefined> {
    const [progress] = await db.select().from(onboardingProgress).where(eq(onboardingProgress.userId, userId));
    return progress;
  }

  async createOnboardingProgress(progress: InsertOnboardingProgress): Promise<OnboardingProgress> {
    const [created] = await db.insert(onboardingProgress).values(progress).returning();
    return created;
  }

  async updateOnboardingProgress(userId: string, progressData: Partial<InsertOnboardingProgress>): Promise<OnboardingProgress> {
    const [updated] = await db.update(onboardingProgress)
      .set({ ...progressData, updatedAt: new Date() })
      .where(eq(onboardingProgress.userId, userId))
      .returning();
    return updated;
  }

  async getMfaSettings(userId: string): Promise<MfaSettings | undefined> {
    const [settings] = await db.select().from(mfaSettings).where(eq(mfaSettings.userId, userId));
    return settings;
  }

  async createMfaSettings(settings: InsertMfaSettings): Promise<MfaSettings> {
    const [created] = await db.insert(mfaSettings).values(settings).returning();
    return created;
  }

  async updateMfaSettings(userId: string, settingsData: Partial<InsertMfaSettings>): Promise<MfaSettings> {
    const [updated] = await db.update(mfaSettings)
      .set({ ...settingsData, updatedAt: new Date() })
      .where(eq(mfaSettings.userId, userId))
      .returning();
    return updated;
  }

  async getTrustedDevice(userId: string, fingerprint: string): Promise<TrustedDevice | undefined> {
    const [device] = await db.select().from(trustedDevices)
      .where(and(
        eq(trustedDevices.userId, userId),
        eq(trustedDevices.deviceFingerprint, fingerprint),
        gte(trustedDevices.expiresAt, new Date())
      ));
    return device;
  }

  async getTrustedDevices(userId: string): Promise<TrustedDevice[]> {
    return await db.select().from(trustedDevices)
      .where(and(
        eq(trustedDevices.userId, userId),
        gte(trustedDevices.expiresAt, new Date())
      ));
  }

  async createTrustedDevice(device: InsertTrustedDevice): Promise<TrustedDevice> {
    const [created] = await db.insert(trustedDevices).values(device).returning();
    return created;
  }

  async deleteTrustedDevice(id: string): Promise<void> {
    await db.delete(trustedDevices).where(eq(trustedDevices.id, id));
  }

  async revokeTrustedDevice(id: number): Promise<void> {
    await db.delete(trustedDevices).where(eq(trustedDevices.id, id));
  }

  async cleanupExpiredTrustedDevices(userId: string): Promise<void> {
    await db.delete(trustedDevices)
      .where(and(
        eq(trustedDevices.userId, userId),
        lte(trustedDevices.expiresAt, new Date())
      ));
  }

  // Import Job Management
  async createImportJob(job: InsertImportJob): Promise<ImportJob> {
    const [created] = await db.insert(importJobs).values(job).returning();
    return created;
  }

  async getImportJob(id: string): Promise<ImportJob | undefined> {
    const [job] = await db.select().from(importJobs).where(eq(importJobs.id, id));
    return job;
  }

  async getImportJobs(userId: string): Promise<ImportJob[]> {
    return db.select().from(importJobs)
      .where(eq(importJobs.userId, userId))
      .orderBy(desc(importJobs.createdAt));
  }

  async updateImportJob(id: string, updates: Partial<InsertImportJob>): Promise<ImportJob> {
    const [updated] = await db.update(importJobs)
      .set(updates)
      .where(eq(importJobs.id, id))
      .returning();
    return updated;
  }

  async deleteImportJob(id: string): Promise<void> {
    await db.delete(importJobs).where(eq(importJobs.id, id));
  }

  // Import Errors
  async createImportError(error: InsertImportError): Promise<ImportError> {
    const [created] = await db.insert(importErrors).values(error).returning();
    return created;
  }

  async getImportErrors(jobId: string): Promise<ImportError[]> {
    return db.select().from(importErrors)
      .where(eq(importErrors.importJobId, jobId))
      .orderBy(importErrors.rowNumber);
  }

  // Field Mapping Templates
  async createFieldMappingTemplate(template: InsertFieldMappingTemplate): Promise<FieldMappingTemplate> {
    const [created] = await db.insert(fieldMappingTemplates).values(template).returning();
    return created;
  }

  async getFieldMappingTemplates(source: string, dataType: string): Promise<FieldMappingTemplate[]> {
    return db.select().from(fieldMappingTemplates)
      .where(and(
        eq(fieldMappingTemplates.source, source),
        eq(fieldMappingTemplates.dataType, dataType)
      ));
  }

  async getDefaultFieldMappingTemplate(source: string, dataType: string): Promise<FieldMappingTemplate | undefined> {
    const [template] = await db.select().from(fieldMappingTemplates)
      .where(and(
        eq(fieldMappingTemplates.source, source),
        eq(fieldMappingTemplates.dataType, dataType),
        eq(fieldMappingTemplates.isDefault, true)
      ));
    return template;
  }

  // Helper method to get units by property
  async getUnits(propertyId: string): Promise<Unit[]> {
    return db.select().from(units).where(eq(units.propertyId, propertyId));
  }

  // Subscription Plan operations
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return db.select().from(subscriptionPlans).orderBy(subscriptionPlans.price);
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [created] = await db.insert(subscriptionPlans).values(plan).returning();
    return created;
  }

  async updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan> {
    const [updated] = await db.update(subscriptionPlans)
      .set({ ...plan, updatedAt: new Date() })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updated;
  }

  async deleteSubscriptionPlan(id: string): Promise<void> {
    await db.delete(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
  }

  // Organization operations
  async getOrganizations(): Promise<Organization[]> {
    return db.select().from(organizations).orderBy(desc(organizations.createdAt));
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations)
      .where(eq(organizations.id, id));
    return org;
  }

  async getOrganizationByStripeCustomerId(stripeCustomerId: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations)
      .where(eq(organizations.stripeCustomerId, stripeCustomerId));
    return org;
  }

  async getOrganizationByContactEmail(email: string): Promise<Organization | undefined> {
    const normalizedEmail = email.toLowerCase();
    const results = await db.select().from(organizations)
      .where(sql`LOWER(${organizations.contactEmail}) = ${normalizedEmail}`);
    
    if (results.length > 0) {
      logger.info(`Found organization for ${normalizedEmail}`, { id: results[0].id, name: results[0].name });
    } else {
      logger.info(`No organization found for ${normalizedEmail}`);
    }
    
    return results[0];
  }

  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const [created] = await db.insert(organizations).values(organization).returning();
    return created;
  }

  async updateOrganization(id: string, organization: Partial<InsertOrganization>): Promise<Organization> {
    const [updated] = await db.update(organizations)
      .set({ ...organization, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updated;
  }

  async updateOrganizationSubscription(
    id: string,
    subscriptionPlanId: string,
    status: string
  ): Promise<Organization> {
    const [updated] = await db.update(organizations)
      .set({
        subscriptionPlanId,
        status: status as any,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning();
    return updated;
  }

  async extendOrganizationTrial(id: string, days: number): Promise<Organization> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    if (!org) {
      throw new Error('Organization not found');
    }

    const currentTrialEnd = org.trialEndsAt || new Date();
    const newTrialEnd = new Date(currentTrialEnd);
    newTrialEnd.setDate(newTrialEnd.getDate() + days);

    const [updated] = await db.update(organizations)
      .set({
        trialEndsAt: newTrialEnd,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning();
    return updated;
  }

  async toggleOrganizationSuspension(id: string): Promise<Organization> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    if (!org) {
      throw new Error('Organization not found');
    }

    const newStatus = org.status === 'canceled' ? 'active' : 'canceled';
    
    const [updated] = await db.update(organizations)
      .set({
        status: newStatus as any,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning();
    return updated;
  }

  async createBusinessVerificationLog(log: InsertBusinessVerificationLog): Promise<BusinessVerificationLog> {
    const [created] = await db.insert(businessVerificationLogs).values(log).returning();
    return created;
  }

  async getBusinessVerificationLogs(organizationId: string): Promise<BusinessVerificationLog[]> {
    return db.select().from(businessVerificationLogs)
      .where(eq(businessVerificationLogs.organizationId, organizationId))
      .orderBy(desc(businessVerificationLogs.createdAt));
  }

  async getOrganizationsForApproval(): Promise<Array<Organization & { latestLog?: BusinessVerificationLog }>> {
    const orgs = await db.select().from(organizations)
      .where(
        sql`${organizations.verificationStatus} IN ('pending', 'manual_review')`
      )
      .orderBy(desc(organizations.createdAt));

    const result = [];
    for (const org of orgs) {
      const [log] = await db.select().from(businessVerificationLogs)
        .where(eq(businessVerificationLogs.organizationId, org.id!))
        .orderBy(desc(businessVerificationLogs.createdAt))
        .limit(1);
      
      result.push({ ...org, latestLog: log });
    }

    return result;
  }

  async approveOrganization(id: string, verifiedBy: string): Promise<Organization> {
    const [updated] = await db.update(organizations)
      .set({
        verificationStatus: 'approved',
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning();

    await db.insert(businessVerificationLogs).values({
      organizationId: id,
      verificationType: 'manual_review',
      status: 'approved',
      provider: 'admin',
      verifiedBy,
      notes: 'Manually approved by admin',
      metadata: {},
    });

    return updated;
  }

  async rejectOrganization(id: string, reason: string, verifiedBy: string): Promise<Organization> {
    const [updated] = await db.update(organizations)
      .set({
        verificationStatus: 'rejected',
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning();

    await db.insert(businessVerificationLogs).values({
      organizationId: id,
      verificationType: 'manual_review',
      status: 'rejected',
      provider: 'admin',
      verifiedBy,
      notes: reason,
      metadata: {},
    });

    return updated;
  }
}

export const storage = new DatabaseStorage();
