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

This project requires several environment variables to function properly.

### Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the required values in `.env.local`:
   - **Database:** Should work with default PostgreSQL settings
   - **NextAuth Secret:** Generate with `openssl rand -base64 32`
   - **LINE Credentials:** Get from [LINE Developers Console](https://developers.line.biz/console/)
   - **Google Cloud:** Get from [Google Cloud Console](https://console.cloud.google.com/)

3. Download Google Cloud credentials:
   - Create service account in GCP
   - Download JSON key as `gcp-credentials.json`
   - Place in project root (parent directory)

### Required Variables

| Variable | Description | How to Get |
|----------|-------------|------------|
| `DATABASE_URL` | PostgreSQL connection string | Use local: `postgresql://postgres:postgres@localhost:5432/household_bills` |
| `NEXTAUTH_SECRET` | NextAuth encryption secret | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Application URL | Use `http://localhost:3000` for development |
| `LINE_CLIENT_ID` | LINE Login channel ID | LINE Developers Console → Channel Basic Settings |
| `LINE_CLIENT_SECRET` | LINE Login channel secret | LINE Developers Console → Channel Basic Settings |
| `NEXT_PUBLIC_LINE_LIFF_ID` | LIFF app ID | LINE Developers Console → LIFF tab |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API token | LINE Developers Console → Messaging API tab |
| `LINE_CHANNEL_SECRET` | LINE Messaging channel secret | LINE Developers Console → Channel Basic Settings |
| `GCP_PROJECT_ID` | Google Cloud project ID | Google Cloud Console → Project Info |
| `GCP_PROCESSOR_ID` | Document AI processor ID | Google Cloud Console → Document AI → Processors |
| `GCP_LOCATION` | Document AI processor location | Use `us` or `asia-northeast1` |
| `REDIS_HOST` | Redis server host | Use `localhost` for development |
| `REDIS_PORT` | Redis server port | Use `6379` for development |

See `.env.example` for complete list and descriptions.

### Validation

Environment variables are validated automatically when you run:

```bash
pnpm dev
```

If any required variables are missing, you'll see a helpful error message.

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
