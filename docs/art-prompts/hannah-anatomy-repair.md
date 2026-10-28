# Hannah anatomy repair and Fia fox variant

Built-in image generation edits of the existing approved painted designs. No new concept, gameplay geometry, attack timing, or descriptive copy was introduced.

## Sources and selection

- `assets/images/enemies/hannah-walk-v1.png`: floating grips in source poses 1 and 3; generated grip/anatomy repair passes require visual acceptance.
- `assets/images/enemies/hannah-ritual-v1.png` → `hannah-ritual-v2.png`: remove the third dangling arm from source pose 1; restore all six poses after registration.
- `assets/images/enemies/hannah-combo-v1.png` → `hannah-combo-v2.png`: remove extra arms from source poses 0 and 2 while retaining both scythe grips.
- `assets/images/enemies/hannah-jump-v1.png`: all six poses inspected; retained unchanged.
- `assets/images/npcs/fia-fox-v1.png` → `fia-fox-dead-v1.png`: one static closed-eye, limp side-lying variant of the same purple fox, without wounds or gore.

Original genuine RGBA alpha is present in the sources. Generated outputs retain genuine RGBA alpha; no color-key extraction or opaque background replacement was applied. Integrator regenerates the atlas and palette, and verifies real-browser rendering.

### Walk, final pass (rejected for source pose 3)

Use case: precise-object-edit. In this full 3x2 walking sprite sheet edit ONLY bottom-left character. It has a rogue pale HAND emerging directly from its RIGHT KNEE at approximately (430,860). ERASE that rogue knee-hand and its short arm completely, replacing it with the existing black trouser/boot/robe texture. There must be NO skin, fingers, hands or arms below that character's hip. Keep ONLY TWO existing hands: left hand firmly gripping the pole at (346,721), and right lowered hand at (402,790). Do not create any new hand elsewhere. Every character has exactly two arms, two hands. Keep all other details and poses fixed, full complete scythes, boots and original layout. This is a tiny deletion, not a pose change. Genuine transparent background.

## Remaining limitation and integration handoff

The generated `hannah-walk-v2.png` added a scythe grip to source pose 1 but retained duplicated anatomy there and in other cells. Repeated deletion passes did not reliably repair every cell. Registration therefore excludes sources 0, 1, 3 and 4 and uses only `[2,2,2,5,5,5]`. This limitation must remain explicit; the source sheet is not claimed to have six anatomically clean poses. The integrator independently reviews the active sequence in browser.

Selected canvas dimensions: Hannah sheets 1536×1024; fox 1774×887. Threshold-16 alpha bounds: walk `[22,7,1530,1005]`, ritual `[27,5,1523,999]`, combo `[9,9,1521,996]`, fox `[36,306,1728,726]`. The fox keeps its original RGBA file unchanged; use a standing-character length reference rather than treating its short lying height as its standing body height.


## Actual generation prompts

### Walk, pass 1

Use case: precise-object-edit. Edit target: attached Hannah six-pose walking sprite sheet. Minor anatomy repair only, same painted Japanese fantasy demon woman, same face, glasses, horns, black hair, black/gold/red robes, orange fiery wings and long complete scythe. Preserve EXACT 3-column by 2-row layout, six existing poses, canvas framing, full silhouettes, original character scale and foot positions. Repair top-middle and bottom-left walking poses: currently the scythe shaft floats without either hand holding it. In each of these two poses, bend ONE existing arm at the elbow and draw its hand firmly wrapped around the nearby vertical scythe shaft at chest/waist height, thumb and fingers visibly enclosing the shaft. Keep exactly TWO arms and TWO hands per character; keep the other existing hand lowered. Keep all four other walking poses unchanged as closely as possible; every scythe must be visibly physically held. No third limbs, no detached or floating hands, no extra weapons. Output a production sprite atlas with real TRANSPARENT background and clean retained semi-transparent edge/ember alpha, no painted backdrop, no text, no grid.

### Walk, pass 2

Use case: precise-object-edit. Edit only the anatomy of the TOP-MIDDLE and BOTTOM-LEFT character in this six-pose 3x2 walking sprite sheet. Both currently have THREE hands: one holding the pole, one middle dangling hand beside the purple waist tassel/thigh, and one outer dangling hand on the far right. REMOVE THE MIDDLE DANGLING HAND AND ITS FOREARM entirely in both those poses. Reconstruct the robe fabric underneath where that extra hand/forearm was. The remaining two hands must be: one around the scythe shaft, one outer hand lowered on her right. Trace each hand to exactly one shoulder: there must be ONLY TWO arms and TWO hands in every pose. This is a surgical deletion of duplicated anatomy, no new hands. Preserve all other poses and details, character identity, pose size, boots and boot positions, full scythes/wings/tail, 1536x1024 sheet size and layout. Transparent background with genuine alpha, no backdrop, no text.

