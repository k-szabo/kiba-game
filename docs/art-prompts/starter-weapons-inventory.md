# Starter weapon inventory art

Approved static design reference: the user approved the equipment and inventory concepts on `exec-612e918d-a98c-4b71-8c08-d5e19daa5606.png` on 2026-10-23. Animation sketches are a separate approval gate and are not produced by this asset task.

Production file: `assets/images/ui/starter-weapons-v1.png`.

Tool: built-in ImageGen, transparent background enabled. Generated source alpha preserved without postprocessing.

Output: 1774 × 887 RGBA, two equal 887 × 887 cells. Left is the naginata; right is sword and shield. Recommended safe crops preserve the full cells: naginata `{x:0,y:0,w:887,h:887}`; sword and shield `{x:887,y:0,w:887,h:887}`. Full-cell crops provide breathing room without cutting tassels, weapon tips or the shield rim. The middle 4% alpha range is 0–1 (transparent apart from negligible generation noise).

## Generation prompt

Use case: stylized-concept. Production inventory icon sheet for Kiba Realms painted Japanese fantasy game, matching the approved equipment concept and existing `katana-inventory-v1.png` detailed high contrast painted steel/gold/navy materials. Static object art only: no characters or animation. True transparent PNG background. Landscape image with exactly two equal square cells arranged left and right, no dividing line. Left: one complete naginata displayed diagonally, a straight rigid dark polished wood shaft with bronze ferrules, one curved bright steel single-edged blade, short red tassel at the socket. Right: one matching short curved katana and one navy-painted wooden shield with gold rim, round boss and rivets. Both objects identifiable, no obscured cutting blade. Vivid opaque navy, bronze-gold, white steel and red; detailed painted materials, clean dark outlines and pale edge highlights readable against dark inventory backgrounds. Complete silhouettes inside separate cells, generous transparent margins. No text, labels, parchment, boxes, glow, haze, background shadows, guns, double blades, spear points, faces or additional objects.

The initial output crossed the cell midpoint, so a layout correction was generated before registration.

## Layout correction prompt

Keep the exact weapon designs, vivid material shading, painted style and true transparent background. Output a landscape 2:1 sheet with two equal square cells. Leave an empty vertical band over the middle 20%. Naginata fits in x=5–39%, y=12–88%, rotated closer to vertical as necessary, rigid straight shaft and complete blade, ferrules and tassel. Sword and navy/gold shield set fits in x=61–95%, y=12–88%. Reduce object groups uniformly as needed. Every tip, butt cap and tassel has transparent breathing room. No characters, text, labels, grid lines, glow or shadows. The image is cropped exactly at x=50%; each half contains its own isolated item with every part intact.

Selected output: `exec-63f496ce-82ca-48ed-a1d9-e7203babab56.png`. Visual inspection confirmed complete polearm, sword, tassels and shield. No character/animation art was generated. Actual inventory/browser readability remains an integration check.
