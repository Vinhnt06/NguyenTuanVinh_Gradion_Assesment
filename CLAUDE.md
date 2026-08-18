# Book Illustration Studio — Project Guide & Rules

## Project Summary
Take-home assessment for Gradion Software Engineering Intern role. A web app turning book text into character portraits and chapter illustrations using the Gemini API across a 5-step pipeline.

## Build & Test Commands
- Start application: `./start.sh`
- Run tests: `./test.sh`

## Code Guidelines & Standards
- Keep it simple and lean. Avoid over-engineering.
- Server-side hard caps: Max 2 characters, Max 1 chapter.
- State persistence: Pipeline must resume smoothly after server restart or page refresh.
- Concurrency control: Guard against duplicate Gemini API calls for in-flight steps.
- AI Override Tracking: Document all AI overrides in `DECISIONS.md`.
