"""Register alpha-preserving shadow atlases without changing source images.

Requires Pillow/NumPy, already used by export-colormaps.py. Scanline hulls
retain the complete connected character and weapon, excluding neighboring
poses even where a blade crosses an ideal grid boundary.
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ACTORS = {
    # Standing-body scale per authored atlas row, in source pixels. Preserve
    # intentional crouching/leaning; neither raised props nor a crouch rescales
    # a pose. Feet are registered separately from each actual silhouette.
    'guard': [385]*3+[372]*3,
    'archer': [390]*3+[378]*3,
    'mage': [352]*3+[347]*3,
    'shield': [368]*3+[350]*3,
    'madPriest': [397]*3+[361]*3,
    'cultJailer': [360]*3+[338]*3,
    'madOrganist': [470]*6,
}


def components(mask):
    parents, runs, previous = [], [], []

    def root(value):
        while parents[value] != value:
            parents[value] = parents[parents[value]]
            value = parents[value]
        return value

    for y, row in enumerate(mask):
        changes = np.diff(np.r_[False, row, False].astype(np.int8))
        current, cursor = [], 0
        for start, end in zip(np.flatnonzero(changes == 1), np.flatnonzero(changes == -1)):
            start, end = int(start), int(end)
            index = len(parents)
            parents.append(index)
            current.append((start, end, index))
            runs.append((y, start, end, index))
            while cursor < len(previous) and previous[cursor][1] < start:
                cursor += 1
            other = cursor
            while other < len(previous) and previous[other][0] <= end:
                parents[root(index)] = root(previous[other][2])
                other += 1
        previous = current
    groups = {}
    for y, start, end, index in runs:
        groups.setdefault(root(index), []).append((y, start, end))
    return sorted(groups.values(), key=lambda g: sum(b-a for _, a, b in g), reverse=True)


def polygon(rows):
    left, right = [], []
    for y, (start, end) in sorted(rows.items()):
        left.extend([[start-.1, y-.1], [start-.1, y+1.1]])
        right.extend([[end+.1, y-.1], [end+.1, y+1.1]])
    vertices = left + right[::-1]
    # Remove only collinear points: no smoothing across a weapon tip.
    result = []
    for point in vertices:
        while len(result) > 1:
            a, b = result[-2:]
            if (b[0]-a[0])*(point[1]-b[1]) != (b[1]-a[1])*(point[0]-b[0]):
                break
            result.pop()
        result.append(point)
    return [[round(x, 1), round(y, 1)] for x, y in result]


def register(name, heads):
    source = ROOT / f'assets/images/enemies/shadow-{name}-v1.png'
    image = Image.open(source)
    assert image.mode == 'RGBA', f'{name}: source alpha is required'
    alpha = np.asarray(image.getchannel('A'))
    groups = components(alpha >= 8)
    assert len(groups) >= 6 and sum(b-a for _, a, b in groups[5]) > 10000, f'{name}: six independent poses required'
    assert len(groups) == 6 or sum(b-a for _, a, b in groups[6]) < 10000, f'{name}: unexpected extra character component'
    vertical = sorted(groups[:6], key=lambda g: sum(y*(b-a) for y,a,b in g)/sum(b-a for _,a,b in g))
    major = sorted(vertical[:3], key=lambda g:min(a for _,a,_ in g))+sorted(vertical[3:], key=lambda g:min(a for _,a,_ in g))
    assert len(heads) == 6, f'{name}: explicit head registration required'
    frames = []
    for index, own in enumerate(major):
        rows = {}
        for y, start, end in own:
            old = rows.get(y, (image.width, 0))
            rows[y] = min(start, old[0]), max(end, old[1])
        for other in major:
            if other is own:
                continue
            assert all(y not in rows or end <= rows[y][0] or start >= rows[y][1] for y, start, end in other), f'{name}:{index}: hull includes another pose'
        x0, x1 = min(a for a, _ in rows.values()), max(b for _, b in rows.values())
        y0, y1 = min(rows), max(rows)+1
        bottom = [span for y, span in rows.items() if y > y1-9]
        anchor_x = (min(a for a, _ in bottom)+max(b for _, b in bottom))/2
        assert heads[index] > 100 and y1-y0 > 100
        frames.append({'x':x0, 'y':y0, 'w':x1-x0, 'h':y1-y0,
                       'anchorX':anchor_x, 'anchorY':y1-1, 'bodyHeight':heads[index],
                       'outlines':[polygon(rows)]})
    return {'image':'shadow'+name[0].upper()+name[1:], 'frames':frames}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    atlas = {'actors':{name:register(name, heads) for name, heads in ACTORS.items()}}
    path = ROOT / 'assets/js/art-data.js'
    source = path.read_text(encoding='utf-8')
    start = source.index('// BEGIN SHADOW ATLAS')
    end = source.index('// END SHADOW ATLAS', start)+len('// END SHADOW ATLAS')
    block = '// BEGIN SHADOW ATLAS — generated by scripts/register-shadow-art.py\nconst ART_SHADOW='+json.dumps(atlas, separators=(',', ':'))+';\n// END SHADOW ATLAS'
    result = source[:start]+block+source[end:]
    if args.check:
        assert source == result, 'Shadow atlas registration is stale'
    else:
        path.write_text(result, encoding='utf-8', newline='\n')
    print('PASS: seven shadow actors, six isolated alpha-preserving registered poses each.' if args.check else 'Registered shadow actor crops, silhouettes and body/foot anchors.')


if __name__ == '__main__':
    main()
