# Epic 7: Recurring Reminders

**Epic ID:** EPIC-7
**Epic Name:** Recurring Reminders
**Priority:** Medium (P2)
**Target Release:** Hackathon Full MVP - 48 Hours
**Status:** Ready for Development

---

## Epic Goal

Enable users to set up recurring reminders (weekly, monthly, yearly) for bills that repeat regularly, specifying scheduling details like day of week or day of month.

---

## Epic Description

**Problem Statement:**
Many bills (utilities, rent, subscriptions) recur monthly or on other regular schedules. Users waste time manually creating the same bill repeatedly. Without recurrence, users may forget to create bills for regular payments.

**Solution:**
Implement a recurrence setting system that allows users to:
1. Choose recurrence frequency (weekly, monthly, yearly) when creating a bill
2. Specify scheduling details (day of week for weekly, day of month for monthly)
3. Automatically generate new bills based on recurrence schedule

**Value Delivered:**
- **Time Savings:** Set once, bills created automatically for future periods
- **Consistency:** Never forget recurring bills (rent, utilities, subscriptions)
- **Reduced Manual Entry:** Eliminate repetitive bill creation
- **Predictable Tracking:** Anticipate recurring expenses

---

## User Stories

### US-7.1: Set Recurring Reminder When Creating Bill
**As a** user
**I want to** choose a recurring reminder (weekly, monthly, yearly) when creating a bill
**So that** the bill is automatically recreated on the specified schedule

**Acceptance Criteria:**
- [ ] "Set as Recurring" toggle/checkbox on Add Bill form
- [ ] When enabled, shows recurrence options:
  - [ ] Frequency dropdown: Weekly / Monthly / Yearly
  - [ ] Interval input: "Every ___ weeks/months/years" (default: 1)
  - [ ] Optional end date: "End after date" (date picker)
- [ ] Recurrence settings saved in `bill.recurrence` JSONB field
- [ ] Recurrence settings format:
  ```json
  {
    "type": "MONTHLY",
    "interval": 1,
    "dayOfMonth": 15,
    "endDate": "2026-12-31"
  }
  ```
- [ ] "Set as Recurring" toggle defaults to OFF (non-recurring by default)
- [ ] Form validation: Ensure valid recurrence settings if enabled
- [ ] Recurrence icon/badge shown on bill cards with recurrence

**Technical Notes:**
- Store in `bill.recurrence` JSONB column
- Interface: `RecurrenceSettings` (see architecture)
- Component: `components/bills/RecurrenceSelector.tsx`
- Don't create future bills immediately - use Bull queue worker

---

### US-7.2: Specify Recurrence Scheduling Details
**As a** user
**I want to** specify details like day of week or day of month
**So that** recurring bills are created on the correct date

**Acceptance Criteria:**
- [ ] **For Weekly recurrence:**
  - [ ] Show day-of-week selector (Mon, Tue, Wed, etc.)
  - [ ] Store in `recurrence.dayOfWeek` (0-6, 0=Sunday)
  - [ ] Example: "Every Monday"
- [ ] **For Monthly recurrence:**
  - [ ] Show day-of-month input (1-31)
  - [ ] Store in `recurrence.dayOfMonth` (1-31)
  - [ ] Handle edge cases (e.g., day 31 in February → last day of month)
  - [ ] Example: "Every 15th of the month"
- [ ] **For Yearly recurrence:**
  - [ ] Show month selector (Jan-Dec) and day input
  - [ ] Store in `recurrence.monthOfYear` (1-12) and `recurrence.dayOfMonth`
  - [ ] Example: "Every January 1st"
- [ ] Preview text shown: "Next bill will be created on: [date]"
- [ ] Validation: Ensure day/month values are valid

**Technical Notes:**
- Use date-fns or dayjs for date calculations
- Preview calculation: `calculateNextRecurrenceDate(recurrence, lastCreatedDate)`
- Form component with conditional fields based on frequency selection

---

## Background Job: Automatic Recurring Bill Creation

**Implementation (not a user story, but required):**

**Bull Queue Worker:**
- [ ] Queue name: `recurringBills`
- [ ] Cron schedule: Daily at midnight (00:00)
- [ ] Worker file: `lib/queues/workers/recurringBills.worker.ts`

**Worker Logic:**
```typescript
// Pseudo-code
async function processRecurringBills() {
  // Find bills with recurrence settings
  const recurringBills = await prisma.bill.findMany({
    where: { recurrence: { not: null } }
  });

  for (const bill of recurringBills) {
    const nextDueDate = calculateNextRecurrenceDate(bill.recurrence, bill.dueDate);

    // Check if next bill should be created today
    if (shouldCreateToday(nextDueDate)) {
      // Create new bill with same details, updated due date
      await prisma.bill.create({
        data: {
          userId: bill.userId,
          vendor: bill.vendor,
          amount: bill.amount,
          billType: bill.billType,
          dueDate: nextDueDate,
          recurrence: bill.recurrence,  // Preserve recurrence settings
          rawImageUrl: bill.rawImageUrl,  // Copy original image
          ocrData: bill.ocrData
        }
      });

      // Auto-create task for new bill (reuse Epic 2 logic)
      // Schedule notifications (reuse Epic 3 logic)
    }

    // Check end date
    if (bill.recurrence.endDate && nextDueDate > bill.recurrence.endDate) {
      // Optionally disable recurrence or remove recurrence settings
    }
  }
}
```

