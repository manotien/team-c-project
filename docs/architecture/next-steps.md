# Next Steps

This architecture document provides the foundation for rapid hackathon development. Key implementation priorities:

## Phase 1: 4-Hour MVP (Local Demo)
1. Initialize Next.js project with TypeScript + Tailwind
2. Install local PostgreSQL + Redis + Prisma (simplified single-user schema)
3. Implement bill upload flow with Google Cloud Document AI OCR
4. Create automatic task creation (no assignment needed)
5. Build basic dashboard (upcoming, overdue tasks)

## Phase 2: 48-Hour Full MVP (Local Demo)
6. Setup Bull queues + Redis for background jobs
7. Integrate LINE LIFF authentication
8. Implement LINE Messaging API (Official Account) for notifications
9. Create queue workers for scheduled bill reminders (3 days, 1 day before due)
10. Add recurring bill settings UI
11. Build monthly summary views with member cards
12. Setup Bull Board for queue monitoring
13. Polish UI/UX for local demo presentation

## Quick Start Commands

```bash
# 1. Install and start local services (PostgreSQL + Redis)
brew install postgresql@15 redis  # macOS
brew services start postgresql@15
brew services start redis

# Create database
createdb household_bills

# 2. Install dependencies
pnpm install

# 3. Setup database
pnpm prisma generate
pnpm prisma db push
pnpm prisma db seed

# 4. Start dev server + queue workers
pnpm dev:all

# 5. Open applications
# - Main app: http://localhost:3000
# - Bull Board (queue monitoring): http://localhost:3000/admin/queues
# - Prisma Studio (database): pnpm prisma studio
```

**For detailed implementation guidance, refer to:**
- **Bull Queue setup:** Section "Background Job System"
- **Prisma schema:** Section "Database Schema" → `/prisma/schema.prisma`
- **API routes:** Section "API Specification"
- **Local services setup:** Section "Local Service Installation" (PostgreSQL + Redis)
- **Queue workers:** `lib/queues/workers/` directory
- **LINE Messaging API:** `lib/integrations/line-messaging.ts`
- **Google Cloud Document AI:** Section "Google Cloud Document AI Integration"
- **Database queries:** Use Prisma Client in `lib/services`
- **UI components:** shadcn/ui + custom components in `components/`

**Key Features with Bull Queue:**
- ✅ Scheduled notifications (3 days before, 1 day before due date)
- ✅ Automatic retry on failure (3 attempts with exponential backoff)
- ✅ Recurring bill creation (daily cron job)
- ✅ Overdue task checking (daily at 6 AM)
- ✅ Queue monitoring via Bull Board UI

**Ready to start building locally! 🚀**
