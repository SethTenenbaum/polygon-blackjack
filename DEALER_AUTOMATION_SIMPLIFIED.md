# Dealer Automation - Simplified Design

## 🎯 CRITICAL FIX: Phantom Transactions Eliminated

**Root Cause**: The dealer automation effect had `execute`, `handleApproveLINK`, `isPending`, and `pendingAction` in its dependencies. Since `execute` depends on `[state, isPending, pendingAction]`, it gets recreated on every render when any of these change. This caused the effect to re-run constantly, cancelling and restarting the timer repeatedly, leading to phantom transactions.

**Solution**: **ONLY `state` in dependencies**. The effect now runs ONCE when entering DealerTurn and sets a single 3-second timer. All other values (isPending, dealer cards, etc.) are accessed via refs that are updated on every render, so the timer callback always has fresh values without causing the effect to re-run.

## 🎯 LATEST FIX: Stale State in Execute Function

**Problem**: Even after fixing the dealer automation effect to only depend on `[state]`, the countdown would complete but no transaction would occur. The timer callback would call `capturedExecute`, but that function had a stale `state` value baked into its closure from when the effect ran.

**Root Cause**: The `execute` function uses `state` in its checks (e.g., checking if `state === GameState.DealerTurn`). When we capture `execute` in the timer callback, we're capturing a version that has the OLD state value. So the timer fires, calls execute, but execute's checks fail because it's checking against stale state.

**Solution**: Make `execute` use `latestGameStateRef.current` instead of the `state` parameter. This ensures execute always checks the CURRENT state, not the state from when it was created.

**Code Change**:
```typescript
// BEFORE (broken - stale state):
const execute = useCallback((functionName: string, args?: any[], value?: bigint) => {
  // Uses 'state' parameter - this is stale if execute was captured in a closure!
  if (isDealerAction && state !== GameState.DealerTurn) {
    console.log(`🛑 BLOCKED: Prevented ${functionName}`);
    return;
  }
  // ...
}, [state, executeRaw, setTxError, isPending, pendingAction]);

// AFTER (fixed - always uses fresh state):
const execute = useCallback((functionName: string, args?: any[], value?: bigint) => {
  // Always get the CURRENT state from the ref
  const currentState = latestGameStateRef.current ?? 0;
  
  if (isDealerAction && currentState !== GameState.DealerTurn) {
    console.log(`🛑 BLOCKED: Prevented ${functionName}`);
    return;
  }
  // ...
}, [executeRaw, setTxError, isPending, pendingAction]); // No 'state' dependency!
```

**Why This Works**:
1. ✅ `latestGameStateRef.current` is updated on EVERY render (line 430)
2. ✅ Execute always reads the MOST RECENT state value
3. ✅ No stale closures - even if execute was created seconds ago, it checks current state
4. ✅ Dealer action proceeds if state is still DealerTurn

## 🎯 LATEST FIX (Previous Session)

**Problem**: The 3-second countdown would complete but dealer action would not trigger. This happened because the effect was checking `isRefetchingRef.current` at the effect level (before setting the timer), not in the timer callback.

**Root Cause**: When the game transitioned to DealerTurn during or shortly after a refetch (common after VRF completion), `isRefetchingRef.current` was `true`, causing an early return BEFORE the timer was even set. The timer never existed, so it could never fire.

**Solution**: Always set the timer when entering DealerTurn, but check `isRefetchingRef.current` inside the timer callback when it fires 3 seconds later. This ensures:
1. Timer is always created when entering DealerTurn
2. When timer fires, it checks if refetch is still in progress and blocks if needed
3. If refetch completed during the 3 seconds, the dealer action proceeds
4. Player has at least 3 seconds to act before automation triggers

**Code Change**:
```typescript
// BEFORE (broken):
if (isRefetchingRef.current) {
  return; // Blocks entire effect - timer never created!
}
const timer = setTimeout(() => { /* action */ }, 3000);

// AFTER (fixed):
const timer = setTimeout(() => {
  if (isRefetchingRef.current) {
    return; // Only blocks this callback execution
  }
  /* action */
}, 3000);
```

This fix ensures dealer automation reliably triggers after the countdown, even if the transition to DealerTurn happens during a refetch window.

## ⚠️ CRITICAL ANTI-PHANTOM-TRANSACTION RULE

**NEVER include `dealerCardsData` OR `dealerHoleCardRevealed` in the dealer automation effect dependencies!**

### Why?
1. **`dealerCardsData`**: Changes during PlayerTurn when polling/refetching updates the cards, leading to phantom dealer transactions.
2. **`dealerHoleCardRevealed`**: This state changes when the hole card is revealed, which can happen at any time and would cause the effect to re-run, potentially during PlayerTurn.

