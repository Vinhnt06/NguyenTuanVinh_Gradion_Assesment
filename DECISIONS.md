# Architectural Decisions

> Candidate: Tuấn Vinh Nguyễn | Gradion Intern SE Assessment — Book Illustration Studio

---

## Decision 1: Next.js as Full-Stack Framework

**Who proposed it:** I chose Next.js after evaluating 3 options (Next.js, Express+React, Python FastAPI+React).

**Reasoning:** The spec requires "one command starts the stack." Next.js App Router unifies the backend (API Routes) and frontend (React) in a single project. A single `npm run dev` (wrapped in `./start.sh`) satisfies this requirement without `concurrently`, proxy configs, or CORS setup. The Gemini JS SDK (`@google/generative-ai`) is well-supported in Node.js, making integration straightforward.

**AI override:** Gemini AI initially proposed Python FastAPI for the backend, citing its excellent Gemini SDK and type safety via Pydantic. I pushed back: my production experience is in JavaScript/TypeScript, and mixing two runtimes (Python + Node) would complicate the `./start.sh` and `./test.sh` scripts significantly for reviewers. Sticking with one language across the stack reduces onboarding friction. Cost accepted: Next.js App Router has more "magic" than Express, particularly around caching and RSC boundaries. Mitigated by keeping all pipeline logic in `lib/` outside of Next.js conventions.

---

## Decision 2: JSON Files on Disk Instead of a Database

**Who proposed it:** My call after weighing SQLite and PostgreSQL.

**Reasoning:** The spec explicitly says "JSON files on disk genuinely fit this scope, if done properly." For a local-only, single-user-at-a-time assessment app, a relational DB adds a migration step, a Prisma schema, and a `docker-compose.yml` that reviewers must run. JSON files need nothing. State is isolated per `storage/users/<userId>/projects/<projectId>/state.json`. Atomic writes (write to `.tmp` → rename) prevent partial state corruption on crash.

**AI override:** Gemini AI flagged concurrent write safety and suggested adding a Redis-based lock. For a local single-process app with zero horizontal scaling, Redis is massive overkill. I implemented a lightweight in-memory async mutex (one lock per `projectId`) that serializes writes within the process. The real cost I accepted: no ACID transactions. If the process crashes between the temp-file write and the rename, the state may be stale. Acceptable risk for a local assessment; I documented this in comments.

---

## Decision 3: Splitting `status` and `stepStates` (AI Override)

**Who proposed it:** Gemini AI proposed a single `status` enum: `draft | running | done | failed`.

**Why I pushed back:** A single enum cannot express intermediate states like "Step 2 done, Step 3 currently running, Steps 4–5 pending." The spec explicitly requires showing *which step* is running, not a bare spinner. After a server restart, we need to know exactly which step was in-flight, not just that "something was running."

**What I implemented instead:** Two separate fields:
- `stepStates`: a per-step map `{ "0": "done", "1": "done", "2": "running", "3": "pending", "4": "pending" }`  
- `status`: a project-level summary computed from `stepStates` for the project list view

**Cost:** Two fields to keep in sync. A stranded `stepStates[N] = "running"` needs the `/reset` endpoint to clear it. Mitigated by storing `stepStartedAt` so the UI can detect staleness (>5 minutes → show "Step appears stuck" warning).

---

## Decision 4: Gemini Files API for Book Context (AI Override)

**Who proposed it:** Gemini AI proposed starting a Gemini multi-turn Chat session to chain context across all 5 steps.

**Why I pushed back:** Chat sessions are in-memory and tied to the server process. They are destroyed on server restart — which directly violates the "resumable after server restart" requirement. If the user runs Step 2 today and the server restarts, the chat session is gone. There is no way to resume Step 3 tomorrow.

**What I implemented instead:** Gemini Files API. On project creation, the book text is uploaded once (`POST https://generativelanguage.googleapis.com/upload/v1beta/files`). The returned `fileUri` is stored in `state.json`. Every subsequent step references this `fileUri` instead of re-sending raw text. The Files API retains files for 48 hours, which is more than sufficient for a 5-step pipeline. `fileUri` survives any number of server restarts because it's persisted on disk.

**Cost:** Dependency on Files API availability. If the file expires (>48h) before the pipeline completes, subsequent steps will fail. Mitigated by a clear error message and a "re-upload book" affordance. For normal usage (pipeline completed in <24h) this is not a practical concern.

---

## Decision 5: Server-Side 409 Guard for Duplicate Calls (AI Override)

**Who proposed it:** I designed the duplicate-call guard. Gemini AI's initial implementation put a `disabled` attribute on the Run button and a `localStorage` flag to prevent double-clicks.

**Why I pushed back:** The spec called this out explicitly — the demo's `localStorage` guard lives in one browser tab, which is not where the real guard belongs. `localStorage` does nothing if the user opens a second tab or refreshes. The guard must live on the server.

