/**
 * Game Outcome Calculator
 * 
 * This module calculates the game outcome and payout directly from on-chain state,
 * matching the exact logic in WinnerDeterminationLogic.sol and DealerLogic.sol.
 * 
 * This ensures the UI can always display accurate results, even after page reload
 * or if the GameFinished event is missed.
 */

export enum HandResult {
  Loss = 0,
  Push = 1,
  Win = 2,
  Blackjack = 3,
}

export interface PlayerHand {
  cards: bigint[];
  bet: bigint;
  busted?: boolean;
  stood?: boolean;
  doubled?: boolean;
}

export interface GameOutcome {
  result: "won" | "lost" | "push" | "blackjack" | "insurance_payout";
  totalPayout: bigint;
  totalBet: bigint;
  totalMainBet: bigint;
  insuranceBet: bigint;
  netProfit: bigint;
  handResults: {
    handIndex: number;
    result: HandResult;
    payout: bigint;
    playerScore: number;
    dealerScore: number;
    playerBlackjack: boolean;
    dealerBlackjack: boolean;
  }[];
}

/**
 * Calculate the score of a hand following blackjack rules
 * Matches CardLogic.calculateScore in the contract
 */
export function calculateScore(cards: bigint[]): number {
  if (cards.length === 0) return 0;
  
  let score = 0;
  let aces = 0;
  
  for (const card of cards) {
    const rank = Number(card) % 13; // 0-12 representing K, A, 2-10, J, Q
    
    if (rank === 1) { // Ace
      aces++;
      score += 11; // Count as 11 initially
    } else if (rank === 0 || rank >= 11) { // King (0), Jack (11), Queen (12)
      score += 10;
    } else {
      score += rank; // 2-10 at face value
    }
  }
  
  // Adjust for aces if score is over 21
  while (score > 21 && aces > 0) {
    score -= 10; // Convert an ace from 11 to 1
    aces--;
  }
  
  return score;
}

/**
 * Check if a hand is busted (score > 21)
 */
export function isBusted(cards: bigint[]): boolean {
  return calculateScore(cards) > 21;
}

/**
 * Check if hand is a blackjack (natural 21 with 2 cards)
 */
export function isBlackjack(cards: bigint[]): boolean {
  if (cards.length !== 2) return false;
  return calculateScore(cards) === 21;
}

/**
 * Determine the result of a single hand against the dealer
 * Matches WinnerDeterminationLogic.determineHandResult in the contract
 */
export function determineHandResult(
  playerHand: PlayerHand,
  dealerCards: bigint[],
  dealerBusted: boolean
): { result: HandResult; payout: bigint } {
  // Player busted = loss (check this FIRST before anything else)
  if (playerHand.busted || isBusted(playerHand.cards)) {
    return { result: HandResult.Loss, payout: BigInt(0) };
  }
  
  const playerScore = calculateScore(playerHand.cards);
  const dealerScore = calculateScore(dealerCards);
  
  // Player blackjack
  const playerBlackjack = playerHand.cards.length === 2 && playerScore === 21;
  const dealerBlackjack = dealerCards.length === 2 && dealerScore === 21;
  
  if (playerBlackjack && !dealerBlackjack) {
    // Blackjack pays 3:2
    const payout = playerHand.bet + (playerHand.bet * BigInt(3) / BigInt(2));
    return { result: HandResult.Blackjack, payout };
  }
  
  if (playerBlackjack && dealerBlackjack) {
    // Push on double blackjack
    return { result: HandResult.Push, payout: playerHand.bet };
  }
  
  // Dealer busted and player didn't = player wins
  if (dealerBusted) {
    // Player wins! Return bet + equal winnings
    const payout = playerHand.bet * BigInt(2);
    return { result: HandResult.Win, payout };
  }
  
  // Compare scores
  if (playerScore > dealerScore) {
    const payout = playerHand.bet * BigInt(2);
    return { result: HandResult.Win, payout };
  } else if (playerScore === dealerScore) {
    return { result: HandResult.Push, payout: playerHand.bet }; // Push - return bet
  } else {
    return { result: HandResult.Loss, payout: BigInt(0) };
  }
}

/**
 * Calculate if dealer should hit based on current cards
 * Matches DealerLogic.shouldDealerHit in the contract
 */
export function shouldDealerHit(dealerCards: bigint[]): boolean {
  const score = calculateScore(dealerCards);
  // Dealer must hit on 16 or less, must stand on 17 or more
  return score < 17;
}

