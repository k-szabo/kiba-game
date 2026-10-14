# Momo – A kard útja · 0.4

## Animáció és hibajavítás

A tizenkét normál ellenfélszereplő hat mozgási és hat támadási képkockát kapott: összesen 144 új animációs képkockát. A mozgási ciklus a megtett úthoz igazodik, a támadó sorozat előkészítésből, fegyveremelésből vagy célzásból, elengedésből és lecsengésből áll. A támadás előjelzése alatt az irány rögzített. Momo eredeti képfájlja változatlan.

A forgó beakadás oka a játékos követése és a járőrhatáron történő visszafordulás közötti verseny volt. Az új mozgás külön kezeli a járőrözést és az üldözést, fordulási késleltetést és holtsávot használ. A járőrtartomány a platform járható területén belül marad. A tartományon túli célpontot a szélről figyeli, képkockánkénti irányváltás nélkül.

A rács alapján levágott lábak, szárnyak és fegyverek helyett alfa alapján meghatározott képkivágások és illesztési pontok használatosak. A kivágás a kiálló fegyverrészeket is követi; a forrás-PNG-k nem változnak a feldolgozáskor. A sisak és pajzs következetességét célzott képszerkesztés javította. A platformok és kellékek javított atlaszt kaptak. A rajzoló gyorsítótárazott Canvas-útvonalakat használ a kivágásokhoz.

## Bossok

| Őrző | Támadások | Válasz |
| --- | --- | --- |
| Japán szamuráj | Széles kardvágás, roham, kettős vágás | Figyeld a felemelt kardot és az arany támadási sávot; támadj a lecsengés alatt. |
| Volkáni oni | Kalapács és lokális kitörések, teljes arénás láva, parázsszórás | A láva előtt ugorj a kőszigetekre. A repedező szigetről haladj a következőre. |
| Megrontott szeráf | Óriási fénynyilak, célzott árnyéklövedékek, kombinált napfogyatkozás | Lépj ki az arany oszlopokból, az árnyéklövedékek elől ugorj vagy lépj szellemformába. |

Minden támadás külön előkészítési időt és visszatámadási ablakot kapott. Az oni arénájának hét szigete egyszerű ugrással elérhető a padlóról; a szigetek közötti út az ugrás fizikájával ellenőrzött. A platformok sorban omlanak le, az utolsó menedék a láva végéig megmarad. Új lávaciklus előtt a szükséges szigetek visszatérnek. Halál, szentélyes gyógyulás, gyorsutazás vagy a boss legyőzése megszünteti a függő boss-támadásokat és visszaállítja a platformokat.

## Szentély, XP és jelzések

A szentélynél gyógyulás újraéleszti az adott birodalom normál ellenfeleit. A bossok és küldetések előrehaladása megmarad. A győzelmek XP-t adnak, a szintlépés fejlesztéspontot. A szentélynél U vagy a Fejlesztés gomb nyitja az életerő, kard és szellem fejlesztését. Mindez ugyanabba a mentésbe kerül; a korábbi mentések megmaradnak.

A széláramlatok kontrasztos kék fényoszlopot, több mozgó szalagot, nagy felfelé haladó nyilakat, részecskéket és belépési jelzést kaptak. A boss-támadások szöveges előjelzése mellett földi repedések, omlásjelzők, célzási körvonalak és eltérő színű varázslatok segítik a kitérést.

## Képgenerálási mód és assetek

A kilenc új atlasz a beépített **ImageGen** eszközzel készült, a korábbi figurákat használó stílusreferenciákkal és célzott javításokkal. Teljes promptkészletek: [animációk](ANIMATION-PROMPTS.json), [animációjavítások](ANIMATION-REPAIR-PROMPTS.json), [terep és kellékek](REPAIRED-SCENERY-PROMPTS.json). Az esetleges további alfa-javítás promptja az `ALPHA-REPAIR-PROMPT.json` fájlban szerepel.

Projektbe mentett képek:

- `assets/images/enemies/japan-walk-v4.png`, `japan-attack-v4.png`
- `assets/images/enemies/yomi-walk-v4.png`, `yomi-attack-v4.png`
- `assets/images/enemies/heaven-walk-v4.png`, `heaven-attack-v4.png`
- `assets/images/enemies/bosses-v4.png`
- `assets/images/terrain-v4.png`, `assets/images/props-v4.png`

## Ellenőrzések

```sh
node scripts/check-site.mjs
node scripts/test-combat.cjs
node scripts/test-routes.cjs
```

A tesztek lefedik az összes birodalom és szerepkör járőrhatárát, pajzsblokkolást, támadási előkészítést, egyszeri XP-jóváírást, pontköltést, mentésátvételt, szentélyes újraéledést, boss-moveseteket, láva és platformok életciklusát, angyalvarázslatokat, képkivágásokat és HTML-elemeket. A korábbi küldetések, kapuk, szélfolyamok és a végső mentés útvonalai a tényleges ugrási/gravitációs függvényekkel ellenőrzöttek. A biztonságos lávasziget tesztje nem használ sebezhetetlenséget.

A grafika a játék tényleges Canvas-rajzolókódjával ellenőrzött. Teljes böngészős végigjátszás ebben a környezetben nem történt. A csomag feltöltésre kész; az élő GitHub Pages-oldal a repository frissítése után vált 0.4-re.
