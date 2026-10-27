# Kiba Realms · Gameplay Guide

[Magyar játékmeneti útmutató](GAMEPLAY.md)

Kiba Realms is a browser-playable 2D metroidvania starring Momo, a shiba samurai searching for his father, Haru. Kiba is the energy flowing through all four realms. Its strength and nature change from place to place, and the game shows its current state in the upper HUD and through environmental effects.

The game starts with a silent dream prologue. After Momo wakes, follow the story from Japan into Yomi, then climb into Takamagahara. Each realm has its own route, enemies, guardian, and optional secrets.

## Controls

These are the default keys. Open **How to Play** from the main or pause menu to choose a UK or French layout, remap individual actions, and import or export bindings as JSON. Controls can now use mouse buttons. If the input is already assigned, the two actions exchange bindings.

| Default keys | Action |
| --- | --- |
| A / D or ← / → | Move |
| Space, W, or ↑ | Jump; release and press again for double jump after unlocking it |
| J or Z | Normal attack |
| H | Heavy attack; takes longer to wind up and deals more damage |
| K or Shift | Spirit dash after unlocking it |
| E | Interact, rest, open gates, and collect items |
| U | Spend an upgrade point at a shrine |
| M | Map and fast travel |
| S + Space | Drop through a ledge |
| I | Open inventory and pause the game |
| O | Use food |
| Esc | Pause |

The mobile interface and touch controls have been removed. The minimum supported viewport is 1280×720; play with a keyboard and mouse.

The wind streams lift Momo when he jumps into them. To use a torii gate, stand under its opening and press the interact action.

## Shrines, travel, and saves

Discover a shrine to add it to the map. Resting restores health, creates a checkpoint, and respawns normal enemies in that realm. You can fast travel to known shrines in completed realms, as well as to known shrines in your current realm. The dream prologue is not a travel destination. Guardians, minibosses, collected items, abilities, and opened routes stay completed.

Every fall is fatal. Momo returns to the last shrine at full health, and normal enemies respawn. XP and upgrades remain. A boss encounter interrupted by death or rest starts over, including its temporary enemies and hazards.

Saves are encrypted in browser storage and tied to the current browser profile. Continue from the main menu to resume the current release. During alpha and beta, each new game version resets progress; language and key bindings are kept. Reloading the same version preserves the save.

## XP and upgrades

Momo’s health is restored to his current maximum whenever he levels up.

Defeating enemies earns XP and levels, up to level 30. Regular enemies in later realms are stronger and award more XP. The first level requires 60 XP, with each following threshold increasing by 35 XP. Each level grants one upgrade point, and each stat accepts up to 12 upgrades. Total earned XP is still recorded at level 30 while the progress display shows MAX. At a shrine, spend points on:

- **Vitality:** increases maximum health.
- **Strength:** increases sword damage.
- **Spirit:** improves Spirit Dash, and becomes available after unlocking the dash.

The game saves XP, levels, and spent points automatically.

## Realms and guardians

- **Japan:** ring the forest and village bells, then reach the bamboo temple guardian. Explore side paths and the ancient angel tower hidden above the main route.
- **Yomi:** descend through the underworld and free its captive souls. At 80%, 60%, 40%, and 20% health, the demon summons two minions. At 50%, it becomes invulnerable and starts a lava shelter phase with the Lava Serpent. Defeat the serpent or survive until the penultimate platform collapses. At 10%, another lethal lava wave begins while the demon remains vulnerable; the final platform also collapses, and any surviving serpent returns with its remaining health. The serpent awards one collectible scale and XP the first time it is defeated. The [detailed Yomi boss and serpent rules](YOMI-BOSS.md) are currently documented in Hungarian.
- **Takamagahara:** rise through wind streams and cloud islands to the angel guardian. It begins as a light angel, transforms into a dark angel at half health, and has a hidden third form if Momo found the halo and demon lord's horn in Japan. The [hidden relic locations](SECRETS-0.6.md) are currently documented in Hungarian.

All guardians telegraph attacks and continue melee attacks alongside their spells. Minion, hazard, and platform states reset if the fight is interrupted.

## Inventory and secrets

Open the unlimited backpack with **I** or its HUD button. It pauses the game and shows Momo's equipped weapon alongside collected items. Current items include the angel halo, demon lord's horn, the Key of the Four Councillors, the Seal of Dusk, and the Lava Serpent Scale. The bone key opens the chained gate in Yomi and is consumed when used. If Momo has the halo and horn, defeating the angel's hidden final form fuses them into the Seal of Dusk.

The Four Councillors' Hall is optional. To receive its key, defeat all eight minions summoned during one Yomi guardian fight, then defeat the guardian. The key condition is intentionally hidden; the boss cannot be summoned again during that journey. The [optional branch guide](COUNCIL-BRANCH.md) is currently documented in Hungarian. You can still finish the main story if you miss it.

## Further reading

- [Development guide](DEVELOPMENT.md)
- [Release IDs and fix history](RELEASES.md) — Hungarian documentation.
- [Inventory implementation and item art](INVENTORY.md) — Hungarian documentation.

## Akash's Wares

O: use food. Akash sells his wares at the Forest Refuge after you free him in Yomi.

- **Compass:** Shows the direction and name of your next main objective beneath the task panel in the top-left corner. It indicates direction, not a traversable route; hidden paths are yours to discover.
- **Pocket Map:** Shows nearby ledges, known shrines and Momo's position in the corner of the screen.
- **Roast Meat of Unknown Origin:** Akash will not say what it is made of. Eating it has an equal chance to restore or remove 1 health, but cannot kill you. Quick use: O.

## Shadow Realm

Finding Haru opens a new Shadow Realm with cultists, three new bosses, collectible rewards and fast travel unlocked at an altar. Unlock fast travel at the Shadow Altar.

The Shadow Realm’s prison and its jailer now occupy a clearly visible side route beneath the main path. Haru’s trace and the cathedral can be reached without the prison key. Collect the jailer’s key and interact at the prison door; the key is consumed and the door stays open. Leave the marked circle or interrupt the priest with a heavy strike before the bell toll. The optional organist is hidden along an elevated platforming branch. Haru’s trace before the temple strengthens Momo with a brief story scene and a one-time heal of up to 2 HP. The search remains open after defeating the priest.
