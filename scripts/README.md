# Card Image Slicer

This script automatically slices the playing cards sprite sheet into 52 individual card images with transparent backgrounds.

## Prerequisites

```bash
pip install Pillow
```

## Usage

1. **Place your sprite sheet image** in the `frontend/scripts/` directory and name it:
   ```
   playing_cards_full_set.png
   ```

2. **Run the script:**
   ```bash
   cd frontend/scripts
   python3 slice_cards.py
   ```

3. **Result:** 52 individual card PNGs will be created in `frontend/public/cards/`

## Output Format

Cards are named using the pattern: `{RANK}_{SUIT}.png`

Examples:
- `A_spades.png` - Ace of Spades
- `K_hearts.png` - King of Hearts
- `10_diamonds.png` - 10 of Diamonds
- `2_clubs.png` - 2 of Clubs

## Using Cards in the Frontend

The cards will be automatically available at:
```
/cards/A_spades.png
/cards/K_hearts.png
etc.
```

You can then update `GamePlay.tsx` to use real card images instead of text.

## Customization

Edit `slice_cards.py` to adjust:
- `CARD_WIDTH` / `CARD_HEIGHT` - Size of each card in the sprite sheet
- `ROWS` / `COLS` - Grid dimensions
- `GREEN_THRESHOLD` - Sensitivity for background removal
- Card naming patterns

## Alternative: Manual Method

If you prefer to do it manually:
1. Open sprite sheet in **Photopea** (https://www.photopea.com/)
2. Use Rectangle Select Tool (M key)
3. Select each card
4. Copy (Ctrl+C) and Paste as New Image (Ctrl+V)
5. Select > Color Range > Click green background
6. Delete background
7. File > Export As > PNG
8. Save to `frontend/public/cards/`

## Card Mapping

The script uses standard blackjack card values:
- Aces = 1 or 11 (auto-optimized)
- 2-10 = face value
- J, Q, K = 10
