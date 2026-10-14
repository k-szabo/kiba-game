---
name: kiba-gameplay-change
description: Change Kiba combat, movement, progression, levels, or encounter transitions with targeted gameplay and route verification.
---

- Trace owning modules using docs/DEVELOPMENT.md. Establish requested before/after behavior and affected spawn, damage, death, shrine, pause, boss-phase, or realm transitions.
- Preserve permanent progression and saved IDs within one release. The alpha/beta release policy intentionally resets old-release progress; never bypass that reset by migration. Keep optional secrets distinct from required progression.
- Make scoped changes in assigned sources; coordinate shared game.js, combat.js, levels.js, and prologue.js ownership.
- Add meaningful regression cases when warranted. Use scripts/test-harness.cjs; test-save-validation.cjs and test-only-bootstrap.cjs are helpers, not standalone test suites.
- Select affected checks: combat; v05/v06 boss/relic systems; routes for geometry/abilities; prologue/shadow animation; polish for spawn/pause/platform behavior. Run npm test for changes spanning systems.
- Hand source edits/results to the integrator for final runtime generation and current-runtime checks. Keep test/debug state out of production.
- If QA rejected this work, apply kiba-qa-rework before source or test edits.
