---
name: kiba-browser-qa
description: Verify Kiba UI, rendering, input, or browser storage with real browser evidence beyond mocked VM tests.
---

- Serve the repo over localhost HTTP, including a /kiba-game/ subpath when checking Pages paths. Use available browser automation and a fresh temporary profile with synthetic saves.
- Select relevant checks. UI: HU/EN, with/without Continue, keyboard focus/order, help/language controls, narrow screens. Art: relevant realm/phase, bright/dark backgrounds, crops/grounding, warning/impact, pause/reduced motion. Saves: actual reload, IndexedDB, migration/rejection paths.
- Use desktop and narrow/touch layouts; add short landscape and zoom checks for layout changes. Check reachable controls and no horizontal clipping; vertical scrolling is acceptable when necessary.
- Store focused screenshots/reports under .codex/work/. Record viewport, language, state, repro steps, console errors, and failed asset requests.
- Prefer normal user flows. If a private seam is necessary, inject it into a test-served copy only; never commit mutable game/debug exports in runtime.js.
- A screenshot only proves its captured state. Distinguish browser checks, VM checks, and untested cases.
- Report rejected work through kiba-qa-rework; do not repair production code while acting as QA.
