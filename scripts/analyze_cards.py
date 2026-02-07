#!/usr/bin/env python3
"""
Analyze the sprite sheet to find exact card boundaries
"""

from PIL import Image

INPUT_IMAGE = "playing_cards_full_set.jpg"

def analyze_sprite_sheet():
    img = Image.open(INPUT_IMAGE)
    img_rgb = img.convert("RGB")
    
    print(f"Image size: {img.size}")
    print("\nSampling pixels to find card boundaries...")
    
    # Sample the first card (top-left K♦)
    # Let's check where the white card actually starts/ends
    
    # Check horizontal: scan along y=700 (middle of first card based on vertical scan)
    print("\nHorizontal scan (row at y=700, middle of first card):")
    for x in range(0, 900, 10):
        r, g, b = img_rgb.getpixel((x, 700))
        color_type = "GREEN" if (g > r + 10 and g > b + 5) else "WHITE" if (r > 200 and g > 200 and b > 200) else "OTHER"
        print(f"  x={x:3d}: RGB({r:3d},{g:3d},{b:3d}) - {color_type}")
    
    # Check vertical: scan along x=225 (middle of first column)
    print("\nVertical scan (col 0, middle width):")
    for y in range(0, 1300, 20):
        r, g, b = img_rgb.getpixel((225, y))
        color_type = "GREEN" if (g > r + 10 and g > b + 5) else "WHITE" if (r > 200 and g > 200 and b > 200) else "OTHER"
        print(f"  y={y:3d}: RGB({r:3d},{g:3d},{b:3d}) - {color_type}")

if __name__ == "__main__":
    analyze_sprite_sheet()
