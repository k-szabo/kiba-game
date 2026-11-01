"""Register native alpha sprites. Reads source pixels; never rewrites images.

Connected silhouette outlines exclude adjacent weapons where atlas rectangles
overlap. Foot anchors use the bottom opaque rows; animation scale stays fixed.
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

def simplify(points, epsilon=0.6):
    if len(points) < 3:
        return points
    a, b = np.array(points[0]), np.array(points[-1])
    v = b-a
    coords = np.array(points[1:-1])
    if not len(coords):
        return points
    distance = np.linalg.norm(coords-a, axis=1) if not np.any(v) else np.abs(v[0]*(coords[:,1]-a[1])-v[1]*(coords[:,0]-a[0]))/np.linalg.norm(v)
    i = int(np.argmax(distance))+1
    return simplify(points[:i+1], epsilon)[:-1]+simplify(points[i:], epsilon) if distance[i-1] > epsilon else [points[0], points[-1]]

def components(path, expected):
    image = Image.open(ROOT/path)
    assert image.mode == 'RGBA'
    alpha = np.array(image)[:,:,3]
    assert not np.any(alpha[0] > 32) and not np.any(alpha[-1] > 32) and not np.any(alpha[:,0] > 32) and not np.any(alpha[:,-1] > 32), 'Clipped source silhouette'
    pending = alpha > 32
    h,w = pending.shape
    groups = []
    for yy,xx in zip(*np.where(pending)):
        if not pending[yy,xx]:
            continue
        todo=[(int(xx),int(yy))]; pending[yy,xx]=False; pixels=set()
        while todo:
            x,y=todo.pop();pixels.add((x,y))
            for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if 0<=nx<w and 0<=ny<h and pending[ny,nx]:
                    pending[ny,nx]=False;todo.append((nx,ny))
        if len(pixels)>2000:
            groups.append(pixels)
    assert len(groups)==expected, (path,len(groups),expected)
    return sorted(groups,key=lambda g:(int(np.mean([p[1] for p in g]))//(h//(3 if expected==18 else 2 if expected>3 else 1)),min(p[0] for p in g)))

def frame(pixels, body_height):
    xs=[p[0] for p in pixels];ys=[p[1] for p in pixels];x0,x1,y0,y1=min(xs),max(xs)+1,min(ys),max(ys)+1
    edges={}
    for x,y in pixels:
        for neighbor,start,end in [((x,y-1),(x,y),(x+1,y)),((x+1,y),(x+1,y),(x+1,y+1)),((x,y+1),(x+1,y+1),(x,y+1)),((x-1,y),(x,y+1),(x,y))]:
            if neighbor not in pixels:
                edges.setdefault(start,[]).append(end)
    loops=[]
    while edges:
        start=next(iter(edges));point=start;loop=[start]
        while True:
            ends=edges.get(point)
            if not ends:
                break
            nxt=ends.pop()
            if not ends:
                del edges[point]
            point=nxt;loop.append(point)
            if point==start:
                break
        if len(loop)>4:
            loops.append(loop)
    outer=max(loops,key=lambda loop:abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(loop,loop[1:]))))
    outline=simplify(outer)
    foot_x=float(np.median([x for x,y in pixels if y>=y1-12]))
    return dict(x=x0,y=y0,w=x1-x0,h=y1-y0,anchorX=foot_x,anchorY=y1,bodyHeight=body_height,visibleBounds=[x0,y0,x1,y1],outlines=[outline])

art={}
keepers=components('assets/images/enemies/void-keepers-v1.png',18)
for i,key in enumerate(['blade','bow','mage']):
    art[key]={'image':'voidKeepers','facing':1,'frames':[frame(g,245) for g in keepers[i*6:i*6+6]]}
for key,image,path,count,height in [('lieutenant','voidLieutenant','assets/images/enemies/void-lieutenant-v1.png',6,420),('demon','voidDemon','assets/images/enemies/void-demon-v1.png',8,400)]:
    art[key]={'image':image,'facing':1,'frames':[frame(g,height) for g in components(path,count)]}
for i,(key,g) in enumerate(zip(['trader','cook','smith'],components('assets/images/npcs/shadow-underworld-services-v1.png',3))):
    art[key]={'image':'underworldServices','facing':1,'frames':[frame(g,710)]}
source=ROOT/'assets/js/art-data.js'
original=source.read_text(encoding='utf-8')
text=original.split('// BEGIN FIA VOID ATLAS')[0].rstrip()
suffix=original.split('// END FIA VOID ATLAS',1)[1] if '// END FIA VOID ATLAS' in original else ''
text+='\n\n// BEGIN FIA VOID ATLAS\nconst ART_FIA_VOID='+json.dumps(art,separators=(',',':'))+';\n// END FIA VOID ATLAS\n'
source.write_text(text+suffix,encoding='utf-8',newline='\n')
print('Registered 35 native sprites and 8 character forms without changing PNG pixels.')
