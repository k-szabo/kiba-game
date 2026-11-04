# Natív teljes képernyős mód

A `fullscreen.js` a böngésző Fullscreen API-ját kapcsolja a `keybindings.json` külön `shortcuts.fullscreen` leírójából. Az alap `Ctrl+F`; nem része a módosítható harci kiosztásnak, ezért a meglévő személyes kiosztás és export/import változatlan marad. A `Bindings.shortcut(action,event)` pontos módosítóbillentyű-egyezést kér, így a sima F továbbra is a Hajnalkardhoz tartozhat.

A teljes `document.documentElement` kerül teljes képernyőre. A torony és a párbaj felülete, valamint a minimumfelbontás figyelmeztetése a `#game` testvérei, ezért kizárólag a vászon vagy a `#game` nagyítása elrejtené ezeket. A canvas méretezését változatlanul a közös `resize` kezeli, a 1280×720-as minimumot nem kerüljük meg. A gyorsbillentyű kis ablakból is használható, hogy a nagyobb nézet megszüntethesse a méretkorlátot.

Az inicializálás a `game.js` fájlban a `keys`/`pressed` létrehozása után, az `AssetLoading.init()` előtt történik. A capture fázisban elfogott gyorsbillentyű a töltés ideje alatt is működhet; a töltés egyéb beviteli tiltása érvényben marad. Szövegmezőben, szerkeszthető tartalomban és kiosztásrögzítéskor nem veszi át a billentyűt. Az ismételt billentyűesemény nem indít újabb kérést, és a böngésző keresője vagy a Hajnalkard nem indul el a kezelt gyorsbillentyűtől.

A modul nem kér egérrögzítést. Kilépéskor törli a lenyomott bemeneteket, feloldja a játék saját egérrögzítését, a futó kalandot szünetelteti, a párbajt futni hagyja. Meglévő menüt vagy párbeszédet nem zár be és nem folytat automatikusan. Az Esc billentyű és a natív `fullscreenchange` eltérő sorrendje sem kapcsolhatja vissza véletlenül a szünetet. Fókuszvesztéssel megszakított függő kérést egy késői engedélyezés sem éleszthet újra. A böngésző által elutasított kérés és a hiányzó API nem okoz kezeletlen Promise-hibát; újabb kifejezett gesztussal újrapróbálható.

A `scripts/test-fullscreen.cjs` a konfigurációt, a natív eseménysorrendeket, a késői/elutasított kérést, a párbaj- és Pointer Lock-együttműködést vizsgálja. Ez mockolt API-teszt: a valódi böngésző engedélyezési és megjelenítési viselkedését külön kell ellenőrizni.

## Integrált ellenőrzés

A `0.9.70_a818a30b` kiadás friss, headless Edge-profilban a `/kiba-game/` alútvonalon natív Fullscreen API-val és tényleges billentyűzetes eseményekkel is ellenőrizve: Ctrl+F belépés/kilépés, kapcsolás betöltés alatt, Esc utáni kalandszünet, valamint a minimumfelbontás figyelmeztetésének láthatósága. A HU/EN felület 1280×720 és 1920×1080 nézetben, továbbá 125%-os CSS elrendezési nagyítással szerepelt a próbában. A küldetésjavításokhoz valódi billentyűzetes leadás, a többoldalas Fia-párbeszéd és a titkosított mentés újratöltése tartozott. Nem volt oldalhiba vagy hibás statikus kérés.

A történeti előfeltételeket kizárólag a tesztkiszolgálóba injektált seam állította be; ez nem része a produkciós runtime-nak. A párbaj folytatását és az elutasított/késői API-eseményeket VM-regresszió ellenőrzi; külső hálózati párbaj nem része ennek a böngészőpróbának. A teszteredmények és képek az ignorált munkamappában maradnak.

API-referencia: [MDN Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API).
