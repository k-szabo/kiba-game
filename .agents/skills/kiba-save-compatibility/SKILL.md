---
name: kiba-save-compatibility
description: Change or investigate Kiba Realms encrypted local saves, validation, progression serialization, or alpha/beta release resets.
---

- Trace save-vault.js, persist()/startGame() in game.js, level IDs/rests/flags, and docs/DEVELOPMENT.md. Current v2 saves use profile-local HKDF/AES-GCM and IndexedDB with a localStorage copy; release identity is defined by assets/config/release.json.
- Preserve valid progress across compatible releases using the stable saveCompatibility epoch in assets/config/release.json. Reset only for an explicitly documented save-breaking change via the release CLI --reset-saves; ordinary releases retain the epoch. Bridge only the declared legacy anchor, never arbitrary older saves. Preserve language/keybinding preferences, verify atomic encrypted upgrades, compatible reloads, explicit reset, and stale-tab protection. See docs/SAVE-COMPATIBILITY.md.
- Use synthetic fixtures. scripts/test-save-validation.cjs exports a validator helper; the gameplay harness mocks SaveVault. Neither is an encryption/IndexedDB integration test.
- Use a fresh browser profile for actual roundtrip/reload and storage checks. Never use/export/clear the user's live saved game for a test.
- Client encryption protects stored records within its design; do not claim a player-controlled browser is cheat-proof. A new authoritative backend is a separate architectural task.
- Report release-reset/validation coverage, browser evidence, and limits. Hand schema/source/docs changes to the integrator.
- If QA rejected this work, apply kiba-qa-rework before edits.
