# Vulnix — Intentionally Vulnerable SaaS Platform

> ⚠️ **WARNING**: This application contains **intentional security vulnerabilities** for penetration testing and security education purposes. **Do NOT deploy to production or expose to the public internet.**

Vulnix is a realistic project management SaaS platform built with Next.js (App Router) that contains carefully crafted security vulnerabilities for practicing penetration testing.

## Quick Start

```bash
# Install dependencies
npm install

# Run in development (insecure mode by default)
npm run dev

# Run in secure mode (all vulnerabilities patched)
VULNIX_SECURE_MODE=true npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and use the demo accounts:

| Email | Password | Role | Plan |
|---|---|---|---|
| admin@vulnix.io | admin123 | Admin | Enterprise |
| alice@example.com | password123 | User | Pro |
| bob@example.com | bob2024 | User | Free |
| charlie@example.com | charlie! | User | Pro |

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Login, register, logout, me
│   │   ├── projects/      # CRUD + comments
│   │   ├── users/         # User profiles
│   │   ├── admin/         # Admin users & logs
│   │   ├── billing/       # Subscription & promo codes
│   │   ├── search/        # Search with reflected XSS
│   │   ├── fetch/         # SSRF simulation
│   │   └── debug/         # Debug data leak
│   ├── dashboard/         # Main app pages
│   ├── admin/             # Admin panel
│   ├── search/            # Search page
│   ├── login/             # Auth pages
│   └── register/
├── lib/
│   ├── config.ts          # Vulnerability toggles
│   ├── store.ts           # In-memory database
│   ├── auth.ts            # Auth helpers (intentionally flawed)
│   └── logger.ts          # Request logging
├── components/
│   └── Sidebar.tsx
└── middleware.ts
```

## Intentional Vulnerabilities

### 1. Broken Access Control

#### IDOR (Insecure Direct Object Reference)
- **Where**: `/api/projects/[id]`, `/api/users/[id]`
- **Exploit**: Access any project by changing the ID: `GET /api/projects/2` while logged in as any user
- **Fix**: Verify resource ownership before returning data

#### Missing Authorization Checks
- **Where**: `/api/projects` (GET), `/api/users`
- **Exploit**: Call API endpoints without authentication
- **Fix**: Add auth middleware to all protected routes

#### Weak Admin Protection
- **Where**: `/api/admin/*`, `/admin` page
- **Exploit**: Access admin panel via `?admin=true` query parameter
- **Fix**: Server-side role verification only

### 2. Authentication Issues

#### Weak Passwords
- **Where**: `/api/auth/register`
- **Exploit**: Register with password "1"
- **Fix**: Enforce minimum length, complexity rules

#### Predictable Session Tokens
- **Where**: `src/lib/auth.ts` → `generateToken()`
- **Exploit**: Tokens follow pattern `user-{id}-{timestamp}` — guess other users' tokens
- **Fix**: Use cryptographically secure random tokens (UUID v4)

#### No Rate Limiting
- **Where**: `/api/auth/login`
- **Exploit**: Brute-force passwords with unlimited attempts
- **Fix**: Rate limit by IP, lockout after N failures

### 3. Cross-Site Scripting (XSS)

#### Reflected XSS
- **Where**: `/search?q=<payload>`, `/api/search`
- **Exploit**: `/search?q=<img src=x onerror=alert('xss')>`
- **Fix**: Sanitize query before reflecting in response

#### Stored XSS
- **Where**: Project comments, user bio
- **Exploit**: Post comment with `<img src=x onerror=alert('xss')>` — renders for all users
- **Fix**: Sanitize HTML on input and escape on render

### 4. Business Logic Flaws

#### Subscription Bypass
- **Where**: `/api/billing/subscribe`, `/api/projects` (POST)
- **Exploit**: `POST /api/billing/subscribe {"plan":"enterprise"}` — no payment required
- **Fix**: Require valid payment token for upgrades

#### Duplicate Actions
- **Where**: `/api/billing/subscribe` (promo codes)
- **Exploit**: Apply promo code `WELCOME50` unlimited times for infinite credits
- **Fix**: Track used promo codes per user, enforce one-time use

### 5. Sensitive Data Exposure

#### Debug Endpoint
- **Where**: `/api/debug`
- **Exploit**: `GET /api/debug` returns all users (with passwords), sessions, promo codes
- **Fix**: Remove debug endpoints or require strong authentication

#### Excessive API Data
- **Where**: `/api/auth/login`, `/api/users/[id]`, `/api/billing/status`
- **Exploit**: API responses include passwords, tokens, internal billing data
- **Fix**: Strip sensitive fields from all API responses

### 6. API Security Issues

#### Mass Assignment
- **Where**: `/api/auth/register`, `/api/users/[id]` (PUT)
- **Exploit**: `PUT /api/users/1 {"role":"admin","plan":"enterprise","credits":99999}`
- **Fix**: Whitelist allowed fields for updates

#### No Input Validation
- **Where**: All POST/PUT endpoints
- **Exploit**: Send oversized data, wrong types, missing fields
- **Fix**: Schema validation on all inputs

### 7. SSRF Simulation (Safe)

- **Where**: `/api/fetch`
- **Exploit**: `POST /api/fetch {"url":"http://169.254.169.254/latest/meta-data"}`
- **Note**: Returns mocked data — does NOT make real requests
- **Fix**: Whitelist allowed domains, block internal IP ranges

## Vulnerability Toggle System

All vulnerabilities are controlled via `src/lib/config.ts`:

```typescript
// Enable secure mode globally (patches all vulnerabilities)
VULNIX_SECURE_MODE=true

// Or toggle individual vulnerabilities in src/lib/config.ts:
vulnerabilities: {
  idor: true,              // Insecure Direct Object Reference
  missingAuthChecks: true, // Missing authorization on routes
  weakAdminProtection: true, // Admin via query param
  weakPasswords: true,     // Accept any password
  predictableTokens: true, // Guessable session tokens
  noRateLimit: true,       // No rate limiting
  reflectedXss: true,      // Reflected XSS in search
  storedXss: true,         // Stored XSS in comments/bio
  subscriptionBypass: true, // Skip payment for upgrades
  duplicateActions: true,  // Reuse promo codes
  sensitiveDataExposure: true, // Debug endpoint, passwords in responses
  massAssignment: true,    // Set own role/plan
  noInputValidation: true, // No server-side validation
  ssrfSimulation: true,    // SSRF URL fetcher
}
```

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy in secure mode
vercel --env VULNIX_SECURE_MODE=true
```

Or connect your GitHub repo to Vercel for automatic deploys. Set `VULNIX_SECURE_MODE` in the Vercel environment variables to control vulnerability state.

## Pentesting Walkthrough

1. **Reconnaissance**: Visit `/api/debug` to dump all internal data
2. **Access Control**: Try accessing `/api/projects/1`, `/api/projects/2`, etc. while logged in as any user
3. **Privilege Escalation**: `PUT /api/users/{yourId}` with `{"role":"admin"}`
4. **XSS**: Inject payloads in search (`/search?q=<script>...`) and project comments
5. **Business Logic**: Apply promo codes multiple times, upgrade plan without payment
6. **SSRF**: Use `/api/fetch` to probe simulated internal endpoints
7. **Session Hijacking**: Observe predictable token pattern and guess other users' tokens
8. **Admin Bypass**: Visit `/admin?admin=true` as any user

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS
- **Storage**: In-memory (resets on restart)
- **Auth**: Cookie-based sessions
- **Deployment**: Vercel-compatible

## License

Educational use only. Not intended for production deployment.
