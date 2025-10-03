# Epic 4: Task Actions & History

**Epic ID:** EPIC-4
**Epic Name:** Task Actions & History
**Priority:** Critical (P0)
**Target Release:** Hackathon MVP - 4 Hour Demo
**Status:** Ready for Development

---

## Epic Goal

Enable users to mark tasks as paid with optional payment proof upload, view completed task history, and access detailed bill information.

---

## Epic Description

**Problem Statement:**
Users need a way to update task status after paying bills, upload proof of payment for record-keeping, view completed payment history, and access full bill details when needed.

**Solution:**
Implement task action capabilities including:
1. **Mark as Paid** with optional payment slip upload
2. **Completed task history** view
3. **Bill detail** view for full information

**Value Delivered:**
- **Task Closure:** Clear completion workflow for paid bills
- **Proof of Payment:** Upload payment slips for future reference
- **Historical Record:** View all completed payments
- **Bill Transparency:** Access full bill details anytime

---

## User Stories

### US-4.1: Mark Task as Paid
**As a** user
**I want to** mark a task as Paid
**So that** it moves off my active task list and shows as completed

**Acceptance Criteria:**
- [ ] "Mark as Paid" button visible on task detail page (when status = UNPAID)
- [ ] Click button opens confirmation dialog or modal
- [ ] Confirmation shows:
  - [ ] Bill vendor name and amount
  - [ ] "Are you sure you want to mark this as paid?"
  - [ ] Cancel and Confirm buttons
- [ ] Confirm button triggers API: `PATCH /api/tasks/:id { status: 'PAID' }`
- [ ] Task status updated to PAID in database
- [ ] `paidAt` timestamp set to current time
- [ ] Success message: "Task marked as paid"
- [ ] Task removed from "Upcoming Tasks" section
- [ ] Task appears in "Completed Tasks" history
- [ ] Optimistic UI update (instant visual feedback)

**Technical Notes:**
- API route: `app/api/tasks/[id]/route.ts`
- Update: `prisma.task.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } })`
- Use React Server Actions or client-side fetch

---

### US-4.2: Upload Payment Slip as Proof
**As a** user
**I want to** upload a payment slip as proof when marking a task as Paid
**So that** I have a record of my payment

**Acceptance Criteria:**
- [ ] "Upload Payment Proof" option shown in mark-paid dialog (optional)
- [ ] Click "Choose File" opens file picker
- [ ] Supports image formats: JPG, PNG, PDF
- [ ] File size limit: 10MB
- [ ] Image preview shown after selection
- [ ] File uploaded to local storage: `public/uploads/proofs/`
- [ ] File URL saved in `task.paymentProofUrl` field
- [ ] "Remove" button to clear selected file
- [ ] Marking paid works with or without proof upload
- [ ] Payment proof visible in task history view

**Technical Notes:**
- File upload: `POST /api/upload` with `type: 'payment_proof'`
- Storage: Local filesystem (`public/uploads/proofs/`)
- Filename: `{taskId}-proof-{timestamp}.{ext}`
- Update task: `{ status: 'PAID', paidAt: new Date(), paymentProofUrl: uploadUrl }`

---

### US-4.3: View Completed Tasks in History
**As a** user
**I want to** see completed tasks in history
**So that** I can review my payment records

**Acceptance Criteria:**
- [ ] "History" or "Completed" tab/section on dashboard
- [ ] Shows all tasks where status = PAID
- [ ] Sorted by `paidAt` date (most recent first)
- [ ] Each history item displays:
  - [ ] Bill vendor name
  - [ ] Bill amount
  - [ ] Due date
  - [ ] Paid date
  - [ ] Payment proof thumbnail (if available)
  - [ ] Bill type icon
- [ ] Click history item to view full bill details
- [ ] Empty state: "No completed tasks yet"
- [ ] Pagination for >50 completed tasks

**Technical Notes:**
- Query: `prisma.task.findMany({ where: { userId, status: 'PAID' }, include: { bill: true }, orderBy: { paidAt: 'desc' } })`
- Component: `components/tasks/TaskHistory.tsx`
- Page: `app/(dashboard)/tasks/history/page.tsx` or tab on dashboard

