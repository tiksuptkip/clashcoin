import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingDown, TrendingUp, Lock } from 'lucide-react';
import { CoinSymbol, RoundDuration } from '../types';

interface TopArenaBarProps {
  timeLeftSeconds: number;
  isLocked: boolean;
  upPool: number;
  downPool: number;
  selectedCoin: CoinSymbol;
  onSelectCoin: (coin: CoinSymbol) => void;
  prices: Record<CoinSymbol, number>;
  duration: RoundDuration;
  onSelectDuration: (d: RoundDuration) => void;
  commission: number;
}

export const TopArenaBar: React.FC<TopArenaBarProps> = ({
  timeLeftSeconds,
  isLocked,
  upPool,
  downPool,
  selectedCoin,
  onSelectCoin,
  prices,
  duration,
  onSelectDuration,
  commission,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const mins = Math.floor(Math.max(0, timeLeftSeconds) / 60);
  const secs = Math.max(0, timeLeftSeconds) % 60;
  const formattedTime = `${mins}:${secs.toString().padStart(2, '0')}`;

  const isCritical = timeLeftSeconds <= 10;

  // Multiplier estimates
  const totalPool = upPool + downPool;
  const upMultiplier =
    upPool > 0 ? ((totalPool * (1 - commission / 100)) / upPool).toFixed(2) : '2.00';
  const downMultiplier =
    downPool > 0 ? ((totalPool * (1 - commission / 100)) / downPool).toFixed(2) : '2.00';

  const coins: CoinSymbol[] = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];
  const durations: RoundDuration[] = [15, 30, 45, 60];

  return (
    <div className="w-full flex flex-col gap-1.5 shrink-0 mb-2">
      {/* Coin Selector and Duration Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
        {/* Coin pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {coins.map((sym) => {
            const isSelected = selectedCoin === sym;
            const price = prices[sym] || 0;
            return (
              <button
                key={sym}
                onClick={() => onSelectCoin(sym)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap min-h-[32px] ${
                  isSelected
                    ? 'bg-[#1F2937] text-white shadow-xs'
                    : 'bg-[#F5F2EB] text-[#78716C] hover:bg-white'
                }`}
              >
                <span>{sym}</span>
                <span className="font-mono text-[11px] opacity-80">
                  ${price >= 1 ? price.toLocaleString(undefined, { maximumFractionDigits: 1 }) : price.toFixed(3)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Round Duration tabs */}
        <div className="flex items-center gap-1 bg-[#F5F2EB] p-1 rounded-xl border border-[#E6E1D5] shrink-0">
          {durations.map((d) => (
            <button
              key={d}
              onClick={() => onSelectDuration(d)}
              disabled={isLocked}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                duration === d
                  ? 'bg-white text-[#1F2937] shadow-xs'
                  : 'text-[#78716C] hover:text-[#1F2937]'
              } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      {/* 1. TOP BAR (one line): [LEFT: "DOWN" in red] [CENTER: Timer 0:15 big 36px] [RIGHT: "UP" in green] */}
      {/* Explicit direction: ltr ensures LEFT is always DOWN (red), CENTER is Timer, RIGHT is UP (green) */}
      <div
        dir="ltr"
        className="w-full grid grid-cols-12 items-center bg-[#FFFDF9] border border-[#E6E1D5] rounded-2xl px-3 sm:px-4 py-1.5 shadow-xs"
      >
        {/* LEFT (25% / 3 cols): "DOWN" in Red */}
        <div className="col-span-3 flex items-center justify-start gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#EF4444] text-white flex items-center justify-center shrink-0 shadow-xs">
            <TrendingDown className="w-4 h-4 stroke-[3]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm sm:text-base text-[#EF4444] tracking-wide leading-none">
                DOWN
              </span>
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-[#EF4444]/15 text-[#EF4444]">
                {downMultiplier}x
              </span>
            </div>
            <span className="font-mono text-xs font-black text-[#EF4444]">
              ${downPool.toLocaleString()}
            </span>
          </div>
        </div>

        {/* CENTER (50% / 6 cols): Timer 0:15 big 32-36px */}
        <div className="col-span-6 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            {isCritical && (
              <Lock className="w-4 h-4 text-[#EF4444] animate-pulse shrink-0" />
            )}
            <div
              className={`font-mono font-black text-2xl sm:text-[34px] leading-none tracking-tight select-none transition-all duration-150 ${
                isCritical
                  ? 'text-[#EF4444] animate-pulse drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]'
                  : 'text-[#1F2937]'
              }`}
            >
              {formattedTime}
            </div>
          </div>
          <div className="text-[10px] font-bold text-[#78716C] mt-0.5 tracking-wider uppercase">
            {isCritical
              ? isAr ? 'مغلق - جاري الحسم' : 'LOCKED - SETTLING'
              : isAr ? 'الوقت المتبقي' : 'TIME REMAINING'}
          </div>
        </div>

        {/* RIGHT (25% / 3 cols): "UP" in Green */}
        <div className="col-span-3 flex items-center justify-end gap-2 text-end">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-[#10B981]/15 text-[#047857]">
                {upMultiplier}x
              </span>
              <span className="font-black text-sm sm:text-base text-[#10B981] tracking-wide leading-none">
                UP
              </span>
            </div>
            <span className="font-mono text-xs font-black text-[#10B981]">
              ${upPool.toLocaleString()}
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-xs">
            <TrendingUp className="w-4 h-4 stroke-[3]" />
          </div>
        </div>
      </div>
    </div>
  );
};
