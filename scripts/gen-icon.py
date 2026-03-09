from PIL import Image, ImageDraw, ImageFont
import math
import os

def create_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx, cy = size / 2, size / 2
    r = size * 0.45

    # Background circle with gradient effect (concentric circles)
    steps = 80
    for i in range(steps, 0, -1):
        ratio = i / steps
        cr = r * ratio
        # Gradient from warm orange (#F5A623) to golden (#FFB74D)
        r_c = int(245 + (255 - 245) * (1 - ratio))
        g_c = int(166 + (183 - 166) * (1 - ratio))
        b_c = int(35 + (77 - 35) * (1 - ratio))
        draw.ellipse(
            [cx - cr, cy - cr, cx + cr, cy + cr],
            fill=(r_c, g_c, b_c, 255)
        )

    # Draw a stylized coin/wallet shape
    # White inner circle (coin face)
    inner_r = r * 0.62
    draw.ellipse(
        [cx - inner_r, cy - inner_r - size * 0.02, cx + inner_r, cy + inner_r - size * 0.02],
        fill=(255, 255, 255, 240)
    )

    # Draw ¥ symbol
    yen_size = int(size * 0.32)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", yen_size)
    except (OSError, IOError):
        try:
            font = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", yen_size)
        except (OSError, IOError):
            font = ImageFont.load_default()

    text = "¥"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw / 2
    ty = cy - th / 2 - size * 0.04

    # ¥ symbol in gradient orange
    draw.text((tx, ty), text, fill=(229, 142, 0, 255), font=font)

    # Draw two small decorative lines under ¥
    line_w = size * 0.18
    line_h = max(2, size * 0.02)
    line_y1 = cy + inner_r * 0.45
    line_y2 = line_y1 + size * 0.06
    draw.rounded_rectangle(
        [cx - line_w, line_y1, cx + line_w, line_y1 + line_h],
        radius=line_h,
        fill=(229, 142, 0, 200)
    )
    draw.rounded_rectangle(
        [cx - line_w * 0.7, line_y2, cx + line_w * 0.7, line_y2 + line_h],
        radius=line_h,
        fill=(229, 142, 0, 150)
    )

    # Add subtle shine effect (top-left highlight)
    shine_r = r * 0.25
    shine_cx = cx - r * 0.25
    shine_cy = cy - r * 0.3
    for i in range(int(shine_r), 0, -1):
        alpha = int(40 * (1 - i / shine_r))
        draw.ellipse(
            [shine_cx - i, shine_cy - i, shine_cx + i, shine_cy + i],
            fill=(255, 255, 255, alpha)
        )

    return img


def create_foreground(size):
    """Adaptive icon foreground (108dp based, with safe zone)"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx, cy = size / 2, size / 2
    # Safe zone is 66/108 of the size, draw within it
    safe_r = size * 0.30

    # White circle
    draw.ellipse(
        [cx - safe_r, cy - safe_r, cx + safe_r, cy + safe_r],
        fill=(255, 255, 255, 240)
    )

    # ¥ symbol
    yen_size = int(size * 0.22)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", yen_size)
    except (OSError, IOError):
        try:
            font = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", yen_size)
        except (OSError, IOError):
            font = ImageFont.load_default()

    text = "¥"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw / 2
    ty = cy - th / 2 - size * 0.02
    draw.text((tx, ty), text, fill=(229, 142, 0, 255), font=font)

    # Decorative lines
    line_w = size * 0.10
    line_h = max(2, size * 0.015)
    line_y1 = cy + safe_r * 0.45
    line_y2 = line_y1 + size * 0.04
    draw.rounded_rectangle(
        [cx - line_w, line_y1, cx + line_w, line_y1 + line_h],
        radius=line_h, fill=(229, 142, 0, 200)
    )
    draw.rounded_rectangle(
        [cx - line_w * 0.7, line_y2, cx + line_w * 0.7, line_y2 + line_h],
        radius=line_h, fill=(229, 142, 0, 150)
    )

    return img


base = "/Users/niuniu/Desktop/other-project/bill-app/android/app/src/main/res"

# Icon sizes for each density
sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

# Foreground sizes (108dp based)
fg_sizes = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

for folder, sz in sizes.items():
    path = os.path.join(base, folder)
    os.makedirs(path, exist_ok=True)
    
    icon = create_icon(sz)
    icon.save(os.path.join(path, "ic_launcher.png"))
    
    # Round icon: same but clipped to circle
    mask = Image.new('L', (sz, sz), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([0, 0, sz, sz], fill=255)
    round_icon = Image.new('RGBA', (sz, sz), (0, 0, 0, 0))
    round_icon.paste(icon, mask=mask)
    round_icon.save(os.path.join(path, "ic_launcher_round.png"))

for folder, sz in fg_sizes.items():
    path = os.path.join(base, folder)
    os.makedirs(path, exist_ok=True)
    fg = create_foreground(sz)
    fg.save(os.path.join(path, "ic_launcher_foreground.png"))

# Update background color to our orange
bg_xml = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#F5A623</color>
</resources>
"""
with open(os.path.join(base, "values", "ic_launcher_background.xml"), "w") as f:
    f.write(bg_xml)

# Also create a 512x512 icon for web/store use
store_icon = create_icon(512)
store_icon.save("/Users/niuniu/Desktop/other-project/bill-app/public/icon-512.png")

# Create favicon-sized version
favicon = create_icon(192)
favicon.save("/Users/niuniu/Desktop/other-project/bill-app/public/icon-192.png")

print("All icons generated!")
