# Book Illustration Studio — Implementation Plan

> Candidate: Tuấn Vinh Nguyễn | Gradion Intern SE Assessment  
> Stack: **Next.js 14 (App Router)** | Storage: **JSON files on disk** | API: **Gemini REST/JS SDK**  
> Target: ~16 hours of focused work across 3 days

---

## Architecture Overview

```
NguyenTuanVinh_Gradion_Assesment/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Identity screen (login)
│   ├── projects/
│   │   ├── page.tsx            # Project list
│   │   ├── new/page.tsx        # New project form
│   │   └── [id]/page.tsx       # Project detail + pipeline stepper
│   └── api/
│       ├── auth/route.ts       # POST /api/auth (login/register)
│       ├── projects/
│       │   ├── route.ts        # GET list, POST create
│       │   └── [id]/
│       │       ├── route.ts    # GET project detail
│       │       └── steps/
│       │           └── [step]/
│       │               ├── run/route.ts    # POST run step
│       │               └── reset/route.ts  # POST reset stuck step
├── lib/
│   ├── storage.ts              # File-system state read/write (atomic)
│   ├── gemini.ts               # Gemini API wrapper (text + image)
│   ├── pipeline.ts             # Step orchestration logic + caps enforcement
│   └── auth.ts                 # Session token (JWT via cookie)
├── components/
│   ├── Stepper.tsx             # 5-step progress bar
│   ├── CharacterCard.tsx       # Name + prompt + portrait
│   ├── ChapterCard.tsx         # Chapter name + prompt + illustration
│   ├── ProjectRow.tsx          # Project list item with status pill
│   └── StepAction.tsx          # "Run Step" button + in-progress / error state
├── storage/                    # Runtime data (gitignored)
│   └── users/
│       └── <userId>/
│           └── projects/
│               └── <projectId>/
│                   ├── state.json
│                   ├── book.txt
│                   ├── portrait-0.png
│                   ├── portrait-1.png
│                   └── illustration-0.png
├── __tests__/
│   ├── backend/
│   │   ├── pipeline.test.ts    # Step ordering, cap enforcement, retry logic
│   │   └── storage.test.ts     # Atomic write, concurrent lock
│   └── frontend/
│       ├── Stepper.test.tsx    # Step states (done/current/pending)
│       └── StepAction.test.tsx # Loading/error/retry states
├── docs/
│   ├── brainstorm.md           # This brainstorm
│   └── plan.md                 # This file
├── AGENTS.md
├── CLAUDE.md
├── DECISIONS.md
├── TESTING.md
├── README.md
├── .env.example
├── start.sh
├── test.sh
└── package.json
```

---

## State Schema (`state.json`)

```json
{
  "id": "proj_abc123",
  "userId": "user_xyz",
  "title": "The Wind in the Willows — Watercolor",
  "bookFileUri": "https://generativelanguage.googleapis.com/v1beta/files/...",
  "createdAt": "2026-08-18T01:00:00Z",
  "status": "in_progress",
  "currentStep": 2,
  "stepStates": {
    "0": "done",
    "1": "done",
    "2": "running",
    "3": "pending",
    "4": "pending"
  },
  "stepStartedAt": "2026-08-18T01:30:00Z",
  "stepError": null,
  "stepResults": {
    "0": { "style": "Watercolor illustration, soft pastel palette, British countryside..." },
    "1": {
      "characters": [
        { "name": "Mole", "prompt": "A gentle anthropomorphic mole in a waistcoat..." },
        { "name": "Ratty", "prompt": "A dashing water rat wearing a striped scarf..." }
      ]
    },
    "2": {
      "portraits": [
        { "name": "Mole", "imagePath": "/storage/users/u1/projects/p1/portrait-0.png" },
        { "name": "Ratty", "imagePath": "/storage/users/u1/projects/p1/portrait-1.png" }
      ]
    },
    "3": null,
    "4": null
  }
}
```

