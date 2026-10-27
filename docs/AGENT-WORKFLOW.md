# Agentek és fejlesztési folyamat

A főagent koordinál és integrál; az önálló részfeladatokat specialistáknak adhatja. Egyszerre legfeljebb három subagent dolgozzon, a környezet alacsonyabb limitjét betartva. Kis hibához nem kell teljes csapatot indítani.

## Szerepek és felelősség

| Szerep | Elsődleges terület |
| --- | --- |
| Koordinátor/integrátor | Feladatbontás, fájlkiosztás, integráció, build, colormap és végső ellenőrzés. Alapból a főagent végzi. |
| Gameplay | Harc, mozgás, ellenfelek, bossok, fejlődés; combat.js, progression.js, kijelölt game.js részek. |
| Artist | Képek, animáció, hátterek, VFX; art-data.js, graphics.js, boss-vfx.js, shadow-animation.js. |
| Frontend | HTML/CSS, HUD, menük, accessibility, lokalizáció és inputkezelő felület. |
| Worldbuilder | levels.js, prologue.js, útvonalak, titkok, történet és párbeszédek. |
| Save-integrity | save-vault.js, validáció, kompatibilis frissítések, kifejezett mentésreset és valódi böngészős tárolás. |
| QA | Reprodukció, tervjóváhagyás, regresszió, böngészős bizonyíték és független review. |

A táblázat nem engedély ugyanazon fájl párhuzamos szerkesztésére: a koordinátor kiosztja a konkrét tulajdonost. Grafika és játékmenet együttműködésénél először a szükséges állapotokat, pózokat és illesztési pontokat egyeztessék. A runtime.js és colormaps.json generálását egy integrátor végezze a releváns szerkesztések lezárása után.

### Grafikai jóváhagyási kapu

Teljesen új vizuális design esetén az artist először koncepciórajzot mutat be, amelyen a sziluett, a színek, az anyagok és a kompozíció megítélhető. Új animációnál először vázlatos storyboardot vagy kulcspózlapot készít a tervezett mozgásról. A kész, részletes asset vagy animáció gyártása csak a konkrét előnézetre adott kifejezett felhasználói jóváhagyás után indulhat. Módosított koncepciót vagy lényegesen megváltozott pózsort újra jóvá kell hagyatni. A jóváhagyás a bemutatott vizuális irányra szól; a neveket, leírásokat, játékmenetet vagy nem látott részleteket külön kell egyeztetni. Már jóváhagyott design apró javítása vagy változata nem igényel új koncepciókört, amíg az alapötlet nem változik.

Az agentek nem indítanak saját alcsapatokat. A szerep nem külön sandbox, a specialisták a szülő jogosultságait öröklik. A projekt jelenleg teljesen statikus; külön backend szerep csak szerveroldali funkció bevezetésekor szükséges.

## Feladat és átadás

A kiosztás tartalma: cél, elfogadási feltételek, szerkeszthető fájlok, függőségek, ellenőrzés. Az átadás: eredmény, módosított fájlok, futtatott ellenőrzés és kimenetele, nyitott kérdések. Teljes beszélgetések és ismételt logok helyett az új információt küldjék tovább.

A saját skillek a .agents/skills/, az agentek a .codex/agents/ alatt vannak. A modell és reasoning a szülőtől öröklődik. A koordinátor TOML-ja delegált koordinációhoz használható; a főagent rendszerint maga koordinál.

<a id="qa-rework"></a>
## QA rework

Ez a kötelező kapu a QA által visszadobott munkára vonatkozik. Új feladat első megvalósításához önmagában nem szükséges.

QA_REJECTED → PLAN_PROPOSED → PLAN_APPROVED → IMPLEMENTED → QA_PASSED

