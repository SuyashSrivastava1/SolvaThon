# Security Policy and Architecture Documentation

**Project:** Hostel Solvathon 2026 — VIT Chennai  
**Last Updated:** October 2026  
**Status:** Remediated & Production Hardened  

---

## 1. Security Policy & Vulnerability Reporting

The Hostel Solvathon development team takes the security of participant data, evaluation integrity, and platform infrastructure seriously. We welcome responsible security research and vulnerability reports from the community.

### 1.1 Supported Versions

Only the current active release deployed on the `main` branch is supported for security updates:

| Branch / Release | Supported | Target Environment |
| :--- | :--- | :--- |
| `main` (Latest) | :white_check_mark: Yes | Production / Cloudflare Pages |
| Historical Tags / Forks | :x: No | Deprecated / Development |

### 1.2 Reporting a Vulnerability (Coordinated Disclosure)

If you discover a security vulnerability or weakness within the platform:

1. **Do NOT open a public GitHub issue or pull request.**
2. Email the lead security coordinator at: **`security@solvathon.internal`** or contact the VIT Chennai Student Technical Leads directly.
3. Include the following details in your report:
   - **Description:** A detailed explanation of the vulnerability and its potential impact.
   - **Reproducibility:** Step-by-step instructions or a Minimal Working Example (PoC).
   - **Affected Components:** File paths, endpoints, or server action names.
   - **Proposed Mitigation:** If you have suggestions on how to remediate the flaw.

### 1.3 Response Service Level Agreement (SLA)

- **Initial Acknowledgment:** Within **24–48 hours** of receiving the report.
- **Triage & Assessment:** Within **3 business days**.
- **Remediation & Patch Deployment:** Within **7–14 days** depending on severity.
- **Public Disclosure:** Coordinated after the fix has been deployed and verified.

### 1.4 Safe Harbor Policy

Security researchers acting in good faith will **not** face legal action or university disciplinary proceedings, provided that they:
- Avoid accessing, modifying, or exfiltrating data belonging to other participants.
- Avoid disrupting services via Denial of Service (DoS/DDoS) attacks or automated high-rate volumetric fuzzing.
- Give the development team adequate time to remediate the vulnerability before public disclosure.
- Act within the boundaries of applicable cybersecurity laws and university codes of conduct.

---

## 2. Threat Model & Architecture Overview

The platform coordinates real-time hackathon activities, team formation, evaluations, and prize distributions. The security design adheres to the **OWASP Top 10 (2021)** and **OWASP Application Security Verification Standard (ASVS Level 2)** baselines.

