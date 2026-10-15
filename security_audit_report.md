# Security Audit Report — Hostel Solvathon
**Audit Date:** October 11, 2026  
**Auditor:** Antigravity Security Audit  
**Scope:** Full repository, all source files, configuration, dependencies, and git history  
**Methodology:** Manual code review + npm audit + static analysis

---

## 1. Executive Summary

### Application Overview
The Hostel Solvathon is a Next.js 16 hackathon management platform for VIT Chennai. It handles participant registration (Firebase Google OAuth), team formation, idea and final project submissions, and a live admin/evaluation console. The database is Supabase-hosted PostgreSQL, accessed via Prisma ORM.

### Security Posture: ⚠️ MODERATE RISK — Requires Fixes Before Public Deployment

The application has a sound foundational architecture (parameterized queries via Prisma ORM, Zod schema validation on registration, `.env` protection for secrets), but contains several **critical and high-severity issues** that must be addressed before the event goes live.

### Finding Summary

| Severity | Count |
| :--- | :--- |
| 🔴 Critical | 2 |
| 🟠 High | 5 |
| 🟡 Medium | 4 |
| 🟢 Low | 3 |
| ℹ️ Informational | 2 |
| **Total** | **16** |

### Top 5 Risks (Immediate Attention Required)

1. **[CRIT-01]** — Server actions have **no server-side identity verification**. The `firebaseUid` passed by the client is trusted as-is, allowing **any user to act as any other participant** (full IDOR).
2. **[CRIT-02]** — Admin emails are exposed to the public internet via `NEXT_PUBLIC_ADMIN_EMAILS` and `NEXT_PUBLIC_SUPER_ADMIN_EMAILS` environment variables, embedded in the client JavaScript bundle.
3. **[HIGH-01]** — `ADMIN_ACCESS_KEY` (value: `warden_cyft_2025`) is hardcoded as a fallback in `admin.ts` and grants full admin data access and phase control as a bypass backdoor.
4. **[HIGH-02]** — There is no Next.js middleware protecting `/admin`. All authorization is client-side-only, meaning the admin portal renders (briefly) before redirects fire in the browser.
5. **[HIGH-03]** — The `xlsx` package has **no available fix** and two known CVEs (Prototype Pollution + ReDoS), directly impacting the Excel export feature used in production.

### Areas Not Verified (Require Live Environment Access)
- Supabase Row-Level Security (RLS) policies — cannot be assessed from source code alone.
- Firebase Authentication console settings (authorized domains, email enumeration protection).
- Vercel deployment environment variable configuration.
- TLS certificate and HTTPS enforcement configuration.
- Network-level firewall rules for the Supabase database.

---

## 2. Repository Coverage Report

### Files and Directories Inspected

| Path | Status |
| :--- | :--- |
| `src/actions/admin.ts` | ✅ Full review |
| `src/actions/team.ts` | ✅ Full review |
| `src/actions/register.ts` | ✅ Full review |
| `src/actions/stats.ts` | ✅ Full review |
| `src/app/admin/page.tsx` | ✅ Full review |
| `src/app/profile/page.tsx` | ✅ Full review |
| `src/app/register/page.tsx` | ✅ Full review |
| `src/app/login/page.tsx` | ✅ Full review |
| `src/app/layout.tsx` | ✅ Full review |
| `src/app/page.tsx` | ✅ Reviewed for secrets/injection |
| `src/config/admin.ts` | ✅ Full review |
| `src/context/AuthContext.tsx` | ✅ Full review |
| `src/lib/firebase/config.ts` | ✅ Full review |
| `src/lib/prisma.ts` | ✅ Full review |
| `src/lib/schemas.ts` | ✅ Full review |
| `prisma/schema.prisma` | ✅ Full review |
| `.env` | ✅ Reviewed (local; not tracked) |
| `.gitignore` | ✅ Reviewed |
| `next.config.ts` | ✅ Full review |
| `package.json` | ✅ Full review |
| `package-lock.json` | ✅ npm audit run |
| Git history (all commits) | ✅ Reviewed |

### Not Inspected / Out-of-Scope
- `stitch_ui/` — generated UI source files; no server-side logic
- `node_modules/` — covered by `npm audit`
- `.next/` — build artifact
- Supabase dashboard configuration (live environment)
- Firebase Console configuration (live environment)

---

## 3. Prioritized Vulnerability Register

