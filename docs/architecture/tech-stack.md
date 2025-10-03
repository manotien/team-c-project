# Tech Stack

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.3+ | Type-safe development | Prevents bugs, excellent IDE support, shared types across stack |
| Frontend Framework | Next.js | 14.2+ | React framework with SSR | App Router, Server Components, built-in API routes, fast dev server |
| UI Component Library | shadcn/ui | Latest | Accessible component primitives | Built on Radix UI, Tailwind-based, copy-paste (no npm bloat), accessible |
| State Management | Zustand | 4.5+ | Client state management | Minimal boilerplate, React hooks API, perfect for hackathon speed |
| Form Handling | React Hook Form | 7.50+ | Form state and validation | Minimal re-renders, TypeScript support, integrates with Zod |
| Validation | Zod | 3.22+ | Schema validation | Type inference, runtime validation, shared client/server schemas |
| Backend Language | TypeScript | 5.3+ | Unified language | Share types/utilities with frontend, single language for team |
| Backend Framework | Next.js Route Handlers | 14.2+ | API endpoints | Integrated with frontend, Web standard Request/Response, zero config |
| API Style | REST (Route Handlers) | - | HTTP JSON API | Simple, standard, works with LINE webhooks, easy to debug |
| Database | PostgreSQL | 15+ | Relational database | ACID guarantees, complex queries, perfect for bills/tasks relationships |
| ORM | Prisma | 5.9+ | Type-safe database client | Auto-generated types, migrations, excellent DX, query optimization |
| File Storage | Local Filesystem | - | Image storage | Receipt images, payment slips stored in public/uploads/ directory |
| Job Queue | Bull | 4.12+ | Background job processing | Scheduled notifications, retry logic, cron jobs for bill reminders |
| Queue Storage | Redis | 7.2+ | Job queue backend | In-memory data store for Bull queues, fast and reliable |
| Authentication | NextAuth.js | 5.0+ | Auth framework | LINE OAuth provider, session management, middleware integration |
| LINE Integration | LINE LIFF SDK | 2.23+ | LINE in-app browser | Auth, profile access, seamless LINE experience |
| LINE Notifications | LINE Messaging API | v2 | Automated notifications | LINE Official Account messages with rich content support |
| Notifications (Fallback) | LINE Notify API | v2 | Simple notifications | Fallback for LINE Notify personal notifications |
| Email (Optional) | Mock/Console | - | Email fallback (demo) | Log to console for demo, no actual email sending needed |
| OCR | Google Cloud Document AI | v1 | Cloud-based OCR | High accuracy receipt parsing, structured data extraction, 1000 pages/month free |
| Google Cloud SDK | @google-cloud/documentai | Latest | Document AI client | Official Node.js client for Document AI API |
| Frontend Testing | Vitest + Testing Library | Latest | Component tests | Fast, Jest-compatible, React Testing Library for UI |
| Backend Testing | Vitest | Latest | API tests | Same runner as frontend, shared config, fast execution |
| E2E Testing | Playwright | Latest | Critical flow tests | Reliable, fast, multi-browser, mobile viewport testing |
| CSS Framework | Tailwind CSS | 3.4+ | Utility-first CSS | Rapid development, small production bundle, mobile-first |
| Build Tool | Next.js | 14.2+ | Zero-config builds | Automatic optimization, code splitting, tree shaking |
| Package Manager | pnpm | 8.15+ | Fast package management | Faster than npm/yarn, disk space efficient, strict dependencies |
| Linting | ESLint + Prettier | Latest | Code quality | Next.js config, TypeScript rules, auto-formatting |
| Type Checking | TypeScript Compiler | 5.3+ | Static analysis | Strict mode, catch errors before runtime |

---
