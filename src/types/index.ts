export type CoinSymbol = 'BTC' | 'ETH' | 'SOL' | 'BNB' | 'XRP';

export type RoundDuration = 15 | 30 | 45 | 60; // 15s, 30s, 45s, 60s in seconds (default 30s)

export type PredictionSide = 'UP' | 'DOWN';

export type RoundStatus = 'BETTING_OPEN' | 'LOCKED' | 'SETTLED';

export interface CoinInfo {
  symbol: CoinSymbol;
  name: string;
  binanceSymbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  decimals: number;
  iconBg: string;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  side: PredictionSide;
  amount: number;
  timestamp: number;
  isUser?: boolean;
}

export interface Round {
  id: string;
  coin: CoinSymbol;
  duration: RoundDuration;
  startTime: number;
  lockTime: number; // 10 seconds before endTime
  endTime: number;
  entryPrice: number;
  exitPrice?: number;
  status: RoundStatus;
  winningSide?: PredictionSide;
  upPool: number;
  downPool: number;
  participants: Participant[];
  serverSeed: string;
  clientSeed: string;
  provablyFairHash: string;
}

export interface UserBet {
  id: string;
  roundId: string;
  coin: CoinSymbol;
  side: PredictionSide;
  amount: number;
  timestamp: number;
  entryPrice: number;
  exitPrice?: number;
  status: 'ACTIVE' | 'WON' | 'LOST';
  payout?: number;
  userIdentifier: string;
  source: 'SITE_BALANCE' | 'WEB3_WALLET';
}

export type EgyptianPaymentMethod =
  | 'VODAFONE_CASH'
  | 'INSTAPAY'
  | 'ETISALAT_CASH'
  | 'ORANGE_CASH'
  | 'FAWRY'
  | 'CRYPTO';

export interface UserProfile {
  id: string;
  email?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  address?: string;
  country?: 'EG' | 'OTHER' | string;
  currency?: 'EGP' | 'USD';
  phoneNumber?: string;
  balance: number;
  walletBalance: number;
  referralCode: string;
  referredBy?: string;
  referralEarnings: number;
  totalBetsPlaced: number;
  totalWonAmount: number;
  totalLostAmount: number;
  createdAt: number;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userAddress?: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency?: 'EGP' | 'USD';
  method?: EgyptianPaymentMethod;
  userAccount?: string;
  network?: 'TRC20' | 'BEP20';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
}

export interface DepositRecord {
  id: string;
  userId: string;
  amount: number;
  currency?: 'EGP' | 'USD';
  method?: EgyptianPaymentMethod;
  senderAccount?: string;
  companyAccount?: string;
  receiptImage?: string;
  network?: 'TRC20' | 'BEP20';
  address?: string;
  txHash?: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  createdAt: number;
}

export interface AdminSettings {
  houseCommission: number; // e.g. 3%
  withdrawalFee: number; // e.g. 1.5%
  minBet: number;
  maxBet: number;
  crashHouseEdge: number; // e.g. 4%
  crashMaxMultiplier: number; // e.g. 100x
  egpRate: number; // 1 USD = egpRate EGP (e.g. 50.0)
  vodafoneCashNumber: string;
  instaPayHandle: string;
  etisalatCashNumber: string;
  orangeCashNumber: string;
  fawryCode: string;
}

export interface ConnectedWalletState {
  isConnected: boolean;
  address: string | null;
  walletName: 'MetaMask' | 'Trust Wallet' | 'Coinbase Wallet' | 'Phantom' | 'WalletConnect' | null;
  chainId: number;
  chainName: string;
  balanceUSDT: number;
}

// --- Crash Game Types ---
export interface CrashHistoryItem {
  id: string;
  multiplier: number;
  hash: string;
  timestamp: number;
}

export interface CrashParticipant {
  id: string;
  name: string;
  avatar: string;
  betAmount: number;
  cashedOut: boolean;
  cashoutMultiplier?: number;
  profit?: number;
  isUser?: boolean;
}

export interface CrashBetSlot {
  amount: number;
  autoCashout: number | null; // e.g. 2.0 or null
  isPlaced: boolean;
  cashedOut: boolean;
  cashoutMultiplier: number | null;
  payout: number | null;
  source: 'SITE_BALANCE' | 'WEB3_WALLET';
}

// --- Sportsbook & Egyptian League Types ---
export interface EgyptianClub {
  id: string;
  nameAr: string;
  nameEn: string;
  shortName: string;
  city: string;
  founded: number;
  primaryColor: string;
  secondaryColor: string;
  badgeSymbol: string;
}

export interface SportsMatch {
  id: string;
  homeTeam: EgyptianClub;
  awayTeam: EgyptianClub;
  league: string; // 'الدوري المصري الممتاز' | 'كأس مصر'
  roundName: string;
  stadium: string;
  status: 'LIVE' | 'UPCOMING' | 'FINISHED';
  minute?: number;
  homeScore: number;
  awayScore: number;
  startTimeText: string;
  odds: {
    home: number; // 1
    draw: number; // X
    away: number; // 2
    over25: number;
    under25: number;
    bttsYes: number;
    bttsNo: number;
  };
  settledResult?: {
    winner: '1' | 'X' | '2';
    totalGoals: number;
    btts: boolean;
  };
}

export interface BetSlipSelection {
  matchId: string;
  matchTitle: string;
  league: string;
  marketType: '1X2' | 'TOTAL_GOALS' | 'BTTS';
  marketLabel: string;
  pick: '1' | 'X' | '2' | 'OVER_25' | 'UNDER_25' | 'BTTS_YES' | 'BTTS_NO';
  pickLabel: string;
  odd: number;
}

export interface SportsBetRecord {
  id: string;
  userId: string;
  type: 'SINGLE' | 'ACCUMULATOR';
  selections: BetSlipSelection[];
  totalOdds: number;
  amount: number;
  potentialPayout: number;
  actualPayout?: number;
  status: 'PENDING' | 'WON' | 'LOST';
  createdAt: number;
  source: 'SITE_BALANCE' | 'WEB3_WALLET';
}

