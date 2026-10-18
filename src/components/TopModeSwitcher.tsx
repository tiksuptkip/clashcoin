import React from 'react';
import { useTranslation } from 'react-i18next';
import { Coins, Plane, Trophy, Flame } from 'lucide-react';

export type MainAppMode = 'crypto' | 'crash' | 'jordan_sports' | 'egypt_sports' | 'sports';

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
    badgeColor?: string;
  }> = [
    {
      id: 'crypto',
      titleAr: 'معركة العملات الرقمية',
      titleEn: 'Cryptocurrency Battle',
      subAr: 'توقع صعود وهبوط BTC · ETH · SOL',
      subEn: 'Binance Live Price Arena',
      icon: <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-[#F59E0B]" />,
      color: '#F59E0B',
    },
    {
      id: 'crash',
      titleAr: 'لعبة الطائرة (Aviator)',
      titleEn: 'Aviator / Crash Game',
      subAr: 'مضاعفات ضخمة وسحب فوري للأرباح',
      subEn: 'Instant Multiplier & Cashout',
      icon: <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-[#EF4444] -rotate-45" />,
      color: '#EF4444',
      badge: isAr ? 'حماس' : 'HOT',
      badgeColor: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30',
    },
    {
      id: 'jordan_sports',
      titleAr: 'الدوري الأردني',
      titleEn: 'Jordanian League',
      subAr: 'دوري المحترفين الأردني والدرع 🇯🇴',
      subEn: 'Jordanian Pro League Fixtures',
      icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#0284C7]" />,
      color: '#0284C7',
      badge: isAr ? '🇯🇴 النشامى' : '🇯🇴 Jordan',
      badgeColor: 'bg-[#0284C7]/15 text-[#0284C7] border-[#0284C7]/30',
    },
    {
      id: 'egypt_sports',
      titleAr: 'الدوري المصري',
      titleEn: 'Egyptian League',
      subAr: 'الدوري الممتاز المصري وكأس مصر 🇪🇬',
      subEn: 'Egyptian Premier League Fixtures',
      icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#10B981]" />,
      color: '#10B981',
      badge: isAr ? '🇪🇬 الممتاز' : '🇪🇬 Egypt',
      badgeColor: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
    },
  ];

  return (
    <nav aria-label="Game Modes" className="w-full bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E6E1D5] py-2 px-2 sm:px-4 shadow-2xs">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2.5 w-full">
          {modes.map((m) => {
            const isActive =
              activeMode === m.id ||
              (m.id === 'jordan_sports' && activeMode === 'sports');
            return (
              <button
                key={m.id}
                onClick={() => onChangeMode(m.id)}
                className={`group relative flex items-center justify-start gap-2 sm:gap-3 py-2.5 px-2.5 sm:px-3.5 rounded-2xl border text-start transition-all cursor-pointer select-none min-h-[52px] shadow-sm ${
                  isActive
                    ? 'bg-gradient-to-r from-[#1F2937] to-[#111827] text-white border-[#F59E0B] shadow-lg ring-2 ring-[#F59E0B]/40 scale-[1.01]'
                    : 'bg-white hover:bg-[#FFFBEB] border-[#E6E1D5] hover:border-[#F59E0B]/60 text-[#1F2937]'
                }`}
              >
                {/* Mode Icon */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? 'bg-[#FFFBEB]' : 'bg-[#F5F2EB] border border-[#E6E1D5]'
                  }`}
                >
                  {m.icon}
                </div>

                {/* Text Labels */}
                <div className="flex flex-col min-w-0 leading-tight flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs sm:text-[13px] font-black truncate ${
                        isActive ? 'text-white' : 'text-[#1F2937]'
                      }`}
                    >
                      {isAr ? m.titleAr : m.titleEn}
                    </span>

                    {m.badge && (
                      <span
                        className={`hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                          m.badgeColor || 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30'
                        }`}
                      >
                        {m.id === 'crash' && <Flame className="w-2.5 h-2.5 fill-current" />}
                        <span>{m.badge}</span>
                      </span>
                    )}
                  </div>
                  <span
                    className={`hidden sm:block text-[10px] truncate font-medium mt-0.5 ${
                      isActive ? 'text-[#F59E0B]' : 'text-[#78716C]'
                    }`}
                  >
                    {isAr ? m.subAr : m.subEn}
                  </span>
                </div>

                {/* Active Indicator Underline */}
                {isActive && (
                  <div className="absolute -bottom-[9px] inset-x-4 h-[2.5px] bg-[#F59E0B] rounded-full shadow-xs" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
