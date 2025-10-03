# Household Tasks & Bills Fullstack Architecture Document

**Project Name:** Household Tasks & Bills — Receipt Scanner + LINE Notifications
**Version:** 3.0
**Date:** 2025-10-03
**Author:** Winston (Architect)

---

## Introduction

This document outlines the complete fullstack architecture for **Household Tasks & Bills**, a streamlined single-user application for capturing bills/receipts, converting them into tasks, and receiving notifications via LINE. This architecture is optimized for rapid hackathon development (4hr demo, 48hr MVP) while maintaining a clean, scalable foundation.

### Starter Template or Existing Project

**Selected Approach:** Greenfield Next.js 14+ App Router project

**Key Decisions:**
- **Next.js 14+** with App Router for unified frontend/backend in a single codebase
- **Prisma ORM** for type-safe database access with auto-generated TypeScript types
- **PostgreSQL** (local) for relational data (users, bills, tasks with clear relationships)
- **Tailwind CSS** for rapid UI development
- **LINE LIFF SDK** for LINE integration (authentication + in-app browser)
- **Local development only** - no deployment needed for hackathon demo

**Rationale:**
- **Simplified data model:** Single-user architecture, no groups/members/assignments
- **Monolithic Next.js:** Faster than separate frontend/backend for hackathon timeline
- **PostgreSQL + Prisma:** Type safety prevents bugs, migrations are straightforward
- **LINE LIFF:** Native LINE integration for Thai users, seamless auth flow
- **Local demo:** Runs on localhost, no deployment overhead for hackathon
- **Google Cloud Document AI:** High accuracy OCR (95%+) for Thai receipts

### Architecture Principles for Hackathon MVP

1. **Simplicity First:** Single-user model, automatic task creation, no assignment workflow
2. **Type Safety:** Shared TypeScript types between frontend/backend prevent runtime errors
3. **Rapid Iteration:** Hot reload, automatic API routes, zero config
4. **Mobile-First:** Optimized for LINE LIFF browser on mobile devices
5. **Cloud OCR:** Google Document AI for reliable receipt parsing

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-10-03 | 3.0 | Single-user architecture - removed assignments, members, groups. Updated to Google Document AI. Removed Docker setup. | Winston (Architect) |
| 2025-10-03 | 2.0 | Simplified architecture - removed groups and escalation | Winston (Architect) |
| 2025-10-03 | 1.0 | Initial architecture document | Winston (Architect) |

---

## High Level Architecture

### Technical Summary

This application follows a **modern fullstack architecture** using Next.js 14+ with the App Router pattern, providing server-side rendering, React Server Components, and API routes in a unified local development environment. The frontend uses React Server Components by default for optimal performance, with client components for interactive features like camera access and file uploads. The backend uses Next.js Route Handlers with Prisma ORM for type-safe PostgreSQL operations. Key integration points include LINE LIFF SDK for authentication and in-app browser experience, LINE Messaging API for push notifications, Google Cloud Document AI for high-accuracy receipt OCR, Bull queue with Redis for scheduled notifications, and local file storage for images. The simplified data model features a **single-user architecture** where each user manages only their own bills and tasks—when a user creates a bill, a task is automatically created for them. No assignments, no members, no groups. This architecture achieves rapid hackathon development with everything running locally on localhost.

### Platform and Infrastructure Choice

**Platform:** Local Development Environment

**Key Services:**
- **Hosting:** Next.js Dev Server (localhost:3000)
- **Database:** PostgreSQL (installed locally via Homebrew/apt-get)
- **Queue Storage:** Redis (installed locally via Homebrew/apt-get)
- **File Storage:** Local filesystem (`public/uploads` directory)
- **Authentication:** LINE LIFF SDK + NextAuth.js (session cookies)
- **Notifications:** LINE Messaging API (Official Account)
- **OCR:** Google Cloud Document AI (cloud-based, high accuracy)

**Why Local Development?**
- Zero deployment complexity for hackathon demo
- Full control over data and debugging
- Google Cloud free tier for Document AI (1000 pages/month)
- Direct installation for faster setup (no Docker overhead)
- Fast iteration with hot reload

### Repository Structure

**Structure:** Single Next.js monolithic application (monorepo not needed for this scale)

**Package Organization:**
```
household-bills/
├── app/                    # Next.js 14+ App Router
├── lib/                    # Shared utilities and types
├── prisma/                 # Database schema
├── public/                 # Static assets & uploads
│   └── uploads/           # Receipt & payment slip images
├── components/             # Shared React components
└── gcp-credentials.json    # Google Cloud service account key (gitignored)
```

**Rationale:**
- Hackathon scale doesn't require Turborepo/Nx complexity
- Next.js built-in features handle code sharing effectively
- Local-only = no deployment configuration needed
- Simpler mental model for team collaboration

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "User Access"
        LINE[LINE App with LIFF]
        WEB[Web Browser]
    end

    subgraph "localhost:3000 - Next.js Dev Server"
        subgraph "Next.js Application"
            RSC[React Server Components<br/>SSR Pages]
            CLIENT[Client Components<br/>Camera + File Upload]
            API[API Routes<br/>Route Handlers]
        end

        PRISMA[Prisma Client<br/>Type-safe ORM]
        FS[Local Filesystem<br/>public/uploads/]
        REDIS[Redis Client<br/>Bull Queue]
    end

    subgraph "Local Services"
        DB[(PostgreSQL 15+<br/>localhost:5432)]
        REDIS_SERVER[(Redis 7+<br/>localhost:6379)]
    end

    subgraph "Google Cloud"
        DOC_AI[Document AI API<br/>Receipt Parser]
    end

    subgraph "LINE Platform"
        LIFF_API[LINE LIFF API<br/>Auth + Profile]
        LINE_MSG[LINE Messaging API<br/>OA Notifications]
    end

    LINE --> RSC
    WEB --> RSC
    RSC --> CLIENT

    RSC --> API
    CLIENT --> API

    API --> PRISMA
    API --> REDIS
    API --> DOC_AI
    PRISMA --> DB
    REDIS --> REDIS_SERVER
    API --> FS
    API --> LIFF_API
    API --> LINE_MSG

    style DB fill:#336791
    style REDIS_SERVER fill:#DC382D
    style DOC_AI fill:#4285F4
    style LINE_MSG fill:#00B900
    style FS fill:#FFA500