```
+-----------------------------------------------------------------------------------+
|                              UNTRUSTED ZONE                                       |
|  Participant / Evaluator Web Browser                                              |
|  (Google OAuth via Firebase Client SDK, Session Cookie Storage)                   |
+-----------------------------------------------------------------------------------+
                                         |
                                         | HTTPS (TLS 1.3) + CSP / HSTS
                                         v
+-----------------------------------------------------------------------------------+
|                              PERIMETER ZONE                                       |
|  Cloudflare Edge / Next.js Edge Middleware (`src/middleware.ts`)                  |
|  - Edge-level Route Guarding (`/admin/*`, `/profile/*`)                           |
|  - HTTP Security Header Injection (CSP, X-Frame-Options, HSTS, Permissions-Policy)|
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                         APPLICATION LOGIC ZONE                                    |
|  Next.js 16 Server Actions (`src/actions/*`)                                      |
|  - Cryptographic Identity Verification via Firebase Admin SDK (`verifyIdToken`)   |
|  - Sliding-Window Rate Limiting (`src/lib/rateLimit.ts`)                          |
|  - URL Allowlist & SSRF Filters (`src/lib/urlValidator.ts`)                       |
|  - Role-Based Access Control (`src/config/admin.ts`)                              |
|  - CSPRNG Leader / Team Code Generators (`crypto.randomBytes`, `randomInt`)       |
+-----------------------------------------------------------------------------------+
                                         |
                                         | Parameterized Queries (Prisma ORM)
                                         v
+-----------------------------------------------------------------------------------+
|                           PERSISTENT DATA ZONE                                    |
|  Supabase-hosted PostgreSQL Database                                              |
|  - Strict Foreign Key & Unique Constraints                                        |
|  - Zero Direct Browser Access (All queries proxied via Server Actions)            |
+-----------------------------------------------------------------------------------+
```

---

## 3. Implemented Security Controls & Remediations

Following our comprehensive security audit (see [`security_audit_report.md`](./security_audit_report.md)), the following controls have been implemented across all architectural tiers:

### 3.1 Server-Side Identity Verification & IDOR Elimination (OWASP A01 / ASVS V2 & V4)
- **Challenge:** Client-side parameters like `firebaseUid` can be spoofed by an attacker in API payloads to impersonate other students.
- **Remediation:** 
  - Centralized server-side token validation in [`src/lib/firebase/admin.ts`](./src/lib/firebase/admin.ts) using `firebase-admin/auth` (`verifyIdToken`).
  - All sensitive server actions ([`src/actions/team.ts`](./src/actions/team.ts), [`src/actions/register.ts`](./src/actions/register.ts), [`src/actions/admin.ts`](./src/actions/admin.ts)) extract and cryptographically verify the caller's session from the `auth_token` cookie or Bearer authorization header.
  - Zero reliance on untrusted client inputs for authorization checks.

### 3.2 Role-Based Access Control (RBAC) & Secret Protection (OWASP A01 & A05 / ASVS V1)
- **Challenge:** Admin email addresses and access secrets leaked into client-side JavaScript bundles when prefixed with `NEXT_PUBLIC_`.
- **Remediation:**
  - Removed all `NEXT_PUBLIC_ADMIN_EMAILS` and `NEXT_PUBLIC_SUPER_ADMIN_EMAILS` environment variables.
  - Admin email lists and role checks are isolated strictly to server-side execution ([`src/config/admin.ts`](./src/config/admin.ts)).
  - Client components query an authenticated server action (`checkIsAdmin()`) that verifies identity server-side and returns a boolean without revealing administrative rosters.
  - Removed hardcoded backdoor fallback credentials (`ADMIN_ACCESS_KEY` fallback in [`src/actions/admin.ts`](./src/actions/admin.ts)).

### 3.3 Perimeter Route Protection via Next.js Middleware (OWASP A01 / ASVS V1)
- **Challenge:** Client-side redirect guards rendered admin UI fragments briefly before redirecting unauthenticated users.
- **Remediation:**
  - Implemented [`src/middleware.ts`](./src/middleware.ts) running at the edge.
  - All incoming HTTP requests to `/admin/:path*` and `/profile/:path*` are validated for the presence of valid `auth_token` cookies before request processing begins.
  - Unauthenticated requests are immediately redirected to `/login?redirect=...`.

### 3.4 Cryptographically Secure Random Number Generation (OWASP A02 / ASVS V6)
- **Challenge:** Use of `Math.random()` generated predictable 6-character team codes and biased random team leadership selections.
- **Remediation:**
  - Replaced all insecure random generation in [`src/actions/team.ts`](./src/actions/team.ts) with Node.js `crypto` CSPRNG:
    - `crypto.randomBytes(6)` for team join codes with unambiguous character alphabet (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`).
    - `crypto.randomInt(0, otherMembers.length)` for unbiased, unpredictable leader reassignments.

### 3.5 Sliding-Window Rate Limiting (OWASP A04 / ASVS V13)
- **Challenge:** Susceptibility to automated registration flooding, team code brute-forcing, and resource exhaustion.
- **Remediation:**
  - Developed an in-memory sliding-window rate limiter in [`src/lib/rateLimit.ts`](./src/lib/rateLimit.ts) with automated expired-entry sweepers.
  - Strict limits enforced across key actions:
    - **Participant Registration:** Max 3 requests / minute per UID / IP.
    - **Team Creation:** Max 5 requests / minute per UID.
    - **Team Join Attempts:** Max 8 requests / minute per UID (prevents brute-force guessing of team codes).
    - **Project & Idea Submissions:** Max 10 requests / minute per UID.

### 3.6 SSRF Defense & URL Allowlisting (OWASP A10 / ASVS V12)
- **Challenge:** Submissions accepting arbitrary URLs risk Server-Side Request Forgery (SSRF) and malicious redirects.
- **Remediation:**
  - Implemented strict URL validation in [`src/lib/urlValidator.ts`](./src/lib/urlValidator.ts).
  - Explicitly blocks:
    - Non-HTTPS protocols (`http://`, `file://`, `ftp://`, `javascript:`).
    - Private IPv4 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `0.0.0.0/8`).
    - IPv6 loopback (`::1`).
    - Cloud instance metadata services (`169.254.169.254`).
    - Local network TLDs (`.internal`, `.local`, `localhost`).
  - Presentation and deliverable URLs are restricted to reputable platforms (Google Drive, GitHub, GitLab, Canva, Notion, YouTube, Vimeo, Loom, Vercel, Netlify, Render).

### 3.7 Dependency Hardening & Vulnerability Remediation (OWASP A06 / ASVS V14)
- **Challenge:** The `xlsx` package contained critical unpatched CVEs (Prototype Pollution & ReDoS) with no upstream fix available.
- **Remediation:**
  - Completely uninstalled `xlsx`.
  - Migrated Excel reporting functionality to [`exceljs`](https://github.com/exceljs/exceljs) in [`src/app/admin/page.tsx`](./src/app/admin/page.tsx), providing clean type safety and zero high/critical vulnerabilities in `npm audit`.

### 3.8 HTTP Security Headers & Content Security Policy (OWASP A05 / ASVS V14)
Configured globally in [`next.config.ts`](./next.config.ts) and [`src/middleware.ts`](./src/middleware.ts):

| Header | Value | Purpose |
| :--- | :--- | :--- |
| **Strict-Transport-Security** | `max-age=63072000; includeSubDomains; preload` | Enforces HTTPS strictly for 2 years across all subdomains. |
| **X-Frame-Options** | `DENY` | Prevents UI redressing and clickjacking attacks. |
| **X-Content-Type-Options** | `nosniff` | Blocks MIME-type sniffing by browsers. |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | Protects sensitive URL query parameters across origins. |
| **Permissions-Policy** | `camera=(), microphone=(), geolocation=(), payment=()` | Disables invasive browser APIs completely. |
| **Content-Security-Policy** | Strict directive allowlist | Restricts scripts, styles, frames, and sockets to self, Firebase, and Supabase. |

### 3.9 Self-Hosted Assets & Font Privacy (ASVS V14)
- Replaced external Google Fonts CDN `<link>` tags with Next.js self-hosted font loading via `next/font/google` in [`src/app/layout.tsx`](./src/app/layout.tsx).
- Eliminates third-party tracking, eliminates Subresource Integrity (SRI) failure risks, and improves page render performance.

### 3.10 PII Protection & Logging Sanitization (OWASP A09 / ASVS V8)
- Removed all production `console.log` statements outputting full participant objects, registration numbers, mobile phone numbers, or emails.
- Clean error messages returned to clients without exposing internal database schema details or stack traces.

---

## 4. Environment Variables & Secret Management

All production secrets must be managed securely through Cloudflare Pages / Vercel Environment Variables and must never be committed to version control.

| Environment Variable | Sensitivity | Required | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | :lock: High | Yes | Supabase PostgreSQL connection string (Transaction mode pooler, port 6543). |
| `DIRECT_URL` | :lock: High | Yes | Direct PostgreSQL connection string (Port 5432) for Prisma migrations. |
| `ADMIN_ACCESS_KEY` | :lock: High | Yes | Emergency breakglass key for administrative actions (Minimum 32 random characters). |
| `ADMIN_EMAILS` | :lock: Medium | Yes | Comma-separated list of evaluator email addresses (`@vitstudent.ac.in`). |
| `SUPER_ADMIN_EMAILS` | :lock: Medium | Yes | Comma-separated list of super administrator email addresses. |
| `FIREBASE_ADMIN_SERVICE_ACCOUNT` | :lock: High | Optional | JSON service account key for Firebase Admin token verification. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | :globe_with_meridians: Public | Yes | Firebase Web Client API key (Public by design; restricted in Firebase Console). |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | :globe_with_meridians: Public | Yes | Firebase project identifier. |

> [!WARNING]
> Never prefix administrative email lists, service accounts, or database credentials with `NEXT_PUBLIC_`. Any variable prefixed with `NEXT_PUBLIC_` is inlined into the client-side JavaScript bundle during build time.

---

## 5. Deployment & Pre-Flight Security Checklist

Before deploying any new build to production:

- [ ] **Type Check & Linting:** Run `npx tsc --noEmit` and ensure zero compilation errors.
- [ ] **Production Build Test:** Run `npm run build` to confirm static generation and bundle optimization.
- [ ] **Bundle Leak Inspection:** Verify that no admin emails or database credentials exist in the client output:
  ```powershell
  # Powershell verification
  Select-String -Path ".next\static\**\*.js" -Pattern "@vitstudent.ac.in"
  ```
- [ ] **Dependency Audit:** Run `npm audit` to verify zero High or Critical vulnerabilities.
- [ ] **Firebase Console Hardening:** Ensure Google OAuth is restricted to the production domain and `@vitstudent.ac.in` / `@vit.ac.in` domain constraints.
- [ ] **Supabase Network Restrictions:** Ensure database connection pooling is active and SSL enforcement is enabled (`sslmode=require`).

---

## 6. Incident Response Plan

In the event of a suspected security incident or data breach:

1. **Containment:** Rotate the `ADMIN_ACCESS_KEY`, Supabase database passwords, and Firebase Admin credentials immediately.
2. **Investigation:** Inspect server-side request logs and Supabase audit logs to determine the scope of unauthorized access.
3. **Remediation:** Deploy fixes to `main`, verify with automated builds, and purge the Cloudflare Edge cache.
4. **Notification:** If student PII has been exposed, notify the VIT Chennai technical advisors and affected participants within 72 hours in accordance with university data governance guidelines.
