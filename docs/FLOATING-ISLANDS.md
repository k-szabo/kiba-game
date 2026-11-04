# Floating-island continuation: implementation notes

Cards: [island route](https://trello.com/c/Y3xIaTrg), [shadow-ninja faction](https://trello.com/c/KMvUp3HQ).

Work starts from main commit `563a053` on `FEATURE-floating-islands-shadow-ninjas`.

## Confirmed requirements

- Continue after the arrival conversation in `japanHeights`; preserve that existing map and its save coordinates.
- The opening ninja escapes at 70% remaining health, abducts Haru and leaves the hook. Escape is a story transition, not a defeated guardian or a repeatable reward.
- Keep Dawnblade on F. The hook defaults to R and remains remappable through the shared binding catalog. Preserve customized bindings, including existing assignments of R.
- The hook selects fixed anchors within 900 world pixels without mouse aiming. The first visible, explicitly eligible small regular enemy in the facing direction takes priority; otherwise select the nearest visible anchor ahead. Ordinary terrain is an obstruction, not an attachment. Bosses are excluded.
- Four Siamese-cat enemy roles: crossbow, shuriken, ninjutsu and tanto. A friendly faction NPC belongs to later work.
- Mandatory crossings must resist the fully upgraded dash cooldown as well as double jump. Horizontal gap size alone is insufficient: dash can repeatedly cancel falling velocity. Use a vertical rise beyond the combined jump apex, with a reachable hook anchor, then verify actual input trajectories.
- The current save compatibility epoch stays stable. New permanent flags require strict prerequisite validation; no weakening of validation or retroactive reset.

## Initial modules

`assets/js/grapple-rules.js` provides fixed-point/facing targeting, line-of-sight occlusion, explicit enemy eligibility and full-body swept collision for pulling. It owns no input, global actor, persistence, renderer or clock. The caller must supply active gameplay time and reset transient ownership on mode/location changes.

`assets/js/floating-islands-rules.js` provides additive realm-zero milestones gated by the existing realm-three arrival completion. Escape and kidnapping commit together; hook acquisition follows escape; the later trail milestone requires the hook. Transitions copy flags and reject replay.

`assets/js/floating-islands-maps.js` defines the initial arena and three 400px uphill crossings. Gaps are 680px wide, with near-edge fixed rings inside hook range. Existing arrival-map geometry is preserved.

The modules are integrated through the private generated runtime and canonical `SIDE_LOCATIONS` registry. The arrival conversation unlocks the entrance at `(3850,1100)` in `japanHeights`. The existing arrival map/rest coordinates are unchanged. The new map has three canonical rests and appears in normal discovered fast travel, the atlas, and developer teleport.

`floating-islands.js` owns the 1800 HP opening leader, aimed shuriken/poison/hook attacks, dagger strike, telegraphed smoke stun, arena lock, companion and a 1.4-second visible escape sequence. At 70% remaining HP, the paired kidnapping/escape flags commit once; this does not grant a guardian flag, XP or training point. Death before escape restarts the encounter. Once escaped, the leader remains absent after respawn/load and the discarded hook can be collected once. Haru no longer appears at the old arrival conversation point.

`grapple.js` owns only transient pull/landing state. R selects the first visible small enemy in the facing direction, otherwise the nearest visible fixed anchor ahead, within 900px. Solid platforms and closed gates obstruct the line and the swept actor. Small existing regular enemies as well as the new faction are eligible; bosses and large actors are protected. Pulled enemies fall/land safely and their patrol is rebased onto the landing support. The 0.16s anticipation and 0.5s reuse timer advance in active gameplay; pause/dialog/minimum resolution freeze them. Player initialization and scene/mode changes clear transient pulls. The hook is not available in duel/tower modes.

`shadow-ninjas.js` shares profiles and releases with the existing patrol/attack state machine. Crossbow/shuriken/ninjutsu/assassin roles respectively use 100/90/85/120 HP and 3/2/3/4 base damage. Their projectiles, telegraphs, recovery and actor poses remain distinct. `islands-art.js` only reads gameplay state. Source alpha, native atlas bounds and foot anchors are registered by `scripts/register-islands-art.py` into `shadow-ninja-art-data.js`; inventory art uses the shared DPR-aware renderer.

New milestones live in realm zero and require the realm-three completed arrival. The strict validator checks their order and rejects upper-island rest history without hook acquisition. The saved ability arrays remain length two; the hook uses its durable quest flag. Save compatibility is preserved.

`test:islands` includes pure targeting/route geometry, shared faction combat, full story and real input traversal, strict save checkpoints, and Canvas presentation coverage. Relevant scenarios run at 30/60/120 FPS. Browser evidence uses a fresh Edge profile, a test-served seam for synthetic prerequisites/placement, real inputs and encrypted reload; this is distinct from an unassisted full combat playthrough.

## Approval status

The environment/character/hook concepts, fixed-point HU/EN copy, both combat/hook motion sheets and the three background-motion storyboards are approved. Production atlas and background files are stored in the workspace. Background phase B is applied only inside authored local cloud/foliage/light masks; architecture and collision geometry use the original painting. Motion pauses and reduced motion displays the original artwork.

The shared binding catalog now has the `grapple` action on R and revision 4. Revision-three storage and exports remain readable; a customized R keeps its owner and the new action receives an available input. Dawnblade remains F. The binding tests cover storage reload and import with a previously customized R.

## Release and validation

Prepared release: `0.9.71_e96d3917`; compatibility epoch remains `0.9.70_88f2c94c`. No save reset is introduced.

The full package suite contains 219 checks. The release-ID check requires an unrestricted temporary-directory rename on this Windows host; its isolated rerun passed. Native-alpha registration, deterministic colormaps, Linux asset case and static repository-subpath checks passed.

Fresh Edge checks cover HU/EN at 1280×720 and 1920×1080, real entry/pickup/R input, visible abduction, numeric boss health, pause, minimum-viewport freeze, reduced motion, scrollable help at desktop zoom, and actual encrypted save/reload. Prerequisites, placement and the boss's near-threshold HP use a test-served seam in a fresh profile; this does not claim an unassisted full combat playthrough.

The cloud-route painting forms the backdrop beneath gaps. Arrival/watchtower paintings have stable island-relative projections, clipped to their own island spans, so painted foreground floors cannot bridge empty collision space and the tower stays inside its island at both supported test sizes.
