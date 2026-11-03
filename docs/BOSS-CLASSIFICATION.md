# Boss difficulty classification

The internal `BossClassification` catalog contains one entry per distinct boss encounter, including optional, secret, arena, dungeon, raid and story bosses. Repeated tower appearances do not create duplicate entries. The ordered catalog in `assets/js/boss-classification.js` is the sole source of truth.

Ratings are relative positions on a 1–100 scale: the first catalog entry is 10 and the last is 100. Entries between them are distributed linearly and rounded to the nearest integer. Inserting an encounter at its narrative position automatically recalculates later values, so adding a boss can lower existing ratings proportionally. Ratings describe roster order, not health, damage or a promise of combat balance; they are internal development metadata and are not shown in the player UI.

Run `node scripts/test-boss-classification.cjs` after editing the catalog. Every entry needs a unique stable ID and existing HU/EN name keys.
