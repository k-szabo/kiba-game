# Character catalogue

`assets/config/npcs/` contains one JSON record for every regular enemy archetype,
friendly character and boss encounter. The build embeds these records as
`NPC_DATA`; `NpcCatalog` exposes immutable lookup data without network requests.

Each schema-1 record has an internal `id`, `kind` (`enemy`, `npc` or `boss`),
`faction`, existing localized `name` key when available, and explicit selectors.
Unnamed regular roles retain `name: null`; the catalogue does not invent visible
names. Haru preserves his existing literal name through `legacyName`.

`art.sprites` contains complete body sprite atlas keys from `ART_MANIFEST`, with
the existing crop/pose registration in `metadata`, or an existing renderer in
`renderer`. `art.effects` lists the remaining encounter assets. These references
reuse the active art rather than copying large frame arrays into JSON. Yomi's
two rescued souls use the existing procedural spirit renderer and explicitly
declare it instead of claiming to have a bitmap body.

Boss records reference their canonical `assets/config/bosses/<id>.json` through
`bossConfig`; boss HP and attack rules continue to come from that config. Multiple
encounters/forms of one character remain separate boss records. Friendly Fia,
Haru, Westheru and the attendants also list their noncombat sprite variants.

`NpcCatalog.forEnemy(spec, faction)` resolves explicit boss, ninja, undead,
resident, service and arena markers before generic faction/role pairs.
`NpcCatalog.find({npcId})` resolves friendly map identities, and `assets(id)`
returns the distinct sprite and effect image keys. `createEnemy` records the
resolved `npcCatalogId`; standard faction enemies take their base HP and body
dimensions from their JSON `combat` fields. Realm multipliers, authored spawn
overrides and specialized controllers retain precedence. Enemy placements and
the rest of each physical map's authored geometry live in
`assets/config/maps/*.json` (see [MAP-CATALOG.md](MAP-CATALOG.md)). Actor
animation, rewards and save flags continue to use their gameplay owners.

When adding a character, add its JSON and existing locale/art references, then
run `node scripts/test-npc-catalog.cjs`. This checks actual map enemies and
friendly residents, boss links, sprite metadata, image files, immutable records,
and a changed authored value flowing through the actual constructor.
