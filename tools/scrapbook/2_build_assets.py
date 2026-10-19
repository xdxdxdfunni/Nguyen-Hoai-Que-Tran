"""Build the scrapbook assets: bare red-paper background, separated stickers, layout + hole geometry."""
import json
import sys
from collections import deque

import numpy as np
from PIL import Image

root, pdir, out = sys.argv[1], sys.argv[2], sys.argv[3]
W, H = 1080, 2340
M = np.asarray(Image.open(f'{root}/mockup.png').convert('RGB')).astype(np.float32)
pos = json.load(open(f'{pdir}/pos.json'))
names = sorted(pos)
imgs = {n: np.asarray(Image.open(f'{pdir}/{n}.png')).copy() for n in names}


# ---------- helpers ----------
def box_blur(a, r):
    """Separable box blur with radius r (edges clamp)."""
    out = a.astype(np.float64)
    for axis in (0, 1):
        pad = [(0, 0)] * out.ndim
        pad[axis] = (r + 1, r)
        c = np.cumsum(np.pad(out, pad, mode='edge'), axis=axis)
        sl_hi = [slice(None)] * out.ndim
        sl_lo = [slice(None)] * out.ndim
        sl_hi[axis] = slice(2 * r + 1, None)
        sl_lo[axis] = slice(0, -(2 * r + 1))
        out = (c[tuple(sl_hi)] - c[tuple(sl_lo)]) / (2 * r + 1)
    return out


def blur(a, r, passes=3):
    for _ in range(passes):
        a = box_blur(a, r)
    return a


def dilate(mask, r):
    return blur(mask.astype(np.float64), r, 1) > 1e-6


def placed_alpha(n):
    """Alpha of piece n placed on the W×H canvas."""
    a = imgs[n][:, :, 3]
    x0, y0 = pos[n]
    h, w = a.shape
    canvas = np.zeros((H, W), np.uint8)
    X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(W, x0 + w), min(H, y0 + h)
    if X1 > X0 and Y1 > Y0:
        canvas[Y0:Y1, X0:X1] = a[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0]
    return canvas


# ---------- 1. background: red paper with every piece removed ----------
cover = np.zeros((H, W), bool)
for n in names:
    cover |= placed_alpha(n) > 8
hole = dilate(cover, 3)

# A clean swatch of red paper to synthesise texture from: pick the clean window with the most typical red.
best = None
S = 140
for y in range(0, H - S, 20):
    for x in range(0, W - S, 20):
        if hole[y:y + S, x:x + S].any():
            continue
        win = M[y:y + S, x:x + S]
        score = win.std(axis=(0, 1)).sum()
        if best is None or score < best[0]:
            best = (score, x, y)
