# Epic 0: Project Initialization & Setup

**Epic ID:** EPIC-0
**Epic Name:** Project Initialization & Setup
**Priority:** Critical (P0)
**Target Release:** Hackathon MVP - Pre-Development
**Status:** Ready for Development

---

## Epic Goal

Initialize the Next.js project with all required dependencies, configure local development services (PostgreSQL, Redis), set up authentication, establish database schema, and verify the complete development environment is functional.

---

## Epic Description

**Problem Statement:**
Before any feature development can begin, the project needs a fully configured development environment with all services, dependencies, and configurations in place. Missing or incorrect setup will block all downstream development.

**Solution:**
Create a complete project initialization checklist covering:
1. **Next.js project setup** with TypeScript and essential dependencies
2. **Local service installation** (PostgreSQL, Redis)
3. **Database schema** initialization with Prisma
4. **Authentication configuration** (NextAuth + LINE OAuth)
5. **External service setup** (LINE, Google Cloud Document AI)
6. **Development tooling** (ESLint, Prettier, testing)

**Value Delivered:**
- **Ready-to-Code Environment:** Developers can start feature work immediately
- **Consistent Setup:** All team members have identical configurations
- **Risk Reduction:** Catch configuration issues early, before feature development
- **Documentation:** Setup process documented for future reference

---

## User Stories

### US-0.1: Initialize Next.js Project with TypeScript
**As a** developer
**I want to** create a Next.js 14+ project with TypeScript and core dependencies
**So that** I have a working foundation for feature development

**Acceptance Criteria:**
- [ ] Next.js 14.2+ project created with App Router
- [ ] TypeScript configured with strict mode
- [ ] Tailwind CSS installed and configured
- [ ] Project structure matches architecture:
  ```
  household-bills/
  ├── app/              # Next.js App Router
  ├── components/       # React components
  ├── lib/             # Utilities, services, types
  ├── prisma/          # Database schema
  ├── public/          # Static assets
  ├── tests/           # Test files
  ```
- [ ] Package.json scripts configured:
  - [ ] `dev` - Start dev server
  - [ ] `build` - Production build
  - [ ] `lint` - ESLint
  - [ ] `format` - Prettier
  - [ ] `type-check` - TypeScript
- [ ] `.gitignore` includes: `.env.local`, `node_modules/`, `.next/`, `public/uploads/`
- [ ] README.md with setup instructions

**Commands:**
```bash
# Create Next.js project
npx create-next-app@latest household-bills --typescript --tailwind --app --use-pnpm

cd household-bills

# Install core dependencies
pnpm add @prisma/client prisma
pnpm add next-auth
pnpm add zod react-hook-form @hookform/resolvers
pnpm add date-fns
pnpm add bull redis
pnpm add @google-cloud/documentai

# Install UI library (shadcn/ui)
pnpm add class-variance-authority clsx tailwind-merge
pnpm add @radix-ui/react-avatar @radix-ui/react-dropdown-menu @radix-ui/react-dialog

# Install dev dependencies
pnpm add -D @types/node @types/react
pnpm add -D eslint prettier eslint-config-prettier
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
pnpm add -D @playwright/test
```

---

### US-0.2: Install and Configure Local Services
**As a** developer
**I want to** install PostgreSQL and Redis locally
**So that** the application can connect to required backend services

**Acceptance Criteria:**
- [ ] PostgreSQL 15+ installed locally
- [ ] PostgreSQL service running on port 5432
- [ ] Database `household_bills` created
- [ ] Connection verified: `psql -d household_bills -c "SELECT version();"`
- [ ] Redis 7+ installed locally
- [ ] Redis service running on port 6379
- [ ] Redis connection verified: `redis-cli ping` returns "PONG"
- [ ] Services configured to start on boot (optional)

**Installation Commands (macOS):**
```bash
# Install via Homebrew
brew install postgresql@15 redis

# Start services
brew services start postgresql@15
brew services start redis

# Create database
createdb household_bills

# Verify installations
psql --version      # Should show PostgreSQL 15.x
redis-cli ping      # Should return PONG
```

**Installation Commands (Ubuntu/Debian):**
```bash
# PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb household_bills

# Redis
sudo apt install redis-server
sudo systemctl start redis-server

# Verify
psql --version
redis-cli ping
```

---

### US-0.3: Configure Prisma and Database Schema
**As a** developer
**I want to** set up Prisma ORM with the complete database schema
**So that** I can perform type-safe database operations