**Acceptance Criteria for Worker:**
- [ ] Worker runs daily at midnight
- [ ] Detects bills due for recurrence creation
- [ ] Creates new bill with updated due date
- [ ] Preserves recurrence settings in new bill
- [ ] Creates associated task automatically
- [ ] Logs creation for debugging
- [ ] Handles errors gracefully (retries, alerts)
- [ ] Respects end date settings

---

## Technical Implementation Notes

**Tech Stack:**
- **Form Component:** React client component for recurrence selection
- **Background Jobs:** Bull queue + Redis
- **Database:** JSONB field for flexible recurrence data
- **Date Library:** date-fns or dayjs for date calculations

**Integration Points:**
- Add Bill form (Epic 1)
- Bull queue system (Epic 3)
- Task auto-creation (Epic 2)
- Notification scheduling (Epic 3)

**Recurrence Data Schema:**
```typescript
interface RecurrenceSettings {
  type: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;           // Every N weeks/months/years
  dayOfWeek?: number;         // 0-6 for weekly (0=Sunday)
  dayOfMonth?: number;        // 1-31 for monthly/yearly
  monthOfYear?: number;       // 1-12 for yearly (1=January)
  endDate?: Date;             // Optional stop date
}
```

**Date Calculation Functions:**
```typescript
// lib/utils/recurrence.ts
export function calculateNextRecurrenceDate(
  recurrence: RecurrenceSettings,
  lastDate: Date
): Date {
  // Implementation based on recurrence.type
  // Handle edge cases (invalid dates, month end)
}

export function shouldCreateToday(nextDate: Date): boolean {
  const today = new Date();
  return isSameDay(today, nextDate);
}
```

---

## Dependencies

**Upstream Dependencies:**
- **Epic 1 (Bill Capture):** Add Bill form extended with recurrence settings
- **Epic 2 (Task Creation):** Task auto-creation reused for recurring bills
- **Epic 3 (Notifications):** Notification scheduling reused for new bills

**Downstream Dependencies:**
- None (self-contained feature)

**External Dependencies:**
- Redis server running (for Bull queue)
- Bull queue worker process running

---

## Definition of Done

- [ ] Both user stories implemented with acceptance criteria met
- [ ] US-7.1: Recurrence frequency selection functional
- [ ] US-7.2: Scheduling details (day/month) working correctly
- [ ] Recurrence settings saved in database (JSONB field)
- [ ] Bull queue worker created and tested
- [ ] Worker runs daily at midnight (cron schedule)
- [ ] Recurring bills created automatically on schedule
- [ ] Tasks and notifications created for new bills
- [ ] Edge cases handled (month-end, leap years, invalid dates)
- [ ] Preview text shows next recurrence date correctly
- [ ] Recurrence icon/badge visible on recurring bill cards
- [ ] Unit tests for date calculation functions
- [ ] Integration test: create recurring bill → verify worker creates next bill
- [ ] Documentation for starting worker process

---

## Success Metrics

**Target Metrics:**
- Recurrence setting accuracy: 100% (bills created on correct dates)
- Worker reliability: ≥99.9% uptime
- Date calculation accuracy: 100% (including edge cases)
- User adoption: 30% of bills set as recurring

---

## Risk Assessment

**Primary Risk:** Worker not running → recurring bills not created
**Mitigation:**
- Document worker startup in README
- Add health check endpoint for worker status
- Alert/log if worker hasn't run in 25 hours
- Consider using managed cron service (future)

**Secondary Risk:** Date calculation errors (edge cases: month-end, leap years)
**Mitigation:**
- Comprehensive unit tests for all recurrence types
- Use battle-tested date library (date-fns)
- Handle edge cases explicitly (e.g., Jan 31 → Feb 28)

**Tertiary Risk:** Duplicate bill creation if worker runs multiple times
**Mitigation:**
- Track last created date for each recurring bill
- Check if bill already created for period before creating
- Use unique constraint or deduplication logic

---

## Notes

- **Priority P2:** Not critical for 4-hour demo, target for 48-hour MVP
- **Consider phased approach:**
  - Phase 1: UI for setting recurrence (US-7.1, US-7.2)
  - Phase 2: Background worker for bill creation
- **Original image reuse:** Copy original receipt image reference (don't require new OCR)
- **Future enhancements:**
  - Edit recurrence settings on existing bills
  - Pause/resume recurrence
  - Skip specific occurrences
  - Notification before auto-creation ("Bill will be created tomorrow")
  - Amount adjustment for recurring bills (e.g., utility bills vary)
- **Worker monitoring:** Use Bull Board to monitor queue jobs and failures
- **Alternative approach:** Instead of daily cron, schedule individual jobs for each bill (more granular but complex)
