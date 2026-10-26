import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDeck,
  shuffleDeck,
  sortHand,
  isValidTrixCard,
  resolveTrickWinner,
  calculateContractPenalties,
  initializeTrixGame,
  getBotMove,
} from './trixGameEngine';
import { TrixBoardSuitState, TrixTrickPlay, TrixCard } from '../types/trix';

test('createDeck creates standard 52 unique cards', () => {
  const deck = createDeck();
  assert.equal(deck.length, 52);
  const ids = new Set(deck.map((c) => c.id));
  assert.equal(ids.size, 52);
});

test('shuffleDeck preserves all cards without loss', () => {
  const deck = createDeck();
  const shuffled = shuffleDeck(deck);
  assert.equal(shuffled.length, 52);
});

test('sortHand orders cards by suit and descending rank', () => {
  const cards: TrixCard[] = [
    { id: '1', suit: 'HEARTS', rank: 3, label: '3', suitSymbol: '♥', isRed: true },
    { id: '2', suit: 'HEARTS', rank: 14, label: 'A', suitSymbol: '♥', isRed: true },
    { id: '3', suit: 'SPADES', rank: 10, label: '10', suitSymbol: '♠', isRed: false },
  ];
  const sorted = sortHand(cards);
  assert.equal(sorted[0].suit, 'SPADES');
  assert.equal(sorted[1].rank, 14);
  assert.equal(sorted[2].rank, 3);
});

test('isValidTrixCard enforces Jack as entry before higher or lower cards', () => {
  const boardSuit: Record<'SPADES', TrixBoardSuitState> = {
    SPADES: { suit: 'SPADES', jackPlayed: false, lowRank: 11, highRank: 11, cardsPlayed: [] },
  };

  const queenSpades: TrixCard = { id: 'q', suit: 'SPADES', rank: 12, label: 'Q', suitSymbol: '♠', isRed: false };
  const jackSpades: TrixCard = { id: 'j', suit: 'SPADES', rank: 11, label: 'J', suitSymbol: '♠', isRed: false };

  // Queen cannot be played before Jack
  assert.equal(isValidTrixCard(queenSpades, boardSuit as any), false);
  // Jack can be played
  assert.equal(isValidTrixCard(jackSpades, boardSuit as any), true);
});

test('resolveTrickWinner honors lead suit regardless of off-suit ranks', () => {
  const trick: TrixTrickPlay[] = [
    { playerPos: 0, card: { id: '1', suit: 'CLUBS', rank: 5, label: '5', suitSymbol: '♣', isRed: false } },
    { playerPos: 1, card: { id: '2', suit: 'CLUBS', rank: 10, label: '10', suitSymbol: '♣', isRed: false } },
    { playerPos: 2, card: { id: '3', suit: 'SPADES', rank: 14, label: 'A', suitSymbol: '♠', isRed: false } }, // Off suit
    { playerPos: 3, card: { id: '4', suit: 'CLUBS', rank: 8, label: '8', suitSymbol: '♣', isRed: false } },
  ];

  const winner = resolveTrickWinner(trick);
  assert.equal(winner, 1); // 10 of Clubs takes the trick
});

test('calculateContractPenalties calculates correct penalties for Queens and Sheikh', () => {
  const cards: TrixCard[] = [
    { id: '1', suit: 'HEARTS', rank: 12, label: 'Q', suitSymbol: '♥', isRed: true },
    { id: '2', suit: 'SPADES', rank: 12, label: 'Q', suitSymbol: '♠', isRed: false },
    { id: '3', suit: 'HEARTS', rank: 13, label: 'K', suitSymbol: '♥', isRed: true }, // Sheikh
  ];

  const queensPenalties = calculateContractPenalties('BANAT', cards, 1);
  assert.equal(queensPenalties.points, -50); // 2 queens * -25 = -50

  const sheikhPenalties = calculateContractPenalties('SHEIKH_KOBA', cards, 1);
  assert.equal(sheikhPenalties.points, -75);
});

test('initializeTrixGame deals precisely 13 cards to each player at start', () => {
  const game = initializeTrixGame('PARTNERSHIP', 'JOD', 5, 'TestUser');
  assert.equal(game.players.length, 4);
  for (let i = 0; i < 4; i++) {
    assert.equal(game.players[i].hand.length, 13, `Player ${i} must have exactly 13 cards`);
  }
  // Total cards dealt across all players must equal 52
  const totalCards = game.players.reduce((sum: number, p: any) => sum + p.hand.length, 0);
  assert.equal(totalCards, 52);
});

test('getBotMove partnership logic: ducks when partner is winning, dumps penalty cards on opponent', () => {
  const game = initializeTrixGame('PARTNERSHIP', 'JOD', 5, 'TestUser');

  // Set up trick in Banat mode where Opponent (Player 1) is winning with Jack of Spades
  game.currentContract = 'BANAT';
  game.currentTrick = [
    { playerPos: 1, card: { id: 's_j', suit: 'SPADES', rank: 11, label: 'J', suitSymbol: '♠', isRed: false } },
  ];
  game.leadSuit = 'SPADES';

  // Bot in Seat 3 (Team B) has Queen of Hearts and other cards, but is void in Spades
  game.players[3].hand = [
    { id: 'h_q', suit: 'HEARTS', rank: 12, label: 'Q', suitSymbol: '♥', isRed: true }, // Queen!
    { id: 'c_2', suit: 'CLUBS', rank: 2, label: '2', suitSymbol: '♣', isRed: false },
  ];

  // In Partnership mode, Seat 3's partner is Seat 1 (Team B)
  // Since partner (Seat 1) is winning, Bot in Seat 3 must NOT dump queen on partner!
  const moveOnPartner = getBotMove(game, 3, 'EXPERT');
  assert.notEqual(moveOnPartner, 'PASS');
  assert.equal((moveOnPartner as any).rank, 2); // Dumped safe card, kept queen away from teammate!

  // Now change: Me (Player 0 / Team A) is winning with Ace of Spades!
  game.currentTrick = [
    { playerPos: 0, card: { id: 's_a', suit: 'SPADES', rank: 14, label: 'A', suitSymbol: '♠', isRed: false } },
  ];
  // Opponent (Team A) is winning, so Bot in Seat 3 dumps Queen on Team A!
  const moveOnOpponent = getBotMove(game, 3, 'EXPERT');
  assert.notEqual(moveOnOpponent, 'PASS');
  assert.equal((moveOnOpponent as any).rank, 12); // Dumped Queen on opponent!
});
