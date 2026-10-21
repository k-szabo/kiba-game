# Secret grave encounter — developer reference

This document contains deliberate spoilers and is not linked from the player guide. Trello: https://trello.com/c/brUPwH97. Implementation branch: `FEATURE-doom-slayer-easter-egg`.

## Entry and persistence

Yomi's optional upper annex starts west of the arrival platform. Its fire seal uses the same Dawnblade interaction as the sky realm: defeating Yomi alone does not open it; an actual sword strike records `slayerSeal`. Ten alternating steps climb to the arena at world Y = −1700, spanning X = 100–1600 (half the original width). The stairs and their return route are unchanged. The grave at X = 850, guardian at X = 1250 and both rewards remain inside that floor. Camera bounds extend upward, while the ordinary map keeps its existing scale. The annex stays absent from both maps, compass objectives and public release hints, including after discovery.

The grave opens a native text-input dialog. The incantation is `iddqd` (trimmed, case-insensitive); it has no visible hint. A wrong answer stays in the dialog. Correct input opens a high-contrast danger warning; acknowledging it summons the guardian and records `slayerSummoned`. Typing never reaches gameplay bindings. Leaving, dying or travelling invalidates stale confirmation callbacks. Once summoned, the undefeated guardian and nine fresh barrels remain visible between attempts; entering the arena restarts combat without another incantation. Death clears active hazards, spilled oil, projectiles and captures, restores full guardian HP and rebuilds barrels. A dev replay carries its in-memory replay marker through that reset even if permanent victory was already recorded.

`guardian:doomSlayer` records victory. Normal death, shrine rest and realm reentry preserve it. Neither victory nor developer replay changes main boss progression, the level cap, bonus stats, XP or coins. Daisy and the crossbow are separate physical pickups (`daisyPlush`, `slayerCrossbow`), saved independently of victory and shown by the common inventory renderer. The crossbow cannot be equipped or fired by Momo. Normal saves reject these rewards without the guardian flag, and reject grave progression before Yomi victory. Developer inventory remains an isolated, non-saving test character.

## Combat

The encounter deliberately targets an endgame challenge beyond the current level-30 player cap; it has 260 HP. It remains vulnerable during all attacks and its saw startup. The front shield blocks normal strikes during grounded waiting and recovery; heavy and rear/overhead strikes bypass that guard. Guard facing follows the actual pursuit facing in both hit detection and rendering. Moves cycle through flail, barrel puncture, fire arrow, lightning, kick, arrow rain, double jump, grab and explosion. The grab executes only after an actual successful hit against Momo at three HP or less; dash, ordinary invulnerability and developer invincibility still apply.

Ground pursuit is 480 world pixels per second, or 620 with the saw ready. The guardian closes in during both waiting and recovery, stops at 130 pixels of centre distance without overshooting, and cannot pursue while stunned. Horizontal double-jump movement is 460 pixels per second; the saw rush is 720. Moving recovery uses the existing walk poses rather than sliding a stationary attack pose. Ordinary windups last 0.30–0.48 seconds and strikes last 0.24 seconds; double jump retains its physical arc (up to 1.85 seconds) and saw rush lasts 0.65 seconds. Three attacks form a chain with 0.12-second follow-ups, followed by a 0.45-second guarded recovery and a 0.12-second closing step. Damage, HP and the full five-second saw startup are unchanged. Lightning retains a separate 0.38-second ground warning plus its stagger, and explosion has a 0.4-second ground warning.

The first attack is chosen after a 0.45-second opening approach: beyond 230 pixels of centre distance it fires a flaming arrow; at close range it uses the flail. The next cycle still punctures a barrel and then fires at its oil. Later melee selections also recheck distance and use a ranged follow-up when Momo has retreated beyond reach. Flaming arrows travel at up to 760 horizontal world pixels per second, and arrow rain falls at 980; short oil shots use a minimum 0.12-second flight.

Nine barrels span the arena at 8–92% of its width. Puncture selects the nearest unused barrel, and fire arrows target the nearest unlit oil pool. The launch velocity accounts for arrow gravity over a fixed flight time; cross-arena shots keep enough lifetime to reach their target. Oil size, safe ground, damage, ignition warning and fire lifetime are unchanged. Leaving, death and developer replay clear or recreate the same finite encounter resources.

At 30% HP it retreats and starts a full five-second saw cast, once per attempt. Damage does not raise or clamp its HP to the threshold. A lethal hit during casting still wins. Once ready, saw contact deals damage, briefly holds Momo, heals the guardian by 20 and adds one armour (maximum eight). Each armour subtracts one incoming damage, with a 0.25 damage floor. Healing/armour require a real hit; invulnerability does not feed the boss.

Hazards, arrows, oil and capture belong to the encounter. All clocks stop outside `play`. Death may synchronously replace Momo and the enemy array, so the active attack checks player identity before continuing; obsolete enemy objects cannot restart after array replacement. Clearing an old encounter releases only its own capture stun. Replaying the boss from the developer panel grounds Momo on the arena floor and preserves permanent reward flags.

`graveAwake` is runtime encounter state; it must not reuse the shared `summoned` field, which marks disposable boss minions. `respawnEnemies()` carries the unfinished guardian's replay state into the replacement instance before main-boss cleanup. `slayerSummoned` is the separate normal-save flag, recorded only after the incantation warning is confirmed and validated against Yomi victory and `slayerSeal`.

## Ownership and art

- `doom-slayer.js`: encounter state, attacks and lifecycle.
- `slayer-dialog.js`: paused grave input and guarded warning callback.
- `slayer-art.js`: read-only painted rendering and pose selection.
- `ART_SLAYER`: atlas crops, stable body scales, foot anchors and props.
- `ART_INVENTORY.items`: both quest icons, using the shared DPR-aware renderer.

The revised weapon concept and motion storyboards were explicitly approved before production. The two atlases retain original alpha; ground anchors follow feet, while body scale is shared per atlas so crouching cannot enlarge the model. Gameplay warning rectangles represent actual damage geometry; the painted lightning is registered to ground contact. Reduced motion removes incidental motion while preserving necessary attack warnings. Production prompts are under `docs/art-prompts/slayer-*.md`. Refresh `export-colormaps.py` after image or crop changes.

## Verification

`test-doom-slayer-combat.cjs` checks all moves, naturally selected three-hit combo cadence at 30/60/120 FPS, grounded guarding, threshold timing, protections, execution, dormant reentry and obsolete-instance death safety. `test-doom-slayer-route.cjs` checks 72 real-physics landings at 30/60/120 FPS, shortened arena bounds, gate blocking, hidden maps and persistent defeat. `test-slayer-dialog.cjs` checks input, focus, localization and stale callbacks. `test-doom-slayer-integration.cjs` checks physical rewards and normal/developer lifecycle. `test-slayer-art.cjs` checks registered alpha coverage, pose selection and rendering without advancing state. Real-browser QA additionally checks actual modal behaviour, art registration, HU/EN, narrow layouts and same-release storage.