| ID | Title | Severity | Confidence | Affected File | Primary Impact | Fix |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| CRIT-01 | Unauthenticated Server Actions — IDOR via trusted client UID | 🔴 Critical | High | `src/actions/team.ts` (all functions) | Any user acts as any participant | Verify Firebase ID token server-side |
| CRIT-02 | Admin emails publicly exposed via `NEXT_PUBLIC_*` variables | 🔴 Critical | High | `.env`, `src/config/admin.ts` | Admin account enumeration | Remove `NEXT_PUBLIC_` admin email vars |
| HIGH-01 | Hardcoded `ADMIN_ACCESS_KEY` fallback grants admin access | 🟠 High | High | `src/actions/admin.ts` L6 | Full admin data access/phase control | Remove fallback; require env var |
| HIGH-02 | No server-side route protection (missing Next.js middleware) | 🟠 High | High | `src/app/admin/page.tsx` | Admin page briefly renderable | Add Next.js `middleware.ts` |
| HIGH-03 | `xlsx` package has unfixable known CVEs (no patch available) | 🟠 High | High | `package.json` | Prototype Pollution, ReDoS | Replace `xlsx` with ExcelJS |
| HIGH-04 | Firebase config values hardcoded as fallbacks in source | 🟠 High | High | `src/lib/firebase/config.ts` L5-11 | Project ID, Storage bucket, App ID exposed in git | Remove fallbacks; fail fast |
| HIGH-05 | Firebase UID logged to server console in production | 🟠 High | High | `src/actions/register.ts` L53 | PII (UID) exposed in server logs | Remove `console.log` |
| MED-01 | No server-side input validation on URLs submitted by participants | 🟡 Medium | High | `src/actions/team.ts` L154, L198 | Open redirect, SSRF via stored URLs | Allowlist domains; block private IPs |
| MED-02 | Team code uses `Math.random()` (non-CSPRNG) | 🟡 Medium | High | `src/actions/team.ts` L19 | Team codes predictable/enumerable | Use `crypto.randomBytes()` |
| MED-03 | No rate limiting on registration or submission endpoints | 🟡 Medium | High | All server actions | Registration spam, submission abuse | Add Vercel rate limiting or Upstash |
| MED-04 | Missing HTTP security headers (CSP, HSTS, X-Frame-Options) | 🟡 Medium | High | `next.config.ts` | XSS, clickjacking, MITM | Add security headers in `next.config.ts` |
| LOW-01 | `@grpc/grpc-js` vulnerability via Firebase transitive dep | 🟢 Low | Medium | `package-lock.json` | TLS certificate validation bypass | Monitor; this affects Firestore (unused) |
| LOW-02 | External fonts and Material Icons loaded without SRI | 🟢 Low | Medium | `src/app/layout.tsx` L24-26 | Supply chain attack via CDN compromise | Add subresource integrity |
| LOW-03 | `prisma` package vulnerable via `deepmerge-ts` dependency | 🟢 Low | Medium | `package-lock.json` | Stack exhaustion DoS (CLI only) | Update `prisma` to `>=6.12.0` |
| INFO-01 | No Next.js middleware file exists at all | ℹ️ Informational | High | (missing file) | Auth-bypass window on page load | See HIGH-02 remediation |
| INFO-02 | Root-level utility scripts committed to repo | ℹ️ Informational | Medium | `convert.js`, `fix-*.js`, etc. | Increases attack surface, leaks architecture | Move to `scripts/` and add to `.gitignore` |

---

## 4. Detailed Findings

---

### 🔴 CRIT-01 — Unauthenticated Server Actions: Full IDOR via Trusted Client UID

**Root Cause:** Every sensitive Server Action (`createTeam`, `joinTeam`, `selectProblemStatement`, `submitProject`, `submitFinalProject`, `getTeamDetails`) accepts a `firebaseUid` parameter directly from the client and immediately uses it to look up and mutate database records—**without ever verifying that the calling user actually owns that Firebase UID**.

**Evidence (`src/actions/team.ts`):**
```ts
// Line 5 — No server-side auth check:
export async function createTeam(firebaseUid: string, teamName: string) {
  const participant = await prisma.participant.findUnique({ where: { firebaseUid } });
  // ... creates team on behalf of whoever that UID belongs to
}
```

The client in `profile/page.tsx` passes `user!.uid` (from the Firebase auth state), but this is **never verified on the server**. Any user who inspects network calls and substitutes a different UID will act as that other participant.

