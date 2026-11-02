"""Print ART_FIA_RITUAL JSON to stdout; never mutate images or game sources.

Usage: python scripts/register-fia-ritual.py > ignored-metadata.json
Actor frames use connected source-alpha outlines because nominal atlas cells
overlap. Faint disappearance poses and detached fragments remain attached to
their nearest character. VFX cells keep all native alpha, including soft edges.
"""
import argparse
import json
from pathlib import Path
from art_alpha_registration import ROOT, alpha_components, frame, read_alpha


def bounds(pixels):
    xs, ys = zip(*pixels)
    return min(xs), min(ys), max(xs)+1, max(ys)+1


def actor_groups(path, expected, rows):
    alpha = read_alpha(path)
    h, w = alpha.shape
    assert not any((alpha[0] > 32)) and not any((alpha[-1] > 32)) and not any((alpha[:, 0] > 32)) and not any((alpha[:, -1] > 32)), f'Clipped actor sheet: {path}'
    all_groups = alpha_components(alpha, threshold=32, min_pixels=16)
    by_size = sorted(all_groups, key=len, reverse=True)
    assert len(by_size) >= expected, (str(path), len(by_size), expected)
    cores = by_size[:expected]
    assert len(cores[-1]) > 2000, f'Missing primary silhouette: {path}'
    assert len(by_size) == expected or len(by_size[expected]) < len(cores[-1])*.2, f'Ambiguous extra actor: {path}'
    core_ids = {id(g) for g in cores}
    cores.sort(key=lambda g: (int(sum(y for _, y in g)/len(g))//(h//rows), min(x for x, _ in g)))
    centers = [(sum(x for x, _ in g)/len(g), sum(y for _, y in g)/len(g)) for g in cores]
    boxes = [bounds(g) for g in cores]
    # Assign detached cloth, magic and silhouette pieces by location, without
    # clipping them at nominal cell boundaries or discarding the fading poses.
    for fragment in all_groups:
        if id(fragment) in core_ids:
            continue
        x = sum(p[0] for p in fragment)/len(fragment)
        y = sum(p[1] for p in fragment)/len(fragment)
        index = min(range(expected), key=lambda i: (x-centers[i][0])**2+(y-centers[i][1])**2)
        x0, y0, x1, y1 = boxes[index]
        gap = max(x0-x, x-x1, y0-y, y-y1, 0)
        assert gap < 32, f'Unassigned distant fragment: {path}, {bounds(fragment)}'
        cores[index].update(fragment)
    return cores


def grid_frames(path, columns, rows, body_height):
    alpha = read_alpha(path)
    height, width = alpha.shape
    xs = [round(i*width/columns) for i in range(columns+1)]
    ys = [round(i*height/rows) for i in range(rows+1)]
    result = []
    for row in range(rows):
        for column in range(columns):
            x, y = xs[column], ys[row]
            w, h = xs[column+1]-x, ys[row+1]-y
            assert (alpha[y:y+h, x:x+w] > 32).any(), 'Empty VFX cell'
            result.append(dict(x=x, y=y, w=w, h=h, anchorX=x+w/2, anchorY=y+h/2, bodyHeight=body_height, visibleBounds=[x, y, x+w, y+h]))
    return result


def service_art(path):
    """Register the three approved corrupted humans without cutting tools.

    Trader cast's backpack starts before the nominal fourth-column boundary;
    x917 is in the actual transparent gap. All other rows use equal columns.
    Source-space foot anchors come from the lowest twelve silhouette rows,
    while one fixed body height per identity prevents animation rescaling.
    """
    alpha = read_alpha(path)
    assert alpha.shape == (1254, 1254), f'Unexpected service atlas size: {path}'
    result = {}
    for row, (key, body_height) in enumerate([('trader', 310), ('cook', 335), ('smith', 345)]):
        xs = [0, 314, 627, 917, 1254] if row == 0 else [0, 314, 627, 940, 1254]
        y, h = row*418, 418
        frames = []
        for column in range(4):
            x, w = xs[column], xs[column+1]-xs[column]
            cell = alpha[y:y+h, x:x+w]
            assert not any(cell[0] > 32) and not any(cell[-1] > 32) and not any(cell[:, 0] > 32) and not any(cell[:, -1] > 32), f'Clipped service cell: {key}/{column}'
            groups = alpha_components(cell, threshold=32, min_pixels=16)
            assert groups and max(map(len, groups)) > 2000, f'Missing service: {key}/{column}'
            pixels = {(px+x, py+y) for group in groups for px, py in group}
            frames.append(frame(pixels, body_height, include_fragments=True))
        result[key] = {'image': 'fiaUnderworldCorrupted', 'facing': 1, 'frames': frames}
    return result


def build_art(attendants='assets/images/npcs/fia-ritual-attendants-v1.png', fia='assets/images/enemies/fia-ritual-v1.png', powers='assets/images/effects/fia-ritual-powers-v1.png', chains='assets/images/effects/fia-ritual-chains-v1.png', services='assets/images/npcs/fia-underworld-corrupted-v1.png'):
    attendants_groups = actor_groups(attendants, 8, 2)
    fia_groups = actor_groups(fia, 4, 2)
    anchors = [(260, 480), (671, 482), (995, 487), (1340, 488), (260, 975), (671, 975), (995, 974), (1340, 979)]
    attendant_frames = [frame(g, 465, anchor=anchor, include_fragments=True) for g, anchor in zip(attendants_groups, anchors)]
    fia_anchors = [(443, 523), (1228, 527), (423, 1008), (1177, 965)]
    fia_frames = [frame(g, 510, anchor=anchor, include_fragments=True) for g, anchor in zip(fia_groups, fia_anchors)]
    return {
        'white': {'image': 'fiaRitualAttendants', 'facing': 1, 'faction': 'white', 'frames': attendant_frames[:4]},
        'red': {'image': 'fiaRitualAttendants', 'facing': 1, 'faction': 'red', 'frames': attendant_frames[4:]},
        'fia': {'image': 'fiaRitual', 'facing': 1, 'frames': fia_frames},
        'powers': {'image': 'fiaRitualPowers', 'facing': 1, 'frames': grid_frames(powers, 4, 2, 443.5)},
        'chains': {'image': 'fiaRitualChains', 'facing': 1, 'frames': grid_frames(chains, 2, 2, 512)},
        'services': service_art(services),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for key, default in [('attendants', 'assets/images/npcs/fia-ritual-attendants-v1.png'), ('fia', 'assets/images/enemies/fia-ritual-v1.png'), ('powers', 'assets/images/effects/fia-ritual-powers-v1.png'), ('chains', 'assets/images/effects/fia-ritual-chains-v1.png'), ('services', 'assets/images/npcs/fia-underworld-corrupted-v1.png')]:
        parser.add_argument('--'+key, type=Path, default=ROOT/default)
    args = parser.parse_args()
    print(json.dumps(build_art(**vars(args)), separators=(',', ':')))


if __name__ == '__main__':
    main()
