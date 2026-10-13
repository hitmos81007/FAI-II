# Nim Mathematical Theory & Binary XOR Analysis

## Worked Example: Classic Nim [3, 4, 5]

Consider a game starting with three heaps of sizes $h_1 = 3, h_2 = 4, h_3 = 5$.

### Step 1: Binary Decomposition
Convert each heap size into its standard binary representation:

| Heap | Decimal Size | Binary ($2^2 = 4$) | Binary ($2^1 = 2$) | Binary ($2^0 = 1$) |
| :--- | :---: | :---: | :---: | :---: |
| **Heap 1** | 3 | 0 | 1 | 1 |
| **Heap 2** | 4 | 1 | 0 | 0 |
| **Heap 3** | 5 | 1 | 0 | 1 |
| **Nim-Sum ($\oplus$)** | **2** | **0** (even: 2 ones) | **1** (odd: 1 one) | **0** (even: 2 ones) |

### Step 2: Identification of State Type
- The Nim-sum is $S = 3 \oplus 4 \oplus 5 = 2 \neq 0$.
- Because $S \neq 0$, this is an **N-position** (Winning position for the first player).
- The Most Significant Bit (MSB) of $S = 2$ is at bit position $1$ (place value $2^1 = 2$).

### Step 3: Deriving the Optimal Move
To force a win, the player must choose a heap whose binary expansion contains a 1 at bit position 1:
- Heap 1 ($3 = 011_2$): bit 1 is **1** $\to$ Candidate!
  $$h_1 \oplus S = 3 \oplus 2 = 1 < 3$$
  Valid reduction: reduce Heap 1 from 3 to 1 (remove $3 - 1 = 2$ counters).
- Heap 2 ($4 = 100_2$): bit 1 is 0 $\to 4 \oplus 2 = 6 > 4$ (cannot increase counters).
- Heap 3 ($5 = 101_2$): bit 1 is 0 $\to 5 \oplus 2 = 7 > 5$ (cannot increase counters).

### Step 4: Verifying the Resulting State
After removing 2 items from Heap 1, the new state is $[1, 4, 5]$:

| Heap | Decimal Size | Binary ($2^2$) | Binary ($2^1$) | Binary ($2^0$) |
| :--- | :---: | :---: | :---: | :---: |
| **Heap 1** | 1 | 0 | 0 | 1 |
| **Heap 2** | 4 | 1 | 0 | 0 |
| **Heap 3** | 5 | 1 | 0 | 1 |
| **New Nim-Sum** | **0** | **0** (even) | **0** (even) | **0** (even) |

The new Nim-sum is **0** (a P-position). The opponent is now presented with a balanced position and has no winning moves.

---

## State Transition Graph (P and N Invariants)

```text
               +-----------------------------+
               |  N-Position (Nim-sum != 0)  |
               |     (Player to move wins)   |
               +-----------------------------+
                      |               ^
   At least one       |               | Any legal
   optimal move       |               | move
   restores balance   v               | creates imbalance
               +-----------------------------+
               |  P-Position (Nim-sum == 0)  |
               |    (Previous mover wins)    |
               +-----------------------------+
```

1. **Every move from a P-position leads to an N-position.**
   $$\forall m \in \text{LegalMoves}(P), \quad \text{State}' \in N$$
2. **From every N-position, there is at least one move to a P-position.**
   $$\exists m \in \text{LegalMoves}(N), \quad \text{State}' \in P$$
3. **The terminal state $[0, 0, \dots, 0]$ has Nim-sum = 0, which is a P-position.**
   Under Normal play, the player who makes the last move wins by leaving this terminal P-position.
