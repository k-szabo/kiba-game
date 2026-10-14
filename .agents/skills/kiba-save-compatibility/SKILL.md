---
name: kiba-save-compatibility
description: Change or investigate Kiba encrypted local saves, validation, progression serialization, or legacy migrations.
---

- Trace save-vault.js, persist()/startGame() in game.js, level IDs/rests/flags, and docs/DEVELOPMENT.md. Current v2 saves use profile-local HKDF/AES-GCM and IndexedDB with a localStorage copy.
- Separate valid records, supported legacy migrations, invalid input, and unavailable-storage paths. Preserve progress and established migrations; do not accept impossible stats or discard progress to simplify a repair.
- Use synthetic fixtures. scripts/test-save-validation.cjs exports a validator helper; the gameplay harness mocks SaveVault. Neither is an encryption/IndexedDB integration test.
- Use a fresh browser profile for actual roundtrip/reload and storage checks. Never use/export/clear the user's live saved game for a test.
- Client encryption protects stored records within its design; do not claim a player-controlled browser is cheat-proof. A new authoritative backend is a separate architectural task.
- Report migration/validation coverage, browser evidence, and limits. Hand schema/source/docs changes to the integrator.
- If QA rejected this work, apply kiba-qa-rework before edits.
