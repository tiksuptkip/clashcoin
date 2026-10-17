import React from 'react';
import { useTranslation } from 'react-i18next';
import { Swords, TrendingUp, TrendingDown } from 'lucide-react';

interface PoolBattleBarProps {
  upPool: number;
  downPool: number;
  commission: number; // e.g. 3%
}

export const PoolBattleBar: React.FC<PoolBattleBarProps> = ({
  upPool,
  downPool,
  commission,
}) => {
  const { t } = useTranslation();

  const totalPool = Math.max(1, upPool + downPool);
  const upPercent = Math.round((upPool / totalPool) * 100);
  const downPercent = 100 - upPercent;

  // Expected payout multiplier formula:
  // If UP wins: payout for $1 bet = (1 / upPool) * downPool * (1 - comm) + 1 = 1 + (downPool / upPool) * (1 - comm)
  const upMultiplier =
    upPool > 0 ? (1 + (downPool / upPool) * (1 - commission / 100)).toFixed(2) : '1.00';
  // If DOWN wins: payout for $1 bet = 1 + (upPool / downPool) * (1 - comm)
  const downMultiplier =
    downPool > 0 ? (1 + (upPool / downPool) * (1 - commission / 100)).toFixed(2) : '1.00';

  return (
    <div className="w-full bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] p-3 shadow-xs">
      {/* Top Pool Stats */}
      <div className="flex items-center justify-between mb-2">
        {/* UP Team Pool Stat */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#10B981]" />
          <div>
            <div className="text-xs font-bold text-[#10B981] flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{t('common.teamUp')} ({upPercent}%)</span>
            </div>
            <div className="font-mono text-sm font-extrabold text-[#1F2937]">
              ${upPool.toLocaleString()}
            </div>
          </div>
          <span className="text-[11px] font-mono font-semibold bg-[#10B981]/10 text-[#10B981] px-2 py-0.5 rounded">
            {upMultiplier}x
          </span>
        </div>

        {/* Center Total Pool Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-xl border border-[#E6E1D5] shadow-xs">
          <Swords className="w-4 h-4 text-[#F59E0B]" />
          <div className="text-center">
            <span className="text-[10px] text-[#78716C] uppercase font-bold block leading-none">
              {t('common.totalPool')}
            </span>
            <span className="font-mono font-black text-sm text-[#1F2937]">
              ${totalPool.toLocaleString()}
            </span>
          </div>
        </div>

        {/* DOWN Team Pool Stat */}
        <div className="flex items-center gap-2 text-end">
          <span className="text-[11px] font-mono font-semibold bg-[#EF4444]/10 text-[#EF4444] px-2 py-0.5 rounded">
            {downMultiplier}x
          </span>
          <div>
            <div className="text-xs font-bold text-[#EF4444] flex items-center justify-end gap-1">
              <span>{t('common.teamDown')} ({downPercent}%)</span>
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
            <div className="font-mono text-sm font-extrabold text-[#1F2937]">
              ${downPool.toLocaleString()}
            </div>
          </div>
          <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
        </div>
      </div>

      {/* Visual Tug-Of-War Progress Bar */}
      <div className="relative h-3 w-full bg-[#E5DFD3] rounded-full overflow-hidden flex">
        <div
          className="h-full bg-gradient-to-r from-[#059669] to-[#10B981] transition-all duration-500 ease-out"
          style={{ width: `${upPercent}%` }}
        />
        <div
          className="h-full bg-gradient-to-r from-[#EF4444] to-[#DC2626] transition-all duration-500 ease-out"
          style={{ width: `${downPercent}%` }}
        />

        {/* Center Clash Spark Divider */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#FFFBF0] border-2 border-[#F59E0B] shadow-sm flex items-center justify-center -ml-2"
          style={{ left: `${upPercent}%` }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-ping" />
        </div>
      </div>
    </div>
  );
};