**What I implemented instead:** Before starting any Gemini call, the API route checks `state.stepStates[step] === 'running'`. If true, it returns `409 Conflict` immediately — no Gemini call is made, no state is mutated. Only after persisting `stepStates[step] = 'running'` to disk does the route proceed with the async Gemini call. This makes the check durable: even a cold server restart will read the correct `running` state from disk and reject duplicates.

**Cost:** A race condition exists between the read-check and the write-and-lock if two requests arrive within milliseconds. Mitigated by the per-project async mutex in `lib/storage.ts` that serializes all writes.

---

## Decision 6: Polling Over SSE for Real-Time Updates (MVP Scope)

**Who proposed it:** I chose polling for the MVP. The spec's bonus section mentions SSE/WebSocket as a nice-to-have.

**Reasoning:** The spec warns that real Gemini calls take 10–30s+ (longer for images). The UI must show which step is running. A 2-second polling interval on `GET /api/projects/:id` is sufficient to give users timely feedback without complex infrastructure. Next.js API routes don't natively support SSE without additional setup (streaming responses), which adds implementation time.

**Cost:** ~2s lag between a step completing and the UI updating. Up to 15 extra requests during a 30s image generation. Acceptable for the assessment scope.

**One more day:** SSE would eliminate the polling lag and enable portrait-by-portrait reveal as each image lands — a dramatically better UX. See below.

---

## Decision 7: Plus Jakarta Sans / Geist & Motion Physics for Premium Refined UI (AI Override)

**Who proposed it:** Gemini AI initially suggested using standard Inter font and standard CSS transition utility classes to keep the bundle small.

**Why I pushed back:** Inter font is the #1 default AI cliché tell identified in the `@frontend-specialist` agent protocol. Similarly, static CSS transitions lack tactile spring feedback, making an AI generative studio feel static and cheap.

**What I implemented instead:** 
1. **Typography Upgrade:** Adopted `Plus_Jakarta_Sans` & `JetBrains_Mono` via Next.js `next/font/google` (zero render-blocking layout shifts) to deliver a distinct studio identity.
2. **Asymmetric Layout:** Redesigned the Login page into an asymmetric 70/50 split layout with dynamic brand highlights rather than a centered box.
3. **Tactile Spring Physics:** Integrated `motion/react` with spring physics for micro-interactions (`whileTap: scale(0.97)`, `whileHover: scale(1.02)`) and progressive stagger reveals (`whileInView`).

---

## Decision 8: Model Queue Rotation & 45s Timeout for Resilient Batch Image Generation (AI Override)

**Who proposed it:** AI initially used a single image model queue (`flux`) with a 25s HTTP timeout.

**Why I pushed back:** During Step 3 (Portraits), generating Character 1 and Character 2 back-to-back using the same model (`flux`) caused the public AI server to rate-limit Character 2, causing `This operation was aborted` errors at 25 seconds.

**What I implemented instead:** 
1. **Model Queue Rotation (`lib/gemini.ts`):** Character 0 rotates model priority `flux` ➔ `turbo` ➔ `sdxl`, while Character 1 rotates `turbo` ➔ `sdxl` ➔ `flux`. This routes back-to-back portrait requests to separate AI engine queues, eliminating queue contention.
2. **Extended Timeout (45s):** High-res 600x800 FLUX portraits require ~30–35s. Extended engine timeout from 25s to 45s to eliminate premature aborts.
3. **SVG Auto-Recovery Retry:** If an engine temporarily returns an SVG fallback, `lib/pipeline.ts` pauses 3 seconds and performs an automatic 2nd attempt in the backend before completing the step.

---

## Decision 9: Frosted Glass Status Badges & Fullscreen Image Lightbox Modal

**Who proposed it:** User requested enhanced status badge harmony and interactive image previewing.

**What I implemented:**
1. **Frosted Dark Glass Badges:** Replaced pastel badges over dark thumbnail images with dark frosted glass pills (`bg-[#0D0D10]/85 border-emerald-500/40 text-emerald-400 backdrop-blur-md`) for high contrast and visual elegance.
2. **Fullscreen Image Lightbox Modal:** Built `components/ui/ImageLightboxModal.tsx` rendered via React `createPortal` to `document.body`. Features 1-click **Copy AI Prompt**, **Download Image**, HD zoom, and keyboard ESC navigation.

---

## If You Had One More Day

If I had one more day, I would implement **Server-Sent Events (SSE) for real-time step progress** and **Interactive Canvas Cropping**.

Currently the UI polls `GET /api/projects/:id` every 2 seconds, which works cleanly but creates ~2s lag. SSE would push updates directly as each image lands on disk. Additionally, I would add a canvas cropping tool allowing users to tweak generated portraits directly in the studio workspace.

