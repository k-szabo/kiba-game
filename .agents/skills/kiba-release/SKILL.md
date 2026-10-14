---
name: kiba-release
description: Integrate and validate Kiba changes for the static GitHub Pages package, including runtime, references, and release evidence.
---

- Act as assigned integrator after relevant parallel source edits finish. Resolve outstanding QA findings with both repair-plan approval and implementation acceptance.
- Before each published alpha/beta version, bump assets/config/release.json. Every version change resets previous-release progress, preserving language/keybinding preferences. Validate same-release reload and version-change reset.
- Run npm run build for source/locale/binding changes; the build synchronizes entrypoint cache URLs and the menu version badge. Keep generated assets/js/runtime.js in Git; never repair it by hand.
- Refresh/check python scripts/export-colormaps.py after image/crop/palette changes, with --node when needed. Do not regenerate it for unrelated changes.
- Run relevant checks and npm test before release. Use kiba-browser-qa for UI/rendering/real-storage claims; VM success is not a full browser playthrough.
- Check references/case, cache queries for changed served files, intended docs, and git diff --check. Preserve user changes.
- Pages publishes only index.html, .nojekyll, and assets/. Keep agent instructions/skills and development docs repository-only; do not upload the whole checkout.
- Keep scratch output in ignored .codex/work/. Preparing a release does not authorize push, PR, or deployment; follow existing user authorization and report what actually happened.
