"""Register approved Hannah/Momo atlases without modifying source RGBA pixels.

Connected alpha components, rather than grid cells, retain weapons crossing
cell boundaries. Explicit boot anchors and constant standing-body scales keep
crouching poses small and exclude raised scythes, wings and fire from scaling.
"""
import argparse
import json
import runpy
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
HELPERS = runpy.run_path(str(ROOT / 'scripts/register-shadow-art.py'))
components, polygon = HELPERS['components'], HELPERS['polygon']
SPECS = {
    'walk': ('hannahWalk', 'enemies/hannah-walk-v1.png', 390,
             [(315, 493), (823, 493), (1311, 493),
              (338, 998), (817, 998), (1305, 998)]),
    'combo': ('hannahCombo', 'enemies/hannah-combo-v1.png', 390,
              [(260, 510), (767, 510), (1241, 510),
               (297, 988), (879, 990), (1333, 990)]),
    'jump': ('hannahJump', 'enemies/hannah-jump-v1.png', 390,
             [(205, 497), (753, 481), (1282, 459),
              (173, 938), (696, 990), (1291, 998)]),
    'ritual': ('hannahRitual', 'enemies/hannah-ritual-v1.png', 390,
               [(292, 507), (766, 507), (1280, 511),
                (246, 991), (760, 988), (1270, 967)]),
    'dawnblade': ('momoDawnblade', 'momo-dawnblade-v1.png', 340,
                  [(240, 510), (730, 512), (1234, 513),
                   (185, 964), (763, 964), (1275, 964)]),
}


def area(group):
    return sum(end-start for _, start, end in group)


def centroid(group):
    size = area(group)
    return (sum((start+end-1)*.5*(end-start) for _, start, end in group)/size,
            sum(y*(end-start) for y, start, end in group)/size)


def distance_to_runs(point, group):
    """Distance to actual component ink, including a cross-cell fire arc."""
    runs = np.asarray(group)
    dx = np.maximum(np.maximum(runs[:, 1]-point[0],
                               point[0]-(runs[:, 2]-1)), 0)
    return float(np.min(dx*dx+(runs[:, 0]-point[1])**2))


def rows_for(group):
    rows = {}
    for y, start, end in group:
        old = rows.get(y, (100000, 0))
        rows[y] = min(start, old[0]), max(end, old[1])
    return rows


def register(name, spec):
    image_key, relative, body, anchors = spec
    source = ROOT / 'assets/images' / relative
    with Image.open(source) as image:
        assert image.mode == 'RGBA', f'{name}: original RGBA alpha required'
        alpha = np.asarray(image.getchannel('A'))
        assert alpha.min() == 0 and alpha.max() >= 200, f'{name}: transparent source required'
        width, height = image.size
    groups = components(alpha >= 16)
    assert len(groups) >= 6 and area(groups[5]) > 20000, f'{name}: six separate poses required'
    assert len(groups) == 6 or area(groups[6]) < 10000, f'{name}: unexpected extra character'
    vertical = sorted(groups[:6], key=lambda group: centroid(group)[1])
    major = (sorted(vertical[:3], key=lambda group: min(start for _, start, _ in group)) +
             sorted(vertical[3:], key=lambda group: min(start for _, start, _ in group)))
    assigned = [[group] for group in major]
    # Separate gold arcs and spell wisps remain separate outlines. Their nearest
    # source ink determines ownership; tiny isolated alpha specks are not poses.
    for group in groups[6:]:
        if area(group) < 6:
            continue
        point = centroid(group)
        owner = min(range(6), key=lambda index: distance_to_runs(point, major[index]))
        assigned[owner].append(group)
    frames = []
    for index, owned in enumerate(assigned):
        # The generated top-middle ritual pose contains a third hand. It is
        # deliberately absent from runtime metadata; the other five keep order.
        if name == 'ritual' and index == 1:
            continue
        outlines, bounds = [], []
        for group in owned:
            rows = rows_for(group)
            for neighbor, other_groups in enumerate(assigned):
                if neighbor == index:
                    continue
                for other in other_groups:
                    assert all(y not in rows or end <= rows[y][0] or start >= rows[y][1]
                               for y, start, end in other), f'{name}:{index}: neighboring pose in hull'
            outlines.append(polygon(rows))
            bounds.append((min(start for start, _ in rows.values()), min(rows),
                           max(end for _, end in rows.values()), max(rows)+1))
        ink = [min(box[0] for box in bounds), min(box[1] for box in bounds),
               max(box[2] for box in bounds), max(box[3] for box in bounds)]
        x0, y0 = max(0, ink[0]-2), max(0, ink[1]-2)
        x1, y1 = min(width, ink[2]+2), min(height, ink[3]+2)
        ax, ay = anchors[index]
        assert x0 < ax < x1 and y0 < ay < y1, f'{name}:{index}: boot anchor outside crop'
        assert body > 100 and x1 > x0 and y1 > y0
        frames.append(dict(x=x0, y=y0, w=x1-x0, h=y1-y0,
                           anchorX=ax, anchorY=ay, bodyHeight=body,
                           sourceFrame=index, visibleBounds=ink, outlines=outlines))
    return dict(image=image_key, facing=1, frames=frames)


def build_atlas():
    atlas = {name: register(name, spec) for name, spec in SPECS.items()}
    assert [frame['sourceFrame'] for frame in atlas['ritual']['frames']] == [0, 2, 3, 4, 5]
    assert all(len(spec['frames']) == (5 if name == 'ritual' else 6)
               for name, spec in atlas.items())
    return atlas


def render(atlas):
    return ('/* Generated by scripts/register-hannah-art.py; source PNG alpha is unchanged. */\n'
            "'use strict';\nconst ART_HANNAH=" +
            json.dumps(atlas, separators=(',', ':')) + ';\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    result = render(build_atlas())
    target = ROOT / 'assets/js/hannah-art-data.js'
    if args.check:
        assert target.exists(), 'Hannah atlas registration is missing; run registrar first'
        assert target.read_text(encoding='utf-8') == result, 'Hannah atlas registration is stale'
    else:
        target.write_text(result, encoding='utf-8', newline='\n')
    print('PASS: 29 isolated alpha-preserving poses, full weapons/local effects, explicit boot anchors and stable body scales; unsafe ritual pose excluded.')


if __name__ == '__main__':
    main()
