# PropertyFlows - Property Management SaaS Platform

**The all-in-one platform built for transparency, efficiency, and tenant satisfaction. Finally, a real alternative to AppFolio.**

## 🌟 Overview

PropertyFlows is a comprehensive SaaS platform for property management that distinguishes itself with a tenant-first user experience and AI-powered operations. The platform offers transparent pricing, multi-property support, online rent payments (ACH/card), maintenance tracking, lease management, dedicated tenant and owner portals, and robust audit/e-signature logging.

## 🚀 Key Features

### Subscription Management System
- **Multi-Tier SaaS Plans**: Starter ($49/mo), Professional ($149/mo), Enterprise (custom pricing)
- **Automated Business Verification**: Mesh Verify API integration with risk-based approval workflow
- **Fraud Prevention**: Email validation, IP/VPN detection, disposable email blocking
- **14-Day Free Trial**: Automated trial-to-paid conversion via Stripe webhooks
- **Smart Dunning**: Configurable grace periods with automated payment retries
- **Self-Service Portal**: Plan upgrades/downgrades, payment method updates, invoice access

### Role-Based Access Control (RBAC)
- **Five User Roles**: Admin, Property Manager, Landlord, Tenant, Vendor
- **Strict Access Control**: Only property managers can self-register; all others must be invited
- **OIDC-Level Enforcement**: RBAC logic in authentication callback prevents unauthorized access
- **Invitation System**: Token-based email invitations with role assignment

### Payment Processing
- **Stripe Integration**: ACH, debit, and credit card payments
- **Automated Billing**: Subscription management with webhooks
- **Dunning Workflow**: Grace periods, automated retries, suspension management

### AI-Powered Operations
- **Maintenance Triage**: Intelligent request categorization and routing
- **Fair Housing Compliance**: Automated compliance checking
- **Lease Renewal Predictions**: AI-driven renewal likelihood analysis
- **Move-In/Out Analysis**: Photo-based condition assessment
- **Document Copilot**: AI-assisted document generation

### Core Property Management
- **Multi-Property Support**: Manage unlimited properties and units
- **Lease Management**: Digital lease creation, e-signatures, renewal tracking
- **Maintenance Tracking**: Field operations turnboard with vendor management
- **Tenant Portal**: Self-service rent payments, maintenance requests, documents
- **Owner Portal**: Financial reports, property performance, document access
- **Vendor Portal**: Job assignment, bidding, work documentation

### Enterprise Features
- **Double-Entry Accounting**: Full chart of accounts, journal entries, financial statements
- **QuickBooks Integration**: OAuth2-based sync via JournalEntry API
- **Bulk Import System**: CSV/Excel upload with auto-field mapping and validation
- **Audit Trail**: Comprehensive logging and e-signature tracking
- **GDPR Compliance**: Data export, account deletion, consent tracking
- **Multi-Currency Support**: User-selectable currency, timezone, language

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL (Neon-backed)
- **ORM**: Drizzle ORM
- **Authentication**: Replit Auth (OIDC)
- **Payments**: Stripe (Connect for payouts)
- **Email**: Resend
- **SMS**: Twilio
- **File Storage**: Replit Object Storage (GCS-backed)
- **AI**: OpenAI GPT-4o-mini

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- Replit account (for Auth and Object Storage)
- Stripe account
- Resend API key
- Twilio account (for SMS)
- OpenAI API key (for AI features)

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication (Replit OIDC)
SESSION_SECRET=your-session-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Resend (Email)
RESEND_API_KEY=re_...

# Twilio (SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# OpenAI
OPENAI_API_KEY=sk-...

# Object Storage (Replit)
PUBLIC_OBJECT_SEARCH_PATHS=...
PRIVATE_OBJECT_DIR=...

# Optional Integrations
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=sandbox
DOCUSIGN_INTEGRATION_KEY=...
DOCUSIGN_USER_ID=...
DOCUSIGN_ACCOUNT_ID=...
ZILLOW_API_KEY=...
```

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/propertyflows.git
   cd propertyflows
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npm run db:push
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open your browser to `http://localhost:5000`

## 📦 Database Migrations

This project uses Drizzle ORM with push-based migrations:

```bash
# Push schema changes to database
npm run db:push

# Force push (use if you get data-loss warnings in development)
npm run db:push --force

# Open Drizzle Studio for database inspection
npm run db:studio
```

**Important**: Never manually write SQL migrations. Always use `npm run db:push` to sync schema changes.

## 🏗️ Project Structure

```
propertyflows/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # Utilities and helpers
│   │   └── App.tsx      # Root component with routing
├── server/              # Express backend
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database interface
│   ├── replitAuth.ts    # OIDC authentication
│   ├── services/        # Business logic services
│   └── index.ts         # Server entry point
├── shared/              # Shared code between client/server
│   └── schema.ts        # Database schema and types
├── drizzle.config.ts    # Drizzle ORM configuration
└── package.json         # Dependencies and scripts
```

## 🔐 Security Features

- **RBAC Enforcement**: Authentication-level access control
- **OIDC Authentication**: Secure OAuth2/OpenID Connect
- **CSRF Protection**: Express session with secure cookies
- **Rate Limiting**: API endpoint protection
- **Content Security Policy**: XSS prevention
- **HSTS**: Force HTTPS in production
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run Playwright e2e tests
npm run test:e2e
```

## 📚 API Documentation

### Authentication Endpoints
- `GET /auth/login` - Initiate OIDC login flow
- `GET /auth/callback` - OIDC callback handler
- `GET /auth/logout` - Logout user
- `GET /api/auth/user` - Get current user info

### Subscription Endpoints
- `POST /api/organizations` - Create organization (self-registration)
- `GET /api/organizations` - List organizations (admin)
- `PATCH /api/organizations/:id/verify` - Approve/reject organization (admin)
- `POST /api/organizations/:id/activate-trial` - Activate trial subscription
- `GET /api/subscriptions/portal` - Get subscription portal info
- `POST /api/subscriptions/upgrade` - Upgrade subscription plan
- `POST /api/subscriptions/cancel` - Cancel subscription
- `POST /api/webhooks/stripe` - Stripe webhook handler

### Property Management Endpoints
- `GET /api/properties` - List properties
- `POST /api/properties` - Create property
- `GET /api/units` - List units
- `POST /api/leases` - Create lease
- `POST /api/maintenance` - Create maintenance request
- And many more...

## 🎨 Subscription Plans

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| **Price** | $49/mo | $149/mo | Custom |
| **Properties** | Up to 10 | Up to 50 | Unlimited |
| **Units** | Up to 50 | Up to 250 | Unlimited |
| **Users** | 3 | 10 | Unlimited |
| **AI Features** | Basic | Advanced | Premium |
| **Support** | Email | Priority | Dedicated |
| **Trial Period** | 14 days | 14 days | Custom |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Replit](https://replit.com) for hosting and infrastructure
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Payment processing by [Stripe](https://stripe.com)
- Email delivery by [Resend](https://resend.com)
- AI powered by [OpenAI](https://openai.com)

## 📞 Support

For support, email support@propertyflows.com or visit our [documentation](https://docs.propertyflows.com).

## 🗺️ Roadmap

- [ ] Mobile apps (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Tenant screening integration
- [ ] Insurance marketplace
- [ ] Multi-language support (beyond English)
- [ ] White-label capabilities

---

**Built with ❤️ for property managers who care about their tenants**
