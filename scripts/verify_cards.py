#!/usr/bin/env python3
"""
Verify that card images are correctly named and match the contract's card ID system
"""

import os

# Card ID system from the smart contract and frontend:
# Card IDs: 1-52
# 1-13 = spades (A through K)
# 14-26 = hearts (A through K)
# 27-39 = diamonds (A through K)
# 40-52 = clubs (A through K)

CARD_NAMES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
SUITS = ["spades", "hearts", "diamonds", "clubs"]

def card_id_to_filename(card_id):
    """Convert contract card ID (1-52) to filename"""
    rank_index = (card_id - 1) % 13  # 0-12 for A-K
    suit_index = (card_id - 1) // 13  # 0-3 for suits
    
    rank = CARD_NAMES[rank_index]
    suit = SUITS[suit_index]
    
    return f"{rank}_{suit}.png"

def main():
    cards_dir = "../public/cards"
    
    print("=" * 60)
    print("Card Image Verification")
    print("=" * 60)
    
    # Test the specific case from the bug report
    print("\n🐛 Testing the bug scenario:")
    print("-" * 60)
    
    # The dealer had cards 7 and 33 (which showed as 23 total, but should be 21)
    dealer_card_1 = 7  # Should be 7 of spades
    dealer_card_2 = 33  # Should be 7 of diamonds
    
    file1 = card_id_to_filename(dealer_card_1)
    file2 = card_id_to_filename(dealer_card_2)
    
    print(f"Dealer Card 1 (ID {dealer_card_1}):")
    print(f"  Expected: 7 of spades")
    print(f"  Filename: {file1}")
    print(f"  File exists: {os.path.exists(os.path.join(cards_dir, file1))}")
    
    print(f"\nDealer Card 2 (ID {dealer_card_2}):")
    print(f"  Expected: 7 of diamonds")
    print(f"  Filename: {file2}")
    print(f"  File exists: {os.path.exists(os.path.join(cards_dir, file2))}")
    
    print(f"\n✅ Both cards should show 7, totaling 14 (or 21 with soft ace)")
    
    # Verify all 52 cards exist
    print("\n" + "=" * 60)
    print("Verifying all 52 playing cards...")
    print("=" * 60)
    
    missing = []
    for card_id in range(1, 53):
        filename = card_id_to_filename(card_id)
        filepath = os.path.join(cards_dir, filename)
        
        if not os.path.exists(filepath):
            missing.append((card_id, filename))
    
    if missing:
        print(f"\n❌ Missing {len(missing)} cards:")
        for card_id, filename in missing:
            print(f"  Card ID {card_id}: {filename}")
    else:
        print("\n✅ All 52 cards are present!")
    
    # Show some sample mappings
    print("\n" + "=" * 60)
    print("Sample Card ID to Filename Mappings:")
    print("=" * 60)
    
    test_cards = [1, 7, 13, 14, 27, 33, 40, 52]
    for card_id in test_cards:
        filename = card_id_to_filename(card_id)
        exists = os.path.exists(os.path.join(cards_dir, filename))
        status = "✅" if exists else "❌"
        print(f"{status} Card ID {card_id:2d} → {filename}")

if __name__ == "__main__":
    main()
