<div align="center">

# 🚀 Hostel Solvathon 2026

**The Official Hackathon Management & Real-Time Evaluation Platform for VIT Chennai**

[![Live Website](https://img.shields.io/badge/Live%20Platform-solvathon26.co.in-00E5FF?style=for-the-badge&logo=google-chrome&logoColor=white)](https://solvathon26.co.in)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Firebase](https://img.shields.io/badge/Firebase_Auth-13.0-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare_Pages-OpenNext-F38020?style=for-the-badge&logo=cloudflare)](https://pages.cloudflare.com/)
[![Security Audited](https://img.shields.io/badge/Security-ASVS%20Level%202%20Compliant-success?style=for-the-badge&logo=shield)](./SECURITY.md)

<p align="center">
  🌐 <b>Live Platform:</b> <a href="https://solvathon26.co.in"><b>https://solvathon26.co.in</b></a>
</p>

<p align="center">
  <a href="https://solvathon26.co.in"><b>🚀 Live Website</b></a> •
  <a href="#-about-the-project">About</a> •
  <a href="#-key-features">Key Features</a> •
  <a href="#-system-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-environment-configuration">Configuration</a> •
  <a href="#-security--hardening">Security</a> •
  <a href="#-deployment">Deployment</a>
</p>

</div>

---

## 📖 About the Project

**Hostel Solvathon 2026** is an end-to-end hackathon coordination platform engineered specifically for **Vellore Institute of Technology (VIT), Chennai**. It orchestrates the entire event lifecycle:

1. **Student Registration:** Google OAuth restricted to institutional `@vitstudent.ac.in` domains, capturing hostel blocks, room allocations, mess details, and event consent.
2. **Dynamic Team Assembly:** Self-service team creation, alphanumeric team join codes, invite link sharing, leader reassignment, and automated empty-team garbage collection.
3. **Phased Deliverable Submissions:**
   - **Phase 1 (Ideation):** Problem track selection, presentation slides (Google Drive / Canva), and architectural summaries.
   - **Phase 2 (Final Build):** Source code repository (GitHub / GitLab), video demo links (YouTube / Loom), and production deliverables.
4. **Jury Evaluation Portal:** Multi-round scoring matrices (Internal Review 1, Internal Review 2, and External Jury) with real-time score calculation, evaluation notes, and immutable score freezing.
5. **Administration & Analytics:** Live registration statistics, tamper-proof Excel exports powered by `exceljs`, system phase controllers, and role-based access management.

---

## ✨ Key Features

### 👤 Participant Experience
- **Institutional Single Sign-On (SSO):** One-click authentication with Google OAuth, strictly enforcing `@vitstudent.ac.in` and `@vit.ac.in` email domains.
- **Onboarding & Ticket Generation:** Generates a secure participant record and unique node ticket PIN upon registration.
- **Team Management:**
  - Create teams with normalized name collision checks (ignoring casing, hyphens, and whitespace evasion).
  - Join teams via cryptographically secure 6-character team codes (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`).
  - Shareable team invite links with clipboard copying.
  - Graceful team leave flows with automated CSPRNG-based leader reassignment or team cleanup.
- **Interactive Countdown & Problem Statements:** Dynamic live countdown timer, interactive modal overlays for problem tracks, timeline milestones, and judging criteria.

### ⚖️ Reviewer & Evaluation Portal
- **Three-Tier Evaluation Rubric:**
  - **Innovation & Originality**
  - **Problem Understanding & Relevance**
  - **Technical Progress & Implementation**
- **Multi-Round Support:** Independent scoring tracks for Round 1, Round 2, and Final Review.
- **Score Freezing & Tamper Protection:** Single-click evaluation locking prevents retroactive modification once scores are finalized.
- **Anonymous Review Mode:** Evaluator interface protects student anonymity during judging rounds.

### 🛡️ Administrative Console
- **Export Engine:** High-performance, streaming `.xlsx` exports powered by `exceljs` (eliminates legacy vulnerabilities in `xlsx`).
- **Phase Control:** Instant toggles for submission windows, evaluation lockouts, and registration status.
- **Participant & Team Rosters:** Real-time search, filter, and verification tools for organizers.

---

## 🏗️ System Architecture

```
[ Client Browser (Participant / Judge / Admin) ]
                      │
                      │ HTTPS (TLS 1.3) + CSP + HSTS
                      ▼
[ Cloudflare Edge / Next.js Middleware (`src/middleware.ts`) ]
  ├── Edge-level Route Guarding (/admin/*, /profile/*)
  └── Defensive Security Headers (CSP, X-Frame-Options, HSTS, Permissions-Policy)
                      │
                      ▼
[ Next.js 16 Application Server (Turbopack / OpenNext) ]
  ├── Server Actions Layer (`src/actions/*`)
  │     ├── Firebase Admin Token Verification (verifyIdToken)
  │     ├── Sliding-Window Rate Limiter (`src/lib/rateLimit.ts`)
  │     ├── URL Validator & SSRF Guard (`src/lib/urlValidator.ts`)
  │     └── Role-Based Access Control (`src/config/admin.ts`)
  └── Client-Side Hydration (React 19, Framer Motion, Tailwind CSS)
                      │
                      │ Parameterized SQL Queries (Prisma ORM)
                      ▼
[ Supabase PostgreSQL Database (Transaction Pooler) ]
  ├── `Participant` (Hostel metadata, ticket PIN, foreign keys)
  ├── `Team` (Submissions, codes, leader assignments)
  ├── `TeamEvaluation` (Multi-round scoring, notes, frozen state)
  └── `SystemConfig` (Dynamic event phase flags)
```

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [Next.js 16.4.0](https://nextjs.org/) (App Router, Turbopack, Server Actions) |
| **Frontend Runtime** | [React 19.3.0](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling & Motion** | [Tailwind CSS 3.4](https://tailwindcss.com/), [Framer Motion 14.1](https://www.framer.com/motion/) |
| **Database & ORM** | [Supabase PostgreSQL](https://supabase.com/), [Prisma ORM 6.19](https://www.prisma.io/) with `@prisma/adapter-pg` |
| **Authentication** | [Firebase Auth](https://firebase.google.com/) (Client SDK) + [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) (Server-side token verification) |
| **Edge Deployment** | [OpenNext for Cloudflare](https://opennext.js.org/cloudflare), [Wrangler 4](https://developers.cloudflare.com/workers/wrangler/) |
| **Data Validation & Exports** | [Zod 4](https://zod.dev/), [ExcelJS 4.4](https://github.com/exceljs/exceljs) |

---

## 📂 Project Structure

```
Hostle Solvathon/
├── prisma/
│   └── schema.prisma            # PostgreSQL schemas (Participant, Team, TeamEvaluation)
├── public/                      # Static logos, icons, and event collateral
├── scripts/                     # Operational utilities and OpenNext build patchers
│   └── patch-opennext.js
├── src/
│   ├── actions/                 # Next.js Server Actions (Zero-trust verified)
│   │   ├── admin.ts             # Evaluation, phase management & exports
│   │   ├── register.ts          # Student registration & validation
│   │   ├── stats.ts             # Live registration counters
│   │   └── team.ts              # Team lifecycle, invite links & submissions
│   ├── app/                     # App Router pages and API routes
│   │   ├── admin/               # Administrative dashboard & evaluation sheets
│   │   ├── login/               # Institutional Google OAuth page
│   │   ├── profile/             # Student dashboard, team portal & submissions
│   │   ├── register/            # Multi-step hostel registration form
│   │   ├── rules/               # Event guidelines & evaluation rubrics
│   │   ├── layout.tsx           # Root layout with self-hosted Google Fonts
│   │   └── page.tsx             # Main event landing page
│   ├── config/
│   │   └── admin.ts             # Server-only admin email lists and RBAC helpers
│   ├── context/
│   │   └── AuthContext.tsx      # Firebase auth provider & privilege resolution
│   ├── data/                    # JSON datasets (Problem statements, timeline, committee)
│   ├── lib/
│   │   ├── firebase/            # Firebase Client and Admin SDK initializers
│   │   ├── authSession.ts       # Cookie session sync helpers
│   │   ├── prisma.ts            # Prisma client singleton with connection pooling
│   │   ├── rateLimit.ts         # Sliding-window in-memory rate limiter
│   │   └── urlValidator.ts      # SSRF defense & presentation URL allowlist
│   └── middleware.ts            # Edge route protection & HTTP security headers
├── next.config.ts               # Content Security Policy & Next.js config
├── open-next.config.ts          # OpenNext Cloudflare Workers build configuration
├── SECURITY.md                  # Comprehensive security policy & vulnerability guide
└── wrangler.jsonc               # Cloudflare Pages / Workers deployment manifest
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your development workstation:
- **Node.js:** `v20.x` or later (LTS recommended)
- **Package Manager:** `npm` (v10+)
- **PostgreSQL Database:** Supabase project or local PostgreSQL instance
- **Firebase Project:** Configured with Google Sign-In provider

### 1. Clone the Repository

```bash
git clone https://github.com/SuyashSrivastava1/SolvaThon.git
cd SolvaThon
```

### 2. Install Dependencies

```bash
npm install
```
*(This triggers a post-install hook to generate the Prisma Client and apply OpenNext compatibility patches).*

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# ==========================================
# DATABASE (Supabase PostgreSQL)
# ==========================================
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# ==========================================
# FIREBASE CLIENT CONFIGURATION (Public)
# ==========================================
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="solvathon-xxxxx.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="solvathon-xxxxx"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="solvathon-xxxxx.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"

# ==========================================
# FIREBASE ADMIN SDK (Server-Side Only)
# ==========================================
# Paste your Firebase Service Account JSON stringified, or provide credentials
FIREBASE_ADMIN_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'

# ==========================================
# ADMINISTRATIVE ROLES (Server-Side Only)
# ==========================================
# Comma-separated list of administrative email addresses (Must be @vitstudent.ac.in or @vit.ac.in)
ADMIN_EMAILS="organizer1@vitstudent.ac.in,organizer2@vitstudent.ac.in"
SUPER_ADMIN_EMAILS="superadmin@vitstudent.ac.in"

# Breakglass emergency key (Minimum 32 random characters)
ADMIN_ACCESS_KEY="your-cryptographically-secure-breakglass-key"
```

> [!CAUTION]
> **Never** commit `.env` or prefix administrative email lists/service accounts with `NEXT_PUBLIC_`. Doing so exposes them in client-side bundles.

### 4. Push Database Schema

Synchronize the Prisma models with your PostgreSQL database:

```bash
npx prisma db push
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to inspect the application.

---

## 🛠️ Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with Turbopack on port 3000. |
| `npm run build` | Compiles the production build, runs TypeScript checks, and pre-renders static routes. |
| `npm run start` | Launches the compiled production server locally. |
| `npm run lint` | Executes ESLint against all source files. |
| `npm run preview` | Builds and emulates the Cloudflare Pages edge environment locally. |
| `npm run deploy` | Builds and deploys the bundle directly to Cloudflare Pages via OpenNext. |
| `npm run cf-typegen` | Generates TypeScript definitions for Cloudflare worker bindings. |

---

## 🔒 Security & Hardening

The application has been audited and hardened according to **OWASP Top 10 (2021)** and **OWASP ASVS Level 2** guidelines:

- **Identity & Access Verification (CRIT-01):** Replaced unverified client inputs with server-side Firebase Admin ID token validation (`getAuthenticatedUser()`).
- **Roster & Credential Protection (CRIT-02 & HIGH-01):** Removed all administrative email leaks from client bundles and removed hardcoded backdoor keys.
- **Edge Route Guards (HIGH-02):** Next.js Edge Middleware intercepts and validates session cookies for `/admin/*` and `/profile/*` paths.
- **Supply Chain Remediation (HIGH-03):** Replaced vulnerable `xlsx` with audited `exceljs`.
- **CSPRNG Cryptography (MED-02):** Node.js `crypto.randomBytes` and `crypto.randomInt` used for team join codes and leader allocations.
- **Sliding-Window Rate Limiting (MED-03):** Built-in rate limiting defends against brute-force attacks on team codes, registrations, and submissions.
- **SSRF Defense (MED-01):** URL validator enforces HTTPS and blocks internal IPs (`127.0.0.1`, `10.0.0.0/8`, `169.254.169.254`, etc.).
- **Defensive HTTP Headers (MED-04):** Enforced HSTS (2 years), strict Content Security Policy (CSP), `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff`.

For detailed security disclosures, vulnerability reporting instructions, and architectural threat models, consult [**`SECURITY.md`**](./SECURITY.md).

---

## 🌐 Deployment & Live Platform

The production application is actively hosted and accessible at:

> 🔗 **Official Website:** [**https://solvathon26.co.in**](https://solvathon26.co.in)

### Deploying to Cloudflare Pages (Recommended)

1. Ensure your Cloudflare account is authenticated:
   ```bash
   npx wrangler login
   ```
2. Build and deploy using OpenNext:
   ```bash
   npm run deploy
   ```
3. Set your production environment variables in the Cloudflare Pages Dashboard under **Settings > Environment variables**.

### Deploying to Vercel

1. Push your repository to GitHub.
2. Import the project into the [Vercel Dashboard](https://vercel.com/new).
3. Populate all environment variables defined in `.env`.
4. Deploy the project with default Next.js build settings.

---

## 🤝 Contributing & Code Standards

We welcome contributions from the student development team:

1. **Branching Strategy:** Create feature branches off `main` (`feature/your-feature-name` or `fix/issue-description`).
2. **Commit Conventions:** Follow Conventional Commits:
   - `feat:` New user-facing functionality
   - `fix:` Bug fixes or security patches
   - `docs:` Documentation improvements
   - `refactor:` Code reorganization without behavioral change
3. **Pre-Push Validation:**
   Always verify type safety and build output before pushing:
   ```bash
   npx tsc --noEmit
   npm run build
   ```

---

## 📄 License & Acknowledgements

Developed by the **VIT Chennai Student Organizing Committee & Technical Leads** for **Hostel Solvathon 2026**.

- Special thanks to the **Vellore Institute of Technology, Chennai Hostel Administration** for event sponsorship and mentorship.
- Built with [Next.js](https://nextjs.org/), [Firebase](https://firebase.google.com/), [Prisma](https://www.prisma.io/), [Supabase](https://supabase.com/), and [Cloudflare](https://www.cloudflare.com/).

---

<div align="center">
  <sub>Built with ❤️ by the Hostel Solvathon Tech Team • VIT Chennai</sub>
</div>
