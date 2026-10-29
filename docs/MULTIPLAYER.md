# PvP hálózat és újrahasználható kapcsolati réteg

A [PvP duel kártya](https://trello.com/c/1Cob7SJq) külön, két böngésző közötti párbajt kér. A kutatás és a rögzített külső függőség ellenőrzésének dátuma: 2026-10-29.

## Szolgáltatásválasztás

| Lehetőség | Mire alkalmas | Korlát / döntés |
| --- | --- | --- |
| PeerJS + nyilvános PeerServer Cloud | Szobakódos kapcsolatfelépítés és WebRTC adatcsatorna, saját alkalmazásszerver nélkül. | Az első változat ezt használja. A közös, ingyenes signaling nem rendelkezik a játék által garantált rendelkezésre állással. |
| Google STUN | A nyilvános hálózati cím felderítésével segíti az ICE kapcsolatfelépítést. | Nem szobakereső, nem signaling és nem adatközvetítő. A PeerJS mellett használjuk. |
| Natív WebRTC | Ugyanez a közvetlen adatcsatorna, saját protokollal. | Az ajánlat/válasz és ICE-jelöltek cseréjét továbbra is meg kell oldani; a Google STUN önmagában nem elég a kódos szobákhoz. |
| Trystero | Alternatív WebRTC kapcsolás nyilvános relay/tracker rendszerekkel és több signaling-stratégiával. | Érvényes későbbi alternatíva, de újabb külső rendszereket hozna be; a NAT miatti TURN-igényt nem szünteti meg. |

Elsődleges források: [PeerJS FAQ](https://peerjs.com/client/faq), [PeerServer Cloud](https://peerjs.com/server/cloud), [WebRTC protokollok](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols), [Trystero projekt](https://github.com/dmotz/trystero).

A PeerJS [2023. decemberi közleménye](https://github.com/orgs/peers/discussions/1172) szerint az ingyenes TURN-szolgáltatás megszűnt; a signaling ettől külön szolgáltatás. A jelenlegi alapkonfiguráció nem használ TURN-t. Szigorú NAT, letiltott UDP vagy vállalati hálózat esetén a két fél ezért nem feltétlenül tud összekapcsolódni. Ezt kapcsolat-hibaként kezeljük, nem ígérünk minden hálózaton működő ingyenes közvetítést. Későbbi TURN-szolgáltatáshoz rövid életű jogosultságot kiadó szerver is szükségessé válhat; tartós TURN-titkot ne tegyünk a statikus kliensbe.

## Rögzített böngészős könyvtár

Nincs telepített produkciós npm-függőség vagy CDN-ről futás közben lehúzott változó verzió. A PeerJS a játék mellett, helyi statikus fájlként található. Csak a párbaj kifejezett megnyitásakor töltődjön be; a történeti játék indítása nem létesít multiplayer kapcsolatot.

Forrás: a kiadó rögzített npm-archívuma, [peerjs-1.5.5.tgz](https://registry.npmjs.org/peerjs/-/peerjs-1.5.5.tgz). Ebből kizárólag a `package/dist/peerjs.min.js` és a `package/LICENSE` került a projektbe, változatlan bájtokkal.

| Fájl | SHA-256 |
| --- | --- |
| Letöltött npm-archívum | `6fa731967a78df79e6f6a94b5e4339765e2eebadd911b3d981c9606d0a8903d0` |
| `assets/vendor/peerjs-1.5.5.min.js` | `7604d8c31bec4f134b0d15c2d80b1d095ea18af005354f439f14291fcd7b4168` |
| `assets/vendor/peerjs-LICENSE` | `9407807dba7f47a79bfb3ac55759d63d77c9371ebd0616d5a093e97d3e810397` |

A könyvtár MIT-licencét a külön licencfájl őrzi. Frissítéskor a verziót, hash-eket és böngészős kapcsolatpróbát együtt kell ellenőrizni.

## `PeerSession` szerződés

A `peer-session.js` nem ismer pályát, játékost, UI-t vagy mentést. A kooperatív mód ugyanazt az explicit életciklust és üzenetcsatornát később újra felhasználhatja; a kétfős korlát jelenleg szándékos.

```js
const session = PeerSession.create({
  Peer: window.Peer,
  version: GAME_RELEASE.version,
  onState(state, detail) { /* gépi állapot, lokalizálás a hívóban */ },
  onMessage(payload) { /* játékmód-specifikus sémavizsgálat */ }
});
session.host();       // vagy session.join(szobakód)
session.send({kind: 'input', seq: 1});
session.close();
```

- A `role`, `state`, `code` csak olvasható. A `host`, `join` és `send` logikai sikerértéket ad vissza.
- Állapotok: `opening`, `waiting`, `connecting`, `connected`, `closed`, `error`. Hibakódok: `invalid`, `full`, `unavailable`, `connection`, `version`, `unsupported`.
- A szobakód nyolc kriptográfiai véletlen karakter, az összetéveszthető `0`, `1`, `I`, `O` nélkül. A PeerServer-azonosító a protokollverziót is tartalmazó `kiba-duel-v1-` előtagot használja. A csatlakozó véletlen PeerJS-azonosítót kap.
- A kapcsolat teljes játékverziót és hálózati protokollverziót egyeztet; az alkalmazás csak a kétirányú hello/ack után kaphat adatot. A szobakód ismerete hozzáférést jelent, nem fiókos hitelesítést.
- A cloud az alapértelmezett PeerServer, TLS-en. Az ICE-konfiguráció a `stun:stun.l.google.com:19302` és `stun:stun1.l.google.com:19302` címeket használja. A factory opcionális `iceServers` paraméterrel más ICE-szervereket is fogadhat.
- A megbízható adatcsatorna JSON-t használ. Egy teljes üzenet legfeljebb 16 KiB UTF-8; csak véges számokból, szövegből, logikai/null értékekből, tömbökből és sima rekordokból épülhet. Mélység-, elem- és bejövő üzenetszám-korlát is van. A gameplay payload pontos sémáját továbbra is a hívó ellenőrzi.
- Az első ellenfél foglalja a kapcsolatot. További csatlakozók elutasítást kapnak; nem válthatják le a meglévő ellenfelet. A foglalás felépítése 20 másodperc után lejár. Elutasított kapcsolatjelöltekből legfeljebb nyolcat kezelünk egyszerre.
- Kétmásodperces heartbeat és 12 másodperces válaszhiány-ellenőrzés működik. Kilépés, megszakadás és új szoba minden előző timert, eseményfigyelőt és kapcsolatot lezár. Korábbi munkamenet késői callbackje nem írhat az újba.
- A böngésző háttérbe helyezése vagy a gép alvása megszakíthatja a párbajt. Nincs hostváltás vagy ugyanabba a harcba visszacsatlakozás. A megbízható csatorna csomagvesztéskor várakozhat, ezért ez baráti párbaj, nem kompetitív szerveres infrastruktúra; a host hitelesíti a szimulációt.

## Ellenőrzés

`node scripts/test-peer-session.cjs`: izolált PeerServer/DataConnection-helyettesítővel vizsgálja a kézfogást, kétirányú adatot, verzióeltérést, harmadik játékost, heartbeatet, időtúllépést, hibás/túl nagy/túl sűrű üzeneteket és a megszűnt munkamenet callbackjeit. Nem használ külső szervert.

A valódi böngészős WebRTC-próba külön bizonyíték: két külön kontextus, kódos csatlakozás, harc, kilépés, új szoba; eltérő hálózatokon is szükséges próba a NAT-kompatibilitás megítéléséhez. A helyi vagy ugyanazon hálózatos siker nem igazolja a TURN nélküli teljes internetes lefedettséget.

## Párbaj Birodalmakon Át / Duel Across Realms

A `duel-rules.js` tiszta, egyetlen menetet szimuláló modul. A `duel-mode.js` kezeli a szobát, készenlétet és mérkőzést. Két megnyert menet a győzelem; döntetlenért nem jár pont. A következő menet három aktív másodperc után teljes HP-val, alaphelyzetből és nullázott harci órákkal indul. A visszavágóhoz mindkét játékos külön kérése kell; új mérkőzést és véletlen arénát készít. Egy mérkőzés menetei ugyanazon arénában maradnak.

A gazda 60 Hz-es szimulációt futtat, korlátozott felzárkózással. A vendég csak az aktuális mérkőzés- és menetazonosítóhoz tartozó, növekvő sorszámú bemenetet küldhet, 30 Hz-en. Pozíció, HP és sebzés nem vendégbemenet. A gazda állapotképei is 30 Hz-en érkeznek. A több mint 250 ms óta nem frissített vendégbemenet semleges lesz. A gazda saját kliensének módosítását ez nem akadályozza meg; szerveroldali versenyhitelesítés nincs.

Mindkét karakter 20 alap HP-t, három meglévő fegyverstílusból választott felszerelést, dupla ugrást és szellemlépést kap. A kard–pajzs meglévő +2 HP-ja és irányfüggő védése érvényes. Történeti fejlesztések, tárgyak, gyógyítás, ultimate és jutalmak nem kerülnek át. A négy főbirodalom meglévő festményeiből, tereprajzaiból és Momo animációiból készülnek a szimmetrikus kis arénák; új bitmap nincs.

A rajzoló explicit fegyverstílust kap; nem cserélgeti a történeti `weaponStyle` vagy `player` globálist. Az `update`, `draw`, input és `persist` korai párbajága különíti el a történeti szimulációt és mentést. Kilépés lezárja a kapcsolatot, és a főmenübe visz; a Folytatás a meglévő titkosított mentést használja. A mentéskompatibilitási korszak változatlan.

Minden új menet megvárja a vendég aktuális menethez tartozó elérhetőségi bemenetét. A vendég ezt a kezdő állapotkép fogadásakor, animációs képkockára várás nélkül küldi el. Háttérbe tett, fókuszt vesztett vagy 1280×720 alatti böngésző esetén a gazda mindkét fél számára megállítja a harci órát; visszatéréskor nincs felzárkózó időugrás. A kilépésgomb fókuszálása nem szüneteltet. A kapcsolat heartbeatje a megállított harctól független marad.

`npm run test:duel` futtatja a három célzott tesztet: fizika/harc több képkockasebességen, hálózati életciklus/protokoll, valamint készenlét/pontozás/menetváltás/visszavágó/lejárt bemenet. A `QA-DUEL-001` regresszió a készenlét után háttérbe tett vendég indulási versenyhelyzetét is lefedi.

A 0.9.57 kiadáshoz két friss Edge-folyamat valódi nyilvános PeerServer Cloud és WebRTC kapcsolatával ellenőriztük a kódos csatlakozást, vendégmozgást, normál/erős támadást, egyéni kiosztást, menetváltást, visszavágót és megszakítást. HU/EN felületet, 1280×720 és 1920×1080 nézetet, valamint asztali zoomot használtunk. A háttérbe tett vendég indulását kontrollált böngészős láthatósággal, a kis nézetet tényleges ablakátméretezéssel vizsgáltuk. A szintetikus történeti mentés titkosított rekordja és futásbeli állapota változatlan maradt, valódi IndexedDB-újratöltés után is. Ez két helyi böngésző kapcsolata; különböző internetes hálózatok NAT-viselkedését nem bizonyítja.

## Játékosjelzés és fejpántok

A lobby a verzióellenőrzött PeerSession hello/ack után két Momo-ikonnal jelzi a kapcsolatot, a készenlétet külön szöveg és pipa mutatja. Új kapcsolatnál, hibánál, bontáskor és fegyverváltáskor a vonatkozó készenléti állapot törlődik. A gombok közös 280×48 CSS-pixeles méretet és megjelenést használnak, a panel a minimum asztali nézetben is görgethető.

A házigazda 0. játékosa piros, a vendég 1. játékosa kék fejpántot visel; a színkiosztás mindkét gépen azonos, és az ikonokhoz, HUD-nevekhez és harci pózokhoz is tartozik. A `duel-appearance.js` a meglévő képkockák fejterületének vörös fejpántját rendereléskor színezi, a forrásképek és a harci geometria változatlanok. A szőr, a nyelv, a páncél és az alfa megmarad; a színváltozatok cache-e legfeljebb 48 kivágást és 6 megapixelt őriz. A normál kalandban nincs színcsere. Regresszió: `test-duel-lobby-ui.cjs`, `test-duel-appearance.cjs`.
