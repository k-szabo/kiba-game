"""Export reference palettes; requires Python 3, Pillow, numpy and Node.js.

This analyzes existing assets without modifying any source image. It is an art
reference, not an indexed palette or a change to the game's rendering.
"""
import argparse
import base64
import hashlib
import json
import re
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'assets/config/colormaps.json'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--node', default='node', help='Node.js executable')
parser.add_argument('--check', action='store_true', help='Verify the existing reference is current')
args = parser.parse_args()
atlas_script = r"""
const fs=require('node:fs'),vm=require('node:vm');
const art=vm.runInNewContext(fs.readFileSync('assets/js/art-data.js','utf8')+';({manifest:ART_MANIFEST,frames:ART_FRAMES})');
art.shadow=vm.runInNewContext(fs.readFileSync('assets/js/shadow-animation.js','utf8')+';SHADOW_CLIPS');
const game=fs.readFileSync('assets/js/game.js','utf8');
art.realms=vm.runInNewContext(game.match(/const realms=(\[[\s\S]*?\n\]);/)[1],{I18n:{t:x=>x}});
process.stdout.write(JSON.stringify(art));
"""
atlas = json.loads(subprocess.check_output([args.node, '-e', atlas_script], cwd=ROOT, encoding='utf-8'))
images = {}


