"""Derive every app icon from IMAGENES/logosudoku.png.

Stdlib only: the previous version drew the old grid-and-star mark with Pillow,
which is not installed on every machine that builds this app. Everything here
decodes, resamples and writes PNG by hand so `python3 scripts/generateIcons.py`
works anywhere.

The source logo is a full-bleed rounded square with black outside the frame,
with a corner radius of about 22% of the side.

iOS masks icons with a squircle of almost exactly that radius, so the black
corners fall outside the mask and are never seen: the Apple and store icons use
the artwork untouched, which is also what Apple wants (square, no alpha).

Android is different. The adaptive foreground is inset inside the mask and the
legacy icon is drawn as-is, so those black corners would read as black wedges.
For Android only, the surround is flooded with the frame blue.
"""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "IMAGENES" / "logosudoku.png"

# Anything this dark next to the border is the black surround, not artwork.
BLACK_SUM = 60


class Bitmap:
    """8-bit RGB image held as a flat bytearray."""

    __slots__ = ("w", "h", "px")

    def __init__(self, w: int, h: int, px: bytearray) -> None:
        self.w, self.h, self.px = w, h, px

    def at(self, x: int, y: int) -> tuple[int, int, int]:
        i = (y * self.w + x) * 3
        return self.px[i], self.px[i + 1], self.px[i + 2]


def _paeth(a: int, b: int, c: int) -> int:
    p = a + b - c
    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    return b if pb <= pc else c


def read_png(path: Path) -> Bitmap:
    """Minimal decoder: 8-bit RGB or RGBA, non-interlaced. Alpha is dropped."""
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"{path} is not a PNG")

    pos, idat, w = 8, bytearray(), 0
    h = channels = 0
    while pos < len(data):
        (length,) = struct.unpack(">I", data[pos : pos + 4])
        kind = data[pos + 4 : pos + 8]
        body = data[pos + 8 : pos + 8 + length]
        if kind == b"IHDR":
            w, h, depth, colour, _, _, interlace = struct.unpack(">IIBBBBB", body)
            if depth != 8 or interlace or colour not in (2, 6):
                raise ValueError(f"{path}: only 8-bit RGB/RGBA without interlacing")
            channels = 3 if colour == 2 else 4
        elif kind == b"IDAT":
            idat += body
        elif kind == b"IEND":
            break
        pos += 12 + length

    raw = zlib.decompress(bytes(idat))
    stride = w * channels
    out = bytearray(w * h * 3)
    prev = bytearray(stride)
    src = 0
    for y in range(h):
        filt = raw[src]
        line = bytearray(raw[src + 1 : src + 1 + stride])
        src += 1 + stride
        if filt == 1:
            for i in range(channels, stride):
                line[i] = (line[i] + line[i - channels]) & 0xFF
        elif filt == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 0xFF
        elif filt == 3:
            for i in range(stride):
                left = line[i - channels] if i >= channels else 0
                line[i] = (line[i] + ((left + prev[i]) >> 1)) & 0xFF
        elif filt == 4:
            for i in range(stride):
                left = line[i - channels] if i >= channels else 0
                upleft = prev[i - channels] if i >= channels else 0
                line[i] = (line[i] + _paeth(left, prev[i], upleft)) & 0xFF
        elif filt != 0:
            raise ValueError(f"{path}: unknown filter {filt}")
        prev = line

        dst = y * w * 3
        for x in range(w):
            s = x * channels
            out[dst : dst + 3] = line[s : s + 3]
            dst += 3
    return Bitmap(w, h, out)


def write_png(path: Path, w: int, h: int, px: bytes, *, alpha: bool) -> None:
    channels = 4 if alpha else 3
    stride = w * channels
    raw = bytearray()
    for y in range(h):
        raw.append(0)  # filter: none
        raw += px[y * stride : (y + 1) * stride]

    def chunk(kind: bytes, body: bytes) -> bytes:
        return (
            struct.pack(">I", len(body))
            + kind
            + body
            + struct.pack(">I", zlib.crc32(kind + body) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6 if alpha else 2, 0, 0, 0)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )


def fill_surround(src: Bitmap, colour: tuple[int, int, int]) -> Bitmap:
    """Flood the black area outside the rounded frame, starting from the corners.

    Exact whatever the corner radius is, and it cannot touch dark pixels inside
    the artwork because those are not connected to the border.
    """
    out = Bitmap(src.w, src.h, bytearray(src.px))
    seen = bytearray(src.w * src.h)
    stack = [
        (0, 0),
        (src.w - 1, 0),
        (0, src.h - 1),
        (src.w - 1, src.h - 1),
    ]
    filled = 0
    while stack:
        x, y = stack.pop()
        if not (0 <= x < src.w and 0 <= y < src.h):
            continue
        k = y * src.w + x
        if seen[k]:
            continue
        i = k * 3
        if out.px[i] + out.px[i + 1] + out.px[i + 2] >= BLACK_SUM:
            continue
        seen[k] = 1
        out.px[i], out.px[i + 1], out.px[i + 2] = colour
        filled += 1
        stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    print(f"surround flooded: {filled} px ({filled / (src.w * src.h):.1%} of the logo)")
    return out


