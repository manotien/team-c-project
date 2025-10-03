# Household Bills Management System

A Next.js application for managing household bills, receipts, and shared expenses with OCR receipt scanning.

## Prerequisites

- Node.js 18+
- pnpm 8.15+
- PostgreSQL 16+
- Redis 7.2+

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd household-bills
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env.local`
   - Update the variables with your configuration

4. **Set up the database**
   ```bash
   pnpm prisma migrate dev
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open the application**
   - Visit [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

See `.env.example` for required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret key
- `NEXTAUTH_URL` - Application URL
- `REDIS_URL` - Redis connection string
- `GCP_PROJECT_ID` - Google Cloud Project ID
- `GCP_PROCESSOR_ID` - Document AI Processor ID

## Development Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier
pnpm type-check       # Run TypeScript type checking

# Testing
pnpm test             # Run unit tests
pnpm test:watch       # Run tests in watch mode
pnpm test:e2e         # Run E2E tests
```

## Project Structure

```
household-bills/
├── app/                    # Next.js 14+ App Router
│   ├── (auth)/            # Auth route group (login, register)
│   ├── (dashboard)/       # Main app route group
│   └── api/               # API Routes
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Shared utilities and types
├── prisma/               # Database schema and migrations
├── public/               # Static assets & uploads
│   └── uploads/         # Receipt & payment slip images
├── scripts/             # Utility scripts
└── tests/              # Test files
    ├── unit/           # Unit tests
    ├── integration/    # Integration tests
    └── e2e/            # E2E tests
```

## Tech Stack

- **Framework:** Next.js 15.5.4 with App Router
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS 4+
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **Queue:** Bull with Redis
- **OCR:** Google Cloud Document AI
- **Form Handling:** React Hook Form with Zod validation
- **Testing:** Vitest + Playwright
