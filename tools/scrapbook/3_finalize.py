"""Copy built assets into the site with readable names, export photo-window masks, write layout.ts."""
import json
import shutil
import sys
from collections import deque

import numpy as np
from PIL import Image

build, pdir, site = sys.argv[1], sys.argv[2], sys.argv[3]
L = json.load(open(f'{build}/layout.json'))
pos = json.load(open(f'{pdir}/pos.json'))
dest = f'{site}/public/scrapbook/parts'

NAMES = {
    'p00': 'script-scrap', 'p01': 'rose-strip', 'p02': 'cat', 'p03': 'fish', 'p04': 'notepad',
    'p05': 'zap-1', 'p06': 'zap-2', 'p07': 'polaroids', 'p08': 'zap-3', 'p09': 'red-stars',
    'p10': 'heart-1', 'p11': 'heart-2', 'p12': 'letter-paper', 'p13': 'star-sticker', 'p14': 'grid-paper',
    'p15': 'heart-3', 'p16': 'sparkle-1', 'p17': 'sparkle-2', 'p18': 'gray-flower-1', 'p19': 'gray-flower-2',
    'p20': 'yellow-mark-1', 'p21': 'yellow-mark-2', 'p22': 'camera', 'p23': 'gray-flower-3', 'p24': 'butterfly',
    'p25': 'dog', 'p26': 'clip-paper', 'p27': 'newspaper', 'p28': 'sparkle-3', 'p29': 'sparkle-4',
    'bouquet': 'bouquet', 'stem': 'flower-stem',
}
parts = {}
for key, name in NAMES.items():
    shutil.copy(f'{build}/{key}.webp', f'{dest}/{name}.webp')
    parts[name] = L[key]
shutil.copy(f'{build}/background.jpg', f'{dest}/background.jpg')


def hole_masks(key, prefix):
    a = np.asarray(Image.open(f'{pdir}/{key}.png'))[:, :, 3] > 40
    h, w = a.shape
    outside = np.zeros_like(a)
    q = deque([(y, x) for y in range(h) for x in (0, w - 1) if not a[y, x]] + [(y, x) for x in range(w) for y in (0, h - 1) if not a[y, x]])
    for y, x in q:
        outside[y, x] = True
    while q:
        cy, cx = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not a[ny, nx] and not outside[ny, nx]:
                outside[ny, nx] = True
                q.append((ny, nx))
    enclosed = ~a & ~outside
    lab = np.zeros((h, w), np.int32)
    found = []
    k = 0
    for y in range(h):
        for x in np.nonzero(enclosed[y] & (lab[y] == 0))[0]:
            if lab[y, x]:
                continue
            k += 1
            q = deque([(y, x)])
            lab[y, x] = k
            n = 0
            while q:
                cy, cx = q.popleft()
                n += 1
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < h and 0 <= nx < w and enclosed[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = k
                        q.append((ny, nx))
            if n > 4000:
                found.append(k)
    out = []
    for i, k in enumerate(found):
        m = lab == k
        # grow by 2px so the photo tucks under the frame edge
        m = np.pad(m, 3)
        g = m.copy()
        for dy in range(-2, 3):
            for dx in range(-2, 3):
                g |= np.roll(np.roll(m, dy, 0), dx, 1)
        g = g[3:-3, 3:-3]
        ys, xs = np.nonzero(g)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        img = Image.fromarray((g[y0:y1, x0:x1] * 255).astype(np.uint8), 'L')
        rgba = Image.new('RGBA', img.size, (255, 255, 255, 0))
        rgba.putalpha(img)
        fname = f'{prefix}-{i + 1}-mask.png'
        rgba.save(f'{dest}/{fname}', optimize=True)
        out.append({'x': int(pos[key][0] + x0), 'y': int(pos[key][1] + y0), 'w': int(x1 - x0), 'h': int(y1 - y0), 'mask': fname})
    return sorted(out, key=lambda d: (d['y'], d['x']))


windows = {
    'polaroids': hole_masks('p07', 'polaroid-window'),
    'camera': hole_masks('p22', 'camera-window')[0],
    'heartFrame': dict(zip(('x', 'y', 'w', 'h'), L['heartFrameWindow'])),
}

ts = ['// Generated from the Canva mockup by tools/scrapbook — positions are in px on the 1080×2340 design.',
      '// Each part is [x, y, width, height]. Re-run the tool if the design changes.',
      '',
      'export const DESIGN = { width: 1080, height: 2340 } as const',
      '',
      'export const PARTS = {']
for name, (x, y, w, h) in parts.items():
    ts.append(f"  '{name}': [{x}, {y}, {w}, {h}],")
ts += ['} as const satisfies Record<string, readonly [number, number, number, number]>', '',
       'export type PartName = keyof typeof PARTS', '',
       f'export const WINDOWS = {json.dumps(windows, indent=2)} as const', '']
open(f'{site}/src/scrapbook/layout.ts', 'w', encoding='utf-8', newline='\n').write('\n'.join(ts))
print(json.dumps(windows, indent=1))
