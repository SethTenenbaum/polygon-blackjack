#!/usr/bin/env python3
"""
Card Slicer - Extract individual playing cards from a sprite sheet
Converts green background to transparent and saves each card as a separate PNG
"""

from PIL import Image
import os

# Configuration
INPUT_IMAGE = "playing_cards_full_set.jpg"  # Your image name
OUTPUT_DIR = "../public/cards"
ROWS = 6  # Number of rows in sprite sheet
COLS = 9  # Number of columns we'll extract (excluding duplicates)

# Card naming - EXACT layout from the sprite sheet, reading left to right, top to bottom
# Verified from actual sprite sheet image
CARD_MAP = [
    # Row 0: K♦, K♠, K♥, K♣, A♣, 7♦, 7♠, 7♥, 7♣
    ["K_diamonds", "K_spades", "K_hearts", "K_clubs", "A_clubs", "7_diamonds", "7_spades", "7_hearts", "7_clubs"],
    
    # Row 1: Q♦, Q♠, Q♥, Q♣, A♥, 6♦, 6♠, 6♥, 6♣
    ["Q_diamonds", "Q_spades", "Q_hearts", "Q_clubs", "A_hearts", "6_diamonds", "6_spades", "6_hearts", "6_clubs"],
    
    # Row 2: J♦, J♠, J♥, J♣, A♠, 5♦, 5♠, 5♥, 5♣
    ["J_diamonds", "J_spades", "J_hearts", "J_clubs", "A_spades", "5_diamonds", "5_spades", "5_hearts", "5_clubs"],
    
    # Row 3: 10♦, 10♠, 10♥, 10♣, A♦, 4♦, 4♠, 4♥, 4♣
    ["10_diamonds", "10_spades", "10_hearts", "10_clubs", "A_diamonds", "4_diamonds", "4_spades", "4_hearts", "4_clubs"],
    
    # Row 4: 9♦, 9♠, 9♥, 9♣, Joker, 3♦, 3♠, 3♥, 3♣
    ["9_diamonds", "9_spades", "9_hearts", "9_clubs", "joker", "3_diamonds", "3_spades", "3_hearts", "3_clubs"],
    
    # Row 5: 8♦, 8♠, 8♥, 8♣, Back, 2♦, 2♠, 2♥, 2♣
    ["8_diamonds", "8_spades", "8_hearts", "8_clubs", "back", "2_diamonds", "2_spades", "2_hearts", "2_clubs"],
]

# All 52 cards should now be present in the sprite sheet!

def remove_green_background(img, tolerance=15):
    """
    Convert green background to transparent with precise detection
    The sprite sheet uses a dark green: approximately rgb(17, 94, 63)
    """
    img = img.convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        r, g, b, a = item
        
        # Very precise detection for this specific dark green
        # Check if it's close to the target green color
        is_green = (
            abs(r - 17) < 40 and  # Red around 17 (allow some variance)
            abs(g - 94) < 50 and  # Green around 94
            abs(b - 63) < 40 and  # Blue around 63
            g > r and g > b  # Green is dominant
        )
        
        # Also catch very dark greens that might be in shadows
        is_dark_green = (
            g > r + 10 and
            g > b + 5 and
            r < 80 and
            g < 180 and
            b < 100
        )
        
        if is_green or is_dark_green:
            # Make it fully transparent
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    return img

def crop_transparent_borders(img):
    """
    Crop transparent borders from the image to ensure all cards are the same size
    and properly aligned without extra transparent padding
    """
    # Get the bounding box of the non-transparent area
    bbox = img.getbbox()
    
    if bbox:
        # Crop to the bounding box
        img = img.crop(bbox)
    
    return img



def slice_cards():
    """Slice the sprite sheet into individual cards with exact pixel measurements"""
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Open the sprite sheet
    print(f"Opening {INPUT_IMAGE}...")
    sprite_sheet = Image.open(INPUT_IMAGE)
    
    # EXACT measurements from pixel analysis:
    # Adjusted to capture the FULL white rounded border on all sides
    FIRST_CARD_X = 72      # First card starts at x=72 (moved further left for full border)
    FIRST_CARD_Y = 544     # First card starts at y=544 (moved further up for full border)
    CARD_WIDTH = 428       # Each card is 428px wide (increased to include full borders)
    CARD_HEIGHT = 576      # Each card is 576px tall (increased to include full borders)
    H_GAP = 62             # 62px horizontal gap between cards (adjusted for new width)
    V_GAP = 84             # 84px vertical gap between cards (adjusted for new height)
    
    img_width, img_height = sprite_sheet.size
    print(f"Image size: {img_width}x{img_height}")
    print(f"Card size: {CARD_WIDTH}x{CARD_HEIGHT}")
    print(f"First card position: ({FIRST_CARD_X}, {FIRST_CARD_Y})")
    print(f"Gaps: H={H_GAP}px, V={V_GAP}px")
    print(f"Grid: {ROWS} rows x {COLS} columns")
    print("-" * 50)
    
    card_count = 0
    seen_cards = set()  # Track unique cards
    
    # Iterate through each row and column
    for row in range(ROWS):
        for col in range(COLS):
            # Calculate exact position based on pixel measurements
            left = FIRST_CARD_X + col * (CARD_WIDTH + H_GAP)
            upper = FIRST_CARD_Y + row * (CARD_HEIGHT + V_GAP)
            right = left + CARD_WIDTH
            lower = upper + CARD_HEIGHT
            
            # Crop the card at exact boundaries
            card = sprite_sheet.crop((left, upper, right, lower))
            
            # Remove green background and make it transparent
            card = remove_green_background(card)
            
            # Crop transparent borders to ensure consistent sizing
            card = crop_transparent_borders(card)
            
            # Get card name from map
            card_name = CARD_MAP[row][col]
            
            # Skip duplicates - only save unique cards
            if card_name in seen_cards:
                print(f"⊘ Skipped duplicate: {card_name}")
                continue
            
            seen_cards.add(card_name)
            filename = f"{card_name}.png"
            
            # Save the card
            output_path = os.path.join(OUTPUT_DIR, filename)
            card.save(output_path)
            card_count += 1
            print(f"✓ Saved: {filename} ({card.width}x{card.height})")
    
    print("-" * 50)
    print(f"✅ Successfully sliced {card_count} unique cards!")
    print(f"📁 Cards saved to: {OUTPUT_DIR}")
    print(f"\n📊 Unique cards saved: {len(seen_cards)}")
    
    print("\n🎴 All 52 playing cards successfully extracted!")
    print("\nYou can now use these cards in your frontend:")
    print("  /cards/A_spades.png")
    print("  /cards/K_hearts.png")
    print("  /cards/10_diamonds.png")
    print("  etc.")

if __name__ == "__main__":
    slice_cards()

