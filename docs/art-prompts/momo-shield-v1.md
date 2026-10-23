# Momo sword-and-shield production provenance

The user approved the colored equipment concept and the corrected technical movement plan at `docs/images/starter-weapons-motion-plan.svg/png`. Tool: built-in ImageGen, `transparent_background:true` for all calls. The selected PNG files were copied unchanged, preserving original alpha.

## Selected normal body sheet

Asset: `assets/images/momo-shield-normal-v1.png`, 1536×1024 RGBA.
Output ID: `exec-ff1d035d-01f9-4842-bc70-5057051ff532.png`.
Reference: initial sword-inclusive sheet `exec-ebed0843-74de-44bc-80eb-11f6bf35275a.png`, rejected during artist inspection because sword lengths varied and one blade crossed a cell boundary.

Exact prompt:

> Precise sprite-sheet edit. Keep all six Momo character poses, shield, body dimensions, head shape, paw positions, armor, headband and curled tail from this sheet. Remove the sword COMPLETELY in EVERY frame, including blade, guard, handle and tassel: the right curled fist is EMPTY in each frame and will hold a rigid weapon overlay rendered later. Keep that empty right fist natural, no wrist twist, opening for an invisible handle aligned with forearm; do not replace it with another object. Left arm still holds the same navy gold oval shield in every frame, never vanishes. EXACT 3 columns2 rows, six equal square cells ideally1536x1024. Ensure each character entirely inside its cell with minimum8% padding and no crossing cell boundary. Soles at90% cell height, same head/body scale each frame; no crouch shrinking. Background100%transparent with clean alpha: REMOVE ALL COLORED SHADOW HAZE AND GLOW surrounding figures, no background, no ground shadows. No new text or objects. This is production normal attack body-plus-shield sheet for rigid sword animation.

## Selected heavy body sheet

Asset: `assets/images/momo-shield-heavy-v1.png`, 1536×1024 RGBA.
Output ID: `exec-f58e5467-2045-4532-8a70-6a16c4f07d66.png`.
References: selected normal body sheet and `docs/images/starter-weapons-motion-plan.png`.

Exact prompt:

> Production HEAVY ATTACK BODY+SHIELD sprite sheet for Momo, identical painted character design as reference1. Six frames EXACTLY3columns2rows 1536x1024. TRUE TRANSPARENT BACKGROUND. Keep identical orange/cream shiba, gold-trim navy samurai armor, red headband/sash, curled orange tail, same head/body size in all frames. RIGHT PAW IS ALWAYS EMPTY CLOSED NATURAL GRIP: weapon is rendered separately by game engine; NO sword/blade/hilt/handle/tassel drawn anywhere. LEFT PAW HOLDS SAME NAVY GOLD OVAL SHIELD ALL FRAMES visibly. Follow approved bottom row reference2 for natural bent right arm. Six poses order: 1 empty right grip near right shoulder at face height, elbow below grip; 2 right grip raised just above forehead elbow bent naturally; 3 grip a little higher held still to gather force; 4 right grip lowered forward at chest level from descending powerful cut with slight torso lean; 5 right grip lower forward near belt followthrough; 6 right grip recovers near shoulder same as1. No wrist twisting, fist joint follows forearm, exactly two arms and paws, shield never disappears. Each frame has broad transparent margins and whole body/tail/ears/paws/shield, no crossing cell edges. Soles at90% of each512 cell height, hips x45%cell, same body scale, no jumping. White steel sword will be added later so keep empty grip clean. No sword, text, labels, VFX, aura, circles, background colors, floor shadows or haze. Detailed crisp painted match reference1.

## Selected rigid sword

Asset: `assets/images/ui/sword-rigid-v1.png`, 1774×887 RGBA.
Output ID: `exec-f23d6d21-215a-48a2-bacf-f49f06179abe.png`.
Reference: `assets/images/ui/starter-weapons-v1.png`.

Exact prompt:

> Single isolated short curved katana sword matching RIGHT CELL sword from reference, NO shield, NO character, NO other objects. Production rigid weapon overlay for 2D painted Japanese fantasy game. Landscape composition, sword points RIGHT exactly horizontally. Handle at left, blade at right. Indigo braided short handle with cream/gold diamonds, small gold round tsuba guard, polished silver single edge gently curved katana blade; short red tassel at left pommel. Entire sword fully visible with 15% transparent margins. Side orthographic flat2D view no foreshortening. Rigid blade and handle along horizontal axis, slight blade curvature only. Bright white steel rim, detailed dark blue steel inner reflection and gold highlights, clean dark outline matches reference. True transparent background and no glow/haze/shadow/text/labels. Center the grip at around x=25%image,y=50%; blade roughly3 times handle length.

## Inspection and integration

The body sheets have two arms and a visible left-hand shield in all frames. Small red cords remain near raised fists. The sword is separate so rendering can rotate and translate one fixed-scale prop rather than changing painted blade length. No Python image erasing, warping, alpha reconstruction or resizing was used. Alpha ranges: 0–254 for body sheets, 0–255 for the sword. Transparent pixels retain generated RGB.

Individual measured crops deliberately extend beyond nominal cells to include complete shield edges without including neighboring characters. Geometry is recorded in `assets/config/momo-shield-art.json`. The requested gameplay impact fractions are normal `0.16 / 0.42` and heavy `0.38 / 0.9`; art integration preserves those timings. Browser attachment, mirroring, registration and readability checks belong to integration QA.
