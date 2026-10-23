# Armor — developer reference

Trello: https://trello.com/c/cMNEpXiy. Source: `assets/js/armor.js`.

## Shared rule

`Armor.reduction(armor)` returns a fraction: `armor / (armor + K)`, with `Armor.K = 100`. `Armor.damage(amount, armor)` returns the remaining damage: `amount * K / (armor + K)`.

| Armor | Reduction | Damage from a 5 HP hit |
| --- | --- | --- |
| 0 | 0% | 5 |
| 50 | 33⅓% | 3⅓ |
| 100 | 50% | 2.5 |
| 400 | 80% | 1 |

Negative, missing and non-finite armor counts as zero. Invalid or non-positive damage returns zero. Values are numbers, without string coercion. Positive fractional hits remain fractional; there is no rounding or fixed damage floor. The retained share is calculated directly to avoid cancellation at very high armor.

## Current consumer and extension boundary

The Demon Slayer starts each attempt with zero armor. A saw strike that actually damages the current player grants 50 armor, capped at 400, alongside its existing 20 HP heal. Invulnerability, dash, immortality, lethal hits that respawn Momo, and obsolete encounters cannot grant armor. Retreat timing, cast duration, attacks, hitboxes and directional shield blocking are unchanged. Resetting the encounter clears armor; armor is not permanent progression and is not saved.

The shared module has no actor, equipment, DOM or save dependencies. Future Momo equipment can supply its total armor to this same calculation. This change adds no Momo armor slots, armor items, stat upgrades or save fields. Before connecting player equipment, explicitly decide mitigation order relative to shield absorption, environmental damage and executions; update fractional HP rendering, healing and save validation together. Current Momo damage, lethal falls and the mandatory prologue defeat remain unchanged.

## Validation

`npm run test:armor` covers the formula and real guardian damage/armor lifecycle. The full `npm test` includes these tests, shield/weapon combat, prologue, death/reset and encrypted release-save checks. The build, harness, route loader, site checks and release fixtures all load the shared module before its consumers.
