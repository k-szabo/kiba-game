---
name: kiba-art-pipeline
description: Create or integrate Kiba bitmap art, sprites, animation, backgrounds, or VFX while preserving visual style and gameplay geometry.
---

- Inspect current references, relevant ART_MANIFEST/crop metadata, and assets/config/colormaps.json. Read the relevant art document, prioritizing current assets over historical filenames.
- Match detailed painted Japanese fantasy scenery and current Momo design. For bitmap generation/editing use the available imagegen skill/tool. Do not substitute flat primitives for requested detailed art; report unavailable tooling.
- Preserve source alpha and save prompts in docs/art-prompts/. Inspect output before registration. Check full weapon/effect silhouettes, distinct factions, sheet cell separation, and stable ground/eye anchors across frames.
- Edit only owned files. Preserve damage, timing, hitboxes, and collision geometry for art-only tasks; derive animation/effect placement from existing combat state.
- Check crop bounds, anchors, pause/reduced motion, and telegraph readability against bright/dark backgrounds. Use actual browser previews; mocked draw calls do not establish visual quality.
- Hand the integrator asset/prompt paths, crop/anchor changes, previews, and checks. The integrator refreshes colormaps and builds after parallel edits finish.
- If QA rejected this work, apply kiba-qa-rework before repair edits or replacement image generation.
- Before finalizing player-facing names, labels, or descriptions for items, bosses, characters, or artwork, share the proposed wording with the user and wait for explicit approval. Image production may continue; keep unapproved text out of shipped assets and catalogs.
