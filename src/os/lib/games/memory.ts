/** Phase memory — flip cards to find matching pairs. Pure reducer for easy testing. */

export const SYMBOLS = ["new", "crescent", "quarter", "gibbous", "full", "comet", "ringed", "rocket"] as const;
export type Symbol = (typeof SYMBOLS)[number];

export interface Card {
  id: number;
  symbol: Symbol;
  matched: boolean;
}

export interface MemoryState {
  cards: Card[];
  /** Indices of face-up, not-yet-resolved cards (0–2). */
  open: number[];
  moves: number;
  done: boolean;
}

export function newBoard(rand: () => number = Math.random): MemoryState {
  const cards = [...SYMBOLS, ...SYMBOLS].map((symbol, id) => ({ id, symbol, matched: false }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return { cards, open: [], moves: 0, done: false };
}

/** Flip card `i`. A second flip counts a move; matching pairs stay up. */
export function flip(s: MemoryState, i: number): MemoryState {
  const card = s.cards[i];
  if (!card || card.matched || s.open.includes(i) || s.done) return s;
  // Two mismatched cards are still showing: this tap hides them and flips the new one.
  const open = s.open.length === 2 ? [i] : [...s.open, i];
  if (open.length < 2) return { ...s, open };
  const [a, b] = open;
  const moves = s.moves + 1;
  if (s.cards[a].symbol === s.cards[b].symbol) {
    const cards = s.cards.map((c, k) => (k === a || k === b ? { ...c, matched: true } : c));
    return { cards, open: [], moves, done: cards.every((c) => c.matched) };
  }
  return { ...s, open, moves };
}

/** Hide a mismatched pair (called after a short delay). */
export const settle = (s: MemoryState): MemoryState => (s.open.length === 2 ? { ...s, open: [] } : s);