1. **Hibajelentés:** QA-azonosító (pl. QA-001), reprodukció, tényleges/elvárt működés, bizonyíték és elfogadási feltételek. Különítse el a hibát az opcionális javaslattól.
2. **Fejlesztői terv:** 5–8 rövid pont, azonosítóval és verzióval (QA-001 r1). Ok/hipotézis, érintett fájlok, változtatás, megőrzendő viselkedés, ellenőrzés és bizonytalanságok. Olvasás/reprodukció megengedett, de javítási kód, teszt, generált fájl vagy új asset még nem készülhet. Tervjegyzet az ignorált munkamappába írható.
3. **QA tervellenőrzés:** PLAN_APPROVED QA-001 r1, vagy PLAN_REVISION_REQUESTED QA-001 r1 konkrét hiányokkal. Csak az adott azonosító adott verziójára adott kifejezett QA-jóváhagyás érvényes. A fejlesztő nem hagyhatja jóvá saját tervét szerepváltással sem.
4. **Megvalósítás:** a jóváhagyott kereten belül indulhat. Lényeges ok-, fájl-, viselkedés- vagy ellenőrzésváltozás új verziót és új jóváhagyást igényel. A jóváhagyás nem bővíti a felhasználói feladatot vagy az eszközjogosultságokat.
5. **Újratesztelés:** QA ellenőrzi az eredeti reprodukciót és a kapcsolódó regressziókat. Eredmény: QA_PASSED QA-001 r1, vagy bizonyítékos QA_REJECTED. A terv elfogadása nem a kód elfogadása.

Tervmódosításkor csak az eltérő pontokat adják vissza. Két elutasított tervverzió után a koordinátor és QA közösen tisztázza a vitát; a koordinátor nem kerülheti meg az explicit QA-jóváhagyást. A rutin belső egyeztetés nem igényel emberi megerősítést; valódi termékdöntést vagy külső jogosultságot a főagent kezel.

Ha nincs elérhető QA-agent, a koordinátor adjon ki tervellenőrzést egy QA-szerepű subagentnek, és várja meg. Addig csak független munka folytatható. Újabb elutasított javítás visszalép a tervezési kapuhoz.

Példa egy ötpontos tervre:

    PLAN_PROPOSED QA-001 r1
    - Hipotézis: a figyelmeztetést két UI-csatorna is megjeleníti.
    - Fájl: assets/js/prologue.js, az érkezési esemény.
    - Javítás: a dedikált felirat megtartása, a második értesítés elhagyása.
    - Megőrzendő: támadásjelzések, hang és harci időzítés.
    - Ellenőrzés: prológusteszt, HU/EN böngészős érkezési jelenet.

## Ellenőrzés

A parancsok a [fejlesztői útmutatóban](DEVELOPMENT.md) vannak. A meglévő ellenőrzések közül a változáshoz illőket futtassák; kiadás előtt teljes npm test kell. A test-save-validation.cjs és test-only-bootstrap.cjs segédfájlok.

Új funkció egyszerű verziót kap; kisebb hibajavításnál a [kiadási szabályok](RELEASES.md) szerinti rögzített metaadatból generált nyolckarakteres utótagot használjuk. A korábbi kódrekordok hozzáfűzési sorrendjét őrizzék meg: a mentésvédelem ebből állapítja meg az azonos alapverziójú javítások időrendjét.

A mockolt Canvas/SaveVault VM-teszt nem bizonyítja a látványt vagy a valódi IndexedDB/titkosítás működését. Ezekhez friss tesztprofillal végzett böngészős ellenőrzés kell, személyes mentések használata nélkül.

## Git és használat

Commitolandó: AGENTS.md, .codex/config.toml, .codex/agents/*.toml, .agents/skills/** és ez a dokumentáció. Ezek közös projektbeállítások, személyes útvonal és titok nélkül.

Ignorált: .codex/work/ (helyi tervek, hibajegyzetek, screenshotok), test-results/, playwright-report/, .env és .env.*. A publikus .env.example sablon kivétel. Szándékosan megőrzött publikus képek a docs/images/ alá kerüljenek.

A .codex/ és .agents/ teljes mappáját ne ignoráld. A globális/személyes Codex-konfiguráció nem kerül a repóba. A Pages workflow csak a játék fájljait publikálja, ezeket a fejlesztői beállításokat nem.

A kiba-game repót nyisd meg Codex-projektként; az új projektinstrukciókat új beszélgetésben érdemes használni. A projektkonfiguráció alkalmazása a helyi projektbizalomtól és kliensverziótól függ. Az agentdefiníció nem indít automatikusan munkát, és nem garantálja a grafikai/böngészős eszközök elérhetőségét.

## Hivatalos háttér

- [Projektinstrukciók](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Agentdefiníciók](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- [Repo-szintű skillek](https://learn.chatgpt.com/docs/build-skills)