### Walk, pass 3 (rejected: moved duplicate hand)

Use case: precise-object-edit. Image 1 is the full atlas EDIT TARGET. Image 2 is a magnified reference of the exact defect, NOT a separate character. In image 1, BOTTOM-LEFT pose: REMOVE the pale extra hand directly below the purple waist ribbons at approximately x=365,y=783. This pale hand has dangling vertical fingers in front of the dark thigh. DELETE its flesh-colored fingers/palm and the short flesh-colored forearm above them; repaint that small region as uninterrupted dark charcoal trouser fabric with the same gold seam. KEEP the hand wrapped around the pole at x=346,y=721, and KEEP the outer lowered hand at x=404,y=793. Thus bottom-left will have exactly TWO hands, not three. Do not add any new arms or hands. Keep every other detail in entire full sheet fixed, same dimensions and positions, same scythe length. Transparent RGBA background. Output the full atlas from image 1.

### Ritual selected

Use case: precise-object-edit. Correct TWO anatomy errors in THIS ORIGINAL six-pose Hannah ritual sprite sheet. Top-middle pose has THREE hands: one on the vertical scythe, one extended right casting purple flame, and an EXTRA hanging forearm/hand at the waist. DELETE the hanging waist-level forearm/hand completely; replace it with flowing black/gold robe fabric. Retain just TWO anatomically connected arms: one gripping the pole, one casting with an open palm. All other five poses have exactly two hands already; preserve them closely. Same original 3-column 2-row layout, unchanged feet/boot positions, same face/glasses/horns/costume/wings/tail, full complete scythes and purple spell effects. No redesign. Actual transparent background, retain soft effect alpha; no background, no labels.

### Combo selected

Use case: precise-object-edit. Surgical anatomy repair on existing Hannah six-pose combo sprite atlas. Preserve original six action poses and their 3-column 2-row layout, character scale, all boots positions, entire scythes/wings, face, glasses, horns and painted black/gold/red design. TOP-LEFT pose currently has TWO hands gripping its vertical pole PLUS an extra dangling third hand on the outer right. REMOVE that dangling extra hand and its arm entirely, reconstruct flowing robe underneath, retain the TWO existing gripping arms. TOP-RIGHT crouching sweep pose currently has TWO hands gripping its slanted pole PLUS a third hand reaching outward to the right. REMOVE only that outward extra hand and its forearm, reconstruct robe, retain TWO gripping hands. Every pose must have exactly two arms and two hands, both traced unambiguously to shoulders; no third arm emerging from sleeve. Other four poses unchanged as closely as possible. Real transparent RGBA background and preserved soft edge alpha, no painted background, no text.

### Fox selected

Use case: precise-object-edit. Existing character variant for painted side-view game sprite. Use the purple fox from the attached atlas as the exact character reference: rich violet fur, white cheeks/chest/belly, huge fluffy white-tipped purple tail, black nose, pointed ears, fine painterly fur and dark outline. Produce ONE single static pose of this same fox deceased, lying limp on its SIDE on the ground with eyes fully CLOSED, head resting on ground, legs relaxed sideways, ears relaxed and tail lying softly. No breathing/action, no standing, no sitting, no curled sleeping ball. Tasteful non-graphic death depiction, NO blood, NO wounds, NO gore, no magic. Face points RIGHT as in the original. Complete full silhouette, clear grounding along bottom, centered with transparent padding on all sides. Isolated genuine transparent RGBA background, no ground texture, shadow oval, backdrop, labels, text, extra foxes or atlas grid.


## Final QA selection

QA-HANNAH-ART-001 r1 excludes ambiguous walk cells 0, 1, 3 and 4. The runtime uses only the clearly two-handed, held-scythe poses 2 and 5 in the sequence `[2,2,2,5,5,5]`: six existing 10 FPS ticks, with each alternate step held for 0.3 seconds. This is a conservative animation selection; it does not claim that every source cell was repaired. Native alpha, foot anchors and combat timing stay unchanged.
