# 🧠 Brainstorm: Book Illustration Studio (Gradion Assessment)

> Candidate: Tuấn Vinh Nguyễn | Date: 2026-08-18 | Status: Approved & Committed

---

## Context

Build a fullstack web app that turns a book's text into character portraits and chapter illustrations via the Gemini API. Five sequential steps (Style → Characters → Portraits → Chapters → Illustrations), user-driven, resumable, no duplicate API calls, max 2 characters and 1 chapter (server-side enforced). ~16 hours effort.

---

## 🔑 Decision 1: Tech Stack

### Option A: Next.js (Full-Stack Monorepo) ✅ **CHOSEN**

API Routes for backend + React for frontend. Single project, single `./start.sh`.

✅ **Pros:**
- One repo, one `npm run dev` — satisfies "one command starts the stack"
- Gemini JS SDK natively supported
- API routes are Node.js — can use file system directly for storage
- SSE support built-in for real-time step updates (bonus)
- No CORS complexity (same origin)
- Widely known, fast to build

❌ **Cons:**
- Next.js can feel "magic" — harder to reason about caching
- Need to disable ISR/static optimization for mutable API routes

📊 **Effort:** Low

---

### Option B: Express.js (Backend) + React Vite (Frontend)

Two separate packages in a monorepo (`/backend`, `/frontend`).

✅ **Pros:**
- Clear separation of concerns
- Express is dead simple, easy to reason about

❌ **Cons:**
- Two `npm install`, two servers, more complex `./start.sh` (needs concurrently)
- CORS config needed
- More boilerplate for a simple app

📊 **Effort:** Medium

---

### Option C: Python FastAPI (Backend) + React Vite (Frontend)

Python backend, JavaScript frontend.

✅ **Pros:**
- Python has excellent Gemini SDK (google-generativeai)
- FastAPI is fast, type-safe, auto-docs

❌ **Cons:**
- Two languages = two runtimes to install, more complex `./start.sh`
- Mixed JS+Python testing harder to unify under `./test.sh`
- Candidate strength is JS, so less leverage

📊 **Effort:** High

---

## 🔑 Decision 2: Storage

### Option A: JSON Files on Disk ✅ **CHOSEN**

State per-user isolated in `storage/users/<userId>/projects/<projectId>/state.json`. Images in same directory.

✅ **Pros:**
- Zero DB dependency — reviewer runs `./start.sh`, no DB setup
- Satisfies scope perfectly (assessment only, low concurrent users)
- Transparent — easy to inspect state manually
- Per-project write lock (via simple async mutex) prevents concurrent writes

❌ **Cons:**
- Not scalable beyond local dev (acceptable — explicitly in spec)
- No transactions — crash mid-write could corrupt state → mitigated by atomic write (write temp file → rename)
- Concurrent multi-server would break → acceptable, single-server local only

📊 **Effort:** Low

---

### Option B: SQLite (via Prisma or better-sqlite3)

Single-file relational DB, zero server, included in repo.

✅ **Pros:**
- ACID transactions → state is always consistent
- Schema migrations via Prisma

❌ **Cons:**
- Extra dependency, migration step needed in `./start.sh`
- Prisma schema adds boilerplate for a simple 5-step state machine
- Images still live on disk anyway, so you get "half DB half files"

📊 **Effort:** Medium

---

### Option C: PostgreSQL / MongoDB

Full production database.

❌ **Cons:**
- Reviewer needs Docker or a running DB to test → violates "one command" spirit
- Massive overkill for 1 user, 5 steps

📊 **Effort:** High — **ELIMINATED**

---

## 🔑 Decision 3: Pipeline State Model

### How to represent "Step 3 done, Step 4 in-progress"

Two separate fields are needed (AI proposed single enum → overridden):

```json
{
  "currentStep": 3,
  "stepStates": {
    "0": "done",
    "1": "done",
    "2": "done",
    "3": "running",
    "4": "pending"
  },
  "stepResults": {
    "0": { "style": "Watercolor illustration..." },
    "1": { "characters": [...] },
    "2": { "portraits": [...] }
  },
  "stepError": null,
  "stepStartedAt": "2026-08-18T01:30:00Z"
}
```

