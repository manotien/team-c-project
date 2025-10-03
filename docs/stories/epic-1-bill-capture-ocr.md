# Epic 1: Bill Capture & OCR

**Epic ID:** EPIC-1
**Epic Name:** Bill Capture & OCR
**Priority:** Critical (P0)
**Target Release:** Hackathon MVP - 4 Hour Demo
**Status:** Ready for Development

---

## Epic Goal

Enable users to quickly digitize bills by capturing photos with one-button access, automatically extracting key information (amount, due date) via OCR, and allowing users to edit results before saving.

---

## Epic Description

**Problem Statement:**
Users need a fast, frictionless way to capture physical bills and convert them into digital format without manual data entry. Manual typing is error-prone and time-consuming, especially for recurring bills.

**Solution:**
Implement a streamlined bill capture flow using camera access and Google Cloud Document AI for OCR processing. The system will extract amount and due date from receipt images, present editable fields to the user for verification, and save the digitized bill.

**Value Delivered:**
- **Time Savings:** Reduce bill entry time from ~2 minutes to ~30 seconds
- **Accuracy:** Achieve ≥60% OCR extraction accuracy (per acceptance criteria)
- **User Experience:** Single-button access to camera eliminates friction
- **Error Reduction:** Editable fields allow correction before final save

---

## User Stories

### US-1.1: Single-Button Bill Photo Capture
**As a** user
**I want to** upload or take a photo of a bill from one button
**So that** I can digitize it easily without navigating multiple screens

**Acceptance Criteria:**
- [ ] Single "Add Bill" button visible on main dashboard
- [ ] Button triggers camera access on mobile devices
- [ ] Button allows file upload on desktop/web
- [ ] Supports both camera capture and gallery selection
- [ ] Image preview shown immediately after capture
- [ ] User can retake photo if needed

---

### US-1.2: OCR Data Extraction
**As a** user
**I want to** see extracted details (amount, due date) from OCR
**So that** I don't need to type them manually

**Acceptance Criteria:**
- [ ] OCR processing starts automatically after image capture
- [ ] Loading indicator shown during processing
- [ ] Extracted amount displayed in currency field (THB default)
- [ ] Extracted due date displayed in date field
- [ ] Extracted vendor/merchant name displayed
- [ ] Confidence score ≥60% for successful extraction
- [ ] Graceful fallback to empty fields if extraction fails
- [ ] OCR raw data stored in bill record for debugging

**Technical Notes:**
- Use Google Cloud Document AI Receipt Parser
- Store original image in `public/uploads/receipts/`
- Save OCR confidence scores in `ocrData` JSON field

---

### US-1.3: Edit OCR Results Before Saving
**As a** user
**I want to** edit OCR results before saving
**So that** I can correct any mistakes in the extraction

**Acceptance Criteria:**
- [ ] All extracted fields are editable text inputs
- [ ] Pre-populated with OCR results (if available)
- [ ] Vendor name field (text input)
- [ ] Amount field (numeric input with currency format)
- [ ] Due date field (date picker)
- [ ] Bill type dropdown (Electric, Water, Internet, Car, Home, Other)
- [ ] "Save Bill" button creates bill and task
- [ ] "Cancel" button discards capture and returns to dashboard
- [ ] Form validation before save (required: amount, due date)
- [ ] Success message shown after save

---

## Technical Implementation Notes

**Tech Stack:**
- **Frontend:** Next.js client component with camera access
- **OCR:** Google Cloud Document AI (Receipt Parser)
- **File Upload:** Local filesystem storage (`public/uploads/`)
- **API Route:** `/api/ocr` for image processing

**Integration Points:**
- Camera API (mobile browser)
- File input (desktop)
- Google Cloud Document AI API
- Bill creation API (`POST /api/bills`)
- Task auto-creation (Epic 2 dependency)

**Performance Requirements:**
- OCR processing: < 5 seconds
- Image upload: < 2 seconds
- Total flow: < 10 seconds from capture to save

---

## Dependencies

**Upstream Dependencies:**
- Google Cloud Document AI processor setup
- GCP credentials configuration
- Local file storage directory setup

**Downstream Dependencies:**
- **Epic 2 (Task Creation):** Bill creation triggers automatic task creation
- **Epic 8 (Profile & Icons):** Bill type icons displayed in form

---

## Definition of Done

- [ ] All 3 user stories implemented with acceptance criteria met
- [ ] OCR extraction accuracy ≥60% verified with test receipts
- [ ] Single-button capture works on mobile and desktop
- [ ] Editable form validates and saves correctly
- [ ] Bill record created in database with OCR data
- [ ] Original receipt image stored locally
- [ ] Error handling for OCR failures
- [ ] Loading states and success messages implemented
- [ ] Unit tests for OCR processing
- [ ] E2E test for full capture flow

---

## Success Metrics

**Target Metrics:**
- OCR extraction success rate: ≥60%
- Average capture-to-save time: ≤30 seconds
- User error rate: <10% (incorrect amount/date after OCR)
- Mobile camera access success: ≥95%

---

## Risk Assessment

**Primary Risk:** OCR accuracy below 60% for Thai receipts
**Mitigation:** Use Google Document AI with Thai language support, test with real receipt samples

**Secondary Risk:** Camera access blocked by browser permissions
**Mitigation:** Provide clear permission prompts, fallback to file upload

---

## Notes

- This epic is **critical path** for MVP demo (4-hour target)
- Focus on mobile-first UX (LINE LIFF browser)
- Google Cloud free tier: 1000 pages/month (sufficient for demo)
- Store original images for future re-processing if needed
