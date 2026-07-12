from pathlib import Path

root = Path('frontend')
updated = 0

for path in sorted(root.rglob('*.html')):
    text = path.read_text(encoding='utf-8')
    if 'mobile.css' in text:
        continue

    relative = path.relative_to(root)
    depth = len(relative.parts) - 1
    prefix = '../' * depth
    marker = f'<link rel="stylesheet" href="{prefix}assets/css/main.css">'
    insert = marker + f'\n<link rel="stylesheet" href="{prefix}assets/css/mobile.css">'

    if marker not in text:
        raise RuntimeError(f'Main stylesheet marker not found in {path}')

    path.write_text(text.replace(marker, insert, 1), encoding='utf-8')
    updated += 1

print(f'Added mobile stylesheet to {updated} templates')
