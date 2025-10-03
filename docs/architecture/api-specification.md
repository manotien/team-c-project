# API Specification

## API Design Principles

1. **RESTful conventions:** Standard HTTP methods (GET, POST, PATCH, DELETE)
2. **Consistent response format:** All endpoints return `{ data, error }` structure
3. **Type-safe schemas:** Zod validation on all inputs
4. **Error handling:** Standard error codes and messages
5. **Authentication:** NextAuth session middleware on protected routes

## Standard Response Format

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

## Core API Endpoints

### Authentication

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

### Bills

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

### Tasks

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

### Users

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

### Notifications

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

### Summaries

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

### File Uploads

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
