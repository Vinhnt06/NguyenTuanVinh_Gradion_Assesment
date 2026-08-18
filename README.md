# Book Illustration Studio — Gradion Assessment

> **Candidate:** Tuấn Vinh Nguyễn  
> **Role:** Software Engineering Intern (6-month contract) — Top 10 Take-Home Assessment  
> **Repository:** [GitHub Repository](https://github.com/Vinhnt06/NguyenTuanVinh_Gradion_Assesment)  
> **Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS | **Storage:** Atomic JSON on disk | **API:** Gemini REST & JS SDK

A fullstack web application that turns a book's text into character portraits and chapter scene illustrations using the Google Gemini API across a 5-step user-driven pipeline.

---

## 🛠️ Complete Tech Stack Architecture

| Layer | Technologies & Frameworks | Description |
|-------|---------------------------|-------------|
| **Frontend Framework** | **Next.js 14 (App Router)** | React 18, Server Components (RSC) & Client Components with strict TypeScript 5.7. |
| **Styling & Theme** | **Tailwind CSS v3.4** | Custom **Light Parchment Editorial Studio Theme** (`#F8F8F8`, `#F2EEE7`, `#231F20`, `#FF6B00`). |
| **Motion & Physics** | **Framer Motion / Motion 13** | Dynamic page transitions, spring micro-interactions, layout physics & viewport modals. |
| **Icons & Portals** | **Phosphor Icons & React Portals** | Studio icon set and `createPortal` lightbox modals floating directly on `document.body`. |
| **Backend Runtime** | **Node.js 20+ / Next.js API Routes** | Unified fullstack API handlers (`app/api/*`) for auth, projects, pipeline, and key management. |
| **Auth & Session** | **JWT & SHA-256 Hashing** | Passwordless email hash identification with HTTP-Only secure session cookies (`lib/auth.ts`). |
| **AI Text Engine** | **Google Gemini API SDK** | `@google/generative-ai` calling **Gemini 1.5 / 3.6 Flash** for structured JSON extraction & art style analysis. |
| **AI Image Engine** | **Pollinations Multi-Engine Queue** | Multi-model priority rotation (`flux` ➔ `turbo` ➔ `sdxl`) with 45s HTTP timeout and SVG auto-recovery. |
| **Storage Engine** | **Atomic JSON File Storage** | File-based storage (`storage/users/<userId>/projects/<projectId>/state.json`) with POSIX atomic rename and per-project async write-mutex lock (`lib/storage.ts`). |
| **Testing Harness** | **Jest 29 & React Testing Library** | 16/16 Unit & Integration Tests PASS across storage, pipeline caps, conflict guards, and UI components (`__tests__/`). |

---

## ⚡ Evaluator Quick-Start (Zero Config Required)

### Option A: Interactive UI Key Configuration (Recommended)
1. Launch the app in one single command:
   ```bash
   ./start.sh
   ```
2. Open **`http://localhost:3000`** in your browser.
3. If no key is set, the **Evaluator API Key Modal** pops up automatically. Or click the glowing **`⚠️ API Key Required — Click to Configure`** badge in the top navigation bar.
4. Paste your free Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey) and click **"Validate & Save API Key"**.
5. The key is validated live with Google and stored securely in your session cookie. You can immediately create and run book illustration pipelines!

### Option B: Traditional `.env` Setup
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Insert your Gemini API key in `.env`:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   SESSION_SECRET=gradion_secret_key_2026
   STORAGE_PATH=./storage
   ```
3. Start the application:
   ```bash
   ./start.sh
   ```

---

## 🧪 Automated Testing

Run the full automated backend & frontend unit test suite:
```bash
./test.sh
```
*Output: 16/16 Unit Tests PASS 100% across pipeline states, atomic storage, server-side caps, concurrency guards, and component rendering.*

---

## 🎨 5-Step Pipeline Architecture

The pipeline follows Google's Gemini notebook workflow (`Book_illustration.ipynb`):

1. **Step 1: Art Style** — Auto-generated from book text analysis or optionally supplied by the user.
2. **Step 2: Character Prompts** — Structured JSON extraction of main adult characters (**hard-capped to Max 2**).
3. **Step 3: Character Portraits** — Generates 1 portrait image per character (3:4 ratio).
4. **Step 4: Chapter Prompts** — Structured JSON extraction of chapter illustration prompts referencing characters (**hard-capped to Max 1**).
5. **Step 5: Scene Illustrations** — Generates 1 scene illustration for the chapter (16:9 ratio), reusing character visual consistency.

---

## 🌟 Interactive UI Highlights & Bonus Features (§08)

- **1-Click Sample Public-Domain Literature Presets (Bonus §08):** At `/projects/new`, evaluators can select from 3 pre-configured literature cards (*The Wind in the Willows*, *20,000 Leagues Under Sea*, *Alice in Wonderland*) to instantly auto-fill book title and text without searching for `.txt` files.
- **Fullscreen Image Lightbox Modal:** Clicking any character portrait or chapter illustration opens an HD preview modal with 1-click **Copy AI Prompt**, **Download Image**, and **Re-gen AI Picture** buttons.
- **Inline Project Title Editing:** Evaluators can click the pencil icon ✏️ next to the active project title in the Studio Workspace to rename the project live with atomic disk persistence.
- **Frosted Dark Glass Badges:** Floating status pills over card thumbnails for sleek editorial contrast.

---

## 🔑 Key Engineering Directives & Resilience Features

- **Multi-Model Gemini Fallback (`lib/gemini.ts`):** Automatically recovers if Google Free Tier daily quota limit (20 RPD) is reached by dynamically switching: `gemini-3.7-flash` ➔ `gemini-3.6-flash` ➔ `gemini-3.5-flash-lite`.
- **Model Queue Rotation & 45s Timeout:** Back-to-back portrait calls rotate priority queues (`flux` ➔ `turbo` ➔ `sdxl`) with extended 45s timeouts to prevent engine congestion.
- **Single-Card AI Image Regeneration:** Allows evaluators to click **"Re-gen AI Picture"** directly on any individual character or chapter card to generate a brand new image variation.
- **Resumability:** Project state and generated artwork are saved atomically to disk (`storage/users/<userId>/projects/<projectId>/state.json`). Refreshing the browser or restarting the server mid-pipeline preserves exact state without data loss.
- **Server-Side Hard Caps:** Backend strictly enforces **Max 2 characters** and **Max 1 chapter** (`lib/pipeline.ts`).
- **Duplicate Call Guard (409 Conflict Shield):** If a step is currently `running`, any concurrent request returns `409 Conflict` immediately before invoking external APIs.
- **Stuck Step Recovery:** Provides explicit step reset mechanism (0s manual reset & 90s server auto-timeout) if stranded in `running` state.
- **Cost Discipline:** Book text is uploaded once via the Gemini Files API (`fileUri`) and reused across steps.

---

## 📂 Deliverables Checklist

- `README.md` — Project architecture & evaluator startup guide
- `DECISIONS.md` — Architectural trade-offs & 4 explicit AI overrides (9 decisions total)
- `TESTING.md` — Testing strategy & real terminal test report (16/16 PASS)
- `.github/workflows/ci.yml` — Automated GitHub Actions CI pipeline
- `start.sh` — Single command to install & launch app
- `test.sh` — Single command to run test suite
- `.env.example` — Environment template (no secrets committed)
- `AGENTS.md`, `CLAUDE.md` — AI context artifacts
- `docs/brainstorm.md`, `docs/plan.md` — Planning artifacts
