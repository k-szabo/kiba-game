"""Read-only native-alpha atlas helpers; these functions never write PNG pixels."""
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


def read_alpha(path):
    """Return native alpha without modifying the source image."""
    with Image.open(ROOT/path) as image:
        assert image.mode == 'RGBA', f'Expected native RGBA: {path}'
        return np.array(image)[:, :, 3]


def alpha_components(alpha, threshold=32, min_pixels=2000):
    """Find four-connected pixel sets, in source scan order."""
    pending = alpha > threshold
    h, w = pending.shape
    groups = []
    for yy, xx in zip(*np.where(pending)):
        if not pending[yy, xx]:
            continue
        todo = [(int(xx), int(yy))]
        pending[yy, xx] = False
        pixels = set()
        while todo:
            x, y = todo.pop()
            pixels.add((x, y))
            for nx, ny in ((x-1, y), (x+1, y), (x, y-1), (x, y+1)):
                if 0 <= nx < w and 0 <= ny < h and pending[ny, nx]:
                    pending[ny, nx] = False
                    todo.append((nx, ny))
        if len(pixels) > min_pixels:
            groups.append(pixels)
    return groups


def components(path, expected):
    """Legacy Q4 ordering and cutoff, retained unchanged in metadata."""
    alpha = read_alpha(path)
    assert not np.any(alpha[0] > 32) and not np.any(alpha[-1] > 32) and not np.any(alpha[:, 0] > 32) and not np.any(alpha[:, -1] > 32), 'Clipped source silhouette'
    h, _ = alpha.shape
    groups = alpha_components(alpha)
    assert len(groups) == expected, (path, len(groups), expected)
    return sorted(groups, key=lambda g: (int(np.mean([p[1] for p in g]))//(h//(3 if expected == 18 else 2 if expected > 3 else 1)), min(p[0] for p in g)))


def _area(loop):
    return sum(a[0]*b[1]-b[0]*a[1] for a, b in zip(loop, loop[1:]))


def frame(pixels, body_height, *, anchor=None, include_fragments=False):
    """Register source-space bounds/outlines; optional explicit body anchor.

    Defaults match Q4. Detached outer loops are optional; native image alpha
    supplies opacity and transparent holes when the source is rendered.
    """
    xs = [p[0] for p in pixels]
    ys = [p[1] for p in pixels]
    x0, x1, y0, y1 = min(xs), max(xs)+1, min(ys), max(ys)+1
    edges = {}
    for x, y in pixels:
        for neighbor, start, end in [((x, y-1), (x, y), (x+1, y)), ((x+1, y), (x+1, y), (x+1, y+1)), ((x, y+1), (x+1, y+1), (x, y+1)), ((x-1, y), (x, y+1), (x, y))]:
            if neighbor not in pixels:
                edges.setdefault(start, []).append(end)
    loops = []
    while edges:
        start = next(iter(edges))
        point = start
        loop = [start]
        while True:
            ends = edges.get(point)
            if not ends:
                break
            nxt = ends.pop()
            if not ends:
                del edges[point]
            point = nxt
            loop.append(point)
            if point == start:
                break
        if len(loop) > 4:
            loops.append(loop)
    outer = max(loops, key=lambda loop: abs(_area(loop)))
    selected = [loop for loop in loops if _area(loop) > 0] if include_fragments else [outer]
    foot_x = float(np.median([x for x, y in pixels if y >= y1-12]))
    anchor_x, anchor_y = anchor if anchor is not None else (foot_x, y1)
    return dict(x=x0, y=y0, w=x1-x0, h=y1-y0, anchorX=anchor_x, anchorY=anchor_y, bodyHeight=body_height, visibleBounds=[x0, y0, x1, y1], outlines=[simplify(loop) for loop in selected])
