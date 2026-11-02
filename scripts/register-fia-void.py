"""Register native alpha sprites. Reads source pixels; never rewrites images.

Connected silhouette outlines exclude adjacent weapons where atlas rectangles
overlap. Foot anchors use the bottom opaque rows; animation scale stays fixed.
"""
import json
from pathlib import Path
from art_alpha_registration import components, frame

ROOT = Path(__file__).resolve().parents[1]

def build_art():
    art={}
    keepers=components('assets/images/enemies/void-keepers-v1.png',18)
    for i,key in enumerate(['blade','bow','mage']):
        art[key]={'image':'voidKeepers','facing':1,'frames':[frame(g,245) for g in keepers[i*6:i*6+6]]}
    for key,image,path,count,height in [('lieutenant','voidLieutenant','assets/images/enemies/void-lieutenant-v1.png',6,420),('demon','voidDemon','assets/images/enemies/void-demon-v1.png',8,400)]:
        art[key]={'image':image,'facing':1,'frames':[frame(g,height) for g in components(path,count)]}
    for i,(key,g) in enumerate(zip(['trader','cook','smith'],components('assets/images/npcs/shadow-underworld-services-v1.png',3))):
        art[key]={'image':'underworldServices','facing':1,'frames':[frame(g,710)]}
    return art


def main():
    art=build_art()
    source=ROOT/'assets/js/art-data.js'
    original=source.read_text(encoding='utf-8')
    text=original.split('// BEGIN FIA VOID ATLAS')[0].rstrip()
    suffix=original.split('// END FIA VOID ATLAS',1)[1] if '// END FIA VOID ATLAS' in original else ''
    text+='\n\n// BEGIN FIA VOID ATLAS\nconst ART_FIA_VOID='+json.dumps(art,separators=(',',':'))+';\n// END FIA VOID ATLAS\n'
    source.write_text(text+suffix,encoding='utf-8',newline='\n')
    print('Registered 35 native sprites and 8 character forms without changing PNG pixels.')


if __name__ == '__main__':
    main()