```

### Architectural Patterns

- **Server Components First:** Use React Server Components by default, client components only for interactivity (camera, OCR, notifications) - _Rationale:_ Reduces JavaScript bundle size, faster page loads, better mobile performance

- **API Route Handler Pattern:** Next.js 14+ Route Handlers with consistent error handling and response format - _Rationale:_ Type-safe endpoints, automatic serialization, integrated with Next.js middleware

- **Repository Pattern:** Data access abstraction layer (`lib/repositories`) wrapping Prisma - _Rationale:_ Business logic separated from ORM details, easier testing, potential database migration flexibility

- **Service Layer Pattern:** Business logic in `lib/services` (BillService, TaskService, NotificationService) - _Rationale:_ Reusable across API routes and Server Actions, testable in isolation

- **Optimistic UI Updates:** Client-side state updates before server confirmation for task status changes - _Rationale:_ Better UX on mobile networks, perceived performance improvement

- **Progressive Enhancement:** Core functionality works with JavaScript disabled, enhanced with client features - _Rationale:_ Reliability on unstable connections, better accessibility

- **Type-Driven Development:** Prisma schema as single source of truth for data types - _Rationale:_ Auto-generated TypeScript types prevent type mismatches, fewer runtime errors

- **Background Job Processing:** Bull queue for scheduled notifications and recurring tasks - _Rationale:_ Decouples notification delivery from API requests, automatic retries, cron-based scheduling for bill reminders

---

## Background Job System

### Bull Queue Architecture

**Purpose:** Handle scheduled notifications for bill due dates and recurring reminders using Bull queue with Redis.

**Key Queues:**

1. **`billNotifications`** - Send notifications before bill due dates
2. **`recurringBills`** - Create recurring bills based on schedule
3. **`overdueChecks`** - Check and update overdue tasks daily

**Queue Configuration:**

```typescript
// lib/queues/config.ts
import Queue from 'bull';

export const billNotificationsQueue = new Queue('billNotifications', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200,     // Keep last 200 failed jobs
  },
});

export const recurringBillsQueue = new Queue('recurringBills', {
  redis: { /* same config */ },
});

export const overdueChecksQueue = new Queue('overdueChecks', {
  redis: { /* same config */ },
});
```

**Job Types:**

```typescript
// lib/queues/types.ts
export interface BillNotificationJob {
  taskId: string;
  userId: string;
  billId: string;
  dueDate: Date;
  notificationType: 'due_soon' | 'due_today' | 'overdue';
}

export interface RecurringBillJob {
  billId: string;
  recurrenceSettings: RecurrenceSettings;
}

export interface OverdueCheckJob {
  // No data needed, checks all tasks
}
```

**Cron Schedules:**

- **Bill Notifications:** Process every hour to check upcoming due dates
- **Recurring Bills:** Process daily at midnight to create new bills
- **Overdue Checks:** Process daily at 6 AM to mark overdue tasks

### Notification Workflow

```mermaid
sequenceDiagram
    participant Cron as Bull Cron Job
    participant Queue as Bull Queue
    participant Worker as Queue Worker
    participant DB as PostgreSQL
    participant LINE as LINE Messaging API
    participant User

    Note over Cron: Every hour
    Cron->>Queue: Add billNotifications job
    Queue->>Worker: Pick up job
    Worker->>DB: Query tasks WHERE dueDate BETWEEN now and +24hrs
    DB-->>Worker: Return upcoming tasks

    loop For each task
        Worker->>DB: Get user LINE ID
        Worker->>LINE: Send notification message
        LINE-->>User: 📌 Bill due in 24 hours: ฿1,500 MEA
        LINE-->>Worker: Delivery status
        Worker->>DB: Log notification sent
    end

    Worker->>Queue: Job complete
```

### Integration Points

**When Bill is Created:**
```typescript
// lib/services/BillService.ts
async createBill(data: CreateBillInput) {
  const bill = await prisma.bill.create({ data });
  const task = await prisma.task.create({
    data: { billId: bill.id, /* ... */ }
  });

  // Schedule notification jobs
  await scheduleNotifications(task);

  return { bill, task };
}

async function scheduleNotifications(task: Task) {
  const oneDayBefore = new Date(task.dueDate);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);

  const threeDaysBefore = new Date(task.dueDate);
  threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);

  // Add jobs with specific delays
  await billNotificationsQueue.add(
    { taskId: task.id, notificationType: 'due_soon' },
    { delay: threeDaysBefore.getTime() - Date.now() }
  );

  await billNotificationsQueue.add(
    { taskId: task.id, notificationType: 'due_today' },
    { delay: oneDayBefore.getTime() - Date.now() }
  );
}
```

**Worker Implementation:**
```typescript
// lib/queues/workers/billNotifications.worker.ts
import { billNotificationsQueue } from '../config';
import { sendLINEMessage } from '../../integrations/line-messaging';