**Attack Scenario:**
1. Attacker Alice is registered participant with UID `alice-uid`.
2. Alice learns Bob's UID (`bob-uid`) by any means (e.g. guessing, leaked info).
3. Alice calls `submitFinalProject("bob-uid", { finalDocUrl: "http://evil.com" })` directly.
4. Bob's team's final submission is overwritten with Alice's content.

**Why Existing Controls Fail:** The client-side redirect (`isAdminEmail` check in `useEffect`) only prevents UI navigation; it does not protect the Server Action endpoint which is independently callable via HTTP.

**Remediation:**
```ts
// src/lib/firebase/admin.ts (new file)
import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const adminApp: App = !getApps().length
  ? initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT!)) })
  : getApps()[0];

export const adminAuth = getAuth(adminApp);

// --- In every Server Action ---
import { headers } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export async function createTeam(teamName: string) {  // ← Remove firebaseUid param
  const headersList = headers();
  const token = headersList.get("Authorization")?.replace("Bearer ", "");
  if (!token) return { success: false, error: "Unauthorized" };
  
  const decoded = await adminAuth.verifyIdToken(token);  // ← Server verifies token
  const firebaseUid = decoded.uid;
  // ... rest of logic using verified firebaseUid
}
```

The frontend then sends the token in every fetch/action call:
```ts
const token = await user.getIdToken();
// Pass token via hidden field or custom header depending on action invocation method
```

**ASVS Control:** V4.1.1 (Verify user access controls), V4.2.1 (Verify sensitive data protected by auth)

---

### 🔴 CRIT-02 — Admin Emails Publicly Exposed via `NEXT_PUBLIC_*` Variables

**Root Cause:** Admin and Super Admin email addresses are stored in `NEXT_PUBLIC_SUPER_ADMIN_EMAILS` and `NEXT_PUBLIC_ADMIN_EMAILS`, which Next.js **embeds directly into the client-side JavaScript bundle** at build time. Anyone can see them by opening DevTools → Sources.

**Evidence (`.env` lines 19-20):**
```env
NEXT_PUBLIC_SUPER_ADMIN_EMAILS="atman.dash2025@vitstudent.ac.in,atmandash2007@gmail.com"
NEXT_PUBLIC_ADMIN_EMAILS="atman.dash2025@vitstudent.ac.in,suyash.srivastava2025@vitstudent.ac.in,..."
```

**Evidence (`src/config/admin.ts` lines 21-33):**
```ts
const envEmails = process.env.SUPER_ADMIN_EMAILS || process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || "";
```

The fallback to `NEXT_PUBLIC_*` means even on the server, the client-bundle-exposed values are used.

**Impact:** Full enumeration of all admin email addresses, enabling targeted phishing, social engineering, or brute-force attacks against admin accounts.

**Remediation:**
1. Remove lines 19-20 from `.env` entirely.
2. Update `src/config/admin.ts` to read only from server-side vars:
```ts
// Remove NEXT_PUBLIC_ fallbacks completely
export function getSuperAdminEmails(): string[] {
  return parseEmailList(process.env.SUPER_ADMIN_EMAILS || "");
}
```
3. The client-side redirect logic in `register/page.tsx` and `profile/page.tsx` that calls `isAdminEmail()` should use a **server action** instead of client-side env check. Since CRIT-01 must be fixed anyway, this becomes: the server verifies the ID token, checks the email, and returns the redirect instruction.

**ASVS Control:** V14.3.3 (Verify application does not expose sensitive info via environment or error messages)

---

### 🟠 HIGH-01 — Hardcoded `ADMIN_ACCESS_KEY` Fallback in Source Code

**Root Cause:** `src/actions/admin.ts` line 6:
```ts
const ADMIN_KEY = process.env.ADMIN_ACCESS_KEY || "warden_cyft_2025";
```

If the environment variable is unset (e.g. misconfigured deployment), the hardcoded string `warden_cyft_2025` becomes the active admin password. This key also grants `isSuperAdmin = true`:
```ts
const isSuperAdmin = isSuperAdminEmail(tokenOrEmail) || isKeyValid;  // Line 32
```

Any actor who reads the public GitHub repository or the built JavaScript (server-side, but leaked in error stacks) can obtain full admin access, read all participant PII, and control the hackathon phase.

**Note:** This value is also committed to `.env` and thus to any developer's local copy.

