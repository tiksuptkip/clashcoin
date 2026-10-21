import React from 'react';
import { useTranslation } from 'react-i18next';
import { CoinSymbol, Round } from '../types';
import { ShieldCheck, Timer, TrendingUp, TrendingDown, Lock } from 'lucide-react';

interface RoundStatusBannerProps {
  round: Round;
  currentPrice: number;
  timeLeftSeconds: number;
  onOpenProvablyFair: () => void;
}

export const RoundStatusBanner: React.FC<RoundStatusBannerProps> = ({
  round,
  currentPrice,
  timeLeftSeconds,
  onOpenProvablyFair,
}) => {
  const { t } = useTranslation();

  const isLocked = timeLeftSeconds <= 10;
  const priceDiff = currentPrice - round.entryPrice;
  const priceDiffPercent = round.entryPrice > 0 ? (priceDiff / round.entryPrice) * 100 : 0;
  const isUp = priceDiff >= 0;

  // Format MM:SS
  const mins = Math.floor(Math.max(0, timeLeftSeconds) / 60);
  const secs = Math.max(0, timeLeftSeconds) % 60;
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="w-full bg-[#F5F2EB]/90 backdrop-blur-md rounded-2xl border border-[#E6E1D5] p-3.5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Round ID & Provably Fair Hash Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#78716C]">{t('arena.roundId')}:</span>
            <span className="font-mono text-xs font-bold text-[#1F2937] bg-white px-2 py-0.5 rounded border border-[#E6E1D5]">
              #{round.id.slice(-8)}
            </span>
          </div>

          <button
            onClick={onOpenProvablyFair}
            className="flex items-center gap-1 text-[11px] font-medium text-[#D97706] bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 px-2 py-0.5 rounded transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('arena.provablyFairBadge')}</span>
          </button>
        </div>

        {/* Center: Live Timer & Status */}
        <div className="flex items-center gap-3">
          {isLocked ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] animate-pulse">
              <Lock className="w-4 h-4" />
              <span className="text-xs font-bold">{t('common.bettingLocked')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              <span className="text-xs font-bold">BETTING OPEN</span>
            </div>
          )}

          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-[#E6E1D5] shadow-xs">
            <Timer className={`w-4 h-4 ${isLocked ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`} />
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-[#78716C]">{t('common.timeLeft')}:</span>
              <span
                className={`font-mono font-black text-base tabular-nums ${
                  isLocked ? 'text-[#EF4444]' : 'text-[#1F2937]'
                }`}
              >
                {formattedTime}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live Price vs Entry with Delta */}
        <div className="flex items-center gap-4 bg-white/80 px-3 py-1 rounded-xl border border-[#E6E1D5]">
          <div>
            <div className="text-[10px] text-[#78716C] uppercase font-semibold">{t('common.entryPrice')}</div>
            <div className="font-mono text-xs font-bold text-[#D97706]">
              ${round.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="h-6 w-px bg-[#E6E1D5]" />

          <div>
            <div className="text-[10px] text-[#78716C] uppercase font-semibold flex items-center gap-1">
              <span>{t('common.currentPrice')}</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            </div>
            <div className="flex items-center gap-1">
              <span
                className={`font-mono text-xs font-extrabold ${
                  isUp ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}
              >
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className={`flex items-center text-[10px] font-mono font-bold ${
                  isUp ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}
              >
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isUp ? '+' : ''}
                {priceDiffPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
