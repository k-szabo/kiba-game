# Hannah, zikkurat és Hajnalkard

Built-in imagegen képek, a felhasználó által jóváhagyott színes koncepciók és javított mozgásvázlatok alapján. A személyes referenciafájlok nem részei a repositorynak. Az arc/haj/bőrszín és a szarv/szárny külön referenciát kapott; a stílus a meglévő festett szereplőket és az árnyékvilágot követi.

## Jóváhagyott irány és változatok

Hannah emberi arcú démon lord fekete hajjal, szemüveggel, fekete szarvakkal, fekete–narancs szárnyakkal, egy démonfarokkal és fekete, hímzett páncélos kimonóval. A kasza nagy, egyetlen merev nyéllel és egyetlen ívelt pengével. A módosított koncepció a kifordult fegyvert és a bal cipő textúráját javította. A végleges mozgástervek két hatpózos lapra bontva tisztázták a fegyver fogását és a visszafelé rohamot; a felhasználó több köztes képkockát is engedélyezett.

A négy háttér jóváhagyott koncepciója: az előtér; a felfelé és lefelé ágazó belső tér; az ép trónterem; ugyanaz a trónterem vihar által leszakított tetővel és megemelt arénával. A japán kultista építészet, az árnyékvilág lila Kibája és Yomi narancs lávája egyesül bennük.

A Hajnalkard jóváhagyott vázlata: erőgyűjtés, megidézett fénykatana felemelése, előrecsapás, kimerült visszaállás. Momo megtartja meglévő shiba anatómiáját, páncélját és színeit.

## Production prompts

Közös sprite-prompt: "Production game sprite sheet on genuinely transparent alpha; detailed painted Japanese dark fantasy; consistent character proportions and weapon topology; full silhouettes with margins; fixed foot registration; no text, panel borders, ground or opaque background; exactly two arms; one uninterrupted scythe shaft, one blade, no duplicated parts. Preserve native alpha."

- `assets/images/enemies/hannah-walk-v1.png`: six in-place alternating walk poses; upright held scythe, secondary hair/cloth/wing motion, same body scale throughout.
- `assets/images/enemies/hannah-combo-v1.png`: six poses from ready through two-handed windup, forward cut, follow-through and return; the entire scythe rotates as one rigid object.
- `assets/images/enemies/hannah-jump-v1.png`: six poses for crouch, rise, apex, descending strike, landing and recovery; no second blade at the shaft butt.
- `assets/images/enemies/hannah-ritual-v1.png`: idle, summon, sacrifice, life drain, stagger and kneel. The unsafe top-middle source pose is deliberately excluded from the registered animation.
- `assets/images/momo-dawnblade-v1.png`: six poses following the approved four-step ultimate; one summoned golden-white katana, transparent amber flame arc, readable face/armor and two paws on the hilt.

Közös háttérprompt: "Single wide production landscape; sharply detailed painted Japanese dark fantasy; stepped basalt ziggurat, Japanese rafters and carved pillars, violet Shadow Realm and molten-orange Yomi; side-on readable play plane; no characters, HUD, captions or collage."

- `assets/images/backgrounds/ziggurat-approach-v1.png`: long basalt approach, lava ravines and monumental stepped temple fortress.
- `assets/images/backgrounds/ziggurat-interior-v1.png`: monumental ascending terraces with crypt depths, chains, braziers and dark carved masonry; gameplay platforms remain separately authored.
- `assets/images/backgrounds/ziggurat-throne-v1.png`: intact rafters and roof above the central throne/arena; right binding-pillar area; continuous dark foreground plane.
- `assets/images/backgrounds/ziggurat-storm-v1.png`: edit of the intact hall preserving floor, throne and column alignment; shattered ceiling, exposed violet storm and suspended slab above the ruins.

## Registration

The original PNG bytes and alpha are preserved. `scripts/register-hannah-art.py` records isolated contour masks, boot anchors and constant body scales in `assets/js/hannah-art-data.js`; it does not resize a character to its weapon bounds. Runtime art is registered in `ART_MANIFEST`. `scripts/export-colormaps.py` records the new source palettes and clipped animation groups.