**Remediation:**
```ts
// src/actions/admin.ts — Remove the fallback:
const ADMIN_KEY = process.env.ADMIN_ACCESS_KEY;
// If undefined, the key-based path simply never succeeds (isKeyValid is always false)
```

Since the access-key-based auth path is a legacy mechanism that should be eliminated (all admins now use Google OAuth), also remove the `ADMIN_KEY` check from `getAdminData`, `toggleSubmissionPhase`, and `updateHackathonTimer`.

---

### 🟠 HIGH-02 — No Server-Side Route Protection (Missing Next.js Middleware)

**Root Cause:** There is no `middleware.ts` file anywhere in the project. The entire auth guard for `/admin` is a `useEffect` hook in the client component (`admin/page.tsx` lines 60-88).

**Attack Scenario:**
1. An unauthenticated user navigates to `/admin`.
2. The client-rendered page briefly mounts and renders (the loading spinner or possibly data if the API call resolves before the redirect).
3. The `useEffect` fires, detects no user, and calls `router.replace("/register")`.

During the time between mount and redirect, sensitive admin data can be requested via `getAdminData()` before the redirect fires. More critically, JavaScript-disabled crawlers (e.g., security scanners) see the admin page source.

**Remediation:** Add `src/middleware.ts`:
```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // The admin page handles its own auth via Firebase tokens server-side
  // This middleware blocks unauthenticated requests at the edge
  const session = request.cookies.get("__session"); // Firebase Auth session cookie
  
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/register", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*"],
};
```

> [!NOTE]
> Full middleware auth with Firebase requires setting a server-side session cookie on login, which is a larger change. At minimum, the security headers fix (see MED-04) can be applied here immediately.

---

### 🟠 HIGH-03 — `xlsx` Package Has No Available Security Fix

**Root Cause:** The `xlsx` package (`^0.18.5`) has two unfixed CVEs:
- **GHSA-4r6h-8v6p-xvw6**: Prototype Pollution — attacker-controlled spreadsheet content can pollute `Object.prototype`.
- **GHSA-5pgg-2g8v-p4x9**: ReDoS — malformed content can cause CPU exhaustion via catastrophic regex backtracking.

`npm audit` confirms: **"No fix available."** This is a direct production dependency used in the admin Excel export.

**Impact:** Since the admin console generates the spreadsheet from database content (not from user uploads), Prototype Pollution is limited in direct exploitability here—but ReDoS is still applicable. More critically, keeping a known-vulnerable package with no fix creates ongoing supply-chain debt.

**Remediation:** Replace `xlsx` with `exceljs`:
```bash
npm uninstall xlsx
npm install exceljs
```

The export function in `src/app/admin/page.tsx` requires a rewrite to use ExcelJS's promise-based API, but the logic is equivalent.

---

### 🟠 HIGH-04 — Firebase Project Metadata Hardcoded as Fallbacks in Source

**Root Cause:** `src/lib/firebase/config.ts` lines 5-11:
```ts
apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q",
authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "solvathon-8d5e3.firebaseapp.com",
projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "solvathon-8d5e3",
storageBucket: "solvathon-8d5e3.firebasestorage.app",  // Always hardcoded
messagingSenderId: "689796429843",                       // Always hardcoded
appId: "1:689796429843:web:1f8de6f245404aa0f7a7e6",     // Always hardcoded
```

**Git History Evidence:** These values appeared in commit `925b32b` (Oct 11) and are permanently recorded in git history.

Note: Firebase `apiKey` values for web apps are inherently semi-public (they identify the project, not authenticate to it), but the combination of Project ID, App ID, and Storage Bucket fully identifies the Firebase project and enables unauthorized reads/writes if Firebase security rules are misconfigured.

**Remediation:**
```ts
// config.ts — fail fast if required env vars missing
const requiredVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Fail loudly in development, silently log in production
if (!requiredVars.apiKey || !requiredVars.projectId) {
  throw new Error("Missing required Firebase environment variables");
}
```

**Note:** Since these values are `NEXT_PUBLIC_*`, they are still visible in the client bundle — this is by design for Firebase web SDKs. The risk is the **lack of fallback removal** and **git history exposure** of the actual project values.

---

### 🟠 HIGH-05 — Firebase UID Logged to Server Console (PII Leakage)

**Root Cause:** `src/actions/register.ts` line 53:
```ts
console.log("checkIsRegistered", firebaseUid, !!user);
```

