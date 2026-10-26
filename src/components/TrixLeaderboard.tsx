import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  Search,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  Percent,
  Play,
  Layers,
} from 'lucide-react';
import {
  TrixLeaderboardEntry,
  TrixLeaderboardTimeframe,
  TrixLeaderboardSortBy,
  TrixPlayerTier,
  UserProfile,
} from '../types';
import { storage } from '../services/storage';
import { soundManager } from '../services/sound';

interface TrixLeaderboardProps {
  user: UserProfile | null;
  onPlayClick?: () => void;
  onClose?: () => void;
}

const TIER_CONFIG: Record<
  TrixPlayerTier,
  { labelAr: string; labelEn: string; icon: string; color: string; border: string; bg: string }
> = {
  GRANDMASTER: {
    labelAr: 'جراند ماستر',
    labelEn: 'Grandmaster',
    icon: '👑',
    color: 'text-[#F59E0B]',
    border: 'border-[#F59E0B]/50',
    bg: 'bg-[#F59E0B]/15',
  },
  MASTER: {
    labelAr: 'أستاذ تركس',
    labelEn: 'Master',
    icon: '⚔️',
    color: 'text-[#A855F7]',
    border: 'border-[#A855F7]/50',
    bg: 'bg-[#A855F7]/15',
  },
  CHAMPION: {
    labelAr: 'بطل أردني',
    labelEn: 'Champion',
    icon: '🛡️',
    color: 'text-[#38BDF8]',
    border: 'border-[#38BDF8]/50',
    bg: 'bg-[#38BDF8]/15',
  },
  DIAMOND: {
    labelAr: 'ماسي',
    labelEn: 'Diamond',
    icon: '💎',
    color: 'text-[#34D399]',
    border: 'border-[#34D399]/50',
    bg: 'bg-[#34D399]/15',
  },
  GOLD: {
    labelAr: 'ذهبي',
    labelEn: 'Gold',
    icon: '🪙',
    color: 'text-[#E2E8F0]',
    border: 'border-white/20',
    bg: 'bg-white/10',
  },
};

const COUNTRY_FLAGS: Record<string, { flag: string; nameAr: string; nameEn: string }> = {
  JO: { flag: '🇯🇴', nameAr: 'الأردن', nameEn: 'Jordan' },
  EG: { flag: '🇪🇬', nameAr: 'مصر', nameEn: 'Egypt' },
  SA: { flag: '🇸🇦', nameAr: 'السعودية', nameEn: 'Saudi Arabia' },
  AE: { flag: '🇦🇪', nameAr: 'الإمارات', nameEn: 'UAE' },
  KW: { flag: '🇰🇼', nameAr: 'الكويت', nameEn: 'Kuwait' },
  PS: { flag: '🇵🇸', nameAr: 'فلسطين', nameEn: 'Palestine' },
  LB: { flag: '🇱🇧', nameAr: 'لبنان', nameEn: 'Lebanon' },
};

