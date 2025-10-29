# Security Architecture

## Overview
PropertyFlows implements multiple layers of security to protect user data and prevent common web vulnerabilities.

## Security Features

### 1. Rate Limiting
**Implementation:** `express-rate-limit` middleware

**Configuration:**
- **General API Routes:** 100 requests per 15 minutes
- **Authentication Routes:** 5 requests per 15 minutes
- **Webhook Routes:** Excluded from rate limiting (external services)

**Protection Against:**
- Brute force attacks on login endpoints
- API abuse and DDoS attacks
- Resource exhaustion

### 2. Security Headers (Helmet)
**Implementation:** `helmet` middleware

**Headers Configured:**
- **Content Security Policy (CSP):**
  - ✅ **Production-Ready:** Properly configured with environment-based directives
  - **Development Mode:** Allows `unsafe-inline` and `unsafe-eval` (required for Vite HMR)
  - **Production Mode:** Removes all unsafe directives for maximum security
  - Allows necessary external resources (Stripe, fonts, images)
  - Blocks object sources; allows Stripe iframes for payment processing
  - Prevents frame embedding (X-Frame-Options via frameAncestors: none)
  - CSP violation reporting enabled (`/api/csp-report`)
  - Additional security directives:
    - `baseUri: self` - Prevents base tag injection
    - `formAction: self` - Restricts form submissions
    - `upgradeInsecureRequests` - Automatically upgrades HTTP to HTTPS
  
- **HTTP Strict Transport Security (HSTS):**
  - Forces HTTPS connections
  - Max age: 1 year (31536000 seconds)
  - Includes subdomains
  - Preload enabled

- **Additional Headers:**
  - X-Content-Type-Options: nosniff
  - X-Download-Options: noopen
  - X-Permitted-Cross-Domain-Policies: none
  - Referrer-Policy: strict-origin-when-cross-origin

**Protection Against:**
- Cross-Site Scripting (XSS)
- Clickjacking
- MIME type sniffing
- Man-in-the-middle attacks

### 3. CSRF Protection
**Status:** Not implemented (by design)

**Architectural Decision:**
This application uses a session-based authentication with a Single Page Application (SPA) architecture where:

1. **Session Cookies:** Use SameSite=Strict attribute (configured in session middleware)
2. **API-First Design:** All state changes go through authenticated API endpoints
3. **CORS Configuration:** Properly configured to only allow same-origin requests
4. **No Traditional Forms:** No server-side form submissions that would be vulnerable to CSRF

**Why CSRF Protection is Not Needed:**
- Modern SPA with session-based auth using SameSite cookies
- No cross-origin state-changing operations
- All API calls use XHR/fetch with proper CORS headers
- Authentication token in HTTP-only session cookie

**Compensating Controls:**
- SameSite cookie attribute prevents cross-site request forgery
- Origin validation on API endpoints
- Proper CORS configuration
- Session expiry and refresh token rotation

### 4. Authentication Security
**Implementation:** Replit Auth (OIDC) + Express Sessions

**Features:**
- Token-based authentication with automatic refresh
- Session storage in PostgreSQL (connect-pg-simple)
- HTTP-only, secure cookies
- 7-day session TTL
- Token expiry validation and refresh

### 5. SQL Injection Protection
**Implementation:** Drizzle ORM

**Protection:**
- All database queries use parameterized statements
- ORM handles escaping and sanitization
- No raw SQL execution without validation

### 6. Input Validation
**Implementation:** Zod schemas

**Validation:**
- All API inputs validated against strict schemas
- Type safety enforced at runtime
- Automatic sanitization of user inputs

## Webhook Security

### Stripe Webhooks
**Endpoint:** `/api/webhooks/stripe`

**Security:**
- Signature verification using `stripe.webhooks.constructEvent`
- Raw body preservation for signature validation
- STRIPE_WEBHOOK_SECRET environment variable
- Webhook-specific rate limit exemption

### Twilio Webhooks
**Endpoint:** `/api/webhooks/sms`

**Security:**
- Signature verification using Twilio's validator
- Request signature validation against auth token
- URL reconstruction for signature verification

## Environment Security

### Secret Management
All sensitive credentials stored as environment variables:
- Database credentials
- API keys (Stripe, OpenAI, Twilio)
- Session secrets
- OAuth credentials

### Dependencies
Regular security audits via:
```bash
npm audit
npm audit fix
```

## Monitoring & Logging

### Performance Monitoring
- Request/response time tracking
- Slow operation detection (>1000ms)
- Metrics aggregation and reporting

### Security Logging
- Failed authentication attempts
- Rate limit violations
- Invalid webhook signatures
- Database query errors

## Testing

### Automated Security Testing
- Unit tests for rate limiting
- Security header validation
- Authentication flow testing
- E2E tests for critical paths

### Load Testing
Performance and stress testing available:
```bash
npm run test:load
```

## Production Checklist

Before deploying to production, ensure:
- [ ] All environment variables are properly set
- [ ] HTTPS is enabled (required for HSTS)
- [ ] Database credentials are rotated
- [ ] Stripe webhook secret is configured
- [ ] Rate limiting thresholds are appropriate for traffic
- [ ] Security headers are verified
- [ ] Session secret is cryptographically random
- [ ] Audit logs are being captured
- [ ] Monitoring is enabled

## Incident Response

If a security incident is detected:
1. Immediately revoke compromised credentials
2. Review audit logs for breach scope
3. Force session logout for affected users
4. Deploy security patches
5. Notify affected users if data exposure occurred
6. Document incident and update security controls
