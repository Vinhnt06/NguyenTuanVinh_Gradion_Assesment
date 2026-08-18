# Gradion Assessment — AGENTS.md

## Candidate & Project Overview
- **Candidate:** Tuấn Vinh Nguyễn
- **Role:** Software Engineering Intern (6-month contract) — Top 10 Take-Home Assessment
- **Assessment Name:** Book Illustration Studio (Gemini API Integration)

## Mandatory Project Directives & AI Operating Rules

### 1. Architectural & Technical Constraints
- **Stack Alignment:** Lean, clean fullstack architecture. Do not over-engineer.
- **Pipeline Order (5 Steps):**
  1. Style (Art style definition)
  2. Characters (Max 2 adult characters, structured JSON output)
  3. Portraits (1 portrait image per character)
  4. Chapters (Max 1 chapter illustration prompt, structured JSON output)
  5. Illustrations (1 scene illustration using portrait consistency)
- **Hard Caps Enforcement:** Server-side validation MUST strictly enforce **Max 2 characters** and **Max 1 chapter**.
- **State Integrity:**
  - Pipeline must be **Resumable** across page refresh, logout, or server restart without data loss.
  - **No Duplicate Calls:** Server must guard against concurrent / duplicate Gemini API calls during in-flight steps.
  - **Stuck Step Recovery:** Provide clear mechanism/endpoint to reset/recover stranded steps.
  - **Cost Discipline:** Reuse book text context via session/chat chaining or file reference. Never re-send full book text per step. Never auto-retry Gemini calls in a loop.

### 2. AI Decision Tracking (`DECISIONS.md`)
- Record key architectural decisions as development progresses.
- **MUST include at least 3 explicit AI overrides/pushbacks** where AI output was wrong, overcomplicated, or unsafe, and document what was implemented instead.
- End `DECISIONS.md` with: *"If you had one more day, what would you build next and why?"*.

### 3. Deliverables Checklist
- `README.md` (architecture, env vars, `./start.sh`, `./test.sh`)
- `DECISIONS.md` (4–6 decisions, ≥3 AI overrides, one-more-day section)
- `TESTING.md` (strategy + real test run output)
- AI Artifacts (`CLAUDE.md`, `AGENTS.md`, `.agents/`, `docs/plan.md`)
- `scripts/` or root `./start.sh` & `./test.sh`
- `.env.example`
- Git history (frequent, meaningful commits)
