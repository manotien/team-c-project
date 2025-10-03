# Development Workflow

## Local Development Setup

### Prerequisites

```bash
# Install Node.js 18+ and pnpm
brew install node pnpm  # macOS
# or
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Verify versions
node --version  # Should be 18+
pnpm --version  # Should be 8+
```

### Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd household-bills

# Install dependencies
pnpm install

# Install and start PostgreSQL and Redis (see Local Service Installation section above)
# Make sure both services are running

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your values:
# - DATABASE_URL=postgresql://postgres:postgres@localhost:5432/household_bills
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
# - LINE_CLIENT_ID, LINE_CLIENT_SECRET, LINE_CHANNEL_ACCESS_TOKEN
# - REDIS_HOST=localhost, REDIS_PORT=6379
# - GCP_PROJECT_ID, GCP_PROCESSOR_ID (Google Cloud Document AI)

# Setup database
pnpm prisma generate
pnpm prisma db push
pnpm prisma db seed  # Load demo data

# Start development server
pnpm dev
```

### Development Commands

```bash
# Start Next.js dev server
pnpm dev

# Start queue workers (in separate terminal)
pnpm workers

# Or start everything together (using concurrently)
pnpm dev:all

# Run tests
pnpm test              # Unit + integration tests
pnpm test:e2e          # E2E tests with Playwright
pnpm test:watch        # Watch mode

# Linting and formatting
pnpm lint              # ESLint
pnpm format            # Prettier
pnpm type-check        # TypeScript

# Database
pnpm prisma studio     # Visual database editor
pnpm prisma migrate dev # Create new migration
pnpm prisma db seed    # Re-seed database

# Queue management
pnpm queue:ui          # Open Bull Board (queue monitoring UI)
pnpm queue:clean       # Clean completed/failed jobs

# Local services management
brew services start postgresql@15  # Start PostgreSQL (macOS)
brew services start redis          # Start Redis (macOS)
brew services stop postgresql@15   # Stop PostgreSQL (macOS)
brew services stop redis           # Stop Redis (macOS)

# Build
pnpm build             # Production build
pnpm start             # Production server (local test)
```

## Environment Configuration

### Required Environment Variables

```bash
# Database (Local PostgreSQL via Docker)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/household_bills"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl"

# LINE LIFF
NEXT_PUBLIC_LINE_LIFF_ID="1234567890-abcdefgh"
LINE_CLIENT_ID="1234567890"
LINE_CLIENT_SECRET="line-client-secret"

# LINE Messaging API (Official Account)
LINE_CHANNEL_ACCESS_TOKEN="your-line-channel-access-token"
LINE_CHANNEL_SECRET="your-line-channel-secret"

# LINE Notify (Fallback)
LINE_NOTIFY_TOKEN="your-line-notify-token"

# Redis (Bull Queue)
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# Google Cloud Document AI
GCP_PROJECT_ID="your-gcp-project-id"
GCP_LOCATION="us"  # or "eu", "asia-northeast1" for Thailand
GCP_PROCESSOR_ID="your-processor-id"
GOOGLE_APPLICATION_CREDENTIALS="./gcp-credentials.json"

# File Upload
UPLOAD_DIR="./public/uploads"
NEXT_PUBLIC_UPLOAD_URL="/uploads"

# Optional: Development flags
NEXT_PUBLIC_ENABLE_OCR_DEBUG="true"
NEXT_PUBLIC_DEMO_MODE="true"
```

### Local Service Installation

**PostgreSQL Installation:**

```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb household_bills

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb household_bills

# Verify installation
psql --version
```

**Redis Installation:**

```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server

# Verify installation
redis-cli ping  # Should return "PONG"
```

---
