# Közös bosskatalógus

Minden besorolt boss saját fájlt kap az `assets/config/bosses/` könyvtárban. A fájlnév és az `id` megegyezik a `data/boss-classification.json` azonosítójával. A `name` meglévő lokalizációs kulcs, nem külön játékosszöveg.

- `story`: a történeti változat alap HP-ja, testmérete és az adott vezérlő adatvezérelt profilja. A kígyók támadásprofilja, Hannah fázisai, az őssárkány ciklusa és a void démon gyógyulása is innen ered.
- `tower`: a torony alap HP-ja és a történetfüggetlen adapter saját mozgásprofilja. A torony szándékosan külön skálázást használ, a kampánybeli HP nem alkalmas az egységes felszerelésű kihíváshoz.
- `assets`: az `ART_MANIFEST` képkulcsai, beleértve a boss saját effektjeit. Ezekből dolgozik a közös előtöltés és a torony grafikai függőséglistája.

A build a JSON-fájlokat validálva beágyazza a runtime-ba; nincs új hálózati kérés vagy futás közbeni fájlbetöltés. A `BossCatalog` mélyen fagyasztott adatokat ad a vezérlőknek. A történeti események, mentésírások, jutalmak és az aktív támadási állapotgépek továbbra is a hozzájuk tartozó forrásmodulokban élnek.

Új bossnál a besorolást, a saját JSON-fájlt és a szükséges vezérlő/renderer integrációt együtt kell hozzáadni. A fájl megléte önmagában nem hoz létre új harcot. A `scripts/test-boss-catalog.cjs` ellenőrzi a teljes besorolás lefedését, a képkulcsokat, a közös profilt és hogy egy adatváltoztatás a tényleges sztori-/toronykonstruktorban is megjelenik.
