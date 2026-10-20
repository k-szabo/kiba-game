# Secret grave encounter — developer reference

This document contains deliberate spoilers and is not linked from the player guide. Trello: https://trello.com/c/brUPwH97. Implementation branch: `FEATURE-doom-slayer-easter-egg`.

## Entry and persistence

Yomi's optional upper annex starts west of the arrival platform. Its fire seal uses the same Dawnblade interaction as the sky realm: defeating Yomi alone does not open it; an actual sword strike records `slayerSeal`. Ten alternating steps climb to the broad arena at world Y = −1700. The route works in both directions with double jump. Camera bounds extend upward, while the ordinary map keeps its existing scale. The annex stays absent from both maps, compass objectives and public release hints, including after discovery.

The grave opens a native text-input dialog. The incantation is `iddqd` (trimmed, case-insensitive); it has no visible hint. A wrong answer stays in the dialog. Correct input opens a high-contrast danger warning; acknowledging it summons the guardian. Typing never reaches gameplay bindings. Leaving, dying or travelling invalidates stale confirmation callbacks.

`guardian:doomSlayer` records victory. Normal death, shrine rest and realm reentry preserve it. Neither victory nor developer replay changes main boss progression, the level cap, bonus stats, XP or coins. Daisy and the crossbow are separate physical pickups (`daisyPlush`, `slayerCrossbow`), saved independently of victory and shown by the common inventory renderer. The crossbow cannot be equipped or fired by Momo. Normal saves reject these rewards without the guardian flag, and reject grave progression before Yomi victory. Developer inventory remains an isolated, non-saving test character.

## Combat

The encounter deliberately targets an endgame challenge beyond the current level-30 player cap; it has 260 HP. It remains vulnerable during all attacks and its saw startup. The front shield blocks normal strikes during grounded waiting; heavy and rear/overhead strikes bypass that guard. Moves cycle through flail, barrel puncture, fire arrow, lightning, kick, arrow rain, double jump, grab and explosion. The grab executes only after an actual successful hit against Momo at three HP or less; dash, ordinary invulnerability and developer invincibility still apply.

At 30% HP it retreats and starts a full five-second saw cast, once per attempt. Damage does not raise or clamp its HP to the threshold. A lethal hit during casting still wins. Once ready, saw contact deals damage, briefly holds Momo, heals the guardian by 20 and adds one armour (maximum eight). Each armour subtracts one incoming damage, with a 0.25 damage floor. Healing/armour require a real hit; invulnerability does not feed the boss.

Hazards, arrows, oil and capture belong to the encounter. All clocks stop outside `play`. Death may synchronously replace Momo and the enemy array, so the active attack checks player identity before continuing. Clearing an old encounter releases only its own capture stun. Replaying the boss from the developer panel grounds Momo on the arena floor and preserves permanent reward flags.

## Ownership and art

- `doom-slayer.js`: encounter state, attacks and lifecycle.
- `slayer-dialog.js`: paused grave input and guarded warning callback.
- `slayer-art.js`: read-only painted rendering and pose selection.
- `ART_SLAYER`: atlas crops, stable body scales, foot anchors and props.
- `ART_INVENTORY.items`: both quest icons, using the shared DPR-aware renderer.

The revised weapon concept and motion storyboards were explicitly approved before production. The two atlases retain original alpha; ground anchors follow feet, while body scale is shared per atlas so crouching cannot enlarge the model. Gameplay warning rectangles represent actual damage geometry; the painted lightning is registered to ground contact. Reduced motion removes incidental motion while preserving necessary attack warnings. Production prompts are under `docs/art-prompts/slayer-*.md`. Refresh `export-colormaps.py` after image or crop changes.

## Verification

`test-doom-slayer-combat.cjs` checks all moves, threshold timing, protections, execution and death safety. `test-doom-slayer-route.cjs` checks 72 real-physics landings at 30/60/120 FPS, gate blocking, hidden maps and persistent defeat. `test-slayer-dialog.cjs` checks input, focus, localization and stale callbacks. `test-doom-slayer-integration.cjs` checks physical rewards and normal/developer lifecycle. `test-slayer-art.cjs` checks registered alpha coverage, pose selection and rendering without advancing state. Real-browser QA additionally checks actual modal behaviour, art registration, HU/EN, narrow layouts and same-release storage.
