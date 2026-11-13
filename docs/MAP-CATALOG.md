# Map catalog

All physical level geometry is authored in `assets/config/maps/*.json`. Each
file has a schema-versioned record whose `id` matches its filename. The catalog
covers the four realms and their side locations, camps and interiors, dungeon
floors, story raids, the ninja routes, and the arena maps used by Duel Across
Realms. Virtual travel destinations and the Endless Tower's procedural floor
layout are not physical maps and remain with their respective travel and tower
systems.

## Loading and ownership

`scripts/build-game.mjs` validates the JSON records and embeds them in the
generated `MAP_DATA` object in `assets/js/runtime.js`; the browser does not
fetch map files separately. `MapCatalog.build(id)` makes a mutable runtime
copy of a catalog record and replaces story-raid encounter snapshots with the
canonical encounter records. `levels.js` constructs the shared map instances
from `LOCATION_MAP_IDS`, then registers the main realms, side locations,
dungeons and travel destinations. Other gameplay systems use those same
instances.

Map JSON owns static geometry and authored placement: dimensions, spawn,
platforms, rests, zones, objects, gates, hazards, enemy placements, boss and
arena locations, fixed grapple anchors, and route destinations. JavaScript
modules own behavior that changes during play: movement and collision rules,
timers, combat, quest transitions, save state, rewards and dynamic encounter
state. NPC identity and art references live in `assets/config/npcs/`; boss
profiles and tower rotation data live in `assets/config/bosses/`.

Do not add a per-area JavaScript map builder. For a new or changed location,
edit its JSON record and make sure its ID is included in `LOCATION_MAP_IDS` in
`assets/js/levels.js` if it is a registered physical location. Keep saved
location, rest and object identifiers stable unless a documented save-breaking
change is intended. Keep symbolic destinations consistent with the registered
location IDs.

## Validation

The build checks schema version, filename/ID agreement, dimensions, geometry,
localization and art references, and route references. The runtime map
instances preserve object identity where side-location and checkpoint logic
depends on it. Focused checks include:

- `scripts/test-routes.cjs` for registered routes and travel destinations.
- `scripts/test-npc-catalog.cjs` for authored enemy placements and friendly
  residents against the NPC catalog.
- `scripts/test-boss-catalog.cjs` and `scripts/test-tower-catalog.cjs` for boss
  records and tower roster coverage.
- The route and encounter tests for dungeon, raid, grapple, follower and arena
  behavior.

Run `node scripts/build-game.mjs --check` after editing catalog data. It verifies
that the checked-in browser bundle matches its source without rewriting it.
