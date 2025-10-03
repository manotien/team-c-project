# Epic 3: Notifications

**Epic ID:** EPIC-3
**Epic Name:** Notifications
**Priority:** High (P1)
**Target Release:** Hackathon Full MVP - 48 Hours
**Status:** Ready for Development

---

## Epic Goal

Notify users via LINE when bills are added and when due dates approach, while providing an in-app notification history center for all notifications.

---

## Epic Description

**Problem Statement:**
Users need timely reminders to pay bills before due dates. Without notifications, users must manually check the dashboard. Users also need a history of past notifications for reference.

**Solution:**
Implement a three-tier notification system:
1. **Immediate notification** when bill is added (via LINE Messaging API)
2. **Scheduled notifications** when bills reach due date (via Bull queue + LINE)
3. **In-app notification center** for viewing notification history

**Value Delivered:**
- **Timely Reminders:** Users notified before due dates to avoid late payments
- **Instant Confirmation:** LINE notification when bill added confirms successful creation
- **Notification History:** In-app center provides audit trail of all notifications
- **Multi-Channel:** LINE for push notifications + in-app for reference

---

## User Stories

### US-3.1: LINE Notification on Bill Creation
**As a** user
**I want to** receive a LINE notification when I add a bill
**So that** I get instant confirmation and can track it in my LINE chat

**Acceptance Criteria:**
- [ ] LINE notification sent immediately after bill + task creation
- [ ] Notification contains:
  - [ ] Bill vendor name
  - [ ] Bill amount (฿1,500.00)
  - [ ] Due date (readable format)
  - [ ] Bill type icon (⚡💧🌐🚗🏠)
  - [ ] Link to view bill in app (deep link to task detail)
- [ ] Notification sent via LINE Messaging API (Official Account)
- [ ] User's LINE ID retrieved from authenticated session
- [ ] Notification record created in database (type: BILL_CREATED, status: SENT)
- [ ] Graceful handling if LINE API fails (logged but doesn't block bill creation)
- [ ] Notification delivery confirmation logged

**Technical Notes:**
- Use LINE Messaging API with channel access token
- Message format: Flex Message with bill details
- Send notification after bill/task transaction commits
- Non-blocking: Use async/await with error handling

---

### US-3.2: LINE Notification When Bill Due Date Reached
**As a** user
**I want to** receive LINE notifications when bills reach their due date
**So that** I don't forget to pay them on time

**Acceptance Criteria:**
- [ ] Scheduled notification sent when bill due date is reached
- [ ] Notification contains:
  - [ ] "Bill due today!" message
  - [ ] Bill vendor name
  - [ ] Bill amount
  - [ ] Deep link to pay/mark task as paid
- [ ] Notification only sent if task status = UNPAID
- [ ] Notification scheduled via Bull queue (due date - current time)
- [ ] Notification record created (type: DUE_TODAY, status: SENT)
- [ ] Optional: Additional notification sent 1 day before due (type: DUE_SOON)
- [ ] Failed notifications retried 3 times with exponential backoff
- [ ] Job removed from queue if task marked PAID

**Technical Notes:**
- Bull queue: `billNotificationsQueue.add({ taskId, type: 'DUE_TODAY' }, { delay: ... })`
- Worker: `lib/queues/workers/billNotifications.worker.ts`
- Check task status before sending (skip if PAID)
- Use Redis for queue storage (localhost:6379)

---

### US-3.3: In-App Notification History Center
**As a** user
**I want to** see in-app notifications and a history center
**So that** I can review past notifications and track bill activity

**Acceptance Criteria:**
- [ ] Notification bell icon in app header/navigation
- [ ] Badge shows count of unread notifications
- [ ] Click bell opens notification center (dropdown or page)
- [ ] Notification center displays:
  - [ ] List of all notifications (newest first)
  - [ ] Each notification shows: type icon, message, timestamp, read/unread status
  - [ ] Unread notifications highlighted
  - [ ] Click notification marks as read and navigates to related task
- [ ] "Mark all as read" button
- [ ] Pagination or infinite scroll for large notification lists
- [ ] Empty state: "No notifications yet"
- [ ] Real-time update when new notification received (optional for MVP)

**Technical Notes:**
- Query: `prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })`
- Component: `components/notifications/NotificationCenter.tsx`
- API: `PATCH /api/notifications/:id/read` to mark read
- Consider using React Server Components for initial load + client component for interactions

---

## Technical Implementation Notes

**Tech Stack:**
- **LINE Integration:** LINE Messaging API (Official Account)
- **Queue System:** Bull + Redis
- **Database:** Notification model in PostgreSQL
- **Frontend:** React components with notification bell

**Integration Points:**
- LINE Messaging API endpoints
- Bull queue for scheduled notifications
- Redis server (localhost:6379)
- Notification table in database
- Task detail pages (deep link targets)

**Notification Model Schema:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  task_id UUID NOT NULL REFERENCES tasks(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('BILL_CREATED', 'DUE_SOON', 'DUE_TODAY')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'READ')),
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Bull Queue Configuration:**
- Queue name: `billNotifications`
- Job types: `{ taskId, type: 'DUE_SOON' | 'DUE_TODAY' }`
- Retry attempts: 3
- Backoff: Exponential (2s, 4s, 8s)

