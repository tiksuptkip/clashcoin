import React from 'react';
import { useTranslation } from 'react-i18next';
import { Coins, Plane, Trophy, Flame, TrendingUp, ShieldCheck, Zap, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { MainAppMode, TopModeSwitcher } from './TopModeSwitcher';
import { CoinSymbol, SportsMatch, UserProfile } from '../types';

interface HomeLobbyProps {
  user: UserProfile | null;
  prices: Record<CoinSymbol, number>;
  changes: Record<CoinSymbol, number>;
  matches: SportsMatch[];
  onSelectMode: (mode: MainAppMode) => void;
  onOpenDeposit: () => void;
  onOpenRules: () => void;
  onOpenProvablyFair: () => void;
}

export const HomeLobby: React.FC<HomeLobbyProps> = ({
  user,
  prices,
  changes,
  matches,
  onSelectMode,
  onOpenDeposit,
  onOpenRules,
  onOpenProvablyFair,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const isJordan = user?.country === 'JO' || user?.currency === 'JOD';
  const currencySymbol = isJordan ? 'د.أ' : 'ج.م';

  const btcPrice = prices.BTC || 67450;
  const btcChange = changes.BTC || 2.45;

  const jordanMatches = matches.filter(
    (m) => m.league.includes('الأردن') || m.league.includes('أردني') || m.league.includes('Jordan')
  );
  const egyptMatches = matches.filter(
    (m) => !m.league.includes('الأردن') && !m.league.includes('أردني') && !m.league.includes('Jordan')
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* =========================================================================
          MAIN NAVIGATION SHORTCUTS BAR (Exclusively on Homepage View!)
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#E6E1D5] shadow-xs overflow-hidden p-2 sm:p-3">
        <div className="flex items-center justify-between px-2 py-1 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
            <h2 className="text-xs sm:text-sm font-black text-[#1F2937]">
              {isAr ? 'اختر لعبتك المفضلة وابدأ المنافسة فوراً' : 'Select Game & Enter the Arena'}
            </h2>
          </div>
          <span className="text-[11px] font-bold text-[#F59E0B] font-mono">
            ClashOfCoin.bet
          </span>
        </div>

        {/* The 4 Decoupled Main Navigation Shortcuts */}
        <TopModeSwitcher
          activeMode="home"
          onChangeMode={(mode) => onSelectMode(mode)}
          liveSportsCount={matches.filter((m) => m.status === 'LIVE').length}
        />
      </div>

      {/* =========================================================================
          HERO BANNER: Welcome to Clash of Coin
          ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#111827] via-[#1F2937] to-[#0F172A] border border-[#374151] p-5 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#F59E0B] text-xs font-black">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'المنصة الأولى لألعاب التوقع والرياضة بالشرق الأوسط' : 'Premier Crypto & Sports Hub'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            {isAr ? 'اربح مع كل صعود وهبوط، هدف، ومضاعف طائرة' : 'Predict, Multiply & Win Instantly'}
          </h1>

          <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
            {isAr
              ? 'توقع مسار العملات مباشرة من بينانس، ضاعف أرباحك مع لعبة الطائرة Aviator، وراهن على أقوى مواجهات الدوريين الأردني والمصري مع سحب فوري عبر كليك CliQ والمحافظ الإلكترونية.'
              : 'Live Binance crypto prediction, 100x Aviator multipliers, and authentic Jordan & Egypt football betting with instant local cashout.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onSelectMode('crypto')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-black font-black text-xs sm:text-sm transition-all shadow-lg active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>{isAr ? 'دخول معركة العملات ⚡' : 'Enter Crypto Battle ⚡'}</span>
            </button>

            <button
              onClick={() => onSelectMode('crash')}
              className="px-5 py-3 rounded-2xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-black text-xs sm:text-sm transition-all shadow-lg active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>{isAr ? 'انطلاق الطائرة Aviator 🚀' : 'Fly Aviator 🚀'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          THE 4 DISTINCT GAME HUB CARDS:
          1. معركة العملات الرقمية
          2. لعبة الطائرة (Aviator)
          3. الدوري الأردني للمحترفين
          4. الدوري المصري الممتاز
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD 1: CRYPTO BATTLE */}
        <div
          onClick={() => onSelectMode('crypto')}
          className="group relative bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] hover:border-[#F59E0B] p-5 shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center border border-[#F59E0B]/30 group-hover:scale-105 transition-transform">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#1F2937]">
                    {isAr ? 'معركة العملات الرقمية' : 'Cryptocurrency Battle'}
                  </h3>
                  <span className="text-[11px] text-[#78716C]">
                    Binance Live Feed · BTC · ETH · SOL
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#10B981]/15 text-[#047857] border border-[#10B981]/30">
                {isAr ? 'جولة كل 30 ثانية' : '30s Rounds'}
              </span>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              {isAr
                ? 'توقع هل سيصعد سعر البيتكوين أم يهبط خلال 30 ثانية، مع بوابات رهان مرنة وحساب فوري للأرباح.'
                : 'Predict whether Bitcoin rises or falls in 30 seconds with instant smart-contract settlements.'}
            </p>

            {/* Live Ticker Preview */}
            <div className="p-3 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono">
                <span className="font-black text-sm text-[#1F2937]">BTC/USDT:</span>
                <span className="font-black text-base text-[#047857]">${btcPrice.toLocaleString()}</span>
              </div>
              <span className="text-xs font-bold text-[#10B981] bg-white px-2 py-0.5 rounded-lg border border-[#E6E1D5]">
                +{btcChange.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-[#D97706] flex items-center gap-1 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
              <span>{isAr ? 'دخول حلبة التوقع' : 'Enter Arena'}</span>
              {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </span>
            <span className="text-[11px] font-mono text-[#78716C] bg-white px-2 py-1 rounded-xl border border-[#E6E1D5]">
              97% RTP
            </span>
          </div>
        </div>

        {/* CARD 2: AVIATOR / CRASH GAME */}
        <div
          onClick={() => onSelectMode('crash')}
          className="group relative bg-[#0e1929] rounded-3xl border border-[#1e293b] hover:border-[#EF4444] p-5 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between text-white"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#EF4444]/20 text-[#EF4444] flex items-center justify-center border border-[#EF4444]/40 group-hover:scale-105 transition-transform">
                  <Plane className="w-5 h-5 -rotate-45" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    {isAr ? 'لعبة الطائرة (Aviator)' : 'Aviator Crash Game'}
                  </h3>
                  <span className="text-[11px] text-[#94A3B8]">
                    {isAr ? 'مضاعفات حتى 100x وسحب فوري' : 'Up to 100x Instant Multiplier'}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EF4444]/25 text-[#F87171] border border-[#EF4444]/40 flex items-center gap-1">
                <Flame className="w-3 h-3 fill-current" />
                <span>{isAr ? 'حماس عالي' : 'HOT'}</span>
              </span>
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed">
              {isAr
                ? 'شاهد الطائرة الحمراء تحلق واضغط "سحب الكاش" في اللحظة المناسبة قبل أن تنفجر، لتضاعف رصيدك فوراً.'
                : 'Watch the lucky plane ascend and cash out before the crash to lock in massive multipliers.'}
            </p>

            {/* Multiplier Animation Simulation */}
            <div className="p-3 bg-[#0a111c] rounded-2xl border border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#94A3B8] font-bold">
                {isAr ? 'المضاعف الحالي للجولة:' : 'Current Round Multiplier:'}
              </span>
              <span className="text-lg font-black font-mono text-[#F59E0B] animate-pulse">
                4.25x 🚀
              </span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-[#EF4444] flex items-center gap-1 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
              <span>{isAr ? 'انطلاق الطائرة الآن' : 'Play Aviator Now'}</span>
              {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </span>
            <span className="text-[11px] font-mono text-[#94A3B8] bg-white/5 px-2 py-1 rounded-xl border border-white/10">
              SHA-256 Fair
            </span>
          </div>
        </div>

        {/* CARD 3: JORDANIAN LEAGUE */}
        <div
          onClick={() => onSelectMode('jordan_sports')}
          className="group relative bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] hover:border-[#0284C7] p-5 shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0284C7]/15 text-[#0284C7] flex items-center justify-center border border-[#0284C7]/30 group-hover:scale-105 transition-transform text-xl">
                  🇯🇴
                </div>
                <div>
                  <h3 className="font-black text-base text-[#1F2937]">
                    {isAr ? 'الدوري الأردني للمحترفين' : 'Jordanian Pro League'}
                  </h3>
                  <span className="text-[11px] text-[#78716C]">
                    الفيصلي · الوحدات · الحسين إربد · الرمثا
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0284C7]/15 text-[#0369A1] border border-[#0284C7]/30">
                {jordanMatches.length} {isAr ? 'مباريات قادمة' : 'Fixtures'}
              </span>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              {isAr
                ? 'قسم مخصص حصرياً لمباريات دوري المحترفين الأردني ودرع الاتحاد، مع احتمالات دقيقة واحتساب فوري بالدينار الأردني.'
                : 'Dedicated section for Jordanian Pro League matches with authentic club crests and instant JOD payouts.'}
            </p>

            {/* Sample Match Pill */}
            {jordanMatches[0] && (
              <div className="p-3 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2 text-[#1F2937]">
                  <span>{jordanMatches[0].homeTeam.badgeSymbol}</span>
                  <span>{jordanMatches[0].homeTeam.nameAr}</span>
                  <span className="text-[#9CA3AF]">ضد</span>
                  <span>{jordanMatches[0].awayTeam.nameAr}</span>
                  <span>{jordanMatches[0].awayTeam.badgeSymbol}</span>
                </div>
                <span className="text-[#0284C7] font-mono text-[11px]">
                  {jordanMatches[0].startTimeText}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-[#0284C7] flex items-center gap-1 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
              <span>{isAr ? 'تصفح مباريات الدوري الأردني' : 'View Jordan Fixtures'}</span>
              {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </span>
            <span className="text-[11px] font-mono text-[#78716C] bg-white px-2 py-1 rounded-xl border border-[#E6E1D5]">
              CliQ 🇯🇴 فوري
            </span>
          </div>
        </div>

        {/* CARD 4: EGYPTIAN LEAGUE */}
        <div
          onClick={() => onSelectMode('egypt_sports')}
          className="group relative bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] hover:border-[#10B981] p-5 shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center border border-[#10B981]/30 group-hover:scale-105 transition-transform text-xl">
                  🇪🇬
                </div>
                <div>
                  <h3 className="font-black text-base text-[#1F2937]">
                    {isAr ? 'الدوري المصري الممتاز' : 'Egyptian Premier League'}
                  </h3>
                  <span className="text-[11px] text-[#78716C]">
                    الأهلي · الزمالك · بيراميدز · المصري
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#10B981]/15 text-[#047857] border border-[#10B981]/30">
                {egyptMatches.length} {isAr ? 'مباريات' : 'Fixtures'}
              </span>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              {isAr
                ? 'قسم مخصص حصرياً للدوري المصري الممتاز وكأس مصر لـ 18 نادياً، مع إيداع وسحب مباشر عبر فودافون كاش وإنستاباي.'
                : 'Dedicated section for Egyptian Premier League fixtures with Vodafone Cash and InstaPay integration.'}
            </p>

            {/* Sample Match Pill */}
            {egyptMatches[0] && (
              <div className="p-3 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2 text-[#1F2937]">
                  <span>{egyptMatches[0].homeTeam.badgeSymbol}</span>
                  <span>{egyptMatches[0].homeTeam.nameAr}</span>
                  <span className="text-[#9CA3AF]">ضد</span>
                  <span>{egyptMatches[0].awayTeam.nameAr}</span>
                  <span>{egyptMatches[0].awayTeam.badgeSymbol}</span>
                </div>
                <span className="text-[#10B981] font-mono text-[11px]">
                  {egyptMatches[0].startTimeText}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-[#10B981] flex items-center gap-1 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
              <span>{isAr ? 'تصفح مباريات الدوري المصري' : 'View Egypt Fixtures'}</span>
              {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </span>
            <span className="text-[11px] font-mono text-[#78716C] bg-white px-2 py-1 rounded-xl border border-[#E6E1D5]">
              فودافون كاش 🇪🇬
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PAYMENT METHODS & TRUST BADGES
          ========================================================================= */}
      <div className="p-4 bg-[#F5F2EB] rounded-3xl border border-[#E6E1D5] flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-[#4B5563]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#10B981]" />
          <span>{isAr ? 'طرق الدفع والسحب الفوري المدعومة:' : 'Supported Instant Payments:'}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
          <span className="px-2.5 py-1 rounded-xl bg-white border border-[#E6E1D5] text-[#1F2937]">
            🇯🇴 CliQ (كليك الأردن)
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-white border border-[#E6E1D5] text-[#1F2937]">
            🇯🇴 زين كاش Zain Cash
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-white border border-[#E6E1D5] text-[#1F2937]">
            🇪🇬 فودافون كاش
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-white border border-[#E6E1D5] text-[#1F2937]">
            🇪🇬 إنستاباي InstaPay
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-white border border-[#E6E1D5] text-[#047857]">
            🪙 USDT (TRC-20 / BEP-20)
          </span>
        </div>

        <button
          onClick={onOpenDeposit}
          className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 text-xs font-black"
        >
          {isAr ? '+ شحن الرصيد الآن' : '+ Deposit Now'}
        </button>
      </div>
    </div>
  );
};
