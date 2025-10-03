# Database Schema

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

## Prisma Schema

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
