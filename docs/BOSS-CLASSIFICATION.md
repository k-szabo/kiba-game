# Boss difficulty classification

The development classification reads the same encounter records as the game from `assets/config/bosses/`. Each file represents one encounter and provides its stable ID, localized name key, group, and `classificationOrder`.

Ratings are relative positions on a 1–100 scale: the first catalog entry is 10 and the last is 100. Entries between them are distributed linearly and rounded to the nearest integer. Inserting an encounter at its narrative position automatically recalculates later values, so adding a boss can lower existing ratings proportionally. Ratings describe roster order, not health, damage or a promise of combat balance; they are internal development metadata and are not shown in the player UI.

The development check calculates ratings from `classificationOrder`. The game builds the tower rotation using `tower.order` from those same files.

Run `node scripts/test-boss-classification.cjs` after editing the catalog.