**Acceptance Criteria:**
- [ ] Prisma initialized: `pnpm prisma init`
- [ ] `prisma/schema.prisma` created with complete data models:
  - [ ] User model (id, lineUserId, name, avatarUrl, timestamps)
  - [ ] Bill model (id, userId, vendor, amount, currency, dueDate, billType, rawImageUrl, ocrData, recurrence, timestamps)
  - [ ] Task model (id, billId, userId, title, status, dueDate, paidAt, paymentProofUrl, timestamps)
  - [ ] Notification model (id, userId, taskId, type, status, message, sentAt, readAt, metadata, createdAt)
  - [ ] Enums: BillType, TaskStatus, NotificationType, NotificationStatus
- [ ] Database URL configured in `.env.local`:
  ```
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/household_bills"
  ```
- [ ] Prisma Client generated: `pnpm prisma generate`
- [ ] Database schema pushed: `pnpm prisma db push`
- [ ] Prisma Client singleton created: `lib/prisma.ts`
- [ ] Migrations folder initialized (optional for hackathon)

**Prisma Schema Checklist:**
```prisma
// Verify all models include:
- [ ] User model with LINE integration fields
- [ ] Bill model with JSONB for ocrData and recurrence
- [ ] Task model with UNPAID/PAID status enum
- [ ] Notification model with type-based notifications
- [ ] All indexes defined (userId, status, dueDate)
- [ ] Cascade delete relationships configured
```

---

### US-0.4: Set Up Authentication (NextAuth + LINE)
**As a** developer
**I want to** configure NextAuth.js with LINE OAuth provider
**So that** users can authenticate with LINE

**Acceptance Criteria:**
- [ ] NextAuth.js installed: `pnpm add next-auth`
- [ ] LINE Login channel created in LINE Developers Console
- [ ] LINE LIFF app registered
- [ ] Environment variables configured:
  ```bash
  NEXTAUTH_URL="http://localhost:3000"
  NEXTAUTH_SECRET="<generated-secret>"
  LINE_CLIENT_ID="<from-line-console>"
  LINE_CLIENT_SECRET="<from-line-console>"
  NEXT_PUBLIC_LINE_LIFF_ID="<liff-id>"
  ```
- [ ] NextAuth secret generated: `openssl rand -base64 32`
- [ ] Auth config created: `lib/auth.ts` with LINE provider
- [ ] API route created: `app/api/auth/[...nextauth]/route.ts`
- [ ] Middleware configured for protected routes: `middleware.ts`
- [ ] Session callback updates user data in database
- [ ] Test login flow works end-to-end

**LINE Developer Setup:**
- [ ] LINE Official Account created
- [ ] LINE Login channel created
- [ ] Callback URL configured: `http://localhost:3000/api/auth/callback/line`
- [ ] LIFF app created with endpoint: `http://localhost:3000`
- [ ] Scopes enabled: `openid`, `profile`

---

### US-0.5: Configure External Services
**As a** developer
**I want to** set up Google Cloud Document AI and LINE Messaging API
**So that** OCR and notifications can function

**Acceptance Criteria:**
- [ ] **Google Cloud Project created**
- [ ] Document AI API enabled
- [ ] Receipt Parser processor created
- [ ] Service account created with Document AI User role
- [ ] Service account key downloaded: `gcp-credentials.json`
- [ ] GCP credentials added to `.gitignore`
- [ ] Environment variables configured:
  ```bash
  GCP_PROJECT_ID="<project-id>"
  GCP_LOCATION="us"
  GCP_PROCESSOR_ID="<processor-id>"
  GOOGLE_APPLICATION_CREDENTIALS="./gcp-credentials.json"
  ```
- [ ] Test OCR integration: Create sample receipt processing script
- [ ] **LINE Messaging API configured**
- [ ] LINE Official Account channel created
- [ ] Channel access token obtained
- [ ] Environment variables configured:
  ```bash
  LINE_CHANNEL_ACCESS_TOKEN="<access-token>"
  LINE_CHANNEL_SECRET="<channel-secret>"
  ```
- [ ] LINE Notify token obtained (optional fallback)
- [ ] Test notification: Send test LINE message

---

### US-0.6: Set Up Development Tooling
**As a** developer
**I want to** configure linting, formatting, and testing tools
**So that** code quality is maintained automatically

**Acceptance Criteria:**
- [ ] **ESLint configured**
  - [ ] `.eslintrc.json` with Next.js + TypeScript rules
  - [ ] `pnpm lint` command works
  - [ ] VSCode ESLint extension recommended
