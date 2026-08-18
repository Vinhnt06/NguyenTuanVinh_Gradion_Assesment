# Book Illustration Studio — Gradion Assessment

> **Candidate:** Tuấn Vinh Nguyễn  
> **Role:** Software Engineering Intern (6-month contract) — Top 10 Take-Home Assessment  
> **Repository:** [GitHub Repository](https://github.com/Vinhnt06/NguyenTuanVinh_Gradion_Assesment)  
> **Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS | **Storage:** Atomic JSON on disk | **API:** Gemini REST & JS SDK

A fullstack web application that turns a book's text into character portraits and chapter scene illustrations using the Google Gemini API across a 5-step user-driven pipeline.

---

## ⚡ Evaluator Quick-Start (Zero Config Required)

### Option A: Interactive UI Key Configuration (Recommended)
1. Launch the app in one command:
   ```bash
   ./start.sh
   ```
2. Open **`http://localhost:3000`** in your browser.
3. Click the glowing **`⚠️ API Key Required — Click to Configure`** badge in the top navigation bar.
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
*Output: 16/16 Unit Tests PASS 100% across pipeline states, atomic storage, and component rendering.*

---

## 🎨 5-Step Pipeline Architecture

The pipeline follows Google's Gemini notebook workflow (`Book_illustration.ipynb`):

1. **Step 1: Art Style** — Auto-generated from book text analysis or optionally supplied by the user.
2. **Step 2: Character Prompts** — Structured JSON extraction of main adult characters (**hard-capped to Max 2**).
3. **Step 3: Character Portraits** — Generates 1 portrait image per character (3:4 ratio).
4. **Step 4: Chapter Prompts** — Structured JSON extraction of chapter illustration prompts referencing characters (**hard-capped to Max 1**).
5. **Step 5: Scene Illustrations** — Generates 1 scene illustration for the chapter (16:9 ratio), reusing character visual consistency.

---

## 🔑 Key Engineering Directives & Resilience Features

- **Multi-Model Gemini Fallback (`lib/gemini.ts`):** Automatically recovers if Google Free Tier daily quota limit (20 RPD) is reached by dynamically switching: `gemini-3.7-flash` ➔ `gemini-3.6-flash` ➔ `gemini-3.5-flash-lite`.
- **Multi-Engine AI Image Fallback:** Generates real HD pictures across Imagen REST, FLUX.1, Turbo, and SDXL models with 3:4 portrait and 16:9 landscape aspect ratio support, falling back gracefully to SVG vector cards if offline.
- **Single-Card AI Image Regeneration:** Allows evaluators to click **"Re-gen AI Picture"** directly on any individual character or chapter card to generate a brand new image variation.
- **Resumability:** Project state and generated artwork are saved atomically to disk (`storage/users/<userId>/projects/<projectId>/state.json`). Refreshing the browser or restarting the server mid-pipeline preserves exact state without data loss.
- **Server-Side Hard Caps:** Backend strictly enforces **Max 2 characters** and **Max 1 chapter** (`lib/pipeline.ts`).
- **Duplicate Call Guard (409 Conflict Shield):** If a step is currently `running`, any concurrent request returns `409 Conflict` immediately before invoking external APIs.
- **Stuck Step Recovery:** Provides explicit step reset mechanism if stranded in `running` state.
- **Cost Discipline:** Book text is uploaded once via the Gemini Files API (`fileUri`) and reused across steps.

---

## 📂 Deliverables Checklist

- `README.md` — Project architecture & evaluator startup guide
- `DECISIONS.md` — Architectural trade-offs & ≥3 explicit AI overrides
- `TESTING.md` — Testing strategy & real terminal test report
- `.github/workflows/ci.yml` — Automated GitHub Actions CI pipeline
- `start.sh` — Single command to install & launch app
- `test.sh` — Single command to run test suite
- `.env.example` — Environment template (no secrets committed)
- `AGENTS.md`, `CLAUDE.md` — AI context artifacts
- `docs/brainstorm.md`, `docs/plan.md` — Planning artifacts
