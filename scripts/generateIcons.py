"""Generate Maestros del Sudoku app icons (grid + master star)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]


def gold_color(t: float) -> tuple[int, int, int]:
    # Soft gold gradient helper
    c0 = (253, 230, 138)
    c1 = (245, 158, 11)
    c2 = (180, 83, 9)
    if t < 0.5:
        u = t * 2
        return tuple(int(c0[i] + (c1[i] - c0[i]) * u) for i in range(3))  # type: ignore
    u = (t - 0.5) * 2
    return tuple(int(c1[i] + (c2[i] - c1[i]) * u) for i in range(3))  # type: ignore


def draw_star(draw: ImageDraw.ImageDraw, cx: float, cy: float, r: float, fill, outline) -> None:
    # 5-point star
    import math

    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rad = r if i % 2 == 0 else r * 0.42
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    draw.polygon(pts, fill=fill, outline=outline)


def make_icon(size: int, *, rounded: bool = True, pad_ratio: float = 0.12) -> Image.Image:
    img = Image.new("RGBA", (size, size), (2, 6, 23, 255))
    draw = ImageDraw.Draw(img)

    # Background gradient (vertical)
    for y in range(size):
        t = y / max(size - 1, 1)
        r = int(15 + (2 - 15) * t)
        g = int(23 + (6 - 23) * t)
        b = int(42 + (23 - 42) * t)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    if rounded:
        # Soft rounded mask look via overlay corners
        mask = Image.new("L", (size, size), 0)
        mdraw = ImageDraw.Draw(mask)
        radius = int(size * 0.22)
        mdraw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
        bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        bg.paste(img, (0, 0))
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        img.paste(bg, (0, 0), mask)

    draw = ImageDraw.Draw(img)
    pad = size * pad_ratio
    left = pad
    top = pad
    right = size - pad
    bottom = size - pad
    grid_r = int(size * 0.06)

    # Grid panel
    panel = (left, top, right, bottom)
    draw.rounded_rectangle(panel, radius=grid_r, fill=(17, 24, 39, 255), outline=gold_color(0.45), width=max(2, size // 36))

    # 3x3 lines
    w = right - left
    h = bottom - top
    line_w = max(1, size // 80)
    for i in (1, 2):
        x = left + w * i / 3
        y = top + h * i / 3
        draw.line([(x, top), (x, bottom)], fill=(245, 158, 11, 160), width=line_w)
        draw.line([(left, y), (right, y)], fill=(245, 158, 11, 160), width=line_w)

    # Center star
    cx = (left + right) / 2
    cy = (top + bottom) / 2
    star_r = w / 3 * 0.38
    draw_star(draw, cx, cy, star_r, fill=gold_color(0.35), outline=(146, 64, 14, 255))

    return img


def make_adaptive_foreground(size: int) -> Image.Image:
    """Foreground for Android adaptive icon (transparent outside content)."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Safe zone ~66% center
    pad = size * 0.18
    left, top, right, bottom = pad, pad, size - pad, size - pad
    draw.rounded_rectangle(
        (left, top, right, bottom),
        radius=int(size * 0.08),
        fill=(17, 24, 39, 255),
        outline=gold_color(0.4),
        width=max(2, size // 42),
    )
    w = right - left
    h = bottom - top
    line_w = max(1, size // 90)
    for i in (1, 2):
        x = left + w * i / 3
        y = top + h * i / 3
        draw.line([(x, top), (x, bottom)], fill=(245, 158, 11, 180), width=line_w)
        draw.line([(left, y), (right, y)], fill=(245, 158, 11, 180), width=line_w)

    cx = (left + right) / 2
    cy = (top + bottom) / 2
    draw_star(draw, cx, cy, w / 3 * 0.36, fill=gold_color(0.35), outline=(146, 64, 14, 255))
    return img


def make_adaptive_background(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (15, 23, 42, 255))
    draw = ImageDraw.Draw(img)
    for y in range(size):
        t = y / max(size - 1, 1)
        r = int(15 + (2 - 15) * t)
        g = int(23 + (6 - 23) * t)
        b = int(42 + (23 - 42) * t)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    return img


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG")
    print(f"wrote {path.relative_to(ROOT)} ({img.size[0]}x{img.size[1]})")


def main() -> None:
    # Source assets + PWA
    save(make_icon(1024, rounded=True), ROOT / "assets" / "icon.png")
    save(make_icon(1024, rounded=False, pad_ratio=0.14), ROOT / "assets" / "icon-only.png")
    save(make_icon(1024, rounded=True), ROOT / "public" / "images" / "icon.png")
    save(make_icon(512, rounded=True), ROOT / "public" / "images" / "logo.png")

    # Android mipmaps
    densities = {
        "ldpi": 36,
        "mdpi": 48,
        "hdpi": 72,
        "xhdpi": 96,
        "xxhdpi": 144,
        "xxxhdpi": 192,
    }
    fg_sizes = {
        "ldpi": 81,
        "mdpi": 108,
        "hdpi": 162,
        "xhdpi": 216,
        "xxhdpi": 324,
        "xxxhdpi": 432,
    }

    for density, size in densities.items():
        base = ROOT / "android" / "app" / "src" / "main" / "res" / f"mipmap-{density}"
        icon = make_icon(size, rounded=True, pad_ratio=0.14)
        save(icon, base / "ic_launcher.png")
        save(icon, base / "ic_launcher_round.png")
        save(make_adaptive_foreground(fg_sizes[density]), base / "ic_launcher_foreground.png")
        save(make_adaptive_background(fg_sizes[density]), base / "ic_launcher_background.png")

    # Splash-ish drawable fallback (keep dark)
    splash = make_icon(512, rounded=False, pad_ratio=0.22)
    save(splash, ROOT / "android" / "app" / "src" / "main" / "res" / "drawable" / "splash.png")


if __name__ == "__main__":
    main()
