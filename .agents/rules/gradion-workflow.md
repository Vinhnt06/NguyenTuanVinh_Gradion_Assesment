---
# Gradion Assessment — Workflow Rules
# Đọc file này trước khi bắt đầu bất kỳ tác vụ nào trong dự án này.

name: gradion-assessment-workflow
description: Project-specific workflow rules for the Book Illustration Studio assessment build.
priority: P0
---

# Workflow Rules — Book Illustration Studio

## 1. Before Touching Any File
- Read `build-plan.md` → find the current `[ ]` task
- Read `DECISIONS.md` → apply existing decisions, never re-decide what's already settled
- Check `lib/storage.ts` state schema before touching any state-related code

## 2. During Implementation
- **One task at a time** — complete + verify before moving to next
- **Mark `[x]` in `build-plan.md`** immediately after verifying a task
- **Enforce caps always:** Characters → slice to 2; Chapters → slice to 1 (server-side, in `lib/pipeline.ts`)
- **Never call Gemini in loops with auto-retry** — user-triggered retries only
- **Duplicate guard pattern** (mandatory for every step run handler):
  ```typescript
  if (state.stepStates[step] === 'running') return 409
  await writeState({ ...state, stepStates: { [step]: 'running' }, stepStartedAt: new Date().toISOString() })
  // THEN call Gemini
  ```

## 3. Commit Protocol
- **Commit after each PHASE** (P1, P2, P3, P4) — not after individual tasks
- **Message format:** `feat: <what>` / `fix: <what>` / `test: <what>` / `docs: <what>`
- **NO Co-authored-by lines** — commits are author Vinhnt06 only
- **Push immediately** after committing

## 4. Never Do These
- ❌ Never commit `.env` (only `.env.example`)
- ❌ Never re-send full book text per Gemini step (use `bookFileUri`)
- ❌ Never use `localStorage` as duplicate-call guard
- ❌ Never auto-retry Gemini in a loop
- ❌ Never add Redis, Docker, or DB dependencies (JSON files only)
- ❌ Never import images as static Next.js assets (serve via API)

## 5. Test Requirements
- Backend: Jest tests in `__tests__/backend/`
- Frontend: React Testing Library in `__tests__/frontend/`
- `./test.sh` must run ALL tests with one command
- `TESTING.md` must contain REAL test output (paste from terminal)

## 6. Design System (Gradion DS)
Apply tokens from `app-demo.html` `:root` block:
- Primary color: `#FF6B00` (orange)
- Font: "Noto Sans", system-ui
- Background: `#F2EEE7` (paper) / `#F8F8F8` (paper-2)
- Status pills: orange = In Progress, dark = Done, gray = Draft
- Cards: `border-radius: 16px`, `box-shadow: 0 2px 6px rgba(35,31,32,0.06)`
