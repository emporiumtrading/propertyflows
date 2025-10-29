# PropertyFlows - Complete Technical Documentation

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Core Features](#core-features)
5. [User Roles & Permissions](#user-roles--permissions)
6. [External Integrations](#external-integrations)
7. [Security & Compliance](#security--compliance)
8. [Database Schema](#database-schema)
9. [API Architecture](#api-architecture)
10. [Deployment & Infrastructure](#deployment--infrastructure)

---

## Executive Summary

PropertyFlows is a comprehensive, enterprise-grade SaaS platform for property management that differentiates itself through a tenant-first user experience and AI-powered operational automation. The platform supports multi-property management, online rent payments, maintenance tracking, lease management, vendor coordination, and dedicated portals for all stakeholders.

### Key Differentiators
- **Tenant-First UX**: Intuitive interfaces designed from the tenant perspective
- **AI-Powered Operations**: Automated maintenance triage, Fair Housing compliance, lease predictions
- **Transparent Pricing**: Upfront fee disclosure with no hidden costs
- **Instant Payouts**: Stripe Connect for immediate landlord payments
- **White-Glove Migration**: Assisted data migration from competing platforms
- **Enterprise Accounting**: Full double-entry bookkeeping system
- **7 Production Integrations**: Stripe, QuickBooks, Twilio, OpenAI, Plaid, DocuSign, Zillow

---

## Technology Stack

### Frontend Technologies

#### Core Framework
- **React 18** - Modern UI library with hooks and concurrent rendering
- **TypeScript 5.x** - Static typing for enhanced developer experience and runtime safety
- **Vite** - Next-generation frontend build tool with lightning-fast HMR (Hot Module Replacement)

#### Routing & State Management
- **Wouter** - Lightweight (1.2kb) routing library for single-page applications
- **TanStack Query v5 (React Query)** - Powerful server state management with automatic caching, background refetching, and optimistic updates
  - Configured with custom fetcher for seamless API integration
  - Hierarchical cache invalidation using array-based query keys
  - Loading/error states for all async operations

#### UI Component Libraries
- **shadcn/ui** - High-quality, accessible React components built on Radix UI
- **Radix UI** - Unstyled, accessible component primitives (40+ components used):
  - Accordion, Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu
  - Form controls, Navigation Menu, Popover, Progress, Radio Group
  - Scroll Area, Select, Slider, Switch, Tabs, Toast, Tooltip
- **Lucide React** - 1000+ beautiful, consistent SVG icons
- **React Icons** - Company logos and brand icons (via react-icons/si)

#### Styling & Theming
- **Tailwind CSS 3.x** - Utility-first CSS framework
- **@tailwindcss/typography** - Beautiful typographic defaults
- **PostCSS** - CSS processing and optimization
- **class-variance-authority** - Type-safe variant management for components
- **clsx + tailwind-merge** - Conditional CSS class handling with Tailwind conflict resolution
- **next-themes** - Dark mode support with system preference detection
- **tailwindcss-animate** - Animation utilities

#### Form Management
- **React Hook Form** - Performant form state management with minimal re-renders
- **@hookform/resolvers** - Form validation resolver library
- **Zod** - TypeScript-first schema validation for form inputs
- **input-otp** - OTP input component for Multi-Factor Authentication

#### Data Visualization & UI Enhancements
- **Recharts** - Composable charting library for financial dashboards
  - Occupancy rate graphs
  - Maintenance analytics by status and priority
  - Revenue tracking and financial reporting
- **Framer Motion** - Production-ready animation library
- **Embla Carousel** - Lightweight carousel library
- **React Day Picker** - Date picker component
- **React Resizable Panels** - Resizable split pane layouts
- **cmdk** - Command palette component
- **Vaul** - Drawer/bottom sheet component

#### File Upload & Management
- **Uppy** - Modular file uploader
  - @uppy/core - Core upload functionality
  - @uppy/dashboard - Drag-and-drop UI
  - @uppy/aws-s3 - Direct S3 uploads (used with GCS compatibility)
  - @uppy/react - React integration
- **React Dropzone** - Drag-and-drop file upload zones

### Backend Technologies

#### Core Framework
- **Express.js 4.x** - Fast, minimalist web framework for Node.js
- **Node.js 20.x** - JavaScript runtime built on Chrome's V8 engine
- **TypeScript 5.x** - Full type safety across backend code

#### Database & ORM
- **PostgreSQL 15** - Advanced open-source relational database (Neon-backed managed service)
- **Drizzle ORM** - TypeScript-first ORM with zero runtime overhead
  - Type-safe queries with full IntelliSense
  - Automatic migration generation
  - Support for complex joins, transactions, and subqueries
- **Drizzle Kit** - CLI tools for schema management and migrations
- **Drizzle Zod** - Auto-generate Zod schemas from Drizzle models
- **@neondatabase/serverless** - Serverless Postgres driver optimized for edge

#### Authentication & Session Management
- **Passport.js** - Authentication middleware supporting multiple strategies
- **Passport Local** - Username/password authentication strategy
- **OpenID Client** - OIDC (OpenID Connect) implementation for Replit Auth
- **Express Session** - Session middleware with secure cookie handling
- **Connect PG Simple** - PostgreSQL session store
- **Cookie Parser** - Cookie parsing middleware
- **OTPLib** - TOTP-based Multi-Factor Authentication (MFA)
- **QRCode** - QR code generation for MFA setup

#### Security & Rate Limiting
- **Helmet** - Security headers (CSP, HSTS, X-Frame-Options, etc.)
  - Content Security Policy with nonces and reporting
  - HTTP Strict Transport Security (HSTS)
  - Clickjacking protection
- **Express Rate Limit** - API rate limiting to prevent abuse
- **Memorystore** - In-memory session storage for development

#### File Storage & Processing
- **@google-cloud/storage** - Google Cloud Storage SDK for Replit Object Storage
- **Multer** - Multipart/form-data file upload handling
- **Sharp** (via image processing) - High-performance image manipulation
- **XLSX** - Excel file parsing and generation
- **PapaParse** - Fast CSV parser with streaming support

#### Document Generation
- **html2pdf.js** - Client-side PDF generation from HTML
- **PptxGenJS** - PowerPoint presentation generation
  - Sales deck, pitch deck, features deck, product deck

#### Communication Services
- **Nodemailer** - Email sending library
- **Resend SDK** - Modern transactional email API
- **Twilio SDK** - SMS messaging and telephony

#### Payment & Financial
- **Stripe SDK** - Complete payment infrastructure
  - Payment processing (ACH, debit, credit cards)
  - Stripe Connect for marketplace payouts
  - Webhook handling for asynchronous events
- **Plaid SDK** - Bank account verification and ACH validation

#### AI & Machine Learning
- **OpenAI SDK** - GPT-4o-mini integration for:
  - Maintenance request triage and routing
  - Fair Housing compliance checking
  - Lease renewal predictions
  - Move-in/out photo analysis
  - AI chatbot assistant

#### Business Integrations
- **DocuSign eSign SDK** - E-signature API for digital lease signing
- **QuickBooks Online API** - Accounting integration with OAuth2
- **Zillow Rental Manager API** - Listing syndication

#### Utilities & Helpers
- **Date-fns** - Modern date utility library
- **Memoizee** - Function memoization for performance optimization
- **WebSocket (ws)** - Real-time bidirectional communication

### Development & Testing Tools

#### Build & Bundling
- **Vite** - Frontend build tool with optimized production builds
- **@vitejs/plugin-react** - React plugin for Vite with Fast Refresh
- **ESBuild** - Extremely fast JavaScript bundler (used by Vite)
- **@jridgewell/trace-mapping** - Source map utilities

#### TypeScript & Type Definitions
- **TypeScript** - Core language
- **@types/node** - Node.js type definitions
- **@types/express** - Express type definitions
- **@types/react** - React type definitions
- **@types/react-dom** - React DOM type definitions
- **@types/express-session** - Express session types
- **@types/passport** - Passport types
- **@types/multer** - Multer types
- **@types/ws** - WebSocket types
- **+20 more @types packages** for complete type coverage

#### Testing Framework
- **Playwright** - End-to-end testing framework
  - Browser automation (Chromium, Firefox, WebKit)
  - Visual regression testing
  - Network interception
  - Mobile device emulation
- **Jest** - JavaScript testing framework
- **ts-jest** - TypeScript support for Jest
- **Supertest** - HTTP assertion library for API testing

#### Code Quality & Development
- **TSX** - TypeScript execution environment
- **Drizzle Kit** - Database introspection and migration tools
- **Zod Validation Error** - Human-readable Zod error messages

#### Replit-Specific Plugins
- **@replit/vite-plugin-cartographer** - Replit workspace integration
- **@replit/vite-plugin-dev-banner** - Development mode indicators
- **@replit/vite-plugin-runtime-error-modal** - Enhanced error overlay

### Infrastructure & Deployment

#### Hosting Platform
- **Replit** - Cloud development and hosting platform
- **NixOS** - Linux distribution for reproducible builds

#### Database Hosting
- **Neon** - Serverless Postgres with:
  - Automatic scaling
  - Branching for development environments
  - Point-in-time recovery
  - Connection pooling

#### File Storage
- **Replit Object Storage** - Google Cloud Storage-backed object storage with:
  - ACL-based access control (USER_LIST, EMAIL_DOMAIN, GROUP_MEMBER, SUBSCRIBER)
  - Multi-region redundancy
  - CDN integration

#### Environment Management
- **Environment Variables** - Secure secret management for:
  - API keys (Stripe, OpenAI, Twilio, etc.)
  - Database credentials
  - OAuth tokens
  - Service endpoints

---

## System Architecture

### Application Structure

```
PropertyFlows/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── AIChatbot.tsx
│   │   │   └── ...
│   │   ├── pages/           # Route-based page components
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── PropertyManagerPortal.tsx
│   │   │   ├── TenantPortal.tsx
│   │   │   ├── VendorPortal.tsx
│   │   │   ├── OwnerPortal.tsx
│   │   │   └── ...
│   │   ├── lib/             # Utility libraries
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── hooks/           # Custom React hooks
│   │   ├── App.tsx          # Main app component with routing
│   │   ├── index.css        # Global styles and Tailwind
│   │   └── main.tsx         # Application entry point
│   └── index.html
├── server/                   # Backend Express application
│   ├── services/            # External service integrations
│   │   ├── openaiService.ts
│   │   ├── resendService.ts
│   │   ├── twilioService.ts
│   │   ├── plaidService.ts
│   │   ├── docusignService.ts
│   │   ├── zillowService.ts
│   │   ├── delinquencyService.ts
│   │   └── quickbooksService.ts
│   ├── routes.ts            # API route definitions
│   ├── storage.ts           # Database interface layer
│   ├── stripe.ts            # Stripe payment integration
│   ├── replitAuth.ts        # OIDC authentication
│   ├── objectStorage.ts     # File storage utilities
│   ├── middleware.ts        # Express middleware
│   ├── vite.ts              # Vite dev server integration
│   ├── index.ts             # Server entry point
│   └── utils/
│       └── errorHandling.ts
├── shared/                  # Shared TypeScript code
│   └── schema.ts           # Drizzle database schema + Zod schemas
├── drizzle.config.ts       # Drizzle ORM configuration
├── vite.config.ts          # Vite build configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

### Request Flow Architecture

```
User Browser
    ↓
[Replit Edge Network]
    ↓
[Express Server :5000]
    ↓
    ├─→ Static Assets (Vite-built React SPA)
    ├─→ API Routes (/api/*)
    │   ↓
    │   ├─→ Authentication Middleware (Passport/OIDC)
    │   ├─→ Role-Based Access Control
    │   ├─→ Rate Limiting
    │   ├─→ Request Validation (Zod)
    │   ↓
    │   ├─→ Storage Layer (Drizzle ORM)
    │   │   ↓
    │   │   └─→ PostgreSQL (Neon)
    │   │
    │   └─→ External Services
    │       ├─→ Stripe (payments)
    │       ├─→ Plaid (bank verification)
    │       ├─→ OpenAI (AI features)
    │       ├─→ Twilio (SMS)
    │       ├─→ Resend (email)
    │       ├─→ DocuSign (e-signatures)
    │       ├─→ Zillow (listings)
    │       ├─→ QuickBooks (accounting)
    │       └─→ Object Storage (files)
    │
    └─→ WebSocket Connections (real-time)
```

### Frontend Architecture

**State Management Strategy:**
- **Server State**: TanStack Query for all API data
- **UI State**: React useState/useReducer for component-level state
- **Form State**: React Hook Form for complex forms
- **Theme State**: next-themes with localStorage persistence
- **Route State**: Wouter for navigation state

**Component Architecture:**
- **Atomic Design Pattern**: 
  - Atoms: shadcn/ui primitives (Button, Input, etc.)
  - Molecules: Composite UI elements (FormField, DataTable)
  - Organisms: Feature components (PropertyCard, MaintenanceRequestForm)
  - Templates: Layout components (DashboardLayout, PortalLayout)
  - Pages: Route-level components with data fetching

**Data Fetching Pattern:**
```typescript
// Queries for GET requests
const { data, isLoading, error } = useQuery({
  queryKey: ['/api/properties'],
  // queryFn automatically uses configured fetcher
});

// Mutations for POST/PATCH/DELETE
const mutation = useMutation({
  mutationFn: (data) => apiRequest('/api/properties', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
  },
});
```

### Backend Architecture

**Layered Architecture:**

1. **Route Layer** (`server/routes.ts`)
   - HTTP request handling
   - Request validation with Zod
   - Response formatting
   - Error handling

2. **Service Layer** (`server/services/`)
   - Business logic
   - External API integration
   - Data transformation
   - Error recovery

3. **Storage Layer** (`server/storage.ts`)
   - Database interface (IStorage)
   - Drizzle ORM queries
   - Transaction management
   - Data access abstraction

4. **Database Layer** (PostgreSQL/Neon)
   - Data persistence
   - Referential integrity
   - ACID transactions

**Middleware Stack:**
```typescript
Express Server
├─→ Helmet (security headers)
├─→ Cookie Parser
├─→ Body Parser (JSON)
├─→ Express Session
├─→ Passport Authentication
├─→ Rate Limiting
├─→ CORS (if needed)
├─→ Request Logging
├─→ Performance Monitoring
└─→ Route Handlers
    └─→ Error Handler
```

---

## Core Features

### 1. Multi-Portal User Interface

#### Admin Portal
**Purpose**: Platform-wide administration and configuration

**Features:**
- **Dashboard**: System-wide metrics, user activity, revenue tracking
- **User Management**: Create, edit, delete users across all roles
- **Property Management**: Oversee all properties in the system
- **Integration Configuration**: Setup and manage external service integrations
- **Bulk Data Import**: CSV/Excel import wizard for migrating from other platforms
  - Supports: Properties, Units, Tenants, Leases, Vendors, Maintenance Requests
  - Auto-field mapping for AppFolio, Buildium, Yardi, RentManager
  - Preview, validation, and dry-run capabilities
  - Import history with error reporting
- **System Settings**: Platform configuration, feature flags, pricing tiers
- **Audit Logs**: Comprehensive activity tracking across all users
- **Invitation System**: Send email invitations to new users
- **Analytics**: Platform usage, conversion rates, revenue metrics

**Technologies:**
- React components with role-based conditional rendering
- TanStack Query for real-time data updates
- Recharts for analytics dashboards
- PapaParse for CSV import/export
- XLSX for Excel file handling

#### Property Manager Portal
**Purpose**: Day-to-day property operations and management

**Features:**
- **Property Dashboard**: Overview of all managed properties
- **Tenant Management**: 
  - View tenant profiles, lease details, payment history
  - Send invitations to new tenants
  - Create and manage tenant applicants inline
  - Track tenant communications and notes
- **Lease Management**:
  - Create, edit, renew leases
  - Send leases for e-signature via DocuSign
  - Track lease status (pending_signature, active, expired)
  - E-signature audit trail with IP address, timestamp, document hash
- **Maintenance Requests**:
  - Triage incoming requests (AI-powered priority assignment)
  - Assign to vendors or internal staff
  - Track status and costs
  - Photo documentation
- **Vendor Management**:
  - Invite vendors to platform
  - Assign jobs with detailed descriptions
  - Review bids and proposals
  - Approve work and process payments
  - View vendor performance metrics
- **Financial Management**:
  - Rent collection tracking
  - Payment plan creation and monitoring
  - Delinquency workflow automation
  - Revenue reporting by property/unit
  - QuickBooks sync for accounting
- **Field Operations Turnboard**:
  - Kanban-style task board
  - Move-in/move-out coordination
  - Inspection scheduling
  - Work order management
- **Tenant Marketplace**:
  - List available units publicly
  - Review applications
  - Screen applicants (TransUnion SmartMove integration ready)
  - Zillow listing syndication
- **AI Assistant**: Role-specific chatbot for operational support

**Key Workflows:**
1. **Lease Signing Process**:
   - PM creates lease in system
   - Sends for e-signature via DocuSign
   - Tenant receives professional email with secure signing link
   - System tracks signature status
   - Lease automatically activates upon completion
   - Full audit trail recorded

2. **Maintenance Request Handling**:
   - Request submitted (tenant or PM)
   - AI analyzes and assigns priority
   - PM reviews and assigns to vendor
   - Vendor submits bid with attachments
   - PM approves work
   - Vendor completes and uploads photos
   - PM closes request

#### Owner/Landlord Portal
**Purpose**: Property owner oversight and financial tracking

**Features:**
- **Portfolio Overview**: 
  - All owned properties at a glance
  - Occupancy rates (with building-level filtering)
  - Revenue metrics
  - Property value tracking
- **Financial Dashboard**:
  - Rent collection status
  - Expense tracking by category
  - Profit/loss statements
  - Tax document generation (1099, Schedule E)
  - QuickBooks integration for full accounting
- **Maintenance Analytics**:
  - Cost breakdown by property/unit
  - Status tracking (open, assigned, in_progress, completed)
  - Priority distribution (urgent, high, medium, low)
  - Building-level filtering for detailed insights
  - Vendor performance metrics
- **Tenant Overview**:
  - Lease status for all units
  - Payment history
  - Tenant contact information
- **Document Library**:
  - Leases, inspection reports, photos
  - E-signature audit logs
  - Financial statements
- **Instant Payouts**:
  - Stripe Connect integration
  - Same-day payment transfers
  - Transparent fee disclosure
- **Settings & Preferences**:
  - Notification preferences
  - Payment method management
  - Multi-currency support
  - Timezone and language settings

**Analytics:**
- Occupancy Rate Graph: Visual trend analysis with property filtering
- Maintenance Analytics Chart: Breakdown by status and priority
- Revenue Tracking: Monthly, quarterly, annual views
- Expense Categories: Utilities, repairs, management fees, etc.

#### Tenant Portal
**Purpose**: Self-service for tenants to manage their rental experience

**Features:**
- **Personal Dashboard**:
  - Current lease details (rent amount, due date, lease end)
  - Payment status and history
  - Maintenance request tracking
  - Important announcements
- **Rent Payment**:
  - One-time payments (ACH, debit, credit card)
  - Autopay setup with Plaid bank verification
  - Payment plan management for delinquent accounts
  - Transparent fee disclosure (ACH: free, Card: 2.9% + $0.30)
  - Payment history and receipts
- **Maintenance Requests**:
  - Submit new requests with photos
  - Track request status in real-time
  - Communicate with property manager
  - Rate completed work
  - View assigned vendor information
- **Lease Management**:
  - View current lease agreement
  - E-signature capability for lease renewals
  - Download lease documents
  - View e-signature audit trail
- **Communication**:
  - Message property manager
  - Receive SMS notifications (rent reminders, maintenance updates)
  - Email notifications for important events
- **Document Access**:
  - Lease agreements
  - Inspection reports (move-in/move-out)
  - Payment receipts
  - Policy documents
- **Settings**:
  - Update contact information
  - Notification preferences (email, SMS)
  - Payment method management
  - Multi-Factor Authentication setup

**Tenant-First UX Design:**
- Simple, intuitive navigation
- Mobile-responsive design
- Clear call-to-action buttons
- Progress indicators for multi-step processes
- Helpful tooltips and guidance
- Accessibility compliant (WCAG 2.1 AA)

#### Vendor Portal
**Purpose**: Job management and work documentation for service providers

**Features:**
- **Job Dashboard**:
  - Available job listings
  - Assigned jobs
  - Completed work history
  - Earnings summary
- **Bid Submission**:
  - Review job details and photos
  - Submit bids with cost estimates
  - **File Attachment System**:
    - Multi-file upload support (proposals, estimates, certificates, photos)
    - Drag-and-drop interface using Uppy
    - File preview and management
    - Role-based viewing (PM and landlords can view all attachments)
  - Track bid status (pending, accepted, rejected)
- **Work Documentation**:
  - Upload before/after photos
  - Add work notes and completion details
  - Submit invoices
  - Track payment status
- **Performance Metrics**:
  - Job completion rate
  - Average response time
  - Customer ratings
  - Total earnings
- **Communication**:
  - Chat with property managers
  - Receive SMS notifications for new jobs
  - Job assignment alerts
- **Profile Management**:
  - Service specialties (plumbing, HVAC, electrical, etc.)
  - Certification uploads
  - Availability calendar
  - Service area configuration

**Vendor Finance System:**
- Payment tracking by job
- Invoice management
- 1099 tax document generation
- Payment history and receipts

### 2. Property & Unit Management

**Property Features:**
- **Property Profiles**:
  - Name, address, type (single-family, multi-family, apartment, commercial)
  - Total units, occupied units, vacancy rate
  - Property manager assignment
  - Owner/landlord association
  - Property photos and documents
- **Unit Management**:
  - Unit number/identifier
  - Bedrooms, bathrooms, square footage
  - Rent amount and deposit requirements
  - Status (available, occupied, maintenance, not_rentable)
  - Amenities (parking, storage, balcony, etc.)
  - Unit-specific photos
- **Bulk Operations**:
  - CSV import for multiple properties/units
  - Bulk status updates
  - Mass rent adjustments
- **Zillow Integration**:
  - One-click listing syndication
  - Automatic updates to Zillow, Trulia, HotPads
  - Analytics tracking (views, inquiries)
  - Photo management and ordering

**Database Schema:**
```typescript
properties table:
- id (serial primary key)
- name, address, city, state, zip_code
- type, total_units, occupied_units
- property_manager_id (references users)
- created_at

units table:
- id (serial primary key)
- property_id (references properties)
- unit_number, bedrooms, bathrooms, square_feet
- monthly_rent, deposit, status
- amenities (array)
- zillow_listing_id (for syndication)
- available_date
```

### 3. Tenant & Lease Management

**Tenant Features:**
- **Tenant Profiles**:
  - Contact information (email, phone)
  - Emergency contact
  - Move-in date
  - Associated lease(s)
  - Payment history
  - Maintenance request history
- **Tenant Screening**:
  - Online application submission
  - Credit check integration (TransUnion SmartMove ready)
  - Background checks
  - Rental history verification
  - Income verification
  - Inline applicant creation by PM/landlords
- **Invitation System**:
  - Email invitations sent via Resend
  - Unique registration tokens
  - Automatic account creation flow
  - Welcome email with portal access instructions

**Lease Features:**
- **Lease Creation**:
  - Associate with unit and tenant(s)
  - Start date, end date, rent amount
  - Security deposit amount
  - Payment schedule (monthly, bi-weekly, custom)
  - Terms and conditions
  - Renewal options
- **E-Signature Workflow**:
  - Integration with DocuSign eSign API
  - Send lease for signature via email
  - Professional HTML email template with branding
  - Secure signing link with token authentication
  - Real-time signature status tracking
  - Download signed documents
  - Comprehensive audit trail:
    - Signer IP address
    - User agent (browser/device)
    - Document hash (SHA-256)
    - Timestamp (UTC and local timezone)
    - Document version tracking
- **Lease Status Management**:
  - pending_signature → active → expired
  - Automatic status updates based on dates
  - Renewal reminders (AI-powered predictions)
  - Expiration notifications
- **Lease Renewals**:
  - AI predictions for renewal likelihood
  - Automated renewal offers
  - E-signature for renewal agreements
  - Rent adjustment tracking

**Database Schema:**
```typescript
tenants table:
- id (serial primary key)
- user_id (references users)
- unit_id (references units)
- move_in_date, emergency_contact
- screening_status

leases table:
- id (serial primary key)
- unit_id, tenant_id
- start_date, end_date, monthly_rent, deposit
- status (pending_signature, active, expired)
- docusign_envelope_id
- signed_at, signed_ip, signed_user_agent
- document_hash

esignature_logs table:
- id (serial primary key)
- lease_id, user_id
- action (sent, viewed, signed)
- ip_address, user_agent
- timestamp, document_hash
```

### 4. Maintenance Request System

**Request Submission:**
- **Tenant Submission**:
  - Category selection (plumbing, electrical, HVAC, appliance, structural, pest, other)
  - Detailed description
  - Priority indication (tenant perspective)
  - Photo uploads (up to 10 images)
  - Preferred access times
- **Property Manager Submission**:
  - Create requests on behalf of tenants
  - Inspection-based requests
  - Preventive maintenance scheduling

**AI-Powered Triage:**
- **OpenAI Integration** (GPT-4o-mini):
  - Analyzes request description and photos
  - Assigns priority (urgent, high, medium, low)
  - Suggests appropriate vendor specialty
  - Estimates cost range
  - Fair Housing compliance check (ensures non-discriminatory language)
  - Emergency detection (water leaks, no heat/AC, security issues)

**Request Assignment:**
- **Vendor Selection**:
  - View available vendors by specialty
  - Review vendor ratings and past performance
  - Assign to specific vendor or open for bidding
  - Set bid deadline
- **Bidding System**:
  - Vendors receive job notifications via SMS
  - Submit bids with:
    - Cost estimate
    - Timeline for completion
    - Material costs breakdown
    - **File attachments** (proposals, certificates, photos)
  - PM reviews bids and selects winner
  - Automatic notification to selected vendor

**Work Completion:**
- **Vendor Documentation**:
  - Upload before photos (if not provided)
  - Upload after photos (required)
  - Add completion notes
  - Submit invoice
- **PM Approval**:
  - Review work documentation
  - Approve or request revisions
  - Process payment
  - Close request
- **Tenant Notification**:
  - SMS alert when work is completed
  - Request feedback and rating
  - Document access in tenant portal

**Status Tracking:**
- open → assigned → in_progress → completed → closed
- Real-time updates visible to all stakeholders
- Automated status change notifications

**Analytics:**
- Average resolution time by category
- Cost analysis by property/unit
- Vendor performance metrics
- Seasonal trends
- Preventive maintenance scheduling based on historical data

**Database Schema:**
```typescript
maintenance_requests table:
- id (serial primary key)
- unit_id, tenant_id, assigned_vendor_id
- category, description, priority, status
- photo_urls (array)
- estimated_cost, actual_cost
- ai_triage_result (JSON)
- created_at, completed_at

maintenance_bids table:
- id (serial primary key)
- request_id, vendor_id
- bid_amount, estimated_days, materials_cost
- proposal_text, attachment_urls (array)
- status (pending, accepted, rejected)
- created_at

vendor_bid_attachments table:
- id (serial primary key)
- bid_id, file_url, file_name, file_type
- uploaded_at, uploaded_by
```

### 5. Payment Processing & Financial Management

**Payment Methods:**
- **ACH (Bank Transfer)**:
  - Plaid integration for instant bank verification
  - Link widget for secure account connection
  - No fee for tenants
  - 3-5 business day processing
  - Automatic retry on failed payments
- **Debit Card**:
  - Stripe Card Elements integration
  - 2.9% + $0.30 fee (disclosed upfront)
  - Instant processing
  - Secure tokenization
- **Credit Card**:
  - Same fee structure as debit
  - Rewards points for tenants
  - Immediate confirmation

**Stripe Integration:**
- **Customer Management**:
  - Automatic customer creation in Stripe
  - Payment method storage for autopay
  - Subscription management for recurring rent
- **Payment Processing**:
  - Stripe PaymentIntents API for secure transactions
  - 3D Secure authentication support
  - Receipt generation and email delivery
  - Refund and dispute handling
- **Stripe Connect**:
  - Landlord onboarding to receive payouts
  - Instant payouts (same-day transfers)
  - Platform fee collection (configurable)
  - 1099 tax form generation
- **Webhook Handling**:
  - payment_intent.succeeded
  - payment_intent.failed
  - charge.dispute.created
  - customer.subscription.updated
  - account.updated (for Connect)

**Payment Plans:**
- **Delinquency Management**:
  - Automatic detection of late payments
  - AI-powered delinquency playbooks
  - Payment plan creation (installments, reduced first payment, etc.)
  - Grace period configuration
  - Late fee calculation and application
- **Communication Workflow**:
  - Day 1: Friendly reminder via email
  - Day 3: SMS reminder with payment link
  - Day 7: Payment plan offer
  - Day 14: Notice to cure or quit
  - Day 21: Eviction proceedings (if needed)

**Financial Reporting:**
- **Revenue Reports**:
  - Monthly, quarterly, annual views
  - By property, unit, or portfolio
  - Rent collected vs. expected
  - Outstanding balances
  - Payment method breakdown
- **Expense Tracking**:
  - Maintenance costs by category
  - Vendor payments
  - Property management fees
  - Utilities and insurance
  - Categorization for tax purposes
- **Profit & Loss Statements**:
  - Income vs. expenses
  - Net operating income (NOI)
  - Cash flow analysis
  - Cap rate calculations
- **Tax Documents**:
  - 1099 generation for vendors and contractors
  - Schedule E data export for landlords
  - Expense summaries by category

**QuickBooks Integration:**
- **OAuth2 Authentication**:
  - Secure authorization flow
  - Token refresh handling
  - Multi-company support
- **Automated Sync**:
  - Rent payments → Sales Receipts
  - Expenses → Bills or Journal Entries
  - Maintenance costs → Expense tracking
  - Double-entry bookkeeping via JournalEntry API
  - Chart of Accounts mapping
- **Data Export**:
  - On-demand sync button
  - Automatic nightly sync
  - Transaction reconciliation
  - Error logging and retry logic

**Enterprise Accounting Module:**
- **Chart of Accounts**:
  - Asset, Liability, Equity, Revenue, Expense accounts
  - Hierarchical account structure
  - Account code and description
  - Active/inactive status
- **Journal Entries**:
  - Double-entry bookkeeping system
  - Debit/credit balancing enforcement
  - Entry date, posting date, reference number
  - Audit trail with user tracking
- **Financial Statements**:
  - Balance Sheet (Assets = Liabilities + Equity)
  - Income Statement (Revenue - Expenses)
  - Cash Flow Statement
  - Trial Balance
  - Account reconciliation
- **Bank Accounts**:
  - Multiple account support
  - Opening/closing balances
  - Transaction import from bank feeds
  - Reconciliation workflow

**Database Schema:**
```typescript
payments table:
- id (serial primary key)
- tenant_id, lease_id, stripe_payment_intent_id
- amount, fee_amount, net_amount
- payment_method (ach, debit, credit)
- status (pending, succeeded, failed)
- created_at, processed_at

payment_plans table:
- id (serial primary key)
- tenant_id, total_amount, installments
- start_date, installment_amount
- status (active, completed, defaulted)

chart_of_accounts table:
- id (serial primary key)
- account_code, account_name, account_type
- parent_account_id, is_active

journal_entries table:
- id (serial primary key)
- entry_date, posting_date, reference_number
- description, created_by, total_debit, total_credit

journal_entry_lines table:
- id (serial primary key)
- entry_id, account_id
- debit_amount, credit_amount, description
```

### 6. Communication System

**Email Communication (Resend):**
- **Transactional Emails**:
  - User invitations with registration links
  - Password reset requests
  - Lease signature requests (professional HTML template)
  - Payment receipts and confirmations
  - Maintenance request updates
  - Lease renewal reminders
- **Template System**:
  - Branded HTML email templates
  - Variable interpolation (name, property, amount, etc.)
  - Responsive design for mobile devices
  - Unsubscribe link compliance
- **Delivery Tracking**:
  - Sent, delivered, opened, clicked events
  - Bounce and spam complaint handling
  - Email verification for new addresses

**SMS Communication (Twilio):**
- **Automated Notifications**:
  - Rent reminders (3 days before due date)
  - Payment confirmations
  - Maintenance request updates (assigned, in_progress, completed)
  - Delinquency notices
  - Emergency alerts
  - Vendor job assignments
- **Two-Way Messaging**:
  - Tenants can reply to SMS
  - Conversations tracked in system
  - PM can respond via web interface
  - Message history and threading
- **SMS Preferences**:
  - Opt-in/opt-out management
  - Frequency capping
  - Quiet hours (no messages 10 PM - 8 AM)
  - Emergency override for critical alerts

**In-App Messaging:**
- **Direct Messages**:
  - Tenant ↔ Property Manager
  - Property Manager ↔ Vendor
  - Property Manager ↔ Landlord
- **Message Features**:
  - Real-time delivery via WebSocket
  - Read receipts
  - File attachments
  - Message search and filtering
  - Notification badges

**Notification System:**
- **Multi-Channel Delivery**:
  - Email (always sent)
  - SMS (if enabled)
  - In-app notification (real-time)
  - Push notifications (future feature)
- **Notification Types**:
  - Payment reminders and confirmations
  - Maintenance request updates
  - Lease events (signature required, expiring soon)
  - Bid notifications for vendors
  - Document uploads
  - System announcements
- **User Preferences**:
  - Granular control (email only, SMS + email, etc.)
  - Notification frequency (immediate, daily digest)
  - Quiet hours configuration
  - Category-specific settings

### 7. AI-Powered Features

**OpenAI Integration (GPT-4o-mini):**

**1. Maintenance Request Triage:**
```typescript
Input: 
- Request description
- Photo analysis (if photos provided)
- Property/unit history
- Seasonal context

Output:
- Priority level (urgent, high, medium, low)
- Recommended vendor specialty
- Estimated cost range
- Emergency flag (yes/no)
- Suggested resolution timeline
```

**Example:**
```
Description: "Water dripping from ceiling in living room"
Photos: [ceiling_damage.jpg]
AI Output:
- Priority: Urgent
- Specialty: Plumbing
- Estimated Cost: $200-$800
- Emergency: Yes
- Timeline: Within 24 hours
- Notes: "Potential pipe leak. Immediate action required to prevent structural damage."
```

**2. Fair Housing Compliance:**
- Analyzes maintenance descriptions and notes
- Flags potentially discriminatory language
- Suggests neutral alternatives
- Ensures compliance with Fair Housing Act
- Protects property managers from legal liability

**3. Lease Renewal Predictions:**
```typescript
Input:
- Tenant payment history
- Maintenance request frequency and satisfaction
- Length of tenancy
- Market rent trends
- Property condition

Output:
- Renewal probability (0-100%)
- Recommended renewal offer timing
- Suggested rent adjustment (if any)
- Risk factors (if renewal unlikely)
```

**4. Move-In/Move-Out Photo Analysis:**
- Compares move-in and move-out photos
- Identifies damage beyond normal wear and tear
- Suggests security deposit deductions
- Generates photo comparison reports
- Fair and consistent damage assessment

**5. AI Chatbot Assistant:**
- **Role-Specific Responses**:
  - Admin: System configuration, user management help
  - Property Manager: Operational guidance, best practices
  - Tenant: FAQ, how-to guides, troubleshooting
  - Vendor: Job instructions, documentation requirements
  - Landlord: Financial questions, reporting help
- **Features**:
  - Natural language understanding
  - Context-aware responses
  - Integration with knowledge base
  - Escalation to human support
  - Conversation history and threading
- **Chatbot UI**:
  - Floating chat widget on all portal pages
  - Minimizable and expandable
  - Typing indicators
  - Code syntax highlighting
  - Link previews

**AI Service Architecture:**
```typescript
// server/services/openaiService.ts
- triageMaintenanceRequest()
- checkFairHousingCompliance()
- predictLeaseRenewal()
- analyzePropertyPhotos()
- chatbotResponse()
```

**Cost Optimization:**
- GPT-4o-mini for cost efficiency (10x cheaper than GPT-4)
- Request batching for bulk operations
- Response caching for common queries
- Token usage monitoring and alerts
- Fallback to rule-based logic if API unavailable

### 8. Document & File Management

**Replit Object Storage Integration:**
- **Access Control Levels**:
  - USER_LIST: Specific users by ID
  - EMAIL_DOMAIN: All users from a domain
  - GROUP_MEMBER: Users with specific role
  - SUBSCRIBER: Platform subscribers only
- **File Categories**:
  - Lease agreements (PDF)
  - Inspection reports (PDF with photos)
  - Maintenance photos (JPEG, PNG)
  - Vendor certifications (PDF)
  - Property photos (JPEG, PNG)
  - Invoice documents (PDF)
  - Tax forms (PDF)

**Upload System:**
- **Uppy Integration**:
  - Drag-and-drop interface
  - Multi-file selection
  - Progress indicators
  - Pause/resume uploads
  - Client-side image compression
  - Preview before upload
- **File Validation**:
  - Max file size: 10MB
  - Allowed types: PDF, JPEG, PNG, XLSX, CSV
  - Virus scanning (future feature)
  - Duplicate detection

**Document Generation:**
- **PDF Generation**:
  - Lease agreements from templates
  - Inspection reports with photos
  - Financial statements
  - Payment receipts
  - Tax documents (1099, Schedule E)
- **PowerPoint Generation**:
  - Sales pitch decks
  - Property marketing presentations
  - Investor reports
  - Quarterly business reviews

**E-Signature Documents:**
- DocuSign integration for lease signing
- Comprehensive audit trail:
  - Document hash (SHA-256)
  - Signer IP address and user agent
  - Timestamp (UTC and local)
  - Document version tracking
  - Certificate of completion
- Signed document storage in Object Storage
- Automatic lease status updates

**Document Organization:**
- Hierarchical folder structure (Property → Unit → Tenant)
- Tagging and categorization
- Full-text search
- Version history
- Expiration date tracking for leases
- Automatic retention policy enforcement

### 9. Bulk Data Import System

**Import Wizard:**
- **Step 1: Select Data Type**
  - Properties
  - Units
  - Tenants (sends email invitations automatically)
  - Leases
  - Vendors
  - Maintenance Requests
  - Transactions

- **Step 2: Choose Source System**
  - AppFolio
  - Buildium
  - Yardi
  - RentManager
  - Generic CSV/Excel

- **Step 3: Upload File**
  - CSV or Excel (.xlsx, .xls) support
  - Max file size: 10MB
  - Drag-and-drop or file browser
  - File validation and format detection

- **Step 4: Field Mapping**
  - **Auto-Mapping**: Intelligent field detection based on source system
  - **Manual Override**: Adjust mappings as needed
  - **Preview**: See first 10 rows with mapped fields
  - **Required Field Validation**: Ensures critical fields are mapped

- **Step 5: Validation**
  - **Dry Run Mode**: Test import without committing data
  - **Error Detection**:
    - Invalid data formats (emails, phone numbers, dates)
    - Missing required fields
    - Referential integrity violations
    - Duplicate detection
  - **Warning System**: Non-critical issues highlighted

- **Step 6: Import Execution**
  - **Progress Tracking**: Real-time row-by-row progress
  - **Success/Failure Counts**: Live statistics
  - **Error Reporting**: Detailed error log with row numbers
  - **Partial Success**: Continues on errors, reports at end

**Data Normalization:**
- **Address Standardization**:
  - USPS address validation
  - State abbreviation normalization (California → CA)
  - ZIP code formatting (12345-6789)
- **Phone Number Formatting**:
  - E.164 format conversion
  - US/international number support
  - Invalid number detection
- **Email Validation**:
  - RFC 5322 compliance
  - Domain verification
  - Duplicate email detection
- **Date Parsing**:
  - Multiple format support (MM/DD/YYYY, YYYY-MM-DD, etc.)
  - Timezone handling
  - Invalid date detection
- **Currency Normalization**:
  - Strip currency symbols ($, €, £)
  - Decimal precision enforcement
  - Negative value handling
- **Status Field Mapping**:
  - Competitor status → PropertyFlows status
  - Case-insensitive matching
  - Default fallback values

**Import History:**
- **Audit Trail**:
  - Import ID, timestamp, user
  - Source file name and size
  - Data type imported
  - Total rows, success count, failure count
  - Field mapping used
  - Error log access
- **Rollback Capability**:
  - Rollback completed imports (future feature)
  - Undo partial imports
  - Data cleanup utilities

**Import Order (Critical for Referential Integrity):**
```
1. Properties (no dependencies)
2. Units (requires properties)
3. Tenants (requires units, sends invitations)
4. Leases (requires units and tenants)
5. Vendors (no dependencies)
6. Maintenance Requests (requires units, tenants, vendors)
7. Transactions (requires leases)
```

**Technical Implementation:**
```typescript
// Backend
- CSV parsing: PapaParse
- Excel parsing: XLSX
- Field mapping templates: Pre-configured for each source system
- Validation: Zod schemas + custom business logic
- Batch processing: 100 rows at a time for performance
- Transaction management: Rollback on critical failures

// Frontend
- Multi-step wizard: React Hook Form + state machine
- Progress tracking: Real-time updates via WebSocket
- Error display: Grouped by type, exportable CSV
- File upload: Uppy with validation
```

### 10. Tenant Marketplace (Public Unit Browsing)

**Public Features:**
- **Unit Listings**:
  - Browse available units without authentication
  - Filter by:
    - Location (city, state, ZIP)
    - Price range
    - Bedrooms, bathrooms
    - Square footage
    - Amenities (parking, pets allowed, laundry, etc.)
    - Available date
  - Sort by: Price (low/high), newest, square footage
  - Map view with property pins
- **Unit Details Page**:
  - Photo gallery with lightbox
  - Full description
  - Amenities list
  - Monthly rent and deposit
  - Available date
  - Property information (address, type)
  - Nearby schools, transit, shopping (future feature)
  - **Apply Now** button → Application form

**Application System:**
- **Online Application Form**:
  - Personal information (name, email, phone)
  - Current address and move-in date
  - Employment information (employer, income)
  - Rental history (previous landlords, addresses)
  - Emergency contact
  - Pet information
  - Background check consent
- **Document Upload**:
  - Photo ID
  - Pay stubs (last 3 months)
  - Bank statements
  - Reference letters
- **Application Fee Payment**:
  - Stripe integration ($25-$50 typical fee)
  - Transparent fee disclosure
  - Instant receipt
- **Screening Integration**:
  - TransUnion SmartMove API (ready for setup)
  - Credit report pull
  - Criminal background check
  - Eviction history
  - Automated risk scoring

**Property Manager Review:**
- View all applications for a unit
- Filter by status (pending, approved, denied)
- Sort by application date or screening score
- Side-by-side applicant comparison
- Inline applicant creation for walk-in applications
- Approve/deny with automated email notifications
- Fair Housing compliance tracking

**Zillow Integration:**
- **Listing Syndication**:
  - One-click publish to Zillow, Trulia, HotPads
  - Automatic field mapping (rent, bedrooms, photos)
  - Status sync (available ↔ rented)
  - Photo upload and ordering
- **Analytics**:
  - Total views
  - Total inquiries
  - Click-through rate
  - Lead quality scoring
- **Updates**:
  - Rent changes automatically sync
  - Availability status updates
  - Photo additions/removals
  - Description updates

### 11. Multi-Factor Authentication (MFA)

**TOTP-Based 2FA:**
- **Setup Flow**:
  1. User navigates to Settings → Security
  2. Click "Enable Two-Factor Authentication"
  3. QR code displayed (generated by OTPLib)
  4. Scan with authenticator app (Google Authenticator, Authy, etc.)
  5. Enter 6-digit verification code
  6. MFA enabled + backup codes generated
- **Login Flow**:
  1. Enter username/password
  2. Redirect to MFA verification page
  3. Enter 6-digit code from authenticator app
  4. Code validation (30-second time window)
  5. Successful login → session created
- **Backup Codes**:
  - 10 single-use backup codes generated
  - Downloadable or printable
  - Used if authenticator app unavailable
  - Regeneration option available
- **Recovery Process**:
  - Admin-assisted MFA reset for locked-out users
  - Identity verification required
  - Audit log entry created

**Security Benefits:**
- Protection against password theft
- Reduces account takeover risk
- Compliance with security best practices
- Optional for users, required for admins

### 12. 30-Minute Onboarding Wizard

**Purpose**: Guide new property managers through initial setup

**Wizard Steps:**

**Step 1: Welcome & Account Setup**
- Company information (name, logo upload)
- Primary contact details
- Timezone and currency preferences
- Progress: 0% → 16%

**Step 2: Property Information**
- Add first property (name, address, type)
- Upload property photo
- Set property manager assignment
- Progress: 16% → 33%

**Step 3: Unit Configuration**
- Add units to first property
- Set rent amounts and availability
- Unit amenities and details
- Progress: 33% → 50%

**Step 4: Integration Setup**
- Connect Stripe for payments
- Optional: QuickBooks, Twilio, Resend
- API key entry and testing
- Progress: 50% → 66%

**Step 5: Invite Team Members**
- Add landlords, property managers, vendors
- Send email invitations
- Set user roles and permissions
- Progress: 66% → 83%

**Step 6: Tenant Onboarding**
- Add existing tenants (manual or CSV import)
- Send tenant invitations
- Set up first leases
- Progress: 83% → 100%

**Completion:**
- Onboarding complete celebration screen
- Quick start guide links
- Video tutorial access
- Dashboard redirect

**Database Tracking:**
```typescript
onboarding_progress table:
- user_id (references users)
- current_step (1-6)
- completed_steps (array)
- is_complete (boolean)
- completed_at (timestamp)
```

**Benefits:**
- Reduces time-to-value for new customers
- Ensures critical setup tasks completed
- Improves user retention
- Collects essential configuration upfront

### 13. Settings & Preferences

**User Settings:**
- **Profile**:
  - Name, email, phone
  - Profile photo upload
  - Bio/description
  - Role display
- **Security**:
  - Change password
  - Enable/disable MFA
  - View login history
  - Active sessions management
- **Notifications**:
  - Email preferences (by category)
  - SMS preferences (by category)
  - In-app notification settings
  - Quiet hours configuration
- **Localization**:
  - Currency preference (USD, EUR, GBP, CAD, AUD)
  - Timezone selection
  - Language preference (English, Spanish - future)
  - Date format (MM/DD/YYYY, DD/MM/YYYY)
- **Privacy**:
  - GDPR data export request
  - Account deletion request
  - Marketing email consent
  - Cookie preferences

**Property Manager Settings:**
- **Property Defaults**:
  - Default late fee amount and grace period
  - Standard lease terms
  - Maintenance response SLAs
  - Vendor payment terms
- **Payment Settings**:
  - Accepted payment methods
  - Processing fees (passed to tenant or absorbed)
  - Autopay encouragement settings
  - Payment plan templates
- **Communication Templates**:
  - Email signature
  - SMS sender name
  - Standard message templates
  - Automated notification timing

**Admin Settings:**
- **Platform Configuration**:
  - Feature flags (enable/disable features)
  - Pricing tier management
  - Maintenance windows
  - Rate limit thresholds
- **Integration Management**:
  - API key rotation
  - Webhook endpoint configuration
  - Service health monitoring
  - Usage analytics
- **Security Policies**:
  - Password requirements
  - Session timeout duration
  - IP allowlist/blocklist
  - MFA enforcement rules

### 14. Business Presentation Decks

**PowerPoint Generation (PptxGenJS):**

**1. Sales Deck:**
- Problem statement (property management pain points)
- Solution overview (PropertyFlows features)
- Competitive advantage (tenant-first UX, AI, integrations)
- Pricing transparency
- Customer testimonials (future)
- Call to action

**2. Pitch Deck (Investor):**
- Market opportunity ($88B property management market)
- Problem/solution fit
- Business model (SaaS subscription + transaction fees)
- Traction metrics (users, revenue, growth rate)
- Team introduction
- Financial projections
- Funding ask

**3. Features Deck:**
- Detailed feature breakdowns with screenshots
- User role overviews (Admin, PM, Tenant, Vendor, Landlord)
- Integration highlights
- AI capabilities
- Security and compliance
- Roadmap preview

**4. Product Deck:**
- Technical architecture overview
- Technology stack
- Scalability and performance
- Security measures
- API documentation
- Developer resources

**Export Options:**
- PowerPoint (.pptx) download
- PDF export via html2pdf.js
- Email delivery
- Cloud storage integration (future)

**Use Cases:**
- Sales presentations to prospects
- Investor pitches for funding
- Customer training and onboarding
- Partner marketing materials

---

## User Roles & Permissions

### Role-Based Access Control (RBAC)

**Role Hierarchy:**
```
Admin (superuser)
├─→ Property Manager
│   └─→ Landlord/Owner
├─→ Tenant
└─→ Vendor
```

### Role Definitions

#### Admin
**Capabilities:**
- Full system access
- User management (create, edit, delete)
- Property management (all properties)
- Integration configuration
- Platform settings
- Bulk data import/export
- Audit log access
- Financial reporting (all accounts)
- Support ticket management

**Restrictions:**
- None (superuser access)

**Use Cases:**
- Platform administrators
- Customer support staff
- System developers

#### Property Manager
**Capabilities:**
- Manage assigned properties and units
- Tenant management (view, invite, edit)
- Lease creation and management
- Maintenance request oversight
- Vendor assignment and management
- Financial reporting (own properties only)
- Send DocuSign envelopes
- Approve vendor bids
- Create payment plans
- Bulk import for own portfolio
- Inline applicant creation
- Zillow listing management

**Restrictions:**
- Cannot access other PM's properties
- Cannot modify platform settings
- Cannot delete users (only deactivate tenants)
- Cannot view system-wide analytics

**Use Cases:**
- Property management companies
- Building superintendents
- Portfolio managers

#### Landlord/Owner
**Capabilities:**
- View owned properties (read-only)
- Financial dashboard for own properties
- Tenant information (view only)
- Maintenance request viewing
- Document access (leases, reports)
- Receive payout via Stripe Connect
- Approve major expenses (>$500)
- View vendor bids and proposals
- Review and download reports
- Communication with property manager

**Restrictions:**
- Cannot edit property/unit details
- Cannot assign vendors
- Cannot manage tenants directly
- Cannot send communications to tenants
- Cannot access other landlords' data

**Use Cases:**
- Individual property owners
- Real estate investors
- Passive landlords with PM services

#### Tenant
**Capabilities:**
- View own lease and unit details
- Submit rent payments
- Submit maintenance requests
- Upload documents (ID, pay stubs)
- Update contact information
- Set notification preferences
- E-sign lease documents
- View payment history
- Chat with property manager

**Restrictions:**
- Cannot view other tenants' information
- Cannot access property-level data
- Cannot view vendor details
- Cannot modify lease terms
- No financial reporting access

**Use Cases:**
- Apartment residents
- Commercial tenants
- Single-family home renters

#### Vendor
**Capabilities:**
- View assigned jobs
- Submit bids with attachments
- Upload work documentation (photos, invoices)
- Communicate with property manager
- View payment history
- Update service specialties
- Set availability status
- Access job history

**Restrictions:**
- Cannot view all maintenance requests
- Cannot access tenant information
- Cannot view property financials
- Cannot access other vendor data
- Cannot approve own bids

**Use Cases:**
- Plumbers, electricians, HVAC technicians
- General contractors
- Landscaping services
- Pest control companies

### Permission Matrix

| Feature | Admin | PM | Landlord | Tenant | Vendor |
|---------|-------|----|---------| -------|--------|
| View Own Data | ✅ | ✅ | ✅ | ✅ | ✅ |
| View All Properties | ✅ | 🟡 | ❌ | ❌ | ❌ |
| Create Property | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Property | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Property | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Units | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Tenants | ✅ | ✅ | ✅ | 🟡 | ❌ |
| Invite Tenants | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Lease | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sign Lease | ✅ | ✅ | ❌ | ✅ | ❌ |
| Submit Maintenance | ✅ | ✅ | ❌ | ✅ | ❌ |
| Assign Vendor | ✅ | ✅ | ❌ | ❌ | ❌ |
| Submit Bid | ❌ | ❌ | ❌ | ❌ | ✅ |
| Approve Bid | ✅ | ✅ | 🟡 | ❌ | ❌ |
| Process Payment | ✅ | ✅ | ❌ | ✅ | ❌ |
| Financial Reports | ✅ | 🟡 | 🟡 | 🟡 | 🟡 |
| Bulk Import | ✅ | ✅ | ❌ | ❌ | ❌ |
| Integration Setup | ✅ | 🟡 | ❌ | ❌ | ❌ |
| User Management | ✅ | 🟡 | ❌ | ❌ | ❌ |
| Platform Settings | ✅ | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Full Access
- 🟡 Limited Access (own data only or requires approval)
- ❌ No Access

### Multi-Tenancy Security

**Data Isolation:**
- All database queries filtered by user role and ownership
- Property Manager sees only assigned properties
- Landlords see only owned properties
- Tenants see only own lease and unit
- Vendors see only assigned jobs

**Implementation:**
```typescript
// Middleware example
app.get('/api/properties', requireAuth, async (req, res) => {
  const user = req.user;
  
  // Admin: all properties
  if (user.role === 'admin') {
    return await storage.getAllProperties();
  }
  
  // Property Manager: assigned properties
  if (user.role === 'property_manager') {
    return await storage.getPropertiesByManager(user.id);
  }
  
  // Landlord: owned properties
  if (user.role === 'landlord') {
    return await storage.getPropertiesByOwner(user.id);
  }
  
  // Others: forbidden
  return res.status(403).json({ error: 'Forbidden' });
});
```

**Audit Trail:**
- All sensitive actions logged with:
  - User ID and role
  - Action type (create, read, update, delete)
  - Resource affected (property ID, tenant ID, etc.)
  - Timestamp
  - IP address
  - User agent
- Admin-accessible audit log viewer
- Compliance reporting (GDPR, SOC 2)

---

## External Integrations

### 1. Stripe - Payment Processing

**Integration Type:** REST API + Webhooks
**Documentation:** https://stripe.com/docs/api

**Credentials:**
- `STRIPE_SECRET_KEY` - Server-side API key
- `VITE_STRIPE_PUBLIC_KEY` - Client-side publishable key
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification

**Features Implemented:**

**Payment Processing:**
- **PaymentIntents API**: Secure payment collection with 3D Secure
- **Customer Management**: Automatic customer creation and storage
- **Payment Methods**: ACH, debit cards, credit cards
- **Subscriptions**: Recurring rent payments with autopay
- **Invoicing**: Automated invoice generation and delivery

**Stripe Connect:**
- **Account Onboarding**: Landlord/vendor registration for payouts
- **Instant Payouts**: Same-day bank transfers
- **Platform Fees**: Configurable percentage or fixed fee
- **Tax Reporting**: Automatic 1099 generation
- **Identity Verification**: KYC compliance

**Webhooks Handled:**
```typescript
- payment_intent.succeeded → Update payment status
- payment_intent.failed → Retry logic + notification
- charge.dispute.created → Alert PM, hold funds
- customer.subscription.updated → Update autopay status
- account.updated → Sync Connect account changes
- transfer.created → Record platform fees
```

**Security:**
- PCI DSS compliance (Stripe handles sensitive data)
- Client-side tokenization (no card numbers on server)
- Webhook signature verification
- Idempotency keys for retries

**Error Handling:**
- Insufficient funds → Retry after 3 days
- Card declined → Notify tenant, offer payment plan
- Dispute filed → Freeze payout, request evidence
- API failures → Graceful degradation, retry queue

**Service File:** `server/stripe.ts`

### 2. Plaid - Bank Account Verification

**Integration Type:** REST API
**Documentation:** https://plaid.com/docs/

**Credentials:**
- `PLAID_CLIENT_ID` - Application identifier
- `PLAID_SECRET` - API secret key
- `PLAID_ENV` - Environment (sandbox, development, production)

**Features Implemented:**

**Link Token Creation:**
- Generate secure token for Plaid Link widget
- Configure products (auth, transactions, identity)
- Set client_name and user information
- Return token to frontend for widget initialization

**Bank Account Linking:**
- User authenticates with bank via Plaid Link
- Plaid returns public_token
- Exchange public_token for access_token (server-side)
- Store access_token securely for future use

**Account Verification:**
- Retrieve account details (account number, routing number)
- Verify account ownership
- Check account type (checking, savings)
- Validate account is active and can accept ACH

**Balance Checks:**
- Optional real-time balance verification
- Prevent NSF (non-sufficient funds) transactions
- Risk scoring for payment reliability

**Use Cases:**
- Tenant autopay setup (ACH rent payments)
- Landlord payout account verification
- Vendor payment account linking
- Instant account verification (no micro-deposits)

**Benefits:**
- Reduces payment failures by 30%
- Instant verification (vs. 2-3 day micro-deposits)
- Better user experience (no manual account entry)
- Lower fraud risk (bank-level authentication)

**Error Handling:**
- Invalid credentials → Retry with clear error message
- Unsupported bank → Offer manual account entry fallback
- API downtime → Queue request, retry automatically
- Link expiration → Generate new token

**Service File:** `server/services/plaidService.ts`

**API Endpoints:**
- `POST /api/integrations/plaid/link-token` - Create Link token
- `POST /api/integrations/plaid/verify` - Verify bank account

### 3. DocuSign - E-Signature

**Integration Type:** REST API (JWT OAuth)
**Documentation:** https://developers.docusign.com/

**Credentials:**
- `DOCUSIGN_INTEGRATION_KEY` - Application identifier
- `DOCUSIGN_USER_ID` - User GUID
- `DOCUSIGN_ACCOUNT_ID` - DocuSign account ID
- `DOCUSIGN_PRIVATE_KEY` - RSA private key for JWT auth

**Features Implemented:**

**JWT Authentication:**
- Generate JWT assertion with RSA private key
- Request access token from DocuSign
- Token refresh handling (1 hour expiration)
- Scope-based permissions

**Envelope Creation:**
- Upload lease PDF document
- Add signers (tenant email/name)
- Set signing order (if multiple signers)
- Configure email subject and message
- Add custom fields (property address, rent amount)
- Set envelope status (sent, draft)

**Signing Workflow:**
- DocuSign sends professional email to signer
- Signer clicks link → DocuSign signing interface
- Review document with highlighted signature fields
- E-sign with typed, drawn, or uploaded signature
- Submit completed document
- Certificate of completion generated

**Status Tracking:**
- Get envelope status (sent, delivered, completed, voided)
- Retrieve signing events with timestamps
- Check signer status for each recipient
- Webhook notifications for status changes (future)

**Document Retrieval:**
- Download completed, signed documents
- Get certificate of completion
- Retrieve signing audit trail
- Store in Replit Object Storage

**Use Cases:**
- Lease agreement signing
- Lease renewal agreements
- Addendums and amendments
- Move-out inspection reports
- Legal notices and disclosures

**Compliance:**
- ESIGN Act compliant
- UETA (Uniform Electronic Transactions Act) compliant
- Comprehensive audit trail with:
  - Signer authentication
  - IP address and geolocation
  - Timestamp for each action
  - Document hash verification
  - Certificate of completion

**Error Handling:**
- Authentication failure → Refresh JWT, retry
- Invalid email → Validation error to user
- Envelope voided → Update lease status, notify PM
- API downtime → Queue request, manual fallback available

**Service File:** `server/services/docusignService.ts`

**API Endpoints:**
- `POST /api/integrations/docusign/send-envelope` - Send lease for signature
- `GET /api/integrations/docusign/envelope/:envelopeId` - Get status

### 4. Zillow Rental Manager - Listing Syndication

**Integration Type:** REST API
**Documentation:** https://www.zillow.com/partners/rental-manager/

**Credentials:**
- `ZILLOW_API_KEY` - API authentication key
- `ZILLOW_PARTNER_ID` - Partner account identifier

**Features Implemented:**

**Listing Creation:**
- Publish properties to Zillow, Trulia, HotPads simultaneously
- Required fields:
  - Address (street, city, state, ZIP)
  - Property details (bedrooms, bathrooms, square feet)
  - Listing info (monthly rent, description, available date)
  - Photos (up to 30 images with ordering)
  - Amenities (parking, pets, laundry, etc.)
- Returns listing_id for future updates

**Listing Updates:**
- Modify rent amount
- Change availability status
- Update description and amenities
- Add/remove/reorder photos
- Set as rented (removes from public listings)
- **Nested Payload Structure**:
  - `address` object (streetAddress, city, state, zipCode)
  - `property` object (bedrooms, bathrooms, squareFeet)
  - `listing` object (monthlyRent, description, amenities, availableDate)
  - `media` object (photos array with url and order)

**Listing Deletion:**
- Remove listing from all Zillow properties
- Permanent deletion (cannot be undone)
- Returns success confirmation

**Analytics & Status:**
- Total views across all platforms
- Inquiries received (leads)
- Click-through rates
- Days on market
- Listing status (active, pending, rented, removed)

**Sync Convenience Method:**
- `syncUnitToZillow(unitId)` - One-click sync from PropertyFlows unit
- Automatically maps unit fields to Zillow format
- Creates new listing if doesn't exist
- Updates existing listing if zillow_listing_id present
- Uploads unit photos to Zillow

**Benefits:**
- 3x more exposure (Zillow + Trulia + HotPads)
- Increased lead generation
- Centralized listing management
- Automatic status sync
- Professional listing presentation

**Use Cases:**
- Publish new available units
- Update rent prices across platforms
- Mark units as rented automatically
- Track listing performance
- A/B test descriptions and photos

**Error Handling:**
- Invalid API key → Configuration error, admin notification
- Duplicate listing → Return existing listing_id
- Missing required field → Validation error with details
- Photo upload failure → Retry individual photos
- API rate limiting → Exponential backoff retry

**Service File:** `server/services/zillowService.ts`

**API Endpoints:**
- `POST /api/integrations/zillow/sync-unit` - Sync PropertyFlows unit
- `GET /api/integrations/zillow/listing/:listingId` - Get analytics

### 5. QuickBooks Online - Accounting Integration

**Integration Type:** REST API (OAuth 2.0)
**Documentation:** https://developer.intuit.com/app/developer/qbo/

**Credentials:**
- `QUICKBOOKS_CLIENT_ID` - OAuth client ID
- `QUICKBOOKS_CLIENT_SECRET` - OAuth client secret
- `QUICKBOOKS_REDIRECT_URI` - OAuth callback URL
- Access tokens and refresh tokens (per connected account)

**Features Implemented:**

**OAuth Flow:**
- Redirect user to QuickBooks authorization
- User grants permission to access company data
- Receive authorization code
- Exchange code for access_token and refresh_token
- Store tokens securely (encrypted)
- Automatic token refresh (expires every 1 hour)

**Chart of Accounts Sync:**
- Retrieve QuickBooks account list
- Map to PropertyFlows accounts
- Support for account types: Asset, Liability, Equity, Revenue, Expense
- Hierarchical account structure (parent/child)

**Journal Entry Sync:**
- Create journal entries in QuickBooks
- Double-entry bookkeeping enforcement
- Line items with account, debit, credit
- Reference number and memo fields
- Automatic balancing validation

**Transaction Mapping:**
- **Rent Payments** → Sales Receipt or Journal Entry
  - Debit: Bank Account
  - Credit: Rental Income
- **Maintenance Expenses** → Bill or Journal Entry
  - Debit: Repairs & Maintenance Expense
  - Credit: Accounts Payable or Cash
- **Security Deposits** → Journal Entry
  - Debit: Cash
  - Credit: Security Deposit Liability
- **Refunds** → Journal Entry
  - Debit: Security Deposit Liability
  - Credit: Cash

**Sync Modes:**
- **Manual Sync**: On-demand button click
- **Automatic Sync**: Nightly batch process
- **Real-Time Sync**: Webhook-triggered (future)

**Reconciliation:**
- Transaction matching by reference ID
- Duplicate prevention
- Error logging for failed syncs
- Retry queue for transient failures

**Reports:**
- Sync status dashboard
- Error log viewer
- Transaction mapping report
- Last sync timestamp

**Benefits:**
- Eliminates duplicate data entry
- Ensures accounting accuracy
- Real-time financial visibility
- Tax preparation simplification
- Audit trail compliance

**Error Handling:**
- Token expired → Automatic refresh, retry
- Account mapping missing → Prompt user to configure
- Unbalanced entry → Log error, alert admin
- API unavailable → Queue transaction, retry later
- Duplicate transaction → Skip, log for review

**Service File:** `server/services/quickbooksService.ts`

**API Endpoints:**
- `GET /api/integrations/quickbooks/auth` - Initiate OAuth
- `GET /api/integrations/quickbooks/callback` - OAuth callback
- `POST /api/integrations/quickbooks/sync` - Trigger manual sync
- `GET /api/integrations/quickbooks/status` - View sync status

### 6. OpenAI - AI Services

**Integration Type:** REST API
**Documentation:** https://platform.openai.com/docs/api-reference

**Credentials:**
- `OPENAI_API_KEY` - API authentication key

**Model Used:**
- **GPT-4o-mini** - Cost-efficient, fast, high-quality responses
  - 10x cheaper than GPT-4
  - Suitable for production at scale
  - 128k token context window
  - Multimodal (text + images)

**Features Implemented:**

**1. Maintenance Triage:**
```typescript
Input:
{
  description: string,
  photos?: string[], // URLs or base64
  unitId: number,
  propertyHistory?: object
}

Prompt:
"Analyze this maintenance request and provide:
1. Priority (urgent/high/medium/low)
2. Recommended vendor specialty
3. Estimated cost range
4. Is this an emergency?
5. Suggested timeline"

Output:
{
  priority: "urgent",
  specialty: "plumbing",
  costRange: "$200-$800",
  isEmergency: true,
  timeline: "Within 24 hours",
  reasoning: "Pipe leak detected..."
}
```

**2. Fair Housing Compliance:**
```typescript
Input: Maintenance description or PM notes

Prompt:
"Check this text for Fair Housing Act violations.
Flag any discriminatory language regarding:
- Race, color, national origin
- Religion
- Sex (including gender identity, sexual orientation)
- Familial status
- Disability
Suggest neutral alternatives."

Output:
{
  violations: ["Reference to family composition"],
  suggestions: ["Replace 'family' with 'household'"],
  risk: "medium"
}
```

**3. Lease Renewal Prediction:**
```typescript
Input:
{
  paymentHistory: object,
  maintenanceRequests: number,
  tenancyLength: number,
  marketRent: number,
  currentRent: number
}

Prompt:
"Predict tenant lease renewal likelihood.
Consider:
- Payment consistency
- Maintenance frequency
- Tenancy duration
- Rent vs. market rate"

Output:
{
  renewalProbability: 0.85,
  confidence: "high",
  factors: [
    "+ Perfect payment history",
    "+ Long tenancy (3 years)",
    "- Rent 15% above market"
  ],
  recommendation: "Offer 5% rent reduction"
}
```

**4. Photo Analysis (Move-In/Move-Out):**
```typescript
Input:
{
  moveInPhotos: string[],
  moveOutPhotos: string[]
}

Prompt:
"Compare move-in vs. move-out photos.
Identify:
- New damage (beyond normal wear)
- Missing items
- Excessive dirt/stains
- Needed repairs
Suggest security deposit deductions."

Output:
{
  damages: [
    {
      location: "Living room wall",
      description: "Large hole (not present at move-in)",
      suggestedDeduction: 150,
      repairRequired: "Drywall patch and paint"
    }
  ],
  totalDeduction: 150,
  photoPairs: [...]
}
```

**5. AI Chatbot:**
```typescript
System Prompt (Role-Based):
Admin: "You are a PropertyFlows admin assistant.
Help with system configuration, user management,
and troubleshooting."

Tenant: "You are a helpful tenant support assistant.
Answer questions about rent payment, maintenance
requests, and lease agreements."

Prompt:
User: "How do I pay rent?"
Assistant: "You can pay rent in three ways:
1. ACH bank transfer (free)..."
```

**Cost Optimization:**
- Request batching for bulk operations
- Response caching (TTL: 24 hours for static content)
- Token usage monitoring and alerts
- Fallback to rule-based logic if quota exceeded
- Summary mode for long conversations

**Security:**
- API key never exposed to client
- PII redaction in logs
- Rate limiting per user
- Content filtering for inappropriate requests

**Error Handling:**
- API unavailable → Fallback to manual triage
- Rate limit → Queue request, notify user of delay
- Invalid response → Log error, return default values
- Cost threshold → Disable AI, alert admin

**Service File:** `server/services/openaiService.ts`

### 7. Twilio - SMS Messaging

**Integration Type:** REST API
**Documentation:** https://www.twilio.com/docs/sms

**Credentials:**
- `TWILIO_ACCOUNT_SID` - Account identifier
- `TWILIO_AUTH_TOKEN` - API authentication token
- `TWILIO_PHONE_NUMBER` - Sending phone number

**Features Implemented:**

**Automated SMS Notifications:**
- **Rent Reminders**:
  - 3 days before due date
  - Day of due date (if not paid)
  - Template: "Hi {name}, your rent of ${amount} is due on {date}. Pay here: {link}"
- **Payment Confirmations**:
  - Sent immediately after successful payment
  - Template: "Payment of ${amount} received. Thank you!"
- **Maintenance Updates**:
  - Request received: "Your maintenance request #{id} has been submitted."
  - Vendor assigned: "{vendor} has been assigned to your request."
  - Work completed: "Your request #{id} is complete. Rate the service here: {link}"
- **Delinquency Notices**:
  - Day 1: Friendly reminder
  - Day 3: Second notice
  - Day 7: Payment plan offer
  - Day 14: Final notice
- **Vendor Job Notifications**:
  - New job available: "New job at {address}. View details: {link}"
  - Bid accepted: "Your bid for job #{id} was accepted!"
  - Payment sent: "${amount} payment sent for job #{id}."

**Two-Way Messaging:**
- Tenant replies to SMS → Twilio webhook → PropertyFlows
- Message stored in database with thread tracking
- PM can respond via web interface
- Conversation history displayed in chat format
- Auto-responses for common keywords ("STOP", "HELP")

**Message Features:**
- Unicode support (emoji, international characters)
- URL shortening for links
- Message status tracking (sent, delivered, failed, undelivered)
- Delivery receipts via webhooks
- Failed message retry logic

**Opt-In/Opt-Out Management:**
- Explicit opt-in during account creation
- "Reply STOP to unsubscribe" in every message
- Automatic opt-out processing
- Re-opt-in capability
- Compliance with TCPA (Telephone Consumer Protection Act)

**Quiet Hours:**
- No messages sent between 10 PM - 8 AM (local time)
- Emergency override for critical alerts (fire, flood, safety)
- Timezone-aware scheduling

**Rate Limiting:**
- Max 5 messages per user per day
- Urgent messages prioritized
- Bulk messaging batched (10 messages per second)

**Cost Management:**
- Message cost: ~$0.0075 per SMS
- Monthly budget alerts
- Usage analytics dashboard
- Cost per tenant calculation

**Error Handling:**
- Invalid number → Log error, fall back to email
- Message failed → Retry 3 times, escalate to email
- Carrier blocking → Mark number as invalid
- API downtime → Queue messages, send when restored

**Service File:** `server/services/twilioService.ts`

### 8. Resend - Email Service

**Integration Type:** REST API
**Documentation:** https://resend.com/docs

**Credentials:**
- `RESEND_API_KEY` - API authentication key

**Features Implemented:**

**Transactional Emails:**
- **User Invitations**:
  - Subject: "You're invited to PropertyFlows"
  - Branded HTML template with logo
  - Personalized greeting
  - Registration link with unique token
  - Expiration notice (7 days)
- **Lease Signature Requests**:
  - Subject: "Please sign your lease for {property}"
  - Professional legal document email
  - Secure signing link
  - Document preview (future)
  - Reminder emails if not signed within 3 days
- **Payment Receipts**:
  - Subject: "Payment confirmation - {amount}"
  - Payment details (date, method, amount)
  - Downloadable PDF receipt
  - Next payment due date
- **Password Reset**:
  - Subject: "Reset your password"
  - Secure reset link (expires in 1 hour)
  - Security notice (didn't request? ignore)
- **Maintenance Updates**:
  - Request received confirmation
  - Status change notifications
  - Completion notification with feedback request
- **System Notifications**:
  - Lease expiring soon (60, 30, 7 days)
  - Account security alerts (new login from new device)
  - MFA setup confirmation
  - Document uploaded notification

**HTML Email Templates:**
- Responsive design (mobile-friendly)
- Consistent branding (logo, colors, fonts)
- Clear call-to-action buttons
- Social media links in footer
- Unsubscribe link (GDPR compliant)
- Plain text fallback for accessibility

**Email Features:**
- Personalization variables (name, property, amount)
- Attachment support (PDF receipts, documents)
- CC/BCC capability
- Reply-to address configuration
- Custom headers for tracking

**Delivery Tracking:**
- Sent status (API confirmation)
- Delivered (reached inbox)
- Opened (pixel tracking)
- Clicked (link tracking)
- Bounced (soft or hard)
- Spam complaint
- Unsubscribed

**Bounce Handling:**
- Soft bounce (temporary) → Retry 3 times over 24 hours
- Hard bounce (permanent) → Mark email invalid, notify admin
- Spam complaint → Immediately unsubscribe, flag for review

**Email Preferences:**
- Granular opt-in/opt-out by category:
  - Payment notifications (required)
  - Maintenance updates (required)
  - Marketing emails (optional)
  - Feature announcements (optional)
  - Monthly summaries (optional)
- Frequency control (immediate, daily digest, weekly)
- Quiet hours (no non-urgent emails 10 PM - 8 AM)

**Template Management:**
- Stored in `server/emailTemplates/` directory
- Variable substitution with Handlebars syntax
- Version control for template changes
- A/B testing capability (future)

**Compliance:**
- CAN-SPAM Act compliant
- GDPR compliant (unsubscribe, data export)
- Physical mailing address in footer
- Clear sender identification
- Honor unsubscribe requests within 10 days

**Error Handling:**
- Invalid email → Validation error before send
- API failure → Retry 3 times with exponential backoff
- Rate limit → Queue and send when available
- Template error → Log, send plain text fallback

**Service File:** `server/services/resendService.ts`

---

## Security & Compliance

### Authentication & Authorization

**Replit Auth (OIDC):**
- OpenID Connect (OAuth 2.0 + identity layer)
- JWT token-based authentication
- Automatic token refresh
- Session management with secure cookies
- HttpOnly, Secure, SameSite flags

**Session Security:**
- PostgreSQL session storage (connect-pg-simple)
- 24-hour session expiration
- Automatic cleanup of expired sessions
- Session fixation prevention
- CSRF token validation

**Password Security:**
- Bcrypt hashing (10 rounds)
- Minimum password requirements:
  - 8 characters minimum
  - 1 uppercase letter
  - 1 lowercase letter
  - 1 number
  - 1 special character
- Password reset with time-limited tokens
- Password history (prevent reuse of last 5)

**Multi-Factor Authentication:**
- TOTP-based (Time-based One-Time Password)
- QR code enrollment
- Backup codes (10 single-use)
- Required for admin accounts
- Optional for other roles

### Security Headers (Helmet)

**Content Security Policy (CSP):**
```typescript
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.stripe.com;
  frame-ancestors 'none';
  report-uri /api/csp-report;
```

**Other Security Headers:**
- **HSTS** (HTTP Strict Transport Security):
  - `max-age=31536000` (1 year)
  - `includeSubDomains`
  - `preload`
- **X-Frame-Options**: `DENY` (clickjacking protection)
- **X-Content-Type-Options**: `nosniff`
- **X-XSS-Protection**: `1; mode=block`
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Permissions-Policy**: Restrict sensitive features

### Rate Limiting

**API Rate Limits:**
- **Global**: 100 requests per 15 minutes per IP
- **Authentication**: 5 login attempts per 15 minutes per IP
- **Payment Processing**: 10 requests per hour per user
- **File Upload**: 20 requests per hour per user
- **AI Services**: 50 requests per day per user

**Implementation:**
- Express Rate Limit middleware
- In-memory store (Memorystore) for development
- Redis for production (future)
- Custom error messages with retry-after header
- IP-based tracking with user-based overrides

### Data Protection

**Encryption:**
- **At Rest**:
  - Database encryption (PostgreSQL native encryption)
  - File encryption (Object Storage server-side encryption)
  - API key encryption (AES-256)
- **In Transit**:
  - TLS 1.3 for all connections
  - Certificate pinning for critical APIs
  - Encrypted webhook payloads

**PII Handling:**
- Minimal data collection (only what's necessary)
- PII redaction in logs (phone, email, SSN masked)
- Right to be forgotten (GDPR data deletion)
- Data export capability (GDPR compliance)
- Encryption of sensitive fields (SSN, bank account)

**Access Control:**
- Role-based access control (RBAC)
- Principle of least privilege
- Audit logging for sensitive operations
- Multi-tenancy data isolation
- IP allowlisting for admin access (optional)

### Compliance

**GDPR (General Data Protection Regulation):**
- Data export: User can download all their data
- Data deletion: Account deletion removes all PII
- Consent tracking: Marketing email opt-in required
- Privacy policy: Clear explanation of data usage
- Data processing agreement (DPA) for EU customers
- Breach notification: Within 72 hours of discovery

**PCI DSS (Payment Card Industry Data Security Standard):**
- No credit card data stored on servers
- Stripe handles all card tokenization
- PCI SAQ-A compliance (simplest level)
- Secure transmission (TLS 1.3)
- Regular security scans

**Fair Housing Act:**
- AI compliance checking for discriminatory language
- Equal treatment policies enforced
- Audit trail for all decisions
- Training materials for property managers
- Complaint reporting mechanism

**ESIGN Act & UETA:**
- Legally valid e-signatures via DocuSign
- Comprehensive audit trail
- Signer consent captured
- Document integrity verification (SHA-256 hash)
- Certificate of completion

**State-Specific Regulations:**
- California: CCPA (California Consumer Privacy Act) compliance
- New York: Rent regulation compliance tracking
- Security deposit laws: Automated compliance by state
- Notice period requirements: Configurable by jurisdiction

### Vulnerability Management

**Security Measures:**
- Regular dependency updates (npm audit)
- Automated vulnerability scanning
- Penetration testing (annual)
- Bug bounty program (future)
- Incident response plan

**Input Validation:**
- Zod schema validation for all API inputs
- SQL injection prevention (parameterized queries via Drizzle)
- XSS prevention (React auto-escaping + CSP)
- CSRF token validation
- File upload validation (type, size, content)

**Error Handling:**
- Generic error messages to users (no stack traces)
- Detailed error logging server-side
- Error tracking service integration (future)
- Graceful degradation for service failures

### Monitoring & Logging

**Audit Trail:**
```typescript
audit_logs table:
- id (serial primary key)
- user_id (who)
- action_type (what)
- resource_type (on what)
- resource_id
- ip_address (from where)
- user_agent
- request_id (UUID for tracking)
- timestamp
- metadata (JSON)
```

**Logged Actions:**
- User login/logout
- Password changes
- Payment processing
- Lease signing
- Maintenance approval
- Vendor selection
- Data export
- Admin actions (user deletion, etc.)

**Performance Monitoring:**
- Request tracking with UUID
- Slow request logging (>2 seconds)
- Database query performance
- External API latency
- Memory and CPU usage

**Alerting:**
- Failed login threshold → Admin notification
- Payment processing errors → PM + admin alert
- API failures → Developer alert via email/SMS
- Security incidents → Immediate escalation
- Database performance degradation → Auto-scaling trigger

---

## Database Schema

### Core Tables

**users**
```typescript
id: serial (primary key)
email: varchar (unique, not null)
phone: varchar
full_name: varchar
role: enum (admin, property_manager, landlord, tenant, vendor)
hashed_password: varchar
mfa_secret: varchar (encrypted)
mfa_enabled: boolean
last_login: timestamp
created_at: timestamp
```

**properties**
```typescript
id: serial (primary key)
name: varchar
address: varchar
city: varchar
state: varchar
zip_code: varchar
property_type: enum (single_family, multi_family, apartment, commercial)
total_units: integer
occupied_units: integer
property_manager_id: integer (references users)
owner_id: integer (references users)
created_at: timestamp
```

**units**
```typescript
id: serial (primary key)
property_id: integer (references properties)
unit_number: varchar
bedrooms: integer
bathrooms: numeric (2,1)
square_feet: integer
monthly_rent: numeric (10,2)
deposit: numeric (10,2)
status: enum (available, occupied, maintenance, not_rentable)
amenities: text[] (array)
zillow_listing_id: varchar
available_date: date
created_at: timestamp
```

**tenants**
```typescript
id: serial (primary key)
user_id: integer (references users)
unit_id: integer (references units)
move_in_date: date
emergency_contact: varchar
emergency_phone: varchar
screening_status: enum (pending, approved, denied)
created_at: timestamp
```

**leases**
```typescript
id: serial (primary key)
unit_id: integer (references units)
tenant_id: integer (references tenants)
start_date: date
end_date: date
monthly_rent: numeric (10,2)
deposit: numeric (10,2)
status: enum (pending_signature, active, expired, terminated)
docusign_envelope_id: varchar
signed_at: timestamp
signed_ip: varchar
signed_user_agent: text
document_hash: varchar
document_url: varchar
created_at: timestamp
```

**maintenance_requests**
```typescript
id: serial (primary key)
unit_id: integer (references units)
tenant_id: integer (references tenants)
assigned_vendor_id: integer (references users)
category: enum (plumbing, electrical, hvac, appliance, structural, pest, other)
description: text
priority: enum (urgent, high, medium, low)
status: enum (open, assigned, in_progress, completed, closed)
photo_urls: text[] (array)
estimated_cost: numeric (10,2)
actual_cost: numeric (10,2)
ai_triage_result: jsonb
created_at: timestamp
completed_at: timestamp
```

**maintenance_bids**
```typescript
id: serial (primary key)
request_id: integer (references maintenance_requests)
vendor_id: integer (references users)
bid_amount: numeric (10,2)
estimated_days: integer
materials_cost: numeric (10,2)
proposal_text: text
attachment_urls: text[] (array)
status: enum (pending, accepted, rejected)
created_at: timestamp
```

**payments**
```typescript
id: serial (primary key)
tenant_id: integer (references tenants)
lease_id: integer (references leases)
amount: numeric (10,2)
fee_amount: numeric (10,2)
net_amount: numeric (10,2)
payment_method: enum (ach, debit, credit)
stripe_payment_intent_id: varchar
status: enum (pending, succeeded, failed, refunded)
created_at: timestamp
processed_at: timestamp
```

**payment_plans**
```typescript
id: serial (primary key)
tenant_id: integer (references tenants)
total_amount: numeric (10,2)
installments: integer
installment_amount: numeric (10,2)
start_date: date
status: enum (active, completed, defaulted)
created_at: timestamp
```

### Integration Tables

**integrations**
```typescript
id: varchar (primary key, UUID)
name: varchar
category: varchar
description: text
is_active: boolean
requires_setup: boolean
setup_url: varchar
created_at: timestamp
```

**integration_connections**
```typescript
id: varchar (primary key, UUID)
integration_id: varchar (references integrations)
user_id: integer (references users)
credentials: jsonb (encrypted)
status: enum (active, inactive, error)
last_sync: timestamp
created_at: timestamp
```

**import_jobs**
```typescript
id: varchar (primary key, UUID)
user_id: integer (references users)
data_type: enum (properties, units, tenants, leases, vendors, maintenance, transactions)
source_system: varchar
file_name: varchar
file_size: integer
field_mapping: jsonb
total_rows: integer
success_count: integer
failure_count: integer
error_log: jsonb
status: enum (pending, in_progress, completed, failed)
created_at: timestamp
completed_at: timestamp
```

### Accounting Tables

**chart_of_accounts**
```typescript
id: serial (primary key)
account_code: varchar (unique)
account_name: varchar
account_type: enum (asset, liability, equity, revenue, expense)
parent_account_id: integer (references chart_of_accounts)
is_active: boolean
created_at: timestamp
```

**journal_entries**
```typescript
id: serial (primary key)
entry_date: date
posting_date: date
reference_number: varchar
description: text
created_by: integer (references users)
total_debit: numeric (10,2)
total_credit: numeric (10,2)
is_posted: boolean
created_at: timestamp
```

**journal_entry_lines**
```typescript
id: serial (primary key)
entry_id: integer (references journal_entries)
account_id: integer (references chart_of_accounts)
debit_amount: numeric (10,2)
credit_amount: numeric (10,2)
description: text
created_at: timestamp
```

### Audit & Logging Tables

**audit_logs**
```typescript
id: serial (primary key)
user_id: integer (references users)
action_type: varchar
resource_type: varchar
resource_id: integer
ip_address: varchar
user_agent: text
request_id: varchar (UUID)
metadata: jsonb
created_at: timestamp
```

**esignature_logs**
```typescript
id: serial (primary key)
lease_id: integer (references leases)
user_id: integer (references users)
action: enum (sent, viewed, signed, completed, voided)
ip_address: varchar
user_agent: text
document_hash: varchar
timestamp: timestamp
```

**sessions**
```typescript
sid: varchar (primary key)
sess: jsonb
expire: timestamp
```

### Total Tables: 25+

### Database Optimization

**Indexes:**
- Primary keys (auto-indexed)
- Foreign keys for join performance
- Email lookups (users.email)
- Status filters (leases.status, units.status)
- Date ranges (payments.created_at, leases.start_date)
- Full-text search on descriptions (GIN indexes)

**Constraints:**
- Foreign key constraints for referential integrity
- Unique constraints (email, account_code)
- Check constraints (rent > 0, bedrooms > 0)
- Not null constraints on required fields

**Performance:**
- Connection pooling (Neon auto-scales)
- Query optimization with Drizzle ORM
- Prepared statements (SQL injection prevention)
- Batch inserts for bulk imports
- Transaction management for data consistency

---

## API Architecture

### RESTful API Design

**Base URL:** `https://propertyflows.replit.app/api`

**Authentication:** Required for most endpoints (except public marketplace)

**Headers:**
```
Cookie: connect.sid={session_id}
Content-Type: application/json
```

### Endpoint Categories

#### Authentication Endpoints
```
POST   /api/auth/login              # User login
POST   /api/auth/logout             # User logout
GET    /api/auth/user               # Get current user
POST   /api/auth/register           # Register new user (invitation-based)
POST   /api/auth/forgot-password    # Request password reset
POST   /api/auth/reset-password     # Reset password with token
POST   /api/auth/mfa/setup          # Enable MFA
POST   /api/auth/mfa/verify         # Verify MFA code
```

#### Property Management Endpoints
```
GET    /api/properties              # List properties (filtered by role)
POST   /api/properties              # Create property
GET    /api/properties/:id          # Get property details
PATCH  /api/properties/:id          # Update property
DELETE /api/properties/:id          # Delete property
```

#### Unit Management Endpoints
```
GET    /api/units                   # List units
POST   /api/units                   # Create unit
GET    /api/units/:id               # Get unit details
PATCH  /api/units/:id               # Update unit
DELETE /api/units/:id               # Delete unit
GET    /api/marketplace/units       # Public: Browse available units
```

#### Tenant Management Endpoints
```
GET    /api/tenants                 # List tenants
POST   /api/tenants                 # Create tenant (send invitation)
GET    /api/tenants/:id             # Get tenant details
PATCH  /api/tenants/:id             # Update tenant
DELETE /api/tenants/:id             # Deactivate tenant
```

#### Lease Management Endpoints
```
GET    /api/leases                  # List leases
POST   /api/leases                  # Create lease
GET    /api/leases/:id              # Get lease details
PATCH  /api/leases/:id              # Update lease
POST   /api/leases/:id/send-signature  # Send for e-signature
GET    /api/leases/:id/signature-status # Check signature status
```

#### Maintenance Endpoints
```
GET    /api/maintenance             # List maintenance requests
POST   /api/maintenance             # Create request
GET    /api/maintenance/:id         # Get request details
PATCH  /api/maintenance/:id         # Update request
POST   /api/maintenance/:id/assign  # Assign to vendor
POST   /api/maintenance/:id/bid     # Submit bid (vendor)
POST   /api/maintenance/:id/approve # Approve bid (PM)
POST   /api/maintenance/:id/complete # Mark complete
```

#### Payment Endpoints
```
GET    /api/payments                # List payments
POST   /api/payments                # Process payment
GET    /api/payments/:id            # Get payment details
POST   /api/payments/setup-intent   # Create Stripe SetupIntent
POST   /api/payments/payment-plan   # Create payment plan
```

#### Integration Endpoints
```
GET    /api/integrations            # List available integrations
GET    /api/integration-connections # List user's connections
POST   /api/integrations/plaid/link-token        # Create Plaid Link token
POST   /api/integrations/plaid/verify            # Verify bank account
POST   /api/integrations/docusign/send-envelope  # Send DocuSign envelope
GET    /api/integrations/docusign/envelope/:id   # Get envelope status
POST   /api/integrations/zillow/sync-unit        # Sync unit to Zillow
GET    /api/integrations/zillow/listing/:id      # Get Zillow analytics
POST   /api/integrations/quickbooks/sync         # Sync to QuickBooks
```

#### Bulk Import Endpoints
```
POST   /api/import/upload           # Upload CSV/Excel file
POST   /api/import/validate         # Validate data (dry run)
POST   /api/import/execute          # Execute import
GET    /api/import/history          # List import jobs
GET    /api/import/:id              # Get import job details
GET    /api/import/:id/errors       # Get import error log
```

#### Vendor Endpoints
```
GET    /api/vendors                 # List vendors
POST   /api/vendors                 # Create vendor (send invitation)
GET    /api/vendors/:id             # Get vendor details
PATCH  /api/vendors/:id             # Update vendor
GET    /api/vendors/:id/jobs        # List vendor's jobs
GET    /api/vendors/:id/performance # Get performance metrics
```

#### Reporting Endpoints
```
GET    /api/reports/revenue         # Revenue report
GET    /api/reports/expenses        # Expense report
GET    /api/reports/occupancy       # Occupancy report
GET    /api/reports/maintenance     # Maintenance analytics
GET    /api/reports/tenant-ledger   # Tenant ledger
GET    /api/reports/owner-statement # Owner statement
```

#### AI Endpoints
```
POST   /api/ai/triage               # Maintenance triage
POST   /api/ai/compliance           # Fair Housing check
POST   /api/ai/renewal-prediction   # Lease renewal prediction
POST   /api/ai/photo-analysis       # Compare move-in/out photos
POST   /api/ai/chat                 # Chatbot conversation
```

#### Admin Endpoints
```
GET    /api/admin/users             # List all users
POST   /api/admin/users             # Create user
DELETE /api/admin/users/:id         # Delete user
GET    /api/admin/audit-logs        # View audit logs
GET    /api/admin/platform-stats    # Platform analytics
POST   /api/admin/feature-flags     # Update feature flags
```

### Request/Response Format

**Successful Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Sunset Apartments",
    ...
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "pages": 8
  }
}
```

### Error Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## Deployment & Infrastructure

### Hosting Platform: Replit

**Environment:**
- **OS**: NixOS (reproducible builds)
- **Runtime**: Node.js 20.x
- **Process Manager**: Replit manages processes automatically

**Deployment Process:**
1. Code pushed to Replit workspace
2. Automatic dependency installation (npm install)
3. TypeScript compilation (if needed)
4. Database migrations (npm run db:push)
5. Application restart
6. Health check verification

**Configuration:**
- **`.replit`**: Workflow configuration (npm run dev)
- **`replit.nix`**: System dependencies and packages
- **Environment Variables**: Secrets managed via Replit Secrets UI

**Scaling:**
- Automatic horizontal scaling (Replit handles load balancing)
- Database connection pooling (Neon auto-scales)
- CDN for static assets
- WebSocket connection management

### Database: Neon (Serverless Postgres)

**Features:**
- Serverless architecture (auto-scaling)
- Branching for development/staging
- Point-in-time recovery (7-day retention)
- Connection pooling
- Multi-region read replicas (future)

**Connection:**
- **DATABASE_URL**: PostgreSQL connection string (from environment)
- Connection limit: 100 concurrent connections
- Idle connection timeout: 5 minutes

**Backups:**
- Automatic daily backups
- Manual backup on-demand
- Backup retention: 30 days
- Disaster recovery plan

### File Storage: Replit Object Storage (GCS-backed)

**Configuration:**
- **Bucket**: `repl-default-bucket-{REPL_ID}`
- **Directories**:
  - `public/` - Public assets (photos, logos)
  - `.private/` - Private documents (leases, financial docs)

**Access Control:**
- ACL-based permissions (USER_LIST, EMAIL_DOMAIN, etc.)
- Signed URLs for temporary access
- Automatic expiration for sensitive files

**Performance:**
- CDN integration for public assets
- Multi-region redundancy
- 99.95% uptime SLA

### Monitoring & Observability

**Application Monitoring:**
- Custom request logging with UUID tracking
- Slow request detection (>2 seconds)
- Error logging with stack traces
- Performance metrics (response time, throughput)

**Database Monitoring:**
- Query performance tracking
- Connection pool utilization
- Slow query log
- Dead lock detection

**External Service Monitoring:**
- API health checks (Stripe, Plaid, etc.)
- Latency monitoring
- Error rate tracking
- Quota usage alerts

**Alerting Channels:**
- Email for critical errors
- SMS for security incidents (via Twilio)
- In-app notifications for warnings
- Dashboard for real-time metrics

### CI/CD Pipeline

**Current Setup:**
- Manual deployment via Replit workspace
- Automatic restart on file changes
- Database schema sync on demand

**Future Enhancements:**
- GitHub integration for version control
- Automated testing in CI pipeline
- Staging environment for pre-production testing
- Blue/green deployments for zero downtime
- Automated rollback on failure

### Environment Variables

**Required:**
```bash
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
OPENAI_API_KEY=sk-...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
RESEND_API_KEY=re_...
PLAID_CLIENT_ID=...
PLAID_SECRET=...
DOCUSIGN_INTEGRATION_KEY=...
ZILLOW_API_KEY=...
QUICKBOOKS_CLIENT_ID=...
ISSUER_URL=https://auth.replit.app
```

**Optional:**
```bash
NODE_ENV=production
PORT=5000
SESSION_SECRET=...
QUICKBOOKS_REDIRECT_URI=...
ZILLOW_PARTNER_ID=...
```

### Performance Optimization

**Frontend:**
- Code splitting with React.lazy()
- Image optimization (compression, lazy loading)
- CDN for static assets
- Service worker for offline support (future)

**Backend:**
- Connection pooling
- Database query optimization
- Response caching (Redis - future)
- Request batching for external APIs

**Database:**
- Indexed columns for frequent queries
- Materialized views for complex reports
- Partition tables for large datasets (future)
- Archive old data to cold storage

---

## Conclusion

PropertyFlows is a comprehensive, production-ready property management SaaS platform built on modern, scalable technologies. With 7 fully integrated external services, AI-powered automation, enterprise-grade security, and a tenant-first user experience, it provides a complete solution for property managers, landlords, tenants, and vendors.

The platform is designed for scalability, security, and ease of use, making it a competitive alternative to established players like AppFolio, Buildium, and Yardi. With transparent pricing, instant payouts, and white-glove migration assistance, PropertyFlows is positioned to capture market share in the $88B property management industry.

---

**Document Version:** 1.0  
**Last Updated:** October 28, 2025  
**Author:** PropertyFlows Engineering Team  
**Contact:** tech@propertyflows.com
