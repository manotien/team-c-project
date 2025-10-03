# Epic 5: Dashboard & Tracking

**Epic ID:** EPIC-5
**Epic Name:** Dashboard & Tracking
**Priority:** Critical (P0)
**Target Release:** Hackathon MVP - 4 Hour Demo
**Status:** Ready for Development

---

## Epic Goal

Provide users with a centralized dashboard to view upcoming tasks, identify overdue bills, and filter tasks by payment status (paid/unpaid).

---

## Epic Description

**Problem Statement:**
Users need a quick overview of their bill payment status to avoid missing deadlines. Without visual prioritization, important overdue bills can be overlooked. Users also need to filter tasks to focus on specific payment states.

**Solution:**
Implement a comprehensive dashboard with:
1. **Upcoming tasks** section showing bills due soon
2. **Overdue task highlighting** with visual urgency indicators
3. **Status filtering** to toggle between paid/unpaid/all tasks

**Value Delivered:**
- **Situational Awareness:** Instant view of payment obligations
- **Urgency Visibility:** Overdue bills prominently highlighted
- **Focus Control:** Filter tasks by status to focus on what matters
- **Decision Support:** Prioritized task list aids payment planning

---

## User Stories

### US-5.1: View Upcoming Tasks
**As a** user
**I want to** see upcoming tasks so I don't miss deadlines
**So that** I can plan my payments in advance

**Acceptance Criteria:**
- [ ] Dashboard displays "Upcoming Tasks" section
- [ ] Shows tasks with status = UNPAID
- [ ] Sorted by due date (earliest first)
- [ ] Tasks due within next 7 days highlighted as "Due Soon"
- [ ] Each task card shows:
  - [ ] Vendor name
  - [ ] Amount (฿1,500.00)
  - [ ] Due date (relative: "in 2 days" or absolute: "Oct 15")
  - [ ] Bill type icon (⚡💧🌐🚗🏠)
  - [ ] "Due Soon" badge if within 7 days
- [ ] Click task card navigates to task detail page
- [ ] Empty state: "No upcoming bills" (if all paid or no tasks)
- [ ] Shows up to 10 tasks by default (paginate if more)

**Technical Notes:**
- Query: `prisma.task.findMany({ where: { userId, status: 'UNPAID' }, include: { bill: true }, orderBy: { dueDate: 'asc' }, take: 10 })`
- Calculate "due soon": `dueDate <= now + 7 days`
- Use relative time formatting: `date-fns` or `dayjs`
- Component: `components/dashboard/UpcomingTasks.tsx`

---

### US-5.2: Highlight Overdue Tasks
**As a** user
**I want to** see overdue tasks highlighted so I know what's urgent
**So that** I can prioritize payments that are already late

**Acceptance Criteria:**
- [ ] Tasks with `dueDate < current date` marked as overdue
- [ ] Overdue tasks displayed at top of upcoming tasks (highest priority)
- [ ] Visual indicators for overdue status:
  - [ ] Red border or background color
  - [ ] "OVERDUE" badge in red
  - [ ] Warning icon (⚠️ or similar)
  - [ ] Days overdue count: "3 days overdue"
- [ ] Overdue tasks still shown even if status = PAID (in history)
- [ ] Separate "Overdue" section above "Upcoming Tasks" (optional)
- [ ] Count badge in navigation: "Overdue (3)"

**Technical Notes:**
- Calculate overdue: `task.dueDate < new Date() && task.status === 'UNPAID'`
- Query overdue: `where: { userId, status: 'UNPAID', dueDate: { lt: new Date() } }`
- Days overdue: `Math.floor((now - dueDate) / (1000 * 60 * 60 * 24))`
- CSS: Use Tailwind classes for red styling (`bg-red-50 border-red-500`)

---

### US-5.3: Filter Tasks by Status
**As a** user
**I want to** filter tasks by paid/unpaid status
**So that** I can focus on specific types of tasks

**Acceptance Criteria:**
- [ ] Filter controls visible on dashboard (tabs, dropdown, or buttons)
- [ ] Filter options:
  - [ ] "All" - Show all tasks (UNPAID + PAID)
  - [ ] "Unpaid" - Show only UNPAID tasks (default)
  - [ ] "Paid" - Show only PAID tasks