### Solution
Use refs that are updated on every render, and read from those refs inside the `setTimeout` callback:
```typescript
// Update refs on EVERY render (outside effects)
latestDealerCardsRef.current = (dealerCardsData as readonly bigint[] | undefined) || [];
latestHoleCardRevealedRef.current = dealerHoleCardRevealed;

// In the effect, don't depend on the state - use the ref in the callback
const holeCardRevealed = latestHoleCardRevealedRef.current; // For logging only
```

This way, the effect only runs when state changes (entering/exiting DealerTurn), not when card data or hole card state changes.

## ⚠️ CRITICAL FIX: Stale Closure Problem

**Problem**: The fallback timer's `setTimeout` callback captures dealer card values at the time the effect runs. If cards are still loading when the effect runs, the callback will have stale/empty values 3 seconds later.

**Solution**: Use refs that are updated on EVERY render:
```typescript
// Update refs on every render (outside effects)
latestDealerCardsRef.current = (dealerCardsData as readonly bigint[] | undefined) || [];
latestHoleCardRevealedRef.current = dealerHoleCardRevealed;

// Then in setTimeout callback, use ref values:
const freshDealerCards = latestDealerCardsRef.current;
const freshHoleCardRevealed = latestHoleCardRevealedRef.current;
```

This ensures the callback always sees the latest values, even if they were stale when the timer was created.

## ⚠️ CRITICAL FIX: VRF Completion Race Condition

**Problem**: After VRF completes, we do comprehensive refetches which can take 1-2 seconds. During this window, if the game transitions to DealerTurn, the dealer automation effect could fire and create a phantom transaction before the player has a chance to act.

**Solution**: 
1. Set `isRefetchingRef.current = true` at the start of `refetchAllGameData()`
2. Check this ref in the dealer automation effect and block if true
3. Keep the flag set for 2 seconds to cover multiple refetch waves
4. This creates a "quiet period" after VRF where dealer automation is paused

```typescript
// In dealer automation effect
if (isRefetchingRef.current) {
  console.log("⏸️ Dealer automation blocked - refetching game data");
  return;
}

// In refetchAllGameData
isRefetchingRef.current = true;
// ...do refetch...
setTimeout(() => {
  isRefetchingRef.current = false;
}, 2000); // 2 seconds to cover multiple waves
```

## ⚠️ CRITICAL FIX: Timer Not Set During Refetch

**Problem**: If the game enters DealerTurn while `isRefetchingRef.current === true` (which lasts for 2 seconds after any refetch), the early return in the effect would prevent the timer from being set at all. This meant dealer automation would never trigger if the transition happened during or shortly after a refetch (which is common after VRF completion).

**Solution**: Move the refetch check INSIDE the timer callback, not at the effect level:
```typescript
// OLD CODE (BROKEN):
useEffect(() => {
  // ... state checks ...
  
  // This would block the ENTIRE effect, so timer never gets set!
  if (isRefetchingRef.current) {
    return;
  }
  
  const timer = setTimeout(() => {
    // ...dealer action...
  }, 3000);
  
  return () => clearTimeout(timer);
}, [/* deps */]);

// NEW CODE (FIXED):
useEffect(() => {
  // ... state checks ...
  
  // ALWAYS set the timer, regardless of refetch state
  const timer = setTimeout(() => {
    // Check refetch status INSIDE the callback
    if (isRefetchingRef.current) {
      console.log("⏸️ Fallback automation cancelled - refetch in progress");
      return;
    }
    // ...dealer action...
  }, 3000);
  
  return () => clearTimeout(timer);
}, [/* deps */]);
```

This ensures the timer is always set when entering DealerTurn, and the callback checks all conditions when it fires 3 seconds later. This prevents the "countdown completes but nothing happens" bug.

## ⚠️ CRITICAL FIX: Effect Re-running Cancels Timer

**Problem**: If any function in the effect dependencies is recreated on every render (like `calculateDealerScore` or `handleApproveLINK`), the effect will re-run constantly, cancelling and restarting the timer, so it never fires.

**Solution**: Memoize ALL functions in the dependencies with `useCallback`:
```typescript
const calculateDealerScore = useCallback((cards: readonly bigint[]): number => {
  // ...calculation logic...
}, []); // No dependencies - pure calculation

const handleApproveLINK = useCallback(async (action: string) => {
  // ...approval logic...
}, [linkFeePerAction, approveLINK, gameAddress]);
```

This ensures the functions have stable references and don't cause the effect to re-run unnecessarily.

## Overview
The dealer automation has been drastically simplified to make it more reliable and easier to understand.

## Key Principle
**Dealer automation ONLY runs when the UI is showing "Dealer's Turn"** (state === DealerTurn)

## How It Works

