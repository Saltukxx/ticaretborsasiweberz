"""Prepare transparent, trimmed header certification logos."""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public/header/_official"
OUT = ROOT / "public/header"

JOBS = [
    ("tobblogo.png", "tobb.png", "flood"),
    ("akredite.png", "tobb-akredite.png", "none"),
    ("iso-9000.png", "iso-9000.png", "none"),
    ("iqnet-seeklogo.png", "iqnet.png", "key"),
]

THRESHOLD = 48


def is_bg(r: int, g: int, b: int, a: int) -> bool:
    return a > 0 and r <= THRESHOLD and g <= THRESHOLD and b <= THRESHOLD


def flood_transparent(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    visited = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            if is_bg(*px[x, y]):
                q.append((x, y))
                visited[y][x] = True
    for y in range(h):
        for x in (0, w - 1):
            if not visited[y][x] and is_bg(*px[x, y]):
                q.append((x, y))
                visited[y][x] = True

    while q:
        x, y = q.popleft()
        r, g, b, _a = px[x, y]
        px[x, y] = (r, g, b, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx] and is_bg(*px[nx, ny]):
                visited[ny][nx] = True
                q.append((nx, ny))

    return rgba


def key_black(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a and r <= THRESHOLD and g <= THRESHOLD and b <= THRESHOLD:
                px[x, y] = (r, g, b, 0)
    return rgba


def trim(img: Image.Image, pad: int = 4) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(img.width - 1, x1 + pad)
    y1 = min(img.height - 1, y1 + pad)
    return img.crop((x0, y0, x1 + 1, y1 + 1))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for src_name, out_name, mode in JOBS:
        src = SRC / src_name
        if not src.exists():
            raise FileNotFoundError(src)
        img = Image.open(src)
        if mode == "flood":
            img = flood_transparent(img)
        elif mode == "key":
            img = key_black(img)
        else:
            img = img.convert("RGBA")
        img = trim(img)
        dest = OUT / out_name
        img.save(dest, optimize=True)
        print(f"{dest.relative_to(ROOT)}  {img.size[0]}x{img.size[1]}")


if __name__ == "__main__":
    main()
