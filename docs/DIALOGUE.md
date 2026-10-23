# Dialógusrendszer

A történeti jeleneteket és beszélgetéseket a `game.js` közös `Dialogue` kezelője jeleníti meg. A `story(label, title, text, onClose, options)` belépési pont megmaradt; a meglévő történeti szövegeket nem írja át.

## Jelenetek és beszélők

- A `label`, `title` és `text` lokalizációs azonosító vagy meglévő, visszakereshető szöveg. Összeállított jutalomszöveghez a `text` függvény is lehet: így nyelvváltáskor újra előállítható.
- Minden üres sorral elválasztott bekezdés egy lap. Az összes bekezdés megmarad, egyszerre egy látható. A hosszú lap önállóan görgethető; a lapozógomb a görgetőn kívül marad.
- Az `onClose` kizárólag az utolsó lap után fut, egyszer. Új jelenet, főmenü vagy játékos-újrainicializálás érvényteleníti a korábbi jelenetet. A lapozás nem ad újra tárgyat, XP-t vagy fejlesztéspontot.
- Az `options` jelenlegi mezői: `left`, `right`, `speaker`. A portrék regisztrált azonosítói `momo`, `daichi`, `natsu`, `sora`, `akash`. A `speaker` explicit, soha nem a jelenet címéből következik. Azonos cím és beszélőnév csak egyszer jelenik meg.
- A narráció nem válik egy szereplő kimondott szövegévé. Ilyenkor nincs beszélőnév vagy aktív portrékiemelés; a cím továbbra is megnevezheti a jelenetet, tárgyat vagy helyszínt.

Példa egy meglévő tábori szereplő beszélgetésére:

```js
story('camp.dialogue.label', npc.name, npc.dialogue, null,
  { left: 'momo', right: npc.id, speaker: npc.id });
```

## Megjelenés és vezérlés

A közös alsó felület kétoldalt karakterképet, középen tekercset használ. Japán és az erdei menedék bambuszos, Yomi perzselt-tüzes, a mennyország aranyozott angyali, az Árnyékvilág és az álom démoni-árnyékos keretet kap. A keret a jelenet megnyitásakor rögzül. A papíron kontrasztos, sötét élő HTML-szöveg szerepel, nincs a bitmapbe égetve.

A játék a teljes jelenet alatt `dialog` állapotban marad. A mozgás, harc és effektek órái nem lépnek. Megnyitás és lapozás törli a lenyomott játékbemeneteket. A natív gomb Enterrel/Szóközzel és egérrel használható; az ismételt billentyűlenyomás nem lapoz végig a jeleneten. A Tab a görgethető szöveg és a lapozógomb között jár. Az Escape nem hagyja ki a jelenetet. A fejlesztői panel ideiglenes megnyitása megőrzi az aktuális lapot; teleport vagy új tesztvilág érvényteleníti azt.

A dialógus nem kerül a mentésbe. Újratöltés a rendes mentési ellenőrzőpontra vezet; a már rögzített megszerzés és jutalom tartós marad. A Démonölő figyelmeztetése továbbra is csak a tényleges lezárás után indíthatja a találkozást, a meglévő megszakítási védelemmel.

## Bővítés és ellenőrzés

Új beszélőnél a meglévő festett kép és megfelelő alfa-kivágás regisztrálandó a `Dialogue` szereplőtáblájában. Ismeretlen szereplő üres portréhelyet ad. Új szöveghez a közös HU/EN katalógus és a felhasználói szövegjóváhagyás szükséges. Az új design és a kész keretek eredete a `docs/art-prompts/dialogue-frames-v1.json` fájlban követhető.

A regressziókat a `test-dialogue.cjs` és a kapcsolódó történeti, tábori, prológus-, Démonölő- és devtesztek fedik. A valódi képi olvashatóságot, fókuszt, görgetést és nyelvváltást 1280×720-as és nagyobb böngészőnézetben is ellenőrizni kell.