- [ ] **Prettier configured**
  - [ ] `.prettierrc` with consistent formatting rules
  - [ ] `pnpm format` command works
  - [ ] Prettier integrates with ESLint (no conflicts)
- [ ] **TypeScript strict mode**
  - [ ] `tsconfig.json` with `"strict": true`
  - [ ] `pnpm type-check` command works
  - [ ] No type errors in initial setup
- [ ] **Vitest configured for unit tests**
  - [ ] `vitest.config.ts` created
  - [ ] Test setup file: `tests/setup.ts`
  - [ ] Sample test passes: `tests/example.test.ts`
- [ ] **Playwright configured for E2E tests**
  - [ ] `playwright.config.ts` created
  - [ ] Browsers installed: `pnpm exec playwright install`
  - [ ] Sample E2E test passes
- [ ] **Git hooks** (optional)
  - [ ] Husky installed for pre-commit hooks
  - [ ] Pre-commit: runs `lint` and `type-check`
  - [ ] Pre-push: runs `test`

**Package.json Scripts:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:watch": "vitest watch",
    "test:e2e": "playwright test",
    "prisma:studio": "prisma studio",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:seed": "tsx prisma/seed.ts"
  }
}
```

---

### US-0.7: Create Environment Configuration Files
**As a** developer
**I want to** create comprehensive environment variable documentation
**So that** all team members can configure their local environment correctly

**Acceptance Criteria:**
- [ ] `.env.example` file created with all required variables (placeholder values)
- [ ] `.env.local` file created (gitignored) with actual development values
- [ ] README.md includes environment setup section
- [ ] All environment variables documented with:
  - [ ] Variable name
  - [ ] Purpose/description
  - [ ] Example value or generation instructions
  - [ ] Required vs. optional indicator
- [ ] Validation script created: `scripts/validate-env.ts`
- [ ] Validation runs on `pnpm dev` startup
- [ ] Missing variables error clearly with helpful messages

**Required Environment Variables:**
```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/household_bills"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<run: openssl rand -base64 32>"

# LINE LIFF & Login
NEXT_PUBLIC_LINE_LIFF_ID="<from LINE Developers Console>"
LINE_CLIENT_ID="<from LINE Developers Console>"
LINE_CLIENT_SECRET="<from LINE Developers Console>"

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN="<from LINE Developers Console>"
LINE_CHANNEL_SECRET="<from LINE Developers Console>"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# Google Cloud Document AI
GCP_PROJECT_ID="<your-gcp-project-id>"
GCP_LOCATION="us"
GCP_PROCESSOR_ID="<your-processor-id>"
GOOGLE_APPLICATION_CREDENTIALS="./gcp-credentials.json"

# File Uploads
UPLOAD_DIR="./public/uploads"
NEXT_PUBLIC_UPLOAD_URL="/uploads"

# Development Flags (optional)
NEXT_PUBLIC_ENABLE_OCR_DEBUG="true"
NEXT_PUBLIC_DEMO_MODE="true"
```

---

### US-0.8: Verify Complete Setup
**As a** developer
**I want to** run a comprehensive verification checklist
**So that** I know the environment is fully functional before feature development

**Acceptance Criteria:**
- [ ] **Next.js dev server starts successfully**
  - [ ] `pnpm dev` runs without errors
  - [ ] Accessible at `http://localhost:3000`
  - [ ] No TypeScript errors in console
- [ ] **Database connection verified**
  - [ ] `pnpm prisma studio` opens database viewer
  - [ ] All tables visible (users, bills, tasks, notifications)
  - [ ] Can create/read sample records
- [ ] **Redis connection verified**
  - [ ] `redis-cli ping` returns PONG
  - [ ] Redis accessible from Node.js (test connection script)
- [ ] **Authentication flow works**
  - [ ] Login page renders
  - [ ] LINE OAuth redirect works (sandbox mode)
  - [ ] Session created and persisted
  - [ ] Protected routes require authentication
- [ ] **External services accessible**
  - [ ] Document AI test call succeeds (sample receipt)
  - [ ] LINE Messaging API test message sends
- [ ] **Tests pass**
  - [ ] `pnpm test` - Unit tests pass
  - [ ] `pnpm test:e2e` - E2E tests pass (if any setup tests created)
- [ ] **Build succeeds**
  - [ ] `pnpm build` completes without errors
  - [ ] Production build size reasonable (<500KB)
- [ ] **Documentation complete**
  - [ ] README.md has complete setup instructions
  - [ ] Architecture document accessible
  - [ ] Epic files created for all features