---

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/auth` | Login or create user by email + name |
| `GET` | `/api/projects` | List current user's projects |
| `POST` | `/api/projects` | Create new project (upload or paste book text) |
| `GET` | `/api/projects/:id` | Get project + full state |
| `POST` | `/api/projects/:id/steps/:step/run` | Run a pipeline step (guarded against duplicate) |
| `POST` | `/api/projects/:id/steps/:step/reset` | Reset stuck "running" step back to "pending" |
| `GET` | `/api/projects/:id/images/:filename` | Serve generated image files |

---

## Pipeline Steps Implementation

### Step 0 — Style
- Input: Book text (via `bookFileUri`) + optional user-supplied style string
- Gemini call: Text model → `"Describe an art style for this book in 2–3 sentences"`
- Output: `{ style: string }`

### Step 1 — Characters
- Input: `bookFileUri` + style from Step 0
- Gemini call: Text model with **structured JSON output** (responseSchema)
- Hard cap: slice array to max 2 before saving
- Output: `{ characters: [{ name, prompt }] }` (max 2)

### Step 2 — Portraits
- Input: Each character's prompt + art style
- Gemini call: Image model (`imagen-3.0-generate-002`), one call per character
- Show per-item progress: portrait 1 lands → UI updates → portrait 2 starts
- Output: PNG files saved to disk + paths in state

### Step 3 — Chapters
- Input: `bookFileUri` + characters from Step 1
- Gemini call: Text model with **structured JSON output**
- Hard cap: slice array to max 1 before saving
- Output: `{ chapters: [{ name, prompt }] }` (max 1)

### Step 4 — Illustrations
- Input: Chapter prompt + portrait image files (for visual consistency)
- Gemini call: Image model, 1 image
- Output: PNG file + path in state

---

## Duplicate Call Prevention

```typescript
// POST /api/projects/:id/steps/:step/run
const state = await readState(projectId)
if (state.stepStates[step] === 'running') {
  return Response.json({ error: 'Step already in progress' }, { status: 409 })
}
// Write lock: set running immediately before async Gemini call
await writeState(projectId, { ...state, stepStates: { ...state.stepStates, [step]: 'running' }, stepStartedAt: new Date().toISOString() })
// Then call Gemini (non-blocking from client perspective)
```

---

## Implementation Phases

### Phase 1 — Foundation (Day 1 Morning, ~3h)
- [ ] `npx create-next-app@latest ./` with TypeScript, App Router, Tailwind (or vanilla CSS matching Gradion DS)
- [ ] `.env.example` with `GEMINI_API_KEY`, `SESSION_SECRET`
- [ ] `lib/storage.ts`: atomic file write (write-to-temp → rename), per-project mutex
- [ ] `lib/auth.ts`: JWT cookie session (email + name → userId)
- [ ] Identity screen (`/`) + Project list screen (`/projects`)
- [ ] API: `POST /api/auth`, `GET /api/projects`, `POST /api/projects`
- [ ] First passing backend tests (pipeline ordering, cap enforcement)

### Phase 2 — Pipeline Backend (Day 1 Afternoon, ~4h)
- [ ] `lib/gemini.ts`: text model wrapper + structured JSON output helper
- [ ] `lib/gemini.ts`: image model wrapper (save PNG to disk)
- [ ] `lib/pipeline.ts`: step runner, cap enforcement (max 2 chars, max 1 chapter)
- [ ] Files API upload (on project create, upload book.txt → get `bookFileUri`, store in state)
- [ ] `POST /api/projects/:id/steps/:step/run` for all 5 steps
- [ ] `POST /api/projects/:id/steps/:step/reset` for stuck-step recovery
- [ ] `GET /api/projects/:id/images/:filename` to serve images
- [ ] Test: duplicate call returns 409, retry after failure, caps enforced

### Phase 3 — Frontend Pipeline UI (Day 2, ~5h)
- [ ] Project detail page (`/projects/[id]`)
- [ ] `<Stepper />` component (done ✓ / current ● / pending ○)
- [ ] `<CharacterCard />` with portrait placeholder → generated portrait swap
- [ ] `<ChapterCard />` with illustration placeholder → generated illustration
- [ ] `<StepAction />` button: idle / loading (named step) / error + retry / success
- [ ] Polling loop (`GET /api/projects/:id` every 2s while any step is `running`)
- [ ] Frontend component tests (Stepper states, StepAction error/loading)
- [ ] Stuck-step recovery affordance (Reset button when `stepStartedAt` is stale > 5min)

### Phase 4 — Polish & Docs (Day 3, ~4h)
- [ ] Match Gradion Design System tokens (Orange `#FF6B00`, Noto Sans, card styles from `app-demo.html`)
- [ ] Empty states, responsive layout, keyboard-accessible buttons
- [ ] `README.md` (full setup instructions)
- [ ] `DECISIONS.md` (6 decisions + ≥3 AI overrides)
- [ ] `TESTING.md` (strategy + real test run output pasted)
- [ ] `start.sh` + `test.sh`
- [ ] Full end-to-end manual walkthrough with real Gemini calls
- [ ] Final git commit push

---

## Testing Strategy

### Backend (Jest + ts-jest)
- Pipeline step ordering (cannot run step N before N-1 succeeds)
- Hard cap enforcement (characters capped at 2, chapters at 1)
- Duplicate call guard (second `run` during `running` → 409)
- Retry after failure (failed step → retry only that step, others untouched)
- Stuck step reset (reset endpoint sets `pending`)
- Atomic write doesn't corrupt state

### Frontend (React Testing Library + Jest)
- `<Stepper />` renders correct states (done/current/pending) for each step index
- `<StepAction />` shows spinner + step name during loading
- `<StepAction />` shows error message + Retry button on failure
- `<ProjectRow />` shows correct status pill (Draft / In Progress / Done)

### Integration (optional bonus)
- Happy-path mock: steps 0–4 with mocked Gemini responses

---

## Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key_here
SESSION_SECRET=a_random_32_char_secret_string
STORAGE_PATH=./storage
```

---

## Key Constraints Checklist

- [x] Max 2 characters — server-side slice before save
- [x] Max 1 chapter — server-side slice before save
- [x] Resumable — state.json on disk, survives restart
- [x] No duplicate Gemini calls — 409 guard on `running` state
- [x] Stuck-step recovery — `/reset` endpoint + UI Reset button
- [x] Book text sent once — Files API `fileUri` stored and reused
- [x] No auto-retry loops — retries are user-triggered only
- [x] One start command — `./start.sh`
- [x] One test command — `./test.sh`
- [x] `.env.example` — no real secrets committed
- [x] AI artifacts in repo — `AGENTS.md`, `CLAUDE.md`, `docs/`
- [x] `DECISIONS.md` with ≥3 AI overrides
