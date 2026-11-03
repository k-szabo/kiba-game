# Boss difficulty classification

The internal development catalog contains one entry per distinct boss encounter, including optional, secret, arena, dungeon, raid and story bosses. Repeated tower appearances do not create duplicate entries. The ordered catalog in `data/boss-classification.json` is the sole source of truth. This file is kept outside `assets/` and is not bundled into the game or deployed to GitHub Pages.

Ratings are relative positions on a 1–100 scale: the first catalog entry is 10 and the last is 100. Entries between them are distributed linearly and rounded to the nearest integer. Inserting an encounter at its narrative position automatically recalculates later values, so adding a boss can lower existing ratings proportionally. Ratings describe roster order, not health, damage or a promise of combat balance; they are internal development metadata and are not shown in the player UI.

Ratings are calculated from the JSON order by the development check; no catalog code is shipped to the browser. Every entry needs a unique stable ID and existing HU/EN name keys. Each distinct encounter should appear once.

Run `node scripts/test-boss-classification.cjs` after editing the catalog.
