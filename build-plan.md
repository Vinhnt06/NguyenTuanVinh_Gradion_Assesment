# Book Illustration Studio — Build Plan

> **Stack:** Next.js 14 (App Router) + TypeScript | **Storage:** JSON files on disk | **API:** Gemini JS SDK
> **Deadline:** 3 days | **Est. effort:** ~16h

---

## ✅ DONE (Pre-build)
- [x] Git repo initialized & pushed → `git@github.com:Vinhnt06/NguyenTuanVinh_Gradion_Assesment.git`
- [x] `.gitignore` configured
- [x] `AGENTS.md`, `CLAUDE.md` — AI artifacts committed
- [x] `docs/brainstorm.md` — 6 key decisions documented
- [x] `DECISIONS.md` — ≥3 AI overrides documented
- [x] `docs/plan.md` — architecture, state schema, API table

---

## PHASE 1 — Foundation (Day 1 Morning, ~3h)

- [ ] **P1-1:** Run `npx create-next-app@latest ./` with TypeScript + App Router → Verify: `npm run dev` opens on `localhost:3000`
- [ ] **P1-2:** Create `.env.example` with `GEMINI_API_KEY` + `SESSION_SECRET` + `STORAGE_PATH` → Verify: file exists, no real values
- [ ] **P1-3:** Write `lib/storage.ts` — atomic JSON read/write (temp→rename) + per-project async mutex → Verify: unit test passes
- [ ] **P1-4:** Write `lib/auth.ts` — JWT cookie session (email+name → userId, no password) → Verify: `POST /api/auth` returns token cookie
- [ ] **P1-5:** Build Identity screen `/` (Email + Name form with validation) → Verify: invalid email shows error, valid submits OK
- [ ] **P1-6:** Build `GET /api/projects` + `POST /api/projects` (create project, upload/paste book text) → Verify: project state.json created on disk
- [ ] **P1-7:** Build Project list screen `/projects` (title, date, status pill, empty state) → Verify: renders with mock data
- [ ] **P1-8:** Write first backend tests — pipeline ordering + storage atomic write → Verify: `./test.sh` passes

---

## PHASE 2 — Gemini Pipeline Backend (Day 1 Afternoon, ~4h)

- [ ] **P2-1:** Write `lib/gemini.ts` — text model wrapper (`gemini-2.0-flash`) + structured JSON output helper → Verify: test call returns parsed JSON
- [ ] **P2-2:** Write `lib/gemini.ts` (image) — image model wrapper (`imagen-3.0-generate-002`), save PNG to disk → Verify: file appears in `storage/`
- [ ] **P2-3:** Upload book text on project creation via Gemini Files API → get `fileUri` → store in `state.json` → Verify: `state.json` has `bookFileUri` field
- [ ] **P2-4:** Write `lib/pipeline.ts` — Step 0 (Style): call text model with fileUri → save result → Verify: `stepStates["0"] === "done"` after call
- [ ] **P2-5:** Write Step 1 (Characters): structured JSON output, **cap to max 2**, save → Verify: returns max 2 even if model returns more
- [ ] **P2-6:** Write Step 2 (Portraits): loop per character, save PNG per portrait → Verify: 2 PNG files appear on disk
- [ ] **P2-7:** Write Step 3 (Chapters): structured JSON output, **cap to max 1**, save → Verify: returns exactly 1 chapter
- [ ] **P2-8:** Write Step 4 (Illustrations): 1 image for the chapter → Verify: 1 PNG file appears on disk
- [ ] **P2-9:** `POST /api/projects/:id/steps/:step/run` — 409 guard on `running` state → Verify: second call returns 409 immediately
- [ ] **P2-10:** `POST /api/projects/:id/steps/:step/reset` — reset stuck step → Verify: `stepStates[step]` becomes `"pending"`
- [ ] **P2-11:** `GET /api/projects/:id/images/:filename` — serve static images → Verify: curl returns PNG bytes

---

## PHASE 3 — Frontend Pipeline UI (Day 2, ~5h)

