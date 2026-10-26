import {
  CardRank,
  CardSuit,
  PlayerPosition,
  TrixBoardSuitState,
  TrixCard,
  TrixGameMode,
  TrixGameState,
  TrixKingdomContract,
  TrixPlayer,
  TrixSpectatorBet,
  TrixTrickPlay,
  TrixBotDifficulty,
} from '../types/trix';
import { SupportedCurrency } from '../types';

export const SUITS: CardSuit[] = ['SPADES', 'HEARTS', 'DIAMONDS', 'CLUBS'];
export const RANKS: CardRank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export const SUIT_SYMBOLS: Record<CardSuit, string> = {
  SPADES: '♠',
  HEARTS: '♥',
  DIAMONDS: '♦',
  CLUBS: '♣',
};

export const SUIT_NAMES_AR: Record<CardSuit, string> = {
  SPADES: 'سباتي (بستوني)',
  HEARTS: 'كبة (هاص)',
  DIAMONDS: 'ديناري (كارو)',
  CLUBS: 'سبيت (شيريا)',
};

export const CONTRACT_NAMES: Record<
  TrixKingdomContract,
  { ar: string; en: string; icon: string; penaltyDescAr: string; penaltyDescEn: string }
> = {
  BANAT: {
    ar: 'بنات (Al Banat)',
    en: 'Queens (Banat)',
    icon: '👸',
    penaltyDescAr: '-25 نقطة لكل بنت مأخوذة (-100 إجمالي)',
    penaltyDescEn: '-25 pts per Queen (-100 total)',
  },
  DINARI: {
    ar: 'ديناري (Al Dinari)',
    en: 'Diamonds (Dinari)',
    icon: '♦️',
    penaltyDescAr: '-10 نقاط لكل ورقة ديناري (-130 إجمالي)',
    penaltyDescEn: '-10 pts per Diamond (-130 total)',
  },
  LTOOSH: {
    ar: 'لطوش (Ltoosh)',
    en: 'Tricks (Ltoosh)',
    icon: '🎴',
    penaltyDescAr: '-15 نقطة لكل لطش / أكلة (-195 إجمالي)',
    penaltyDescEn: '-15 pts per trick taken (-195 total)',
  },
  SHEIKH_KOBA: {
    ar: 'شيخ الكبة (King of Hearts)',
    en: 'Sheikh Al Koba (King of Hearts)',
    icon: '👑',
    penaltyDescAr: '-75 نقطة لمن يأكل شيخ الكبة ♥K',
    penaltyDescEn: '-75 pts for taking King of Hearts ♥K',
  },
  TRIX: {
    ar: 'تركس معقد (Al Trix)',
    en: 'Trix Complex (Building)',
    icon: '🏛️',
    penaltyDescAr: 'الأول +200، الثاني +75، الثالث +25، الرابع -50',
    penaltyDescEn: '1st +200, 2nd +75, 3rd +25, 4th -50',
  },
};

export const RANK_LABELS: Record<CardRank, string> = {
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
};

