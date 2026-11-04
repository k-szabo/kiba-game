# Floating-island art provenance

Generated with the built-in image tool. Concept images remain review artifacts; only approved production outputs belong in the asset catalog. No private local reference paths are required to reproduce these designs.

## Character and hook concept

Output identifier: `exec-ae77871f-498c-4346-9693-6ee692b71c10`.

Prompt specification: landscape full-color character concept sheet, light parchment, five full-body anthropomorphic Siamese-cat shadow ninjas. Cream fur, dark chocolate ears/muzzle/paws, blue eyes, feline ears and one tail each. Detailed painted Japanese fantasy game style, compact expressive proportions. Indigo charcoal clothing, muted teal accents and aged bronze tools. Numbered panels only: small functional crossbow with one stock and a transverse bow/string, shuriken thrower, empty-handed ninjutsu caster with talismans, assassin gripping one short tanto, and a more distinguished leader with scarf, one tanto, smoke bomb and grappling tool on the belt. Complete hands, feet, tails and weapon silhouettes with generous margins. Below them a separate steel three-prong grappling hook, one rope attachment and a compact hemp-rope spool. No names, UI or final sprite atlas.

The hook shape on this sheet was rejected for insufficient curvature. The five characters were subsequently approved together with the corrected hook below.

## Revised hook concept

Output identifier: `exec-fb801ba8-0fd3-4dfc-ab4b-d1463588c907`. Reference/edit target: the preceding character concept sheet.

Prompt specification: extract and redesign only the hook as one standalone concept on parchment, preserving the aged steel/hemp/bronze painted style. Three narrow forged round-section prongs, deep U/J return curves with open throats, tips bending back toward the rope eye, a short central shank and one attachment ring. Eliminate crescent axe/scythe blades. Show the three prongs coherently in a single three-quarter view, rope tied through the eye to a compact spool. No characters, variants, extra components or writing.

