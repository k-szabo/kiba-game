# Armor — developer reference

Trello: https://trello.com/c/cMNEpXiy. Source: `assets/js/armor.js`.

## Shared rule

`Armor.reduction(armor)` returns a fraction: `armor / (armor + K)`, with `Armor.K = 100`. `Armor.damage(amount, armor)` returns the remaining damage: `amount * K / (armor + K)`.

| Armor | Reduction | Damage from a 5 HP hit |
| --- | --- | --- |
| 0 | 0% | 5 |
| 20 | 16⅔% | 4⅙ |
| 50 | 33⅓% | 3⅓ |
| 100 | 50% | 2.5 |
| 120 | ≈54.55% | ≈2.27 |
| 400 | 80% | 1 |

Negative, missing and non-finite armor counts as zero. Invalid or non-positive damage returns zero. Values are numbers, without string coercion. Positive fractional hits remain fractional; there is no rounding or fixed damage floor. The retained share is calculated directly to avoid cancellation at very high armor.

## Armored combatants

The Demon Slayer starts each attempt with zero armor. A saw strike that actually damages the current player grants 50 armor, capped at 400, alongside its existing 20 HP heal. Invulnerability, dash, immortality, lethal hits that respawn Momo, and obsolete encounters cannot grant armor. Retreat timing, cast duration, attacks, hitboxes and directional shield blocking are unchanged. Resetting the encounter clears armor; armor is not permanent progression and is not saved.

The shared module has no actor, equipment, DOM or save dependencies. Momo now receives permanent armor from Ren's forge: `campServices.armorRank` is an integer from 0 to 5 and each rank contributes 20 Armor, for at most 100 Armor / 50% reduction. It is a saved forge rank, not a new inventory armor item or shrine-point stat. Each next rank costs 50 × its resulting rank in coins.

The directional starter shield absorbs its single point first; `Armor.damage` then mitigates the remaining ordinary incoming hit. Environmental damage skips the shield but still uses armor. Invulnerability, Spirit Dash and developer immortality precede both defenses. Lethal falls use the respawn path directly, the mandatory dream defeat bypasses armor, and the Demon Slayer's low-HP grab explicitly bypasses shield and armor while retaining invulnerability/dash/immortality protection.

Positive fractional HP is retained through side-location transitions and equipment changes; changing equipment never heals. `CampHealth.render` displays partial hearts and a localized accessible health count. Poisoned food cannot raise a character below 1 HP to 1 HP. Brews, meat, tea, shrine healing and health-cap changes use their existing caps and timing.

## Validation

`npm run test:armor` covers the formula and real guardian damage/armor lifecycle. The focused `test-camp-armor.cjs` exercises player forge ranks, shield ordering, fractional hearts, immunity, lethal falls, actual low-HP grab contact and the mandatory dream defeat. The full `npm test` includes these tests, shield/weapon combat, prologue, death/reset and encrypted release-save checks. The build, harness, route loader, site checks and release fixtures all load the shared module before its consumers.

## Serpent talisman equipment

The three scales can be fused by Fumi into the `triuneSerpentTalisman` accessory. Ownership alone grants no armor: `equippedTalisman` must reference the owned result. While equipped it adds 20 Armor to Ren's forge contribution, for a current combined maximum of 120 Armor (about 54.55% reduction). The accessory and weapon slots are independent. Equipping or removing it never heals, changes maximum health, grants training points or modifies weapon damage. The ordinary damage/shield ordering and forced-death bypass rules remain unchanged.

See [SERPENTS.md](SERPENTS.md) for persistence and fusion prerequisites. The new fusion and save regressions complement the formula and camp-armor tests; real equipment layout and reload are browser-QA concerns.
