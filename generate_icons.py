#!/usr/bin/env python3
"""
مولّد أيقونات PWA — بوابتي GSM Gate Opener
ينشئ ملفات PNG بأحجام مختلفة باستخدام مكتبات Python المدمجة فقط.
يرسم شعار البوابة (قفل + درع) بتدرج أخضر على خلفية داكنة.
"""

import struct
import zlib
import os
import math

# ─────────────────────────────────────────────
#  مساعدات PNG
# ─────────────────────────────────────────────

def _chunk(chunk_type: bytes, data: bytes) -> bytes:
    """بناء قطعة PNG واحدة"""
    c = chunk_type + data
    return (
        struct.pack(">I", len(data))
        + c
        + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
    )


def write_png(filename: str, pixels: list, width: int, height: int):
    """حفظ مصفوفة بكسل RGBA كملف PNG صحيح"""
    raw_rows = []
    for y in range(height):
        row = b"\x00"  # فلتر None لكل صف
        for x in range(width):
            r, g, b, a = pixels[y][x]
            row += bytes([r, g, b, a])
        raw_rows.append(row)

    compressed = zlib.compress(b"".join(raw_rows), 9)

    png = b"\x89PNG\r\n\x1a\n"
    png += _chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
                  .replace(struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0),
                           struct.pack(">II", width, height) + bytes([8, 6, 0, 0, 0])))
    png += _chunk(b"IDAT", compressed)
    png += _chunk(b"IEND", b"")
    with open(filename, "wb") as f:
        f.write(png)


# ─────────────────────────────────────────────
#  مساعدات رسم
# ─────────────────────────────────────────────

def lerp(a, b, t):
    return a + (b - a) * t


def blend(src, dst):
    """دمج لون RGBA فوق خلفية"""
    sr, sg, sb, sa = src
    dr, dg, db, da = dst
    a = sa / 255.0
    return (
        int(sr * a + dr * (1 - a)),
        int(sg * a + dg * (1 - a)),
        int(sb * a + db * (1 - a)),
        255,
    )


def dist(x1, y1, x2, y2):
    return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)


def fill_pixel(pixels, x, y, color, w, h):
    if 0 <= x < w and 0 <= y < h:
        pixels[y][x] = blend(color, pixels[y][x])


def fill_rect(pixels, x0, y0, x1, y1, color, w, h):
    for y in range(int(y0), int(y1) + 1):
        for x in range(int(x0), int(x1) + 1):
            fill_pixel(pixels, x, y, color, w, h)


def fill_circle(pixels, cx, cy, r, color, w, h, aa=True):
    """رسم دائرة مضادة للتشرذم"""
    for y in range(int(cy - r) - 1, int(cy + r) + 2):
        for x in range(int(cx - r) - 1, int(cx + r) + 2):
            d = dist(x, y, cx, cy)
            if aa:
                alpha = max(0, min(1, (r - d + 0.5)))
                if alpha > 0:
                    r2, g2, b2, a2 = color
                    fill_pixel(pixels, x, y, (r2, g2, b2, int(a2 * alpha)), w, h)
            else:
                if d <= r:
                    fill_pixel(pixels, x, y, color, w, h)


def fill_rounded_rect(pixels, x0, y0, x1, y1, radius, color, w, h):
    """مستطيل بزوايا منحنية"""
    r, g, b, a = color
    for py in range(int(y0), int(y1) + 1):
        for px in range(int(x0), int(x1) + 1):
            dx = max(x0 + radius - px, 0, px - (x1 - radius))
            dy = max(y0 + radius - py, 0, py - (y1 - radius))
            d2 = math.sqrt(dx * dx + dy * dy)
            alpha = max(0, min(1, radius - d2 + 0.5))
            if alpha > 0:
                fill_pixel(pixels, px, py, (r, g, b, int(a * alpha)), w, h)


def gradient_pixel(x, y, w, h, c1, c2):
    """تدرج لوني قطري"""
    t = (x / w + y / h) / 2
    return (
        int(lerp(c1[0], c2[0], t)),
        int(lerp(c1[1], c2[1], t)),
        int(lerp(c1[2], c2[2], t)),
        255,
    )


# ─────────────────────────────────────────────
#  رسم أيقونة البوابة
# ─────────────────────────────────────────────

