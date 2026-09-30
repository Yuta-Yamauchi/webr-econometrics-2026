"""Regenerate browser definitions and native R cases from simulation_settings.json."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
lessons = json.loads((root / 'simulation_settings.json').read_text(encoding='utf-8'))
for lesson in lessons:
    lesson.pop('connection', None)
(root / 'simulation_settings.json').write_text(json.dumps(lessons, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(root / 'lessons.js').write_text('// Generated from simulation_settings.json by tests/prepare_cases.py\nexport const lessons = ' + json.dumps(lessons, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')

def rlist(mapping):
    return 'list(' + ', '.join(f'{k} = {json.dumps(v, ensure_ascii=False)}' for k, v in mapping.items()) + ')'

cases = []
for lesson in lessons:
    for preset in lesson['scenarios']:
        params = {f['key']: f['value'] for f in lesson['fields']}
        params.update(preset['params'])
        cases.append('list(id = ' + json.dumps(lesson['id']) + ', preset = ' + json.dumps(preset['id']) + ', file = ' + json.dumps(lesson['file']) + ', params = ' + rlist(params) + ')')
(root / 'tests/cases.R').write_text('# Generated from simulation_settings.json\nlist(\n  ' + ',\n  '.join(cases) + '\n)\n', encoding='utf-8')
print(f'{len(lessons)} simulations; {len(cases)} presets')