billNotificationsQueue.process(async (job) => {
  const { taskId, notificationType } = job.data;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { bill: true, assignee: true },
  });

  if (!task || task.status === 'PAID') {
    return { skipped: true, reason: 'Task already paid' };
  }

  const message = buildNotificationMessage(task, notificationType);

  await sendLINEMessage(task.assignee.lineUserId, message);

  await prisma.notification.create({
    data: {
      userId: task.assigneeId,
      taskId: task.id,
      channel: 'LINE',
      status: 'SENT',
      message: message.text,
      sentAt: new Date(),
    },
  });

  return { sent: true, taskId };
});
```

---

## Google Cloud Document AI Integration

### OCR Processing with Document AI

**Purpose:** Extract structured data from receipt images using Google Cloud Document AI's pre-trained Receipt Parser.

**Key Features:**
- **High Accuracy:** 95%+ accuracy for Thai and English receipts
- **Structured Data:** Auto-extracts vendor, amount, date, line items
- **Multiple Formats:** Supports JPG, PNG, PDF
- **Free Tier:** 1,000 pages/month free

### Document AI Configuration

```typescript
// lib/integrations/document-ai.ts
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';

const client = new DocumentProcessorServiceClient({
  keyFilename: './gcp-credentials.json',
});

export interface ReceiptData {
  vendor: string;
  totalAmount: number;
  currency: string;
  date: Date;
  confidence: number;
  rawText: string;
}

export async function processReceipt(
  imageBuffer: Buffer
): Promise<ReceiptData> {
  const projectId = process.env.GCP_PROJECT_ID!;
  const location = process.env.GCP_LOCATION || 'us'; // or 'eu', 'asia-northeast1'
  const processorId = process.env.GCP_PROCESSOR_ID!;

  const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

  const request = {
    name,
    rawDocument: {
      content: imageBuffer.toString('base64'),
      mimeType: 'image/jpeg',
    },
  };

  const [result] = await client.processDocument(request);
  const { document } = result;

  // Extract structured entities
  const entities = document?.entities || [];

  const vendor = entities.find(e => e.type === 'supplier_name')?.mentionText || '';
  const amountEntity = entities.find(e => e.type === 'total_amount');
  const dateEntity = entities.find(e => e.type === 'receipt_date');

  return {
    vendor,
    totalAmount: parseFloat(amountEntity?.mentionText || '0'),
    currency: amountEntity?.normalizedValue?.moneyValue?.currencyCode || 'THB',
    date: dateEntity?.mentionText ? new Date(dateEntity.mentionText) : new Date(),
    confidence: amountEntity?.confidence || 0,
    rawText: document?.text || '',
  };
}
```

### API Endpoint for OCR

```typescript
// app/api/ocr/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { processReceipt } from '@/lib/integrations/document-ai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const receiptData = await processReceipt(buffer);

    return NextResponse.json({
      data: receiptData
    });
  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json(
      { error: 'Failed to process receipt' },
      { status: 500 }
    );
  }
}
```

### Frontend Integration

```typescript
// components/bills/ReceiptScanner.tsx
'use client';

import { useState } from 'react';