export const TrixLeaderboard: React.FC<TrixLeaderboardProps> = ({
  user,
  onPlayClick,
  onClose,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [timeframe, setTimeframe] = useState<TrixLeaderboardTimeframe>('ALL_TIME');
  const [sortBy, setSortBy] = useState<TrixLeaderboardSortBy>('WIN_RATE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Fetch live ranked entries from storage
  const rawLeaderboard = useMemo(() => {
    return storage.getTrixLeaderboard(timeframe, sortBy);
  }, [timeframe, sortBy, isRefreshing]);

  // Filter by search query
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return rawLeaderboard;
    const q = searchQuery.toLowerCase().trim();
    return rawLeaderboard.filter((entry) => {
      const nameMatch = entry.name.toLowerCase().includes(q);
      const countryMatch = (COUNTRY_FLAGS[entry.country]?.nameAr.toLowerCase().includes(q) ||
        COUNTRY_FLAGS[entry.country]?.nameEn.toLowerCase().includes(q));
      return nameMatch || countryMatch;
    });
  }, [rawLeaderboard, searchQuery]);

  // Active User Entry & Rank
  const userStanding = useMemo(() => {
    const found = rawLeaderboard.find(
      (e) => e.isUser === true || (user && e.id === user.id)
    );
    if (!found) return null;
    return {
      entry: found,
      rank: found.rank,
      totalPlayers: rawLeaderboard.length,
    };
  }, [rawLeaderboard, user]);

  // Podium Top 3 (from raw sorted list)
  const podiumTop3 = useMemo(() => {
    return rawLeaderboard.slice(0, 3);
  }, [rawLeaderboard]);

  const handleTimeframeChange = (tf: TrixLeaderboardTimeframe) => {
    soundManager.playClick();
    setTimeframe(tf);
  };

  const handleSortChange = (sb: TrixLeaderboardSortBy) => {
    soundManager.playClick();
    setSortBy(sb);
  };

  const handleRefresh = () => {
    soundManager.playClick();
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  // Helper to format scores
  const getDisplayScore = (entry: TrixLeaderboardEntry) => {
    if (timeframe === 'WEEKLY') return entry.weeklyScore;
    if (timeframe === 'MONTHLY') return entry.monthlyScore;
    return entry.totalScore;
  };

  // Helper to format wins
  const getDisplayWins = (entry: TrixLeaderboardEntry) => {
    if (timeframe === 'WEEKLY') return entry.weeklyWins;
    if (timeframe === 'MONTHLY') return entry.monthlyWins;
    return entry.matchesWon;
  };

  // Helper to format matches
  const getDisplayMatches = (entry: TrixLeaderboardEntry) => {
    if (timeframe === 'WEEKLY') return entry.weeklyMatches;
    if (timeframe === 'MONTHLY') return entry.monthlyMatches;
    return entry.matchesPlayed;
  };

  // Helper to calculate timeframe win rate
  const getDisplayWinRate = (entry: TrixLeaderboardEntry) => {
    if (timeframe === 'ALL_TIME') return entry.winRate;
    const m = getDisplayMatches(entry);
    const w = getDisplayWins(entry);
    return m > 0 ? Number(((w / m) * 100).toFixed(1)) : 0;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-6 select-none animate-fadeIn">
      {/* ---------------- 1. HERO HEADER ---------------- */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#071322] via-[#0b1e36] to-[#071322] border border-[#D4AF37]/40 p-5 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="space-y-2 text-center md:text-start">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-black">
              <Trophy className="w-4 h-4" />
              <span>{isAr ? 'لوحة الشرف الرسمية لمحترفي التركس 🇯🇴' : 'Official Trix Champions Hall of Fame'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center md:justify-start gap-2.5">
              <span>{isAr ? 'قائمة متصدري التركس العالمية' : 'Global Trix Leaderboard'}</span>
              <Crown className="w-6 h-6 text-[#D4AF37] fill-[#D4AF37]" />
            </h1>

            <p className="text-xs sm:text-sm text-[#94A3B8] max-w-2xl leading-relaxed">
              {isAr
                ? 'تصنيف مباشر لأقوى لاعبي ومحترفي التركس الأردني بالشراكة والفردي بناءً على نسبة الفوز وتراكم النقاط عبر الجولات والممالك الخمس.'
                : 'Live rankings of top Trix masters based on lifetime win rates, cumulative kingdom scores, and match victories.'}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 shrink-0">
            {onPlayClick && (
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  onPlayClick();
                }}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B38F24] hover:brightness-110 text-black font-black text-xs sm:text-sm transition-all shadow-xl active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isAr ? 'العب الآن وتصدر ⚡' : 'Play & Climb Rank'}</span>
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  onClose();
                }}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- 2. ACTIVE USER STANDING DOCK ---------------- */}
      {userStanding && (
        <div className="relative rounded-2xl bg-gradient-to-r from-[#0d213b] via-[#102747] to-[#0d213b] border-2 border-[#D4AF37] p-4 sm:p-5 shadow-xl text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* User Info & Current Rank */}
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <div className="relative">
                <img
                  src={userStanding.entry.avatar}
                  alt={userStanding.entry.name}
                  className="w-13 h-13 rounded-2xl border-2 border-[#D4AF37] object-cover bg-black/40 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-[#D4AF37] text-black text-[10px] font-black shadow-sm">
                  #{userStanding.rank}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm sm:text-base text-white">{userStanding.entry.name}</span>
                  <span className="text-sm">
                    {COUNTRY_FLAGS[userStanding.entry.country]?.flag || '🇯🇴'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                      TIER_CONFIG[userStanding.entry.tier].border
                    } ${TIER_CONFIG[userStanding.entry.tier].bg} ${TIER_CONFIG[userStanding.entry.tier].color}`}
                  >
                    {isAr
                      ? TIER_CONFIG[userStanding.entry.tier].labelAr
                      : TIER_CONFIG[userStanding.entry.tier].labelEn}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#94A3B8] mt-0.5">
                  <span>{isAr ? 'ترتيبك العام:' : 'Your Rank:'}</span>
                  <strong className="text-[#D4AF37] font-black font-mono">
                    #{userStanding.rank} / {userStanding.totalPlayers}
                  </strong>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-[#EF4444]">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>
                      {userStanding.entry.streak} {isAr ? 'سلسلة فوز' : 'Win Streak'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full sm:w-auto bg-black/30 p-2.5 sm:p-3 rounded-xl border border-white/5 text-center">
              <div>
                <span className="text-[10px] text-[#94A3B8] block">{isAr ? 'نسبة الفوز' : 'Win Rate'}</span>
                <span className="text-sm sm:text-base font-black font-mono text-[#10B981]">
                  {getDisplayWinRate(userStanding.entry)}%
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#94A3B8] block">{isAr ? 'مجموع النقاط' : 'Total Score'}</span>
                <span className="text-sm sm:text-base font-black font-mono text-[#D4AF37]">
                  +{getDisplayScore(userStanding.entry)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#94A3B8] block">{isAr ? 'الجولات الفائزة' : 'Victories'}</span>
                <span className="text-sm sm:text-base font-black font-mono text-white">
                  {getDisplayWins(userStanding.entry)} / {getDisplayMatches(userStanding.entry)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 3. PODIUM SHOWCASE (TOP 3 CHAMPIONS) ---------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              {isAr ? 'منصة التتويج الملكية (أفضل 3 لاعبين)' : 'The Royal Podium (Top 3 Champions)'}
            </h2>
          </div>
          <span className="text-[11px] text-[#94A3B8]">
            {isAr
              ? timeframe === 'ALL_TIME'
                ? 'التصنيف التاريخي الكلي'
                : timeframe === 'MONTHLY'
                ? 'المتصدرين لهذا الشهر'
                : 'المتصدرين لهذا الأسبوع'
              : timeframe === 'ALL_TIME'
              ? 'Lifetime Standings'
              : timeframe === 'MONTHLY'
              ? 'Monthly Standings'
              : 'Weekly Standings'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 items-end">
          {/* RANK 2: SILVER */}
          {podiumTop3[1] && (
            <div className="relative rounded-3xl bg-[#091524] border-2 border-[#94A3B8]/40 p-4 sm:p-5 flex flex-col items-center text-center shadow-lg hover:border-[#94A3B8] transition-all order-2 md:order-1">
              <div className="w-9 h-9 rounded-full bg-[#94A3B8]/20 border border-[#94A3B8]/50 text-[#E2E8F0] font-black text-sm flex items-center justify-center mb-2 shadow-inner">
                #2
              </div>

              <div className="relative mb-2">
                <img
                  src={podiumTop3[1].avatar}
                  alt={podiumTop3[1].name}
                  className="w-16 h-16 rounded-2xl border-2 border-[#94A3B8] object-cover bg-black/40 shadow-md"
                />
                <span className="absolute -top-1.5 -right-1 text-base">
                  {COUNTRY_FLAGS[podiumTop3[1].country]?.flag || '🇯🇴'}
                </span>
              </div>

              <h3 className="text-sm font-black text-white truncate max-w-full">
                {podiumTop3[1].name}
              </h3>

              <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] mt-0.5 mb-3">
                <span>{TIER_CONFIG[podiumTop3[1].tier].icon}</span>
                <span className="font-semibold">
                  {isAr
                    ? TIER_CONFIG[podiumTop3[1].tier].labelAr
                    : TIER_CONFIG[podiumTop3[1].tier].labelEn}
                </span>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 bg-black/40 p-2 rounded-xl text-center border border-white/5 text-[11px] font-mono">
                <div>
                  <span className="text-[#64748B] block text-[9px]">{isAr ? 'الفوز' : 'Win %'}</span>
                  <span className="text-[#10B981] font-black">{getDisplayWinRate(podiumTop3[1])}%</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[9px]">{isAr ? 'النقاط' : 'Score'}</span>
                  <span className="text-[#D4AF37] font-black">+{getDisplayScore(podiumTop3[1])}</span>
                </div>
              </div>
            </div>
          )}

          {/* RANK 1: GOLD (CENTER, HIGHER) */}
          {podiumTop3[0] && (
            <div className="relative rounded-3xl bg-gradient-to-b from-[#14261d] via-[#0d2138] to-[#071322] border-2 border-[#D4AF37] p-5 sm:p-6 flex flex-col items-center text-center shadow-2xl ring-2 ring-[#D4AF37]/30 hover:shadow-[#D4AF37]/20 transition-all order-1 md:order-2 scale-[1.02]">
              <div className="absolute -top-4 px-3 py-1 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black text-xs font-black flex items-center gap-1.5 shadow-lg">
                <Crown className="w-3.5 h-3.5 fill-current" />
                <span>{isAr ? 'ملك التركس #1' : 'Trix King #1'}</span>
              </div>

              <div className="relative mt-2 mb-2">
                <img
                  src={podiumTop3[0].avatar}
                  alt={podiumTop3[0].name}
                  className="w-20 h-20 rounded-2xl border-3 border-[#D4AF37] object-cover bg-black/40 shadow-xl"
                />
                <span className="absolute -top-2 -right-1.5 text-xl">
                  {COUNTRY_FLAGS[podiumTop3[0].country]?.flag || '🇯🇴'}
                </span>
                <Crown className="w-6 h-6 text-[#D4AF37] fill-[#D4AF37] absolute -bottom-2 -left-2 drop-shadow-md animate-bounce" />
              </div>

              <h3 className="text-base font-black text-white truncate max-w-full">
                {podiumTop3[0].name}
              </h3>

              <div className="flex items-center gap-1.5 text-xs text-[#D4AF37] font-black mt-0.5 mb-3">
                <span>{TIER_CONFIG[podiumTop3[0].tier].icon}</span>
                <span>
                  {isAr
                    ? TIER_CONFIG[podiumTop3[0].tier].labelAr
                    : TIER_CONFIG[podiumTop3[0].tier].labelEn}
                </span>
                <span>·</span>
                <span className="text-[#EF4444] flex items-center gap-0.5">
                  <Flame className="w-3 h-3 fill-current" />
                  <span>{podiumTop3[0].streak}</span>
                </span>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 bg-black/50 p-2.5 rounded-xl text-center border border-[#D4AF37]/30 text-xs font-mono shadow-inner">
                <div>
                  <span className="text-[#94A3B8] block text-[10px]">{isAr ? 'نسبة الفوز' : 'Win %'}</span>
                  <span className="text-[#10B981] font-black text-sm">{getDisplayWinRate(podiumTop3[0])}%</span>
                </div>
                <div>
                  <span className="text-[#94A3B8] block text-[10px]">{isAr ? 'النقاط' : 'Score'}</span>
                  <span className="text-[#D4AF37] font-black text-sm">+{getDisplayScore(podiumTop3[0])}</span>
                </div>
              </div>
            </div>
          )}

          {/* RANK 3: BRONZE */}
          {podiumTop3[2] && (
            <div className="relative rounded-3xl bg-[#091524] border-2 border-[#CD7F32]/40 p-4 sm:p-5 flex flex-col items-center text-center shadow-lg hover:border-[#CD7F32] transition-all order-3">
              <div className="w-9 h-9 rounded-full bg-[#CD7F32]/20 border border-[#CD7F32]/50 text-[#E0A96D] font-black text-sm flex items-center justify-center mb-2 shadow-inner">
                #3
              </div>

              <div className="relative mb-2">
                <img
                  src={podiumTop3[2].avatar}
                  alt={podiumTop3[2].name}
                  className="w-16 h-16 rounded-2xl border-2 border-[#CD7F32] object-cover bg-black/40 shadow-md"
                />
                <span className="absolute -top-1.5 -right-1 text-base">
                  {COUNTRY_FLAGS[podiumTop3[2].country]?.flag || '🇯🇴'}
                </span>
              </div>

              <h3 className="text-sm font-black text-white truncate max-w-full">
                {podiumTop3[2].name}
              </h3>

              <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] mt-0.5 mb-3">
                <span>{TIER_CONFIG[podiumTop3[2].tier].icon}</span>
                <span className="font-semibold">
                  {isAr
                    ? TIER_CONFIG[podiumTop3[2].tier].labelAr
                    : TIER_CONFIG[podiumTop3[2].tier].labelEn}
                </span>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 bg-black/40 p-2 rounded-xl text-center border border-white/5 text-[11px] font-mono">
                <div>
                  <span className="text-[#64748B] block text-[9px]">{isAr ? 'الفوز' : 'Win %'}</span>
                  <span className="text-[#10B981] font-black">{getDisplayWinRate(podiumTop3[2])}%</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[9px]">{isAr ? 'النقاط' : 'Score'}</span>
                  <span className="text-[#D4AF37] font-black">+{getDisplayScore(podiumTop3[2])}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- 4. INTERACTIVE CONTROLS & FILTER BAR ---------------- */}
      <div className="bg-[#0e1929] rounded-2xl border border-white/10 p-3 sm:p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Timeframe Segmented Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 overflow-x-auto">
          <button
            type="button"
            onClick={() => handleTimeframeChange('ALL_TIME')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              timeframe === 'ALL_TIME'
                ? 'bg-[#D4AF37] text-black shadow-md'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            {isAr ? 'التاريخي (الكلي) 🌐' : 'All-Time (Lifetime)'}
          </button>

          <button
            type="button"
            onClick={() => handleTimeframeChange('MONTHLY')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              timeframe === 'MONTHLY'
                ? 'bg-[#D4AF37] text-black shadow-md'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            {isAr ? 'هذا الشهر 📅' : 'This Month'}
          </button>

          <button
            type="button"
            onClick={() => handleTimeframeChange('WEEKLY')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              timeframe === 'WEEKLY'
                ? 'bg-[#D4AF37] text-black shadow-md'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            {isAr ? 'هذا الأسبوع ⚡' : 'This Week'}
          </button>
        </div>

        {/* Sort By Metric Segmented Controls & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Metric Sort Buttons */}
          <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => handleSortChange('WIN_RATE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                sortBy === 'WIN_RATE'
                  ? 'bg-white/20 text-[#10B981] font-black'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
              title={isAr ? 'ترتيب بنسبة الفوز' : 'Sort by Win Rate'}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>{isAr ? 'نسبة الفوز' : 'Win %'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSortChange('TOTAL_SCORE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                sortBy === 'TOTAL_SCORE'
                  ? 'bg-white/20 text-[#D4AF37] font-black'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
              title={isAr ? 'ترتيب بمجموع النقاط' : 'Sort by Total Score'}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{isAr ? 'مجموع النقاط' : 'Total Score'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSortChange('MATCHES_WON')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                sortBy === 'MATCHES_WON'
                  ? 'bg-white/20 text-[#38BDF8] font-black'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
              title={isAr ? 'ترتيب بعدد الجولات الفائزة' : 'Sort by Wins'}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>{isAr ? 'الانتصارات' : 'Victories'}</span>
            </button>
          </div>

          {/* Player Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث عن لاعب...' : 'Search player...'}
              className="py-1.5 ps-8 pe-3 rounded-xl bg-black/40 border border-white/15 focus:border-[#D4AF37] text-white text-xs outline-none placeholder-[#64748B] w-36 sm:w-44 transition-all"
            />
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute top-1/2 -translate-y-1/2 start-2.5 pointer-events-none" />
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#94A3B8] hover:text-white transition-all cursor-pointer ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title={isAr ? 'تحديث النتائج' : 'Refresh'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ---------------- 5. MAIN RANKINGS TABLE ---------------- */}
      <div className="bg-[#0e1929] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="bg-black/50 border-b border-white/10 text-[#94A3B8] text-[11px] font-bold select-none">
                <th className="py-3.5 px-4 text-start w-16">{isAr ? 'المركز' : 'Rank'}</th>
                <th className="py-3.5 px-4 text-start">{isAr ? 'اللاعب' : 'Player'}</th>
                <th className="py-3.5 px-3 text-center">{isAr ? 'الرتبة' : 'Tier'}</th>
                <th className="py-3.5 px-3 text-center">{isAr ? 'المباريات (ف/خ)' : 'Matches (W/L)'}</th>
                <th className="py-3.5 px-3 text-center">{isAr ? 'نسبة الفوز' : 'Win Rate'}</th>
                <th className="py-3.5 px-4 text-center">{isAr ? 'مجموع النقاط' : 'Score'}</th>
                <th className="py-3.5 px-3 text-center hidden sm:table-cell">{isAr ? 'السلسلة' : 'Streak'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white">
              {filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#94A3B8]">
                    {isAr ? 'لا يوجد لاعبين يطابقون البحث الحالي.' : 'No players match your search query.'}
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((entry) => {
                  const isCurrentUser = entry.isUser === true || (user && entry.id === user.id);
                  const tierInfo = TIER_CONFIG[entry.tier] || TIER_CONFIG.GOLD;
                  const winRateVal = getDisplayWinRate(entry);
                  const winsVal = getDisplayWins(entry);
                  const matchesVal = getDisplayMatches(entry);
                  const lossesVal = Math.max(0, matchesVal - winsVal);
                  const scoreVal = getDisplayScore(entry);

                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${
                        isCurrentUser
                          ? 'bg-[#D4AF37]/10 hover:bg-[#D4AF37]/15 font-bold'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Rank Number / Medal */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-mono">
                          {entry.rank === 1 ? (
                            <span className="w-7 h-7 rounded-lg bg-[#D4AF37]/25 text-[#D4AF37] font-black flex items-center justify-center border border-[#D4AF37]/50 shadow-sm text-xs">
                              👑 1
                            </span>
                          ) : entry.rank === 2 ? (
                            <span className="w-7 h-7 rounded-lg bg-[#94A3B8]/25 text-[#E2E8F0] font-black flex items-center justify-center border border-[#94A3B8]/50 shadow-sm text-xs">
                              🥈 2
                            </span>
                          ) : entry.rank === 3 ? (
                            <span className="w-7 h-7 rounded-lg bg-[#CD7F32]/25 text-[#E0A96D] font-black flex items-center justify-center border border-[#CD7F32]/50 shadow-sm text-xs">
                              🥉 3
                            </span>
                          ) : (
                            <span className="w-7 h-7 rounded-lg bg-black/40 text-[#94A3B8] font-bold flex items-center justify-center border border-white/5 text-xs">
                              #{entry.rank}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Player Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={entry.avatar}
                              alt={entry.name}
                              className={`w-9 h-9 rounded-xl object-cover bg-black/40 ${
                                isCurrentUser ? 'ring-2 ring-[#D4AF37]' : 'border border-white/20'
                              }`}
                            />
                            <span className="absolute -top-1 -right-1 text-xs">
                              {COUNTRY_FLAGS[entry.country]?.flag || '🇯🇴'}
                            </span>
                          </div>

                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className={`font-black truncate ${isCurrentUser ? 'text-[#D4AF37]' : 'text-white'}`}>
                                {entry.name}
                              </span>
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#D4AF37] text-black">
                                  {isAr ? 'أنت' : 'YOU'}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#64748B] block truncate">
                              {COUNTRY_FLAGS[entry.country]?.nameAr || 'الأردن'} · {entry.highestScore} {isAr ? 'أعلى جولة' : 'high score'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tier Badge */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black border ${tierInfo.border} ${tierInfo.bg} ${tierInfo.color}`}
                        >
                          <span>{tierInfo.icon}</span>
                          <span className="hidden sm:inline">
                            {isAr ? tierInfo.labelAr : tierInfo.labelEn}
                          </span>
                        </span>
                      </td>

                      {/* Matches Played / Won / Lost */}
                      <td className="py-3.5 px-3 text-center font-mono text-[11px]">
                        <span className="text-white font-bold">{matchesVal}</span>
                        <span className="text-[#64748B] text-[10px] block">
                          <span className="text-[#10B981]">{winsVal}ف</span> /{' '}
                          <span className="text-[#EF4444]">{lossesVal}خ</span>
                        </span>
                      </td>

                      {/* Win Rate Progress & Percentage */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex flex-col items-center gap-1 w-20 sm:w-24">
                          <span className="font-mono font-black text-xs text-[#10B981]">
                            {winRateVal}%
                          </span>
                          <div className="w-full h-1.5 rounded-full bg-black/60 border border-white/10 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(0, winRateVal))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Total Cumulative Score */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="text-xs sm:text-sm font-black text-[#D4AF37]">
                          +{scoreVal}
                        </span>
                        <span className="text-[10px] text-[#64748B] block">PTS</span>
                      </td>

                      {/* Win Streak */}
                      <td className="py-3.5 px-3 text-center hidden sm:table-cell">
                        {entry.streak > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-mono font-black text-[#EF4444]">
                            <Flame className="w-3.5 h-3.5 fill-current" />
                            <span>{entry.streak}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-[#64748B] font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info Strip */}
        <div className="bg-black/40 border-t border-white/10 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <span>🛡️</span>
            <span>
              {isAr
                ? 'يتم تحديث لوحة الشرف فورياً عند نهاية كل مباراة تركس رسمية.'
                : 'Leaderboard standings update automatically upon every official Trix match conclusion.'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>{isAr ? 'إجمالي الأبطال: ' : 'Total Players: '} {rawLeaderboard.length}</span>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(isAr ? 'هل تريد استعادة الترتيب الافتراضي للأبطال؟' : 'Reset leaderboard to default champions?')) {
                  storage.resetTrixLeaderboard();
                  handleRefresh();
                }
              }}
              className="text-[#64748B] hover:text-[#EF4444] text-[10px] underline cursor-pointer"
            >
              {isAr ? 'إعادة ضبط' : 'Reset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
