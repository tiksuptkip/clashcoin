import { CoinSymbol, SupportedCurrency } from './index';

export type TournamentStatus = 'REGISTRATION_OPEN' | 'STARTING_SOON' | 'IN_PROGRESS' | 'COMPLETED';

export type TournamentTier = 'ROOKIE' | 'CHALLENGER' | 'MASTER' | 'HIGH_ROLLER';

export interface TournamentParticipant {
  id: string;
  name: string;
  avatar: string;
  country?: string;
  isUser?: boolean;
  seed: number; // 1 to 8
  score: number; // predictions won
  isEliminated: boolean;
  payoutWon?: number;
}

export interface TournamentMatchup {
  id: string;
  roundNumber: number; // 1 = Quarterfinals, 2 = Semifinals, 3 = Grand Final
  roundNameAr: string;
  roundNameEn: string;
  matchIndex: number;
  player1: TournamentParticipant | null;
  player2: TournamentParticipant | null;
  player1Score: number;
  player2Score: number;
  winnerId?: string;
  status: 'PENDING' | 'LIVE' | 'COMPLETED';
  coin: CoinSymbol;
  livePrediction?: {
    roundIndex: number;
    p1Choice?: 'UP' | 'DOWN';
    p2Choice?: 'UP' | 'DOWN';
    startPrice: number;
    currentPrice: number;
    timeLeft: number;
  };
}

export interface CryptoTournament {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  coin: CoinSymbol;
  tier: TournamentTier;
  maxParticipants: number;
  registeredCount: number;
  entryFee: number;
  currency: SupportedCurrency;
  guaranteedPrizePool: number;
  currentPrizePool: number;
  prizeDistribution: {
    first: number; // % e.g. 60
    second: number; // % e.g. 25
    thirdFourth: number; // % e.g. 15
  };
  startTime: number; // timestamp
  estimatedDurationMins: number;
  status: TournamentStatus;
  participants: TournamentParticipant[];
  matches: TournamentMatchup[];
  winnerId?: string;
  runnerUpId?: string;
  userRegistered?: boolean;
}