- [ ] **P3-1:** Build `/projects/new` — title input + file upload (.txt) + paste textarea + validation → Verify: empty fields show errors
- [ ] **P3-2:** Build `<Stepper />` component — 5 steps, done ✓ / current ● / pending ○ → Verify: renders correct state for each step index
- [ ] **P3-3:** Build `<CharacterCard />` — name, prompt text, portrait placeholder → portrait image on load → Verify: shows placeholder then swaps to image
- [ ] **P3-4:** Build `<ChapterCard />` — chapter name, prompt text, illustration → Verify: same pattern as CharacterCard
- [ ] **P3-5:** Build `<StepAction />` — button idle / spinner+step-name / error+retry / success → Verify: all 4 states render correctly
- [ ] **P3-6:** Build `/projects/[id]` page — title, date, book text (full, readable), stepper, character cards, chapter cards, StepAction → Verify: full pipeline visible
- [ ] **P3-7:** Add polling loop — `GET /api/projects/:id` every 2s while any step is `running` → Verify: UI updates after step completes without manual refresh
- [ ] **P3-8:** Stuck-step recovery UI — if `stepStartedAt` > 5min → show "Step appears stuck" + Reset button → Verify: Reset button calls `/reset` endpoint
- [ ] **P3-9:** Sign out button — clear session cookie + redirect to `/` → Verify: back to identity screen after sign out
- [ ] **P3-10:** Frontend component tests — `<Stepper />` states, `<StepAction />` loading/error, `<ProjectRow />` status pill → Verify: `./test.sh` FE tests pass

---

## PHASE 4 — Polish & Deliverables (Day 3, ~4h)

- [ ] **P4-1:** Apply Gradion Design System tokens from `app-demo.html` — Orange `#FF6B00`, Noto Sans, card styles, status pills → Verify: visually matches/beats the demo
- [ ] **P4-2:** Responsive layout, keyboard-accessible buttons, empty/loading/error states on all screens → Verify: works at 375px mobile width
- [ ] **P4-3:** Write `start.sh` + `test.sh` → Verify: `./start.sh` starts app; `./test.sh` runs all tests
- [ ] **P4-4:** Write `README.md` — prerequisites, env vars, architecture overview, start & test commands → Verify: reviewer can follow instructions cold
- [ ] **P4-5:** Write `TESTING.md` — strategy (FE+BE) + paste real test run output → Verify: contains actual test output, not invented
- [ ] **P4-6:** Final real Gemini API end-to-end walkthrough → all 5 steps complete → Verify: illustrations are generated
- [ ] **P4-7:** Security check — no API key in any committed file → Verify: `git grep GEMINI_API_KEY` returns only `.env.example`
- [ ] **P4-8:** Final push to GitHub → Verify: GitHub repo clean, contributor = Vinhnt06 only

---

## Done When
- [ ] `./start.sh` starts app with zero extra steps
- [ ] `./test.sh` runs all FE + BE tests (green)
- [ ] All 5 pipeline steps work end-to-end with real Gemini API
- [ ] Resume works: kill server mid-step, restart, project shows correct state
- [ ] Double-click guard: second "Run" during running step → no duplicate API call
- [ ] `DECISIONS.md` has 6 decisions + ≥3 AI overrides + one-more-day answer
- [ ] GitHub repo: only `Vinhnt06` as contributor, incremental commits

---

## Commit Conventions (Gradion Assessment)
```
feat: <what was built>           # new feature/screen
fix: <what was fixed>            # bug fix
test: <what was tested>          # test additions
docs: <what was documented>      # docs only
chore: <setup/config>            # scripts, env, setup
```

## Notes
- **Commit after each PHASE** — milestone commits, not per-task
- **NEVER commit `.env`** — only `.env.example`
- **Images served via `/api/projects/:id/images/:filename`** — not as static assets
- **Gemini rate limits:** imagen model has tighter free-tier limits — check before portrait loops
- **Files API TTL:** 48h — enough for pipeline lifetime
