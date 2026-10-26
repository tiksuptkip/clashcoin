import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Trophy,
  Crown,
  Timer,
  Users,
  Coins,
  Flame,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  TrendingUp,
  Filter,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import {
  CryptoTournament,
  TournamentStatus,
  CoinSymbol,
  SupportedCurrency,
  UserProfile,
} from '../types';
import { tournamentService } from '../services/tournamentService';
import { storage } from '../services/storage';
import { TournamentBracketModal } from './TournamentBracketModal';
import { soundManager } from '../services/sound';

interface TournamentLobbyViewProps {
  user: UserProfile | null;
  onOpenDeposit: () => void;
}

export const TournamentLobbyView: React.FC<TournamentLobbyViewProps> = ({
  user,
  onOpenDeposit,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [tournaments, setTournaments] = useState<CryptoTournament[]>(() =>
    tournamentService.getTournaments()
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | TournamentStatus>('ALL');
  const [coinFilter, setCoinFilter] = useState<'ALL' | CoinSymbol>('ALL');
  const [selectedTournamentForBracket, setSelectedTournamentForBracket] =
    useState<CryptoTournament | null>(null);

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [now, setNow] = useState(Date.now());

  // Ticking timer for real-time countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const refreshTournaments = () => {
    setTournaments([...tournamentService.getTournaments()]);
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const formatCountdown = (startTime: number, status: TournamentStatus): string => {
    if (status === 'COMPLETED') return isAr ? 'انتهت البطولة' : 'Completed';
    if (status === 'IN_PROGRESS') return isAr ? 'مباشر الآن ⚡' : 'Live Now ⚡';

    const diff = Math.max(0, startTime - now);
    if (diff === 0) return isAr ? 'تبدأ الآن!' : 'Starting Now!';

    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(mins)}:${pad(secs)}`;
  };

  const handleJoinTournament = (t: CryptoTournament) => {
    if (!user) {
      showToast(isAr ? 'يرجى تسجيل الدخول أولاً للانضمام للبطولة.' : 'Please sign in to join.', 'error');
      return;
    }

    const res = tournamentService.joinTournament(t.id, user);
    if (res.success && res.tournament) {
      try {
        soundManager.playPlaceBet();
      } catch {
        // Fallback
      }
      refreshTournaments();
      showToast(
        isAr
          ? `🎉 تم انضمامك بنجاح إلى "${res.tournament.titleAr}"!`
          : `🎉 Successfully joined "${res.tournament.title}"!`
      );
      // Auto open bracket
      setSelectedTournamentForBracket(res.tournament);
    } else {
      showToast(res.error || (isAr ? 'فشل الانضمام للبطولة.' : 'Failed to join tournament.'), 'error');
    }
  };

  // Filtered list
  const filteredTournaments = tournaments.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (coinFilter !== 'ALL' && t.coin !== coinFilter) return false;
    return true;
  });

  // Calculate live aggregate stats
  const totalPrizePoolsApprox = tournaments.reduce((acc, t) => {
    // Standardize to USD approx for hero header
    const mult = t.currency === 'JOD' ? 1.41 : t.currency === 'EGP' ? 0.02 : 1;
    return acc + t.currentPrizePool * mult;
  }, 0);

  const totalRegisteredParticipants = tournaments.reduce((acc, t) => acc + t.registeredCount, 0);

  return (
    <div className="w-full space-y-6">
      {/* ================= HERO SHOWCASE BANNER ================= */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0D1525] border-2 border-[#D4AF37]/40 p-5 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-black">
              <Trophy className="w-4 h-4" />
              <span>{isAr ? 'حلبة بطولات الكريبتو الإقصائية' : 'Bracket Crypto Tournaments'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              {isAr ? 'بطولات توقع الكريبتو بجوائز كاش مضمونة 🏆' : 'Crypto Prediction Tournaments & Cash Pools'}
            </h1>

            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
              {isAr
                ? 'نافس أقوى المتداولين بنظام خروج المغلوب (8 مقاعد: ربع النهائي ➔ نصف النهائي ➔ النهائي الكبير). توقع صعود وهبوط العملات واربح حصتك من مجموع الجوائز المشتركة مع سحب فوري.'
                : 'Compete in 8-player single elimination brackets (Quarterfinals ➔ Semifinals ➔ Grand Final). Predict 30s price moves and claim your share of the shared cash prize pool.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[#E2E8F0] font-bold flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>🥇 {isAr ? 'المركز الأول: 60% من الجائزة' : '1st: 60% Pool'}</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[#E2E8F0] font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>🥈 {isAr ? 'المركز الثاني: 25%' : '2nd: 25%'}</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[#E2E8F0] font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>🥉 {isAr ? 'نصف النهائي: 15%' : '3rd/4th: 15%'}</span>
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto shrink-0">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-start">
              <span className="text-[11px] text-[#94A3B8] font-bold block mb-1">
                {isAr ? 'إجمالي الجوائز النشطة' : 'Active Prize Pools'}
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-[#10B981]">
                ~${Math.round(totalPrizePoolsApprox).toLocaleString()}
              </div>
              <span className="text-[10px] text-[#D4AF37]">
                {tournaments.length} {isAr ? 'بطولات مجدولة' : 'Tournaments'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-start">
              <span className="text-[11px] text-[#94A3B8] font-bold block mb-1">
                {isAr ? 'المتسابقون المسجلون' : 'Active Players'}
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-[#F59E0B]">
                {totalRegisteredParticipants} / {tournaments.length * 8}
              </div>
              <span className="text-[10px] text-[#10B981]">
                {isAr ? 'مقاعد ممتلئة بنسبة ' : 'Filled '}
                {Math.round((totalRegisteredParticipants / (tournaments.length * 8)) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= TOAST NOTIFICATION ================= */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg ${
            toastMessage.type === 'success'
              ? 'bg-[#10B981]/20 border-[#10B981]/50 text-white'
              : 'bg-[#EF4444]/20 border-[#EF4444]/50 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#EF4444]" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-[#94A3B8] hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* ================= FILTER CONTROLS ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-[#E6E1D5] shadow-xs">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-[#1F2937] text-white shadow-xs'
                : 'bg-[#F5F2EB] text-[#4B5563] hover:bg-[#EAE5D9]'
            }`}
          >
            {isAr ? 'الكل' : 'All'} ({tournaments.length})
          </button>

          <button
            onClick={() => setStatusFilter('REGISTRATION_OPEN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'REGISTRATION_OPEN'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'bg-[#F5F2EB] text-[#4B5563] hover:bg-[#EAE5D9]'
            }`}
          >
            {isAr ? 'التسجيل مفتوح' : 'Registration Open'}
          </button>

          <button
            onClick={() => setStatusFilter('STARTING_SOON')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'STARTING_SOON'
                ? 'bg-[#F59E0B] text-black shadow-xs'
                : 'bg-[#F5F2EB] text-[#4B5563] hover:bg-[#EAE5D9]'
            }`}
          >
            {isAr ? 'تبدأ قريباً' : 'Starting Soon'}
          </button>

          <button
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-[#EF4444] text-white shadow-xs'
                : 'bg-[#F5F2EB] text-[#4B5563] hover:bg-[#EAE5D9]'
            }`}
          >
            {isAr ? 'مباشر الآن ⚡' : 'Live Now ⚡'}
          </button>

          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'COMPLETED'
                ? 'bg-[#D4AF37] text-black shadow-xs'
                : 'bg-[#F5F2EB] text-[#4B5563] hover:bg-[#EAE5D9]'
            }`}
          >
            {isAr ? 'مكتملة' : 'Completed'}
          </button>
        </div>

        {/* Coin Filter Tabs */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-[#78716C] hidden sm:inline">
            {isAr ? 'العملة:' : 'Coin:'}
          </span>
          {(['ALL', 'BTC', 'ETH', 'SOL'] as const).map((coin) => (
            <button
              key={coin}
              onClick={() => setCoinFilter(coin)}
              className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                coinFilter === coin
                  ? 'bg-[#D97706] text-white'
                  : 'bg-[#F5F2EB] text-[#6B7280] hover:bg-[#EAE5D9]'
              }`}
            >
              {coin}
            </button>
          ))}

          <button
            onClick={() => {
              tournamentService.resetAllTournaments();
              refreshTournaments();
              showToast(isAr ? 'تم إعادة تعيين البطولات للوضع الافتراضي' : 'Reset to default tournaments');
            }}
            title={isAr ? 'إعادة ضبط البطولات' : 'Reset Tournaments'}
            className="p-1.5 rounded-xl bg-[#F5F2EB] hover:bg-[#EAE5D9] text-[#78716C] transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ================= TOURNAMENT CARDS GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTournaments.map((tournament) => {
          const curSymbol =
            tournament.currency === 'JOD' ? 'د.أ' : tournament.currency === 'EGP' ? 'ج.م' : 'USDT';
          const isUserIn =
            tournament.userRegistered ||
            tournament.participants.some((p) => p.isUser || (user && p.id === user.id));

          const isFull = tournament.registeredCount >= tournament.maxParticipants;
          const isLive = tournament.status === 'IN_PROGRESS';
          const isStarting = tournament.status === 'STARTING_SOON';
          const isDone = tournament.status === 'COMPLETED';

          const countdownStr = formatCountdown(tournament.startTime, tournament.status);

          // Calculate prize amounts
          const prize1st = ((tournament.currentPrizePool * tournament.prizeDistribution.first) / 100).toFixed(0);
          const prize2nd = ((tournament.currentPrizePool * tournament.prizeDistribution.second) / 100).toFixed(0);

          return (
            <div
              key={tournament.id}
              className={`group relative rounded-3xl border transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl ${
                isLive
                  ? 'bg-[#0D1525] border-[#10B981] ring-2 ring-[#10B981]/30 text-white'
                  : isStarting
                  ? 'bg-[#181E2B] border-[#F59E0B] ring-2 ring-[#F59E0B]/30 text-white'
                  : isDone
                  ? 'bg-[#FAF8F5] border-[#E6E1D5] text-[#1F2937] opacity-90'
                  : 'bg-[#FFFDF9] border-[#E6E1D5] hover:border-[#D4AF37] text-[#1F2937]'
              }`}
            >
              {/* Top Banner with Coin & Status */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm border shadow-xs ${
                        tournament.coin === 'BTC'
                          ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40'
                          : tournament.coin === 'ETH'
                          ? 'bg-[#6366F1]/20 text-[#818CF8] border-[#6366F1]/40'
                          : 'bg-[#14F195]/20 text-[#10B981] border-[#14F195]/40'
                      }`}
                    >
                      {tournament.coin}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#94A3B8] block">
                        {tournament.tier} TIER
                      </span>
                      <h3 className="font-black text-sm sm:text-base leading-tight">
                        {isAr ? tournament.titleAr : tournament.title}
                      </h3>
                    </div>
                  </div>

                  {/* Status / Countdown Pill */}
                  <div
                    className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black flex items-center gap-1 border ${
                      isLive
                        ? 'bg-[#10B981]/25 text-[#10B981] border-[#10B981]/50 animate-pulse'
                        : isStarting
                        ? 'bg-[#F59E0B]/25 text-[#F59E0B] border-[#F59E0B]/50'
                        : isDone
                        ? 'bg-[#D4AF37]/20 text-[#B38F24] border-[#D4AF37]/40'
                        : 'bg-[#F5F2EB] text-[#4B5563] border-[#E6E1D5]'
                    }`}
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>{countdownStr}</span>
                  </div>
                </div>

                <p className={`text-xs leading-relaxed line-clamp-2 ${isLive || isStarting ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>
                  {isAr ? tournament.descriptionAr : tournament.description}
                </p>

                {/* Prize Pool Highlight Box */}
                <div
                  className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                    isLive || isStarting
                      ? 'bg-[#09111E] border-white/10'
                      : 'bg-[#F5F2EB] border-[#E6E1D5]'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold text-[#94A3B8] block">
                      {isAr ? 'مجموع الجوائز المشتركة' : 'Shared Prize Pool'}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black font-mono text-[#10B981]">
                        {tournament.currentPrizePool}
                      </span>
                      <span className="text-xs font-bold text-[#10B981]">{curSymbol}</span>
                    </div>
                  </div>

                  {/* Distribution Preview */}
                  <div className="text-end text-[11px] font-mono font-bold">
                    <span className="text-[#D4AF37] block">🥇 1st: {prize1st} {curSymbol}</span>
                    <span className={isLive || isStarting ? 'text-[#94A3B8]' : 'text-[#78716C]'}>
                      🥈 2nd: {prize2nd} {curSymbol}
                    </span>
                  </div>
                </div>

                {/* Participants Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold flex items-center gap-1 ${isLive || isStarting ? 'text-[#94A3B8]' : 'text-[#6B7280]'}`}>
                      <Users className="w-3.5 h-3.5" />
                      <span>{isAr ? 'المقاعد المحجوزة:' : 'Seats Filled:'}</span>
                    </span>
                    <span className="font-mono font-black text-xs">
                      {tournament.registeredCount} / {tournament.maxParticipants}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull
                          ? 'bg-[#10B981]'
                          : isStarting
                          ? 'bg-[#F59E0B]'
                          : 'bg-gradient-to-r from-[#D97706] to-[#F59E0B]'
                      }`}
                      style={{
                        width: `${(tournament.registeredCount / tournament.maxParticipants) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div
                className={`p-4 border-t flex items-center justify-between gap-2 ${
                  isLive || isStarting ? 'bg-[#080E1A] border-white/10' : 'bg-[#FAF8F5] border-[#E6E1D5]'
                }`}
              >
                {/* Entry fee label */}
                <div className="leading-tight">
                  <span className="text-[10px] text-[#94A3B8] font-bold block">
                    {isAr ? 'رسوم الدخول:' : 'Entry Fee:'}
                  </span>
                  <span className="text-xs font-black font-mono">
                    {tournament.entryFee === 0 ? (
                      <span className="text-[#10B981] font-black uppercase">
                        {isAr ? 'مجاني 100%' : 'FREE'}
                      </span>
                    ) : (
                      `${tournament.entryFee} ${curSymbol}`
                    )}
                  </span>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTournamentForBracket(tournament)}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>{isAr ? 'الشجرة' : 'Bracket'}</span>
                  </button>

                  {isUserIn ? (
                    <button
                      onClick={() => setSelectedTournamentForBracket(tournament)}
                      className="px-3.5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'أنت مسجل ⚔️' : 'Registered ⚔️'}</span>
                    </button>
                  ) : !isDone && !isFull ? (
                    <button
                      onClick={() => handleJoinTournament(tournament)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-black text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{isAr ? 'انضمام الآن' : 'Join Now'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedTournamentForBracket(tournament)}
                      className="px-3.5 py-2 rounded-xl bg-black/10 hover:bg-black/20 text-xs font-bold transition-all cursor-pointer"
                    >
                      <span>{isAr ? 'عرض النتائج' : 'View Results'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= MODAL: BRACKET TREE VIEWER ================= */}
      {selectedTournamentForBracket && (
        <TournamentBracketModal
          tournament={selectedTournamentForBracket}
          user={user}
          onClose={() => setSelectedTournamentForBracket(null)}
          onTournamentUpdated={(updated) => {
            setSelectedTournamentForBracket({ ...updated });
            refreshTournaments();
          }}
        />
      )}
    </div>
  );
};
