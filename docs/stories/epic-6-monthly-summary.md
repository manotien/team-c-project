# Epic 6: Monthly Summary

**Epic ID:** EPIC-6
**Epic Name:** Monthly Summary
**Priority:** Medium (P2)
**Target Release:** Hackathon Full MVP - 48 Hours
**Status:** Ready for Development

---

## Epic Goal

Provide users with a monthly financial summary showing total payments for the current month and a visual card displaying their payment total with profile avatar.

---

## Epic Description

**Problem Statement:**
Users need to understand their monthly bill payment spending to manage their budget. Without a summary view, users must manually calculate total payments from individual tasks.

**Solution:**
Implement a monthly summary dashboard widget that:
1. Shows **total payments** for the current month
2. Displays a **user payment card** with avatar and monthly total

**Value Delivered:**
- **Financial Awareness:** Instant view of monthly spending on bills
- **Budget Tracking:** Monitor monthly payment patterns
- **Visual Identity:** User avatar personalizes the summary card
- **Simplified View:** No need for manual calculation or scrolling through tasks

---

## User Stories

### US-6.1: Display Total Payments for Current Month
**As a** user
**I want to** see a card with my total payments this month
**So that** I can track my monthly bill spending

**Acceptance Criteria:**
- [ ] Summary card displayed on dashboard (prominent position)
- [ ] Card shows current month name and year ("October 2025")
- [ ] Displays total amount paid this month (sum of all PAID tasks in current month)
- [ ] Amount formatted with currency: "฿4,850.00"
- [ ] Count of bills paid this month: "5 bills paid"
- [ ] Card styled distinctively (larger, highlighted, or separate section)
- [ ] Updates automatically when task marked as paid
- [ ] Shows ฿0.00 if no bills paid this month
- [ ] Month calculation based on `task.paidAt` field

**Technical Notes:**
- Query:
  ```typescript
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  const paidTasks = await prisma.task.findMany({
    where: {
      userId,
      status: 'PAID',
      paidAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    },
    include: { bill: true }
  });

  const total = paidTasks.reduce((sum, task) => sum + Number(task.bill.amount), 0);
  ```
- Use server component for data fetching
- Component: `components/summaries/MonthlySummaryCard.tsx`

---

### US-6.2: Display User Payment Card with Avatar
**As a** user
**I want to** see a card with my payment total and avatar
**So that** I can see my personal contribution to bill payments

**Acceptance Criteria:**
- [ ] User card displayed within monthly summary section
- [ ] Card shows:
  - [ ] User's profile avatar (from LINE profile)
  - [ ] User's display name
  - [ ] Total amount paid this month: "฿4,850.00"
  - [ ] Number of bills paid: "5 bills"
  - [ ] Visual indicator (icon or label) for payment contribution
- [ ] Avatar displayed as circular image
- [ ] Fallback avatar if user has no profile image (initials or default icon)
- [ ] Card styled with border, shadow, or background color
- [ ] Responsive layout (stacks on mobile, side-by-side on desktop)

**Technical Notes:**
- Fetch user data: `prisma.user.findUnique({ where: { id: userId }, select: { name, avatarUrl } })`
- Avatar component: `components/ui/Avatar.tsx` (from shadcn/ui)
- Fallback avatar: Show first letter of name or default icon
- Use Next.js Image component for avatar optimization

---

## Technical Implementation Notes

**Tech Stack:**
- **Frontend:** React Server Components
- **Database:** Prisma aggregation queries
- **UI:** shadcn/ui Card, Avatar components
- **Date Utilities:** date-fns for month calculations

**Integration Points:**
- Dashboard page (summary section)
- User profile data (Epic 9)
- Task payment data (Epic 4)

**Calculation Logic:**
```typescript
// lib/services/SummaryService.ts
export async function getMonthlyPaymentSummary(userId: string, year: number, month: number) {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  const paidTasks = await prisma.task.findMany({
    where: {
      userId,
      status: 'PAID',
      paidAt: { gte: startOfMonth, lte: endOfMonth }
    },
    include: { bill: true }
  });

  const total = paidTasks.reduce((sum, task) => sum + Number(task.bill.amount), 0);
  const count = paidTasks.length;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, avatarUrl: true }
  });

  return {
    month: startOfMonth,
    total,
    count,
    user
  };
}
```

---

## Dependencies

**Upstream Dependencies:**
- **Epic 4 (Task Actions):** Requires `paidAt` timestamp on tasks
- **Epic 9 (Login & Auth):** Requires user profile data (name, avatar)

**Downstream Dependencies:**
- None (self-contained feature)

---

## Definition of Done

- [ ] Both user stories implemented with acceptance criteria met
- [ ] US-6.1: Monthly total payment card displayed
- [ ] US-6.2: User payment card with avatar functional
- [ ] Summary calculations accurate (sum of paid tasks)
- [ ] Month filtering correct (current month only)
- [ ] User avatar displayed with fallback
- [ ] Currency formatting consistent (฿ symbol, 2 decimals)
- [ ] Responsive layout for mobile and desktop
- [ ] Updates when tasks marked paid (consider revalidation strategy)
- [ ] Empty state handled (₿0.00, 0 bills)
- [ ] Unit tests for summary calculation logic
- [ ] Integration test: mark task paid → verify summary updates

---

## Success Metrics

**Target Metrics:**
- Calculation accuracy: 100% (verified against raw task data)
- Summary load time: <300ms
- Avatar load time: <200ms
- User comprehension: 85% understand monthly spending at a glance

---

## Risk Assessment

**Primary Risk:** Incorrect month calculation due to timezone issues
**Mitigation:**
- Use user's timezone for month boundaries (default: Asia/Bangkok)
- Store `paidAt` in UTC, convert for display
- Test with edge cases (end of month, different timezones)

**Secondary Risk:** Performance degradation with many paid tasks (>100/month)
**Mitigation:**
- Database index on `(user_id, status, paid_at)`
- Consider caching summary data (recompute on task payment)
- Aggregation query instead of loading all tasks

**Tertiary Risk:** Avatar loading slow from LINE CDN
**Mitigation:**
- Use Next.js Image component with optimization
- Fallback to default avatar if LINE image fails
- Consider caching avatars locally (future enhancement)

---

## Notes

- **Priority P2:** Not critical for 4-hour demo, target for 48-hour MVP
- **Single-user context:** "Member" refers to the individual user, not multiple people
- **Original PRD mentioned "group total + per-person cards"** - clarified to mean single user's total with their profile card
- **Future enhancements:**
  - Month selector (previous months)
  - Year-to-date total
  - Category breakdown (Electric, Water, etc.)
  - Spending trends chart
  - Export summary as PDF/CSV
- **Consider combining with Epic 5 dashboard** as a widget/section
- **Currency:** Default to THB (฿), support for other currencies in future
