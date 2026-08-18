# Testing Strategy & Execution Report

> **Candidate:** Tuấn Vinh Nguyễn  
> **Role:** Software Engineering Intern (6-month contract) — Gradion Assessment  
> **Target:** Book Illustration Studio

---

## 🎯 Testing Strategy Overview

The testing suite covers both **Backend logic** and **Frontend UI components** to verify end-to-end reliability without burning API quota or over-engineering E2E setup.

### 1. Backend Testing (`__tests__/backend/`)
- **Storage & Auth (`storage.test.ts`):**
  - Deterministic user ID generation from email addresses (`hashEmail`).
  - JWT token signing and verification (`signToken`, `verifyToken`).
  - Atomic JSON file read/write operations and write-mutex isolation.
  - User project listing ordered by creation timestamp.
- **Pipeline Orchestration (`pipeline.test.ts`):**
  - **Step Ordering Enforcement:** Step N cannot run before Step N-1 succeeds.
  - **Server-Side Cap Enforcement:** Restricts character count to max 2 and chapter count to max 1.
  - **Duplicate Call Guard (409 Conflict):** Returns HTTP 409 immediately if a step is already `running`.
  - **Stuck Step Reset:** Resets stranded `running` step back to `pending` without losing completed steps.

### 2. Frontend Component Testing (`__tests__/frontend/`)
- **Stepper (`components.test.tsx`):** Renders all 5 step labels and displays checkmark badges (✓) for completed steps.
- **StepAction Button:** Renders correct UI states for idle, loading spinner, error message with Retry button, and stranded step warning with Reset button.
- **CharacterCard & ChapterCard:** Verifies correct text rendering and image placeholder swap behavior.

---

## 📊 Real Test Execution Output

Below is the unedited output from executing `./test.sh` in the terminal:

```text
🧪 Running Book Illustration Studio Test Suite (Frontend + Backend)...

> book-illustration-studio@0.1.0 test
> jest --passWithNoTests

PASS __tests__/frontend/components.test.tsx
PASS __tests__/backend/pipeline.test.ts
PASS __tests__/backend/storage.test.ts

Test Suites: 3 passed, 3 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        0.875 s, estimated 1 s
Ran all test suites.
```

---

## 🛠️ How to Run Tests
Execute the single entrypoint command:
```bash
./test.sh
```
