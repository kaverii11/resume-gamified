"""Cut the raw AI-generated sprite sheets in assets/ into clean, transparent,
trimmed sprites in assets/sprites/.

The raw sheets have baked-in backgrounds (white, navy, or a navy grid), so we
flood-fill the background in from each cell's border, keep the main connected
blob (drops baked-in caption text), and trim to the content bounding box.

Run from the project root:  python3 tools/prep_sprites.py
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets"
OUT = SRC / "sprites"


def border_colors(cell, inset):
    """Representative background colours sampled along the cell border."""
    h, w, _ = cell.shape
    b = np.concatenate([
        cell[inset, inset:w - inset], cell[h - 1 - inset, inset:w - inset],
        cell[inset:h - inset, inset], cell[inset:h - inset, w - 1 - inset],
    ]).astype(int)
    # Quantise and keep the colours that make up most of the border.
    q = (b // 12) * 12 + 6
    uniq, counts = np.unique(q, axis=0, return_counts=True)
    order = np.argsort(-counts)
    keep, total = [], 0
    for i in order:
        keep.append(uniq[i])
        total += counts[i]
        if total > 0.97 * len(b):
            break
    return np.array(keep)


def cut(cell, tol=34, inset=3, keep_main=True, min_frac=0.12, white=False, holes=False, bluish=False):
    """Return an RGBA crop of `cell` (HxWx3 uint8) with its background removed.

    white=True treats near-white as the background (sheets whose art touches the
    cell edge, where sampling the border would also pick up the art itself).
    holes=True also clears enclosed near-white pockets (e.g. gaps in tree canopies).
    bluish=True only lets blue-tinted pixels count as background (the navy/grid
    character sheets), so near-black suits and trousers survive.
    """
    cell = cell[inset:-inset, inset:-inset]
    h, w, _ = cell.shape
    px = cell.astype(int)
    if white:
        bg_like = px.min(axis=2) > 236
    else:
        bg = border_colors(cell, 0)
        if bluish:
            bg = bg[bg.max(axis=1) >= 20]  # drop black cell separators
        dist = np.min(np.linalg.norm(px[:, :, None, :] - bg[None, None, :, :], axis=3), axis=2)
        bg_like = dist < tol
        if bluish:
            r, g, b = px[:, :, 0], px[:, :, 1], px[:, :, 2]
            bg_like &= (b - np.maximum(r, g) >= 10) & (b - r >= 20)
    # Only background that is connected to the border counts (flood fill).
    labels, _ = ndimage.label(bg_like)
    edge = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]])))
    edge.discard(0)
    is_bg = np.isin(labels, list(edge))
    if holes:
        is_bg |= px.min(axis=2) > 240
    fg = ~is_bg
    # Remove speckle left in the background.
    fg = ndimage.binary_opening(fg, iterations=1)

    if keep_main:
        lab, n = ndimage.label(fg, structure=np.ones((3, 3)))
        if n:
            sizes = ndimage.sum(fg, lab, range(1, n + 1))
            main = int(np.argmax(sizes)) + 1
            ys, xs = np.where(lab == main)
            y0, y1, x0, x1 = ys.min() - 8, ys.max() + 8, xs.min() - 8, xs.max() + 8
            keep = np.zeros_like(fg)
            for i, s in enumerate(sizes, start=1):
                cy, cx = np.where(lab == i)
                inside = cy.min() >= y0 and cy.max() <= y1 and cx.min() >= x0 and cx.max() <= x1
                if i == main or s >= min_frac * sizes.max() or (inside and s > 6):
                    keep |= lab == i
            fg = keep

    rgba = np.dstack([cell, (fg * 255).astype(np.uint8)])
    ys, xs = np.where(fg)
    return Image.fromarray(rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1], "RGBA")


def cut_grid(im, y0, y1, x0, x1, pad=3, fringe=False):
    """Cut one sprite from the grid-paper city_day sheet.

    fringe=True also peels off light-grey pixels along the outline (the white
    halo around the tree trunk); buildings keep theirs, e.g. the white fence.
    """
    h, w, _ = im.shape
    y0, x0 = max(y0 - pad, 0), max(x0 - pad, 0)
    y1, x1 = min(y1 + pad, h), min(x1 + pad, w)
    cell = im[y0:y1, x0:x1]
    px = cell.astype(int)
    bg_like = (px.max(axis=2) - px.min(axis=2) < 16) & (px.min(axis=2) > 200)
    labels, _ = ndimage.label(bg_like)
    edge = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    fg = ndimage.binary_opening(~np.isin(labels, list(edge)), iterations=1)
    lab, n = ndimage.label(fg, structure=np.ones((3, 3)))
    sizes = ndimage.sum(fg, lab, range(1, n + 1))
    fg = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 40])  # drop grid specks
    if fringe:
        light = (px.max(axis=2) - px.min(axis=2) < 30) & (px.min(axis=2) > 170)
        for _ in range(3):
            fg &= ~(light & ndimage.binary_dilation(~fg))
    rgba = np.dstack([cell, (fg * 255).astype(np.uint8)])
    ys, xs = np.where(fg)
    return Image.fromarray(rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1], "RGBA")


def make_bushes():
    """Bushes in the city_day style: the tree's canopy, squashed into a low
    dome, plus berry / blossom variants dotted on top."""
    tree = np.array(Image.open(OUT / "tree_city.png"))
    canopy = tree[:64].copy()
    r, g, b, a = (canopy[:, :, i].astype(int) for i in range(4))
    canopy[:, :, 3] = np.where((r > g) & (a > 0), 0, a)  # drop the bit of trunk
    base = Image.fromarray(canopy, "RGBA").resize((46, 30), Image.LANCZOS)
    arr = np.array(base)
    arr[:, :, 3] = np.where(arr[:, :, 3] > 110, 255, 0)
    save(Image.fromarray(arr, "RGBA"), "bush")

    rng = np.random.default_rng(3)
    for name, dot, hi in (("bush_berry", (210, 92, 110), (246, 170, 178)),
                          ("bush_flower", (244, 182, 200), (253, 232, 238))):
        dotted = arr.copy()
        placed = 0
        while placed < 9:
            y, x = int(rng.integers(5, 25)), int(rng.integers(5, 41))
            if dotted[y - 2:y + 3, x - 2:x + 3, 3].min() == 0:
                continue  # keep dots off the outline
            dotted[y:y + 2, x:x + 2, :3] = dot
            dotted[y, x, :3] = hi
            placed += 1
        save(Image.fromarray(dotted, "RGBA"), name)


def make_flowers():
    """Pastel flower clumps in the same soft style as the bushes: a small leafy
    tuft (the bush, shrunk) with little blossoms on top."""
    bush = Image.open(OUT / "bush.png").resize((22, 11), Image.LANCZOS)
    tuft = np.array(bush)
    tuft[:, :, 3] = np.where(tuft[:, :, 3] > 110, 255, 0)
    palettes = {  # petal, petal highlight, petal shade, centre
        "flower_pink": ((244, 182, 200), (253, 226, 234), (214, 140, 166), (243, 210, 122)),
        "flower_lilac": ((201, 182, 236), (236, 226, 251), (160, 140, 204), (243, 210, 122)),
        "flower_peach": ((248, 200, 160), (253, 230, 208), (222, 160, 120), (236, 150, 110)),
        "flower_cream": ((250, 244, 228), (255, 255, 255), (214, 204, 182), (240, 196, 90)),
    }
    spots = [(4, 6), (9, 4), (14, 6), (18, 4), (7, 9), (12, 9), (17, 9)]
    for name, (petal, hi, shade, centre) in palettes.items():
        img = np.zeros((15, 24, 4), np.uint8)
        img[4:, 1:23] = tuft
        for x, y in spots:
            img[y, x - 1:x + 2] = (*petal, 255)
            img[y - 1:y + 2, x] = (*petal, 255)
            img[y - 1, x - 1] = img[y - 1, x + 1] = (*hi, 255)
            img[y + 1, x + 1] = img[y + 1, x - 1] = (*shade, 255)
            img[y, x] = (*centre, 255)
        save(Image.fromarray(img, "RGBA"), name)


def grid(path, cols, rows):
    im = np.array(Image.open(path).convert("RGB"))
    h, w, _ = im.shape
    cw, ch = w // cols, h // rows
    return {(r, c): im[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw] for r in range(rows) for c in range(cols)}


def save(img, name):
    img.save(OUT / f"{name}.png")
    print(f"  {name:28s} {img.size}")


def main():
    OUT.mkdir(exist_ok=True)

    # Characters: 4x4 sheets, one character per row, poses per column.
    chars = ["player", "recruiter", "friend", "elder"]
    for sex in ("male", "female"):
        cells = grid(SRC / f"character_sprites_{sex}.png", 4, 4)
        for (r, c), cell in cells.items():
            # Denim/hoodie blues sit close to the navy background, so the
            # "friend" row needs a tighter tolerance.
            tol = 18 if chars[r] == "friend" else 45
            save(cut(cell, tol=tol, inset=4, bluish=True), f"char_{sex}_{chars[r]}_{c}")

    # Portraits: 4x2, crop away the caption under each framed portrait.
    cells = grid(SRC / "character_portraits.png", 4, 2)
    sexes = ["male", "female"]
    for (r, c), cell in cells.items():
        save(cut(cell[:245], tol=30, inset=2), f"portrait_{sexes[r]}_{chars[c]}")

    # Matching-style town set (city_day.png): one sprite per bounding box, with
    # the light-grey grid background flood-filled in from each box's edge.
    im = np.array(Image.open(SRC / "city_day.png").convert("RGB"))
    boxes = {
        "bld_university": (1, 206, 0, 130), "bld_office": (7, 206, 140, 250),
        "bld_cottage": (52, 207, 254, 386), "bld_lab": (25, 207, 386, 509),
        "bld_postoffice": (89, 207, 517, 635), "bld_cafe": (325, 507, 4, 155),
        "bld_hall": (236, 507, 172, 308), "bld_library": (338, 507, 322, 459),
"tree_city": (523, 629, 270, 370),
        "bench": (563, 613, 409, 488),
    }
    for name, (y0, y1, x0, x1) in boxes.items():
        save(cut_grid(im, y0, y1, x0, x1, fringe=not name.startswith("bld_")), name)

    make_bushes()
    make_flowers()

    # Fountain plaza: trim the white margin.
    im = np.array(Image.open(SRC / "fountain_plaza.png").convert("RGB"))
    plaza = im[22:618, 22:618]
    # Clear the white showing through the gaps in the plaza wall.
    white = plaza.min(axis=2) > 236
    labels, _ = ndimage.label(white)
    edge = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    alpha = np.where(np.isin(labels, list(edge)), 0, 255).astype(np.uint8)
    save(Image.fromarray(np.dstack([plaza, alpha]), "RGBA"), "plaza")


if __name__ == "__main__":
    main()