export function ReceiptScanner({ onScanComplete }: { onScanComplete: (data: any) => void }) {
  const [processing, setProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const { data } = await response.json();
      onScanComplete(data);
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        disabled={processing}
      />
      {processing && <p>Processing receipt...</p>}
    </div>
  );
}
```

---

## Tech Stack

### Technology Stack Table

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

## Data Models

### Simplified Architecture: Single User

**Key Decision:** The application uses a **single-user architecture** where:
- Each user manages their own bills and tasks independently
- No concept of groups, members, or assignments
- User creates bill → automatically creates task for themselves
- Monthly summaries show user's own payment totals

**Rationale:** This is the simplest possible data model for hackathon MVP, eliminating group management entirely and focusing on core bill tracking functionality.

---

### User

**Purpose:** Represents a user who manages their own bills and tasks.

**Key Attributes:**
- `id`: String (UUID) - Unique identifier
- `lineUserId`: String (unique) - LINE user ID from LINE login
- `name`: String - Display name from LINE profile
- `avatarUrl`: String (nullable) - Profile image URL from LINE
- `createdAt`: DateTime - Account creation timestamp
- `updatedAt`: DateTime - Last update timestamp

#### TypeScript Interface

```typescript
interface User {
  id: string;
  lineUserId: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Relationships

- One user can create many bills
- One user has many tasks (auto-created from bills)
- One user can receive many notifications

---

### Bill

**Purpose:** Represents a bill or receipt that has been scanned and processed.

**Key Attributes:**
- `id`: String (UUID) - Unique identifier
- `vendor`: String - Bill vendor/merchant name
- `amount`: Decimal - Bill amount
- `currency`: String - Currency code (default: 'THB')
- `dueDate`: DateTime - Payment due date
- `billType`: Enum - 'ELECTRIC' | 'WATER' | 'INTERNET' | 'CAR' | 'HOME' | 'OTHER'
- `rawImageUrl`: String - URL to original receipt image (Vercel Blob)
- `ocrData`: JSON - Raw OCR extraction data with confidence scores
- `recurrence`: JSON (nullable) - Recurrence settings (weekly, monthly, yearly)
- `createdById`: String - User who uploaded/created the bill
- `createdAt`: DateTime - Creation timestamp
- `updatedAt`: DateTime - Last update timestamp

#### TypeScript Interface

```typescript
type BillType = 'ELECTRIC' | 'WATER' | 'INTERNET' | 'CAR' | 'HOME' | 'OTHER';

interface Bill {
  id: string;
  vendor: string;
  amount: number;
  currency: string;
  dueDate: Date;
  billType: BillType;
  rawImageUrl: string;
  ocrData: OCRData;
  recurrence: RecurrenceSettings | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OCRData {
  extractedText: string;
  confidence: number;
  fields: {
    amount?: { value: string; confidence: number };
    dueDate?: { value: string; confidence: number };
    vendor?: { value: string; confidence: number };
  };
}

interface RecurrenceSettings {
  type: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;          // e.g., every 2 weeks
  dayOfWeek?: number;        // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number;       // 1-31 for monthly
  endDate?: Date;            // Optional end date
}
```

#### Relationships

- Belongs to one User
- Has one associated Task (auto-created)

---

### Task

**Purpose:** Represents a payment task automatically created from a bill.

**Key Attributes:**
- `id`: String (UUID) - Unique identifier
- `billId`: String - Foreign key to Bill (one-to-one)
- `userId`: String - Owner of this task
- `title`: String - Task title (auto-generated from bill: "Pay {vendor} bill")
- `status`: Enum - 'UNPAID' | 'PAID'
- `dueDate`: DateTime - Copied from bill due date
- `paidAt`: DateTime (nullable) - When marked as paid
- `paymentProofUrl`: String (nullable) - URL to payment slip image
- `createdAt`: DateTime - Creation timestamp
- `updatedAt`: DateTime - Last update timestamp

#### TypeScript Interface

```typescript
type TaskStatus = 'UNPAID' | 'PAID';

interface Task {
  id: string;
  billId: string;
  userId: string;
  title: string;
  status: TaskStatus;
  dueDate: Date;
  paidAt: Date | null;
  paymentProofUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Relationships

- Belongs to one Bill
- Belongs to one User
- Has many Notifications

---

### Notification

**Purpose:** Tracks LINE notification delivery for bill creation and due date reminders.

**Key Attributes:**
- `id`: String (UUID) - Unique identifier
- `userId`: String - Recipient user ID
- `taskId`: String - Related task ID
- `type`: Enum - 'BILL_CREATED' | 'DUE_SOON' | 'DUE_TODAY'
- `status`: Enum - 'PENDING' | 'SENT' | 'FAILED' | 'READ'
- `message`: String - Notification content
- `sentAt`: DateTime (nullable) - When sent via LINE
- `readAt`: DateTime (nullable) - When read in app
- `metadata`: JSON - LINE message ID and delivery details
- `createdAt`: DateTime - Creation timestamp

#### TypeScript Interface

```typescript
type NotificationType = 'BILL_CREATED' | 'DUE_SOON' | 'DUE_TODAY';
type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ';

interface Notification {
  id: string;
  userId: string;
  taskId: string;
  type: NotificationType;
  status: NotificationStatus;
  message: string;
  sentAt: Date | null;
  readAt: Date | null;
  metadata: {
    lineMessageId?: string;
    error?: string;
  };
  createdAt: Date;
}
```

#### Relationships

- Belongs to one User
- Belongs to one Task

---

## Database Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_user_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bills table
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendor VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'THB',
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  bill_type VARCHAR(50) NOT NULL CHECK (bill_type IN ('ELECTRIC', 'WATER', 'INTERNET', 'CAR', 'HOME', 'OTHER')),
  raw_image_url TEXT NOT NULL,
  ocr_data JSONB DEFAULT '{}',
  recurrence JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table (auto-created from bills)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('UNPAID', 'PAID')) DEFAULT 'UNPAID',
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(bill_id)  -- One task per bill
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('BILL_CREATED', 'DUE_SOON', 'DUE_TODAY')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'READ')) DEFAULT 'PENDING',
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_line_user_id ON users(line_user_id);
CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_bills_due_date ON bills(due_date);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_bill_id ON tasks(bill_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_task_id ON notifications(task_id);
CREATE INDEX idx_notifications_status ON notifications(status);

-- Composite indexes for common queries
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_status_due_date ON tasks(status, due_date);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(uuid())
  lineUserId  String   @unique @map("line_user_id")
  name        String
  avatarUrl   String?  @map("avatar_url")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relationships
  bills         Bill[]
  tasks         Task[]
  notifications Notification[]

  @@map("users")
}

model Bill {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  vendor      String
  amount      Decimal  @db.Decimal(10, 2)
  currency    String   @default("THB")
  dueDate     DateTime @map("due_date")
  billType    BillType @map("bill_type")
  rawImageUrl String   @map("raw_image_url")
  ocrData     Json     @default("{}") @map("ocr_data")
  recurrence  Json?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relationships
  user User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  task Task?

  @@index([userId])
  @@index([dueDate])
  @@map("bills")
}

model Task {
  id              String     @id @default(uuid())
  billId          String     @unique @map("bill_id")
  userId          String     @map("user_id")
  title           String
  status          TaskStatus @default(UNPAID)
  dueDate         DateTime   @map("due_date")
  paidAt          DateTime?  @map("paid_at")
  paymentProofUrl String?    @map("payment_proof_url")
  createdAt       DateTime   @default(now()) @map("created_at")
  updatedAt       DateTime   @updatedAt @map("updated_at")

  // Relationships
  bill          Bill           @relation(fields: [billId], references: [id], onDelete: Cascade)
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  notifications Notification[]

  @@index([userId])
  @@index([status])
  @@index([dueDate])
  @@index([userId, status])
  @@index([status, dueDate])
  @@map("tasks")
}

model Notification {
  id        String             @id @default(uuid())
  userId    String             @map("user_id")
  taskId    String             @map("task_id")
  type      NotificationType
  status    NotificationStatus @default(PENDING)
  message   String
  sentAt    DateTime?          @map("sent_at")
  readAt    DateTime?          @map("read_at")
  metadata  Json               @default("{}")
  createdAt DateTime           @default(now()) @map("created_at")

  // Relationships
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([taskId])
  @@index([status])
  @@map("notifications")
}

// Enums
enum BillType {
  ELECTRIC
  WATER
  INTERNET
  CAR
  HOME
  OTHER
}

enum TaskStatus {
  UNPAID
  PAID
}

enum NotificationType {
  BILL_CREATED
  DUE_SOON
  DUE_TODAY
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
  READ
}
```

---

## API Specification

### API Design Principles

1. **RESTful conventions:** Standard HTTP methods (GET, POST, PATCH, DELETE)
2. **Consistent response format:** All endpoints return `{ data, error }` structure
3. **Type-safe schemas:** Zod validation on all inputs
4. **Error handling:** Standard error codes and messages
5. **Authentication:** NextAuth session middleware on protected routes

### Standard Response Format

```typescript
// Success response
interface ApiResponse<T> {
  data: T;
  error: null;
}

// Error response
interface ApiErrorResponse {
  data: null;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
  };
}
```

### Core API Endpoints

#### Authentication

```typescript
// POST /api/auth/callback/line
// Handled by NextAuth.js automatically

// GET /api/auth/session
// Returns current user session
Response: {
  data: {
    user: { id, name, email, avatarUrl },
    expires: string
  }
}
```

#### Bills

```typescript
// POST /api/bills
// Create new bill with OCR data
Request: {
  vendor: string;
  amount: number;
  dueDate: string;  // ISO 8601
  billType: BillType;
  rawImageUrl: string;  // From Vercel Blob upload
  ocrData: OCRData;
  recurrence?: RecurrenceSettings;
}
Response: {
  data: { bill: Bill, task: Task }
}

// GET /api/bills
// List all bills (with optional filters)
Query: {
  status?: 'all' | 'upcoming' | 'overdue';
  assigneeId?: string;
  limit?: number;
  offset?: number;
}
Response: {
  data: { bills: Bill[], total: number }
}

// GET /api/bills/:id
// Get single bill with task
Response: {
  data: { bill: Bill, task: Task }
}

// PATCH /api/bills/:id
// Update bill details
Request: Partial<Bill>
Response: {
  data: { bill: Bill }
}

// DELETE /api/bills/:id
// Delete bill (cascades to task)
Response: {
  data: { success: true }
}
```

#### Tasks

```typescript
// GET /api/tasks
// List tasks (filtered by assignee, status, date)
Query: {
  assigneeId?: string;
  status?: TaskStatus;
  dueBefore?: string;  // ISO 8601
  dueAfter?: string;
  limit?: number;
  offset?: number;
}
Response: {
  data: { tasks: Task[], total: number }
}

// GET /api/tasks/:id
// Get single task with bill and history
Response: {
  data: {
    task: Task,
    bill: Bill,
    assignee: User,
    history: History[]
  }
}

// PATCH /api/tasks/:id
// Update task (reassign, mark paid, etc.)
Request: {
  assigneeId?: string;
  status?: TaskStatus;
  paymentProofUrl?: string;
}
Response: {
  data: { task: Task }
}
// Note: Automatically creates History entry and sends notifications

// GET /api/tasks/my
// Get current user's assigned tasks
Query: {
  status?: TaskStatus;
}
Response: {
  data: { tasks: Task[] }
}
```

#### Users

```typescript
// GET /api/users
// List all members (for assignment dropdown)
Response: {
  data: { users: User[] }
}

// GET /api/users/:id
// Get user profile
Response: {
  data: { user: User }
}

// PATCH /api/users/:id
// Update user profile (name, avatar, settings)
Request: Partial<User>
Response: {
  data: { user: User }
}
```

#### Notifications

```typescript
// GET /api/notifications
// Get user's notifications
Query: {
  status?: NotificationStatus;
  unreadOnly?: boolean;
}
Response: {
  data: { notifications: Notification[] }
}

// PATCH /api/notifications/:id/read
// Mark notification as read
Response: {
  data: { notification: Notification }
}

// POST /api/notifications/test
// Test notification delivery (demo mode)
Request: {
  userId: string;
  channel: NotificationChannel;
  message: string;
}
Response: {
  data: { notification: Notification }
}
```

#### Summaries

```typescript
// GET /api/summaries/monthly
// Get monthly payment summary
Query: {
  year: number;
  month: number;  // 1-12
}
Response: {
  data: {
    total: number;
    currency: string;
    memberSummaries: Array<{
      userId: string;
      userName: string;
      avatarUrl: string;
      totalPaid: number;
      taskCount: number;
    }>;
  }
}
```

#### File Uploads

```typescript
// POST /api/upload
// Upload image to Vercel Blob
Request: FormData {
  file: File;
  type: 'receipt' | 'payment_proof';
}
Response: {
  data: {
    url: string;
    downloadUrl: string;
  }
}
```

---

## Core Workflows

### Workflow 1: Bill Upload & Task Creation

```mermaid
sequenceDiagram
    participant User
    participant Client as Next.js Client
    participant Tesseract as Tesseract.js
    participant API as API Routes
    participant FS as Local Filesystem
    participant DB as PostgreSQL
    participant Queue as Bull Queue
    participant LINE as LINE Messaging API

    User->>Client: Click "Add Bill" + Take Photo
    Client->>Client: Capture image from camera
    Client->>Tesseract: Process image (OCR)
    Tesseract-->>Client: Return extracted data (amount, date, vendor)
    Client->>User: Show editable form with OCR results
    User->>Client: Edit/confirm details + assign member
    Client->>FS: Upload receipt image
    FS-->>Client: Return local file path
    Client->>API: POST /api/bills (with file path + OCR data)
    API->>DB: Create Bill record
    API->>DB: Create Task record (linked to bill)
    API->>DB: Create History record (CREATED)
    API->>Queue: Schedule notification jobs (3 days, 1 day before due)
    Queue-->>API: Jobs scheduled
    API->>LINE: Send immediate assignment notification
    LINE-->>API: Delivery confirmation
    API->>DB: Create Notification record (SENT)
    API-->>Client: Return bill + task
    Client->>User: Show success + redirect to dashboard
```

### Workflow 2: Mark Task as Paid

```mermaid
sequenceDiagram
    participant User
    participant Client as Next.js Client
    participant API as API Routes
    participant FS as Local Filesystem
    participant DB as PostgreSQL

    User->>Client: Open task details
    User->>Client: Click "Mark as Paid"
    Client->>User: Prompt for payment slip upload (optional)
    User->>Client: Upload payment slip
    Client->>FS: Upload payment slip image
    FS-->>Client: Return file path
    Client->>API: PATCH /api/tasks/:id (status=PAID, paymentProofUrl)
    API->>DB: Update task (status, paidAt, paymentProofUrl)
    API->>DB: Create History record (PAID)
    API-->>Client: Return updated task
    Client->>Client: Optimistic UI update
    Client->>User: Show success toast
```

### Workflow 3: Monthly Summary Calculation

```mermaid
sequenceDiagram
    participant User
    participant Client as Next.js Client
    participant API as API Routes
    participant DB as PostgreSQL

    User->>Client: Navigate to Dashboard
    Client->>API: GET /api/summaries/monthly?year=2025&month=10
    API->>DB: Query tasks WHERE status=PAID AND paid_at IN month
    DB-->>API: Return paid tasks with amounts
    API->>API: Calculate total amount
    API->>API: Group by assignee_id, SUM amounts
    API->>DB: Fetch user details for each assignee
    DB-->>API: Return user names + avatars
    API-->>Client: Return summary (total + per-member)
    Client->>User: Render summary cards
```

### Workflow 4: Task Reassignment

```mermaid
sequenceDiagram
    participant User as User A
    participant Client as Next.js Client
    participant API as API Routes
    participant DB as PostgreSQL
    participant LINE as LINE Notify
    participant UserB as User B (New Assignee)

    User->>Client: Open task details
    User->>Client: Select new assignee from dropdown
    User->>Client: Click "Reassign"
    Client->>API: PATCH /api/tasks/:id (assigneeId=userB)
    API->>DB: Update task assignee
    API->>DB: Create History (REASSIGNED, details={previousAssignee: userA})
    API->>DB: Create Notification for User B
    API->>LINE: Send LINE Notify to User B
    LINE-->>API: Delivery confirmation
    API->>DB: Update notification status (SENT)
    API-->>Client: Return updated task
    Client->>User: Show success
    LINE-->>UserB: "Task reassigned to you: Pay electric bill..."
```

---

## Project Structure

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

## Development Workflow

### Local Development Setup

#### Prerequisites

```bash
# Install Node.js 18+ and pnpm
brew install node pnpm  # macOS
# or
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Verify versions
node --version  # Should be 18+
pnpm --version  # Should be 8+
```

#### Initial Setup

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

#### Development Commands

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

### Environment Configuration

#### Required Environment Variables

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

#### Local Service Installation

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

## Security and Performance

### Security Requirements

**Frontend Security:**
- **CSP Headers:** `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; img-src 'self' data: https:;`
- **XSS Prevention:** React auto-escaping, DOMPurify for user content, strict TypeScript
- **Secure Storage:** NextAuth session cookies (httpOnly, secure, sameSite=lax)

**Backend Security:**
- **Input Validation:** Zod schemas on all API routes, type-safe Prisma queries
- **CORS Policy:** `{ origin: 'http://localhost:3000', credentials: true }`
- **SQL Injection Prevention:** Prisma parameterized queries (no raw SQL)
- **File Upload Validation:** File type and size limits on receipt/payment slip uploads

**Authentication Security:**
- **Token Storage:** NextAuth session in httpOnly cookies (not localStorage)
- **Session Management:** 30-day rolling sessions for demo
- **Password Policy:** N/A (LINE OAuth only, no passwords)

**Additional Measures:**
- Environment variables in .env.local (not committed to git)
- Database running in Docker container (isolated)
- File uploads stored locally with path validation
- Demo mode with seeded test data

### Performance Optimization

**Frontend Performance:**
- **Bundle Size Target:** < 200KB initial JS bundle
- **Loading Strategy:**
  - React Server Components for initial render (0 JS)
  - Code splitting per route (automatic with App Router)
  - Lazy loading for OCR worker (Tesseract.js)
- **Caching Strategy:**
  - Static assets: Browser cache for dev
  - API responses: `Cache-Control: no-store` (dynamic data)
  - No ISR needed for hackathon demo

**Backend Performance:**
- **Response Time Target:** < 500ms for API routes (local development)
- **Database Optimization:**
  - Composite indexes on common query patterns
  - `SELECT` only needed fields (Prisma `select`)
  - Batch queries with Prisma transactions
- **Caching Strategy:**
  - Session data in memory (NextAuth default)
  - No caching for bills/tasks (real-time data for demo)

**Monitoring:**
- Next.js dev server console logs
- Browser DevTools for Core Web Vitals
- Prisma query logging in development mode
- Console timing for API route performance

---

## Testing Strategy

### Testing Pyramid

```plaintext
        E2E Tests (10%)
       /              \
     Integration Tests (30%)
    /                      \
  Unit Tests (60%)    Component Tests
 /____________        ____________\
Frontend Unit        Backend Unit
```

### Test Organization

#### Frontend Tests

```plaintext
tests/
├── unit/
│   ├── components/
│   │   ├── BillCard.test.tsx
│   │   ├── TaskList.test.tsx
│   │   └── OCRScanner.test.tsx
│   └── utils/
│       ├── date.test.ts
│       └── currency.test.ts
├── integration/
│   └── hooks/
│       └── useTaskList.test.ts
```

#### Backend Tests

```plaintext
tests/
├── unit/
│   ├── services/
│   │   ├── BillService.test.ts
│   │   ├── TaskService.test.ts
│   │   └── NotificationService.test.ts
│   └── utils/
│       └── api-response.test.ts
├── integration/
│   └── api/
│       ├── bills.test.ts
│       ├── tasks.test.ts
│       └── notifications.test.ts
```

#### E2E Tests

```plaintext
tests/
└── e2e/
    ├── bill-upload-flow.spec.ts
    ├── task-payment-flow.spec.ts
    ├── notification-flow.spec.ts
    └── monthly-summary.spec.ts
```

### Test Examples

#### Frontend Component Test

```typescript
// tests/unit/components/BillCard.test.tsx
import { render, screen } from '@testing-library/react';
import { BillCard } from '@/components/bills/BillCard';

describe('BillCard', () => {
  it('displays bill information correctly', () => {
    const bill = {
      id: '1',
      vendor: 'MEA',
      amount: 1500,
      currency: 'THB',
      dueDate: new Date('2025-10-15'),
      billType: 'ELECTRIC' as const,
    };

    render(<BillCard bill={bill} />);

    expect(screen.getByText('MEA')).toBeInTheDocument();
    expect(screen.getByText('฿1,500.00')).toBeInTheDocument();
    expect(screen.getByText(/Oct 15, 2025/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /electric/i })).toBeInTheDocument();
  });

  it('shows overdue badge when past due date', () => {
    const bill = {
      id: '1',
      vendor: 'MEA',
      amount: 1500,
      dueDate: new Date('2025-09-01'), // Past date
      billType: 'ELECTRIC' as const,
    };

    render(<BillCard bill={bill} />);

    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });
});
```

#### Backend API Test

```typescript
// tests/integration/api/tasks.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/tasks/[id]/route';
import { prisma } from '@/lib/prisma';

describe('PATCH /api/tasks/:id', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany();
    await prisma.bill.deleteMany();
  });

  it('marks task as paid successfully', async () => {
    // Setup
    const task = await prisma.task.create({
      data: {
        billId: 'bill-1',
        title: 'Pay electric bill',
        assigneeId: 'user-1',
        status: 'OPEN',
        dueDate: new Date('2025-10-15'),
      },
    });

    const { req, res } = createMocks({
      method: 'PATCH',
      body: {
        status: 'PAID',
        paymentProofUrl: 'https://blob.vercel-storage.com/proof.jpg',
      },
    });

    // Execute
    await POST(req, { params: { id: task.id } });

    // Assert
    const updatedTask = await prisma.task.findUnique({
      where: { id: task.id },
    });

    expect(updatedTask?.status).toBe('PAID');
    expect(updatedTask?.paidAt).toBeInstanceOf(Date);
    expect(updatedTask?.paymentProofUrl).toBe('https://blob.vercel-storage.com/proof.jpg');
  });
});
```

#### E2E Test

```typescript
// tests/e2e/bill-upload-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete bill upload and task creation flow', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000');
  await page.click('text=Login with LINE');
  // ... handle LINE OAuth (mocked in test env)

  // Navigate to add bill
  await page.click('text=Add Bill');

  // Upload receipt image
  await page.setInputFiles('input[type="file"]', 'tests/fixtures/receipt.jpg');

  // Wait for OCR processing
  await page.waitForSelector('text=Extracted amount');

  // Verify OCR results
  const amountField = page.locator('input[name="amount"]');
  await expect(amountField).toHaveValue('1500');

  // Edit and submit
  await page.fill('input[name="vendor"]', 'Metropolitan Electricity Authority');
  await page.selectOption('select[name="assignee"]', 'user-2');
  await page.click('button:has-text("Create Bill")');

  // Verify success
  await expect(page.locator('text=Bill created successfully')).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard/);

  // Verify task appears in dashboard
  await expect(page.locator('text=Pay Metropolitan Electricity Authority')).toBeVisible();
});
```

---

## Coding Standards

### Critical Fullstack Rules

- **Type Sharing:** Always define shared types in `lib/types` and import from there. Never duplicate type definitions between frontend and backend.

- **API Calls:** Never make direct `fetch()` calls from components. Use service layer methods from `lib/services` that handle errors and type safety.

- **Environment Variables:** Access only through typed config objects in `lib/config.ts`, never `process.env` directly. Use `NEXT_PUBLIC_` prefix for client-side vars.

- **Error Handling:** All API routes must use the standard error handler from `lib/utils/api-response.ts`. Consistent error format across all endpoints.

- **State Updates:** Never mutate Prisma results or React state directly. Use Prisma's immutable updates and React setState patterns.

- **Database Queries:** Always use Prisma Client, never raw SQL. Use `select` to fetch only needed fields. Use transactions for multi-step operations.

- **File Uploads:** Always upload to Vercel Blob first, then store URL in database. Never store binary data in PostgreSQL.

- **Notifications:** Use NotificationService for all notifications. Never call LINE Notify API directly from components.

- **Authentication:** Always check session with NextAuth middleware. Never trust client-side auth state alone.

- **Validation:** Use Zod schemas defined in `lib/validations` for both client and server validation. Share the same schema.

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `BillCard.tsx`, `TaskList.tsx` |
| Hooks | camelCase with 'use' prefix | - | `useTaskList.ts`, `useAuth.ts` |
| API Routes | kebab-case folder, route.ts | - | `api/bills/route.ts` |
| Database Tables | snake_case | - | `users`, `bills`, `tasks` |
| Prisma Models | PascalCase | - | `User`, `Bill`, `Task` |
| Services | PascalCase with 'Service' suffix | - | `BillService`, `TaskService` |
| Utilities | camelCase | - | `formatCurrency`, `parseDate` |
| Types/Interfaces | PascalCase | - | `Bill`, `Task`, `ApiResponse<T>` |

---

## Error Handling Strategy

### Error Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Service
    participant DB

