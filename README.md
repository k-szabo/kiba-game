# Kiba – Három világ

Játszható, böngészős 2D metroidvania prototípus. Kiba eredeti pet sprite sheetjével.

Kiba édesapját, Harut három birodalom őrzői tartják fogva. A kis shiba szamuráj Japán köderdején, Yomi alvilágán és Takamagahara égi birodalmán át gyűjti össze apja lelkének emlékeit.

## Indítás

A `dist/index.html` közvetlenül megnyitható böngészőben. A játékhoz nincs szükség telepítésre vagy buildre. A helyi mentés működéséhez ajánlott HTTP-kiszolgálót használni; a mentések böngészőnként és címenként különböznek.

## Irányítás

| Billentyű | Művelet |
| --- | --- |
| A / D, bal / jobb nyíl | Mozgás |
| Space, W, fel nyíl | Ugrás; a szél áldása után második ugrás |
| J vagy Z | Kardcsapás |
| K vagy Shift | Szellemlépés az árnyék szentélye után |
| E | Pihenés, képesség, kapu, történet |
| M | Térkép |
| Esc | Szünet |

Érintőképernyőn a képernyő gombjai használhatók. A hang a felső gombbal kapcsolható.

## Az ösvény

1. Japán: indulj nyugatra, a három lépcsőplatformon juss el a szél szentélyéhez. E-vel szerezd meg a kettős ugrást: nyomd meg a Space-t, engedd fel, majd a levegőben nyomd meg újra. Az első őrző legyőzése is megadja ezt a képességet, ha a szentély kimaradt. A győzelem után a gyökérfal eltűnik, és az udvar keleti végén fénylő torii jelenik meg. Állj a kapu alá a földön, és nyomj E-t. A középső torii is használható; nem kell felugrani az oszlopokra.
2. Yomi: a nyugati szentélyben kapod meg a szellemlépést. K-val suhanj át a keleti pecséten. Az őrző legyőzése felébreszti a hajnalkardot és megszünteti az árnypecsétet. A jobb oldali vagy középső kapu alatt E-vel jutsz az égbe.
3. Takamagahara: J-vel törd fel az arany pecsétet. Győzd le az utolsó őrzőt, majd keleten E-vel köszöntsd Harut.

A középső kőszentély feltölti az életerőt. Halál után a legutóbbi pihenőhelyhez vagy őrző előtti ponthoz térsz vissza. A képességek, legyőzött őrzők, birodalom és lélektöredékek helyben automatikusan mentődnek.

A 0.1.1 verzió a régi mentésekben is pótolja a kettős ugrást, ha az első őrzőt már legyőzted. Frissítéskor az offline HTML-fájlt ugyanazon a helyen, ugyanazzal a névvel cseréld le, és válaszd a Folytatást. A mentés elérhetősége a böngésző fájlokhoz tartozó tárolási szabályaitól függ.

## Technika és korlátok

HTML/CSS és függőség nélküli Canvas 2D JavaScript. Az eredeti 1536×2288 méretű Kiba-képlap a `dist/assets/kiba.png`. A hátterek és ellenfelek programból rajzolt prototípusgrafikák. A pet állapotanimációkat használjuk mozgáshoz és ugráshoz; a kardcsapást a játék rajzolja. Ez rövid, három birodalmat felölelő prototípus, nem kész, kereskedelmi méretű játék. A böngészős mentés törlődhet az oldaladatok törlésével.