**Verification Script:**
Create `scripts/verify-setup.ts`:
```typescript
// Checks all services and configurations
// Exits with error code if any check fails
```

---

## Technical Implementation Notes

**Tech Stack Summary:**
- **Frontend:** Next.js 14.2+, TypeScript 5.3+, Tailwind CSS 3.4+, shadcn/ui
- **Backend:** Next.js API Routes, Prisma 5.9+, PostgreSQL 15+
- **Auth:** NextAuth.js 5.0+ with LINE OAuth
- **Queue:** Bull 4.12+ with Redis 7.2+
- **OCR:** Google Cloud Document AI
- **Notifications:** LINE Messaging API v2
- **Testing:** Vitest, Playwright
- **Package Manager:** pnpm 8.15+

**Project Structure (Initial):**
```
household-bills/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       └── page.tsx
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── uploads/
│       ├── receipts/
│       └── proofs/
├── scripts/
│   └── verify-setup.ts
├── .env.example
├── .env.local (gitignored)
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Dependencies

**Upstream Dependencies:**
- None (this is the foundation)

**Downstream Dependencies:**
- **All other epics** depend on this initialization being complete

**External Services Required:**
- LINE Developers Console account
- Google Cloud Platform account with billing enabled
- Local development machine (macOS, Linux, or WSL)

---

## Definition of Done

- [ ] All 8 user stories completed with acceptance criteria met
- [ ] Next.js project initialized with TypeScript
- [ ] PostgreSQL and Redis running locally
- [ ] Prisma schema created and database initialized
- [ ] NextAuth configured with LINE OAuth
- [ ] Google Cloud Document AI set up
- [ ] LINE Messaging API configured
- [ ] Development tooling (ESLint, Prettier, tests) configured
- [ ] Environment variables documented and validated
- [ ] Verification script passes all checks
- [ ] `pnpm dev` starts server without errors
- [ ] `pnpm build` succeeds
- [ ] README.md has complete setup instructions
- [ ] All team members can replicate setup

---

## Success Metrics

**Target Metrics:**
- Setup time for new developer: <30 minutes
- `pnpm dev` startup time: <5 seconds
- Build time: <30 seconds (initial build)
- Zero errors in dev console on startup
- 100% of verification checks pass

---

## Risk Assessment

**Primary Risk:** Missing LINE or GCP credentials block development
**Mitigation:**
- Document credential setup early
- Provide sandbox/mock modes for offline development
- Create seed data for demo mode

**Secondary Risk:** Version mismatches in dependencies
**Mitigation:**
- Lock dependency versions in package.json
- Use pnpm for strict dependency resolution
- Document Node.js version requirement (18+)

**Tertiary Risk:** Service installation fails on different OS
**Mitigation:**
- Provide installation instructions for macOS, Linux, Windows (WSL)
- Docker alternative documented (though not recommended per architecture)
- Team members help troubleshoot platform-specific issues

---

## Setup Checklist for Team

**Before Starting (Required):**
- [ ] Node.js 18+ installed
- [ ] pnpm installed
- [ ] PostgreSQL 15+ installed and running
- [ ] Redis 7+ installed and running
- [ ] LINE Developers Console account created
- [ ] Google Cloud Platform account with billing enabled
- [ ] Git configured

**Initial Setup Steps:**
1. Clone repository
2. Run `pnpm install`
3. Copy `.env.example` to `.env.local`
4. Fill in environment variables (LINE, GCP credentials)
5. Run `pnpm prisma generate`
6. Run `pnpm prisma db push`
7. Run `pnpm dev`
8. Verify `http://localhost:3000` loads

**Verification:**
- [ ] Dev server runs without errors
- [ ] Prisma Studio opens: `pnpm prisma:studio`
- [ ] Tests pass: `pnpm test`
- [ ] Build succeeds: `pnpm build`

---

## Notes

- **Critical blocker:** This epic MUST be completed before any other epic
- **Estimated time:** 2-4 hours (experienced developer), 4-8 hours (first-time setup)
- **Team coordination:** Designate one person to complete initial setup, others replicate
- **Documentation is key:** README.md should enable any developer to set up independently
- **Seed data:** Create `prisma/seed.ts` with sample users, bills, tasks for testing
- **Environment validation:** Automate checking for missing env vars to prevent runtime errors
- **Future improvements:**
  - Docker Compose alternative (not recommended but available)
  - One-click setup script
  - Cloud development environment (CodeSandbox, Gitpod)
