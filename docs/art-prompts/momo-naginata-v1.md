# Momo naginata production layers

Tool: built-in image_gen, transparent_background: true. User approved the colored static loadout concept and revised rigid technical storyboard before production.

## Sources and assembly

- Static concept: exec-612e918d-a98c-4b71-8c08-d5e19daa5606.
- Approved storyboard: docs/images/starter-weapons-motion-plan.svg and .png.
- Normal body-only: exec-f23132d5-ba66-45a3-a255-9fd13ee41834; assets/images/momo-naginata-normal-v1.png.
- Heavy body-only: exec-c71d8622-c7a9-48b4-9d4d-b641094a20d0; assets/images/momo-naginata-heavy-v1.png.
- Rigid prop: exec-023613a0-62d8-49fd-9ef3-d7c9cbfbe675; assets/images/ui/naginata-rigid-v1.png.

Each 1536 x 1024 RGBA body atlas contains six weapon-free poses in three columns and two rows. Reuse the separate prop at constant body-relative scale; translation and rotation may vary, weapon length must not. Hands can slide along the same shaft.

Selected source pixels and alpha are copied unchanged. Transparent RGB can contain colored remnants; respect source alpha. Prompt coordinates/body heights were not reproduced exactly; actual body height is approximately420 source pixels. Use measured registration metadata.

Discarded integrated normal atlas exec-a51cbbcc-094a-4634-8854-273527886935 varied weapon length. It was used only as the input to the body-only edit and is not shipped.

Mechanical impact: normal0.16/0.42 seconds, heavy0.38/0.9 seconds. Renderer follows combat state.

## Normal body-only prompt

Input: discarded integrated normal atlas exec-a51cbbcc-094a-4634-8854-273527886935.

```text
Use case: precise-object-edit. Existing six-pose Momo normal polearm sprite sheet input. Produce clean BODY-ONLY sprite atlas with SAME six bodies, poses and arrangement, and actual fully transparent background. Remove ALL polearms completely: shaft, blade, gold fittings, hanging red cord. Do NOT remove or redraw the closed hands; keep both hands anatomically attached and closed in the SAME visible grips as if holding an invisible stick. Exactly two forepaws two hindfeet. NO weapon in any cell. Keep exactly same orangecreamMomo, navygoldarmor, redheadband, redbeltsash, curledtail, all faceRIGHT. Correct background by removing ALL dark colored halo/haze/backdrop and contactshadow; beyond bodies pixel alpha MUST be0, no glow or semi-transparent rectangle. Keep original fur and silhouette, actualRGBAtransparent. Layout exact1536x1024 3columns2rows of512x512. SIX body-only cutouts readingready, drawback, extendstart, fullthrust, retract, return. Entire figures fit cells with clear transparentspace. Normalize bodyheight ears-tofeet300px everycell, headsize100px, keepfeetbaseline450localcell. ScaleONLY body consistentlyall6, no minishrink when crouch; crouch may lower headnaturally. Hands should both be in visible horizontalclosedgrip across lowerchest, LEFT/near handlocalx205y315 and RIGHT/farhandlocalx275y315 atready; drawback pairlocalx185/255 y315, extensionstartlocalx225/295y315, fullthrustlocalx245/315y315, retract225/295y315, ready205/275y315. If hands needrepositioning moveforearmsanatomicallyandbody smalllean, exactly70pxbetweenhands. No paintedprop or invisibleweaponshadow. Keep detailedpaintedfinish, no sketch/text/grid. These are body-layers for rigid weapon overlay.
```

## Heavy body-only prompt

Inputs: selected normal body atlas exec-f23132d5-ba66-45a3-a255-9fd13ee41834; docs/images/starter-weapons-motion-plan.png.

```text
Use case: stylized-concept. Asset type: PRODUCTION BODY-ONLY six-pose transparent Momo spriteatlas for approved two-handed naginata HEAVY motion. Image1 Momo body-only normal atlas is exact character/painted finish/size reference; image2 approved technical motion diagram second row is pose reference. Do NOT paint a naginata, pole, sword, or any object. Hands close around an invisible straight pole held at two positions, for a rigid prop overlaid by engine. Orangecream shiba, redheadband, navygoldarmor, curledcreamtail; exactlyTWOconnectedforepaws+TWOgroundedhindfeet. Samehead, clothes, armorall6poses. Finished painted cartoon fantasy sprites, notsketch. REALTRANSPARENTALPHA0 background, absolutely no haze/glow/shadow/rectangularbackdrop. Transparent RGB may beanything but alpha0 outside6bodies.
Exactly1536x1024 3columns2rows, SIXseparatefullbodies equal512cells. Feetbaseline localy455 allframes, torso centerlocalx240, Momo bodyheight ears-tofeet330px EVERYframe, headwidth110. Raisedarmsmayextendup tolocaly65, keepheadsamebodyheight. Allsilhouettes with40pxtransparentpadding fromcellboundary. AllfaceRIGHT consistentstrictside3quarterview, fixedbodyproportionsandbodyscale. The fullcharacter mustfitall6cells.
SIXdistinctposes:
1ready, bothclosedhands lowchestheight, nearhandlocalx205 y300 farhand275 y300.
2raise, bothforearmsnaturallybendup, handsatlocalx205y125 and275y125, palmsgrippinginvisiblerigidHORIZONTALshaft ABOVEhead.
3gather, same overheadgrips hands205/275y105, elbowsnatural, headandbodyunchangedsize.
4sweepstart, nearhand205y165 farhand270y190, bothhandsfollow ONE diagonalinvisiblepole, noextralimbs.
5full downforwardcut, nearhand220y250 farhand280y295, deeperknees/torsoleansforwardnaturally but sameheadsize, solesstay455.
6recoverlowchest ready hands205/275y300.
Elbows are anatomically connected to shoulders: twoupperarms twoforearms twopaws total; hands notfloating nor severed. Closedhand grip continuouslysamehandorientation, no crossed/dislocatedwrists. Bothforepawsremain clearlyvisible infrontoftorso/head to allowpropoverlay. No polepainted, nogoldgripmarks, noguideobjects. No text/grid/celllines, no visualeffects. Maintain exactsameMomo character andfeetregistrationall6cells.
```

## Rigid prop prompt

Input: approved static concept exec-612e918d-a98c-4b71-8c08-d5e19daa5606.

```text
Use case: precise-object-edit. Use ONLY top-middle inventory naginata from input approved concept. Create ONE isolated rigid naginata item sprite on TRUE transparent background, horizontal exactly sideview pointingRIGHT. No character, no hand, no figures, no labels or sheet. Long straight dark brown woodenshaft, silvergentlycurvedsingleblade atRIGHT withgoldsocket, smallredcord hangingfromsocket, goldenbuttcap atLEFT. Same navy/gold/red Japanese painted-cartoon fantasy style as approved naginata icon. Not spear, no straight double-edgepoint. It is a naginata with curvedbladetip, elegant proportional blade ~25% entirelength, woodenpole~75%. Entire object butt-to-tip fitswith at least100px transparentmargin toallimageedges. Large clean highresolution singleprop, drawn approximatelyhorizontalcenter of landscape1536x1024canvas; butt aroundx130 y500, bladetipx1390 y460, straightshaft fromx130y500 tox1060y500. Silhouettecomplete, redcordendsvisible. All far-background alpha0; absolutely no shadow, glow, vignette, colored rectangle, texture field, backdrop. Same detailedpaintfinish andboldfineoutlines as source, nopaper. This ONE sharedweapon will be rotated andtranslated inallanimationframes, so do not createanyvariants orposes.
```
