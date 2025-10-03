# Data Models

## Simplified Architecture: Single User

**Key Decision:** The application uses a **single-user architecture** where:
- Each user manages their own bills and tasks independently
- No concept of groups, members, or assignments
- User creates bill → automatically creates task for themselves
- Monthly summaries show user's own payment totals

**Rationale:** This is the simplest possible data model for hackathon MVP, eliminating group management entirely and focusing on core bill tracking functionality.

---

## User

**Purpose:** Represents a user who manages their own bills and tasks.

**Key Attributes:**
- `id`: String (UUID) - Unique identifier
- `lineUserId`: String (unique) - LINE user ID from LINE login
- `name`: String - Display name from LINE profile
- `avatarUrl`: String (nullable) - Profile image URL from LINE
- `createdAt`: DateTime - Account creation timestamp
- `updatedAt`: DateTime - Last update timestamp

### TypeScript Interface

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

### Relationships

- One user can create many bills
- One user has many tasks (auto-created from bills)
- One user can receive many notifications

---

## Bill

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

### TypeScript Interface

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

### Relationships

- Belongs to one User
- Has one associated Task (auto-created)

---

## Task

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

### TypeScript Interface

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

### Relationships

- Belongs to one Bill
- Belongs to one User
- Has many Notifications

---

## Notification

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

### TypeScript Interface

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

### Relationships

- Belongs to one User
- Belongs to one Task

---
