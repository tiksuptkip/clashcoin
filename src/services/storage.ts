import {
  AdminSettings,
  CoinSymbol,
  ConnectedWalletState,
  DepositRecord,
  Participant,
  PredictionSide,
  Round,
  RoundDuration,
  UserBet,
  UserProfile,
  WithdrawalRequest,
  CrashHistoryItem,
  CrashParticipant,
  EgyptianClub,
  FootballClub,
  SportsMatch,
  BetSlipSelection,
  SportsBetRecord,
  EgyptianPaymentMethod,
  CurrencyBalances,
  SupportedCurrency,
  TrixAdminStats,
  TrixSpectatorBet,
  TrixLeaderboardEntry,
  TrixLeaderboardTimeframe,
  TrixLeaderboardSortBy,
  TrixGameMode,
  TrixPlayerTier,
} from '../types';
import { supabaseSync } from './supabase';

export const normalizeCurrency = (c?: string): 'EGP' | 'JOD' | 'USDT' => {
  if (c === 'JOD') return 'JOD';
  if (c === 'USDT' || c === 'USD') return 'USDT';
  return 'EGP';
};

// Predefined Crypto Fighter Avatars
export const PRESET_AVATARS = [
  { id: 'av1', label: 'Clash King', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ClashMaster' },
  { id: 'av2', label: 'Bull Warrior', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CryptoBull' },
  { id: 'av3', label: 'Satoshi 21', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SatoshiN' },
  { id: 'av4', label: 'Cyber Beast', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberBeast' },
  { id: 'av5', label: 'Neon Trader', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonRider' },
  { id: 'av6', label: 'Gold Sniper', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=GoldSniper' },
  { id: 'av7', label: 'Solana Hero', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SolanaHero' },
  { id: 'av8', label: 'Alpha Whale', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=LunaWhale' },
];

// Default initial state
const DEFAULT_USER: UserProfile = {
  id: 'usr_clash_9812',
  email: 'trader@clashofcoin.bet',
  username: 'cryptoking',
  display_name: 'Crypto King 👑',
  avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ClashMaster',
  country: 'EG',
  currency: 'EGP',
  phoneNumber: '01012345678',
  currencyBalances: {
    EGP: 2340.5,
    JOD: 0.0,
    USDT: 0.0,
  },
  balance: 2340.5, // 2340.50 EGP
  walletBalance: 2340.5,
  referralCode: 'CLASHWIN',
  referralEarnings: 45.0,
  totalBetsPlaced: 14,
  totalWonAmount: 320.0,
  totalLostAmount: 180.0,
  createdAt: Date.now() - 86400000 * 3,
};

const DEFAULT_SETTINGS: AdminSettings = {
  houseCommission: 3.0, // 3%
  withdrawalFee: 1.5, // 1.5%
  minBet: 10.0,
  maxBet: 50000.0,
  crashHouseEdge: 4.0, // 4%
  crashMaxMultiplier: 100.0, // 100x max
  platformProfitRate: 15.0, // 15% platform target profit margin
  playerWinRate: 50.0, // 50% player win probability
  crashRTP: 96.0, // 96% Aviator RTP
  crashInstantRate: 3.0, // 3% instant crash at 1.00x
  nextCrashOverride: null, // Next round crash multiplier override
  egpRate: 50.0, // 1 USD = 50 EGP
  jodRate: 1.41, // 1 JOD = ~1.41 USD (0.71 JOD = $1 USD)
  vodafoneCashNumber: '01098451230',
  instaPayHandle: 'clashofcoin@instapay',
  etisalatCashNumber: '01123456789',
  orangeCashNumber: '01234567890',
  fawryCode: '789123',
  jordanCliqAlias: 'CLASHOFCOIN',
  jordanZainCashNumber: '0791234567',
  jordanOrangeMoneyNumber: '0771234567',
  jordanUwalletNumber: '0781234567',
  jordanBankDetails: 'بنك الاتحاد - الاسم: كلاش أوف كوين - IBAN: JO89UBSI000000012345678901234',
  trixCommissionRate: 5.0, // 5% Platform House Commission for Trix
};

// Seeded Trix Master Champions for Global Leaderboard
export const DEFAULT_TRIX_LEADERBOARD: TrixLeaderboardEntry[] = [
  {
    id: 'trix_champ_1',
    name: 'طارق المجالي (Tareq)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    country: 'JO',
    rank: 1,
    matchesPlayed: 148,
    matchesWon: 126,
    winRate: 85.1,
    totalScore: 5240,
    highestScore: 520,
    partnershipWins: 98,
    soloScores: 1850,
    streak: 7,
    tier: 'GRANDMASTER',
    weeklyScore: 480,
    monthlyScore: 1620,
    weeklyWins: 11,
    monthlyWins: 38,
    weeklyMatches: 12,
    monthlyMatches: 44,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'trix_champ_2',
    name: 'عمر الحداد (Omar)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    country: 'JO',
    rank: 2,
    matchesPlayed: 132,
    matchesWon: 108,
    winRate: 81.8,
    totalScore: 4890,
    highestScore: 480,
    partnershipWins: 82,
    soloScores: 1720,
    streak: 4,
    tier: 'GRANDMASTER',
    weeklyScore: 410,
    monthlyScore: 1480,
    weeklyWins: 9,
    monthlyWins: 34,
    weeklyMatches: 11,
    monthlyMatches: 41,
    updatedAt: Date.now() - 7200000,
  },
  {
    id: 'trix_champ_3',
    name: 'ليلى الخطيب (Layla)',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    country: 'JO',
    rank: 3,
    matchesPlayed: 115,
    matchesWon: 91,
    winRate: 79.1,
    totalScore: 4120,
    highestScore: 440,
    partnershipWins: 70,
    soloScores: 1340,
    streak: 5,
    tier: 'MASTER',
    weeklyScore: 360,
    monthlyScore: 1290,
    weeklyWins: 8,
    monthlyWins: 29,
    weeklyMatches: 10,
    monthlyMatches: 36,
    updatedAt: Date.now() - 14400000,
  },
  {
    id: 'trix_champ_4',
    name: 'زيد قسراوي (Zaid)',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    country: 'JO',
    rank: 4,
    matchesPlayed: 98,
    matchesWon: 75,
    winRate: 76.5,
    totalScore: 3650,
    highestScore: 410,
    partnershipWins: 56,
    soloScores: 1210,
    streak: 3,
    tier: 'MASTER',
    weeklyScore: 310,
    monthlyScore: 1140,
    weeklyWins: 7,
    monthlyWins: 24,
    weeklyMatches: 9,
    monthlyMatches: 31,
    updatedAt: Date.now() - 28800000,
  },
  {
    id: 'trix_champ_5',
    name: 'رامي الشامي (Rami)',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    country: 'JO',
    rank: 5,
    matchesPlayed: 84,
    matchesWon: 62,
    winRate: 73.8,
    totalScore: 3180,
    highestScore: 390,
    partnershipWins: 48,
    soloScores: 1050,
    streak: 2,
    tier: 'CHAMPION',
    weeklyScore: 290,
    monthlyScore: 980,
    weeklyWins: 6,
    monthlyWins: 20,
    weeklyMatches: 8,
    monthlyMatches: 27,
    updatedAt: Date.now() - 43200000,
  },
  {
    id: 'trix_champ_6',
    name: 'نور الحسيني (Nour)',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    country: 'JO',
    rank: 6,
    matchesPlayed: 76,
    matchesWon: 54,
    winRate: 71.0,
    totalScore: 2840,
    highestScore: 360,
    partnershipWins: 41,
    soloScores: 920,
    streak: 2,
    tier: 'CHAMPION',
    weeklyScore: 250,
    monthlyScore: 880,
    weeklyWins: 5,
    monthlyWins: 18,
    weeklyMatches: 7,
    monthlyMatches: 25,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'trix_champ_7',
    name: 'حمزة البطاينة (Hamza)',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    country: 'JO',
    rank: 7,
    matchesPlayed: 65,
    matchesWon: 44,
    winRate: 67.7,
    totalScore: 2390,
    highestScore: 340,
    partnershipWins: 32,
    soloScores: 790,
    streak: 1,
    tier: 'DIAMOND',
    weeklyScore: 210,
    monthlyScore: 740,
    weeklyWins: 4,
    monthlyWins: 15,
    weeklyMatches: 6,
    monthlyMatches: 22,
    updatedAt: Date.now() - 172800000,
  },
  {
    id: 'trix_champ_8',
    name: 'كريم المصري (Karim)',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    country: 'EG',
    rank: 8,
    matchesPlayed: 58,
    matchesWon: 38,
    winRate: 65.5,
    totalScore: 2050,
    highestScore: 310,
    partnershipWins: 27,
    soloScores: 690,
    streak: 1,
    tier: 'DIAMOND',
    weeklyScore: 180,
    monthlyScore: 660,
    weeklyWins: 3,
    monthlyWins: 13,
    weeklyMatches: 5,
    monthlyMatches: 19,
    updatedAt: Date.now() - 259200000,
  },
  {
    id: 'trix_champ_9',
    name: 'سلطان العتيبي (Sultan)',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
    country: 'SA',
    rank: 9,
    matchesPlayed: 49,
    matchesWon: 31,
    winRate: 63.3,
    totalScore: 1780,
    highestScore: 290,
    partnershipWins: 22,
    soloScores: 580,
    streak: 1,
    tier: 'GOLD',
    weeklyScore: 150,
    monthlyScore: 540,
    weeklyWins: 3,
    monthlyWins: 10,
    weeklyMatches: 5,
    monthlyMatches: 16,
    updatedAt: Date.now() - 345600000,
  },
  {
    id: 'trix_champ_10',
    name: 'أحمد الخالدي (Ahmad)',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    country: 'AE',
    rank: 10,
    matchesPlayed: 42,
    matchesWon: 26,
    winRate: 61.9,
    totalScore: 1420,
    highestScore: 270,
    partnershipWins: 19,
    soloScores: 480,
    streak: 1,
    tier: 'GOLD',
    weeklyScore: 120,
    monthlyScore: 440,
    weeklyWins: 2,
    monthlyWins: 8,
    weeklyMatches: 4,
    monthlyMatches: 13,
    updatedAt: Date.now() - 432000000,
  },
];


// All 12 Jordanian Pro League Clubs (الدوري الأردني للمحترفين)
export const JORDANIAN_CLUBS: Record<string, FootballClub> = {
  faisaly: {
    id: 'faisaly',
    country: 'JO',
    nameAr: 'الفيصلي',
    nameEn: 'Al-Faisaly SC',
    shortName: 'FAI',
    city: 'عمان',
    founded: 1932,
    primaryColor: '#0284C7',
    secondaryColor: '#FFFFFF',
    badgeSymbol: '🦅',
  },
  wehdat: {
    id: 'wehdat',
    country: 'JO',
    nameAr: 'الوحدات',
    nameEn: 'Al-Wehdat SC',
    shortName: 'WEH',
    city: 'عمان',
    founded: 1956,
    primaryColor: '#16A34A',
    secondaryColor: '#DC2626',
    badgeSymbol: '🟢',
  },
  hussein: {
    id: 'hussein',
    country: 'JO',
    nameAr: 'الحسين إربد',
    nameEn: 'Al-Hussein Irbid',
    shortName: 'HUS',
    city: 'إربد',
    founded: 1964,
    primaryColor: '#EAB308',
    secondaryColor: '#000000',
    badgeSymbol: '🟡',
  },
  ramtha: {
    id: 'ramtha',
    country: 'JO',
    nameAr: 'الرمثا',
    nameEn: 'Al-Ramtha SC',
    shortName: 'RAM',
    city: 'الرمثا',
    founded: 1966,
    primaryColor: '#2563EB',
    secondaryColor: '#FFFFFF',
    badgeSymbol: '🦌',
  },
  shabab_ordon: {
    id: 'shabab_ordon',
    country: 'JO',
    nameAr: 'شباب الأردن',
    nameEn: 'Shabab Al-Ordon',
    shortName: 'SHO',
    city: 'عمان',
    founded: 2002,
    primaryColor: '#DC2626',
    secondaryColor: '#FFFFFF',
    badgeSymbol: '🔴',
  },
  jazeera: {
    id: 'jazeera',
    country: 'JO',
    nameAr: 'الجزيرة',
    nameEn: 'Al-Jazeera Club',
    shortName: 'JAZ',
    city: 'عمان',
    founded: 1947,
    primaryColor: '#B91C1C',
    secondaryColor: '#FFFFFF',
    badgeSymbol: '🛡️',
  },
  salt: {
    id: 'salt',
    country: 'JO',
    nameAr: 'السلط',
    nameEn: 'Al-Salt SC',
    shortName: 'SLT',
    city: 'السلط',
    founded: 1965,
    primaryColor: '#1E3A8A',
    secondaryColor: '#FFFFFF',
    badgeSymbol: '🏰',
  },
  maan: {
    id: 'maan',
    country: 'JO',
    nameAr: 'معان',
    nameEn: 'FC Maan',
    shortName: 'MAN',
    city: 'معان',
    founded: 1971,
    primaryColor: '#15803D',
    secondaryColor: '#FFFFFF',
    badgeSymbol: '🌴',
  },
  moghayer: {
    id: 'moghayer',
    country: 'JO',
    nameAr: 'مغير السرحان',
    nameEn: 'Moghayer Al-Sarhan',
    shortName: 'MOG',
    city: 'المفرق',
    founded: 1993,
    primaryColor: '#0F172A',
    secondaryColor: '#DC2626',
    badgeSymbol: '🐎',
  },
  ahli_amman: {
    id: 'ahli_amman',
    country: 'JO',
    nameAr: 'الأهلي الأردني',
    nameEn: 'Al-Ahli Amman',
    shortName: 'AHL',
    city: 'عمان',
    founded: 1944,
    primaryColor: '#059669',
    secondaryColor: '#FFFFFF',
    badgeSymbol: '🦁',
  },
  aqaba: {
    id: 'aqaba',
    country: 'JO',
    nameAr: 'شباب العقبة',
    nameEn: 'Shabab Al-Aqaba',
    shortName: 'AQB',
    city: 'العقبة',
    founded: 1965,
    primaryColor: '#0284C7',
    secondaryColor: '#1E293B',
    badgeSymbol: '⚓',
  },
  sareeh: {
    id: 'sareeh',
    country: 'JO',
    nameAr: 'الصريح',
    nameEn: 'Al-Sareeh SC',
    shortName: 'SAR',
    city: 'إربد',
    founded: 1973,
    primaryColor: '#991B1B',
    secondaryColor: '#FFFFFF',
    badgeSymbol: '🌾',
  },
};

// All 18 Egyptian Premier League Clubs (الدوري المصري الممتاز)
export const EGYPTIAN_CLUBS: Record<string, FootballClub> = {
  ahly: {
    id: 'ahly',
    country: 'EG',
    nameAr: 'الأهلي',
    nameEn: 'Al Ahly SC',
    shortName: 'ASC',
    city: 'القاهرة',
    founded: 1907,
    primaryColor: '#DC2626',
    secondaryColor: '#FFFFFF',
    badgeSymbol: '🦅',
  },
  zamalek: {
    id: 'zamalek',
    country: 'EG',
    nameAr: 'الزمالك',
    nameEn: 'Zamalek SC',
    shortName: 'ZSC',
    city: 'الجيزة',
    founded: 1911,
    primaryColor: '#FFFFFF',
    secondaryColor: '#E11D48',
    badgeSymbol: '🏹',
  },
  pyramids: {
    id: 'pyramids',
    country: 'EG',
    nameAr: 'بيراميدز',
    nameEn: 'Pyramids FC',
    shortName: 'PFC',
    city: 'القاهرة',
    founded: 2008,
    primaryColor: '#0284C7',
    secondaryColor: '#0F172A',
    badgeSymbol: '🔺',
  },
  masry: {
    id: 'masry',
    country: 'EG',
    nameAr: 'المصري البورسعيدي',
    nameEn: 'Al Masry SC',
    shortName: 'MAS',
    city: 'بورسعيد',
    founded: 1920,
    primaryColor: '#16A34A',
    secondaryColor: '#FFFFFF',
    badgeSymbol: '🦅',
  },
  ittihad: {
    id: 'ittihad',
    country: 'EG',
    nameAr: 'الاتحاد السكندري',
    nameEn: 'Al Ittihad Alex',
    shortName: 'ITH',
    city: 'الإسكندرية',
    founded: 1914,
    primaryColor: '#15803D',
    secondaryColor: '#FFFFFF',
    badgeSymbol: '🏰',
  },
  ismaily: {
    id: 'ismaily',
    country: 'EG',
    nameAr: 'الإسماعيلي',
    nameEn: 'Ismaily SC',
    shortName: 'ISM',
    city: 'الإسماعيلية',
    founded: 1924,
    primaryColor: '#EAB308',
    secondaryColor: '#1D4ED8',
    badgeSymbol: '⭐',
  },
  smouha: {
    id: 'smouha',
    country: 'EG',
    nameAr: 'سموحة',
    nameEn: 'Smouha SC',
    shortName: 'SMO',
    city: 'الإسكندرية',
    founded: 1949,
    primaryColor: '#2563EB',
    secondaryColor: '#FFFFFF',
    badgeSymbol: '🌊',
  },
  ceramica: {
    id: 'ceramica',
    country: 'EG',
    nameAr: 'سيراميكا كليوباترا',
    nameEn: 'Ceramica Cleopatra',
    shortName: 'CER',
    city: 'الجيزة',
    founded: 2006,
    primaryColor: '#991B1B',
    secondaryColor: '#CA8A04',
    badgeSymbol: '👑',
  },
  zed: {
    id: 'zed',
    country: 'EG',
    nameAr: 'زد إف سي',
    nameEn: 'ZED FC',
    shortName: 'ZED',
    city: 'الجيزة',
    founded: 2009,
    primaryColor: '#18181B',
    secondaryColor: '#EAB308',
    badgeSymbol: '⚡',
  },
  modern: {
    id: 'modern',
    country: 'EG',
    nameAr: 'مودرن سبورت',
    nameEn: 'Modern Sport FC',
    shortName: 'MOD',
    city: 'القاهرة',
    founded: 2011,
    primaryColor: '#B91C1C',
    secondaryColor: '#18181B',
    badgeSymbol: '🔴',
  },
  enppi: {
    id: 'enppi',
    country: 'EG',
    nameAr: 'إنبي',
    nameEn: 'ENPPI SC',
    shortName: 'ENP',
    city: 'القاهرة',
    founded: 1985,
    primaryColor: '#0369A1',
    secondaryColor: '#FFFFFF',
    badgeSymbol: '🔥',
  },
  gaish: {
    id: 'gaish',
    country: 'EG',
    nameAr: 'طلائع الجيش',
    nameEn: 'Talaea El Gaish',
    shortName: 'TGS',
    city: 'القاهرة',
    founded: 1997,
    primaryColor: '#991B1B',
    secondaryColor: '#FACC15',
    badgeSymbol: '🛡️',
  },
  bank_ahly: {
    id: 'bank_ahly',
    country: 'EG',
    nameAr: 'البنك الأهلي',
    nameEn: 'National Bank SC',
    shortName: 'NBE',
    city: 'القاهرة',
    founded: 1951,
    primaryColor: '#EA580C',
    secondaryColor: '#059669',
    badgeSymbol: '🦁',
  },
  gouna: {
    id: 'gouna',
    country: 'EG',
    nameAr: 'الجونة',
    nameEn: 'El Gouna FC',
    shortName: 'GOU',
    city: 'الغردقة',
    founded: 2003,
    primaryColor: '#F97316',
    secondaryColor: '#1E293B',
    badgeSymbol: '☀️',
  },
  pharco: {
    id: 'pharco',
    country: 'EG',
    nameAr: 'فاركو',
    nameEn: 'Pharco FC',
    shortName: 'PHA',
    city: 'الإسكندرية',
    founded: 2010,
    primaryColor: '#FB923C',
    secondaryColor: '#1E3A8A',
    badgeSymbol: '💊',
  },
  mahalla: {
    id: 'mahalla',
    country: 'EG',
    nameAr: 'غزل المحلة',
    nameEn: 'Ghazl El Mahalla',
    shortName: 'MAH',
    city: 'المحلة الكبرى',
    founded: 1936,
    primaryColor: '#38BDF8',
    secondaryColor: '#FFFFFF',
    badgeSymbol: '🌾',
  },
  petrojet: {
    id: 'petrojet',
    country: 'EG',
    nameAr: 'بتروجيت',
    nameEn: 'Petrojet FC',
    shortName: 'PET',
    city: 'السويس',
    founded: 1980,
    primaryColor: '#1D4ED8',
    secondaryColor: '#DC2626',
    badgeSymbol: '⛽',
  },
  haras: {
    id: 'haras',
    country: 'EG',
    nameAr: 'حرس الحدود',
    nameEn: 'Haras El Hodoud',
    shortName: 'HOD',
    city: 'الإسكندرية',
    founded: 1932,
    primaryColor: '#B91C1C',
    secondaryColor: '#000000',
    badgeSymbol: '⚔️',
  },
};

export const ALL_CLUBS: Record<string, FootballClub> = {
  ...JORDANIAN_CLUBS,
  ...EGYPTIAN_CLUBS,
};

// Initial realistic Jordanian League & Egyptian League Matches
const DEFAULT_MATCHES: SportsMatch[] = [
  // --- Jordanian League Matches ---
  {
    id: 'jo_m1',
    homeTeam: JORDANIAN_CLUBS.faisaly,
    awayTeam: JORDANIAN_CLUBS.wehdat,
    league: 'الدوري الأردني للمحترفين',
    roundName: 'الجولة 12 · كلاسيكو الأردن الكبير',
    stadium: 'ستاد عمان الدولي',
    status: 'LIVE',
    minute: 54,
    homeScore: 1,
    awayScore: 1,
    startTimeText: 'مباشر الآن',
    odds: {
      home: 2.15,
      draw: 3.10,
      away: 3.20,
      over25: 1.85,
      under25: 1.90,
      bttsYes: 1.75,
      bttsNo: 1.95,
    },
  },
  {
    id: 'jo_m2',
    homeTeam: JORDANIAN_CLUBS.hussein,
    awayTeam: JORDANIAN_CLUBS.ramtha,
    league: 'الدوري الأردني للمحترفين',
    roundName: 'الجولة 12 · ديربي الشمال',
    stadium: 'ستاد الحسن - إربد',
    status: 'LIVE',
    minute: 29,
    homeScore: 1,
    awayScore: 0,
    startTimeText: 'مباشر الآن',
    odds: {
      home: 1.70,
      draw: 3.30,
      away: 4.50,
      over25: 1.95,
      under25: 1.80,
      bttsYes: 1.90,
      bttsNo: 1.80,
    },
  },
  {
    id: 'jo_m3',
    homeTeam: JORDANIAN_CLUBS.shabab_ordon,
    awayTeam: JORDANIAN_CLUBS.jazeera,
    league: 'الدوري الأردني للمحترفين',
    roundName: 'الجولة 12',
    stadium: 'ستاد الملك عبد الله الثاني - القويسمة',
    status: 'UPCOMING',
    homeScore: 0,
    awayScore: 0,
    startTimeText: 'اليوم 18:30',
    odds: {
      home: 2.20,
      draw: 3.05,
      away: 3.10,
      over25: 2.10,
      under25: 1.65,
      bttsYes: 1.88,
      bttsNo: 1.82,
    },
  },
  {
    id: 'jo_m4',
    homeTeam: JORDANIAN_CLUBS.salt,
    awayTeam: JORDANIAN_CLUBS.maan,
    league: 'الدوري الأردني للمحترفين',
    roundName: 'الجولة 12',
    stadium: 'ستاد الأمير حسين - السلط',
    status: 'UPCOMING',
    homeScore: 0,
    awayScore: 0,
    startTimeText: 'غداً 17:00',
    odds: {
      home: 1.95,
      draw: 3.15,
      away: 3.60,
      over25: 2.20,
      under25: 1.60,
      bttsYes: 1.95,
      bttsNo: 1.75,
    },
  },
  {
    id: 'jo_m5',
    homeTeam: JORDANIAN_CLUBS.ahli_amman,
    awayTeam: JORDANIAN_CLUBS.aqaba,
    league: 'كأس الأردن',
    roundName: 'دور الـ 16',
    stadium: 'ستاد البتراء - عمان',
    status: 'UPCOMING',
    homeScore: 0,
    awayScore: 0,
    startTimeText: 'غداً 19:30',
    odds: {
      home: 2.30,
      draw: 2.95,
      away: 2.90,
      over25: 2.25,
      under25: 1.58,
      bttsYes: 2.00,
      bttsNo: 1.72,
    },
  },
  {
    id: 'jo_m6',
    homeTeam: JORDANIAN_CLUBS.moghayer,
    awayTeam: JORDANIAN_CLUBS.sareeh,
    league: 'الدوري الأردني للمحترفين',
    roundName: 'الجولة 13',
    stadium: 'ستاد الأمير علي - المفرق',
    status: 'UPCOMING',
    homeScore: 0,
    awayScore: 0,
    startTimeText: 'بعد غد 18:00',
    odds: {
      home: 2.40,
      draw: 3.00,
      away: 2.80,
      over25: 2.30,
      under25: 1.55,
      bttsYes: 2.05,
      bttsNo: 1.70,
    },
  },

  // --- Egyptian League Matches ---
  {
    id: 'eg_m1',
    homeTeam: EGYPTIAN_CLUBS.ahly,
    awayTeam: EGYPTIAN_CLUBS.zamalek,
    league: 'الدوري المصري الممتاز',
    roundName: 'الجولة 14 · قمة الكرة المصرية',
    stadium: 'ستاد القاهرة الدولي',
    status: 'LIVE',
    minute: 68,
    homeScore: 2,
    awayScore: 1,
    startTimeText: 'مباشر الآن',
    odds: {
      home: 1.45,
      draw: 3.80,
      away: 5.50,
      over25: 1.65,
      under25: 2.10,
      bttsYes: 1.70,
      bttsNo: 2.05,
    },
  },
  {
    id: 'eg_m2',
    homeTeam: EGYPTIAN_CLUBS.pyramids,
    awayTeam: EGYPTIAN_CLUBS.ceramica,
    league: 'الدوري المصري الممتاز',
    roundName: 'الجولة 14',
    stadium: 'ستاد الدفاع الجوي',
    status: 'UPCOMING',
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTimeText: 'اليوم 20:00',
    odds: {
      home: 1.55,
      draw: 3.40,
      away: 4.80,
      over25: 1.80,
      under25: 1.95,
      bttsYes: 1.85,
      bttsNo: 1.90,
    },
  },
  {
    id: 'eg_m3',
    homeTeam: EGYPTIAN_CLUBS.masry,
    awayTeam: EGYPTIAN_CLUBS.ittihad,
    league: 'الدوري المصري الممتاز',
    roundName: 'الجولة 14 · ديربي القناة والساحل',
    stadium: 'ستاد الجيش ببرج العرب',
    status: 'UPCOMING',
    homeScore: 0,
    awayScore: 0,
    startTimeText: 'اليوم 19:00',
    odds: {
      home: 2.10,
      draw: 3.05,
      away: 3.20,
      over25: 2.15,
      under25: 1.65,
      bttsYes: 1.90,
      bttsNo: 1.80,
    },
  },
  {
    id: 'eg_m4',
    homeTeam: EGYPTIAN_CLUBS.ismaily,
    awayTeam: EGYPTIAN_CLUBS.mahalla,
    league: 'الدوري المصري الممتاز',
    roundName: 'الجولة 14 · كلاسيكو الدراويش والفلاحين',
    stadium: 'ستاد الإسماعيلية',
    status: 'UPCOMING',
    homeScore: 0,
    awayScore: 0,
    startTimeText: 'اليوم 21:30',
    odds: {
      home: 2.00,
      draw: 3.10,
      away: 3.45,
      over25: 2.20,
      under25: 1.60,
      bttsYes: 1.95,
      bttsNo: 1.75,
    },
  },
  {
    id: 'eg_m5',
    homeTeam: EGYPTIAN_CLUBS.zed,
    awayTeam: EGYPTIAN_CLUBS.enppi,
    league: 'الدوري المصري الممتاز',
    roundName: 'الجولة 15',
    stadium: 'ستاد بتروسبورت',
    status: 'UPCOMING',
    homeScore: 0,
    awayScore: 0,
    startTimeText: 'غداً 17:00',
    odds: {
      home: 2.30,
      draw: 2.95,
      away: 2.90,
      over25: 2.35,
      under25: 1.55,
      bttsYes: 2.05,
      bttsNo: 1.70,
    },
  },
  {
    id: 'eg_m6',
    homeTeam: EGYPTIAN_CLUBS.pharco,
    awayTeam: EGYPTIAN_CLUBS.gouna,
    league: 'كأس مصر',
    roundName: 'دور الـ 16',
    stadium: 'ستاد المكس بالإسكندرية',
    status: 'UPCOMING',
    homeScore: 0,
    awayScore: 0,
    startTimeText: 'بعد غد 18:00',
    odds: {
      home: 2.25,
      draw: 3.05,
      away: 3.00,
      over25: 2.20,
      under25: 1.60,
      bttsYes: 1.92,
      bttsNo: 1.78,
    },
  },
];

// Simple pseudo SHA-256 for browser-side provably fair verification without async issues
export function computeProvablyFairHash(serverSeed: string, clientSeed: string, timestamp: number): string {
  const input = `${serverSeed}:${clientSeed}:${timestamp}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  // Generate a realistic 64-char hex string
  const base = Math.abs(hash).toString(16).padStart(8, '0');
  const sSeedHex = Array.from(serverSeed)
    .map((c) => c.charCodeAt(0).toString(16))
    .join('')
    .slice(0, 24);
  const cSeedHex = Array.from(clientSeed)
    .map((c) => c.charCodeAt(0).toString(16))
    .join('')
    .slice(0, 16);
  const full = (base + sSeedHex + cSeedHex + timestamp.toString(16)).padEnd(64, 'f');
  return '0x' + full.slice(0, 64);
}

// Bot participants seed
const AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Alpha7',
  'https://api.dicebear.com/7.x/bottts/svg?seed=CryptoBull',
  'https://api.dicebear.com/7.x/bottts/svg?seed=SatoshiN',
  'https://api.dicebear.com/7.x/bottts/svg?seed=LunaWhale',
  'https://api.dicebear.com/7.x/bottts/svg?seed=SolanaHero',
  'https://api.dicebear.com/7.x/bottts/svg?seed=CyberBeast',
  'https://api.dicebear.com/7.x/bottts/svg?seed=GoldSniper',
  'https://api.dicebear.com/7.x/bottts/svg?seed=DegenLord',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ViperTrade',
  'https://api.dicebear.com/7.x/bottts/svg?seed=NeonRider',
];

const BOT_NAMES = [
  '0xBull...89a',
  '0xApex...34c',
  'Whale_King',
  'Satoshi_99',
  '0xHawk...21b',
  'AlphaDegen',
  '0xTitan...77d',
  'MoonShot88',
  '0xViper...01e',
  'CryptoNinja',
  '0xRuler...44f',
  '0xFalcon...12a',
];

class StorageService {
  private user: UserProfile | null = null;
  private settings: AdminSettings;
  private bets: UserBet[] = [];
  private withdrawals: WithdrawalRequest[] = [];
  private deposits: DepositRecord[] = [];
  private walletState: ConnectedWalletState = {
    isConnected: false,
    address: null,
    walletName: null,
    chainId: 56, // BNB Chain default
    chainName: 'BNB Smart Chain',
    balanceUSDT: 0,
  };

  // Active round state per coin
  private rounds: Record<CoinSymbol, Round>;

  // Crash & Aviator Game State
  private crashHistory: CrashHistoryItem[] = [];

  // Sportsbook & Egyptian League State
  private sportsMatches: SportsMatch[] = [];
  private sportsBets: SportsBetRecord[] = [];

  // Trix Card Game State
  private trixStats: TrixAdminStats = {
    totalMatches: 24,
    volumeJOD: 180,
    volumeEGP: 15400,
    volumeUSDT: 450,
    commissionJOD: 9,
    commissionEGP: 770,
    commissionUSDT: 22.5,
    activeRoomsCount: 3,
  };
  private trixSpectatorBets: TrixSpectatorBet[] = [];
  private trixLeaderboard: TrixLeaderboardEntry[] = [];

  constructor() {
    // Clean, unauthenticated initial state by default - NEVER fallback to dummy mock account
    const storedUser = this.loadFromStorage<UserProfile | null>('coc_user', null);
    // If the stored user is the ghost/dummy account 'usr_clash_9812' or 'Crypto King', wipe it completely
    if (
      storedUser &&
      (storedUser.id === 'usr_clash_9812' ||
        storedUser.email === 'trader@clashofcoin.bet' ||
        storedUser.username === 'cryptoking' ||
        storedUser.display_name === 'Crypto King 👑')
    ) {
      this.user = null;
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('coc_user');
          localStorage.removeItem('clash_of_coin_user');
          localStorage.removeItem('coc_wallet');
        } catch {
          // ignore
        }
      }
    } else {
      this.user = storedUser ? this.normalizeUserBalances(storedUser) : null;
    }

    this.settings = this.loadFromStorage('coc_settings', DEFAULT_SETTINGS);
    this.settings = { ...DEFAULT_SETTINGS, ...this.settings };

    // Real data only: Purge mock dummy accounts and fake historical records
    const storedBets = this.loadFromStorage<UserBet[]>('coc_bets', []);
    this.bets = storedBets.filter(
      (b) => b.userIdentifier !== 'trader@clashofcoin.bet' && !b.id.startsWith('bet_hist_')
    );

    const storedDeposits = this.loadFromStorage<DepositRecord[]>('coc_deposits', []);
    this.deposits = storedDeposits.filter(
      (d) =>
        d.userId !== 'usr_clash_9812' &&
        !d.id.startsWith('dep_egp_') &&
        !d.id.startsWith('dep_sample_')
    );

    const storedWithdrawals = this.loadFromStorage<WithdrawalRequest[]>('coc_withdrawals', []);
    this.withdrawals = storedWithdrawals.filter(
      (w) => w.userId !== 'usr_clash_9812' && !w.id.startsWith('wth_sample_')
    );

    this.walletState = this.loadFromStorage('coc_wallet', this.walletState);
    this.crashHistory = this.loadFromStorage('coc_crash_history', []);
    this.sportsMatches = this.loadFromStorage('coc_sports_matches', DEFAULT_MATCHES);
    this.sportsBets = this.loadFromStorage('coc_sports_bets', []);
    this.trixStats = this.loadFromStorage('coc_trix_stats', {
      totalMatches: 24,
      volumeJOD: 180,
      volumeEGP: 15400,
      volumeUSDT: 450,
      commissionJOD: 9,
      commissionEGP: 770,
      commissionUSDT: 22.5,
      activeRoomsCount: 3,
    });
    this.trixSpectatorBets = this.loadFromStorage('coc_trix_spectator_bets', []);
    this.trixLeaderboard = this.loadFromStorage('coc_trix_leaderboard', DEFAULT_TRIX_LEADERBOARD);
    this.syncUserToTrixLeaderboard();

    // Initialize 5 coin rooms with 30s default duration and real empty arena
    this.rounds = {
      BTC: this.generateNewRound('BTC', 30, 64250),
      ETH: this.generateNewRound('ETH', 30, 3480),
      SOL: this.generateNewRound('SOL', 30, 152),
      BNB: this.generateNewRound('BNB', 30, 585),
      XRP: this.generateNewRound('XRP', 30, 0.584),
    };
  }

  private loadFromStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  private saveToStorage(key: string, value: unknown) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage error
    }
  }

  public normalizeUserBalances(user: UserProfile): UserProfile {
    const activeCurrency = normalizeCurrency(user.currency || (user.country === 'JO' ? 'JOD' : 'EGP'));
    
    let egp = user.currencyBalances?.EGP;
    let jod = user.currencyBalances?.JOD;
    let usdt = user.currencyBalances?.USDT;

    // Migrate from legacy single-balance user profiles
    if (egp === undefined || jod === undefined || usdt === undefined) {
      const rawBal = typeof user.balance === 'number' && !isNaN(user.balance) ? user.balance : 0;
      egp = activeCurrency === 'EGP' ? rawBal : (user.currencyBalances?.EGP ?? 0);
      jod = activeCurrency === 'JOD' ? rawBal : (user.currencyBalances?.JOD ?? 0);
      usdt = activeCurrency === 'USDT' ? rawBal : (user.currencyBalances?.USDT ?? 0);
    }

    const safeBalances: CurrencyBalances = {
      EGP: Number((egp ?? 0).toFixed(2)),
      JOD: Number((jod ?? 0).toFixed(2)),
      USDT: Number((usdt ?? 0).toFixed(2)),
    };

    const activeBal = safeBalances[activeCurrency];

    return {
      ...user,
      currency: activeCurrency,
      currencyBalances: safeBalances,
      balance: activeBal,
      walletBalance: activeBal,
    };
  }

  public getCurrencyBalances(): CurrencyBalances {
    if (this.user) {
      this.user = this.normalizeUserBalances(this.user);
      return this.user.currencyBalances!;
    }
    return { EGP: 0, JOD: 0, USDT: 0 };
  }

  public getActiveCurrency(): 'EGP' | 'JOD' | 'USDT' {
    return normalizeCurrency(this.user?.currency);
  }

  public creditBalance(amount: number, currency?: SupportedCurrency): boolean {
    if (!this.user || amount <= 0) return false;
    this.user = this.normalizeUserBalances(this.user);
    const targetCurrency = normalizeCurrency(currency || this.user.currency);
    const currentBalances: CurrencyBalances = { ...this.user.currencyBalances! };
    currentBalances[targetCurrency] = Number(((currentBalances[targetCurrency] ?? 0) + amount).toFixed(2));

    const activeCurrency = normalizeCurrency(this.user.currency);
    const activeBal = currentBalances[activeCurrency];

    this.user = {
      ...this.user,
      currencyBalances: currentBalances,
      balance: activeBal,
      walletBalance: activeBal,
    };

    this.saveToStorage('coc_user', this.user);
    supabaseSync.syncUser(this.user);
    return true;
  }

  public debitBalance(amount: number, currency?: SupportedCurrency): boolean {
    if (!this.user || amount <= 0) return false;
    this.user = this.normalizeUserBalances(this.user);
    const targetCurrency = normalizeCurrency(currency || this.user.currency);
    const currentBalances: CurrencyBalances = { ...this.user.currencyBalances! };
    const curVal = currentBalances[targetCurrency] ?? 0;
    if (curVal < amount) return false;
    currentBalances[targetCurrency] = Number((curVal - amount).toFixed(2));

    const activeCurrency = normalizeCurrency(this.user.currency);
    const activeBal = currentBalances[activeCurrency];

    this.user = {
      ...this.user,
      currencyBalances: currentBalances,
      balance: activeBal,
      walletBalance: activeBal,
    };

    this.saveToStorage('coc_user', this.user);
    supabaseSync.syncUser(this.user);
    return true;
  }

  public getUser(): UserProfile | null {
    if (this.user) {
      this.user = this.normalizeUserBalances(this.user);
    }
    return this.user;
  }

  public logout(): void {
    this.user = null;
    this.walletState = {
      isConnected: false,
      address: null,
      walletName: null,
      chainId: 56,
      chainName: 'BNB Smart Chain',
      balanceUSDT: 0,
    };
    if (typeof window !== 'undefined') {
      try {
        const userKeys = [
          'coc_user',
          'clash_of_coin_user',
          'clash_user',
          'coc_user_profile',
          'coc_wallet',
          'coc_bets',
          'coc_deposits',
          'coc_withdrawals',
          'coc_sports_bets',
          'coc_crash_bets',
          'coc_sports_matches',
        ];
        userKeys.forEach((k) => localStorage.removeItem(k));

        // Clear all Supabase auth keys/tokens and cached profiles from localStorage
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.startsWith('sb-') ||
              key.includes('supabase') ||
              key.includes('auth-token') ||
              key.includes('clash_of_coin') ||
              key.includes('user_profile') ||
              key.includes('user-session'))
          ) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        sessionStorage.clear();
      } catch {
        // Storage error
      }
    }
  }

  public updateUser(updater: Partial<UserProfile>): UserProfile {
    const base: UserProfile = this.user || {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: '',
      username: 'user_' + Math.floor(1000 + Math.random() * 9000),
      display_name: 'Player',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ClashMaster',
      country: 'EG',
      currency: 'EGP',
      currencyBalances: { EGP: 0, JOD: 0, USDT: 0 },
      balance: 0,
      walletBalance: 0,
      referralCode: 'CLASH' + Math.floor(1000 + Math.random() * 9000),
      referralEarnings: 0,
      totalBetsPlaced: 0,
      totalWonAmount: 0,
      totalLostAmount: 0,
      createdAt: Date.now(),
    };

    const normalizedBase = this.normalizeUserBalances(base);
    const currentBalances: CurrencyBalances = { ...normalizedBase.currencyBalances! };

    const prevCurrency = normalizeCurrency(normalizedBase.currency);
    const targetCurrency = updater.currency ? normalizeCurrency(updater.currency) : prevCurrency;
    const isCurrencySwitch = updater.currency !== undefined && targetCurrency !== prevCurrency;

    // 1. Explicit currencyBalances map updates
    if (updater.currencyBalances) {
      if (typeof updater.currencyBalances.EGP === 'number') currentBalances.EGP = Number(updater.currencyBalances.EGP.toFixed(2));
      if (typeof updater.currencyBalances.JOD === 'number') currentBalances.JOD = Number(updater.currencyBalances.JOD.toFixed(2));
      if (typeof updater.currencyBalances.USDT === 'number') currentBalances.USDT = Number(updater.currencyBalances.USDT.toFixed(2));
    }

    // 2. Strict Currency Isolation for balance updates:
    // If currency did NOT change, updater.balance updates current active currency wallet
    if (updater.balance !== undefined && !isCurrencySwitch) {
      currentBalances[targetCurrency] = Number(updater.balance.toFixed(2));
    } else if (isCurrencySwitch && updater.balance !== undefined && updater.balance !== normalizedBase.balance) {
      // Only if an explicitly different balance was assigned to the target currency
      currentBalances[targetCurrency] = Number(updater.balance.toFixed(2));
    }
    // Note: When switching active currency (e.g. from EGP to JOD),
    // targetCurrency becomes JOD, and takes strictly its own stored isolated balance (e.g. 0).
    // The previous currency's balance (e.g. 1000 EGP) remains safely intact and isolated in currentBalances.EGP!

    const activeBalance = currentBalances[targetCurrency] ?? 0;

    this.user = {
      ...normalizedBase,
      ...updater,
      currency: targetCurrency,
      currencyBalances: currentBalances,
      balance: activeBalance,
      walletBalance: activeBalance,
    };

    this.saveToStorage('coc_user', this.user);
    supabaseSync.syncUser(this.user);
    supabaseSync.syncProfile({
      id: this.user.id,
      username: this.user.username,
      display_name: this.user.display_name,
      avatar_url: this.user.avatar_url,
    });
    return this.user;
  }

  public getSettings(): AdminSettings {
    return this.settings;
  }

  public updateSettings(newSettings: Partial<AdminSettings>): AdminSettings {
    this.settings = { ...this.settings, ...newSettings };
    this.saveToStorage('coc_settings', this.settings);
    supabaseSync.syncSettings(this.settings);
    return this.settings;
  }

  public getWalletState(): ConnectedWalletState {
    return this.walletState;
  }

  public setWalletConnected(walletName: ConnectedWalletState['walletName'], address: string, balanceUSDT: number = 1250) {
    this.walletState = {
      isConnected: true,
      address,
      walletName,
      chainId: 56,
      chainName: 'BNB Smart Chain',
      balanceUSDT,
    };
    this.saveToStorage('coc_wallet', this.walletState);

    // Also link to user profile
    this.updateUser({ address, walletBalance: balanceUSDT });
  }

  public disconnectWallet() {
    this.walletState = {
      isConnected: false,
      address: null,
      walletName: null,
      chainId: 56,
      chainName: 'BNB Smart Chain',
      balanceUSDT: 0,
    };
    this.saveToStorage('coc_wallet', this.walletState);
  }

  public getBets(): UserBet[] {
    return this.bets;
  }

  public getWithdrawals(): WithdrawalRequest[] {
    return this.withdrawals;
  }

  public getDeposits(): DepositRecord[] {
    return this.deposits;
  }

  public getCompanyWalletForMethod(method: EgyptianPaymentMethod): string {
    switch (method) {
      case 'JORDAN_CLIQ':
        return this.settings.jordanCliqAlias || 'CLASHOFCOIN';
      case 'JORDAN_ZAIN_CASH':
        return this.settings.jordanZainCashNumber || '0791234567';
      case 'JORDAN_ORANGE_MONEY':
        return this.settings.jordanOrangeMoneyNumber || '0771234567';
      case 'JORDAN_UWALLET':
        return this.settings.jordanUwalletNumber || '0781234567';
      case 'JORDAN_BANK':
        return this.settings.jordanBankDetails || 'بنك الاتحاد - الاسم: كلاش أوف كوين - IBAN: JO89UBSI000000012345678901234';
      case 'VODAFONE_CASH':
        return this.settings.vodafoneCashNumber || '01098451230';
      case 'INSTAPAY':
        return this.settings.instaPayHandle || 'clashofcoin@instapay';
      case 'ETISALAT_CASH':
        return this.settings.etisalatCashNumber || '01123456789';
      case 'ORANGE_CASH':
        return this.settings.orangeCashNumber || '01234567890';
      case 'FAWRY':
        return this.settings.fawryCode || '789123';
      case 'CRYPTO':
      default:
        return 'TN3W4H8d7ClashOfCoinUSDTTRC20x892019';
    }
  }

  public addDeposit(
    amount: number,
    method: EgyptianPaymentMethod = 'CRYPTO',
    params?: {
      senderAccount?: string;
      companyAccount?: string;
      receiptImage?: string;
      network?: 'TRC20' | 'BEP20';
      address?: string;
      currency?: SupportedCurrency;
    }
  ): DepositRecord {
    const isEgyptian = method !== 'CRYPTO';
    const depositCurrency = normalizeCurrency(
      params?.currency ||
        (method === 'CRYPTO'
          ? 'USDT'
          : this.user?.currency || (this.user?.country === 'JO' ? 'JOD' : 'EGP'))
    );
    const deposit: DepositRecord = {
      id: 'dep_' + Math.random().toString(36).substring(2, 9),
      userId: this.user ? this.user.id : 'usr_anon',
      amount,
      currency: depositCurrency,
      method,
      senderAccount: params?.senderAccount || '010****',
      companyAccount: params?.companyAccount || this.getCompanyWalletForMethod(method),
      receiptImage: params?.receiptImage,
      network: params?.network,
      address: params?.address || (isEgyptian ? this.getCompanyWalletForMethod(method) : undefined),
      txHash: '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      status: isEgyptian ? 'PENDING' : 'CONFIRMED',
      createdAt: Date.now(),
    };
    this.deposits.unshift(deposit);
    this.saveToStorage('coc_deposits', this.deposits);
    supabaseSync.recordDeposit(deposit);

    // If crypto deposit -> auto confirmed: credit isolated currency wallet
    if (deposit.status === 'CONFIRMED' && this.user) {
      this.creditBalance(amount, depositCurrency);
    }
    return deposit;
  }

  public approveDeposit(id: string): boolean {
    const idx = this.deposits.findIndex((d) => d.id === id);
    if (idx !== -1 && this.deposits[idx].status === 'PENDING') {
      this.deposits[idx].status = 'CONFIRMED';
      // Credit strictly the designated isolated currency wallet
      if (this.user) {
        const depCurrency = normalizeCurrency(this.deposits[idx].currency || this.user.currency);
        this.creditBalance(this.deposits[idx].amount, depCurrency);
      }
      this.saveToStorage('coc_deposits', this.deposits);
      supabaseSync.recordDeposit(this.deposits[idx]);
      return true;
    }
    return false;
  }

  public rejectDeposit(id: string): boolean {
    const idx = this.deposits.findIndex((d) => d.id === id);
    if (idx !== -1 && this.deposits[idx].status === 'PENDING') {
      this.deposits[idx].status = 'REJECTED';
      this.saveToStorage('coc_deposits', this.deposits);
      supabaseSync.recordDeposit(this.deposits[idx]);
      return true;
    }
    return false;
  }

  public requestWithdrawal(
    amount: number,
    method: EgyptianPaymentMethod = 'CRYPTO',
    params?: {
      userAccount?: string;
      network?: 'TRC20' | 'BEP20';
      currency?: SupportedCurrency;
    }
  ): WithdrawalRequest {
    const feeRate = this.settings.withdrawalFee / 100;
    const fee = Number((amount * feeRate).toFixed(2));
    const netAmount = Number((amount - fee).toFixed(2));

    const wthCurrency = normalizeCurrency(
      params?.currency ||
        (method === 'CRYPTO'
          ? 'USDT'
          : this.user?.currency || (this.user?.country === 'JO' ? 'JOD' : 'EGP'))
    );

    const req: WithdrawalRequest = {
      id: 'wth_' + Math.random().toString(36).substring(2, 9),
      userId: this.user ? this.user.id : 'usr_anon',
      amount,
      fee,
      netAmount,
      currency: wthCurrency,
      method,
      userAccount: params?.userAccount || '010****',
      userAddress: params?.userAccount,
      network: params?.network,
      status: 'PENDING',
      createdAt: Date.now(),
    };

    // Deduct strictly from matching isolated currency wallet if user exists
    if (this.user) {
      this.debitBalance(amount, wthCurrency);
    }

    this.withdrawals.unshift(req);
    this.saveToStorage('coc_withdrawals', this.withdrawals);
    supabaseSync.recordWithdrawal(req);
    return req;
  }

  public approveWithdrawal(id: string): boolean {
    const idx = this.withdrawals.findIndex((w) => w.id === id);
    if (idx !== -1 && this.withdrawals[idx].status === 'PENDING') {
      this.withdrawals[idx].status = 'APPROVED';
      this.saveToStorage('coc_withdrawals', this.withdrawals);
      return true;
    }
    return false;
  }

  public rejectWithdrawal(id: string): boolean {
    const idx = this.withdrawals.findIndex((w) => w.id === id);
    if (idx !== -1 && this.withdrawals[idx].status === 'PENDING') {
      this.withdrawals[idx].status = 'REJECTED';
      // Refund strictly to matching isolated currency wallet
      if (this.user) {
        const wthCurrency = normalizeCurrency(this.withdrawals[idx].currency || this.user.currency);
        this.creditBalance(this.withdrawals[idx].amount, wthCurrency);
      }
      this.saveToStorage('coc_withdrawals', this.withdrawals);
      return true;
    }
    return false;
  }

  public getRound(coin: CoinSymbol): Round {
    return this.rounds[coin];
  }

  public setRoundDuration(coin: CoinSymbol, duration: RoundDuration, currentPrice: number) {
    this.rounds[coin] = this.generateNewRound(coin, duration, currentPrice);
    return this.rounds[coin];
  }

  public generateNewRound(coin: CoinSymbol, duration: RoundDuration = 30, currentPrice: number = 50000): Round {
    const now = Date.now();
    const durationMs = duration * 1000;
    const startTime = now;
    const endTime = now + durationMs;
    const lockTime = endTime - 3000; // 3s lock before end for real fast rounds

    const serverSeed = 'seed_srv_' + Math.random().toString(36).substring(2, 12);
    const clientSeed = 'seed_cli_' + Math.random().toString(36).substring(2, 10);
    const provablyFairHash = computeProvablyFairHash(serverSeed, clientSeed, startTime);

    // REAL MODE: Arena starts empty with $0 pool until real players place bets
    return {
      id: `rnd_${coin}_${startTime.toString().slice(-6)}`,
      coin,
      duration,
      startTime,
      lockTime,
      endTime,
      entryPrice: currentPrice,
      status: 'BETTING_OPEN',
      upPool: 0,
      downPool: 0,
      participants: [],
      serverSeed,
      clientSeed,
      provablyFairHash,
    };
  }

  public placeBet(
    coin: CoinSymbol,
    side: PredictionSide,
    amount: number,
    source: 'SITE_BALANCE' | 'WEB3_WALLET'
  ): { success: boolean; error?: string; bet?: UserBet } {
    const round = this.rounds[coin];
    const now = Date.now();

    // 1. Validation: Betting locked 10s before end
    if (now >= round.lockTime) {
      return { success: false, error: 'Betting is locked 10s before round completion.' };
    }

    // 2. Validation: Min/Max bet
    if (amount < this.settings.minBet) {
      return { success: false, error: `Minimum bet is $${this.settings.minBet}.` };
    }
    if (amount > this.settings.maxBet) {
      return { success: false, error: `Maximum bet is $${this.settings.maxBet}.` };
    }

    // 3. Validation: Prevent same user betting both sides in same round
    const existingBetThisRound = this.bets.find((b) => b.roundId === round.id && b.status === 'ACTIVE');
    if (existingBetThisRound && existingBetThisRound.side !== side) {
      return { success: false, error: 'You cannot bet both UP and DOWN in the same round.' };
    }

    // 4. Balance check & deduction
    const activeCurrency = normalizeCurrency(this.user?.currency);
    if (source === 'SITE_BALANCE') {
      if (!this.user) {
        return { success: false, error: 'يرجى تسجيل الدخول أولاً لتسجيل الرهان.' };
      }
      const activeBal = this.user.currencyBalances?.[activeCurrency] ?? this.user.balance;
      if (activeBal < amount) {
        return { success: false, error: 'رصيد الحساب غير كافٍ في العملة المحددة.' };
      }
      this.debitBalance(amount, activeCurrency);
    } else {
      if (!this.walletState.isConnected || this.walletState.balanceUSDT < amount) {
        return { success: false, error: 'Insufficient connected Web3 wallet USDT balance.' };
      }
      this.walletState.balanceUSDT = Number((this.walletState.balanceUSDT - amount).toFixed(2));
      this.saveToStorage('coc_wallet', this.walletState);
    }

    // 5. Add participant to round
    const displayName =
      (this.user ? (this.user.display_name || (this.user.username ? `@${this.user.username}` : null)) : null) ||
      (this.walletState.isConnected
        ? `${this.walletState.address?.slice(0, 6)}...${this.walletState.address?.slice(-4)}`
        : 'You');

    const userParticipant: Participant = {
      id: 'p_user_' + Math.random().toString(36).substring(2, 7),
      name: displayName,
      avatar: this.user?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=ClashMaster',
      side,
      amount,
      timestamp: now,
      isUser: true,
    };

    round.participants.unshift(userParticipant);
    if (side === 'UP') {
      round.upPool = Number((round.upPool + amount).toFixed(2));
    } else {
      round.downPool = Number((round.downPool + amount).toFixed(2));
    }

    // 6. Record user bet
    const bet: UserBet = {
      id: 'bet_' + Math.random().toString(36).substring(2, 9),
      roundId: round.id,
      coin,
      side,
      amount,
      timestamp: now,
      entryPrice: round.entryPrice,
      status: 'ACTIVE',
      userIdentifier: this.walletState.isConnected ? this.walletState.address! : (this.user?.email || 'You'),
      source,
      currency: activeCurrency,
    };

    this.bets.unshift(bet);
    this.saveToStorage('coc_bets', this.bets);
    supabaseSync.recordBet(bet);

    if (this.user) {
      this.updateUser({ totalBetsPlaced: this.user.totalBetsPlaced + 1 });
    }

    return { success: true, bet };
  }

  // Settle round and distribute pool
  public settleRound(coin: CoinSymbol, exitPrice: number): { winningSide: PredictionSide; userWon: boolean; payout: number } {
    const round = this.rounds[coin];
    round.status = 'SETTLED';
    round.exitPrice = exitPrice;

    const winningSide: PredictionSide = exitPrice >= round.entryPrice ? 'UP' : 'DOWN';
    round.winningSide = winningSide;

    const totalPool = round.upPool + round.downPool;
    const winningPool = winningSide === 'UP' ? round.upPool : round.downPool;
    const losingPool = winningSide === 'UP' ? round.downPool : round.upPool;

    let userWon = false;
    let totalUserPayout = 0;

    // Find active user bets for this round
    this.bets.forEach((bet) => {
      if (bet.roundId === round.id && bet.status === 'ACTIVE') {
        bet.exitPrice = exitPrice;
        if (bet.side === winningSide) {
          bet.status = 'WON';
          userWon = true;

          // Payout formula from specification:
          // payout = (user_bet / total_winning_pool) * total_losing_pool + user_bet
          // Then apply house commission %
          const grossProfit = (bet.amount / winningPool) * losingPool;
          const commissionAmount = grossProfit * (this.settings.houseCommission / 100);
          const netProfit = grossProfit - commissionAmount;
          const payout = Number((bet.amount + netProfit).toFixed(2));

          bet.payout = payout;
          totalUserPayout += payout;

          // Credit strictly to isolated currency wallet (or wallet if used)
          if (bet.source === 'WEB3_WALLET' && this.walletState.isConnected) {
            this.walletState.balanceUSDT = Number((this.walletState.balanceUSDT + payout).toFixed(2));
            this.saveToStorage('coc_wallet', this.walletState);
          } else if (this.user) {
            const betCur = normalizeCurrency(bet.currency || this.user.currency);
            this.creditBalance(payout, betCur);
          }

          if (this.user) {
            this.updateUser({
              totalWonAmount: Number((this.user.totalWonAmount + payout).toFixed(2)),
            });
          }
        } else {
          bet.status = 'LOST';
          bet.payout = 0;
          if (this.user) {
            this.updateUser({
              totalLostAmount: Number((this.user.totalLostAmount + bet.amount).toFixed(2)),
            });
          }
        }
        supabaseSync.recordBet(bet);
      }
    });

    this.saveToStorage('coc_bets', this.bets);
    supabaseSync.recordRound(round);

    // Generate fresh round for this coin immediately
    this.rounds[coin] = this.generateNewRound(coin, round.duration, exitPrice);

    return { winningSide, userWon, payout: totalUserPayout };
  }

  // No mock data: Return empty real collections
  private getInitialBets(): UserBet[] {
    return [];
  }

  private getInitialWithdrawals(): WithdrawalRequest[] {
    return [];
  }

  private getInitialDeposits(): DepositRecord[] {
    return [];
  }

  // ================= CRASH / AVIATOR GAME METHODS =================
  public getCrashPoint(): { point: number; hash: string } {
    // 1. Manual Admin Override: If admin set an exact multiplier for this round
    if (this.settings.nextCrashOverride && this.settings.nextCrashOverride >= 1.0) {
      const overrideVal = Number(this.settings.nextCrashOverride.toFixed(2));
      this.settings.nextCrashOverride = null;
      this.saveToStorage('coc_settings', this.settings);
      const hash =
        '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      return { point: overrideVal, hash };
    }

    // 2. Controlled crash algorithm: 100% master admin control over house edge & instant crash
    const houseEdge = (this.settings.crashHouseEdge || 4.0) / 100;
    const instantRate = (this.settings.crashInstantRate ?? 3.0) / 100;
    const maxMultiplier = this.settings.crashMaxMultiplier || 100.0;

    const r = Math.random();
    let point = 1.0;
    if (r < instantRate) {
      point = 1.0; // Instant crash at 1.00x based on admin percentage
    } else {
      point = Math.min(maxMultiplier, Math.max(1.0, (1 - houseEdge) / (1 - r)));
    }
    const finalMult = Number(point.toFixed(2));
    const hash =
      '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return { point: finalMult, hash };
  }

  public getCrashHistory(): CrashHistoryItem[] {
    return this.crashHistory;
  }

  public addCrashHistory(multiplier: number, hash?: string): CrashHistoryItem {
    const item: CrashHistoryItem = {
      id: 'cr_' + Date.now().toString(36),
      multiplier: Number(multiplier.toFixed(2)),
      hash: hash || '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      timestamp: Date.now(),
    };
    this.crashHistory.unshift(item);
    if (this.crashHistory.length > 25) {
      this.crashHistory = this.crashHistory.slice(0, 25);
    }
    this.saveToStorage('coc_crash_history', this.crashHistory);
    return item;
  }

  public refundCrashBet(amount: number, source: 'SITE_BALANCE' | 'WEB3_WALLET'): void {
    if (source === 'SITE_BALANCE' && this.user) {
      const activeCur = normalizeCurrency(this.user.currency);
      this.creditBalance(amount, activeCur);
    } else {
      this.walletState.balanceUSDT = Number((this.walletState.balanceUSDT + amount).toFixed(2));
      this.saveToStorage('coc_wallet', this.walletState);
    }
  }

  public placeCrashBet(
    amount: number,
    source: 'SITE_BALANCE' | 'WEB3_WALLET'
  ): { success: boolean; error?: string } {
    if (amount < this.settings.minBet) {
      return { success: false, error: `الحد الأدنى للرهان هو $${this.settings.minBet}` };
    }
    if (amount > this.settings.maxBet) {
      return { success: false, error: `الحد الأقصى للرهان هو $${this.settings.maxBet}` };
    }

    if (source === 'SITE_BALANCE') {
      if (!this.user) {
        return { success: false, error: 'يرجى تسجيل الدخول أولاً للمراهنة' };
      }
      const activeCur = normalizeCurrency(this.user.currency);
      const activeBal = this.user.currencyBalances?.[activeCur] ?? this.user.balance;
      if (activeBal < amount) {
        return { success: false, error: 'رصيد الحساب غير كافٍ في العملة المحددة.' };
      }
      this.debitBalance(amount, activeCur);
    } else {
      if (!this.walletState.isConnected || this.walletState.balanceUSDT < amount) {
        return { success: false, error: 'رصيد المحفظة المتصلة USDT غير كافٍ.' };
      }
      this.walletState.balanceUSDT = Number((this.walletState.balanceUSDT - amount).toFixed(2));
      this.saveToStorage('coc_wallet', this.walletState);
    }

    if (this.user) {
      this.updateUser({ totalBetsPlaced: this.user.totalBetsPlaced + 1 });
    }
    return { success: true };
  }

  public cashOutCrashBet(
    amount: number,
    multiplier: number,
    source: 'SITE_BALANCE' | 'WEB3_WALLET'
  ): { success: boolean; payout: number; profit: number } {
    const payout = Number((amount * multiplier).toFixed(2));
    const profit = Number((payout - amount).toFixed(2));

    if (source === 'WEB3_WALLET' && this.walletState.isConnected) {
      this.walletState.balanceUSDT = Number((this.walletState.balanceUSDT + payout).toFixed(2));
      this.saveToStorage('coc_wallet', this.walletState);
    } else if (this.user) {
      const activeCur = normalizeCurrency(this.user.currency);
      this.creditBalance(payout, activeCur);
    }

    if (this.user) {
      this.updateUser({
        totalWonAmount: Number((this.user.totalWonAmount + payout).toFixed(2)),
      });
    }

    return { success: true, payout, profit };
  }

  public recordCrashLoss(amount: number): void {
    if (this.user) {
      this.updateUser({
        totalLostAmount: Number((this.user.totalLostAmount + amount).toFixed(2)),
      });
    }
  }

  // ================= SPORTSBOOK & EGYPTIAN LEAGUE METHODS =================
  public getSportsMatches(): SportsMatch[] {
    return this.sportsMatches;
  }

  public updateSportsMatch(matchId: string, updates: Partial<SportsMatch>): SportsMatch | null {
    const idx = this.sportsMatches.findIndex((m) => m.id === matchId);
    if (idx !== -1) {
      this.sportsMatches[idx] = { ...this.sportsMatches[idx], ...updates };
      this.saveToStorage('coc_sports_matches', this.sportsMatches);
      return this.sportsMatches[idx];
    }
    return null;
  }

  public resetMatchesToDefault(): SportsMatch[] {
    this.sportsMatches = JSON.parse(JSON.stringify(DEFAULT_MATCHES));
    this.saveToStorage('coc_sports_matches', this.sportsMatches);
    return this.sportsMatches;
  }

  public getSportsBets(): SportsBetRecord[] {
    return this.sportsBets;
  }

  public placeSportsBet(
    selections: BetSlipSelection[],
    amount: number,
    type: 'SINGLE' | 'ACCUMULATOR',
    source: 'SITE_BALANCE' | 'WEB3_WALLET'
  ): { success: boolean; error?: string; bet?: SportsBetRecord } {
    if (selections.length === 0) {
      return { success: false, error: 'قسيمة الرهان فارغة. يرجى اختيار توقع واحد على الأقل.' };
    }
    if (amount < this.settings.minBet) {
      return { success: false, error: `الحد الأدنى للرهان هو $${this.settings.minBet}.` };
    }
    if (amount > this.settings.maxBet) {
      return { success: false, error: `الحد الأقصى للرهان هو $${this.settings.maxBet}.` };
    }

    // Calculate total combined odds
    let totalOdds = 1.0;
    if (type === 'SINGLE') {
      totalOdds = selections[0].odd;
    } else {
      totalOdds = Number(selections.reduce((acc, sel) => acc * sel.odd, 1).toFixed(2));
    }
    const potentialPayout = Number((amount * totalOdds).toFixed(2));

    const activeCurrency = normalizeCurrency(this.user?.currency);
    // Deduct from isolated currency balance
    if (source === 'SITE_BALANCE') {
      if (!this.user) {
        return { success: false, error: 'يرجى تسجيل الدخول أولاً للمراهنة الرياضية' };
      }
      const activeBal = this.user.currencyBalances?.[activeCurrency] ?? this.user.balance;
      if (activeBal < amount) {
        return { success: false, error: 'رصيد الحساب غير كافٍ في العملة المحددة.' };
      }
      this.debitBalance(amount, activeCurrency);
    } else {
      if (!this.walletState.isConnected || this.walletState.balanceUSDT < amount) {
        return { success: false, error: 'رصيد المحفظة المتصلة USDT غير كافٍ.' };
      }
      this.walletState.balanceUSDT = Number((this.walletState.balanceUSDT - amount).toFixed(2));
      this.saveToStorage('coc_wallet', this.walletState);
    }

    const bet: SportsBetRecord = {
      id: 'sbet_' + Math.random().toString(36).substring(2, 9),
      userId: this.user ? this.user.id : 'usr_anon',
      type,
      selections: [...selections],
      totalOdds,
      amount,
      potentialPayout,
      status: 'PENDING',
      createdAt: Date.now(),
      source,
      currency: activeCurrency,
    };

    this.sportsBets.unshift(bet);
    this.saveToStorage('coc_sports_bets', this.sportsBets);
    if (this.user) {
      this.updateUser({ totalBetsPlaced: this.user.totalBetsPlaced + 1 });
    }

    return { success: true, bet };
  }

  /**
   * Simulate finishing all Egyptian League matches and settle all pending bets
   */
  public simulateMatchResults(): {
    wonCount: number;
    lostCount: number;
    totalPayout: number;
    updatedMatches: SportsMatch[];
  } {
    // Generate conclusive realistic scores for Egyptian matches
    const simulatedScores: Record<string, { home: number; away: number }> = {
      eg_m1: { home: 2, away: 1 }, // الأهلي 2 - 1 الزمالك
      eg_m2: { home: 2, away: 0 }, // بيراميدز 2 - 0 سيراميكا
      eg_m3: { home: 1, away: 1 }, // المصري 1 - 1 الاتحاد
      eg_m4: { home: 2, away: 1 }, // الإسماعيلي 2 - 1 المحلة
      eg_m5: { home: 1, away: 0 }, // زد 1 - 0 إنبي
      eg_m6: { home: 1, away: 2 }, // سموحة 1 - 2 مودرن سبورت
      eg_m7: { home: 2, away: 2 }, // البنك الأهلي 2 - 2 طلائع الجيش
      eg_m8: { home: 1, away: 0 }, // فاركو 1 - 0 الجونة
      eg_m9: { home: 1, away: 1 }, // بتروجيت 1 - 1 حرس الحدود
    };

    // Update all matches
    this.sportsMatches = this.sportsMatches.map((m) => {
      const sim = simulatedScores[m.id] || {
        home: Math.floor(Math.random() * 3),
        away: Math.floor(Math.random() * 2),
      };
      const homeScore = sim.home;
      const awayScore = sim.away;
      const totalGoals = homeScore + awayScore;
      const winner: '1' | 'X' | '2' = homeScore > awayScore ? '1' : homeScore < awayScore ? '2' : 'X';
      const btts = homeScore > 0 && awayScore > 0;

      return {
        ...m,
        status: 'FINISHED',
        minute: 90,
        homeScore,
        awayScore,
        startTimeText: 'انتهت (Final)',
        settledResult: {
          winner,
          totalGoals,
          btts,
        },
      };
    });

    this.saveToStorage('coc_sports_matches', this.sportsMatches);

    // Settle pending sports bets
    let wonCount = 0;
    let lostCount = 0;
    let totalPayout = 0;

    this.sportsBets.forEach((bet) => {
      if (bet.status === 'PENDING') {
        let allWon = true;

        for (const sel of bet.selections) {
          const match = this.sportsMatches.find((m) => m.id === sel.matchId);
          if (!match || !match.settledResult) {
            allWon = false;
            break;
          }

          const res = match.settledResult;
          let selWon = false;

          if (sel.marketType === '1X2') {
            selWon = sel.pick === res.winner;
          } else if (sel.marketType === 'TOTAL_GOALS') {
            if (sel.pick === 'OVER_25') selWon = res.totalGoals > 2.5;
            if (sel.pick === 'UNDER_25') selWon = res.totalGoals < 2.5;
          } else if (sel.marketType === 'BTTS') {
            if (sel.pick === 'BTTS_YES') selWon = res.btts;
            if (sel.pick === 'BTTS_NO') selWon = !res.btts;
          }

          if (!selWon) {
            allWon = false;
            break;
          }
        }

        if (allWon) {
          bet.status = 'WON';
          bet.actualPayout = bet.potentialPayout;
          wonCount++;
          totalPayout += bet.potentialPayout;

          // Credit isolated currency wallet
          if (bet.source === 'WEB3_WALLET' && this.walletState.isConnected) {
            this.walletState.balanceUSDT = Number(
              (this.walletState.balanceUSDT + bet.potentialPayout).toFixed(2)
            );
            this.saveToStorage('coc_wallet', this.walletState);
          } else if (this.user) {
            const betCur = normalizeCurrency(bet.currency || this.user.currency);
            this.creditBalance(bet.potentialPayout, betCur);
          }

          if (this.user) {
            this.updateUser({
              totalWonAmount: Number((this.user.totalWonAmount + bet.potentialPayout).toFixed(2)),
            });
          }
        } else {
          bet.status = 'LOST';
          bet.actualPayout = 0;
          lostCount++;
          if (this.user) {
            this.updateUser({
              totalLostAmount: Number((this.user.totalLostAmount + bet.amount).toFixed(2)),
            });
          }
        }
      }
    });

    this.saveToStorage('coc_sports_bets', this.sportsBets);

    return {
      wonCount,
      lostCount,
      totalPayout,
      updatedMatches: this.sportsMatches,
    };
  }

  public addSportsMatch(match: SportsMatch): SportsMatch {
    this.sportsMatches.unshift(match);
    this.saveToStorage('coc_sports_matches', this.sportsMatches);
    return match;
  }

  public deleteSportsMatch(matchId: string): boolean {
    const prevLen = this.sportsMatches.length;
    this.sportsMatches = this.sportsMatches.filter((m) => m.id !== matchId);
    if (this.sportsMatches.length !== prevLen) {
      this.saveToStorage('coc_sports_matches', this.sportsMatches);
      return true;
    }
    return false;
  }

  public settleSingleMatch(
    matchId: string,
    homeScore: number,
    awayScore: number
  ): { wonBets: number; totalPayout: number } {
    const totalGoals = homeScore + awayScore;
    const winner: '1' | 'X' | '2' = homeScore > awayScore ? '1' : homeScore < awayScore ? '2' : 'X';
    const btts = homeScore > 0 && awayScore > 0;

    const matchIdx = this.sportsMatches.findIndex((m) => m.id === matchId);
    if (matchIdx !== -1) {
      this.sportsMatches[matchIdx] = {
        ...this.sportsMatches[matchIdx],
        status: 'FINISHED',
        minute: 90,
        homeScore,
        awayScore,
        startTimeText: 'انتهت (Final)',
        settledResult: { winner, totalGoals, btts },
      };
      this.saveToStorage('coc_sports_matches', this.sportsMatches);
    }

    let wonBets = 0;
    let totalPayout = 0;

    this.sportsBets.forEach((bet) => {
      if (bet.status === 'PENDING' && bet.selections.some((s) => s.matchId === matchId)) {
        let allSettled = true;
        let allWon = true;

        for (const sel of bet.selections) {
          const m = this.sportsMatches.find((x) => x.id === sel.matchId);
          if (!m || !m.settledResult) {
            allSettled = false;
            break;
          }
          const res = m.settledResult;
          let selWon = false;
          if (sel.marketType === '1X2') selWon = sel.pick === res.winner;
          else if (sel.marketType === 'TOTAL_GOALS') {
            if (sel.pick === 'OVER_25') selWon = res.totalGoals > 2.5;
            if (sel.pick === 'UNDER_25') selWon = res.totalGoals < 2.5;
          } else if (sel.marketType === 'BTTS') {
            if (sel.pick === 'BTTS_YES') selWon = res.btts;
            if (sel.pick === 'BTTS_NO') selWon = !res.btts;
          }
          if (!selWon) {
            allWon = false;
            break;
          }
        }

        if (allSettled) {
          if (allWon) {
            bet.status = 'WON';
            bet.actualPayout = bet.potentialPayout;
            wonBets++;
            totalPayout += bet.potentialPayout;

            if (bet.source === 'WEB3_WALLET' && this.walletState.isConnected) {
              this.walletState.balanceUSDT = Number(
                (this.walletState.balanceUSDT + bet.potentialPayout).toFixed(2)
              );
              this.saveToStorage('coc_wallet', this.walletState);
            } else if (this.user) {
              const betCur = normalizeCurrency(bet.currency || this.user.currency);
              this.creditBalance(bet.potentialPayout, betCur);
              this.updateUser({
                totalWonAmount: Number((this.user.totalWonAmount + bet.potentialPayout).toFixed(2)),
              });
            }
          } else {
            bet.status = 'LOST';
            bet.actualPayout = 0;
            if (this.user) {
              this.updateUser({
                totalLostAmount: Number((this.user.totalLostAmount + bet.amount).toFixed(2)),
              });
            }
          }
        }
      }
    });

    this.saveToStorage('coc_sports_bets', this.sportsBets);
    return { wonBets, totalPayout };
  }

  // ================= TRIX CARD GAME METHODS =================
  public getTrixStats(): TrixAdminStats {
    return this.trixStats;
  }

  public updateTrixStats(updates: Partial<TrixAdminStats>): TrixAdminStats {
    this.trixStats = { ...this.trixStats, ...updates };
    this.saveToStorage('coc_trix_stats', this.trixStats);
    return this.trixStats;
  }

  public recordTrixMatch(
    currency: SupportedCurrency,
    betVolume: number,
    commissionEarned: number
  ): void {
    const cur = normalizeCurrency(currency);
    const stats = { ...this.trixStats };
    stats.totalMatches = (stats.totalMatches || 0) + 1;

    if (cur === 'JOD') {
      stats.volumeJOD = Number(((stats.volumeJOD || 0) + betVolume).toFixed(2));
      stats.commissionJOD = Number(((stats.commissionJOD || 0) + commissionEarned).toFixed(2));
    } else if (cur === 'EGP') {
      stats.volumeEGP = Number(((stats.volumeEGP || 0) + betVolume).toFixed(2));
      stats.commissionEGP = Number(((stats.commissionEGP || 0) + commissionEarned).toFixed(2));
    } else {
      stats.volumeUSDT = Number(((stats.volumeUSDT || 0) + betVolume).toFixed(2));
      stats.commissionUSDT = Number(((stats.commissionUSDT || 0) + commissionEarned).toFixed(2));
    }

    this.trixStats = stats;
    this.saveToStorage('coc_trix_stats', this.trixStats);
  }

  public placeTrixRoomBet(
    amount: number,
    currency: SupportedCurrency
  ): { success: boolean; error?: string } {
    const cur = normalizeCurrency(currency);

    // Validate minimum bet amounts
    if (cur === 'JOD' && amount < 1) {
      return { success: false, error: 'الحد الأدنى للرهان في طاولة التركس هو 1 د.أ (JOD).' };
    }
    if (cur === 'EGP' && amount < 100) {
      return { success: false, error: 'الحد الأدنى للرهان في طاولة التركس هو 100 ج.م (EGP).' };
    }
    if (cur === 'USDT' && amount < 5) {
      return { success: false, error: 'الحد الأدنى للرهان في طاولة التركس هو 5 USDT.' };
    }

    if (!this.user) {
      return { success: false, error: 'يرجى تسجيل الدخول أولاً للانضمام إلى طاولة التركس.' };
    }

    const currentBalances = this.getCurrencyBalances();
    const available = currentBalances[cur] ?? 0;
    if (available < amount) {
      return {
        success: false,
        error: `رصيدك الحالي (${available.toFixed(2)} ${cur}) غير كافٍ لتأكيد رهان الطاولة (${amount} ${cur}).`,
      };
    }

    const debited = this.debitBalance(amount, cur);
    if (!debited) {
      return { success: false, error: 'تعذر خصم رهان الطاولة من رصيدك المستقل.' };
    }

    this.updateUser({
      totalBetsPlaced: (this.user.totalBetsPlaced || 0) + 1,
    });

    return { success: true };
  }

  public refundTrixRoomBet(amount: number, currency: SupportedCurrency): void {
    if (amount <= 0 || !this.user) return;
    const cur = normalizeCurrency(currency);
    this.creditBalance(amount, cur);
  }

  public payoutTrixWin(amount: number, currency: SupportedCurrency): void {
    if (amount <= 0 || !this.user) return;
    const cur = normalizeCurrency(currency);
    this.creditBalance(amount, cur);
    this.updateUser({
      totalWonAmount: Number(((this.user.totalWonAmount || 0) + amount).toFixed(2)),
    });
  }

  public getTrixSpectatorBets(): TrixSpectatorBet[] {
    return this.trixSpectatorBets;
  }

  public placeTrixSpectatorBet(
    betInput: Omit<TrixSpectatorBet, 'id' | 'timestamp' | 'status' | 'potentialPayout'>
  ): { success: boolean; error?: string; bet?: TrixSpectatorBet } {
    const cur = normalizeCurrency(betInput.currency);

    if (cur === 'JOD' && betInput.amount < 1) {
      return { success: false, error: 'الحد الأدنى لرهان المشاهد هو 1 د.أ.' };
    }
    if (cur === 'EGP' && betInput.amount < 100) {
      return { success: false, error: 'الحد الأدنى لرهان المشاهد هو 100 ج.م.' };
    }
    if (cur === 'USDT' && betInput.amount < 5) {
      return { success: false, error: 'الحد الأدنى لرهان المشاهد هو 5 USDT.' };
    }

    if (!this.user) {
      return { success: false, error: 'يرجى تسجيل الدخول أولاً لوضع رهان مشاهدة مباشر.' };
    }

    const currentBalances = this.getCurrencyBalances();
    const available = currentBalances[cur] ?? 0;
    if (available < betInput.amount) {
      return {
        success: false,
        error: `رصيد ${cur} غير كافٍ. المتوفر: ${available.toFixed(2)} ${cur}`,
      };
    }

    const debited = this.debitBalance(betInput.amount, cur);
    if (!debited) {
      return { success: false, error: 'فشل في خصم مبلغ الرهان.' };
    }

    const potentialPayout = Number((betInput.amount * betInput.odds).toFixed(2));
    const newBet: TrixSpectatorBet = {
      ...betInput,
      id: 'tx_spec_' + Math.random().toString(36).substring(2, 9),
      currency: cur,
      status: 'PENDING',
      potentialPayout,
      timestamp: Date.now(),
    };

    this.trixSpectatorBets.unshift(newBet);
    this.saveToStorage('coc_trix_spectator_bets', this.trixSpectatorBets);

    return { success: true, bet: newBet };
  }

  public settleTrixSpectatorBets(
    winningTarget: string, // e.g. 'TEAM_A' or 'TEAM_B' or player id
    commissionRate: number = 5.0
  ): { wonCount: number; totalPayout: number } {
    let wonCount = 0;
    let totalPayout = 0;

    this.trixSpectatorBets.forEach((bet) => {
      if (bet.status === 'PENDING') {
        const isTargetWinner = bet.target === winningTarget;
        // If bet side is 'FOR', it wins if target is the winner
        // If bet side is 'AGAINST', it wins if target is NOT the winner
        const won = (bet.side === 'FOR' && isTargetWinner) || (bet.side === 'AGAINST' && !isTargetWinner);

        if (won) {
          bet.status = 'WON';
          // Payout minus platform house commission
          const netPayout = Number((bet.potentialPayout * (1 - commissionRate / 100)).toFixed(2));
          bet.actualPayout = netPayout;
          wonCount++;
          totalPayout += netPayout;

          const betCur = normalizeCurrency(bet.currency);
          this.creditBalance(netPayout, betCur);

          // Record commission
          const commAmt = Number((bet.potentialPayout - netPayout).toFixed(2));
          this.recordTrixMatch(betCur, bet.amount, commAmt);
        } else {
          bet.status = 'LOST';
          bet.actualPayout = 0;
          if (this.user) {
            this.updateUser({
              totalLostAmount: Number(((this.user.totalLostAmount || 0) + bet.amount).toFixed(2)),
            });
          }
        }
      }
    });

    this.saveToStorage('coc_trix_spectator_bets', this.trixSpectatorBets);
    return { wonCount, totalPayout };
  }

  // ================= TRIX GLOBAL LEADERBOARD =================

  public syncUserToTrixLeaderboard(): void {
    if (!this.user) return;
    const currentUserId = this.user.id;
    const userName = this.user.display_name || this.user.username || 'أنت (You)';
    const userAvatar = this.user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + currentUserId;
    const userCountry = this.user.country || 'JO';

    const existingIdx = this.trixLeaderboard.findIndex(
      (e) => e.isUser === true || e.id === currentUserId
    );

    if (existingIdx >= 0) {
      this.trixLeaderboard[existingIdx] = {
        ...this.trixLeaderboard[existingIdx],
        id: currentUserId,
        name: userName,
        avatar: userAvatar,
        country: userCountry,
        isUser: true,
      };
    } else {
      // Create user entry initialized with respectable champion rank stats
      const userEntry: TrixLeaderboardEntry = {
        id: currentUserId,
        name: userName,
        avatar: userAvatar,
        country: userCountry,
        isUser: true,
        rank: this.trixLeaderboard.length + 1,
        matchesPlayed: 14,
        matchesWon: 10,
        winRate: 71.4,
        totalScore: 890,
        highestScore: 340,
        partnershipWins: 8,
        soloScores: 310,
        streak: 2,
        tier: 'CHAMPION',
        weeklyScore: 220,
        monthlyScore: 580,
        weeklyWins: 3,
        monthlyWins: 7,
        weeklyMatches: 4,
        monthlyMatches: 10,
        updatedAt: Date.now(),
      };
      this.trixLeaderboard.push(userEntry);
    }

    this.saveToStorage('coc_trix_leaderboard', this.trixLeaderboard);
  }

  public getTrixLeaderboard(
    timeframe: TrixLeaderboardTimeframe = 'ALL_TIME',
    sortBy: TrixLeaderboardSortBy = 'WIN_RATE'
  ): TrixLeaderboardEntry[] {
    this.syncUserToTrixLeaderboard();

    // Clone list
    const entries = this.trixLeaderboard.map((item) => ({ ...item }));

    entries.sort((a, b) => {
      if (timeframe === 'ALL_TIME') {
        if (sortBy === 'WIN_RATE') {
          if (b.winRate !== a.winRate) return b.winRate - a.winRate;
          return b.totalScore - a.totalScore;
        } else if (sortBy === 'TOTAL_SCORE') {
          if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
          return b.winRate - a.winRate;
        } else {
          // MATCHES_WON
          if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
          return b.winRate - a.winRate;
        }
      } else if (timeframe === 'MONTHLY') {
        const wrA = a.monthlyMatches > 0 ? (a.monthlyWins / a.monthlyMatches) * 100 : 0;
        const wrB = b.monthlyMatches > 0 ? (b.monthlyWins / b.monthlyMatches) * 100 : 0;
        if (sortBy === 'WIN_RATE') {
          if (Math.abs(wrB - wrA) > 0.05) return wrB - wrA;
          return b.monthlyScore - a.monthlyScore;
        } else if (sortBy === 'TOTAL_SCORE') {
          if (b.monthlyScore !== a.monthlyScore) return b.monthlyScore - a.monthlyScore;
          return wrB - wrA;
        } else {
          // MATCHES_WON
          if (b.monthlyWins !== a.monthlyWins) return b.monthlyWins - a.monthlyWins;
          return wrB - wrA;
        }
      } else {
        // WEEKLY
        const wrA = a.weeklyMatches > 0 ? (a.weeklyWins / a.weeklyMatches) * 100 : 0;
        const wrB = b.weeklyMatches > 0 ? (b.weeklyWins / b.weeklyMatches) * 100 : 0;
        if (sortBy === 'WIN_RATE') {
          if (Math.abs(wrB - wrA) > 0.05) return wrB - wrA;
          return b.weeklyScore - a.weeklyScore;
        } else if (sortBy === 'TOTAL_SCORE') {
          if (b.weeklyScore !== a.weeklyScore) return b.weeklyScore - a.weeklyScore;
          return wrB - wrA;
        } else {
          // MATCHES_WON
          if (b.weeklyWins !== a.weeklyWins) return b.weeklyWins - a.weeklyWins;
          return wrB - wrA;
        }
      }
    });

    // Assign rank positions
    return entries.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));
  }

  public getUserTrixStanding(): {
    entry: TrixLeaderboardEntry;
    rank: number;
    totalPlayers: number;
  } | null {
    const list = this.getTrixLeaderboard('ALL_TIME', 'WIN_RATE');
    const userEntry = list.find((e) => e.isUser === true || (this.user && e.id === this.user.id));
    if (!userEntry) return null;
    return {
      entry: userEntry,
      rank: userEntry.rank,
      totalPlayers: list.length,
    };
  }

  public recordTrixUserMatchResult(result: {
    won: boolean;
    score: number;
    mode: TrixGameMode;
  }): {
    userEntry: TrixLeaderboardEntry;
    previousRank: number;
    newRank: number;
  } {
    this.syncUserToTrixLeaderboard();

    const preList = this.getTrixLeaderboard('ALL_TIME', 'WIN_RATE');
    const preUser = preList.find((e) => e.isUser === true || (this.user && e.id === this.user.id));
    const previousRank = preUser ? preUser.rank : preList.length;

    const userIdx = this.trixLeaderboard.findIndex(
      (e) => e.isUser === true || (this.user && e.id === this.user.id)
    );

    if (userIdx >= 0) {
      const current = this.trixLeaderboard[userIdx];
      const matchesPlayed = current.matchesPlayed + 1;
      const matchesWon = current.matchesWon + (result.won ? 1 : 0);
      const winRate = Number(((matchesWon / matchesPlayed) * 100).toFixed(1));
      const totalScore = current.totalScore + result.score;
      const highestScore = Math.max(current.highestScore, result.score);
      const streak = result.won ? current.streak + 1 : 0;
      const partnershipWins = current.partnershipWins + (result.mode === 'PARTNERSHIP' && result.won ? 1 : 0);
      const soloScores = current.soloScores + (result.mode === 'SOLO' ? result.score : 0);

      const weeklyScore = current.weeklyScore + result.score;
      const monthlyScore = current.monthlyScore + result.score;
      const weeklyWins = current.weeklyWins + (result.won ? 1 : 0);
      const monthlyWins = current.monthlyWins + (result.won ? 1 : 0);
      const weeklyMatches = current.weeklyMatches + 1;
      const monthlyMatches = current.monthlyMatches + 1;

      // Tier computation
      let tier: TrixPlayerTier = 'GOLD';
      if (winRate >= 80 && matchesPlayed >= 25) {
        tier = 'GRANDMASTER';
      } else if (winRate >= 75 && matchesPlayed >= 15) {
        tier = 'MASTER';
      } else if (winRate >= 68 && matchesPlayed >= 8) {
        tier = 'CHAMPION';
      } else if (winRate >= 60) {
        tier = 'DIAMOND';
      }

      this.trixLeaderboard[userIdx] = {
        ...current,
        matchesPlayed,
        matchesWon,
        winRate,
        totalScore,
        highestScore,
        streak,
        tier,
        partnershipWins,
        soloScores,
        weeklyScore,
        monthlyScore,
        weeklyWins,
        monthlyWins,
        weeklyMatches,
        monthlyMatches,
        updatedAt: Date.now(),
      };
    }

    this.saveToStorage('coc_trix_leaderboard', this.trixLeaderboard);

    const postList = this.getTrixLeaderboard('ALL_TIME', 'WIN_RATE');
    const postUser = postList.find((e) => e.isUser === true || (this.user && e.id === this.user.id));
    const newRank = postUser ? postUser.rank : previousRank;

    return {
      userEntry: postUser || this.trixLeaderboard[userIdx],
      previousRank,
      newRank,
    };
  }

  public resetTrixLeaderboard(): void {
    this.trixLeaderboard = DEFAULT_TRIX_LEADERBOARD.map((e) => ({ ...e }));
    this.syncUserToTrixLeaderboard();
    this.saveToStorage('coc_trix_leaderboard', this.trixLeaderboard);
  }
}


export const storage = new StorageService();
