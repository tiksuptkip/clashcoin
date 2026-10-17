import React from 'react';
import { useTranslation } from 'react-i18next';
import { Coins, Plane, Trophy, Flame } from 'lucide-react';

export type MainAppMode = 'crypto' | 'crash' | 'sports';

interface TopModeSwitcherProps {
  activeMode: MainAppMode;
  onChangeMode: (mode: MainAppMode) => void;
  liveSportsCount?: number;
}

export const TopModeSwitcher: React.FC<TopModeSwitcherProps> = ({
  activeMode,
  onChangeMode,
  liveSportsCount = 2,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const modes: Array<{
    id: MainAppMode;
    titleAr: string;
    titleEn: string;
    subAr: string;
    subEn: string;
    icon: React.ReactNode;
    color: string;
    badge?: string;
  }> = [
    {
      id: 'crypto',
      titleAr: 'معركة العملات',
      titleEn: 'Crypto Arena',
      subAr: 'BTC · ETH · SOL',
      subEn: 'Binance Live Feed',
      icon: <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-[#F59E0B]" />,
      color: '#F59E0B',
    },
    {
      id: 'crash',
      titleAr: 'لعبة الطائرة',
      titleEn: 'Aviator Crash',
      subAr: 'سحب فوري ومضاعفات ضخمة',
      subEn: '1xBet Style · Instant Cashout',
      icon: <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-[#EF4444] -rotate-45" />,
      color: '#EF4444',
      badge: isAr ? 'حماس' : 'HOT',
    },
    {
      id: 'sports',
      titleAr: 'الدوري المصري والرياضة',
      titleEn: 'Egyptian League',
      subAr: '18 نادياً مصرياً · مباشر',
      subEn: 'All 18 Clubs · Live Odds',
      icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#10B981]" />,
      color: '#10B981',
      badge: liveSportsCount > 0 ? (isAr ? `${liveSportsCount} مباشر` : `${liveSportsCount} LIVE`) : undefined,
    },
  ];

  return (
    <div className="w-full bg-[#FFFDF9]/90 border-b border-[#E6E1D5] py-2 px-2 sm:px-4 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 w-full">
          {modes.map((m) => {
            const isActive = activeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onChangeMode(m.id)}
                className={`group relative flex items-center justify-center gap-2 sm:gap-3 py-2 px-2 sm:px-4 rounded-xl border text-start transition-all cursor-pointer select-none min-h-[46px] ${
                  isActive
                    ? 'bg-white border-[#F59E0B] shadow-sm ring-2 ring-[#F59E0B]/20'
                    : 'bg-[#F5F2EB]/70 hover:bg-white border-[#E6E1D5] hover:border-[#D1C9B8]'
                }`}
              >
                {/* Mode Icon */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? 'bg-[#FFFBEB]' : 'bg-white border border-[#E6E1D5]'
                  }`}
                >
                  {m.icon}
                </div>

                {/* Text Labels */}
                <div className="flex flex-col min-w-0 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs sm:text-sm font-black truncate ${
                        isActive ? 'text-[#1F2937]' : 'text-[#4B5563]'
                      }`}
                    >
                      {isAr ? m.titleAr : m.titleEn}
                    </span>

                    {m.badge && (
                      <span className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#EF4444]/10 text-[#DC2626] border border-[#EF4444]/20">
                        <Flame className="w-2.5 h-2.5 fill-current" />
                        <span>{m.badge}</span>
                      </span>
                    )}
                  </div>
                  <span className="hidden md:block text-[10px] text-[#78716C] truncate font-medium">
                    {isAr ? m.subAr : m.subEn}
                  </span>
                </div>

                {/* Active Indicator Underline */}
                {isActive && (
                  <div className="absolute -bottom-[9px] inset-x-6 h-[2px] bg-[#F59E0B] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