---

## Dependencies

**Upstream Dependencies:**
- **Epic 2 (Task Creation):** Task creation triggers BILL_CREATED notification
- **Epic 9 (Login & Auth):** User LINE ID required for LINE Messaging API

**Downstream Dependencies:**
- **Epic 4 (Task Actions):** Mark notification as read when task viewed
- **Epic 5 (Dashboard):** Notification bell visible in dashboard header

**External Dependencies:**
- LINE Official Account setup
- LINE Messaging API credentials (channel access token)
- Redis server running locally
- Bull queue workers started

---

## Definition of Done

- [ ] All 3 user stories implemented with acceptance criteria met
- [ ] US-3.1: LINE notification sent on bill creation
- [ ] US-3.2: Scheduled LINE notifications via Bull queue
- [ ] US-3.3: In-app notification center functional
- [ ] Notification model created in database
- [ ] Bull queue worker running and processing jobs
- [ ] LINE Messaging API integration tested
- [ ] Error handling for LINE API failures
- [ ] Notification read/unread status working
- [ ] Deep links navigate to correct task details
- [ ] Unit tests for NotificationService
- [ ] Integration tests for queue workers
- [ ] E2E test: create bill → receive LINE notification

---

## Success Metrics

**Target Metrics:**
- LINE notification delivery rate: ≥95%
- Notification latency (bill created → LINE received): <5 seconds
- Scheduled notification accuracy: ±1 minute of due date
- In-app notification center load time: <300ms

---

## Risk Assessment

**Primary Risk:** LINE Messaging API rate limits or delivery failures
**Mitigation:**
- Implement retry logic with exponential backoff
- Log failures for debugging
- Don't block bill creation on notification failures

**Secondary Risk:** Bull queue jobs not processed (Redis down, worker not running)
**Mitigation:**
- Monitor Bull Board for failed jobs
- Add health check for Redis connection
- Document worker startup in README

**Tertiary Risk:** Notification spam if user creates many bills
**Mitigation:**
- Consider daily digest for multiple notifications (future enhancement)
- Allow user to mute notifications in settings (future)

---

## Notes

- **Priority P1** (not P0): Notifications enhance UX but aren't blocking for core bill capture flow
- **LINE Messaging API** preferred over LINE Notify (richer message format, official account)
- **Bull queue** required for scheduled notifications (48-hour MVP)
- **In-app center** provides fallback if LINE notifications fail
- Consider implementing notification preferences in Epic 8 (Profile) for future iterations
- Deep links use LIFF URL scheme: `https://liff.line.me/{liffId}?path=/tasks/{taskId}`