**AI override:** Gemini initially suggested a single `status` enum (`draft | running | done | failed`). This cannot express "step 2 running while steps 0 and 1 are done." Split into `stepStates` (per-step) + project-level `status` (Draft / InProgress / Done).

**Stuck detection:** If `stepStates[N] === "running"` and `Date.now() - stepStartedAt > 5 minutes`, UI shows "Step appears stuck" with a Reset button. Reset endpoint sets state back to `"pending"`.

---

## 🔑 Decision 4: Duplicate Call Prevention

### Problem
User double-clicks "Run Step", refreshes mid-call, or opens second tab. Gemini call must NOT fire twice.

### Solution: Server-side in-flight guard ✅ **CHOSEN**

```
POST /api/projects/:id/steps/:step/run
→ Check state.json: stepStates[step] === "running"? → Return 409 Conflict
→ Otherwise: set stepStates[step] = "running", save → then call Gemini
```

**Why server-side only?** The spec explicitly says "duplicate-click guard must not live in one browser tab" — the demo's `localStorage` guard was called out as insufficient. Server state is the single source of truth.

**AI override:** Initial proposal added a Redis-based distributed lock. For a local single-process app this is over-engineering. A simple in-memory flag (per process) + the persisted state check is sufficient.

---

## 🔑 Decision 5: Gemini Book Context — Send Once, Reuse

### Problem
The book text could be thousands of tokens. Sending it on every step wastes quota.

### Solution: Files API (upload once, reference by fileUri) ✅ **CHOSEN**

```
Step 1 trigger:
→ Upload book text via Gemini Files API → get fileUri
→ Store fileUri in project state.json

Steps 2–5:
→ Reference fileUri in each request (not re-sending raw text)
→ Files API retains file for 48h → sufficient for pipeline lifecycle
```

**AI override:** AI initially suggested starting a Gemini Chat session (multi-turn) that holds context. Chat sessions are ephemeral (lost on server restart) — violates the "resumable after server restart" requirement. Files API fileUri is durable and stored in state.json → survives restarts.

---

## 🔑 Decision 6: Frontend State & Polling

### Option A: Polling (setInterval every 2s) ✅ **CHOSEN for MVP**

Simple: client polls `GET /api/projects/:id` every 2s while a step is running.

✅ Pros: No WebSocket complexity, works with Next.js API routes out of the box.
❌ Cons: Minor latency (~2s lag), extra requests.

### Option B: SSE (Server-Sent Events)

Server pushes step progress to client in real-time.

✅ Pros: Real-time, no polling waste, matches bonus spec.
❌ Cons: Adds complexity, needs persistent connection handling.

**Decision:** Ship polling for MVP; SSE is the **one-more-day** feature.

---

## 💡 Final Recommendation Summary

| Concern | Decision |
|---------|----------|
| Stack | **Next.js** (monorepo, one command) |
| Storage | **JSON files + atomic write** (zero DB dependency) |
| State model | **Per-step `stepStates` map + `stepStartedAt`** |
| Duplicate guard | **Server-side 409 check on `stepStates[step]`** |
| Book context | **Gemini Files API** (fileUri stored in state.json) |
| Real-time UI | **Polling MVP → SSE bonus** |
| Image model | **`imagen-3.0-generate-002`** (current Gemini image model) |
| Text model | **`gemini-2.0-flash`** (fast, current, structured JSON output) |

---

## One More Day

> *If I had one more day, I would implement Server-Sent Events (SSE) for real-time step progress. Currently the UI polls every 2 seconds, which works but adds latency and wasted requests. SSE would let the server push each portrait image as it lands, creating a dramatically better UX — the user would see portraits appear one by one without any artificial delay. This also sets the groundwork for the Veo animation step from the notebook's later sections.*
