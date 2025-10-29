# PropertyFlows Subscription Management System - Design Outline

## Overview
This document outlines the implementation of a multi-tier subscription system for PropertyFlows, enabling self-service user registration, free trials, and plan management.

---

## 1. Database Schema

### 1.1 Subscription Plans Table (`subscription_plans`)
```typescript
{
  id: varchar (uuid)
  name: string                    // "Starter", "Professional", "Enterprise"
  displayName: string             // "PropertyFlows Starter"
  description: text
  price: decimal                  // Monthly price in cents
  billingInterval: enum           // "monthly", "annual"
  trialDays: integer              // e.g., 14 days
  isActive: boolean               // Can users subscribe?
  stripePriceId: string          // Stripe Price ID
  stripeProductId: string        // Stripe Product ID
  features: jsonb                 // Feature flags and limits
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Feature Limits Structure (JSONB):**
```json
{
  "maxProperties": 5,           // -1 for unlimited
  "maxUnits": 50,
  "maxTenants": 100,
  "maxPropertyManagers": 1,
  "maxOwners": 5,
  "maxVendors": 10,
  "maxStorage": 5368709120,     // 5GB in bytes
  "features": {
    "aiMaintenance": true,
    "fairHousing": false,
    "bulkImport": false,
    "quickbooksSync": false,
    "advancedReporting": false,
    "whiteLabel": false,
    "apiAccess": false,
    "prioritySupport": false,
    "smsNotifications": true,
    "eSignatures": true,
    "multiCurrency": false,
    "vendorPortal": true,
    "ownerPortal": true
  }
}
```

### 1.2 Organization/Account Table (`organizations`)
```typescript
{
  id: varchar (uuid)
  name: string                    // Company/Organization name
  adminUserId: varchar            // Primary admin (creator)
  subscriptionPlanId: varchar     // Current plan
  stripeCustomerId: string        // Stripe Customer ID
  stripeSubscriptionId: string    // Stripe Subscription ID
  status: enum                    // "trialing", "active", "past_due", "canceled", "unpaid"
  trialEndsAt: timestamp
  currentPeriodStart: timestamp
  currentPeriodEnd: timestamp
  cancelAtPeriodEnd: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 1.3 Update Users Table
Add organization reference:
```typescript
users.organizationId: varchar   // Link users to organization
users.isOrgAdmin: boolean       // Can manage org settings & billing
```

### 1.4 Subscription History Table (`subscription_history`)
Track all subscription changes:
```typescript
{
  id: varchar (uuid)
  organizationId: varchar
  fromPlanId: varchar
  toPlanId: varchar
  reason: string                  // "upgrade", "downgrade", "canceled", "trial_ended"
  changedBy: varchar              // userId
  stripeEventId: string           // Webhook event ID
  effectiveDate: timestamp
  createdAt: timestamp
}
```

### 1.5 Usage Tracking Table (`usage_metrics`)
Monitor feature usage against limits:
```typescript
{
  id: varchar (uuid)
  organizationId: varchar
  metricType: string              // "properties", "units", "storage", "api_calls"
  currentValue: integer
  lastCalculated: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## 2. Subscription Plans & Pricing

### 2.1 Starter Plan
- **Price:** $49/month
- **Trial:** 14 days free
- **Limits:**
  - 5 properties
  - 50 units
  - 100 tenants
  - 1 property manager
  - 5 owners
  - 10 vendors
  - 5GB storage
- **Features:**
  - ✓ Tenant & Lease Management
  - ✓ Basic Maintenance Tracking
  - ✓ Online Rent Payments (ACH/Card)
  - ✓ Owner & Tenant Portals
  - ✓ SMS Notifications (50/month)
  - ✓ E-Signatures (10/month)
  - ✓ Basic Reporting
  - ✗ AI-Powered Features
  - ✗ QuickBooks Integration
  - ✗ Bulk Import/Export
  - ✗ Advanced Analytics

### 2.2 Professional Plan
- **Price:** $149/month
- **Trial:** 14 days free
- **Limits:**
  - 25 properties
  - 500 units
  - 1,000 tenants
  - 5 property managers
  - Unlimited owners
  - Unlimited vendors
  - 50GB storage
- **Features:**
  - ✓ Everything in Starter
  - ✓ AI Maintenance Triage
  - ✓ Fair Housing Compliance AI
  - ✓ QuickBooks Online Sync
  - ✓ Bulk Import/Export
  - ✓ Advanced Reporting & Analytics
  - ✓ Vendor Portal & Bidding
  - ✓ SMS Notifications (500/month)
  - ✓ Unlimited E-Signatures
  - ✓ Multi-Currency Support
  - ✗ White Label
  - ✗ API Access
  - ✗ Priority Support

### 2.3 Enterprise Plan
- **Price:** Custom (starting at $499/month)
- **Trial:** 30 days free with onboarding
- **Limits:**
  - Unlimited properties
  - Unlimited units
  - Unlimited users
  - Unlimited storage
- **Features:**
  - ✓ Everything in Professional
  - ✓ White Label Branding
  - ✓ REST API Access
  - ✓ Custom Integrations
  - ✓ Dedicated Account Manager
  - ✓ Priority Support (24/7)
  - ✓ Custom Contracts & SLAs
  - ✓ Advanced Security & Compliance
  - ✓ Unlimited SMS & E-Signatures
  - ✓ DocuSign Integration
  - ✓ Custom Workflows

---

## 3. User Registration & Onboarding Flow

### 3.1 Public Registration Flow (New)
**Goal:** Allow anyone to sign up and start a free trial

**Steps:**
1. **Landing Page (`/`)** - Public marketing site
   - Hero section with value proposition
   - Pricing table with 3 tiers
   - "Start Free Trial" CTA buttons

2. **Sign Up Page (`/signup`)**
   - User provides:
     - Email address
     - Password (or use Replit Auth social login)
     - First name, Last name
     - Company/Organization name
   - Select subscription plan (defaults to Starter)
   - Agree to Terms & Privacy Policy
   - No credit card required for trial

3. **Email Verification**
   - Send verification email via Resend
   - User clicks link to verify

4. **Organization Setup**
   - Create Organization record
   - Set user as organization admin
   - Create trial subscription (14 days)
   - Initialize usage metrics at 0

5. **Onboarding Wizard (`/onboarding`)**
   - Existing 6-step wizard guides setup
   - Add welcome step explaining trial

6. **Dashboard Access**
   - User lands in property manager dashboard
   - Trial banner shows days remaining
   - Full feature access during trial

### 3.2 Trial Expiration Flow
**7 Days Before:**
- Email: "Your trial ends in 7 days"
- In-app banner: "Upgrade now to continue"

**3 Days Before:**
- Email: "3 days left in your trial"
- More prominent in-app prompts

**Day of Expiration:**
- If no payment method: Account enters "grace period" (3 days)
- Limited read-only access
- Prominent upgrade prompt

**After Grace Period:**
- Account suspended
- Data retained for 30 days
- User can reactivate by subscribing

---

## 4. Super Admin Interface

### 4.1 Subscription Plans Management (`/admin/subscription-plans`)
**Access:** Only users with `role: 'admin'` AND `isSuperAdmin: true`

**Features:**
- **View All Plans** (Table)
  - Name, Price, Trial Days, Status, # of Subscribers
  - Quick toggle Active/Inactive

- **Create New Plan**
  - Form with all plan details
  - Feature limit configuration UI
  - Stripe product/price creation
  - Preview pricing card

- **Edit Existing Plan**
  - Update pricing (creates new Stripe price)
  - Modify limits and features
  - Affects new subscriptions only
  - Option to migrate existing subscribers

- **Archive Plan**
  - Soft delete - hide from public
  - Existing subscribers unaffected
  - Cannot be selected for new subscriptions

**UI Components:**
- DataTable with sorting/filtering
- Plan configuration modal
- Feature matrix editor (checkboxes + limit inputs)
- Pricing calculator
- Subscriber list per plan

### 4.2 Organization Management (`/admin/organizations`)
**View All Organizations:**
- Table showing:
  - Organization name
  - Admin email
  - Current plan
  - Status (active/trialing/past_due/canceled)
  - Trial expiration
  - Created date
  - # of users
  - # of properties
  
**Organization Actions:**
- View details
- Change subscription plan (manual override)
- Extend trial
- Apply discount/coupon
- Suspend/unsuspend account
- View usage metrics
- Impersonate (login as org admin for support)

### 4.3 Subscription Analytics Dashboard (`/admin/analytics`)
**KPIs:**
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Active subscriptions by plan
- Trial conversion rate
- Churn rate
- Average Revenue Per User (ARPU)
- Customer Lifetime Value (LTV)

**Charts:**
- Subscription growth over time
- Plan distribution (pie chart)
- Trial-to-paid conversion funnel
- Revenue by plan
- Cancellation reasons

### 4.4 Billing & Invoices (`/admin/billing`)
- View all Stripe invoices
- Filter by organization, status, date
- Manual invoice creation
- Refund processing
- Failed payment management

---

## 5. API Routes

### 5.1 Public Routes (No Auth Required)
```
GET  /api/public/subscription-plans
     → List active subscription plans for pricing page

POST /api/auth/register
     → New user registration with plan selection
     → Create organization, user, trial subscription

POST /api/auth/verify-email
     → Email verification handler
```

### 5.2 Authenticated User Routes
```
GET  /api/organization
     → Get current user's organization details

GET  /api/organization/subscription
     → Get subscription details, usage, limits

POST /api/organization/subscription/upgrade
     → Upgrade/downgrade plan
     → Creates Stripe Checkout session

POST /api/organization/subscription/cancel
     → Cancel subscription (at period end)

POST /api/organization/subscription/reactivate
     → Reactivate canceled subscription

GET  /api/organization/usage
     → Current usage metrics vs. limits

GET  /api/organization/billing-portal
     → Generate Stripe Customer Portal URL
```

### 5.3 Admin-Only Routes (Super Admin)
```
GET    /api/admin/subscription-plans
POST   /api/admin/subscription-plans
PUT    /api/admin/subscription-plans/:id
DELETE /api/admin/subscription-plans/:id

GET    /api/admin/organizations
GET    /api/admin/organizations/:id
PUT    /api/admin/organizations/:id/subscription
POST   /api/admin/organizations/:id/extend-trial

GET    /api/admin/analytics/mrr
GET    /api/admin/analytics/subscriptions
GET    /api/admin/analytics/conversions
```

### 5.4 Stripe Webhooks
```
POST /api/webhooks/stripe
     → Handle subscription events:
        - checkout.session.completed
        - customer.subscription.created
        - customer.subscription.updated
        - customer.subscription.deleted
        - invoice.payment_succeeded
        - invoice.payment_failed
```

---

## 6. Frontend Components

### 6.1 Public Components
- `<PricingTable />` - Marketing pricing page
- `<SignUpForm />` - Registration with plan selection
- `<PlanCard />` - Individual plan display
- `<FeatureComparison />` - Feature matrix

### 6.2 User Dashboard Components
- `<TrialBanner />` - Days remaining in trial
- `<UpgradePrompt />` - Encourage plan upgrade
- `<UsageWidget />` - Show limits (e.g., "3/5 properties")
- `<SubscriptionStatus />` - Current plan badge
- `<BillingSettings />` - Manage subscription

### 6.3 Admin Components
- `<PlanManagementTable />` - CRUD for plans
- `<PlanEditor />` - Form to edit plan details
- `<FeatureLimitEditor />` - UI for setting limits
- `<OrganizationTable />` - View all orgs
- `<SubscriptionAnalytics />` - Charts and KPIs
- `<UsageMonitor />` - Track org usage

### 6.4 Shared Components
- `<PaymentMethodForm />` - Stripe Elements integration
- `<InvoiceHistory />` - Past invoices table
- `<PlanUpgradeDialog />` - Upgrade flow modal

---

## 7. Middleware & Guards

### 7.1 Subscription Enforcement Middleware
```typescript
// server/middleware/subscription.ts
export function enforceSubscriptionLimits() {
  // Check if organization is within limits
  // Block actions if over limit
  // Return 402 Payment Required
}

export function requireActiveSubscription() {
  // Ensure subscription is active/trialing
  // Block if suspended/canceled
}

export function requireFeature(feature: string) {
  // Check if plan includes feature
  // e.g., requireFeature('aiMaintenance')
}
```

### 7.2 Frontend Route Guards
```typescript
// client/src/guards/subscriptionGuard.tsx
export function SubscriptionGuard({ children, feature }) {
  // Check if user's plan has feature
  // Show upgrade prompt if not
  // Prevent navigation to restricted pages
}
```

### 7.3 Usage Tracking Middleware
```typescript
// Increment counters on resource creation
app.post('/api/properties', 
  checkSubscriptionLimit('maxProperties'),
  async (req, res) => {
    // Create property
    // Increment usage counter
  }
);
```

---

## 8. Stripe Integration Details

### 8.1 Required Stripe Setup
1. **Create Products in Stripe Dashboard:**
   - PropertyFlows Starter
   - PropertyFlows Professional
   - PropertyFlows Enterprise

2. **Create Prices for Each Product:**
   - Monthly recurring prices
   - Trial period configuration

3. **Configure Webhooks:**
   - Endpoint: `https://your-domain.replit.app/api/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.*`
     - `invoice.*`

4. **Customer Portal Settings:**
   - Enable subscription cancellation
   - Enable plan changes
   - Enable payment method updates

### 8.2 Checkout Flow
```typescript
// User clicks "Upgrade to Professional"
1. POST /api/organization/subscription/upgrade
   → Create Stripe Checkout Session
   → Return session URL

2. Redirect to Stripe Checkout
   → User enters payment info
   → Stripe processes payment

3. Webhook: checkout.session.completed
   → Update organization.stripeSubscriptionId
   → Update subscription status to "active"
   → Send confirmation email

4. Redirect back to /billing/success
   → Show success message
   → Grant feature access
```

### 8.3 Subscription Management Flow
```typescript
// User wants to manage billing
1. Click "Manage Billing" button

2. GET /api/organization/billing-portal
   → Create Stripe Customer Portal session
   → Return portal URL

3. Redirect to Stripe Customer Portal
   → User can:
     - Update payment method
     - View invoices
     - Change plan
     - Cancel subscription

4. Changes reflected via webhooks
   → Update local database
   → Send notification emails
```

---

## 9. Access Control & Visibility

### 9.1 Role-Based Visibility Matrix

| Feature | Super Admin | Property Manager | Owner | Tenant | Vendor |
|---------|------------|------------------|-------|--------|--------|
| View Subscription Plans (Admin) | ✓ | ✗ | ✗ | ✗ | ✗ |
| Edit Subscription Plans | ✓ | ✗ | ✗ | ✗ | ✗ |
| View All Organizations | ✓ | ✗ | ✗ | ✗ | ✗ |
| View Analytics Dashboard | ✓ | ✗ | ✗ | ✗ | ✗ |
| View Own Org Subscription | ✓ | ✓* | ✗ | ✗ | ✗ |
| Manage Own Org Billing | ✓ | ✓* | ✗ | ✗ | ✗ |
| Upgrade/Downgrade Plan | ✓ | ✓* | ✗ | ✗ | ✗ |

*Only if `user.isOrgAdmin === true`

### 9.2 Navigation Visibility
**Sidebar for Super Admin:**
- Dashboard
- Properties
- ... (all standard items)
- **--- SUPER ADMIN ---**
- Subscription Plans
- Organizations
- Analytics
- System Settings

**Sidebar for Property Manager (Org Admin):**
- Dashboard
- Properties
- ... (all standard items)
- Settings
  - Profile
  - **Billing & Subscription** ← New
  - Security
  - Preferences

**Other Roles:**
- No billing/subscription menu items visible

---

## 10. Implementation Phases

### Phase 1: Database & Backend Foundation (Week 1)
- [ ] Create database schema (tables above)
- [ ] Add `organizations` table
- [ ] Update `users` table with `organizationId`, `isOrgAdmin`
- [ ] Create Stripe products/prices in Stripe Dashboard
- [ ] Build subscription plan CRUD API routes
- [ ] Build organization API routes
- [ ] Implement usage tracking functions

### Phase 2: Stripe Integration (Week 1-2)
- [ ] Set up Stripe webhook endpoint
- [ ] Implement checkout session creation
- [ ] Implement customer portal session creation
- [ ] Test webhook handlers (use Stripe CLI)
- [ ] Build subscription upgrade/downgrade flow
- [ ] Implement trial expiration logic

### Phase 3: Super Admin Interface (Week 2)
- [ ] Build `/admin/subscription-plans` page
- [ ] Build plan editor component
- [ ] Build `/admin/organizations` page
- [ ] Build organization detail view
- [ ] Build analytics dashboard
- [ ] Add super admin navigation menu

### Phase 4: Public Registration (Week 2-3)
- [ ] Build public landing page with pricing
- [ ] Build signup form with plan selection
- [ ] Implement email verification flow
- [ ] Update onboarding wizard for new trial users
- [ ] Add trial banner to dashboard
- [ ] Build upgrade prompts

### Phase 5: User Subscription Management (Week 3)
- [ ] Build billing settings page
- [ ] Add subscription status display
- [ ] Implement usage widgets
- [ ] Build upgrade dialog
- [ ] Integrate Stripe Customer Portal
- [ ] Add payment method management

### Phase 6: Limits & Enforcement (Week 3-4)
- [ ] Implement subscription limit middleware
- [ ] Add usage counters to resource creation
- [ ] Build "limit reached" modals
- [ ] Implement feature gates (e.g., AI features)
- [ ] Add grace period logic for expired trials
- [ ] Build account suspension flow

### Phase 7: Testing & Polish (Week 4)
- [ ] End-to-end testing of signup → trial → upgrade
- [ ] Test all Stripe webhook scenarios
- [ ] Test plan changes and cancellations
- [ ] Verify usage limits are enforced
- [ ] Load testing for concurrent subscriptions
- [ ] Security audit of payment flows

### Phase 8: Documentation & Launch (Week 4)
- [ ] Write admin guide for managing plans
- [ ] Create user guide for billing
- [ ] Document webhook troubleshooting
- [ ] Set up monitoring for failed payments
- [ ] Configure email templates for billing events
- [ ] Launch public registration

---

## 11. Technical Considerations

### 11.1 Usage Calculation
**Real-time vs. Cached:**
- Properties, Units, Tenants: Real-time count from database
- Storage: Calculate on file upload, cache value
- SMS/API calls: Increment counter on each use
- Monthly limits: Reset counter on billing cycle

**Implementation:**
```typescript
async function checkUsageLimit(
  orgId: string, 
  metric: string, 
  limit: number
): Promise<boolean> {
  const current = await getCurrentUsage(orgId, metric);
  return current < limit;
}
```

### 11.2 Grandfathering Existing Users
**Option 1:** Assign all current users to "Enterprise" plan at $0/month
- Existing functionality remains
- Can upgrade to paid Enterprise for new features

**Option 2:** Create "Legacy" plan
- Mirrors current unlimited access
- Not available for new signups
- Existing users can switch to paid plans for new features

### 11.3 Handling Plan Changes
**Upgrade (Starter → Professional):**
- Immediate access to new features
- Prorated charge in Stripe

**Downgrade (Professional → Starter):**
- Schedule change for end of billing period
- Show warning if over new limits
- Prevent downgrade if usage > new limits

### 11.4 Failed Payment Handling
1. **First Failure:** Retry in 3 days, send email
2. **Second Failure:** Retry in 5 days, send urgent email
3. **Third Failure:** Mark subscription as past_due
4. **7 Days Past Due:** Suspend account (read-only)
5. **30 Days Past Due:** Cancel subscription, retain data
6. **60 Days:** Delete data (with 7-day warning)

---

## 12. Monitoring & Alerts

### 12.1 Critical Metrics to Track
- New trial signups per day
- Trial-to-paid conversion rate
- Churn rate (monthly)
- Failed payment rate
- Feature usage by plan
- Support ticket volume by plan

### 12.2 Alerts to Configure
- **High Priority:**
  - Webhook endpoint down
  - Payment gateway errors
  - Failed payment spike (>5% in 24h)
  - Multiple subscription cancellations (>10/day)

- **Medium Priority:**
  - Trial conversion below target (<20%)
  - Usage approaching plan limits (>90%)
  - Downgrade requests spike

### 12.3 Reporting
- **Daily:** New signups, trials ending today, failed payments
- **Weekly:** Conversion rates, revenue, active subscriptions
- **Monthly:** MRR, ARR, churn, LTV, cohort analysis

---

## 13. Security Considerations

### 13.1 Payment Data
- ✓ Never store credit card details (use Stripe)
- ✓ Use Stripe Elements for PCI compliance
- ✓ Verify webhook signatures
- ✓ Use HTTPS for all payment endpoints

### 13.2 Access Control
- ✓ Verify user belongs to organization
- ✓ Check `isOrgAdmin` for billing changes
- ✓ Rate limit signup endpoints (prevent abuse)
- ✓ Validate plan IDs before applying

### 13.3 Data Protection
- ✓ Encrypt Stripe customer IDs
- ✓ Audit log all plan changes
- ✓ Backup database before bulk migrations
- ✓ Soft delete organizations (retain for recovery)

---

## 14. Migration Strategy (Existing Users)

### Option A: Automatic Migration to Legacy Plan
```sql
-- Create "Legacy Unlimited" plan
INSERT INTO subscription_plans (...) VALUES (
  'legacy-unlimited',
  'Legacy Unlimited',
  0, -- Free
  ...
);

-- Create organizations for existing users
INSERT INTO organizations (admin_user_id, subscription_plan_id)
SELECT id, 'legacy-unlimited'
FROM users
WHERE role IN ('admin', 'property_manager')
GROUP BY organization_criteria;

-- Link users to organizations
UPDATE users
SET organization_id = (SELECT id FROM organizations WHERE ...)
```

### Option B: Prompt for Plan Selection
- Email existing users about new pricing
- Require plan selection on next login
- Offer special "early adopter" discount
- Grace period to migrate (e.g., 60 days)

---

## 15. Future Enhancements

### 15.1 Advanced Features (Post-MVP)
- [ ] Annual billing with discount (15% off)
- [ ] Add-on marketplace (pay per feature)
- [ ] Affiliate program for referrals
- [ ] Enterprise custom pricing negotiation flow
- [ ] Multi-organization support (agencies)
- [ ] Reseller/white-label licensing

### 15.2 Optimization
- [ ] A/B testing on pricing tiers
- [ ] Dynamic pricing based on market
- [ ] Usage-based billing option
- [ ] Seat-based pricing (per property manager)
- [ ] Volume discounts for properties

---

## Summary Checklist

**Before Starting Implementation:**
- [ ] Review and approve this design document
- [ ] Set up Stripe account (Production mode)
- [ ] Define final pricing and limits
- [ ] Design public landing page mockups
- [ ] Plan migration strategy for existing users

**Key Success Metrics:**
- Trial signup rate: >50/week
- Trial-to-paid conversion: >25%
- Churn rate: <5%/month
- Average subscription value: $120/month
- Customer satisfaction: >90%

**Risk Mitigation:**
- Test payment flows extensively before launch
- Start with limited beta group
- Have rollback plan for schema changes
- Monitor webhook health 24/7
- Prepare support team for billing questions

---

## Questions to Resolve

1. **Pricing:** Finalize exact pricing for each tier ($49/$149/$499)?
2. **Trials:** 14 days for all, or vary by plan?
3. **Credit Card:** Required upfront or only after trial?
4. **Grandfathering:** How to handle existing users?
5. **Discounts:** Offer annual billing discount?
6. **Payment Methods:** ACH + Card, or Card only?
7. **Enterprise:** Custom pricing or fixed starting price?
8. **Limits:** Are the proposed limits reasonable?
9. **Features:** Which features should be gated per plan?
10. **Support:** Different support tiers per plan?

---

**Document Version:** 1.0  
**Last Updated:** October 28, 2025  
**Author:** PropertyFlows Development Team  
**Status:** Draft - Pending Approval