_, sx, sy = best
sw = M[sy:sy + S, sx:sx + S]
# Mirror-tile so there are no hard seams
tile = np.concatenate([np.concatenate([sw, sw[:, ::-1]], 1), np.concatenate([sw[::-1], sw[::-1, ::-1]], 1)], 0)
T = np.tile(tile, (H // tile.shape[0] + 1, W // tile.shape[1] + 1, 1))[:H, :W]
# Low-frequency colour from the visible paper (normalised convolution) + high-frequency grain from the tile
keep = (~hole).astype(np.float64)
R = 45
num = np.stack([blur(M[:, :, c] * keep, R) for c in range(3)], -1)
den = blur(keep, R)[:, :, None]
low = num / np.maximum(den, 1e-3)
# Far from any visible paper the estimate is unreliable; fall back to the global mean red
glob = (M * keep[:, :, None]).sum((0, 1)) / keep.sum()
conf = np.clip(den / 0.05, 0, 1)
low = low * conf + glob * (1 - conf)
grain = T - np.stack([blur(T[:, :, c], R) for c in range(3)], -1)
synth = np.clip(low + grain, 0, 255)
feather = blur(hole.astype(np.float64), 2, 2)[:, :, None]
bg = M * (1 - feather) + synth * feather
Image.fromarray(bg.astype(np.uint8)).save(f'{out}/background.jpg', quality=86, optimize=True, progressive=True)
print('background done, swatch at', sx, sy)


# ---------- 2. split the bouquet out of p14 and the flower stem out of p12 ----------
def rgbv(a):
    rgb = a[:, :, :3].astype(np.int32)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    return r, g, b, rgb.max(2), rgb.min(2)


def largest_components(mask, keep_min):
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32)
    out = np.zeros_like(mask)
    n = 0
    for y in range(h):
        for x in np.nonzero(mask[y] & (lab[y] == 0))[0]:
            if lab[y, x]:
                continue
            n += 1
            q = deque([(y, x)])
            lab[y, x] = n
            pts = [(y, x)]
            while q:
                cy, cx = q.popleft()
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = n
                        q.append((ny, nx))
                        pts.append((ny, nx))
            if len(pts) >= keep_min:
                ys, xs = zip(*pts)
                out[list(ys), list(xs)] = True
    return out


def fill_holes(mask):
    """Fill enclosed holes in a mask (flood fill background from the border)."""
    h, w = mask.shape
    outside = np.zeros_like(mask)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if not mask[y, x] and not outside[y, x]:
                outside[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if not mask[y, x] and not outside[y, x]:
                outside[y, x] = True
                q.append((y, x))
    while q:
        cy, cx = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not mask[ny, nx] and not outside[ny, nx]:
                outside[ny, nx] = True
                q.append((ny, nx))
    return ~outside


def opening(mask, r):
    eroded = blur((~mask).astype(np.float64), r, 1) < 1e-6
    return dilate(eroded, r)


def extract(src_name, box, pick, fill_paper, thin_zone_right=None, largest_only=False):
    """Cut the pixels chosen by `pick` inside `box` (piece-local coords) into a new sticker."""
    a = imgs[src_name]
    x0, y0, x1, y1 = box
    sub = a[y0:y1, x0:x1]
    m = pick(sub) & (sub[:, :, 3] > 20)
    if thin_zone_right is not None:
        # Over the grid paper, drop thin dark grid lines (keep only solid blobs)
        zone = np.zeros_like(m)
        zone[:, : max(0, thin_zone_right - x0)] = True
        # Close first so dotted (halftone) roses become solid, then open to drop the thin grid lines
        closed = blur(m.astype(np.float64), 3, 1) > 0.3
        m = np.where(zone, opening(closed, 4) & closed, m)
    if largest_only:
        sizes = []
        lm = largest_components(m, 1)
        # keep the single biggest blob
        h, w = lm.shape
        lab = np.zeros((h, w), np.int32)
        k = 0
        best_k, best_n = 0, 0
        for y in range(h):
            for x in np.nonzero(lm[y] & (lab[y] == 0))[0]:
                if lab[y, x]:
                    continue
                k += 1
                q = deque([(y, x)])
                lab[y, x] = k
                cnt = 0
                while q:
                    cy, cx = q.popleft()
                    cnt += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h and 0 <= nx < w and lm[ny, nx] and not lab[ny, nx]:
                            lab[ny, nx] = k
                            q.append((ny, nx))
                if cnt > best_n:
                    best_k, best_n = k, cnt
        m = lab == best_k
    else:
        m = largest_components(m, 400)
    m = fill_holes(blur(m.astype(np.float64), 2, 1) > 0.35) & (sub[:, :, 3] > 20)
    sticker = sub.copy()
    sticker[~m, 3] = 0
    # Remove from the source piece and repair what was underneath
    fill_paper(a, x0, y0, m)
    return sticker, m


def repair_by_rows(a, x0, y0, m):
    """Lined paper: copy each row's nearest visible pixel from the left so ruled lines continue."""
    m2 = dilate(m, 2)
    for yy in range(m2.shape[0]):
        row = m2[yy]
        if not row.any():
            continue
        ay = y0 + yy
        for xx in np.nonzero(row)[0]:
            ax = x0 + xx
            sx_ = ax
            while sx_ > 0 and (m2[yy, sx_ - x0] if 0 <= sx_ - x0 < m2.shape[1] else False):
                sx_ -= 1
            if a[ay, sx_, 3] > 200:
                a[ay, ax] = a[ay, sx_]
            else:
                a[ay, ax, 3] = 0


def repair_grid(a, x0, y0, m):
    """Grid paper: copy from one or more grid periods below/above; elsewhere make transparent."""
    m2 = dilate(m, 2)
    period = 44  # grid cell size in px (measured on the sheet)
    strip_right = 212  # grid paper's torn right edge, in p14-local x (canvas x ≈ 42)
    for yy, xx in zip(*np.nonzero(m2)):
        ay, ax = y0 + yy, x0 + xx
        if ax > strip_right:
            a[ay, ax, 3] = 0
            continue
        done = False
        for k in (1, -1, 2, -2, 3, -3, 4, 5, 6):
            sy_ = ay + k * period
            if 0 <= sy_ < a.shape[0]:
                ly, lx = sy_ - y0, ax - x0
                inside_mask = 0 <= ly < m2.shape[0] and 0 <= lx < m2.shape[1] and m2[ly, lx]
                if not inside_mask and a[sy_, ax, 3] > 200:
                    px = a[sy_, ax]
                    # only copy grid-paper pixels (light, unsaturated)
                    if int(px[:3].max()) > 150 and int(px[:3].max()) - int(px[:3].min()) < 40:
                        a[ay, ax] = px
                        done = True
                        break
        if not done:
            a[ay, ax, 3] = 0


def is_bouquet(sub):
    r, g, b, mx, mn = rgbv(sub)
    dark = mx < 115
    pink = (r > 170) & (r - g > 28) & (r - b > 10)
    green = (g > r + 8) & (g > b) & (mx < 200)
    return dark | pink | green


def is_stem(sub):
    r, g, b, mx, mn = rgbv(sub)
    dark = mx < 120
    olive = (mx < 175) & (mx - mn > 12) & (g >= b) & ~((b > r) & (b > g))  # fern leaves, not blue rules
    return dark | olive


# Boxes are piece-local (piece pos: p14 at -170,745 ; p12 at 404,699)
bq_box_canvas = (-10, 840, 380, 1250)
stem_box_canvas = (790, 1120, 1075, 1470)
b14 = (bq_box_canvas[0] + 170, bq_box_canvas[1] - 745, bq_box_canvas[2] + 170, bq_box_canvas[3] - 745)
b12 = (stem_box_canvas[0] - 404, stem_box_canvas[1] - 699, stem_box_canvas[2] - 404, stem_box_canvas[3] - 699)
bouquet, bm = extract('p14', b14, is_bouquet, repair_grid, thin_zone_right=232)
stem, sm = extract('p12', b12, is_stem, repair_by_rows, largest_only=True)


def trim_save(arr, name, origin_xy):
    al = arr[:, :, 3] > 8
    ys, xs = np.nonzero(al)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    Image.fromarray(arr[y0:y1, x0:x1]).save(f'{out}/{name}.webp', quality=90, method=6)
    return [int(origin_xy[0] + x0), int(origin_xy[1] + y0), int(x1 - x0), int(y1 - y0)]


layout = {}
layout['bouquet'] = trim_save(bouquet, 'bouquet', (bq_box_canvas[0], bq_box_canvas[1]))
layout['stem'] = trim_save(stem, 'stem', (stem_box_canvas[0], stem_box_canvas[1]))


# ---------- 3. holes (photo windows) in the polaroids and the camera frame ----------
def holes(n, min_area=4000):
    a = imgs[n][:, :, 3] > 40
    enclosed = fill_holes(a) & ~a
    hs = []
    h, w = enclosed.shape
    lab = np.zeros((h, w), np.int32)
    k = 0
    for y in range(h):
        for x in np.nonzero(enclosed[y] & (lab[y] == 0))[0]:
            if lab[y, x]:
                continue
            k += 1
            q = deque([(y, x)])
            lab[y, x] = k
            pts = []
            while q:
                cy, cx = q.popleft()
                pts.append((cy, cx))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < h and 0 <= nx < w and enclosed[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = k
                        q.append((ny, nx))
            if len(pts) >= min_area:
                ys = np.array([p[0] for p in pts], np.float64)
                xs = np.array([p[1] for p in pts], np.float64)
                cy, cx = ys.mean(), xs.mean()
                cov = np.cov(np.stack([xs - cx, ys - cy]))
                evals, evecs = np.linalg.eigh(cov)
                v = evecs[:, 1]
                ang = np.degrees(np.arctan2(v[1], v[0]))
                # angle of the long axis -> rotation of an upright rectangle (portrait: long axis vertical)
                rot = ((ang - 90 + 45) % 90) - 45
                t = np.radians(rot)
                u = (xs - cx) * np.cos(t) + (ys - cy) * np.sin(t)
                vv = -(xs - cx) * np.sin(t) + (ys - cy) * np.cos(t)
                hs.append({
                    'cx': float(pos[n][0] + cx), 'cy': float(pos[n][1] + cy),
                    'w': float(np.percentile(u, 99.5) - np.percentile(u, 0.5)),
                    'h': float(np.percentile(vv, 99.5) - np.percentile(vv, 0.5)),
                    'rot': float(rot), 'area': len(pts),
                })
    return sorted(hs, key=lambda d: (d['cy'], d['cx']))


layout['polaroidWindows'] = holes('p07')
layout['cameraWindow'] = holes('p22')

# Pink inner area of the heart frame (inside p14): largest pink block in the lower part
a14 = imgs['p14']
r, g, b, mx, mn = rgbv(a14)
pink = (r > 225) & (g > 150) & (g < 205) & (b > 160) & (b < 215) & (a14[:, :, 3] > 200)
pink[:500] = False
ys, xs = np.nonzero(largest_components(pink, 3000))
layout['heartFrameWindow'] = [int(pos['p14'][0] + xs.min()), int(pos['p14'][1] + ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)]

# ---------- 4. save every piece as WebP + its placement ----------
for n in names:
    x0, y0 = pos[n]
    arr = imgs[n]
    al = arr[:, :, 3] > 8
    ys, xs = np.nonzero(al)
    ty0, ty1, tx0, tx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    Image.fromarray(arr[ty0:ty1, tx0:tx1]).save(f'{out}/{n}.webp', quality=90, method=6)
    layout[n] = [int(x0 + tx0), int(y0 + ty0), int(tx1 - tx0), int(ty1 - ty0)]

json.dump(layout, open(f'{out}/layout.json', 'w'), indent=1)
print(json.dumps({k: v for k, v in layout.items() if not k.startswith('p')}, indent=1))