def draw_icon(size: int) -> list:
    """
    يرسم أيقونة بوابتي بحجم (size × size) بكسل.
    التصميم: خلفية داكنة + قفل أبيض مضيء + تدرج أخضر.
    """
    s = size
    # تهيئة المصفوفة بخلفية سوداء شفافة
    pixels = [[(0, 0, 0, 0)] * s for _ in range(s)]

    # ── خلفية المربع المستدير ──────────────────
    # لون خلفية التدرج: أخضر غامق → أخضر فاتح
    c1 = (5, 90, 60)    # أخضر داكن
    c2 = (16, 185, 129) # أخضر فاتح (accent)
    pad = s * 0.04
    r_corner = s * 0.22  # نصف قطر زاوية أيقونة iOS

    # رسم التدرج داخل المستطيل المستدير
    for py in range(s):
        for px in range(s):
            # حساب المسافة من الزوايا المنحنية
            dx = max(pad + r_corner - px, 0, px - (s - pad - r_corner))
            dy = max(pad + r_corner - py, 0, py - (s - pad - r_corner))
            d = math.sqrt(dx * dx + dy * dy)
            alpha = max(0, min(1, r_corner - d + 0.5))
            if alpha > 0:
                t = (px / s + py / s) / 2
                rc = int(lerp(c1[0], c2[0], t))
                gc = int(lerp(c1[1], c2[1], t))
                bc = int(lerp(c1[2], c2[2], t))
                pixels[py][px] = blend((rc, gc, bc, int(255 * alpha)), pixels[py][px])

    # ── ظل داخلي خفيف (vignette) ──────────────
    cx, cy = s / 2, s / 2
    for py in range(s):
        for px in range(s):
            if pixels[py][px][3] == 0:
                continue
            d = dist(px, py, cx, cy) / (s * 0.5)
            shadow = int(40 * min(d, 1))
            r2, g2, b2, a2 = pixels[py][px]
            pixels[py][px] = (
                max(0, r2 - shadow),
                max(0, g2 - shadow),
                max(0, b2 - shadow),
                a2,
            )

    # ── رسم القفل ──────────────────────────────
    # نسب موحدة مهما كان الحجم
    W = s * 0.55   # عرض جسم القفل
    H = s * 0.42   # ارتفاع جسم القفل
    lx = (s - W) / 2          # x يسار الجسم
    ly = s * 0.50              # y أعلى الجسم
    rx = lx + W               # x يمين الجسم
    ry = ly + H               # y أسفل الجسم
    lock_r = W * 0.13          # نصف قطر زوايا الجسم
    lock_color = (255, 255, 255, 230)

    # جسم القفل (مستطيل مستدير)
    fill_rounded_rect(pixels, lx, ly, rx, ry, lock_r, lock_color, s, s)

    # قوس القفل (نصف دائرة)
    arc_cx   = s / 2
    arc_cy   = ly - 0.01 * s
    arc_r_out = W * 0.29       # نصف قطر خارجي
    arc_r_in  = W * 0.16       # نصف قطر داخلي (الفراغ)
    arc_thick = arc_r_out - arc_r_in

    for py in range(int(arc_cy - arc_r_out) - 2, int(arc_cy) + 2):
        for px in range(int(arc_cx - arc_r_out) - 2, int(arc_cx + arc_r_out) + 2):
            if py > arc_cy + 2:
                continue
            d = dist(px, py, arc_cx, arc_cy)
            # منطقة الحلقة
            in_ring = (arc_r_in - 0.5) <= d <= (arc_r_out + 0.5)
            if in_ring:
                # aa للحافتين
                outer_a = max(0, min(1, arc_r_out - d + 0.5))
                inner_a = max(0, min(1, d - arc_r_in + 0.5))
                alpha = min(outer_a, inner_a)
                fill_pixel(pixels, px, py,
                           (255, 255, 255, int(230 * alpha)), s, s)

    # ثقب القفل (دائرة داكنة)
    hole_cx = s / 2
    hole_cy = ly + H * 0.42
    hole_r  = W * 0.095
    hole_color = (20, 90, 55, 255)
    fill_circle(pixels, hole_cx, hole_cy, hole_r, hole_color, s, s)

    # خط صغير أسفل الثقب
    line_x  = s / 2
    line_y0 = hole_cy + hole_r * 0.8
    line_y1 = hole_cy + hole_r * 2.2
    line_w  = max(2, int(s * 0.025))
    fill_rounded_rect(pixels,
                      line_x - line_w, line_y0,
                      line_x + line_w, line_y1,
                      line_w, hole_color, s, s)

    return pixels


# ─────────────────────────────────────────────
#  توليد جميع الأحجام
# ─────────────────────────────────────────────

SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

def main():
    out_dir = os.path.join(os.path.dirname(__file__), "icons")
    os.makedirs(out_dir, exist_ok=True)
    print(f"📁  مجلد الإخراج: {out_dir}")

    for sz in SIZES:
        print(f"  ⚙️  رسم {sz}×{sz}...", end=" ", flush=True)
        pixels = draw_icon(sz)
        path = os.path.join(out_dir, f"icon-{sz}.png")
        write_png(path, pixels, sz, sz)
        size_kb = os.path.getsize(path) / 1024
        print(f"✅  {size_kb:.1f} KB → {path}")

    print("\n✨  اكتمل توليد جميع الأيقونات!")


if __name__ == "__main__":
    main()
