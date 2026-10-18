import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { storage, EGYPTIAN_CLUBS } from '../services/storage';
import { soundManager } from '../services/sound';
import {
  ConnectedWalletState,
  UserProfile,
  SportsMatch,
  BetSlipSelection,
  SportsBetRecord,
  EgyptianClub,
} from '../types';
import {
  Trophy,
  Flame,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Play,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Shield,
  Coins,
  Wallet,
  Activity,
  Layers,
} from 'lucide-react';

interface SportsBettingProps {
  user: UserProfile | null;
  walletState: ConnectedWalletState;
  onUpdateUser: (data: Partial<UserProfile>) => void;
  onShowNotification: (type: 'success' | 'error' | 'win', msg: string) => void;
  initialLeague?: 'JORDAN' | 'EGYPT' | 'ALL';
}

export const SportsBetting: React.FC<SportsBettingProps> = ({
  user,
  walletState,
  onUpdateUser,
  onShowNotification,
  initialLeague,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const isJordan = user?.country === 'JO' || user?.currency === 'JOD';
  const currencySymbol = isJordan ? 'د.أ' : 'ج.م';

  // Matches & Bets State
  const [matches, setMatches] = useState<SportsMatch[]>(() => storage.getSportsMatches());
  const [sportsBets, setSportsBets] = useState<SportsBetRecord[]>(() => storage.getSportsBets());
  const [selectedLeague, setSelectedLeague] = useState<'ALL' | 'JORDAN' | 'EGYPT'>(() => {
    if (initialLeague) return initialLeague;
    return isJordan ? 'JORDAN' : 'EGYPT';
  });

  // Sync selectedLeague when initialLeague prop changes from parent tabs
  useEffect(() => {
    if (initialLeague) {
      setSelectedLeague(initialLeague);
    }
  }, [initialLeague]);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'LIVE' | 'TODAY' | 'TOMORROW' | 'CUP'>('ALL');

  // Bet Slip State
  const [selections, setSelections] = useState<BetSlipSelection[]>([]);
  const [betType, setBetType] = useState<'SINGLE' | 'ACCUMULATOR'>('ACCUMULATOR');
  const [stakeAmount, setStakeAmount] = useState<number>(() => (isJordan ? 2 : 20));
  const [betSource, setBetSource] = useState<'SITE_BALANCE' | 'WEB3_WALLET'>('SITE_BALANCE');
  const [betSlipOpenMobile, setBetSlipOpenMobile] = useState<boolean>(false);

  // Simulation status message
  const [simulationResult, setSimulationResult] = useState<{
    wonCount: number;
    lostCount: number;
    totalPayout: number;
  } | null>(null);

  // Periodically increment live minutes slightly for realism
  useEffect(() => {
    const timer = setInterval(() => {
      setMatches((prev) =>
        prev.map((m) => {
          if (m.status === 'LIVE' && m.minute && m.minute < 90) {
            return { ...m, minute: m.minute + 1 };
          }
          return m;
        })
      );
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  const isJordanMatch = (league: string) =>
    league.includes('الأردن') || league.includes('أردني') || league.includes('Jordan');

  // Filter matches based on selected league and category tab
  const filteredMatches = matches.filter((m) => {
    // 1. League Filter
    if (selectedLeague === 'JORDAN' && !isJordanMatch(m.league)) return false;
    if (selectedLeague === 'EGYPT' && isJordanMatch(m.league)) return false;

    // 2. Subcategory Filter
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'LIVE') return m.status === 'LIVE';
    if (activeCategory === 'TODAY') return m.startTimeText.includes('اليوم') || m.status === 'LIVE';
    if (activeCategory === 'TOMORROW') return m.startTimeText.includes('غداً');
    if (activeCategory === 'CUP') return m.league.includes('كأس');
    return true;
  });

  // Toggle selection in Bet Slip
  const handleToggleSelection = (
    match: SportsMatch,
    marketType: '1X2' | 'TOTAL_GOALS' | 'BTTS',
    marketLabel: string,
    pick: '1' | 'X' | '2' | 'OVER_25' | 'UNDER_25' | 'BTTS_YES' | 'BTTS_NO',
    pickLabel: string,
    odd: number
  ) => {
    const matchTitle = `${match.homeTeam.nameAr} ضد ${match.awayTeam.nameAr}`;

    setSelections((prev) => {
      // Check if this exact pick already exists -> remove it
      const existingExact = prev.find((s) => s.matchId === match.id && s.pick === pick);
      if (existingExact) {
        return prev.filter((s) => !(s.matchId === match.id && s.pick === pick));
      }

      // Check if another pick for the same match & market exists -> replace it
      const existingSameMarket = prev.filter(
        (s) => !(s.matchId === match.id && s.marketType === marketType)
      );

      return [
        ...existingSameMarket,
        {
          matchId: match.id,
          matchTitle,
          league: match.league,
          marketType,
          marketLabel,
          pick,
          pickLabel,
          odd,
        },
      ];
    });

    // On mobile, auto open bet slip preview if first selection
    if (selections.length === 0) {
      setBetSlipOpenMobile(true);
    }
  };

  const isSelectionActive = (matchId: string, pick: string): boolean => {
    return selections.some((s) => s.matchId === matchId && s.pick === pick);
  };

  // Calculate combined total odds
  const totalOdds =
    selections.length === 0
      ? 1.0
      : betType === 'SINGLE'
      ? selections[0].odd
      : Number(selections.reduce((acc, s) => acc * s.odd, 1).toFixed(2));

  const potentialPayout = Number((stakeAmount * totalOdds).toFixed(2));
  const netProfit = Number((potentialPayout - stakeAmount).toFixed(2));

  // Place sports bet handler
  const handlePlaceSportsBet = () => {
    if (selections.length === 0) {
      onShowNotification('error', isAr ? 'قسيمة الرهان فارغة.' : 'Bet slip is empty.');
      return;
    }

    const res = storage.placeSportsBet(selections, stakeAmount, betType, betSource);

    if (!res.success) {
      onShowNotification('error', res.error || (isAr ? 'فشل تسجيل الرهان.' : 'Failed to place bet.'));
      return;
    }

    soundManager.playPlaceBet();
    setSportsBets([...storage.getSportsBets()]);
    const freshU = storage.getUser();
    if (freshU) onUpdateUser(freshU);

    // Small celebratory confetti
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#10B981', '#F59E0B'],
    });

    onShowNotification(
      'success',
      isAr
        ? `تم تأكيد الرهان بقيمة $${stakeAmount} بمضاعف ${totalOdds}x`
        : `Bet confirmed: $${stakeAmount} at ${totalOdds}x`
    );

    // Clear selections
    setSelections([]);
  };

  // Simulate concluding all matches immediately
  const handleSimulateMatches = () => {
    soundManager.playGoalWhistle();
    const result = storage.simulateMatchResults();
    setMatches([...result.updatedMatches]);
    setSportsBets([...storage.getSportsBets()]);
    const freshU = storage.getUser();
    if (freshU) onUpdateUser(freshU);
    setSimulationResult({
      wonCount: result.wonCount,
      lostCount: result.lostCount,
      totalPayout: result.totalPayout,
    });

    if (result.wonCount > 0) {
      soundManager.playWin();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#10B981', '#34D399', '#F59E0B'],
      });

      onShowNotification(
        'win',
        isAr
          ? `مبروك! فزت بـ ${result.wonCount} رهان وأرباح قدرها $${result.totalPayout.toFixed(2)} USDT!`
          : `Congratulations! Won ${result.wonCount} bets and $${result.totalPayout.toFixed(2)} USDT!`
      );
    } else {
      onShowNotification(
        'success',
        isAr
          ? `تمت محاكاة حسم جميع المباريات بنجاح.`
          : `Matches simulated and concluded successfully.`
      );
    }
  };

  // Reset matches back to default upcoming
  const handleResetMatches = () => {
    const def = storage.resetMatchesToDefault();
    setMatches([...def]);
    setSimulationResult(null);
    onShowNotification('success', isAr ? 'تمت إعادة تعيين المباريات للجدول الافتراضي.' : 'Matches reset to default.');
  };

  const quickStakes = isJordan ? [1, 2, 5, 10, 20] : [10, 20, 50, 100, 250];

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-2 space-y-4 select-none">
      {/* Top Banner: Dual League Header + Simulation Buttons */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] border border-[#334155] rounded-3xl p-4 sm:p-5 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10B981] via-[#0284C7] to-[#CA8A04] flex items-center justify-center text-white text-2xl shadow-md shrink-0">
            ⚽
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                {isAr ? 'الدوري الأردني للمحترفين 🇯🇴 والدوري المصري الممتاز 🇪🇬' : 'Jordan Pro League 🇯🇴 & Egyptian Premier League 🇪🇬'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                <span>30 {isAr ? 'نادياً' : 'Clubs'}</span>
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              {isAr
                ? 'فصل كامل بين أندية الدوري الأردني والمصري، مع أيقونات خاصة لكل نادٍ وحساب فوري للأرباح'
                : 'Complete separation between Jordanian and Egyptian clubs with distinct team badges & instant settlement'}
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-2xl bg-[#1e293b] border border-[#334155] text-white font-bold text-xs flex items-center gap-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[#94A3B8]">{isAr ? 'احتمالات مباشرة:' : 'Live Odds:'}</span>
            <span className="text-[#10B981] font-mono">{filteredMatches.length} {isAr ? 'مباراة' : 'matches'}</span>
          </div>
        </div>
      </div>

      {/* Simulation Result Notification Card */}
      {simulationResult && (
        <div className="p-3.5 bg-[#10B981]/15 border border-[#10B981]/40 rounded-2xl text-xs sm:text-sm font-bold text-white flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0" />
            <span>
              {isAr
                ? `اكتملت محاكاة الجولة! تم حسم ${simulationResult.wonCount} رهان فائز، وإجمالي الأرباح الموزعة: ${simulationResult.totalPayout.toFixed(2)} ${currencySymbol}`
                : `Round simulated! ${simulationResult.wonCount} won bets, total payouts: ${simulationResult.totalPayout.toFixed(2)} ${currencySymbol}`}
            </span>
          </div>
          <button
            onClick={() => setSimulationResult(null)}
            className="text-xs text-[#94A3B8] hover:text-white px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Main Layout: Matches Column (8 cols) + Bet Slip (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Side: Category Filters + Matches Feed */}
        <div className="lg:col-span-8 space-y-3">
          {/* 1. Distinct League Switcher: Jordan vs Egypt vs All */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 bg-[#F5F2EB] p-1.5 rounded-2xl border border-[#E6E1D5]">
            <button
              onClick={() => setSelectedLeague('JORDAN')}
              className={`py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedLeague === 'JORDAN'
                  ? 'bg-[#0284C7] text-white shadow-md'
                  : 'text-[#4B5563] hover:text-[#1F2937]'
              }`}
            >
              <span className="text-base">🇯🇴</span>
              <span className="truncate">{isAr ? 'الدوري الأردني للمحترفين' : 'Jordan League'}</span>
            </button>

            <button
              onClick={() => setSelectedLeague('EGYPT')}
              className={`py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedLeague === 'EGYPT'
                  ? 'bg-[#D97706] text-white shadow-md'
                  : 'text-[#4B5563] hover:text-[#1F2937]'
              }`}
            >
              <span className="text-base">🇪🇬</span>
              <span className="truncate">{isAr ? 'الدوري المصري الممتاز' : 'Egypt League'}</span>
            </button>

            <button
              onClick={() => setSelectedLeague('ALL')}
              className={`py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedLeague === 'ALL'
                  ? 'bg-[#1F2937] text-white shadow-md'
                  : 'text-[#4B5563] hover:text-[#1F2937]'
              }`}
            >
              <span>⚽</span>
              <span>{isAr ? 'جميع الدوريات' : 'All Leagues'}</span>
            </button>
          </div>

          {/* Subcategory Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'ALL', labelAr: 'جميع المباريات', labelEn: 'All Matches' },
              { id: 'LIVE', labelAr: 'مباشر الآن (LIVE)', labelEn: 'Live Now' },
              { id: 'TODAY', labelAr: 'مباريات اليوم', labelEn: 'Today' },
              { id: 'TOMORROW', labelAr: 'مباريات الغد', labelEn: 'Tomorrow' },
              { id: 'CUP', labelAr: 'الكؤوس (كأس الأردن ومصر)', labelEn: 'Cups' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  activeCategory === cat.id
                    ? 'bg-[#1F2937] text-white shadow-sm ring-2 ring-[#F59E0B]/30'
                    : 'bg-[#F5F2EB] text-[#4B5563] hover:bg-white hover:text-[#1F2937]'
                }`}
              >
                {isAr ? cat.labelAr : cat.labelEn}
              </button>
            ))}
          </div>


          {/* Matches List */}
          <div className="space-y-3">
            {filteredMatches.map((match) => (
              <MatchBetCard
                key={match.id}
                match={match}
                isSelectionActive={isSelectionActive}
                onToggleSelection={handleToggleSelection}
                isAr={isAr}
              />
            ))}
          </div>
        </div>

        {/* Right Side: Smart Bet Slip (Sticky on desktop, floating button on mobile) */}
        <div className="lg:col-span-4 sticky top-24 space-y-3">
          <div className="bg-white border border-[#E6E1D5] rounded-3xl p-4 shadow-xl space-y-3 text-[#1F2937]">
            {/* Bet Slip Header */}
            <div className="flex items-center justify-between border-b border-[#F3EFE6] pb-2.5">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#F59E0B]" />
                <h3 className="text-sm font-black text-[#1F2937]">
                  {isAr ? 'قسيمة الرهان (Bet Slip)' : 'Smart Bet Slip'}
                </h3>
              </div>

              {selections.length > 0 && (
                <button
                  onClick={() => setSelections([])}
                  className="text-[11px] text-[#EF4444] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{isAr ? 'مسح الكل' : 'Clear'}</span>
                </button>
              )}
            </div>

            {/* Bet Type: Single vs Accumulator / Parlay */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#F5F2EB] rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setBetType('SINGLE')}
                className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                  betType === 'SINGLE'
                    ? 'bg-white text-[#1F2937] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                {isAr ? 'فردي (Single)' : 'Single'}
              </button>
              <button
                type="button"
                onClick={() => setBetType('ACCUMULATOR')}
                className={`py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                  betType === 'ACCUMULATOR'
                    ? 'bg-white text-[#1F2937] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                <Layers className="w-3 h-3 text-[#F59E0B]" />
                <span>{isAr ? 'تراكمي (Multi)' : 'Multi'}</span>
              </button>
            </div>

            {/* Selections List */}
            {selections.length === 0 ? (
              <div className="py-8 text-center text-[#9CA3AF] space-y-2">
                <Trophy className="w-8 h-8 mx-auto opacity-30 text-[#F59E0B]" />
                <p className="text-xs font-medium">
                  {isAr
                    ? 'اختر توقعاً من المباريات لإضافته إلى قسيمة الرهان'
                    : 'Select match odds to build your bet slip'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {selections.map((sel) => (
                  <div
                    key={`${sel.matchId}_${sel.pick}`}
                    className="p-2.5 bg-[#FFFDF9] border border-[#E6E1D5] rounded-2xl text-xs relative group"
                  >
                    <button
                      onClick={() =>
                        setSelections((prev) =>
                          prev.filter((s) => !(s.matchId === sel.matchId && s.pick === sel.pick))
                        )
                      }
                      className="absolute end-2 top-2 text-[#9CA3AF] hover:text-[#EF4444] cursor-pointer"
                    >
                      ✕
                    </button>
                    <div className="text-[10px] text-[#78716C] font-medium">{sel.league}</div>
                    <div className="font-bold text-[#1F2937] truncate pe-4">{sel.matchTitle}</div>
                    <div className="flex items-center justify-between pt-1 mt-1 border-t border-[#F5F2EB]">
                      <span className="text-[#047857] font-bold">
                        {sel.marketLabel}: {sel.pickLabel}
                      </span>
                      <span className="font-mono font-black text-[#F59E0B] text-sm">
                        {sel.odd.toFixed(2)}x
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stake & Balance Selector */}
            {selections.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-[#F3EFE6]">
                {/* Source: Site Balance vs Web3 Wallet */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#78716C] font-bold">{isAr ? 'خصم من:' : 'Source:'}</span>
                  <div className="flex items-center gap-1 bg-[#F5F2EB] p-0.5 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setBetSource('SITE_BALANCE')}
                      className={`px-2 py-1 rounded cursor-pointer ${
                        betSource === 'SITE_BALANCE'
                          ? 'bg-white text-[#1F2937] shadow-xs'
                          : 'text-[#6B7280]'
                      }`}
                    >
                      {isAr ? 'الرصيد' : 'Balance'} ({(user?.balance ?? 0).toFixed(0)} {currencySymbol})
                    </button>
                    {walletState.isConnected && (
                      <button
                        type="button"
                        onClick={() => setBetSource('WEB3_WALLET')}
                        className={`px-2 py-1 rounded cursor-pointer ${
                          betSource === 'WEB3_WALLET'
                            ? 'bg-white text-[#047857] shadow-xs'
                            : 'text-[#6B7280]'
                        }`}
                      >
                        {isAr ? 'المحفظة' : 'Wallet'} (${walletState.balanceUSDT.toFixed(0)})
                      </button>
                    )}
                  </div>
                </div>

                {/* Stake Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#78716C]">
                    <span>{isAr ? 'مبلغ الرهان (Stake)' : 'Stake Amount'}</span>
                    <span className="font-mono text-xs font-bold text-[#1F2937]">{currencySymbol}</span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full px-3.5 py-2.5 bg-[#FFFDF9] border border-[#D9D2C5] rounded-xl font-mono text-base font-bold text-[#1F2937] focus:outline-none focus:border-[#F59E0B]"
                  />

                  {/* Quick Stake Chips */}
                  <div className="flex items-center gap-1 pt-1">
                    {quickStakes.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setStakeAmount(amt)}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-mono font-bold border cursor-pointer ${
                          stakeAmount === amt
                            ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#B45309]'
                            : 'bg-[#F5F2EB] border-[#E6E1D5] text-[#4B5563]'
                        }`}
                      >
                        {amt} {currencySymbol}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Potential Payout Breakdown */}
                <div className="p-3 bg-[#FFFDF9] rounded-2xl border border-[#E6E1D5] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[#78716C]">
                    <span>{isAr ? 'إجمالي المضاعف:' : 'Total Odds:'}</span>
                    <span className="font-mono font-black text-[#F59E0B] text-sm">
                      {totalOdds.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-[#047857]">
                    <span>{isAr ? 'الربح الصافي المتوقع:' : 'Potential Net Payout:'}</span>
                    <span className="font-mono text-base">
                      +{potentialPayout.toFixed(2)} {currencySymbol}
                    </span>
                  </div>
                </div>

                {/* Confirm Bet Button */}
                <button
                  type="button"
                  onClick={handlePlaceSportsBet}
                  className="w-full min-h-[48px] py-3 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white font-black text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Trophy className="w-4 h-4 fill-white/20" />
                  <span>
                    {isAr ? `تأكيد الرهان (${stakeAmount} ${currencySymbol})` : `Place Bet (${stakeAmount} ${currencySymbol})`}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* User's Recent Sports Bets Ledger */}
          {sportsBets.length > 0 && (
            <div className="bg-white border border-[#E6E1D5] rounded-3xl p-4 shadow-sm space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-[#F3EFE6] pb-2 font-bold text-[#1F2937]">
                <span>{isAr ? 'رهاناتي الرياضية الأخيرة' : 'My Recent Bets'}</span>
                <span className="text-[10px] text-[#78716C] font-mono">{sportsBets.length}</span>
              </div>
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                {sportsBets.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    className={`p-2 rounded-xl border flex items-center justify-between ${
                      b.status === 'WON'
                        ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#047857]'
                        : b.status === 'LOST'
                        ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#B91C1C]'
                        : 'bg-[#F5F2EB] border-[#E6E1D5] text-[#1F2937]'
                    }`}
                  >
                    <div>
                      <div className="font-bold font-mono">
                        ${b.amount} @ {b.totalOdds}x
                      </div>
                      <div className="text-[10px] text-[#78716C]">
                        {b.selections.length} {isAr ? 'توقعات' : 'picks'} · {b.type}
                      </div>
                    </div>

                    <div className="text-end font-bold font-mono">
                      {b.status === 'WON' && <span className="text-[#047857]">+$ {b.actualPayout}</span>}
                      {b.status === 'LOST' && <span className="text-[#DC2626]">خسارة</span>}
                      {b.status === 'PENDING' && (
                        <span className="text-[#F59E0B]">قيد الانتظار</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable Match Bet Card with all 18 Egyptian clubs badges & odds markets
interface MatchBetCardProps {
  match: SportsMatch;
  isSelectionActive: (matchId: string, pick: string) => boolean;
  onToggleSelection: (
    match: SportsMatch,
    marketType: '1X2' | 'TOTAL_GOALS' | 'BTTS',
    marketLabel: string,
    pick: '1' | 'X' | '2' | 'OVER_25' | 'UNDER_25' | 'BTTS_YES' | 'BTTS_NO',
    pickLabel: string,
    odd: number
  ) => void;
  isAr: boolean;
}

const MatchBetCard: React.FC<MatchBetCardProps> = ({
  match,
  isSelectionActive,
  onToggleSelection,
  isAr,
}) => {
  const isLive = match.status === 'LIVE';

  return (
    <div className="bg-white border border-[#E6E1D5] hover:border-[#D1C9B8] rounded-3xl p-4 shadow-sm transition-all space-y-3">
      {/* Top Header: League, Stadium, Time & Live Badge */}
      <div className="flex items-center justify-between text-xs border-b border-[#F5F2EB] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#4B5563]">{match.league}</span>
          <span className="text-[#9CA3AF]">·</span>
          <span className="text-[11px] text-[#78716C] hidden sm:inline">{match.stadium}</span>
        </div>

        <div>
          {isLive ? (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#EF4444]/10 text-[#DC2626] border border-[#EF4444]/20 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
              <span>
                {isAr ? 'مباشر' : 'LIVE'} {match.minute}&apos;
              </span>
            </span>
          ) : match.status === 'FINISHED' ? (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#10B981]/15 text-[#047857]">
              {isAr ? 'انتهت' : 'FINISHED'}
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#F5F2EB] text-[#4B5563]">
              {match.startTimeText}
            </span>
          )}
        </div>
      </div>

      {/* Matchup Center: Home Team vs Away Team with Authentic Crests */}
      <div className="grid grid-cols-12 items-center gap-2 py-1">
        {/* Home Club */}
        <div className="col-span-5 flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-xs shrink-0 border"
            style={{
              backgroundColor: match.homeTeam.primaryColor + '15',
              borderColor: match.homeTeam.primaryColor + '40',
            }}
          >
            <span>{match.homeTeam.badgeSymbol}</span>
          </div>
          <div className="min-w-0">
            <div className="font-black text-sm text-[#1F2937] truncate">
              {isAr ? match.homeTeam.nameAr : match.homeTeam.nameEn}
            </div>
            <div className="text-[10px] text-[#78716C] truncate">
              {match.homeTeam.city} · {match.homeTeam.shortName}
            </div>
          </div>
        </div>

        {/* Score / VS Center */}
        <div className="col-span-2 text-center">
          {isLive || match.status === 'FINISHED' ? (
            <div className="font-mono font-black text-xl text-[#1F2937] tracking-wider bg-[#F5F2EB] px-2 py-1 rounded-xl inline-block border border-[#E6E1D5]">
              {match.homeScore} - {match.awayScore}
            </div>
          ) : (
            <span className="text-xs font-black text-[#9CA3AF] uppercase">VS</span>
          )}
        </div>

        {/* Away Club */}
        <div className="col-span-5 flex items-center justify-end gap-2.5 text-end">
          <div className="min-w-0">
            <div className="font-black text-sm text-[#1F2937] truncate">
              {isAr ? match.awayTeam.nameAr : match.awayTeam.nameEn}
            </div>
            <div className="text-[10px] text-[#78716C] truncate">
              {match.awayTeam.city} · {match.awayTeam.shortName}
            </div>
          </div>
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-xs shrink-0 border"
            style={{
              backgroundColor: match.awayTeam.primaryColor + '15',
              borderColor: match.awayTeam.primaryColor + '40',
            }}
          >
            <span>{match.awayTeam.badgeSymbol}</span>
          </div>
        </div>
      </div>

      {/* Betting Markets Grid: 1X2 + Over/Under 2.5 + BTTS */}
      <div className="space-y-2 pt-2 border-t border-[#F5F2EB]">
        {/* Market 1: Match Winner (1 - X - 2) */}
        <div>
          <span className="text-[10px] font-bold text-[#78716C] block mb-1">
            {isAr ? 'نتيجة المباراة (1X2)' : 'Match Winner (1X2)'}
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {/* 1: Home Win */}
            <button
              onClick={() =>
                onToggleSelection(
                  match,
                  '1X2',
                  isAr ? 'الفائز' : 'Winner',
                  '1',
                  isAr ? match.homeTeam.nameAr : match.homeTeam.shortName,
                  match.odds.home
                )
              }
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                isSelectionActive(match.id, '1')
                  ? 'bg-[#F59E0B] text-black border-[#D97706] shadow-sm font-black'
                  : 'bg-[#FFFDF9] hover:bg-[#F5F2EB] border-[#E6E1D5] text-[#1F2937]'
              }`}
            >
              <span className="text-[11px] truncate max-w-[70px]">1 ({match.homeTeam.shortName})</span>
              <span className="font-mono text-xs">{match.odds.home.toFixed(2)}</span>
            </button>

            {/* X: Draw */}
            <button
              onClick={() =>
                onToggleSelection(
                  match,
                  '1X2',
                  isAr ? 'الفائز' : 'Winner',
                  'X',
                  isAr ? 'تعادل' : 'Draw',
                  match.odds.draw
                )
              }
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                isSelectionActive(match.id, 'X')
                  ? 'bg-[#F59E0B] text-black border-[#D97706] shadow-sm font-black'
                  : 'bg-[#FFFDF9] hover:bg-[#F5F2EB] border-[#E6E1D5] text-[#1F2937]'
              }`}
            >
              <span className="text-[11px]">{isAr ? 'تعادل (X)' : 'Draw (X)'}</span>
              <span className="font-mono text-xs">{match.odds.draw.toFixed(2)}</span>
            </button>

            {/* 2: Away Win */}
            <button
              onClick={() =>
                onToggleSelection(
                  match,
                  '1X2',
                  isAr ? 'الفائز' : 'Winner',
                  '2',
                  isAr ? match.awayTeam.nameAr : match.awayTeam.shortName,
                  match.odds.away
                )
              }
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                isSelectionActive(match.id, '2')
                  ? 'bg-[#F59E0B] text-black border-[#D97706] shadow-sm font-black'
                  : 'bg-[#FFFDF9] hover:bg-[#F5F2EB] border-[#E6E1D5] text-[#1F2937]'
              }`}
            >
              <span className="text-[11px] truncate max-w-[70px]">2 ({match.awayTeam.shortName})</span>
              <span className="font-mono text-xs">{match.odds.away.toFixed(2)}</span>
            </button>
          </div>
        </div>

        {/* Secondary Markets: Total Goals 2.5 & Both to Score (BTTS) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
          {/* Over 2.5 */}
          <button
            onClick={() =>
              onToggleSelection(
                match,
                'TOTAL_GOALS',
                isAr ? 'إجمالي الأهداف' : 'Goals',
                'OVER_25',
                '+2.5 أهداف',
                match.odds.over25
              )
            }
            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-between ${
              isSelectionActive(match.id, 'OVER_25')
                ? 'bg-[#10B981] text-white border-[#059669]'
                : 'bg-[#F5F2EB]/60 hover:bg-[#F5F2EB] border-[#E6E1D5] text-[#4B5563]'
            }`}
          >
            <span>+2.5 هدف</span>
            <span className="font-mono font-bold">{match.odds.over25.toFixed(2)}</span>
          </button>

          {/* Under 2.5 */}
          <button
            onClick={() =>
              onToggleSelection(
                match,
                'TOTAL_GOALS',
                isAr ? 'إجمالي الأهداف' : 'Goals',
                'UNDER_25',
                '-2.5 أهداف',
                match.odds.under25
              )
            }
            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-between ${
              isSelectionActive(match.id, 'UNDER_25')
                ? 'bg-[#10B981] text-white border-[#059669]'
                : 'bg-[#F5F2EB]/60 hover:bg-[#F5F2EB] border-[#E6E1D5] text-[#4B5563]'
            }`}
          >
            <span>-2.5 هدف</span>
            <span className="font-mono font-bold">{match.odds.under25.toFixed(2)}</span>
          </button>

          {/* BTTS Yes */}
          <button
            onClick={() =>
              onToggleSelection(
                match,
                'BTTS',
                isAr ? 'كلا الفريقين يسجل' : 'BTTS',
                'BTTS_YES',
                'نعم يسجلان',
                match.odds.bttsYes
              )
            }
            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-between ${
              isSelectionActive(match.id, 'BTTS_YES')
                ? 'bg-[#10B981] text-white border-[#059669]'
                : 'bg-[#F5F2EB]/60 hover:bg-[#F5F2EB] border-[#E6E1D5] text-[#4B5563]'
            }`}
          >
            <span>تسجيل كلاهما: نعم</span>
            <span className="font-mono font-bold">{match.odds.bttsYes.toFixed(2)}</span>
          </button>

          {/* BTTS No */}
          <button
            onClick={() =>
              onToggleSelection(
                match,
                'BTTS',
                isAr ? 'كلا الفريقين يسجل' : 'BTTS',
                'BTTS_NO',
                'لا يسجلان',
                match.odds.bttsNo
              )
            }
            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-between ${
              isSelectionActive(match.id, 'BTTS_NO')
                ? 'bg-[#10B981] text-white border-[#059669]'
                : 'bg-[#F5F2EB]/60 hover:bg-[#F5F2EB] border-[#E6E1D5] text-[#4B5563]'
            }`}
          >
            <span>تسجيل كلاهما: لا</span>
            <span className="font-mono font-bold">{match.odds.bttsNo.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
