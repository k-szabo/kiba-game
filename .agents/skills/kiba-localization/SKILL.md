---
name: kiba-localization
description: Add or change Kiba translations, language metadata, or localized UI/story text in the shared locale catalog.
---

- Use assets/i18n/locales.json: each ISO two-letter key has flag, lang_en, lang_orig, and dict. Update both current languages, matching keys and numbered placeholders.
- Keep Momo/Haru names and Kiba energy/world terminology consistent. Preserve native/English display names and SVG flag data URLs.
- Use I18n.t/I18n.format in source. Do not introduce a second dictionary or hardcoded UI translations. Keep story paragraph breaks intentional.
- Instructions showing controls use selected action bindings rather than assuming a fixed keyboard layout.
- Check HU/EN wrapping, clipping, and focus/control access where text changed. The integrator rebuilds runtime.js; check-site.mjs verifies keys, metadata, and placeholders.
- Coordinate the shared JSON's single editor. If QA rejected this work, apply kiba-qa-rework before edits.
