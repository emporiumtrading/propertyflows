# PropertyFlows - Property Management SaaS Platform

## Overview
PropertyFlows is a comprehensive SaaS platform for property management, distinguishing itself with a tenant-first user experience and AI-powered operations. The platform offers transparent pricing, multi-property support, online rent payments (ACH/card), maintenance tracking, lease management, dedicated tenant and owner portals, and robust audit/e-signature logging. Key features include AI for maintenance triage, Fair Housing compliance, lease renewal predictions, move-in/out photo analysis, and automated delinquency playbooks. It aims to integrate seamlessly with various external services to provide a complete property management solution with significant market potential.

## User Preferences
- Minimize code comments unless necessary for complex logic
- Focus on clean, readable TypeScript code
- Use shadcn/ui components for consistency
- Follow data-testid convention for all interactive elements
- Prioritize transparent pricing and tenant experience
- Keep the data model simple and focused on MVP features
- Do not modify `vite.config.ts` or `server/vite.ts`
- Do not modify `package.json` scripts
- Do not modify `drizzle.config.ts`

## System Architecture

### Technology Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL (Neon-backed)
- **ORM**: Drizzle ORM
- **Authentication**: Replit Auth (OIDC)
- **Payments**: Stripe
- **File Storage**: Replit Object Storage (Google Cloud Storage backed)

### Core Features & Design Patterns
- **Role-Based Access Control (RBAC)**: Supports `admin`, `property_manager`, `landlord`, `tenant`, `vendor` roles. Only property managers can self-register via business registration; all other roles (tenant, landlord, vendor) must be invited.
  - **RBAC Enforcement Implementation**: Critical security fix completed on 2025-10-29. Moved RBAC enforcement from `/api/auth/user` endpoint to OIDC callback (`server/replitAuth.ts:68-136`). This prevents auto-user creation with database defaults that would bypass invitation requirements.
  - **OIDC Callback Logic**: Before creating any user, checks (in order): 1) Pending invitation exists → create with invitation role; 2) Admin email pattern (@propertyflows.com) → create admin; 3) Organization exists with matching contact email → create property_manager; 4) Otherwise → throw RBAC_DENIED error.
  - **Email Normalization**: All email lookups use `.toLowerCase()` for case-insensitive matching across invitations, organizations, and user creation flows.
- **Invitation-Based User Registration**: Token-based email invitations. Users logging in without an invitation or organization registration will be denied access at the OIDC level (before user creation).
- **AI-Powered Operations**: Maintenance triage, Fair Housing compliance, lease renewal predictions, move-in/out photo analysis, and document copilot.
- **SMS Communications**: Twilio for automated notifications and two-way communication.
- **Field Operations Turnboard**: Kanban-style task management for maintenance.
- **Vendor Management**: Portal for job assignment, bidding, and work documentation with file attachments.
- **Audit & E-Signature Tracking**: Comprehensive logging and legally compliant e-signatures with full audit trails.
- **Object Storage**: Secure file uploads with fine-grained access control.
- **UI/UX**: Consistent design with shadcn/ui, role-based navigation, and dedicated portals.
- **Type Safety**: Enforced with TypeScript and Zod.
- **Security**: Environment-based CSP, HSTS, Rate Limiting, Multi-Factor Authentication.
- **AI Chatbot System**: Production-ready, role-specific AI Assistants using GPT-4o-mini.
- **Enterprise Accounting Module**: Full double-entry bookkeeping with Chart of Accounts, Journal Entries, and Financial Statements.
- **Onboarding Wizard**: Guided 6-step onboarding with progress tracking.
- **Multi-Currency Support**: User-selectable currency, timezone, and language customization.
- **GDPR Compliance**: Data export, account deletion, consent tracking.
- **Automated Bulk Import System**: CSV/Excel upload with auto-field mapping, data normalization, preview, validation, and error reporting for Properties, Units, Tenants, Leases, Vendors, Maintenance Requests, and Transactions.
- **Subscription Management System**: Admin-only multi-tier SaaS subscription system with three plans (Starter $49/mo, Professional $149/mo, Enterprise $499/mo). Features include:
  - Full CRUD operations for subscription plans (create, edit, delete)
  - Organization management with subscription assignment
  - Trial period extension (admin can add days to any organization's trial)
  - Suspend/unsuspend functionality (toggle between active and canceled status)
  - Dropdown action menu for organization management
  - Real-time cache invalidation with React Query
  - Numeric form validation with z.coerce.number() and proper bounds checking
  - Business verification with fraud prevention (email validation, risk scoring)
  - Automated trial-to-paid conversion via Stripe webhooks
  - Dunning management with grace periods and auto-suspension
  - Comprehensive email notification system for all lifecycle events

## External Dependencies

- **Stripe**: Payment gateway for ACH, Debit, Credit Card processing, and Stripe Connect for payouts.
- **OpenAI**: AI services for maintenance triage, Fair Housing compliance, lease renewal predictions, and move-in/out photo analysis (using GPT-4o-mini).
- **Twilio**: SMS messaging for notifications and two-way communication.
- **Resend**: Email delivery service for invitations, lease signature requests, and system notifications.
- **QuickBooks Online**: OAuth2-based accounting integration with automated transaction sync via JournalEntry API.
- **Replit Auth**: OIDC authentication provider.
- **Replit Object Storage**: Secure file storage with ACL-based access control.
- **Plaid** (Optional): Bank account verification for ACH.
- **DocuSign** (Optional): E-signature API integration for enterprise clients.