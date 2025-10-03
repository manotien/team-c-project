# Project Structure

```plaintext
household-bills/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI/CD
├── app/                              # Next.js 14+ App Router
│   ├── (auth)/                       # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/                  # Main app route group
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Main dashboard
│   │   ├── bills/
│   │   │   ├── page.tsx              # Bills list
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx          # Bill detail
│   │   │   └── new/
│   │   │       └── page.tsx          # Add new bill
│   │   ├── tasks/
│   │   │   ├── page.tsx              # Tasks list
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Task detail
│   │   ├── notifications/
│   │   │   └── page.tsx              # Notification center
│   │   └── layout.tsx                # Shared layout with nav
│   ├── api/                          # API Routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts          # NextAuth config
│   │   ├── bills/
│   │   │   ├── route.ts              # GET, POST /api/bills
│   │   │   └── [id]/
│   │   │       └── route.ts          # GET, PATCH, DELETE /api/bills/:id
│   │   ├── tasks/
│   │   │   ├── route.ts              # GET /api/tasks
│   │   │   ├── my/
│   │   │   │   └── route.ts          # GET /api/tasks/my
│   │   │   └── [id]/
│   │   │       └── route.ts          # GET, PATCH /api/tasks/:id
│   │   ├── users/
│   │   │   ├── route.ts              # GET /api/users
│   │   │   └── [id]/
│   │   │       └── route.ts          # GET, PATCH /api/users/:id
│   │   ├── notifications/
│   │   │   ├── route.ts              # GET /api/notifications
│   │   │   └── [id]/
│   │   │       └── read/
│   │   │           └── route.ts      # PATCH /api/notifications/:id/read
│   │   ├── summaries/
│   │   │   └── monthly/
│   │   │       └── route.ts          # GET /api/summaries/monthly
│   │   └── upload/
│   │       └── route.ts              # POST /api/upload
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Landing page
│   └── globals.css                   # Global styles
├── components/                       # React components
│   ├── ui/                           # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   └── ...
│   ├── bills/
│   │   ├── BillCard.tsx
│   │   ├── BillForm.tsx
│   │   ├── OCRScanner.tsx            # Tesseract.js integration
│   │   └── BillTypeIcon.tsx          # ⚡💧🌐🚗🏠 icons
│   ├── tasks/
│   │   ├── TaskCard.tsx
│   │   ├── TaskList.tsx
│   │   ├── TaskStatusBadge.tsx
│   │   └── AssigneeSelect.tsx
│   ├── notifications/
│   │   ├── NotificationBell.tsx
│   │   └── NotificationList.tsx
│   ├── summaries/
│   │   ├── MonthlySummaryCard.tsx
│   │   └── MemberSummaryCard.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Navigation.tsx
│       └── Footer.tsx
├── lib/                              # Shared libraries
│   ├── prisma.ts                     # Prisma client singleton
│   ├── auth.ts                       # NextAuth configuration
│   ├── types/                        # TypeScript types
│   │   ├── index.ts                  # Re-exports
│   │   ├── api.ts                    # API types
│   │   └── models.ts                 # Extended Prisma types
│   ├── queues/                       # Bull queue configuration
│   │   ├── config.ts                 # Queue instances
│   │   ├── types.ts                  # Job type definitions
│   │   └── workers/                  # Queue workers
│   │       ├── billNotifications.worker.ts
│   │       ├── recurringBills.worker.ts
│   │       └── overdueChecks.worker.ts
│   ├── services/                     # Business logic
│   │   ├── BillService.ts
│   │   ├── TaskService.ts
│   │   ├── NotificationService.ts
│   │   ├── QueueService.ts           # Queue job scheduling
│   │   └── UserService.ts
│   ├── repositories/                 # Data access layer
│   │   ├── BillRepository.ts
│   │   ├── TaskRepository.ts
│   │   └── UserRepository.ts
│   ├── utils/                        # Utilities
│   │   ├── api-response.ts           # Standard response helpers
│   │   ├── date.ts                   # Date formatting
│   │   ├── currency.ts               # Currency formatting
│   │   └── ocr.ts                    # OCR processing helpers
│   ├── validations/                  # Zod schemas
│   │   ├── bill.ts
│   │   ├── task.ts
│   │   └── user.ts
│   └── integrations/                 # External services
│       ├── line-messaging.ts         # LINE Messaging API (Official Account)
│       ├── line-notify.ts            # LINE Notify API (fallback)
│       ├── line-liff.ts              # LINE LIFF SDK wrapper
│       └── file-storage.ts           # Local file upload helpers
├── prisma/
│   ├── schema.prisma                 # Prisma schema
│   ├── migrations/                   # Database migrations
│   └── seed.ts                       # Seed data for demo
├── scripts/                          # Utility scripts
│   ├── start-workers.ts              # Start all queue workers
│   └── test-notification.ts         # Test LINE notification
├── public/
│   ├── uploads/                      # Uploaded files
│   │   ├── receipts/                 # Receipt images
│   │   └── proofs/                   # Payment slip images
│   ├── icons/                        # Bill type icons
│   └── images/                       # Static images
├── tests/
│   ├── unit/                         # Unit tests
│   │   ├── services/
│   │   └── utils/
│   ├── integration/                  # Integration tests
│   │   └── api/
│   └── e2e/                          # E2E tests (Playwright)
│       ├── bill-upload.spec.ts
│       ├── task-payment.spec.ts
│       └── notifications.spec.ts
├── .env.local                        # Local environment variables
├── .env.example                      # Environment template
├── .eslintrc.json                    # ESLint config
├── .prettierrc                       # Prettier config
├── next.config.js                    # Next.js config
├── tailwind.config.ts                # Tailwind config
├── tsconfig.json                     # TypeScript config
├── package.json                      # Dependencies
├── pnpm-lock.yaml                    # Lock file
├── gcp-credentials.json              # Google Cloud service account key (gitignored)
└── README.md                         # Project documentation
```

---