This is a debug log left in production code. Firebase UIDs are personally identifying tokens. On Vercel, these appear in the Function Logs dashboard, which may be accessible to team members beyond the intended security boundary.

**Remediation:** Remove the `console.log` statement. Debug logging should use a proper logger with configurable log levels:
```ts
// Only log in development
if (process.env.NODE_ENV === "development") {
  console.log("checkIsRegistered", firebaseUid.slice(0, 8) + "...", !!user);
}
```

---

### 🟡 MED-01 — No URL Domain Allowlist for Participant-Submitted Links

**Root Cause:** `src/actions/team.ts` lines 154 and 198 validate URLs only with a basic `startsWith("http")` check:
```ts
if (!data.pptUrl || (!data.pptUrl.startsWith("http://") && !data.pptUrl.startsWith("https://"))) {
  return { success: false, error: "..." };
}
```

This allows participants to submit any URL — including `javascript:` protocol bypasses, `http://localhost:6543` (pointing to internal infrastructure), `http://169.254.169.254` (AWS metadata endpoint), or file-sharing links from questionable sources.

**Impact:** When admins click these links in the admin portal (and they render as clickable `<a>` tags without domain verification), they can be directed to malicious sites. SSRF is partially limited since the server never fetches these URLs — but the admin's browser does.

**Remediation:**
```ts
const ALLOWED_SUBMISSION_DOMAINS = [
  "docs.google.com", "drive.google.com", "slides.google.com",
  "github.com", "gitlab.com", "notion.so",
  "youtu.be", "youtube.com", "canva.com",
  "vercel.app", "netlify.app"
];

function isAllowedSubmissionUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    if (url.protocol !== "https:") return false;
    return ALLOWED_SUBMISSION_DOMAINS.some(d => url.hostname === d || url.hostname.endsWith("." + d));
  } catch {
    return false;
  }
}
```

---

### 🟡 MED-02 — Non-Cryptographic Random Used for Team Codes

**Root Cause:** `src/actions/team.ts` line 19:
```ts
newTeamCode = Math.random().toString(36).substring(2, 8).toUpperCase();
```

`Math.random()` is not a cryptographically secure PRNG. While guessing a 6-character base-36 code (~2.18 billion combinations) takes effort, the weak RNG means the output distribution is not uniformly random, and in environments where the RNG state is seeded predictably, codes may be more guessable.

**Remediation:**
```ts
import { randomBytes } from "crypto";

function generateTeamCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Unambiguous characters
  let code = "";
  const bytes = randomBytes(6);
  for (const byte of bytes) {
    code += chars[byte % chars.length];
  }
  return code;
}
```

---

### 🟡 MED-03 — No Rate Limiting on Any Server Action

**Root Cause:** No rate limiting exists anywhere in the codebase. Every server action can be called unlimited times. There is no middleware or IP-based throttling.

**Impact:**
- Registration endpoint can be abused to bulk-register fake participants.
- Team join endpoint can be used to enumerate valid team codes.
- Admin evaluation endpoint can be called repeatedly to overwrite scores.
- During hackathon submission deadline, a malicious participant could spam submissions to lock out legitimate team members.

**Remediation:** Use Vercel's built-in rate limiting or Upstash Redis:
```ts
// Install: npm install @upstash/ratelimit @upstash/redis
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 requests per 60 seconds
});

export async function registerParticipant(data: ...) {
  const identifier = data.firebaseUid; // or IP from headers()
  const { success } = await ratelimit.limit(identifier);
  if (!success) return { success: false, error: "Too many requests. Please wait." };
  // ...
}
```

---

### 🟡 MED-04 — Missing HTTP Security Headers

**Root Cause:** `next.config.ts` has empty configuration:
```ts
const nextConfig: NextConfig = { /* config options here */ };
```

