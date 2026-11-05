# Watchtower and balloon continuation

Cards: [Ninja Watchtower](https://trello.com/c/JD7nkaah), [Balloon Voyage](https://trello.com/c/6Ttdzbgk).

## Story and ownership

Starts after `islandsTrailReached`. Haru remains abducted; Momo rescues Westheru and travels with him. The four registered Japan side locations are `ninjaWatchtower`, `balloonJourney`, `skyLanding`, and `stormIslands`. The entrance shrine keeps its `watchtowerEntrance` ID but moves from x=1000 to x=1300, away from the return gate. Strict validation accepts only the exact old (1000,2000) checkpoint and normalizes it to (1300,2000).

After the vortex, Westheru arrives aboard the balloon, speaks, then flies onward over four active seconds. `westheruDeparted` records completion and requires `balloonVortexArrived`. Compatible old saves may lack the new flag; an interrupted arrival can replay, while a completed departure cannot. The prior landing site no longer shows Westheru after vortex arrival. Pause freezes departure; reduced motion uses a fade. Momo is protected during the locked departure.

`watchtower-balloon-rules.js` owns the immutable milestone chain. The jailer and cell-key flags commit together; rescue, sentinel escape at 70%, boarding, wasp clearance, dragon defeat, Westheru's restoration and vortex arrival each require the preceding milestone. The strict save validator uses the same rules. The held key disappears through `consumedBy` when Westheru is rescued, while its acquisition history remains. No new save field or compatibility epoch is introduced.

`watchtower-balloon.js` owns transient flight/escort/cinematic state. Westheru cannot take damage. His own rope follows Momo's fixed-anchor route; player initialization clears the companion owner so a respawn cannot show an old position. The diagonal tower route supports up/right and down/left targeting within the shared 900px range. Climb from the lower ledge's left section, facing right; jump off its left edge to descend toward the lower ring.

The balloon cruises between encounters and stops for combat. Five wasps precede the dragon. The balloon has 100 HP; the dragon's 1.5-second preparation can be interrupted by 45 damage, otherwise it removes 24 balloon HP. Failure retries the current stage with full balloon health, preserving earned milestones. Ordinary player death also resumes from the last shrine/current stage. Generic fast travel cannot leave a running flight or an active fight.

The sentinel's departure and final vortex have visible, active-time sequences. Pause, dialogue and the minimum-size notice freeze them. Reduced motion keeps static artwork and reduces travel/vortex movement. The final island remains available for normal discovered fast travel after arrival.

## Combat and art

`watchtower-balloon-combat.js` provides native jailer, sentinel, dragon and seal encounters with fixed target warnings, source-owned projectiles and transient hazard state. The jailer, dragon and seal give one-time 600/1200/1200 XP; the sentinel escape grants no kill reward. The four encounters also have tower entries and internal classification records. Tower variants have no story writes; the sentinel dies at zero HP and dragon attacks target Momo. From floor7, the regular-enemy pool also includes crossbow, shuriken, ninjutsu and assassin shadow ninjas plus giant wasps. They use the existing tower health/damage scaling and no campaign rewards. Enemy counts and checkpoint kill totals are unchanged; boss slots discard all regular-archetype dispatch flags.

Six independent native-alpha atlases use `register-watchtower-art.py` for bounds and foot registration. Original PNG pixels are preserved. The vehicle deck's source registration is x85..1450 at y825; the shared collision deck is registered to this line. Flight backgrounds crop out painted foreground ground. `watchtower-balloon-art.js` renders all actors, ropes and warnings without advancing simulation clocks. Background phase-B variants are used only within authored cloud/mist/lamp masks; architecture and terrain use the original painting. Exact generation prompts are in `docs/art-prompts/watchtower-*.md`.

## Validation

`test:watchtower` covers immutable sequence/legacy progress, geometric targeting and swept actor clearance in both directions, real grapple inputs and rope escort at30/60/120 FPS, native combat interrupts/pause/cleanup, story interactions and balloon retry, strict save prerequisites, and story-free tower variants.

Browser verification uses a fresh Edge profile and synthetic prerequisites/positions/HP through a seam injected into the locally served runtime only. It checks HU/EN at1280×720 and1920×1080, actual remapped interaction input, encrypted reload during the balloon stage and after arrival, pause, reduced motion, minimum viewport freezing and failed network requests. It is separate from an unassisted combat playthrough. Evidence belongs in ignored `.codex/work/watchtower-balloon/`.
