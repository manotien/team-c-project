# Product Requirements Document with Epics & User Stories

**Project Name:** Household Tasks & Bills — Shared Tasks + Receipt Scanner + LINE Notifications  
**Owner:** Yam (Product Owner)  
**Target Release:** Hackathon MVP (Demo in 4 hrs, Full MVP in 48 hrs)  
**Date:** 2025-10-03

---

## 1. Objective

Enable households or small teams to capture bills/receipts, convert them into tasks, and notify user via LINE or fallback channels. MVP enhanced with LINE login, recurring reminders, profile images, and bill icons.

---

## 2. Scope

**MVP Demo (4 hrs):**

- Upload/take photo of bill in one button.
- OCR extraction (amount, due date).
- Editable fields.
- Create Bill + Task.
- In-app notifications.
- Mark Paid + proof upload.
- Dashboard (upcoming, overdue, my tasks).
- Profile images for members.
- Bill icons in lists.
- Login with LINE.

---

## 3. Epics & User Stories

### Epic 1: Bill Capture & OCR

- **US-1.1:** As a user, I can upload or take a photo of a bill from one button so that I can digitize it easily.
- **US-1.2:** As a user, I can see extracted details (amount, due date) from OCR so that I don't need to type them.
- **US-1.3:** As a user, I can edit OCR results before saving so I can correct mistakes.

### Epic 2: Task Creation

- **US-2.1:** As a user, I can create a task linked to a bill so I can track responsibility by select add bill button.
- **US-2.3:** As a user, I can view my tasks on the dashboard.

### Epic 3: Notifications

- **US-3.1:** As a user, I want to receive a LINE notification when add the bill.
- **US-3.2:** As a user, I want receive LINE notifications when the bills has reach due date.
- **US-3.3:** As a user, I can see in-app notifications and a history center.

### Epic 4: Task Actions & History

- **US-4.1:** As a user, I can mark a task as Paid.
- **US-4.2:** As a user, I can upload a payment slip as proof when marking Paid.
- **US-4.3:** As a user, I can see completed tasks in history.
- **US-4.4:** As a user, I can view bill details.

### Epic 5: Dashboard & Tracking

- **US-5.1:** As a user, I can see upcoming tasks so I don't miss deadlines.
- **US-5.2:** As a user, I can see overdue tasks highlighted so I know what's urgent.
- **US-5.3:** As a user, I can filter tasks status paid, unpaid.

### Epic 6: Monthly Summary

- **US-6.1:** As a user, I can see a card with total payment in task this month.
- **US-6.2:** As a user, I can see cards for each member's payments with avatar.

### Epic 7: Recurring Reminders

- **US-7.1:** As a user, I can choose a recurring reminder (weekly, monthly, yearly) when creating a bill.
- **US-7.2:** As a user, I can specify details like day of week or day of month.

### Epic 8: Profile & Icons

- **US-8.1:** As a user, I can see profile images for members next to their tasks.
- **US-8.2:** As a user, I can see contextual icons for each bill type (⚡Electric, 💧Water, 🌐Internet, 🚗Car, 🏠Home).

### Epic 9: Login & Auth

- **US-9.1:** As a user, I can log in with LINE to personalize my experience.
- **US-9.2:** As a user, I can see my avatar and name after login.

---

## 4. Acceptance Criteria

- Upload/take photo works with one button.
- OCR extracts ≥60% correctly, fields editable.
- Task creation links to bill.
- LINE notification.
- Mark Paid changes status, allows slip upload.
- Dashboard shows upcoming and overdue tasks.
- Monthly summary shows group total + per-person cards, no extra list.
- Icons visible in all lists.
- Recurrence selection available in Add Bill.
- LINE login shows avatar + name.

---
