# Gradion Assessment Context & Mandates

> **Candidate:** Tuấn Vinh Nguyễn
> **Role:** Software Engineering Intern (6-month contract) — Top 10 Assessment
> **Company:** Gradion
> **Project Goal:** Fullstack Book Illustration Web Application using Gemini API

---

## 🎯 Core Project Rules & Constraints

### 1. The 5-Step Reference Pipeline
1. **Style**: Art style generated from book text or provided by user.
2. **Characters**: Structured JSON list of main adult characters (Max 2 characters hard cap, enforced server-side & client-side).
3. **Portraits**: 1 portrait per character.
4. **Chapters**: Structured JSON chapter illustration prompt referencing characters (Max 1 chapter hard cap, enforced server-side & client-side).
5. **Illustrations**: 1 scene illustration per chapter reusing character portraits for visual consistency.

### 2. Functional Mandates
- **Identity**: Simple Email + Name login (no password/OAuth).
- **Projects**: Paste text or upload `.txt` file + project title.
- **Pipeline Behavior**:
  - User-driven in order (Step N depends on Step N-1 success).
  - Resumable: Refresh, logout, or server restart preserves exact state without data loss.
  - No duplicate calls: Duplicate clicks, multi-tab, or refresh during in-flight call must NOT re-trigger Gemini API.
  - Specific in-progress states (10–30s+ per call).
  - Retryable failures (failed step can be retried without re-running finished steps).
  - Stuck step recovery (stranded "in-progress" step can be cleared/retried).
  - Cost discipline: Send full book text ONCE (session/chat chaining or file upload reference), no re-sending full text per step. No auto-retries in loop.

### 3. Deliverables Checklist (§06)
- `README.md`: Prerequisites, env vars, architecture overview, `./start.sh`, `./test.sh`.
- `DECISIONS.md`: 4–6 key architectural decisions, **MUST include ≥3 explicit AI overrides/pushbacks**, plus answer to "If you had one more day, what would you build next and why?".
- `TESTING.md`: FE & BE testing strategy + **Real test execution report pasted**.
- `AI Artifacts`: `CLAUDE.md`, `AGENTS.md`, `.agents/`, `docs/plan.md`, prompts.
- `Scripts`: `./start.sh` and `./test.sh`.
- `.env.example`: Env variables template (`GEMINI_API_KEY=...`).
- `Git History`: Small, incremental, meaningful commits.

---

## 🤖 AI Copilot Rules for this Workspace
1. **Always track AI decisions and overrides** in real time as development progresses so they can be documented in `DECISIONS.md`.
2. **Never auto-retry Gemini API in loops.**
3. **Keep code lean and right-sized.** Avoid over-engineering.
4. **Maintain clean commit messages** and commit frequently.