- [ ] Active filter visually indicated (highlighted tab/button)
- [ ] Task list updates instantly when filter changed
- [ ] Filter state persists across page refreshes (localStorage or URL param)
- [ ] Task count shown in filter label: "Unpaid (5)"
- [ ] Empty states for each filter:
  - [ ] All: "No tasks yet"
  - [ ] Unpaid: "No unpaid bills"
  - [ ] Paid: "No completed payments"

**Technical Notes:**
- Use React state or URL search params for filter state
- Query with dynamic where clause: `where: { userId, ...(filter !== 'all' && { status: filter.toUpperCase() }) }`
- Client component for interactive filtering: `'use client'`
- Consider using Zustand or React Context for global filter state
- Persistence: `localStorage.setItem('taskFilter', filter)` or URL: `?status=unpaid`

---

## Technical Implementation Notes

**Tech Stack:**
- **Frontend:** Next.js React Server Components + Client Components
- **Database:** Prisma queries with filtering
- **UI:** shadcn/ui Tabs, Badge components
- **Date Utilities:** date-fns for relative time formatting

**Integration Points:**
- Dashboard page (`app/(dashboard)/dashboard/page.tsx`)
- Task list component with filtering
- Task card component with conditional styling
- Navigation showing overdue count badge

**Performance Considerations:**
- Use database indexes on `user_id`, `status`, `due_date`
- Composite index: `(user_id, status, due_date)` for optimal query performance
- Consider React Server Components for initial load (no client JS needed)
- Client component only for filter interactions

---

## Dependencies

**Upstream Dependencies:**
- **Epic 2 (Task Creation):** Tasks must exist to display on dashboard
- **Epic 4 (Task Actions):** Task status updates reflected in filters

**Downstream Dependencies:**
- **Epic 3 (Notifications):** Notification bell in dashboard header
- **Epic 6 (Monthly Summary):** Summary cards on dashboard
- **Epic 8 (Profile & Icons):** Bill type icons in task cards

---

## Definition of Done

- [ ] All 3 user stories implemented with acceptance criteria met
- [ ] US-5.1: Upcoming tasks section functional
- [ ] US-5.2: Overdue tasks highlighted correctly
- [ ] US-5.3: Status filtering working with persistence
- [ ] Dashboard displays correct tasks based on filter
- [ ] Overdue logic calculates correctly
- [ ] Visual styling distinguishes overdue from upcoming
- [ ] Filter state persists across page refreshes
- [ ] Empty states handled for all scenarios
- [ ] Responsive design for mobile devices
- [ ] Performance: <500ms dashboard load time
- [ ] Unit tests for overdue calculation logic
- [ ] Integration tests for filter queries
- [ ] E2E test: create task → verify on dashboard → filter by paid

---

## Success Metrics

**Target Metrics:**
- Dashboard load time: <500ms
- Overdue detection accuracy: 100%
- Filter response time: <100ms (instant)
- User comprehension: 90% of users understand overdue vs upcoming without training

---

## Risk Assessment

**Primary Risk:** Incorrect overdue calculation due to timezone issues
**Mitigation:**
- Store all dates in UTC in database
- Convert to user timezone for display
- Use consistent date comparison logic (server-side)

**Secondary Risk:** Poor performance with many tasks (>100)
**Mitigation:**
- Implement pagination (show 10-20 at a time)
- Database indexes on filtering columns
- Consider virtualized scrolling for long lists

**Tertiary Risk:** Filter state confusion (users forget active filter)
**Mitigation:**
- Visual indicator for active filter
- Reset filter on navigation from other pages
- Consider "Clear filters" button

---

## Notes

- **Critical for 4-hour MVP:** Dashboard is the primary user interface
- **Mobile-first design:** Optimize for LINE LIFF browser on mobile
- **Default filter:** Start with "Unpaid" to focus on actionable tasks
- **Overdue priority:** Consider separating overdue into dedicated section for maximum visibility
- **Future enhancements:**
  - Date range filtering (this week, this month)
  - Search/filter by vendor name
  - Sort options (by amount, by date)
  - Bulk actions (mark multiple as paid)
- **Consider combining with Epic 4 history:** Use tabs to switch between "Active" and "History" instead of separate pages
