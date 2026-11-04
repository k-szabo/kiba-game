"""Partition the generated reference without changing palette values or IDs."""
import hashlib
import json

SECTIONS = ('pc', 'npcs', 'objects', 'paletteGroups', 'assets', 'codeColors')
FACTIONS = {'japan': 'japan', 'yomi': 'yomi', 'heaven': 'heaven',
            'shadowNinjas': 'shadow-ninjas', 'shadowCult': 'shadow-cult', 'necromancer': 'shadow-cult', 'shadowDen': 'shadow-den'}
LEGACY_FACTIONS = {'samurai': 'japan', 'prison.zen': 'japan',
                   'angelLight': 'heaven', 'angelDark': 'heaven', 'angelEclipse': 'heaven',
                   'oldAngel': 'heaven', 'oldCultist': 'shadow-cult', 'shadow': 'shadow-cult'}


def serialize(value):
    return json.dumps(value, ensure_ascii=False, indent=2) + '\n'


def references(value, key):
    if isinstance(value, dict):
        for name, child in value.items():
            if name == key:
                yield child
            else:
                yield from references(child, key)
    elif isinstance(value, list):
        for child in value:
            yield from references(child, key)


def partition(reference):
    """Each record has exactly one home; shared atlases keep their original IDs."""
    parts = {}
    group_owners, asset_owners = {}, {}

    def put(part, section, key, value):
        parts.setdefault(part, {}).setdefault(section, {})[key] = value

    def own(part, record):
        for identifier in references(record, 'paletteGroup'):
            assert identifier in reference['paletteGroups'], f'Missing group: {identifier}'
            group_owners.setdefault(identifier, set()).add(part)
            source = reference['paletteGroups'][identifier]['source']
            asset_owners.setdefault(source, set()).add(part)
        for source in references(record, 'asset'):
            asset_owners.setdefault(source, set()).add(part)

    for key, value in reference['pc'].items():
        put('player', 'pc', key, value)
        own('player', value)
    for key, value in reference['npcs'].items():
        part = FACTIONS.get(value.get('faction'), LEGACY_FACTIONS.get(key, 'neutral'))
        put(part, 'npcs', key, value)
        own(part, value)

    def source_part(source):
        owners = asset_owners.get(source, set())
        if len(owners) == 1:
            return next(iter(owners))
        if owners:
            return 'shared'
        if '/backgrounds/' in source or '/terrain/' in source:
            return 'environment'
        if '/ui/' in source:
            return 'inventory-ui'
        if '/effects/' in source:
            return 'effects'
        return 'shared'

    for key, value in reference['paletteGroups'].items():
        owners = group_owners.get(key, set())
        part = next(iter(owners)) if len(owners) == 1 else 'shared' if owners else source_part(value['source'])
        put(part, 'paletteGroups', key, value)
    for key, value in reference['assets'].items():
        put(source_part(key), 'assets', key, value)
    for key, value in reference['objects'].items():
        put('objects', 'objects', key, value)
    for key, value in reference['codeColors'].items():
        put('code-colors', 'codeColors', key, value)

    # Verify that partitioning is lossless before writing anything.
    for section in SECTIONS:
        merged = {}
        for part in parts.values():
            for key, value in part.get(section, {}).items():
                assert key not in merged, f'Duplicate {section}: {key}'
                merged[key] = value
        assert merged == reference[section], f'Incomplete {section}'

    files = {}
    manifest = {key: value for key, value in reference.items() if key not in SECTIONS}
    manifest['schemaVersion'] = 2
    manifest['dataSchemaVersion'] = reference['schemaVersion']
    manifest['counts'] = {key: len(reference[key]) for key in SECTIONS}
    manifest['parts'] = []
    for name, data in sorted(parts.items()):
        filename = f'{name}.json'
        payload = serialize(data)
        files[filename] = payload
        manifest['parts'].append({'file': 'colormaps/' + filename,
                                  'sha256': hashlib.sha256(payload.encode('utf-8')).hexdigest(),
                                  'counts': {key: len(value) for key, value in data.items()}})
    return manifest, files