References consulted: [Japanese ninja museum](https://www.ninja-museum.com/ninja-database-en/?p=347), [historical kaginawa collection description](https://www.hamillgalleries.com/artworks/kaginawa-grappling-hook/), [Met collection record](https://www.metmuseum.org/art/collection/search/24590). The web pages were used for historical construction context; no external photograph was passed to the generator.

The revised hook was explicitly approved by the user.

## Animation approval storyboards

Regular-ninja prompt specification: rough muted-color four-row by four-cell motion sheet using approved characters 1–4. Each row shows a walking step, windup, attack and recovery. The crossbow remains the same mechanically plausible short stock and transverse bow, held by two hands; the shuriken is one star then an empty throwing hand; the ninjutsu caster uses empty-handed signs; the assassin holds one short, constant-length tanto. Full silhouettes, consistent size, generous cell margins, no polished VFX or final sprite atlas. Only numeric labels 1–16.

Output identifier: `exec-a068532a-54af-4e59-8dae-5babba29c652`. Explicitly approved by the user.

Leader/Momo prompt specification: rough three-row by four-cell sheet referencing the approved leader, established Momo and approved curved hook. Cells 1–8: leader idle, run, dagger windup, slash, shuriken throw, hook throw, smoke-bomb drop and escape leap. Sheathe the tanto before using throwing tools; only one implement per throwing hand. Cells 9–12: Momo braces, casts to a fixed ring, is pulled on a taut rope, then lands with bent knees. The same three deeply curved prongs remain visible whenever the hook is depicted. Full figures, two hands, one tail, stable proportions, side/three-quarter camera, modest sketch VFX and only numeric labels.

Initial output identifier: `exec-6be4ef58-63d8-4070-9a84-8e04620d16b8`. Internal review requested a targeted edit before approval: preserve every pose, number, cell and rope path; replace only the hook drawings in cells 6, 9 and 10 with the approved three-prong rounded-rod construction. The small initial drawings had obscured the third prong and read as crescent blades.

Corrected output identifier: `exec-c479ae4c-c5a7-4a3f-9126-c25156bf5b37`. Leader and Momo animation poses were separately and explicitly approved by the user.

Both that sheet and the 16-pose regular-ninja sheet were explicitly approved.

## Production alpha atlases and icon

All generations use the approved character and motion sheets as references. Each request requires complete isolated full-body frames, consistent right-facing three-quarter view, fixed anatomical scale, transparent original alpha, full ears/tail/feet/weapons inside cells, no labels/grid/ground shadow, and no baked projectiles or large effects. Regular enemies have six frames in a 3×2 layout: idle, two opposite walking steps, windup, release and recovery.

- Crossbow: `exec-acd7a637-d8b0-49ed-ac26-65ec85045698` → `assets/images/enemies/shadow-ninja-crossbow-v1.png`. One unchanged short stock/transverse bow, both hands gripping it consistently, shoulder recoil on release.
- Shuriken: `exec-6f818a90-d6d7-4b55-92a8-94d30b6371a5` → `assets/images/enemies/shadow-ninja-shuriken-v1.png`. Draw one four-point steel star from the pouch; throwing follow-through has an empty hand.
- Ninjutsu: `exec-ed56f708-fe8a-436a-81a5-1baab7e55f82` → `assets/images/enemies/shadow-ninja-ninjutsu-v1.png`. Empty-hand sign, two palms outward on cast; no staff, aura or weapon.
- Assassin: `exec-76f32ef1-4831-4959-a423-31d56aa19be0` → `assets/images/enemies/shadow-ninja-assassin-v1.png`. One constant short tanto in the same hand across all six poses, opposite hand empty, crouched windup and close lunge.
- Leader: `exec-66ed23cb-52f6-48ee-aa44-f5b6bbe32370` → `assets/images/enemies/shadow-ninja-leader-v1.png`. Eight frames in a 4×2 layout following approved poses 1–8; tanto sheathed before throwing tools; smoke and flying projectiles are drawn by gameplay.
- Momo: `exec-481577ba-cc74-4ffc-8875-b0302e5e9736` → `assets/images/momo-hook-v1.png`. Four poses in a 2×2 layout, matching the existing Momo reference and approved curved hook: braced preparation, empty-handed cast, both hands holding short rope during pull, bent-knee landing. Sword stays sheathed; no baked long rope or anchor.
- Hook icon: `exec-2df806e1-88c9-429b-9794-7a1046f423af` → `assets/images/ui/grappling-hook-v1.png`. Same approved deep U/J three-prong round-iron construction, one rope eye and short rope to compact spool, diagonal composition and strong small-icon contrast.

`register-islands-art.py` reads native dimensions (including non-divisible grid dimensions), rounds cell boundaries, derives alpha bounds and feet, and does not resize/rewrite source pixels. Momo's casting pose supplies the body-height reference so the raised hook does not shrink his body.

## Background-motion production

Storyboard `exec-bb2092c8-5e26-42a1-95e5-3a0b3df2f364` was explicitly approved: three rows of four local-motion keyframes, fixed architecture/terrain/camera, only cloud/mist contours, outer foliage tips and lantern glow changing. Arrows/numerals belong only to the sketch.

Phase-B edit prompts preserve exact composition, fixed architecture, rock/terrain silhouettes, camera, palette and object inventory, and request only subtle local cloud/mist/foliage/light variation. No whole-frame translation/zoom, new props, characters, writing, arrows or grid. The runtime applies masked patches to the original image; it does not crossfade whole regenerated buildings.

- Arrival: `exec-1e463012-d6ea-4c9b-881d-af82950e1fd4` → `assets/images/backgrounds/floating-islands-arrival-motion-b-v1.png`.
- Route: `exec-434f2687-3531-4036-8f22-b4b324239d79` → `assets/images/backgrounds/floating-islands-route-motion-b-v1.png`.
- Watchtower: `exec-f5ae8248-b592-4a50-a888-a2672fae4b98` → `assets/images/backgrounds/floating-islands-watchtower-motion-b-v1.png`.

## Approved environment concept

Output identifier: `exec-494fb624-f2ba-433d-802d-006712d9db6b`. Approved by the user.

Prompt specification: three wide stacked numbered landscape panels in the established detailed painted Japanese fantasy style. Pink dawn sky, layered clouds, enormous floating rocky Japanese mountains, shrines, pagodas, red torii and cherry blossoms. Panel 1: open stone arrival arena with pines and a small torii. Panel 2: separated mossy floating islands with conspicuously unbridged wide gaps, climbing rings fixed to stone pillars and higher anchors. Panel 3: remote wooden ninja watchtower, indigo feline-eye banners, rope equipment, terraces and onward vista. No characters. Concept layout only; gameplay geometry and interactive anchors are placed by the engine.

## Arrival production background

Output identifier: `exec-7b2919d9-1aa7-4adb-81bd-4f84ae8664fe`.
Asset: `assets/images/backgrounds/floating-islands-arrival-v1.png`.

Prompt specification: finished 16:9 production painting based on the approved arrival-island panel. Broad weathered level stone courtyard in the lower third, subtle circular paving pattern, open combat space, low mossy stones, pine at left, distant left torii, flowering cherry and modest ornate shrine at right. Vast floating mountains and pagodas, pink dawn clouds, waterfalls, warm sunlight and cool rock shadows. Reasonable architectural scale, clear foreground versus distant landforms, no characters, enemies, rope, weapons, panels, UI, writing or watermark. Preserve the full source painting.

## Traversal production background

Initial output identifier: `exec-206199e8-ce9d-49dd-a19b-2034c44a7e0e`.

Prompt specification: finished 16:9 painting of the central route with mossy floating islands, Japanese pavilions, pines, cherry blossoms, waterfalls and dawn clouds. Open cloud-filled gaps occupy the central foreground. No bridge or continuous painted walkable floor; platforms are placed by the game. Stone pillars frame the sides. No characters, labels or UI.

The first output painted foreground rings and chains. A targeted edit was requested: keep the exact composition, architecture, sky, rock silhouettes and colors; remove all foreground climbing rings, mounting plates and chains on both pillars and replace them with matching mossy stone. Interactive anchors are rendered separately so decorative hardware cannot be mistaken for a target.

Corrected output identifier: `exec-540ccfb3-cf9f-4756-9e84-22f7696b5b0c`.
Asset: `assets/images/backgrounds/floating-islands-route-v1.png`.

## Watchtower production background

Output identifier: `exec-cc452875-6bd4-490d-8b58-3b8d910e2d64`.
Asset: `assets/images/backgrounds/floating-islands-watchtower-v1.png`.

Prompt specification: finished 16:9 painted Japanese outpost on a broad mossy floating terrace at pink-violet dawn. Wooden watchtower and building in the left midground, plausible architectural scale, indigo banners with a simple gold feline-eye symbol, pines, cherry blossoms and an open horizontal stone terrace. A far-right broken cliff overlooks the cloud sea and onward floating mountains. Strong depth, warm rim light and clear wooden architecture. No characters, creatures, painted interactive targets, hooks, rings or ropes crossing playable space. No panels, writing, UI or watermark.
