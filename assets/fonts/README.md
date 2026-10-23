# Local game fonts

- **Noto Serif JP**: headings, dialogue and intentional Japanese markers.
- **Noto Serif**: local Latin serif fallback for story glyphs absent from Noto Serif JP, including Hungarian double accents and fractions.
- **Noto Sans**: controls, menus, HUD and Canvas labels; Japanese glyphs fall back to Noto Serif JP.

The unmodified TrueType subset files were supplied by the official Google Fonts CSS2 service. They are hosted with the static game, with `font-display: swap`; gameplay and readable system fallbacks remain available while fonts load or if a request fails. No runtime request to Google Fonts is needed.

Copyright and redistribution terms are included in the three `*-OFL.txt` files (SIL Open Font License 1.1). Only line endings and trailing whitespace in these license text files are normalized; CSS family aliases do not modify the font binaries. `manifest.json` records the provider URLs, weights, bytes, SHA256 hashes and requested characters.

The requested subset includes Basic Latin, Latin-1 and Extended Latin through U+024F, current HU/EN locale characters and intentional Japanese markers from HTML/JS. Coverage of requested characters still depends on the original family: Noto Sans does not itself include the Japanese glyphs; Noto Serif JP omits Hungarian double accents and fraction glyphs, which fall back to the local Noto Serif. The binary `cmap` regression check verifies the actual HU/EN and Japanese coverage of these explicit local chains. Adding a new script or localized character requires checking coverage and, if necessary, downloading updated official subsets under new filenames, retaining the license and updating the manifest/CSS/preloads. Do not silently depend on a system fallback for newly added game text.

Official family records:

- https://github.com/google/fonts/tree/main/ofl/notoserifjp
- https://github.com/google/fonts/tree/main/ofl/notoserif
- https://github.com/google/fonts/tree/main/ofl/notosans

See [the typography guide](../../docs/TYPOGRAPHY.md) for integration and validation.
