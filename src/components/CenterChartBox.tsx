import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CoinSymbol } from '../types';
import { TradingViewChart } from './TradingViewChart';
import { TrendingUp, TrendingDown, Swords } from 'lucide-react';

interface CenterChartBoxProps {
  coin: CoinSymbol;
  entryPrice: number;
  currentPrice: number;
  roundStatus: 'BETTING_OPEN' | 'LOCKED' | 'SETTLED';
  upPool: number;
  downPool: number;
  change24h: number;
}

export const CenterChartBox: React.FC<CenterChartBoxProps> = ({
  coin,
  entryPrice,
  currentPrice,
  roundStatus,
  upPool,
  downPool,
  change24h,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const priceDiff = currentPrice - entryPrice;
  const priceDiffPercent = entryPrice > 0 ? (priceDiff / entryPrice) * 100 : 0;
  const isUp = priceDiff >= 0;

  // Pool tug-of-war calculations
  const totalPool = upPool + downPool;
  const upPercent = totalPool > 0 ? (upPool / totalPool) * 100 : 50;
  const downPercent = 100 - upPercent;

  return (
    <div className="h-full flex flex-col rounded-2xl border border-[#E6E1D5] bg-[#FFFDF9] shadow-xs p-2 sm:p-3 overflow-hidden select-none">
      {/* Top Header Bar inside Chart Box: Coin info & Live prices */}
      <div className="flex items-center justify-between gap-2 border-b border-[#F3EFE6] pb-2 mb-2">
        {/* Coin info & 24h Change */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm sm:text-base text-[#1F2937]">
              {coin}/USDT
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                change24h >= 0
                  ? 'bg-[#10B981]/10 text-[#047857]'
                  : 'bg-[#EF4444]/10 text-[#DC2626]'
              }`}
            >
              {change24h >= 0 ? '+' : ''}
              {change24h.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Live Prices: Entry Price vs Current Price */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-1">
            <span className="text-[11px] text-[#78716C]">{isAr ? 'الدخول:' : 'Entry:'}</span>
            <span className="font-mono font-bold text-[#D97706]">
              ${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="h-3 w-px bg-[#E6E1D5] hidden sm:block" />

          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[#78716C]">{isAr ? 'المباشر:' : 'Live:'}</span>
            <span
              className={`font-mono font-black text-xs sm:text-sm flex items-center gap-0.5 ${
                isUp ? 'text-[#10B981]' : 'text-[#EF4444]'
              }`}
            >
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            </span>
            <span
              className={`text-[10px] font-mono font-bold ${
                isUp ? 'text-[#10B981]' : 'text-[#EF4444]'
              }`}
            >
              ({isUp ? '+' : ''}{priceDiffPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Mini Tug-of-War Bar above chart */}
      <div className="mb-2 px-1">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#78716C] mb-1">
          <span className="text-[#EF4444]">DOWN {downPercent.toFixed(0)}% (${downPool})</span>
          <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-[#A8A29E]">
            <Swords className="w-3 h-3 text-[#F59E0B]" />
            <span>VS</span>
          </div>
          <span className="text-[#10B981]">UP {upPercent.toFixed(0)}% (${upPool})</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#E5E0D5] flex overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#EF4444] to-[#F87171] transition-all duration-300"
            style={{ width: `${downPercent}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-[#34D399] to-[#10B981] transition-all duration-300"
            style={{ width: `${upPercent}%` }}
          />
        </div>
      </div>

      {/* Clean TradingView Candlestick Chart (No timer over it!) */}
      <div className="flex-1 w-full min-h-[220px] sm:min-h-[260px] relative rounded-xl overflow-hidden bg-white/70 border border-[#E6E1D5]/60">
        <TradingViewChart
          coin={coin}
          entryPrice={entryPrice}
          currentPrice={currentPrice}
          roundStatus={roundStatus}
          height={320}
          compact={false}
        />
      </div>
    </div>
  );
};
