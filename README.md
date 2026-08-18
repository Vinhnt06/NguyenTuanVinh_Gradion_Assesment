# Book Illustration Studio — Gradion Assessment

> **Candidate:** Tuấn Vinh Nguyễn  
> **Role:** Software Engineering Intern (6-month contract)  
> **Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS | **Storage:** Atomic JSON files on disk | **API:** Gemini REST & JS SDK

A fullstack web application that turns a book's text into character portraits and chapter scene illustrations using the Google Gemini API across a 5-step user-driven pipeline.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18.x or v20.x recommended)
- A Google Gemini API Key (get a free key at [Google AI Studio](https://aistudio.google.com/))

### 2. Environment Setup
Copy `.env.example` to `.env` and insert your Gemini API Key:
```bash
cp .env.example .env
```
Edit `.env`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
SESSION_SECRET=gradion_secret_key_2026
STORAGE_PATH=./storage
```

### 3. One Command to Start
Run the start script to install dependencies and start the app on `http://localhost:3000`:
```bash
./start.sh
```

### 4. One Command to Test
Run all backend and frontend unit tests:
```bash
./test.sh
```

---

## 🎨 5-Step Pipeline Architecture

The pipeline follows Google's Gemini notebook workflow (`Book_illustration.ipynb`):

1. **Step 1: Art Style** — Auto-generated from book text analysis or optionally supplied by the user.
2. **Step 2: Character Prompts** — Structured JSON extraction of main adult characters (**hard-capped to Max 2**).
3. **Step 3: Character Portraits** — Generates 1 portrait PNG image per character.
4. **Step 4: Chapter Prompts** — Structured JSON extraction of chapter illustration prompts referencing characters (**hard-capped to Max 1**).
5. **Step 5: Scene Illustrations** — Generates 1 scene illustration PNG for the chapter, reusing character visual consistency.

---

## 🔑 Key Engineering Decisions & Behaviors

- **Resumability:** All project state and generated images are saved to local filesystem storage (`storage/users/<userId>/projects/<projectId>/state.json`). Refreshing the browser, logging out, or restarting the server mid-pipeline preserves exact state without data loss.
- **Server-Side Hard Caps:** Restricts character count to **Max 2** and chapter count to **Max 1** at the backend level (`lib/pipeline.ts`).
- **Duplicate Call Guard (409 Conflict):** If a step is currently `running`, any concurrent/duplicate request returns `409 Conflict` immediately before making Gemini API calls.
- **Stuck Step Recovery:** If a step remains stranded in `running` state (e.g. server process killed mid-call), the UI displays a warning with a **"Reset Step"** button to restore it to `pending`.
- **Cost Discipline:** Book text is uploaded once via the Gemini Files API (`bookFileUri`) and referenced across subsequent steps, avoiding re-sending raw book text on every step.

---

## 🌟 Bonus Features Implemented (§08)

- **Automated CI/CD Pipeline (`.github/workflows/ci.yml`):** Runs ESLint, `./test.sh` test suite, and Next.js production build automatically on every push and pull request to `main`.

---

## 📂 Deliverables Checklist

- `README.md` — Project architecture & startup guide
- `DECISIONS.md` — Architectural trade-offs & ≥3 explicit AI overrides
- `TESTING.md` — Testing strategy & real terminal test report
- `.github/workflows/ci.yml` — Automated GitHub Actions CI pipeline
- `start.sh` — Single command to install & launch app
- `test.sh` — Single command to run test suite
- `.env.example` — Environment template (no secrets committed)
- `AGENTS.md`, `CLAUDE.md` — AI context artifacts
- `docs/brainstorm.md`, `docs/plan.md` — Planning artifacts
