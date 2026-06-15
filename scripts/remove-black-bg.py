"""Remove solid black/near-black backgrounds from header logo PNGs."""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    ROOT / "public/header/tobb.png",
    ROOT / "public/header/tobb-akredite.png",
    ROOT / "public/header/iso-9000.png",
    ROOT / "public/header/iqnet.png",
]

THRESHOLD = 42


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
        r, g, b, a = px[x, y]
        px[x, y] = (r, g, b, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx] and is_bg(*px[nx, ny]):
                visited[ny][nx] = True
                q.append((nx, ny))

    return rgba


def main() -> None:
    for path in TARGETS:
        if not path.exists():
            print(f"skip missing: {path}")
            continue
        out = flood_transparent(Image.open(path))
        out.save(path, optimize=True)
        print(f"updated: {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