def resample(src: Bitmap, size: int) -> Bitmap:
    """Box-filter the whole image down to size×size."""
    side = src.w
    left = top = 0
    out = bytearray(size * size * 3)
    step = side / size
    for oy in range(size):
        y0 = int(top + oy * step)
        y1 = max(y0 + 1, int(top + (oy + 1) * step))
        for ox in range(size):
            x0 = int(left + ox * step)
            x1 = max(x0 + 1, int(left + (ox + 1) * step))
            r = g = b = n = 0
            for y in range(y0, min(y1, src.h)):
                row = y * src.w
                for x in range(x0, min(x1, src.w)):
                    i = (row + x) * 3
                    r += src.px[i]
                    g += src.px[i + 1]
                    b += src.px[i + 2]
                    n += 1
            i = (oy * size + ox) * 3
            out[i] = r // n
            out[i + 1] = g // n
            out[i + 2] = b // n
    return Bitmap(size, size, out)


def to_rgba(img: Bitmap) -> bytes:
    out = bytearray(img.w * img.h * 4)
    for i in range(img.w * img.h):
        out[i * 4 : i * 4 + 3] = img.px[i * 3 : i * 3 + 3]
        out[i * 4 + 3] = 255
    return bytes(out)


def solid(size: int, colour: tuple[int, int, int]) -> bytes:
    return bytes(colour) * (size * size)


ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"
LAUNCHER = {"ldpi": 36, "mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
ADAPTIVE = {"ldpi": 81, "mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}


def main() -> None:
    source = read_png(SOURCE)
    print(f"source {SOURCE.relative_to(ROOT)} {source.w}x{source.h}")

    # The frame colour, sampled just inside the left edge at mid height, fills the
    # adaptive background so the mark sits on its own blue rather than on nothing.
    frame = source.at(int(source.w * 0.03), source.h // 2)
    print(f"frame colour sampled: #{frame[0]:02x}{frame[1]:02x}{frame[2]:02x}")

    tiled = fill_surround(source, frame)
    cache: dict[tuple[int, bool], Bitmap] = {}

    def art(size: int, *, android: bool) -> Bitmap:
        key = (size, android)
        if key not in cache:
            cache[key] = resample(tiled if android else source, size)
        return cache[key]

    def emit(path: Path, size: int, *, alpha: bool, android: bool = False) -> None:
        img = art(size, android=android)
        write_png(path, size, size, to_rgba(img) if alpha else bytes(img.px), alpha=alpha)
        print(f"  {path.relative_to(ROOT)} {size}x{size}")

    # App Store and Play listing icons. Apple rejects an alpha channel.
    emit(ROOT / "store" / "appstore-icon-1024.png", 1024, alpha=False)
    emit(ROOT / "store" / "play-icon-512.png", 512, alpha=False)

    # iOS app icon.
    emit(
        ROOT / "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
        1024,
        alpha=False,
    )

    # Capacitor asset sources and the PWA.
    emit(ROOT / "assets" / "icon.png", 1024, alpha=False)
    emit(ROOT / "assets" / "icon-only.png", 1024, alpha=False)
    emit(ROOT / "public" / "images" / "icon.png", 1024, alpha=False)
    emit(ROOT / "public" / "images" / "logo.png", 512, alpha=False)

    # Android launcher icons.
    for density, size in LAUNCHER.items():
        base = ANDROID_RES / f"mipmap-{density}"
        emit(base / "ic_launcher.png", size, alpha=True, android=True)
        emit(base / "ic_launcher_round.png", size, alpha=True, android=True)

    # Adaptive icon. ic_launcher.xml insets the foreground by 16.7%, which lands the
    # full mark inside the 66% safe zone; the background stays full bleed.
    for density, size in ADAPTIVE.items():
        base = ANDROID_RES / f"mipmap-{density}"
        emit(base / "ic_launcher_foreground.png", size, alpha=True, android=True)
        write_png(base / "ic_launcher_background.png", size, size, solid(size, frame), alpha=False)
        print(f"  {(base / 'ic_launcher_background.png').relative_to(ROOT)} {size}x{size} solid")

    verify(art(512, android=True), art(1024, android=False))


def verify(android: Bitmap, apple: Bitmap) -> None:
    """Android must have no black wedges; Apple keeps the artwork untouched."""

    def corners(img: Bitmap) -> dict[str, tuple[int, int, int]]:
        i = 3
        return {
            "top-left": img.at(i, i),
            "top-right": img.at(img.w - 1 - i, i),
            "bottom-left": img.at(i, img.h - 1 - i),
            "bottom-right": img.at(img.w - 1 - i, img.h - 1 - i),
        }

    bad = {k: v for k, v in corners(android).items() if sum(v) < BLACK_SUM}
    for name, rgb in corners(android).items():
        print(f"android corner {name}: #{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}")
    if bad:
        raise SystemExit(f"black wedges left on the Android tile: {sorted(bad)}")
    print("android tile has no black corners")
    print("apple icon left untouched; its corners fall outside the iOS mask")


if __name__ == "__main__":
    main()
