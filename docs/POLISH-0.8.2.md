# 0.8.2 · Animáció és pályák javítása

## Momo és a szünet

A világ és Momo animációs ideje megáll a szünet-, történet-, térkép- és fejlesztésképernyőkön. A sebezhetetlenség állandó áttetszőséget használ a karakter ki-be kapcsolása helyett. Momo már a létrehozásakor felismeri a lába alatt lévő platformot; nem kezd levegőben játszott animációt a szentélyen. A sprite-ok talpillesztése képkockánként mért, a levegőben látható póz a függőleges sebességtől függ, nem ismétlődő helyben ugrás.

## Platformok

A japán pályáról eltűnt a talajba lógó `root-step`, a szükségtelen `river-roof`, `river-rest`, `temple-roof` és `cave-exit4`. A falusi lépcső kisebb és külön áll a következő platformtól. A barlangból a harmadik kijárati lépcsőről közvetlenül elérhető a főút.

Yomiban megszűnt a cél nélküli `deep-left` párkány. A zárt mélységi pecsét fölé új `seal-return` lépcső került: ha Momo a lelkek felszabadítása előtt ráesik a kapura, kettős ugrással visszatérhet a mélység peremének szentélyéhez, és onnan a térképen visszautazhat a korábbi pihenőpontokra. A pecsét továbbra is mindkét lélek felszabadítását kéri.

Az ég két mozgó platformja a korábbi statikus lépcsőket helyettesíti. Új magasságuk és kisebb mozgástartományuk miatt nem lógnak a szomszédos platformokba. A megszüntetett statikus lépcsőn álló ellenfél sem marad a levegőben. Az útvonalteszt már tényleges mozgással és a játék fizikai függvényeivel vizsgálja a mozgó szigeteket is.

## Égi szentélyek és mentések

A hat szentélyből három maradt: a Felhők kapuja, a Csillagok hídja és Az utolsó eskü. A középső szentély a szélfolyam mellett helyezkedik el, így pihenéshez tudatosan ki kell lépni az áramlatból. Az első és második terasz korábbi mentőpontja a bejárathoz, a negyediké a Csillagok hídjához tér vissza. A középső szentély korábbi koordinátáját is átvezeti a mentéskezelő. Az ismeretlen azonosítók és hibás koordináták továbbra is érvénytelenek.

## Felhők és ébredés

Az ősi angyaltorony felhői a [japan-clouds-v1.png](../assets/images/japan-clouds-v1.png) festett, áttetsző assetet használják. A kép a beépített `image_gen` eszközzel készült, a japán háttér stílusreferenciájával; a [teljes prompt](art-prompts/japan-clouds-v1.json) megmaradt. Az eredeti alfacsatorna változatlan.

Az ébredést meleg színű, a történetablakokhoz illő feliratkártya kíséri. A „A harangok hallgatnak” jelenet három bekezdése az álom nyomát, Haru és a Kiba kapcsolatát, majd a falut ért támadást és Momo indulását bontja ki. A magyar és angol változat egyaránt bekerült a közös lokalizációba. A történetablak kis képernyőn görgethető.

## Ellenőrzések

A `scripts/test-polish.cjs` a spawn pózát, a sebezhetetlenség alatti láthatóságot, a szünet és interakció alatti változatlan képkockát, az ugráspózokat, a bekezdéseket, a platformok teljes mozgástartományát és a régi szentélymentések átvételét ellenőrzi. A route teszt külön bizonyítja a zárt yomi kaputól való visszajutást nulla vagy egy felszabadított lélekkel, dash nélkül. Mindkét ellenőrzés a Pages workflow része.