---

### US-4.4: View Bill Details
**As a** user
**I want to** view full bill details
**So that** I can see all information including the original receipt image

**Acceptance Criteria:**
- [ ] Click any task card navigates to task detail page: `/tasks/:id`
- [ ] Task detail page displays:
  - [ ] Bill vendor name (header)
  - [ ] Bill amount (large, prominent)
  - [ ] Bill type with icon
  - [ ] Due date
  - [ ] Task status (UNPAID/PAID badge)
  - [ ] Paid date (if status = PAID)
  - [ ] Original receipt image (clickable to enlarge)
  - [ ] Payment proof image (if available)
  - [ ] OCR confidence score (optional debug info)
  - [ ] Created date
- [ ] "Mark as Paid" button (if UNPAID)
- [ ] "Back to Dashboard" link/button
- [ ] Receipt image zoomable/enlargeable
- [ ] Responsive layout (mobile-first)

**Technical Notes:**
- Page: `app/(dashboard)/tasks/[id]/page.tsx`
- Query: `prisma.task.findUnique({ where: { id }, include: { bill: true, user: true } })`
- Image display: Use Next.js Image component with lightbox/modal for zoom
- Use React Server Component for data fetching

---

## Technical Implementation Notes

**Tech Stack:**
- **Backend:** Next.js API Routes + Prisma
- **Frontend:** React Server Components + Client Components
- **File Storage:** Local filesystem
- **UI Components:** shadcn/ui Dialog, Button, Image

**Integration Points:**
- Task update API (`PATCH /api/tasks/:id`)
- File upload API (`POST /api/upload`)
- Task detail page routing
- Dashboard history section

**Database Updates:**
- Add `paymentProofUrl` column to tasks table (TEXT, nullable)
- Add `paidAt` column (TIMESTAMP, nullable)
- Index on `status` and `paidAt` for history queries

---

## Dependencies

**Upstream Dependencies:**
- **Epic 2 (Task Creation):** Tasks must exist before actions can be taken
- **Epic 1 (Bill Capture):** Receipt images stored for detail view

**Downstream Dependencies:**
- **Epic 5 (Dashboard):** History section displayed on dashboard
- **Epic 6 (Monthly Summary):** Paid tasks included in monthly calculations

---

## Definition of Done

- [ ] All 4 user stories implemented with acceptance criteria met
- [ ] US-4.1: Mark as Paid functionality working
- [ ] US-4.2: Payment proof upload functional
- [ ] US-4.3: Completed task history view implemented
- [ ] US-4.4: Bill detail page complete
- [ ] Task status updates persist correctly
- [ ] Payment proof images stored and displayed
- [ ] History filtered and sorted correctly
- [ ] Receipt images displayed with zoom capability
- [ ] Responsive design for mobile devices
- [ ] Optimistic UI updates provide instant feedback
- [ ] Unit tests for task update service
- [ ] E2E test: mark task paid → verify in history

---

## Success Metrics

**Target Metrics:**
- Mark-as-paid success rate: 100%
- Payment proof upload success: ≥95%
- History page load time: <500ms for 100 tasks
- Task detail page load time: <300ms

---

## Risk Assessment

**Primary Risk:** File upload fails but task marked paid (data inconsistency)
**Mitigation:**
- Upload file first, then update task with proof URL
- Rollback task update if upload fails
- Allow re-upload of proof on paid tasks

**Secondary Risk:** Large payment proof files slow down page load
**Mitigation:**
- 10MB file size limit enforced
- Use Next.js Image optimization for thumbnails
- Lazy load images in history list

---

## Notes

- **Critical path for 4-hour MVP:** Mark as Paid is essential for demo
- **Payment proof is optional:** Don't block payment workflow on proof upload
- **Single-user architecture:** No need for "who paid" information (always current user)
- **History vs Dashboard:** Consider combining into single page with tabs/filters
- **Receipt zoom:** Can use simple modal for MVP, enhance with image viewer library later
- **Consider adding:**
  - Edit bill details (future enhancement)
  - Delete bill/task (future enhancement)
  - Undo mark-as-paid (future enhancement)
