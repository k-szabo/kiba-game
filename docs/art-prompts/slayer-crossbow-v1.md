# Slayer crossbow inventory art

- Date: 2026-10-20.
- Tool: built-in ImageGen, transparent background requested.
- Approved concept: `exec-7442867c-2a40-47aa-a950-04a4e809ece6.png`; user approved the new crossbow and the earlier concept's remaining elements together.
- Output: `assets/images/items/slayer-crossbow-v1.png`.
- Generated source: `exec-772baa62-6bae-421b-a003-d0aab91bd9c1.png`.
- Original generated RGBA copied without pixel modification; preserve its alpha when integrating.
- This is a static icon, with no animation or gameplay geometry changes.
- Integrator registers the full silhouette in ART_INVENTORY.items and checks HU/EN desktop/narrow appearance with the shared DPR-aware renderer.

## Prompt

Use case: background-extraction / precise-object-edit. Production inventory icon for Kiba. Input image is the EXACT USER-APPROVED crossbow concept. Keep the crossbow itself unchanged: same silhouette, same elevated three-quarter angle, same two steel bow limbs, one taut V-shaped bowstring, central single bolt, wooden and olive lacquered stock, brass fittings, front stirrup, trigger guard, leather-wrapped grip and rear shoulder butt. Remove only the blue-grey studio background and the cast shadow. Return ONE isolated complete crossbow on a genuinely TRANSPARENT RGBA background, with all bow limbs, both string segments, bolt tip, stirrup and butt fully inside generous transparent margins. Do not redraw or simplify the weapon, do not rotate it, do not add parts or extra strings. Preserve the painted texture, warm highlights and crisp opaque object detail for readability over a dark inventory tile. No ground, no shadow, no lettering, no border, no other objects, no glow.