// Preset bot avatars and names for Jawaker style
export const BOT_NAMES = [
  { name: 'New-LUX01E', nameEn: 'New-LUX01E', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=LUX01E' },
  { name: 'New-688A80', nameEn: 'New-688A80', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=688A80' },
  { name: 'New-B3PZNJ', nameEn: 'New-B3PZNJ', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=B3PZNJ' },
  { name: 'New-K992FA', nameEn: 'New-K992FA', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=K992FA' },
];


/**
 * Generates a full standard 52-card deck
 */
export function createDeck(): TrixCard[] {
  const deck: TrixCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}_${rank}`,
        suit,
        rank,
        label: RANK_LABELS[rank],
        suitSymbol: SUIT_SYMBOLS[suit],
        isRed: suit === 'HEARTS' || suit === 'DIAMONDS',
      });
    }
  }
  return deck;
}

/**
 * Fisher-Yates card shuffle
 */
export function shuffleDeck(deck: TrixCard[]): TrixCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Sort cards by suit and rank (High to Low: A down to 2)
 */
export function sortHand(cards: TrixCard[]): TrixCard[] {
  const suitOrder: Record<CardSuit, number> = {
    SPADES: 0,
    HEARTS: 1,
    DIAMONDS: 2,
    CLUBS: 3,
  };
  return [...cards].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    return b.rank - a.rank;
  });
}

/**
 * Initialize 4-player game state
 */
export function initializeTrixGame(
  mode: TrixGameMode,
  currency: SupportedCurrency,
  betAmount: number,
  userName: string,
  userAvatar?: string,
  commissionRate: number = 5.0,
  botDifficulty: TrixBotDifficulty = 'MEDIUM'
): TrixGameState {
  const deck = shuffleDeck(createDeck());

  // 13 cards per player
  const rawHands: TrixCard[][] = [
    sortHand(deck.slice(0, 13)),
    sortHand(deck.slice(13, 26)),
    sortHand(deck.slice(26, 39)),
    sortHand(deck.slice(39, 52)),
  ];

  // Find who holds the 7 of Hearts (HEARTS_7) - starts the first kingdom
  let starterPos: PlayerPosition = 0;
  for (let i = 0; i < 4; i++) {
    if (rawHands[i].some((c) => c.suit === 'HEARTS' && c.rank === 7)) {
      starterPos = i as PlayerPosition;
      break;
    }
  }

  const players: TrixPlayer[] = [
    {
      id: 'player_me',
      name: userName || 'أنت (اللاعب)',
      avatar: userAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=MePlayer',
      position: 0,
      team: mode === 'PARTNERSHIP' ? 'TEAM_A' : 'SOLO',
      isUser: true,
      isBot: false,
      hand: rawHands[0],
      tricksWon: [],
      score: 0,
      contractScores: { BANAT: 0, DINARI: 0, LTOOSH: 0, SHEIKH_KOBA: 0, TRIX: 0 },
      queensCount: 0,
      diamondsCount: 0,
      ltooshCount: 0,
      hasSheikhKoba: false,
    },
    {
      id: 'bot_right',
      name: BOT_NAMES[0].name,
      avatar: BOT_NAMES[0].avatar,
      position: 1,
      team: mode === 'PARTNERSHIP' ? 'TEAM_B' : 'SOLO',
      isUser: false,
      isBot: true,
      hand: rawHands[1],
      tricksWon: [],
      score: 0,
      contractScores: { BANAT: 0, DINARI: 0, LTOOSH: 0, SHEIKH_KOBA: 0, TRIX: 0 },
      queensCount: 0,
      diamondsCount: 0,
      ltooshCount: 0,
      hasSheikhKoba: false,
    },
    {
      id: 'bot_top',
      name: BOT_NAMES[1].name,
      avatar: BOT_NAMES[1].avatar,
      position: 2,
      team: mode === 'PARTNERSHIP' ? 'TEAM_A' : 'SOLO',
      isUser: false,
      isBot: true,
      hand: rawHands[2],
      tricksWon: [],
      score: 0,
      contractScores: { BANAT: 0, DINARI: 0, LTOOSH: 0, SHEIKH_KOBA: 0, TRIX: 0 },
      queensCount: 0,
      diamondsCount: 0,
      ltooshCount: 0,
      hasSheikhKoba: false,
    },
    {
      id: 'bot_left',
      name: BOT_NAMES[2].name,
      avatar: BOT_NAMES[2].avatar,
      position: 3,
      team: mode === 'PARTNERSHIP' ? 'TEAM_B' : 'SOLO',
      isUser: false,
      isBot: true,
      hand: rawHands[3],
      tricksWon: [],
      score: 0,
      contractScores: { BANAT: 0, DINARI: 0, LTOOSH: 0, SHEIKH_KOBA: 0, TRIX: 0 },
      queensCount: 0,
      diamondsCount: 0,
      ltooshCount: 0,
      hasSheikhKoba: false,
    },
  ];

  const emptyTrixBoard: Record<CardSuit, TrixBoardSuitState> = {
    SPADES: { suit: 'SPADES', jackPlayed: false, lowRank: 11, highRank: 11, cardsPlayed: [] },
    HEARTS: { suit: 'HEARTS', jackPlayed: false, lowRank: 11, highRank: 11, cardsPlayed: [] },
    DIAMONDS: { suit: 'DIAMONDS', jackPlayed: false, lowRank: 11, highRank: 11, cardsPlayed: [] },
    CLUBS: { suit: 'CLUBS', jackPlayed: false, lowRank: 11, highRank: 11, cardsPlayed: [] },
  };

  const starterName = players[starterPos].name;

  return {
    id: 'trix_room_' + Math.random().toString(36).substring(2, 9),
    name: mode === 'PARTNERSHIP' ? 'طاولة تركس شراكة أردنية 🇯🇴' : 'طاولة تركس فردي 🏆',
    mode,
    currency,
    betAmount,
    roomPot: Number((betAmount * 4).toFixed(2)),
    commissionRate,
    botDifficulty,
    status: 'SELECTING_CONTRACT',
    currentKingdomIndex: 0,
    kingdomOwnerPos: starterPos,
    currentContract: null,
    playedContractsByOwner: {
      0: [],
      1: [],
      2: [],
      3: [],
    },
    players,
    turnPlayerPos: starterPos,
    currentTrick: [],
    leadSuit: null,
    trixBoard: emptyTrixBoard,
    trixFinishOrder: [],
    sheikhDeclaration: null,
    spectatorBets: [],
    roundLog: [
      `تم توزيع 13 ورقة لكل لاعب. اللاعب ${starterName} يملك 7 الكبة ♥7 وهو صاحب المملكة الأولى!`,
    ],
    createdAt: Date.now(),
  };
}

/**
 * Check if a card can be legally played in the current trick-taking contract
 */
export function isValidTrickCard(
  card: TrixCard,
  playerHand: TrixCard[],
  leadSuit: CardSuit | null,
  currentContract: TrixKingdomContract,
  sheikhHasBeenPlayed: boolean
): boolean {
  // If player is leading the trick (first card):
  if (!leadSuit) {
    if (currentContract === 'SHEIKH_KOBA') {
      // Rule of Sheikh: Hearts cannot be led unless King of Hearts was already played OR player holds only Hearts
      if (card.suit === 'HEARTS' && !sheikhHasBeenPlayed) {
        const hasNonHearts = playerHand.some((c) => c.suit !== 'HEARTS');
        if (hasNonHearts) return false;
      }
    }
    return true;
  }

  // If following the trick:
  const hasLeadSuit = playerHand.some((c) => c.suit === leadSuit);
  if (hasLeadSuit) {
    // MUST follow suit!
    return card.suit === leadSuit;
  }

  // If void in lead suit, can play any card from hand
  return true;
}

/**
 * Check if a card can be legally placed on the Trix building board
 */
export function isValidTrixCard(card: TrixCard, board: Record<CardSuit, TrixBoardSuitState>): boolean {
  const suitState = board[card.suit];

  // Jack starts the suit column
  if (card.rank === 11) {
    return !suitState.jackPlayed;
  }

  // If Jack has not been played yet, cannot play other ranks in that suit
  if (!suitState.jackPlayed) {
    return false;
  }

  // Card builds UP: Q (12), K (13), A (14)
  if (card.rank === suitState.highRank + 1 && card.rank <= 14) {
    return true;
  }

  // Card builds DOWN: 10 down to 2
  if (card.rank === suitState.lowRank - 1 && card.rank >= 2) {
    return true;
  }

  return false;
}

/**
 * Check if a player has ANY playable card in the Trix complex building contract
 */
export function playerHasPlayableTrixCard(
  hand: TrixCard[],
  board: Record<CardSuit, TrixBoardSuitState>
): boolean {
  return hand.some((c) => isValidTrixCard(c, board));
}

/**
 * Determine winner of a completed 4-card trick
 */
export function resolveTrickWinner(trick: TrixTrickPlay[]): PlayerPosition {
  if (trick.length === 0) return 0;
  const leadSuit = trick[0].card.suit;
  let highestRank = -1;
  let winningPos: PlayerPosition = trick[0].playerPos;

  for (const play of trick) {
    if (play.card.suit === leadSuit && play.card.rank > highestRank) {
      highestRank = play.card.rank;
      winningPos = play.playerPos;
    }
  }

  return winningPos;
}

/**
 * Calculate penalties from taken cards in a contract
 */
export function calculateContractPenalties(
  contract: TrixKingdomContract,
  cardsTaken: TrixCard[],
  tricksCount: number
): { points: number; queens: number; diamonds: number; hasSheikh: boolean } {
  let queens = 0;
  let diamonds = 0;
  let hasSheikh = false;

  for (const c of cardsTaken) {
    if (c.rank === 12) queens++;
    if (c.suit === 'DIAMONDS') diamonds++;
    if (c.suit === 'HEARTS' && c.rank === 13) hasSheikh = true;
  }

  let points = 0;
  switch (contract) {
    case 'BANAT':
      points = -(queens * 25);
      break;
    case 'DINARI':
      points = -(diamonds * 10);
      break;
    case 'LTOOSH':
      points = -(tricksCount * 15);
      break;
    case 'SHEIKH_KOBA':
      points = hasSheikh ? -75 : 0;
      break;
    default:
      points = 0;
  }

  return { points, queens, diamonds, hasSheikh };
}

/**
 * Smart Bot AI Decision Maker
 */
export function getBotMove(
  state: TrixGameState,
  botPos: PlayerPosition,
  difficulty?: TrixBotDifficulty
): TrixCard | 'PASS' {
  const bot = state.players[botPos];
  if (!bot || bot.hand.length === 0) return 'PASS';

  const diff = difficulty || state.botDifficulty || 'MEDIUM';

  // --- TRIX COMPLEX BUILDING CONTRACT ---
  if (state.currentContract === 'TRIX') {
    const validCards = bot.hand.filter((c) => isValidTrixCard(c, state.trixBoard));
    if (validCards.length === 0) return 'PASS';

    // Easy difficulty: plays a random valid card
    if (diff === 'EASY') {
      return validCards[Math.floor(Math.random() * validCards.length)];
    }

    // Medium & Expert preference:
    // 1. Play cards that continue bot's own sequence
    // 2. Play Jacks if bot has following cards (10 or Q)
    const prioritized = validCards.sort((a, b) => {
      // Check if bot has adjacent cards
      const aHasNext = bot.hand.some((c) => c.suit === a.suit && (c.rank === a.rank + 1 || c.rank === a.rank - 1));
      const bHasNext = bot.hand.some((c) => c.suit === b.suit && (c.rank === b.rank + 1 || c.rank === b.rank - 1));
      if (aHasNext && !bHasNext) return -1;
      if (!aHasNext && bHasNext) return 1;

      if (diff === 'EXPERT') {
        // Prioritize unloading suits in which the bot holds the most cards
        const aSuitCount = bot.hand.filter((c) => c.suit === a.suit).length;
        const bSuitCount = bot.hand.filter((c) => c.suit === b.suit).length;
        if (aSuitCount !== bSuitCount) return bSuitCount - aSuitCount;
      }
      return a.rank - b.rank;
    });

    return prioritized[0];
  }

  // --- TRICK-TAKING CONTRACTS (BANAT, DINARI, LTOOSH, SHEIKH_KOBA) ---
  const currentTrick = state.currentTrick;
  const leadSuit = currentTrick.length > 0 ? currentTrick[0].card.suit : null;
  const sheikhAlreadyPlayed = state.players.some((p) =>
    p.tricksWon.some((trick) => trick.some((c) => c.suit === 'HEARTS' && c.rank === 13))
  );

  const legalCards = bot.hand.filter((c) =>
    isValidTrickCard(c, bot.hand, leadSuit, state.currentContract!, sheikhAlreadyPlayed)
  );

  if (legalCards.length === 0) return bot.hand[0];

  // In EASY mode, bot makes occasional mistakes (35% random legal play)
  if (diff === 'EASY' && Math.random() < 0.35) {
    return legalCards[Math.floor(Math.random() * legalCards.length)];
  }

  // Helper to identify team partner
  const isPartner = (pos: PlayerPosition) => {
    if (state.mode !== 'PARTNERSHIP') return false;
    return (botPos === 0 && pos === 2) || (botPos === 2 && pos === 0) || (botPos === 1 && pos === 3) || (botPos === 3 && pos === 1);
  };

  // 1. LEADING A NEW TRICK
  if (currentTrick.length === 0) {
    switch (state.currentContract) {
      case 'BANAT': {
        // Lead low cards of suits where bot has no Queens, or lead Ace/King to catch non-Queens
        const nonQueens = legalCards.filter((c) => c.rank !== 12);
        if (nonQueens.length > 0) {
          // Play lowest rank card to avoid winning unwanted queens
          return nonQueens.sort((a, b) => a.rank - b.rank)[0];
        }
        return legalCards[0];
      }
      case 'DINARI': {
        // Avoid leading Diamonds if possible
        const nonDiamonds = legalCards.filter((c) => c.suit !== 'DIAMONDS');
        if (nonDiamonds.length > 0) {
          return nonDiamonds.sort((a, b) => a.rank - b.rank)[0];
        }
        return legalCards.sort((a, b) => a.rank - b.rank)[0];
      }
      case 'SHEIKH_KOBA': {
        // Never lead King of Hearts! Lead low safe cards
        const safeCards = legalCards.filter((c) => !(c.suit === 'HEARTS' && c.rank === 13));
        if (safeCards.length > 0) {
          return safeCards.sort((a, b) => a.rank - b.rank)[0];
        }
        return legalCards[0];
      }
      case 'LTOOSH':
      default: {
        // Lead lowest cards to avoid winning tricks
        return legalCards.sort((a, b) => a.rank - b.rank)[0];
      }
    }
  }

  // 2. FOLLOWING A TRICK
  const currentlyWinningPos = resolveTrickWinner(currentTrick);
  const partnerIsWinning = isPartner(currentlyWinningPos);

  // Case A: Void in lead suit (can slough / dump any card!)
  if (!bot.hand.some((c) => c.suit === leadSuit)) {
    if (partnerIsWinning) {
      // Partner takes the trick! Discard high harmless cards or low cards
      if (state.currentContract === 'BANAT') {
        // Do NOT dump Queens on partner!
        const nonQueens = legalCards.filter((c) => c.rank !== 12);
        return nonQueens.sort((a, b) => b.rank - a.rank)[0] || legalCards[0];
      }
      if (state.currentContract === 'DINARI') {
        // Do NOT dump Diamonds on partner!
        const nonDiamonds = legalCards.filter((c) => c.suit !== 'DIAMONDS');
        return nonDiamonds.sort((a, b) => b.rank - a.rank)[0] || legalCards[0];
      }
      if (state.currentContract === 'SHEIKH_KOBA') {
        // NEVER dump Sheikh on partner!
        const nonSheikh = legalCards.filter((c) => !(c.suit === 'HEARTS' && c.rank === 13));
        return nonSheikh.sort((a, b) => b.rank - a.rank)[0] || legalCards[0];
      }
      // In Ltoosh, dump highest card to get rid of it
      return legalCards.sort((a, b) => b.rank - a.rank)[0];
    } else {
      // Opponent is winning! DUMP PENALTY CARDS ON THEM!
      if (state.currentContract === 'BANAT') {
        const queens = legalCards.filter((c) => c.rank === 12);
        if (queens.length > 0) return queens[0]; // Dump Queen on opponent!
      }
      if (state.currentContract === 'DINARI') {
        const diamonds = legalCards.filter((c) => c.suit === 'DIAMONDS');
        if (diamonds.length > 0) return diamonds.sort((a, b) => b.rank - a.rank)[0]; // Dump Ace/King of Diamonds
      }
      if (state.currentContract === 'SHEIKH_KOBA') {
        const sheikh = legalCards.find((c) => c.suit === 'HEARTS' && c.rank === 13);
        if (sheikh) return sheikh; // Dump King of Hearts on opponent!
      }
      // Dump highest card
      return legalCards.sort((a, b) => b.rank - a.rank)[0];
    }
  }

  // Case B: Must follow lead suit
  // Try to play lowest card to avoid winning penalty tricks
  const highestOnTable = Math.max(...currentTrick.filter((t) => t.card.suit === leadSuit).map((t) => t.card.rank));

  if (partnerIsWinning) {
    // Partner is already winning trick; play lowest card to let partner win cheaply
    return legalCards.sort((a, b) => a.rank - b.rank)[0];
  } else {
    // Opponent is winning; duck under highest card if possible
    const lowerCards = legalCards.filter((c) => c.rank < highestOnTable);
    if (lowerCards.length > 0) {
      // Play highest of the lower cards (duck safely)
      return lowerCards.sort((a, b) => b.rank - a.rank)[0];
    }
    // Forced to overtake; play lowest of the winning cards
    return legalCards.sort((a, b) => a.rank - b.rank)[0];
  }
}