def colors(pixels, limit=16):
    """Alpha-weighted 5-bit histogram; excludes invisible RGB and tiny alpha noise."""
    data = pixels.reshape(-1, 4).astype(np.int64)
    data = data[data[:, 3] >= 32]
    if not len(data):
        return {'dominant': [], 'accents': [], 'visibleSamples': 0}

    def bins(rows, count):
        rgb = rows[:, :3]
        ids = (rgb[:, 0] // 8) * 1024 + (rgb[:, 1] // 8) * 32 + rgb[:, 2] // 8
        weights = rows[:, 3].astype(float)
        totals = np.bincount(ids, weights=weights, minlength=32768)
        sums = [np.bincount(ids, weights=weights * rgb[:, c], minlength=32768) for c in range(3)]
        occupied = np.flatnonzero(totals)
        mass = totals[occupied]
        points = np.stack([channel[occupied] / mass for channel in sums], axis=1)
        centers = [points[int(np.argmax(mass))]]
        nearest = ((points - centers[0]) ** 2).sum(axis=1)
        for _ in range(min(count, len(points)) - 1):
            index = int(np.argmax(nearest * np.sqrt(mass)))
            centers.append(points[index])
            nearest = np.minimum(nearest, ((points - points[index]) ** 2).sum(axis=1))
        centers = np.asarray(centers)
        for _ in range(24):
            labels = ((points[:, None, :] - centers[None, :, :]) ** 2).sum(axis=2).argmin(axis=1)
            population = np.bincount(labels, weights=mass, minlength=len(centers))
            updated = centers.copy()
            for i in range(len(centers)):
                selected = labels == i
                if population[i]:
                    updated[i] = (points[selected] * mass[selected, None]).sum(axis=0) / population[i]
            shift = float(np.abs(updated - centers).max())
            centers = updated
            if shift < .05:
                break
        result = []
        for i in np.lexsort((np.arange(len(centers)), -population)):
            if population[i]:
                color = np.rint(centers[i]).astype(int)
                result.append({'hex': '#' + ''.join(f'{v:02x}' for v in color),
                               'coveragePercent': round(float(population[i] / mass.sum() * 100), 4)})
        return result

    dominant = bins(data, limit)
    rgb = data[:, :3]
    high, low = rgb.max(axis=1), rgb.min(axis=1)
    vivid = (high >= 128) & ((high - low) >= high * .45)
    accents = bins(data[vivid], 6) if vivid.any() else []
    return {'dominant': dominant, 'accents': accents, 'visibleSamples': int(len(data)),
            'dominantCoveragePercent': round(sum(c['coveragePercent'] for c in dominant), 4)}


def image_array(source):
    if source not in images:
        images[source] = np.asarray(Image.open(ROOT / source).convert('RGBA'))
    return images[source]


def frame_pixels(source, rect):
    arr = image_array(source)
    x, y, w, h = (rect[k] for k in ('x', 'y', 'w', 'h'))
    assert 0 <= x < x + w <= arr.shape[1] and 0 <= y < y + h <= arr.shape[0], (source, rect)
    sample = arr[y:y+h, x:x+w].copy()
    # Match Canvas clipping in Visuals.frame, excluding neighboring atlas sprites.
    for outline in rect.get('outlines', []):
        mask = Image.new('L', (w, h))
        ImageDraw.Draw(mask).polygon([(px-x, py-y) for px, py in outline], fill=255)
        sample[:, :, 3] = np.minimum(sample[:, :, 3], np.asarray(mask))
    return sample.reshape(-1, 4)


groups = {}


def group(identifier, source, rects, metadata):
    if isinstance(rects, dict):
        rects = [rects]
    groups[identifier] = {'source': source, 'frameMetadata': metadata, 'frameCount': len(rects),
                          'palette': colors(np.concatenate([frame_pixels(source, r) for r in rects]))}
    return identifier


manifest = atlas['manifest']
assets = {}
for file in sorted((ROOT / 'assets').rglob('*.png')):
    source = file.relative_to(ROOT).as_posix()
    arr = image_array(source)
    keys = [k for k, v in manifest.items() if v == source]
    assets[source] = {'sha256': hashlib.sha256(file.read_bytes()).hexdigest(),
                      'width': int(arr.shape[1]), 'height': int(arr.shape[0]),
                      'runtimeKeys': keys, 'usage': 'runtime' if keys or file.name in ('momo.png', 'momo-menu-idle-v2.png') else 'design-reference',
                      'palette': colors(arr)}

pc = {'momo': {'name': 'Momo', 'variants': {}}}
pc['momo']['variants']['base'] = {'asset': 'assets/images/momo.png'}
menu_frames = [{'x': i % 3 * 512, 'y': i // 3 * 512, 'w': 512, 'h': 512} for i in range(6)]
pc['momo']['variants']['menuIdle'] = {'paletteGroup': group('pc.momo.menuIdle', 'assets/images/momo-menu-idle-v2.png', menu_frames, 'game.js: drawMenuMomo')}
pc['momo']['variants']['sword'] = {'paletteGroup': group('pc.momo.sword', manifest['momoSlash'], atlas['frames']['momoSlash'], 'ART_FRAMES.momoSlash')}
npcs = {'haru': {'name': 'Haru', 'paletteRef': 'pc.momo', 'note': 'The father shares Momo\'s base sprite; scene-specific rendering colors are listed under codeColors.'}}
for faction, actions in atlas['frames']['animations'].items():
    for role in actions['walk']:
        variants = {}
        for action, roles in actions.items():
            key = faction + action.capitalize()
            identifier = f'npc.{faction}.{role}.{action}'
            variants[action] = {'paletteGroup': group(identifier, manifest[key], roles[role], f'ART_FRAMES.animations.{faction}.{action}.{role}')}
        npcs[f'{faction}.{role}'] = {'faction': faction, 'role': role, 'variants': variants}

for key in ('samurai', 'angelLight', 'angelDark', 'angelEclipse', 'oldAngel', 'oldCultist'):
    identifier = f'npc.{key}'
    npcs[key] = {'role': 'miniboss' if key.startswith('old') else 'boss',
                 'paletteGroup': group(identifier, manifest[key], atlas['frames'][key], 'ART_FRAMES.' + key)}
npcs['demonLord'] = {'role': 'boss', 'faction': 'yomi', 'paletteGroup': group('npc.demonLord', manifest['bosses'], atlas['frames']['bosses'][1], 'ART_FRAMES.bosses[1]')}
npcs['shadow'] = {'name': {'hu': 'Árnyék', 'en': 'Shadow'}, 'role': 'prologue-boss', 'variants': {}}
for action, clip in atlas['shadow'].items():
    npcs['shadow']['variants'][action] = {'paletteGroup': group('npc.shadow.' + action, manifest[clip['image']], clip['frames'], 'SHADOW_CLIPS.' + action)}

objects = {}
for family in ('props', 'relics'):
    for name, rect in atlas['frames'][family].items():
        objects[name] = {'paletteGroup': group('object.' + name, manifest[family], rect, f'ART_FRAMES.{family}.{name}')}
for row, tiles in enumerate(atlas['frames']['terrain']):
    for column, rect in enumerate(tiles):
        name = f'terrain.{("japan", "yomi", "heaven")[row]}.tile{column}'
        objects[name] = {'paletteGroup': group(name, manifest['terrain'], rect, f'ART_FRAMES.terrain[{row}][{column}]')}
# Older boss rows are retained as art references even though newer sheets render Japan/heaven.
for row in (0, 2):
    group(f'reference.bosses.row{row}', manifest['bosses'], atlas['frames']['bosses'][row], f'ART_FRAMES.bosses[{row}]')

literal_re = re.compile(r'#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{4}\b|#[0-9a-fA-F]{3}\b|rgba?\([^()]*\)|hsla?\([^()]*\)')
code_colors = {}
for file in sorted(list((ROOT / 'assets/js').glob('*.js')) + list((ROOT / 'assets/css').glob('*.css'))):
    if file.name == 'runtime.js':
        continue
    source = file.relative_to(ROOT).as_posix()
    found = {}
    for line_number, line in enumerate(file.read_text(encoding='utf-8').splitlines(), 1):
        for match in literal_re.finditer(line):
            literal = match.group()
            found.setdefault(literal, []).append(line_number)
    code_colors[source] = [{'value': color, 'lines': sorted(set(lines)), 'dynamic': '${' in color} for color, lines in sorted(found.items())]

flags = {}
locales = json.loads((ROOT / 'assets/i18n/locales.json').read_text(encoding='utf-8'))
for language, locale in locales.items():
    svg = base64.b64decode(locale['flag'].split(',', 1)[1]).decode('utf-8')
    flags[language] = {'source': f'assets/i18n/locales.json:{language}.flag',
                        'sha256': hashlib.sha256(svg.encode()).hexdigest(),
                        'colors': sorted(set(literal_re.findall(svg))),
                        'namedColors': sorted(set(re.findall(r'(?:fill|stroke)=["\']([a-zA-Z]+)["\']', svg)))}

result = {'schemaVersion': 1,
          'purpose': 'Reference colormaps of all current character and graphic assets; no runtime rendering changes.',
          'method': {'generator': 'scripts/export-colormaps.py', 'alphaMinimum': 32,
                     'quantization': '5 bits/channel histogram followed by deterministic weighted k-means RGB clustering (up to 24 iterations)',
                     'dominantLimit': 16, 'accentLimit': 6,
                     'coverage': 'dominant percentages use all visible samples; accent percentages use only the saturated bright subset',
                     'notes': ['Palettes are representative, not an exhaustive list of every pixel color.',
                               'Fully transparent RGB and alpha below 32 are excluded, preserving no matte color.',
                               'Atlas groups use the same source rectangles and intersection of clip outlines as the renderer.',
                               'Dynamic VFX colors are preserved as source expressions; lighting, opacity and filters can alter displayed colors.']},
          'pc': pc, 'npcs': npcs, 'objects': objects, 'paletteGroups': groups, 'assets': assets,
          'realmColors': {name: {k: value for k, value in record.items() if k in ('sky', 'fog', 'gold', 'accent', 'floor')}
                          for name, record in zip(('japan', 'yomi', 'heaven'), atlas['realms'])},
          'flags': flags, 'codeColors': code_colors}
serialized = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
assert len(npcs) == 21, 'Missing current character entry'
assert len(assets) == len(list((ROOT / 'assets').rglob('*.png'))), 'Incomplete image inventory'
if args.check:
    assert OUTPUT.read_text(encoding='utf-8') == serialized, 'Colormaps are stale; regenerate the reference.'
    print('PASS: exhaustive image inventory, character/atlas references, clipped sampling and deterministic colormaps are current.')
else:
    OUTPUT.write_text(serialized, encoding='utf-8', newline='\n')
    print(f'Exported {len(assets)} image assets, {len(npcs)} NPCs/forms, {len(groups)} atlas groups, {len(flags)} flags to {OUTPUT.relative_to(ROOT)}')