### 1. Entry Condition
- The effect only runs when `state === GameState.DealerTurn`
- All other states (PlayerTurn, InsuranceOffer, Dealing, Finished) are blocked immediately

### 2. Fallback Automation (3 seconds)
After entering DealerTurn, a 3-second timer starts. When it fires, it:
1. Checks if we're still in DealerTurn
2. Checks if no transaction is pending
3. Determines the appropriate action:
   - **No cards loaded** → Call `continueDealer()`
   - **Hole card not revealed** → Call `continueDealer()`
   - **Dealer score < 17** → Call `dealerHit()` (with LINK approval check)
   - **Dealer score >= 17** → Call `continueDealer()`

### 3. Manual Retry (after 5 seconds)
If the fallback automation fails, a manual retry button appears after 5 seconds:
- Provides the same logic as the fallback automation
- Allows the user to manually trigger the dealer action
- Includes LINK approval flow if needed

## Defense in Depth

### Multiple Layers of Protection
1. **Effect Entry Check**: Only runs when state === DealerTurn
2. **Execute Wrapper Checks**: All dealer actions are blocked unless state === DealerTurn
3. **Timer Cancellation**: The fallback timer is cancelled if we leave DealerTurn
4. **Ref Checks**: Uses refs to track the latest state inside setTimeout callbacks

### Phantom Transaction Prevention
- **NO dealerCardsData in dependencies**: This prevents the effect from firing when dealer cards change during PlayerTurn
- **State-based triggering**: Only triggers on state changes, not on card data changes
- **Pending checks**: Blocks automation when `isPending`, `pendingAction`, or `dealerActionInProgressRef` is true

## Player Actions
Player actions (hit, stand, doubleDown, split) **ALWAYS** trigger transactions directly:
- No automation involved
- Direct calls to `execute()` function
- Immediate state validation in the execute wrapper

## Benefits of Simplified Design

### Before (Complex)
- 200+ lines of dealer automation logic
- Multiple refs tracking state (continueDealerTriggeredRef, finalContinueDealerAttemptedRef, lastDealerCardCountRef, etc.)
- Contract stabilization delays
- Page refresh detection
- Complex card count tracking
- Hard to debug and understand

### After (Simple)
- ~80 lines of dealer automation logic
- Single ref (dealerActionInProgressRef) to prevent duplicate actions
- 3-second fallback timer
- 5-second manual retry
- Clear and easy to understand

## Testing Checklist

### Verify Dealer Automation
- [ ] Entering DealerTurn triggers dealer action within 3 seconds
- [ ] Dealer actions never trigger during PlayerTurn
- [ ] Dealer actions never trigger during InsuranceOffer
- [ ] Manual retry button appears after 5 seconds
- [ ] Manual retry button works correctly
- [ ] LINK approval flow works for dealerHit

### Verify Player Actions
- [ ] Hit button triggers transaction immediately
- [ ] Stand button triggers transaction immediately
- [ ] Double down triggers transaction immediately
- [ ] Split triggers transaction immediately
- [ ] No phantom transactions during player turn

### Verify State Transitions
- [ ] PlayerTurn → DealerTurn: Dealer automation starts
- [ ] DealerTurn → Dealing: VRF request in progress
- [ ] Dealing → DealerTurn: Dealer automation resumes
- [ ] DealerTurn → Finished: Game ends correctly

## Dependencies Explanation

```typescript
[state, isPending, pendingAction, calculateDealerScore, dealerHoleCardRevealed, isLINKApproved]
```

- `state`: Detect when we enter/exit DealerTurn
- `isPending`: Block automation when transaction is in progress
- `pendingAction`: Block automation when approval flow is in progress
- `calculateDealerScore`: Function to calculate dealer score
- `dealerHoleCardRevealed`: Check if hole card is revealed
- `isLINKApproved`: Check LINK approval before dealerHit

**Solution**: Check the console logs:
- Look for "✅ DEALER AUTOMATION ACTIVE"
- If blocked, look for the reason (isPending, pendingAction, actionInProgress)
- Wait for the 5-second manual retry button

### Issue: Phantom transactions during player turn
**Solution**: This should be impossible now due to multiple layers of protection:
1. Effect only runs in DealerTurn
2. Execute wrapper blocks dealer actions outside DealerTurn
3. No dealerCardsData in dependencies

### Issue: LINK not approved for dealerHit
**Solution**: The automation will automatically trigger the LINK approval flow and wait for user confirmation. After approval, the action will execute.

## Code Location
- Main file: `/Users/sethtenenbaum/Documents/repos/polygon-blackjack/src/components/GamePlay.tsx`
- Dealer automation effect: Lines ~1660-1750
- Execute wrapper: Lines ~845-930
- Manual retry handler: Lines ~1550-1660