/**
 * Calculate complete game outcome from on-chain state
 * This is the main function to use in the UI
 */
export function calculateGameOutcome(
  playerHands: PlayerHand[],
  dealerCards: bigint[],
  insuranceBet: bigint
): GameOutcome {
  // Calculate dealer state
  const dealerBusted = isBusted(dealerCards);
  const dealerBlackjack = isBlackjack(dealerCards);
  const dealerScore = calculateScore(dealerCards);
  
  // Calculate main bet total
  const totalMainBet = playerHands.reduce((sum, hand) => sum + hand.bet, BigInt(0));
  const totalBet = totalMainBet + insuranceBet;
  
  // Calculate payout for each hand
  const handResults = playerHands.map((hand, index) => {
    const { result, payout } = determineHandResult(hand, dealerCards, dealerBusted);
    const playerScore = calculateScore(hand.cards);
    const playerBlackjack = isBlackjack(hand.cards);
    
    return {
      handIndex: index,
      result,
      payout,
      playerScore,
      dealerScore,
      playerBlackjack,
      dealerBlackjack,
    };
  });
  
  // Calculate total payout from main hands
  let totalMainPayout = BigInt(0);
  for (const handResult of handResults) {
    totalMainPayout += handResult.payout;
  }
  
  // Handle insurance payout
  let insurancePayout = BigInt(0);
  if (insuranceBet > BigInt(0) && dealerBlackjack) {
    // Insurance pays 2:1 (returns 3x the insurance bet)
    insurancePayout = insuranceBet * BigInt(3);
  }
  
  // Total payout includes main hands + insurance
  const totalPayout = totalMainPayout + insurancePayout;
  
  // Calculate net profit
  const netProfit = totalPayout - totalBet;
  
  // Determine overall result
  let result: GameOutcome["result"];
  
  // Check if this is an insurance scenario
  const hadInsurance = insuranceBet > BigInt(0);
  const insurancePaidOut = insurancePayout > BigInt(0);
  
  if (hadInsurance && dealerBlackjack) {
    // Insurance scenario: dealer had blackjack and we had insurance
    result = "insurance_payout";
  } else {
    // Check if any hand won with blackjack
    const hasBlackjackWin = handResults.some(
      h => h.result === HandResult.Blackjack
    );
    
    if (hasBlackjackWin) {
      result = "blackjack";
    } else if (totalPayout > totalBet) {
      result = "won";
    } else if (totalPayout === totalBet) {
      result = "push";
    } else {
      result = "lost";
    }
  }
  
  return {
    result,
    totalPayout,
    totalBet,
    totalMainBet,
    insuranceBet,
    netProfit,
    handResults,
  };
}

/**
 * Check if a game is in a finished state where outcome can be calculated
 */
export function canCalculateOutcome(
  gameState: number,
  dealerCards: bigint[],
  playerHands: PlayerHand[]
): boolean {
  // GameState.Finished = 5
  if (gameState === 5) return true;
  
  // Also allow calculation if dealer has finished playing
  // (dealer has at least 2 cards and either busted or has >= 17)
  if (dealerCards.length >= 2) {
    const dealerScore = calculateScore(dealerCards);
    const dealerBusted = dealerScore > 21;
    const dealerStands = dealerScore >= 17;
    
    if (dealerBusted || dealerStands) {
      // Also check if all player hands are done (all stood or busted)
      const allHandsDone = playerHands.every(
        hand => hand.stood || hand.busted || isBusted(hand.cards)
      );
      
      if (allHandsDone) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Format the result for display
 */
export function formatGameResult(outcome: GameOutcome): {
  title: string;
  emoji: string;
  color: string;
  description: string;
} {
  switch (outcome.result) {
    case "blackjack":
      return {
        title: "BLACKJACK!",
        emoji: "🃏",
        color: "text-yellow-400",
        description: "3:2 Payout!",
      };
    case "won":
      return {
        title: "You Won!",
        emoji: "💰",
        color: "text-green-400",
        description: "Congratulations!",
      };
    case "push":
      return {
        title: "Push",
        emoji: "🤝",
        color: "text-yellow-400",
        description: "It's a tie!",
      };
    case "insurance_payout":
      return {
        title: "Insurance Protected You!",
        emoji: "🛡️",
        color: "text-blue-400",
        description: "Insurance paid 2:1",
      };
    case "lost":
      return {
        title: "You Lost",
        emoji: "😔",
        color: "text-red-400",
        description: "Better luck next time!",
      };
  }
}
