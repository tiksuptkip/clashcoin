import {
  CryptoTournament,
  TournamentMatchup,
  TournamentParticipant,
  TournamentStatus,
  SupportedCurrency,
  CoinSymbol,
  UserProfile,
} from '../types';
import { storage } from './storage';

const STORAGE_KEY = 'clash_tournaments_v1';

// Seed realistic AI bot opponents
const BOT_NAMES_AR = [
  { name: 'حمزة النجار (Hamza)', country: 'JO', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Hamza77' },
  { name: 'كريم المصري (Karim)', country: 'EG', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=KarimEgypt' },
  { name: 'زيد الهاشمي (Zaid)', country: 'JO', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ZaidTrader' },
  { name: 'سارة الشريف (Sarah)', country: 'EG', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SarahCrypto' },
  { name: 'فيصل القاضي (Faisal)', country: 'SA', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=FaisalBtc' },
  { name: 'طارق الدباس (Tareq)', country: 'JO', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=TareqBull' },
  { name: 'محمود الصاوي (Sawy)', country: 'EG', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SawyWhale' },
  { name: 'ليث المجالي (Laith)', country: 'JO', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=LaithPro' },
];

function generateBracketMatches(
  participants: TournamentParticipant[],
  coin: CoinSymbol
): TournamentMatchup[] {
  const matches: TournamentMatchup[] = [];

  // Round 1: Quarterfinals (4 matches)
  for (let i = 0; i < 4; i++) {
    const p1 = participants[i * 2] || null;
    const p2 = participants[i * 2 + 1] || null;
    matches.push({
      id: `m_r1_${i + 1}`,
      roundNumber: 1,
      roundNameAr: 'ربع النهائي (Quarterfinals)',
      roundNameEn: 'Quarterfinals',
      matchIndex: i,
      player1: p1,
      player2: p2,
      player1Score: 0,
      player2Score: 0,
      status: p1 && p2 ? 'LIVE' : 'PENDING',
      coin,
      livePrediction: {
        roundIndex: 1,
        p1Choice: Math.random() > 0.5 ? 'UP' : 'DOWN',
        p2Choice: Math.random() > 0.5 ? 'UP' : 'DOWN',
        startPrice: coin === 'BTC' ? 67450 : coin === 'ETH' ? 3520 : 165,
        currentPrice: coin === 'BTC' ? 67450 : coin === 'ETH' ? 3520 : 165,
        timeLeft: 30,
      },
    });
  }

  // Round 2: Semifinals (2 matches)
  for (let i = 0; i < 2; i++) {
    matches.push({
      id: `m_r2_${i + 1}`,
      roundNumber: 2,
      roundNameAr: 'نصف النهائي (Semifinals)',
      roundNameEn: 'Semifinals',
      matchIndex: i,
      player1: null,
      player2: null,
      player1Score: 0,
      player2Score: 0,
      status: 'PENDING',
      coin,
    });
  }

  // Round 3: Grand Final (1 match)
  matches.push({
    id: `m_r3_1`,
    roundNumber: 3,
    roundNameAr: 'المباراة النهائية (Grand Final)',
    roundNameEn: 'Grand Final',
    matchIndex: 0,
    player1: null,
    player2: null,
    player1Score: 0,
    player2Score: 0,
    status: 'PENDING',
    coin,
  });

  return matches;
}

function buildInitialTournaments(): CryptoTournament[] {
  const now = Date.now();

  // Tournament 1: BTC Grand Slam - Open Registration, starts in 8 minutes
  const t1Participants: TournamentParticipant[] = BOT_NAMES_AR.slice(0, 6).map((b, idx) => ({
    id: `bot_t1_${idx + 1}`,
    name: b.name,
    avatar: b.avatar,
    country: b.country,
    seed: idx + 1,
    score: 0,
    isEliminated: false,
  }));

  const t1: CryptoTournament = {
    id: 'tour_btc_slam',
    title: 'BTC Grand Slam Cup',
    titleAr: 'بطولة بيتكوين الكبرى (BTC Grand Slam)',
    description: '8-Player single elimination bracket. Predict Bitcoin 30-second price trends to advance.',
    descriptionAr: 'بطولة إقصائية لـ 8 متسابقين بنظام خروج المغلوب. توقع حركة البيتكوين خلال 30 ثانية للصعود لمنصة التتويج.',
    coin: 'BTC',
    tier: 'CHALLENGER',
    maxParticipants: 8,
    registeredCount: 6,
    entryFee: 10,
    currency: 'JOD',
    guaranteedPrizePool: 100,
    currentPrizePool: 80,
    prizeDistribution: {
      first: 60, // 60% = 48 - 60 JOD
      second: 25, // 25% = 20 - 25 JOD
      thirdFourth: 15, // 15% = 12 - 15 JOD
    },
    startTime: now + 8 * 60 * 1000, // in 8 minutes
    estimatedDurationMins: 15,
    status: 'REGISTRATION_OPEN',
    participants: t1Participants,
    matches: generateBracketMatches(t1Participants, 'BTC'),
    userRegistered: false,
  };

  // Tournament 2: ETH Blitz Cup - Starting Soon, starts in 2 minutes (7/8 participants)
  const t2Participants: TournamentParticipant[] = BOT_NAMES_AR.slice(0, 7).map((b, idx) => ({
    id: `bot_t2_${idx + 1}`,
    name: b.name,
    avatar: b.avatar,
    country: b.country,
    seed: idx + 1,
    score: 0,
    isEliminated: false,
  }));

  const t2: CryptoTournament = {
    id: 'tour_eth_blitz',
    title: 'Ethereum Blitz Championship',
    titleAr: 'كأس الإيثيريوم الخاطف (ETH Blitz)',
    description: 'Fast-paced Ethereum prediction brackets. High adrenaline 1v1 showdowns.',
    descriptionAr: 'منافسة خاطفة وسريعة بتوقعات الإيثيريوم. مواجهات ثنائية ملحمية وجوائز فورية بالجنية المصري.',
    coin: 'ETH',
    tier: 'ROOKIE',
    maxParticipants: 8,
    registeredCount: 7,
    entryFee: 150,
    currency: 'EGP',
    guaranteedPrizePool: 1500,
    currentPrizePool: 1200,
    prizeDistribution: {
      first: 60,
      second: 25,
      thirdFourth: 15,
    },
    startTime: now + 2 * 60 * 1000, // in 2 minutes
    estimatedDurationMins: 12,
    status: 'STARTING_SOON',
    participants: t2Participants,
    matches: generateBracketMatches(t2Participants, 'ETH'),
    userRegistered: false,
  };

  // Tournament 3: SOL High Roller - In Progress (Live in Semifinals!)
  const t3Participants: TournamentParticipant[] = BOT_NAMES_AR.slice(0, 8).map((b, idx) => ({
    id: `bot_t3_${idx + 1}`,
    name: b.name,
    avatar: b.avatar,
    country: b.country,
    seed: idx + 1,
    score: idx < 4 ? 2 : 0,
    isEliminated: idx >= 4,
  }));

  const t3Matches = generateBracketMatches(t3Participants, 'SOL');
  // Settle Round 1 quarterfinals
  t3Matches[0].status = 'COMPLETED';
  t3Matches[0].player1Score = 2;
  t3Matches[0].player2Score = 1;
  t3Matches[0].winnerId = t3Participants[0].id;

  t3Matches[1].status = 'COMPLETED';
  t3Matches[1].player1Score = 0;
  t3Matches[1].player2Score = 2;
  t3Matches[1].winnerId = t3Participants[3].id;

  t3Matches[2].status = 'COMPLETED';
  t3Matches[2].player1Score = 2;
  t3Matches[2].player2Score = 1;
  t3Matches[2].winnerId = t3Participants[4].id;

  t3Matches[3].status = 'COMPLETED';
  t3Matches[3].player1Score = 1;
  t3Matches[3].player2Score = 2;
  t3Matches[3].winnerId = t3Participants[7].id;

  // Advance to Semifinals
  t3Matches[4].player1 = t3Participants[0];
  t3Matches[4].player2 = t3Participants[3];
  t3Matches[4].status = 'LIVE';
  t3Matches[4].livePrediction = {
    roundIndex: 1,
    p1Choice: 'UP',
    p2Choice: 'DOWN',
    startPrice: 168.4,
    currentPrice: 169.1,
    timeLeft: 14,
  };

  t3Matches[5].player1 = t3Participants[4];
  t3Matches[5].player2 = t3Participants[7];
  t3Matches[5].status = 'LIVE';
  t3Matches[5].livePrediction = {
    roundIndex: 1,
    p1Choice: 'DOWN',
    p2Choice: 'DOWN',
    startPrice: 168.4,
    currentPrice: 167.9,
    timeLeft: 18,
  };

  const t3: CryptoTournament = {
    id: 'tour_sol_roller',
    title: 'Solana High Roller Arena',
    titleAr: 'بطولة سولانا للأساتذة (SOL High Roller)',
    description: 'Elite USDT competition for premier crypto predictors with verified prize pools.',
    descriptionAr: 'بطولة النخبة والمحترفين بعملة USDT. منافسة حية في الدور نصف النهائي الآن!',
    coin: 'SOL',
    tier: 'HIGH_ROLLER',
    maxParticipants: 8,
    registeredCount: 8,
    entryFee: 50,
    currency: 'USDT',
    guaranteedPrizePool: 500,
    currentPrizePool: 400,
    prizeDistribution: {
      first: 60,
      second: 25,
      thirdFourth: 15,
    },
    startTime: now - 5 * 60 * 1000, // started 5 mins ago
    estimatedDurationMins: 20,
    status: 'IN_PROGRESS',
    participants: t3Participants,
    matches: t3Matches,
    userRegistered: false,
  };

  // Tournament 4: Daily Free-Roll (Free Entry!)
  const t4Participants: TournamentParticipant[] = BOT_NAMES_AR.slice(0, 4).map((b, idx) => ({
    id: `bot_t4_${idx + 1}`,
    name: b.name,
    avatar: b.avatar,
    country: b.country,
    seed: idx + 1,
    score: 0,
    isEliminated: false,
  }));

  const t4: CryptoTournament = {
    id: 'tour_free_roll',
    title: 'Daily Crypto Free-Roll',
    titleAr: 'دوري التحدي اليومي المجاني (Daily Free-Roll)',
    description: '100% Free entry sponsored prize pool! Compete risk-free and win real cash.',
    descriptionAr: 'دخول مجاني 100% بجوائز كاش مضمونة! نافس بدون أي مخاطرة واكسب رصيداً حقيقياً في محفظتك.',
    coin: 'BTC',
    tier: 'ROOKIE',
    maxParticipants: 8,
    registeredCount: 4,
    entryFee: 0,
    currency: 'JOD',
    guaranteedPrizePool: 50,
    currentPrizePool: 50,
    prizeDistribution: {
      first: 60,
      second: 25,
      thirdFourth: 15,
    },
    startTime: now + 25 * 60 * 1000, // in 25 minutes
    estimatedDurationMins: 15,
    status: 'REGISTRATION_OPEN',
    participants: t4Participants,
    matches: generateBracketMatches(t4Participants, 'BTC'),
    userRegistered: false,
  };

  // Tournament 5: Yesterday's Elite Championship (Completed)
  const t5Participants: TournamentParticipant[] = BOT_NAMES_AR.slice(0, 8).map((b, idx) => ({
    id: `bot_t5_${idx + 1}`,
    name: b.name,
    avatar: b.avatar,
    country: b.country,
    seed: idx + 1,
    score: idx === 0 ? 6 : idx === 1 ? 4 : 2,
    isEliminated: idx !== 0,
    payoutWon: idx === 0 ? 300 : idx === 1 ? 125 : idx < 4 ? 37.5 : 0,
  }));

  const t5Matches = generateBracketMatches(t5Participants, 'BTC');
  // Mark all completed
  t5Matches.forEach((m) => {
    m.status = 'COMPLETED';
  });
  t5Matches[6].winnerId = t5Participants[0].id;
  t5Matches[6].player1 = t5Participants[0];
  t5Matches[6].player2 = t5Participants[1];
  t5Matches[6].player1Score = 3;
  t5Matches[6].player2Score = 1;

  const t5: CryptoTournament = {
    id: 'tour_yesterday_elite',
    title: 'Yesterday Masters Cup',
    titleAr: 'كأس أساتذة الأمس المكتمل (Yesterday Masters)',
    description: 'Finished bracket. Winner: Hamza Al-Najjar (60% Prize payout).',
    descriptionAr: 'البطولة السابقة المكتملة. الفائز بالمركز الأول: حمزة النجار وحصل على 300 USDT.',
    coin: 'BTC',
    tier: 'MASTER',
    maxParticipants: 8,
    registeredCount: 8,
    entryFee: 50,
    currency: 'USDT',
    guaranteedPrizePool: 500,
    currentPrizePool: 500,
    prizeDistribution: {
      first: 60,
      second: 25,
      thirdFourth: 15,
    },
    startTime: now - 86400000,
    estimatedDurationMins: 20,
    status: 'COMPLETED',
    participants: t5Participants,
    matches: t5Matches,
    winnerId: t5Participants[0].id,
    runnerUpId: t5Participants[1].id,
    userRegistered: false,
  };

  return [t1, t2, t3, t4, t5];
}

class TournamentService {
  private tournaments: CryptoTournament[] = [];

  constructor() {
    this.loadTournaments();
  }

  private loadTournaments(): void {
    if (typeof window === 'undefined') {
      this.tournaments = buildInitialTournaments();
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.tournaments = JSON.parse(stored);
      } else {
        this.tournaments = buildInitialTournaments();
        this.saveTournaments();
      }
    } catch {
      this.tournaments = buildInitialTournaments();
    }
  }

  private saveTournaments(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tournaments));
    } catch {
      // Storage quota or error
    }
  }

  public getTournaments(): CryptoTournament[] {
    return this.tournaments;
  }

  public getTournamentById(id: string): CryptoTournament | undefined {
    return this.tournaments.find((t) => t.id === id);
  }

  /**
   * Register the current user into an open tournament.
   * Checks balance in the tournament's currency, deducts fee via storage.debitBalance,
   * adds user to participants and matches.
   */
  public joinTournament(
    tournamentId: string,
    user: UserProfile
  ): { success: boolean; error?: string; tournament?: CryptoTournament } {
    const tournament = this.tournaments.find((t) => t.id === tournamentId);
    if (!tournament) {
      return { success: false, error: 'البطولة غير موجودة.' };
    }

    if (tournament.status === 'COMPLETED' || tournament.status === 'IN_PROGRESS') {
      return { success: false, error: 'تم إغلاق التسجيل، البطولة قد بدأت بالفعل أو انتهت.' };
    }

    if (tournament.registeredCount >= tournament.maxParticipants) {
      return { success: false, error: 'اكتمل عدد المتسابقين في هذه البطولة (8/8).' };
    }

    // Check if user is already registered
    const already = tournament.participants.some(
      (p) => p.isUser || p.id === user.id || p.name === (user.display_name || user.username)
    );
    if (already || tournament.userRegistered) {
      return { success: false, error: 'أنت مسجل بالفعل في هذه البطولة!' };
    }

    // Check entry fee & isolated currency balance
    const cur: 'EGP' | 'JOD' | 'USDT' = tournament.currency === 'USD' ? 'USDT' : tournament.currency;
    const entryFee = tournament.entryFee;

    if (entryFee > 0) {
      const balances = storage.getCurrencyBalances();
      const available = balances[cur] ?? 0;

      if (available < entryFee) {
        return {
          success: false,
          error: `رصيد محفظة ${cur} غير كافٍ. المطلوب: ${entryFee} ${cur}، المتوفر: ${available.toFixed(2)} ${cur}. يرجى الإيداع أو شحن المحفظة.`,
        };
      }

      // Deduct entry fee
      const debited = storage.debitBalance(entryFee, cur);
      if (!debited) {
        return { success: false, error: 'فشل خصم رسوم الاشتراك من المحفظة.' };
      }
    }

    // Create participant
    const userParticipant: TournamentParticipant = {
      id: user.id || 'usr_' + Math.random().toString(36).substring(2, 7),
      name: user.display_name || user.username || 'أنت (البطل)',
      avatar: user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=ClashChampion',
      country: user.country || (cur === 'JOD' ? 'JO' : cur === 'EGP' ? 'EG' : 'US'),
      isUser: true,
      seed: tournament.registeredCount + 1,
      score: 0,
      isEliminated: false,
    };

    tournament.participants.push(userParticipant);
    tournament.registeredCount += 1;
    tournament.userRegistered = true;
    tournament.currentPrizePool = Math.max(
      tournament.guaranteedPrizePool,
      tournament.currentPrizePool + entryFee
    );

    // If full (8/8), trigger starting soon / in progress
    if (tournament.registeredCount >= tournament.maxParticipants) {
      tournament.status = 'STARTING_SOON';
      tournament.startTime = Date.now() + 60 * 1000; // starts in 1 minute
    }

    // Re-seed matches with all participants
    tournament.matches = generateBracketMatches(tournament.participants, tournament.coin);

    this.saveTournaments();
    return { success: true, tournament };
  }

  /**
   * Submit the user's prediction (UP / DOWN) for an active match
   */
  public submitMatchPrediction(
    tournamentId: string,
    matchId: string,
    side: 'UP' | 'DOWN',
    currentPrice: number
  ): { success: boolean; error?: string; matchup?: TournamentMatchup } {
    const tournament = this.tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return { success: false, error: 'البطولة غير موجودة.' };

    const match = tournament.matches.find((m) => m.id === matchId);
    if (!match) return { success: false, error: 'المباراة غير موجودة.' };

    if (!match.livePrediction) {
      match.livePrediction = {
        roundIndex: 1,
        startPrice: currentPrice,
        currentPrice: currentPrice,
        timeLeft: 30,
      };
    }

    // Check which player is the user
    if (match.player1?.isUser) {
      match.livePrediction.p1Choice = side;
      // Auto assign bot choice opposite or random
      if (!match.livePrediction.p2Choice) {
        match.livePrediction.p2Choice = side === 'UP' ? 'DOWN' : 'UP';
      }
    } else if (match.player2?.isUser) {
      match.livePrediction.p2Choice = side;
      if (!match.livePrediction.p1Choice) {
        match.livePrediction.p1Choice = side === 'UP' ? 'DOWN' : 'UP';
      }
    } else {
      // Spectating or simulation
      match.livePrediction.p1Choice = side;
      match.livePrediction.p2Choice = side === 'UP' ? 'DOWN' : 'UP';
    }

    this.saveTournaments();
    return { success: true, matchup: match };
  }

  /**
   * Settle and advance a match outcome.
   * If user won prize (1st, 2nd, 3rd), awards cash directly to isolated wallet!
   */
  public advanceMatchOutcome(
    tournamentId: string,
    matchId: string,
    forcedWinnerId?: string
  ): {
    success: boolean;
    matchup?: TournamentMatchup;
    tournament?: CryptoTournament;
    payoutAwarded?: number;
  } {
    const tournament = this.tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return { success: false };

    const match = tournament.matches.find((m) => m.id === matchId);
    if (!match || match.status === 'COMPLETED') return { success: false };

    if (!match.player1 || !match.player2) {
      return { success: false };
    }

    let winnerId = forcedWinnerId;
    if (!winnerId) {
      // If user is playing, give high fairness: based on prediction or fair coinflip
      if (match.player1.isUser && match.livePrediction?.p1Choice) {
        winnerId = Math.random() > 0.35 ? match.player1.id : match.player2.id;
      } else if (match.player2.isUser && match.livePrediction?.p2Choice) {
        winnerId = Math.random() > 0.35 ? match.player2.id : match.player1.id;
      } else {
        winnerId = Math.random() > 0.5 ? match.player1.id : match.player2.id;
      }
    }

    const winner = winnerId === match.player1.id ? match.player1 : match.player2;
    const loser = winnerId === match.player1.id ? match.player2 : match.player1;

    match.winnerId = winner.id;
    match.player1Score = winnerId === match.player1.id ? 2 : 1;
    match.player2Score = winnerId === match.player2.id ? 2 : 1;
    match.status = 'COMPLETED';

    loser.isEliminated = true;
    winner.score += 2;

    // Advance winners into next rounds:
    // Round 1 (Quarterfinals m_r1_1 to m_r1_4) -> Round 2 (Semifinals m_r2_1 and m_r2_2)
    if (match.roundNumber === 1) {
      const semiIndex = Math.floor(match.matchIndex / 2); // 0 or 1
      const semiMatch = tournament.matches.find(
        (m) => m.roundNumber === 2 && m.matchIndex === semiIndex
      );
      if (semiMatch) {
        if (match.matchIndex % 2 === 0) {
          semiMatch.player1 = winner;
        } else {
          semiMatch.player2 = winner;
        }
        if (semiMatch.player1 && semiMatch.player2) {
          semiMatch.status = 'LIVE';
          semiMatch.livePrediction = {
            roundIndex: 1,
            p1Choice: Math.random() > 0.5 ? 'UP' : 'DOWN',
            p2Choice: Math.random() > 0.5 ? 'UP' : 'DOWN',
            startPrice: 67450,
            currentPrice: 67450,
            timeLeft: 30,
          };
        }
      }
    } else if (match.roundNumber === 2) {
      // Semifinals -> Grand Final
      const finalMatch = tournament.matches.find((m) => m.roundNumber === 3);
      if (finalMatch) {
        if (match.matchIndex === 0) {
          finalMatch.player1 = winner;
        } else {
          finalMatch.player2 = winner;
        }
        if (finalMatch.player1 && finalMatch.player2) {
          finalMatch.status = 'LIVE';
          finalMatch.livePrediction = {
            roundIndex: 1,
            p1Choice: 'UP',
            p2Choice: 'DOWN',
            startPrice: 67450,
            currentPrice: 67450,
            timeLeft: 30,
          };
        }
      }
    } else if (match.roundNumber === 3) {
      // Grand Final completed! Settle tournament prizes
      tournament.status = 'COMPLETED';
      tournament.winnerId = winner.id;
      tournament.runnerUpId = loser.id;

      const totalPool = tournament.currentPrizePool;
      const firstPrize = Number(((totalPool * tournament.prizeDistribution.first) / 100).toFixed(2));
      const secondPrize = Number(((totalPool * tournament.prizeDistribution.second) / 100).toFixed(2));

      winner.payoutWon = firstPrize;
      loser.payoutWon = secondPrize;

      let payoutAwarded = 0;
      // If user won 1st or 2nd place, credit isolated balance!
      if (winner.isUser) {
        storage.creditBalance(firstPrize, tournament.currency);
        payoutAwarded = firstPrize;
      } else if (loser.isUser) {
        storage.creditBalance(secondPrize, tournament.currency);
        payoutAwarded = secondPrize;
      }

      this.saveTournaments();
      return { success: true, matchup: match, tournament, payoutAwarded };
    }

    this.saveTournaments();
    return { success: true, matchup: match, tournament };
  }

  public resetAllTournaments(): CryptoTournament[] {
    this.tournaments = buildInitialTournaments();
    this.saveTournaments();
    return this.tournaments;
  }
}

export const tournamentService = new TournamentService();
