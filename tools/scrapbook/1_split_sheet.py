"""Split the sticker sheet into pieces and find each piece's position/scale in the mockup."""
import json
import sys
from collections import deque

import numpy as np
from PIL import Image

root, out = sys.argv[1], sys.argv[2]
S = Image.open(f'{root}/2010 (1).png').convert('RGBA')
M = Image.open(f'{root}/mockup.png').convert('RGB')
sa = np.asarray(S)
alpha = sa[:, :, 3] > 20

# --- connected components at 1/2 resolution ---
f = 2
small = alpha[::f, ::f]
h, w = small.shape
lab = np.zeros((h, w), np.int32)
comps = []
n = 0
for y in range(h):
    row = small[y]
    for x in np.nonzero(row)[0]:
        if lab[y, x]:
            continue
        n += 1
        q = deque([(y, x)])
        lab[y, x] = n
        ys, xs = [y], [x]
        while q:
            cy, cx = q.popleft()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < h and 0 <= nx < w and small[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = n
                    q.append((ny, nx))
                    ys.append(ny)
                    xs.append(nx)
        if len(ys) > 15:
            comps.append((n, min(xs) * f, min(ys) * f, (max(xs) + 1) * f, (max(ys) + 1) * f, len(ys)))

full_lab = np.kron(lab, np.ones((f, f), np.int32))[: sa.shape[0], : sa.shape[1]]

# --- matching on downsampled mockup ---
D = 4
md = np.asarray(M.resize((M.width // D, M.height // D), Image.BOX)).astype(np.float32)

def piece(cid, box):
    x0, y0, x1, y1 = box
    p = sa[y0:y1, x0:x1].copy()
    mask = (full_lab[y0:y1, x0:x1] == cid) & (p[:, :, 3] > 20)
    p[~mask, 3] = 0
    return Image.fromarray(p, 'RGBA')

def match(img, scales):
    best = (1e18, None)
    for sc in scales:
        w2 = max(2, round(img.width * sc / D))
        h2 = max(2, round(img.height * sc / D))
        t = np.asarray(img.resize((w2, h2), Image.BOX)).astype(np.float32)
        a = t[:, :, 3] > 200
        if a.sum() < 6 or h2 >= md.shape[0] or w2 >= md.shape[1]:
            continue
        tc = t[:, :, :3][a]
        ys, xs = np.nonzero(a)
        # Allow pieces to hang off the canvas edges by up to half their size
        for my in range(-h2 // 2, md.shape[0] - h2 // 2):
            yy = ys + my
            okv = (yy >= 0) & (yy < md.shape[0])
            for mx in range(-w2 // 2, md.shape[1] - w2 // 2, 1):
                xx = xs + mx
                ok = okv & (xx >= 0) & (xx < md.shape[1])
                if ok.sum() < 0.6 * len(xs):
                    continue
                d = md[yy[ok], xx[ok]] - tc[ok]
                v = float((d * d).mean())
                if v < best[0]:
                    best = (v, (sc, mx * D, my * D))
    return best

results = []
for cid, x0, y0, x1, y1, cnt in comps:
    img = piece(cid, (x0, y0, x1, y1))
    name = f'p{len(results):02d}'
    img.save(f'{out}/{name}.png')
    results.append({'name': name, 'sheet': [int(x0), int(y0), int(x1), int(y1)], 'pixels': int(cnt)})
json.dump(results, open(f'{out}/pieces.json', 'w'), indent=1)
print(len(results), 'pieces saved')