    Client->>API: POST /api/bills (invalid data)
    API->>API: Zod validation fails
    API-->>Client: 400 { error: { code: 'VALIDATION_ERROR', ... } }

    Client->>API: POST /api/bills (valid data)
    API->>Service: BillService.create()
    Service->>DB: Prisma query
    DB-->>Service: PrismaClientKnownRequestError
    Service->>Service: Map to AppError
    Service-->>API: throw AppError('BILL_CREATE_FAILED')
    API->>API: Error handler catches AppError
    API-->>Client: 500 { error: { code: 'BILL_CREATE_FAILED', ... } }

    Client->>API: GET /api/bills/unknown-id
    API->>Service: BillService.getById()
    Service->>DB: Prisma findUnique
    DB-->>Service: null
    Service-->>API: throw AppError('BILL_NOT_FOUND', 404)
    API-->>Client: 404 { error: { code: 'BILL_NOT_FOUND', ... } }
```

### Error Response Format

```typescript
// lib/types/api.ts
interface ApiError {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable message
    details?: Record<string, any>;  // Additional context
    timestamp: string;      // ISO 8601 timestamp
    requestId: string;      // For debugging
  };
}

// Error codes
const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BILL_CREATE_FAILED: 'BILL_CREATE_FAILED',
  TASK_UPDATE_FAILED: 'TASK_UPDATE_FAILED',
  NOTIFICATION_SEND_FAILED: 'NOTIFICATION_SEND_FAILED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
