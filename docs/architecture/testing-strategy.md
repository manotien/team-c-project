# Testing Strategy

## Testing Pyramid

```plaintext
        E2E Tests (10%)
       /              \
     Integration Tests (30%)
    /                      \
  Unit Tests (60%)    Component Tests
 /____________        ____________\
Frontend Unit        Backend Unit
```

## Test Organization

### Frontend Tests

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

### Backend Tests

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

### E2E Tests

```plaintext
tests/
└── e2e/
    ├── bill-upload-flow.spec.ts
    ├── task-payment-flow.spec.ts
    ├── notification-flow.spec.ts
    └── monthly-summary.spec.ts
```

## Test Examples

### Frontend Component Test

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

### Backend API Test

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

### E2E Test

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
