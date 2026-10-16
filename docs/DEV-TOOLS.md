# Fejlesztői eszközpanel

A panel alapértelmezetten ki van kapcsolva. Ez a kiadás a jelszavas belépést és a későbbi eszközök regisztrációját vezeti be; önmagában nem módosít játékállapotot, nem tartalmaz boss-visszahívást, teleportot, halhatatlanságot vagy tárgyidézést.

## Jelszó beállítása

A repository gyökeréből, PowerShell 5.1 vagy újabb verzióval futtasd:

```powershell
.\scripts\set-dev-password.ps1
node scripts/build-game.mjs
```

A Windows PowerShell 5.1 legalább .NET Framework 4.7.2-t igényel a SHA-256-os PBKDF2 művelethez. A script kétszer, rejtett bevitelként kéri a legalább 12 karakteres jelszót. Nem fogad jelszót parancssori argumentumként. Nem vágja le a szóközöket, nem alakítja át a karaktereket; a két bevitelnek pontosan egyeznie kell. Hiba vagy eltérés esetén a meglévő konfigurációt megtartja.

A felső korlát 1024 karakter, a panel beviteli mezőjével egyezően. Ha a helyi execution policy blokkolja a scriptet, egyetlen PowerShell-folyamatra engedélyezheted a futtatását, a gép tartós beállításának módosítása nélkül:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\set-dev-password.ps1
```

A script az `assets/config/dev-tools.json` fájlba írja az engedélyezést, a kriptográfiai véletlengenerátorral előállított 16 bájtos saltot és a 600 000 iterációs PBKDF2-SHA256 művelettel képzett 32 bájtos ellenőrzőértéket. A jelszó UTF-8 bájtjai adják a bemenetet; a salt és az ellenőrzőérték Base64 kódolást kap. A fájl UTF-8, BOM nélkül. Minden új beállítás friss saltot kap. A jelszó nem kerül fájlba vagy naplóba; a bevitel és az ellenőrzőérték képzése közben a folyamat memóriájában szükségszerűen jelen van.

A script a konfigurációt frissíti; a játékba ágyazott példányát külön build állítja elő. Jelszóváltás után ezért ismét futtasd a buildet. A generált `runtime.js` és a konfiguráció együtt kerülhet verziókövetésbe. Az ellenőrzőérték nyilvános; a választott jelszót ne használd más szolgáltatásnál.

Kikapcsolás, a korábbi salt és ellenőrzőérték eltávolításával:

```powershell
.\scripts\set-dev-password.ps1 -Disable
node scripts/build-game.mjs
```

## Megnyitás és munkamenet

A helyi vagy telepített játék címéhez add hozzá a `#devtools` fragmentet, például: `http://localhost:8000/#devtools`. A megnyitás a főmenüben, aktív játékban és a szünetmenüben engedélyezett. Más felületek és átvezetők közben nem lép a játékállapotuk helyére.

A panel megállítja a játékot, és bezáráskor az előző állapotba tér vissza. A belépés az aktuális panelnyitásra érvényes: bezárás vagy oldalfrissítés után új jelszó szükséges. Sem a jelszó, sem a belépési jogosultság nem kerül böngészős tárolóba vagy a játék mentésébe.

## A kliensoldali kapu határai

A Kiba statikus, teljes egészében a játékos böngészőjében futó játék. A jelszóellenőrzés a véletlen eszközhasználat ellen védő kezelőfelületi kapu. A böngészőt irányító személy a forrást és a nyilvános ellenőrzőértéket is olvashatja, módosíthatja, illetve a kaput megkerülheti. A salt és a PBKDF2 lassítja a jelszópróbálgatást; a panel nem szerveroldali jogosultságkezelés és nem csalásbiztos biztonsági határ.

## Új eszköz hozzáadása

Későbbi kártyák a zárt runtime modulon belül regisztrálhatnak műveleteket:

```js
DevTools.register({
  id: 'example-tool',
  labelKey: 'devtools.example',
  run: () => { /* Az adott kártya művelete. */ },
  available: () => true
});
```

Az `available` feltétel opcionális; a felirat mindkét nyelven az `assets/i18n/locales.json` fájlba kerül. A kapu csak belépett, nyitott panelen hajt végre műveletet. A regisztráció és a játékállapot nem kap közvetlen `window`-exportot vagy publikus konzolos hozzáférést.

Ez az alap nem hoz létre elkülönített tesztmentést. A későbbi, játékállapotot módosító eszközök saját kártyájának feladata a valódi mentés védelme és az elkülönített tesztállapot megtervezése, megvalósítása és ellenőrzése.
