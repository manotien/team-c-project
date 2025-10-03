# Epic 2: Task Creation

**Epic ID:** EPIC-2
**Epic Name:** Task Creation
**Priority:** Critical (P0)
**Target Release:** Hackathon MVP - 4 Hour Demo
**Status:** Ready for Development

---

## Epic Goal

Automatically create payment tasks linked to bills when users add bills, enabling users to track their payment responsibilities on a centralized dashboard.

---

## Epic Description

**Problem Statement:**
After capturing a bill, users need a clear task to remind them to pay it. Manual task creation adds friction. Users need a centralized view of all their payment tasks.

**Solution:**
Implement automatic task creation when a bill is saved. Each task is linked 1:1 with a bill, assigned to the user who created the bill, and visible on the dashboard. Tasks track payment status (UNPAID/PAID) and due dates.

**Value Delivered:**
- **Zero Friction:** Tasks created automatically, no manual action needed
- **Single User Flow:** User who creates bill owns the task (single-user architecture)
- **Visibility:** All tasks visible on dashboard for easy tracking
- **Accountability:** Clear payment responsibility linked to bills

---

## User Stories

### US-2.1: Automatic Task Creation from Bill
**As a** user
**I want to** create a task linked to a bill automatically when I add a bill
**So that** I can track my payment responsibility without extra steps

**Acceptance Criteria:**
- [ ] Task automatically created when bill is saved (POST /api/bills)
- [ ] Task title auto-generated: "Pay {vendor} bill"
- [ ] Task due date copied from bill due date
- [ ] Task status set to UNPAID by default
- [ ] Task.userId set to current authenticated user
- [ ] Task.billId references the bill record (1:1 relationship)
- [ ] Task creation happens in same database transaction as bill
- [ ] Transaction rolled back if task creation fails
- [ ] Success message shows "Bill and task created"

**Technical Notes:**
- Use Prisma transaction to ensure atomicity
- Task model: `billId` (unique), `userId`, `title`, `status`, `dueDate`
- No assignment dropdown needed (single-user = auto-assign to self)

---

### US-2.3: View Tasks on Dashboard
**As a** user
**I want to** view my tasks on the dashboard
**So that** I can see what bills I need to pay

**Acceptance Criteria:**
- [ ] Dashboard shows "My Tasks" section
- [ ] Tasks sorted by due date (earliest first)
- [ ] Each task card displays:
  - [ ] Bill vendor name
  - [ ] Bill amount with currency (฿1,500.00)
  - [ ] Due date in readable format ("Oct 15, 2025")
  - [ ] Bill type icon (⚡💧🌐🚗🏠)
  - [ ] Task status badge (UNPAID/PAID)
- [ ] Click task card to view bill details
- [ ] Empty state message if no tasks: "No bills to pay yet"
- [ ] Tasks filtered to current user only (WHERE userId = currentUser.id)

**Technical Notes:**
- Query: `prisma.task.findMany({ where: { userId }, include: { bill: true }, orderBy: { dueDate: 'asc' } })`
- Use React Server Component for initial load
- Task cards link to `/tasks/[id]` detail page

---

## Technical Implementation Notes

**Tech Stack:**
- **Backend:** Next.js API Route Handlers
- **Database:** Prisma + PostgreSQL
- **Frontend:** Next.js React Server Components + Client Components

**Integration Points:**
- Bill creation API (`POST /api/bills`)
- Task model in Prisma schema
- Dashboard page (`app/(dashboard)/dashboard/page.tsx`)
- Task list component

**Database Schema:**
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  bill_id UUID NOT NULL UNIQUE REFERENCES bills(id),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('UNPAID', 'PAID')),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## Dependencies

**Upstream Dependencies:**
- **Epic 1 (Bill Capture):** Bill creation triggers task creation
- **Epic 9 (Login & Auth):** Authenticated user ID needed for task assignment

**Downstream Dependencies:**
- **Epic 3 (Notifications):** Task creation triggers LINE notification
- **Epic 4 (Task Actions):** Task status changes (mark paid)
- **Epic 5 (Dashboard):** Task filtering and display
- **Epic 8 (Profile & Icons):** Bill type icons in task cards

---

## Definition of Done

- [ ] US-2.1 implemented: Automatic task creation with bill
- [ ] US-2.3 implemented: Dashboard task list view
- [ ] All acceptance criteria met
- [ ] Database transaction ensures bill+task atomicity
- [ ] Task model properly indexes userId and status
- [ ] Dashboard queries only current user's tasks
- [ ] Task cards show all required information
- [ ] Empty state handled gracefully
- [ ] Error handling for task creation failures
- [ ] Unit tests for BillService.createBill()
- [ ] Integration test for task auto-creation
- [ ] E2E test: create bill → verify task appears on dashboard

---

## Success Metrics

**Target Metrics:**
- Task creation success rate: 100% (atomic with bill)
- Task-to-bill linking accuracy: 100% (1:1 relationship)
- Dashboard load time: <500ms for 50 tasks
- Zero manual task creation required

---

## Risk Assessment

**Primary Risk:** Task creation fails but bill succeeds (data inconsistency)
**Mitigation:** Use Prisma transaction to ensure atomicity

**Secondary Risk:** Dashboard query performance with many tasks
**Mitigation:** Database index on `user_id` and `status`, pagination if needed

---

## Notes

- **Single-user architecture:** No assignment dropdown, user auto-assigned to self
- **Simplified task status:** Only UNPAID/PAID (removed OVERDUE enum, calculated at runtime)
- **1:1 relationship:** Each bill has exactly one task (enforced by UNIQUE constraint on bill_id)
- This epic is **critical path** for 4-hour MVP demo
- Task detail page (view bill details) handled in Epic 4