None of the following security headers are set: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`.

**Remediation:** Add to `next.config.ts`:
```ts
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://apis.google.com",  // Firebase requires unsafe-inline or nonces
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.firebaseapp.com https://*.googleapis.com https://*.supabase.co wss://*.supabase.co",
      "frame-src https://accounts.google.com",
    ].join("; ")
  }
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
```

---

### 🟢 LOW-01 — `@grpc/grpc-js` TLS Bypass via Firebase Transitive Dependency

**Root Cause:** `@grpc/grpc-js <= 1.13.5` is pulled in by `@firebase/firestore`. CVE: GHSA-m9gg-hp2v-232j — In certain TLS configurations, `getAuthContext` can accept unauthorized certificates.

**Application Impact:** The application uses Firebase Authentication (not Firestore). The vulnerable Firestore package is included in the `firebase` bundle but is not called. **Risk is Low for this application specifically.** However, the fix (`firebase@9.14.0`) is a breaking major version change.

**Recommendation:** Monitor. If Firestore is added in future, fix urgently.

---

### 🟢 LOW-02 — External Fonts and Icon Libraries Loaded Without Subresource Integrity

**Root Cause:** `src/app/layout.tsx` lines 24-26:
```html
<link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined..." />
```

No `integrity` attribute. If Google's CDN is compromised or the domain is hijacked, malicious CSS can be served to all users.

**Recommendation:** Use `next/font` for Google Fonts (built-in Next.js module that self-hosts fonts securely). For Material Symbols, consider self-hosting.

---

### 🟢 LOW-03 — Prisma CLI Vulnerable via `deepmerge-ts`

`prisma` and `@prisma/client` in version range `6.13.0-dev.1 - 8.1.0-dev.4` depend on `deepmerge-ts < 8.0.0`, which has a stack-exhaustion vulnerability (GHSA-ggr8-5vv4-36mx).

**Impact:** This affects the Prisma CLI (build/migration tooling), not the runtime database client. Production server process is not directly affected.

**Remediation:** Update Prisma: `npm install prisma@6.12.0 @prisma/client@6.12.0 --save-exact`

---

### ℹ️ INFO-01 — Brief Admin Page Render Before Client-Side Redirect

This is a consequence of HIGH-02. When `authLoading` is `true` (the auth state hasn't resolved yet), the page renders a loading spinner at lines 358-369 of `admin/page.tsx`. This is the intended safe behavior — the loading screen reveals no data. Once middleware is in place (HIGH-02 remediation), this becomes a non-issue.

---

### ℹ️ INFO-02 — Root-Level Development Utility Scripts in Repository

Files `convert.js`, `fix-jsx.js`, `fix-structure.js`, `extract-section.js`, `swap-timer.js`, `update-form.js`, `update-timer.js` are committed to the root of the repository. These are development utilities that read and write source files and reveal internal architecture details.

**Recommendation:** Move to a `scripts/` directory and add to `.gitignore`:
```
scripts/
stitch_ui/
*.docx
```

---

## 5. Remediation Playbook

### P0 — Fix Before Any External Traffic (Before the Event)

| Item | File(s) | Effort |
| :--- | :--- | :--- |
| **CRIT-01**: Add server-side Firebase token verification to all server actions | `src/actions/team.ts`, `src/actions/register.ts`, new `src/lib/firebase/admin.ts` | High (1-2 days) |
| **CRIT-02**: Remove `NEXT_PUBLIC_ADMIN_EMAILS` and `NEXT_PUBLIC_SUPER_ADMIN_EMAILS` | `.env`, `src/config/admin.ts` | Low (30 min) |
| **HIGH-01**: Remove `ADMIN_ACCESS_KEY` hardcoded fallback | `src/actions/admin.ts` | Low (10 min) |
| **HIGH-05**: Remove PII `console.log` | `src/actions/register.ts` L53 | Low (5 min) |

### P1 — Fix Before Public Registration Opens

| Item | File(s) | Effort |
| :--- | :--- | :--- |
| **HIGH-02**: Add `middleware.ts` for edge-level route protection | New `src/middleware.ts` | Medium (2-4 hours) |
| **HIGH-03**: Replace `xlsx` with `exceljs` | `package.json`, `src/app/admin/page.tsx` | Medium (4-6 hours) |
| **MED-04**: Add HTTP security headers | `next.config.ts` | Low (1 hour) |
| **MED-01**: Add URL domain allowlist for submissions | `src/actions/team.ts` | Low (1 hour) |

### P2 — Fix in Next Maintenance Cycle

| Item | File(s) | Effort |
| :--- | :--- | :--- |
| **MED-02**: Replace `Math.random()` with `crypto.randomBytes()` | `src/actions/team.ts`, `src/actions/register.ts` | Low (30 min) |
| **MED-03**: Implement rate limiting | All `src/actions/*.ts` | Medium (4-6 hours) |
| **HIGH-04**: Remove hardcoded Firebase fallbacks | `src/lib/firebase/config.ts` | Low (30 min) |
| **LOW-03**: Update Prisma to `6.12.0` | `package.json` | Low (30 min) |

### P3 — Hardening (Pre-Production if Resources Allow)

| Item | File(s) | Effort |
| :--- | :--- | :--- |
| **LOW-02**: Self-host fonts via `next/font` | `src/app/layout.tsx` | Low (1 hour) |
| **INFO-02**: Move utility scripts out of root | Root directory | Low (30 min) |
| Supabase RLS: Enable Row-Level Security on Supabase tables | Supabase Dashboard | Medium |

---

## 6. Security Controls Matrix

| Category | Status | Notes |
| :--- | :--- | :--- |
| **Authentication** | ⚠️ Partial | Firebase OAuth works; but server never verifies tokens |
| **Authorization — Server Actions** | ❌ Missing | No server-side auth on team/submission actions (CRIT-01) |
| **Authorization — Admin Routes** | ⚠️ Partial | Client-side guard only; no middleware (HIGH-02) |
| **Authorization — Server Functions** | ✅ Implemented | `isAdminEmail()` checked in admin actions |
| **Input Validation (Registration)** | ✅ Implemented | Zod schema validates all registration fields |
| **Input Validation (Submissions)** | ⚠️ Partial | Only `startsWith("http")` for URLs (MED-01) |
| **SQL/NoSQL Injection** | ✅ Implemented | Prisma ORM with parameterized queries throughout |
| **XSS Prevention** | ✅ Implemented | React's JSX escapes by default; no `dangerouslySetInnerHTML` |
| **CSRF Protection** | ✅ Implemented | Next.js Server Actions use POST + CORS by default |
| **HTTP Security Headers** | ❌ Missing | No CSP, HSTS, X-Frame-Options (MED-04) |
| **Secret Management** | ⚠️ Partial | `.env` not tracked; but admin emails in `NEXT_PUBLIC_*` (CRIT-02) |
| **Cryptographic Randomness** | ⚠️ Partial | `Math.random()` for codes; TicketId uses Prisma `cuid()` (ok) |
| **Dependency Security** | ❌ Vulnerable | 17 vulnerabilities; `xlsx` has no fix (HIGH-03) |
| **Rate Limiting** | ❌ Missing | No throttling on any endpoint (MED-03) |
| **Logging — PII** | ❌ Vulnerable | Firebase UID logged in production (HIGH-05) |
| **Logging — Security Events** | ❌ Missing | No audit trail for admin actions |
| **Security Headers** | ❌ Missing | (MED-04) |
| **External CDN Integrity** | ❌ Missing | No SRI on font/icon links (LOW-02) |
| **Server-Side Route Guard** | ❌ Missing | No `middleware.ts` (HIGH-02) |

---

## 7. Test and Tool Results

### Tools Executed

| Tool | Command | Result |
| :--- | :--- | :--- |
| TypeScript Compiler | `npx tsc --noEmit` | ✅ Pass — 0 errors |
| npm audit | `npm audit` | ❌ **17 vulnerabilities** (2 moderate, 15 high) |
| Git history scan | `git log --all --full-history` | ✅ `.env` never committed |
| Manual code review | All source files | See findings above |

### Tools Not Executed (Available Upon Request)
- **Semgrep SAST**: Would require internet access or local install.
- **OWASP ZAP / Burp Suite**: Requires live deployment target.
- **Gitleaks**: Secret scanner for git history.

---

## 8. Security Regression Test Plan

### Test T-01: IDOR via Spoofed Firebase UID (CRIT-01)
After implementing server-side token verification:
1. Log in as User A; obtain their Firebase ID token.
2. Obtain User B's `firebaseUid` from the database or logs.
3. Attempt to call `createTeam("user-b-uid", "Hack")` without a valid token for User B.
4. **Expected:** `{ success: false, error: "Unauthorized" }` — server rejects the call.

### Test T-02: Admin Email Not in Client Bundle (CRIT-02)
1. Build the production bundle: `npm run build`.
2. Search the `.next` output directory: `grep -r "vitstudent.ac.in" .next/`.
3. **Expected:** Admin emails NOT found in any `.js` chunk file.

### Test T-03: Direct `/admin` Navigation When Logged Out (HIGH-02)
1. Open a fresh browser session (no cookies).
2. Navigate directly to `http://localhost:3000/admin`.
3. **Expected:** Immediate redirect to `/register`; zero admin content rendered.

### Test T-04: Submission with Disallowed URL Domain (MED-01)
1. Log in as a valid participant in a team.
2. Submit idea with `pptUrl: "http://169.254.169.254/metadata"`.
3. **Expected:** Server returns `{ success: false, error: "Invalid submission URL." }`.

### Test T-05: Rate Limiting on Registration (MED-03)
1. Call `registerParticipant(...)` 10 times in rapid succession with the same UID.
2. **Expected:** After the threshold, responses return `{ success: false, error: "Too many requests." }`.

### Test T-06: Security Headers Present (MED-04)
1. Make a `curl -I https://your-deployment.vercel.app/` request.
2. **Expected:** Response includes `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy`.

---

## 9. Deployment Readiness Checklist

### ✅ Mandatory — Must Be Fixed Before Going Live

- [ ] **CRIT-01**: Server-side Firebase token verification implemented in all server actions.
- [ ] **CRIT-02**: `NEXT_PUBLIC_ADMIN_EMAILS` and `NEXT_PUBLIC_SUPER_ADMIN_EMAILS` removed from `.env`.
- [ ] **HIGH-01**: Hardcoded `ADMIN_ACCESS_KEY` fallback string removed from `admin.ts`.
- [ ] **HIGH-05**: `console.log` with Firebase UID removed from `register.ts`.
- [ ] **MED-04**: HTTP security headers configured in `next.config.ts`.
- [ ] All required environment variables set in Vercel deployment settings.
- [ ] Firebase Console → Authentication → Authorized Domains: confirm only your production domain is listed.
- [ ] Supabase Dashboard → RLS: Confirm Row-Level Security is enabled on all tables (cannot verify from code alone).
- [ ] Confirm database connection uses `:6543` pooler URL (already done) with `connection_limit=1` appended.
- [ ] Supabase project status is **Active** (not paused) 24 hours before event start.

### ⚠️ Strongly Recommended — Fix Before Registration Opens

- [ ] **HIGH-02**: Add `middleware.ts` for edge-level route protection.
- [ ] **HIGH-03**: Replace `xlsx` with `exceljs`.
- [ ] **MED-01**: Add URL allowlist for participant submission links.
- [ ] **MED-02**: Replace `Math.random()` with `crypto.randomBytes()`.
- [ ] **MED-03**: Implement rate limiting on registration and submission endpoints.
- [ ] **HIGH-04**: Remove hardcoded Firebase fallback values.

### 📋 Risk-Based — Longer Term

- [ ] **LOW-02**: Self-host fonts via `next/font`.
- [ ] **LOW-03**: Update `prisma` to `>=6.12.0`.
- [ ] Add admin action audit logging to database.
- [ ] Move utility scripts out of repository root.

---

## 10. Final Assessment

### Most Dangerous Vulnerabilities

1. **CRIT-01 (IDOR)** is the highest-impact finding. Any registered participant can overwrite another team's submission, corrupt their evaluation, or read their private team details by substituting a different Firebase UID in any server action call.

2. **CRIT-02 (Admin Enumeration)** exposes admin emails in the public client bundle, enabling targeted attacks against the organizers.

### Which Findings Could Lead to Account Takeover or Data Exposure?
- CRIT-01 → Cross-participant data corruption and unauthorized submission manipulation.
- CRIT-02 → Admin account targeting via phishing.
- HIGH-01 → Full admin data access to anyone who reads the public source code or git history.

### Fix Priority Order
1. CRIT-01 (server-side token verification) — this is structural and may take a day.
2. CRIT-02 + HIGH-01 + HIGH-05 — can all be done in under an hour.
3. HIGH-02 + MED-04 — deploy together.
4. HIGH-03 (xlsx replacement) — before running any admin export.

### Risks That Remain After All Proposed Fixes
- Firebase Auth is trusted implicitly (this is acceptable for the threat model).
- No MFA on admin accounts (acceptable for a 24-hour hackathon event).
- Supabase RLS configuration cannot be verified without dashboard access.
- No monitoring/alerting for suspicious access patterns.

### Evidence Still Needed Before Claiming Production-Ready
1. Confirmation that Supabase RLS is enabled for all tables.
2. Firebase Console authorized domains are locked to the production URL only.
3. Vercel environment variables are correctly set and `NEXT_PUBLIC_ADMIN_EMAILS` is absent.
4. A live security test of the IDOR fix (T-01) against the production deployment.
