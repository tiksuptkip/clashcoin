import { SupportedCurrency } from './index';

export type CardSuit = 'HEARTS' | 'DIAMONDS' | 'SPADES' | 'CLUBS';

export type CardRank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface TrixCard {
  id: string;
  suit: CardSuit;
  rank: CardRank;
  label: string; // '2'..'10', 'J', 'Q', 'K', 'A'
  suitSymbol: string; // '♥', '♦', '♠', '♣'
  isRed: boolean;
}

export type TrixGameMode = 'PARTNERSHIP' | 'SOLO';

export type TrixBotDifficulty = 'EASY' | 'MEDIUM' | 'EXPERT';

export type TrixKingdomContract =
  | 'BANAT' // Queens (-25 per queen, -100 total)
  | 'DINARI' // Diamonds (-10 per diamond, -130 total)
  | 'LTOOSH' // Tricks (-15 per trick, -195 total)
  | 'SHEIKH_KOBA' // King of Hearts (-75)
  | 'TRIX'; // Complex building game (+200, +75, +25, -50)

export type PlayerPosition = 0 | 1 | 2 | 3;
// Counter-clockwise playing order (Jawaker Levant standard):
// Position 0 = Bottom (Me / Human User)
// Position 1 = Right (Opponent 1 - Team B in partnership)
// Position 2 = Top (Partner in partnership - Team A, or Opponent 2 in solo)
// Position 3 = Left (Opponent 2 - Team B in partnership)

export interface TrixPlayer {
  id: string;
  name: string;
  avatar: string;
  position: PlayerPosition;
  team: 'TEAM_A' | 'TEAM_B' | 'SOLO';
  isUser: boolean;
  isBot?: boolean;
  hand: TrixCard[];
  tricksWon: TrixCard[][];
  score: number;
  contractScores: Record<TrixKingdomContract, number>;
  queensCount: number;
  diamondsCount: number;
  ltooshCount: number;
  hasSheikhKoba: boolean;
  trixFinishRank?: number; // 1, 2, 3, 4
}

export interface TrixTrickPlay {
  playerPos: PlayerPosition;
  card: TrixCard;
}

export interface TrixBoardSuitState {
  suit: CardSuit;
  jackPlayed: boolean;
  lowRank: number; // 11 when J is played, decreases down to 2
  highRank: number; // 11 when J is played, increases up to 14
  cardsPlayed: TrixCard[];
}

export interface TrixSpectatorBet {
  id: string;
  spectatorId: string;
  spectatorName: string;
  target: 'TEAM_A' | 'TEAM_B' | string; // Team ID or individual Player ID
  targetLabel: string;
  side: 'FOR' | 'AGAINST'; // Bet on them winning (FOR) or losing (AGAINST)
  amount: number;
  currency: SupportedCurrency;
  odds: number;
  status: 'PENDING' | 'WON' | 'LOST';
  potentialPayout: number;
  actualPayout?: number;
  timestamp: number;
}

export interface TrixGameState {
  id: string;
  name: string;
  mode: TrixGameMode;
  currency: SupportedCurrency;
  betAmount: number;
  roomPot: number;
  commissionRate: number; // e.g. 5%
  botDifficulty?: TrixBotDifficulty;
  status:
    | 'LOBBY'
    | 'DEALING'
    | 'SELECTING_CONTRACT'
    | 'SHEIKH_DECLARATION'
    | 'PLAYING_TRICK'
    | 'TRICK_RESOLVED'
    | 'PLAYING_TRIX'
    | 'CONTRACT_END'
    | 'MATCH_END';
  currentKingdomIndex: number; // 0..3 (4 kingdoms)
  kingdomOwnerPos: PlayerPosition;
  currentContract: TrixKingdomContract | null;
  playedContractsByOwner: Record<PlayerPosition, TrixKingdomContract[]>;
  players: TrixPlayer[];
  turnPlayerPos: PlayerPosition;
  currentTrick: TrixTrickPlay[];
  leadSuit: CardSuit | null;
  trixBoard: Record<CardSuit, TrixBoardSuitState>;
  trixFinishOrder: PlayerPosition[];
  sheikhDeclaration: {
    playerWithSheikh: PlayerPosition;
    declared: boolean;
  } | null;
  spectatorBets: TrixSpectatorBet[];
  roundLog: string[];
  winnerTeam?: 'TEAM_A' | 'TEAM_B' | 'SOLO';
  winnerPlayerPos?: PlayerPosition;
  createdAt: number;
}

export interface TrixChatMessage {
  id: string;
  senderPos: PlayerPosition | -1; // -1 for dealer/system
  senderName: string;
  senderAvatar?: string;
  isPartner: boolean;
  isUser: boolean;
  isSystem?: boolean;
  text: string;
  channel: 'ALL' | 'TEAM';
  timestamp: number;
}

export interface TrixAdminStats {
  totalMatches: number;
  volumeJOD: number;
  volumeEGP: number;
  volumeUSDT: number;
  commissionJOD: number;
  commissionEGP: number;
  commissionUSDT: number;
  activeRoomsCount: number;
}

export type TrixPlayerTier = 'GRANDMASTER' | 'MASTER' | 'CHAMPION' | 'DIAMOND' | 'GOLD';

export type TrixLeaderboardTimeframe = 'ALL_TIME' | 'MONTHLY' | 'WEEKLY';

export type TrixLeaderboardSortBy = 'WIN_RATE' | 'TOTAL_SCORE' | 'MATCHES_WON';

export interface TrixLeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  country: string; // e.g. 'JO', 'EG', 'SA', 'AE', 'KW', 'PS', 'LB'
  isUser?: boolean;
  rank: number;
  matchesPlayed: number;
  matchesWon: number;
  winRate: number; // e.g. 78.4
  totalScore: number; // cumulative net score across games
  highestScore: number;
  partnershipWins: number;
  soloScores: number;
  streak: number; // current consecutive win streak
  tier: TrixPlayerTier;
  weeklyScore: number;
  monthlyScore: number;
  weeklyWins: number;
  monthlyWins: number;
  weeklyMatches: number;
  monthlyMatches: number;
  updatedAt: number;
}

