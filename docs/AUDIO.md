# Hang és főmenüzene

A `menu-music.js` a főmenü és az onnan nyitott súgó zenéjét kezeli. A főmenü és a játék HUD-jának hangkapcsolója közös állapotot használ; alapból ki van kapcsolva. A zenefájl csak bekapcsoláskor töltődik be, felhasználói műveletből indul, 35%-os hangerővel ismétlődik. A kaland, a párbaj és a torony menüje/játéka, illetve a fejlesztői panel alatt nem szól.

A háttérbe tett böngészőfül és az oldal elhagyása szünetelteti a lejátszást. A menübe visszatérve ugyanaz az audioelem folytatja a zenét. Egy folyamatban levő `play()` hívás nem indíthat késve zenét játék közben; elutasított automatikus indítás csak új felhasználói műveletre próbálkozik újra. A hangállapot nem része a kalandmentésnek.

Az `assets/audio/main-menu-theme-v1.mp3` a felhasználó által átadott főmenüzenéből készült: 172,8 másodperc, sztereó, 44,1 kHz, 192 kbit/s MP3. A forrás WAV helyben marad, a Pages csomag csak a 4,15 MB-os MP3-at tartalmazza. Konvertálás FFmpeg/libmp3lame használatával, a forrás metaadatainak eltávolításával; a zene tartalma nem módosult.

Ellenőrzés: `node scripts/test-menu-music.cjs`, valamint valódi böngészőben bekapcsolás, némítás, súgó, játékmódok, visszatérés és fülelváltás. A böngésző által tiltott automatikus lejátszás nem akadályozza a játékot.
