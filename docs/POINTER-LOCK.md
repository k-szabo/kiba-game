# Egérrögzítés

A `Cursor` a játéktérre történő valódi egérkattintáskor kéri a Canvas Pointer Lock API-t. A kattintás a hozzárendelt műveletet is egyszer hajtja végre; a további egéresemények célpontja a vászon marad, így a mutató nem léphet át a böngésző oldalsó füleire vagy más ablakra. A menük és a billentyűkiosztás szerkesztése megőrzik natív kattintáskezelésüket.

Az Esc a böngésző számára fenntartott feloldás: rögzítés közben a kalandot szünetelteti akkor is, ha a böngésző elnyeli a billentyűeseményt. A feloldás és a billentyű lenyomásának eltérő eseménysorrendje nem indíthatja újra rögtön a szünetet. A játék rögzítés nélkül megőrzi az átállítható műveleteket; a rögzítés megszűnésekor a lenyomva tárolt bemenetek törlődnek.

A menük, párbeszédek, dev panel, eredményképernyő, minimum alatti nézet, fókuszvesztés és lapelhagyás feloldják a játék saját rögzítését. A késve teljesülő, közben visszavont kérés azonnal feloldódik, új felhasználói kattintás nélkül nincs újrarögzítés. Más DOM-elem rögzítését a modul nem oldja fel. A Pointer Lock sem mentési mezőt, sem saját gyorsbillentyűt nem ad hozzá.

A párbaj külön jogosultságot ad: csak csatlakoztatott, folyamatban lévő menetben rögzíthető az egér. Esc után az elhagyás gomb fókuszt kap, a helyi bemenetek törlődnek; a mérkőzés nem vált át a kaland szünetállapotába. A kapcsolat, az eredmény vagy a lobby nem kérhet egérrögzítést.

A böngésző API-ja Promise-t vagy régi, visszatérési érték nélküli kérést is használhat; a `pointerlockchange` és `pointerlockerror` események a mérvadók. Az elutasítás, szinkron kivétel vagy hiányzó API nem teszi használhatatlanná a játékot, és nem indít automatikus újrapróbálkozási ciklust. Forrás: [MDN Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API), [requestPointerLock](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock).

Regresszió: `scripts/test-pointer-lock.cjs`, `test-mouse-controls.cjs`, `test-cursor.cjs` és `test-duel-mode.cjs`. A tényleges böngészős ellenőrzés valódi kattintás után a `document.pointerLockElement` azonosságát vizsgálja; a VM-teszt önmagában nem bizonyít egérrögzítést.

Az Esc után fókuszban maradó párbaj-kilépésgomb mellett a billentyűzetes harci műveletek továbbra is a szimulációhoz jutnak, új vászonkattintás nélkül. A felhasznált Space/Enter hozzárendelés alapértelmezett gombaktiválása tiltott; a nem hozzárendelt Enter és a Tab natív marad, a kilépés egérrel működik. A többi gomb, link és szerkesztőmező nem kapja ezt a kivételt. Regresszió: `test-duel-unlocked-input.cjs`, a valódi játékos-input diszpécserrel és párbajszimulációval.
