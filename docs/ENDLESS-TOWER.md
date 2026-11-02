# Végtelen torony

A főmenüből indítható külön kihívás a meglévő mozgást, fegyvereket és normál ellenfeleket használja. A torony festett hátterén a kijelölt lángok és ablakködök a közös háttéranimációs rendszerrel változnak; szünetben megállnak, csökkentett mozgásnál az eredeti kép látszik. A kaland felszerelése és fejlődése nem kerül a futamba: az indulás 20 alap HP, a három kezdő fegyver egyike, dupla ugrás és szellemlépés. A kard–pajzs saját +2 HP-ja és elülső védése megmarad.

## Futam és checkpoint

- Egy emelet akkor teljesített, ha minden ellenfele meghalt. A következő emelet külön gombbal indul; az emeletközi képernyőn az idő áll.
- Normál teljesítés 2 HP-t gyógyít. Minden ötödik teljesített emelet teljesen gyógyít és checkpointot ír; az indulás egy külön, nulladik visszatérési pont.
- Halál, lezárás vagy újratöltés után a checkpointot követő első emelet teljes HP-val indul. A checkpoint óta eltelt részleges blokk harca újrajátszandó, a rekord viszont megmarad.
- A rekord a teljesített emeleteket hasonlítja először, majd az ellenfelek számát, végül a rövidebb aktív játékidőt. Új futam a checkpointot törli, a rekordot megtartja.

## Modulok

`tower-rules.js`: tiszta, determinisztikus emeletgenerátor és futamszabályok. A seed és az emeletszám választja az ellenfeleket. Számuk 3-ról legfeljebb 8-ra nő, HP-juk és sebzésük folyamatosan skálázódik; minden ötödik emelet erősebb elitet tartalmaz. A témák öt emeletenként váltanak. A számlálók végesek és biztonságos számhatárok között maradnak.

`tower-mode.js`: a közös harci motor elkülönített vezérlője. A közös játékos-időzítők egyszer, a fő ciklusban lépnek, a torony pedig saját emeletet, ellenfeleket, lövedékeket és UI-t futtat. Szünetben, dialógusban, emeletközi képernyőn és túl kicsi nézetnél nem lép a futamóra. A toronyban nincs XP-, érme- vagy kalandjutalom, inventory-, fejlesztés-, gyorsutazás- vagy dev-mód belépés. Kilépéskor a kaland korábbi mentéspéldánya tér vissza; a rendes Folytatás a normál betöltési útvonalat használja.

`tower-store.js`: külön `kiba-infinite-tower-v1` helyi rekord. A sémában checkpoint, legjobb és utolsó eredmény van; a checkpoint seedet, fegyvert, teljesített emeletet, ellenfélszámot és aktív időt rögzít. A modul nem olvassa vagy írja a kaland titkosított SaveVault-rekordját, profilját vagy preferenciáit. Sérült/jövőbeli rekordot nem ír felül; tárolási hiba esetén memóriában folytatja, látható figyelmeztetéssel. Másik futam seedjével a régi lap nem írhat checkpointot. A rekord helyi, játékos által vezérelt adat, nem szerver által hitelesített ranglista.

## Ellenőrzések

- `test-tower-rules.cjs`: determinisztikus emeletek, nehezedés, gyógyítás, checkpoint és hibás adatok.
- `test-tower-store.cjs`: újratöltés, új futam, rekordmegőrzés, elavult lap, hibás/jövőbeli rekord és tárolási hibák; a kaland kulcsai változatlanok.
- `test-tower-mode.cjs`: három felszerelés, közös mozgás/harc, kalandmentés-írás tiltása, halál/checkpoint, szünet és 30/60/120 FPS melletti dash/gravitáció.
- Valódi böngésző: friss szintetikus profil, a kaland titkosított rekordjának összehasonlítása, ötödik emeleti checkpoint, halál/folytatás, tényleges újratöltés, HU/EN és asztali nézetméretek. A felgyorsított checkpoint-próba nem bizonyít teljes nehézségi végigjátszást.