```

### Frontend Error Handling

```typescript
// lib/utils/api-client.ts
import { toast } from '@/components/ui/use-toast';

export async function apiCall<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Server returned error response
      const error = data.error;
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      throw new ApiError(error);
    }

    return data.data;
  } catch (error) {
    // Network error or JSON parse error
    if (error instanceof ApiError) throw error;

    toast({
      title: 'Network Error',
      description: 'Please check your connection and try again.',
      variant: 'destructive',
    });
    throw error;
  }
}

export class ApiError extends Error {
  constructor(public error: ApiError['error']) {
    super(error.message);
    this.name = 'ApiError';
  }
}
```

### Backend Error Handling

```typescript
// lib/utils/api-response.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function errorResponse(error: unknown, requestId: string) {
  console.error('[API Error]', error);

  // Zod validation error
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
          timestamp: new Date().toISOString(),
          requestId,
        },
      },
      { status: 400 }
    );
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'This record already exists',
            timestamp: new Date().toISOString(),
            requestId,
          },
        },
        { status: 409 }
      );
    }
  }

  // Custom AppError
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp: new Date().toISOString(),
          requestId,
        },
      },
      { status: error.statusCode }
    );
  }

  // Unknown error
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId,
      },
    },
    { status: 500 }
  );
}

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

---

## Next Steps

This architecture document provides the foundation for rapid hackathon development. Key implementation priorities:

### Phase 1: 4-Hour MVP (Local Demo)
1. Initialize Next.js project with TypeScript + Tailwind
2. Install local PostgreSQL + Redis + Prisma (simplified single-user schema)
3. Implement bill upload flow with Google Cloud Document AI OCR
4. Create automatic task creation (no assignment needed)
5. Build basic dashboard (upcoming, overdue tasks)

### Phase 2: 48-Hour Full MVP (Local Demo)
6. Setup Bull queues + Redis for background jobs
7. Integrate LINE LIFF authentication
8. Implement LINE Messaging API (Official Account) for notifications
9. Create queue workers for scheduled bill reminders (3 days, 1 day before due)
10. Add recurring bill settings UI
11. Build monthly summary views with member cards
12. Setup Bull Board for queue monitoring
13. Polish UI/UX for local demo presentation

### Quick Start Commands

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
