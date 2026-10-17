import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Participant } from '../types';
import { TrendingDown, Users, DollarSign, Zap } from 'lucide-react';

interface TeamDownBoxProps {
  participants: Participant[];
  totalPool: number;
  opposingPool: number;
  commission: number;
  userBalance: number;
  walletBalance: number;
  isWalletConnected: boolean;
  isLocked: boolean;
  selectedBetAmount: number;
  onPlaceBet: (amount: number, source: 'SITE_BALANCE' | 'WEB3_WALLET') => void;
}

export const TeamDownBox: React.FC<TeamDownBoxProps> = ({
  participants,
  totalPool,
  opposingPool,
  commission,
  userBalance,
  walletBalance,
  isWalletConnected,
  isLocked,
  selectedBetAmount,
  onPlaceBet,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [betSource, setBetSource] = useState<'SITE_BALANCE' | 'WEB3_WALLET'>('SITE_BALANCE');

  const downParticipants = participants.filter((p) => p.side === 'DOWN');

  // Multiplier calculation for this bet
  const projectedWinningPool = totalPool + selectedBetAmount;
  const projectedProfit =
    projectedWinningPool > 0
      ? (selectedBetAmount / projectedWinningPool) * opposingPool * (1 - commission / 100)
      : 0;
  const projectedPayout = selectedBetAmount + projectedProfit;
  const currentMultiplier =
    totalPool > 0 ? ((totalPool + opposingPool) * (1 - commission / 100) / totalPool).toFixed(2) : '2.00';
  const myBetMultiplier =
    selectedBetAmount > 0 ? (projectedPayout / selectedBetAmount).toFixed(2) : currentMultiplier;

  const currentAvailableBalance = betSource === 'SITE_BALANCE' ? userBalance : walletBalance;
  const canBet = !isLocked && selectedBetAmount >= 1 && selectedBetAmount <= currentAvailableBalance;

  return (
    <div className="h-full flex flex-col rounded-2xl border-2 border-[#EF4444] bg-[#FFFDFB] shadow-xs p-3 select-none">
      {/* Box Header: Title "Team DOWN" in Red */}
      <div className="flex items-center justify-between border-b border-[#FEE2E2] pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#EF4444] text-white flex items-center justify-center shrink-0 shadow-xs">
            <TrendingDown className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-[#EF4444] leading-tight flex items-center gap-1.5">
              <span>{isAr ? 'فريق الهبوط' : 'Team DOWN'}</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#EF4444]/15 text-[#EF4444] font-bold">
                {myBetMultiplier}x
              </span>
            </h3>
            <span className="text-[10px] text-[#78716C] flex items-center gap-1">
              <Users className="w-3 h-3 text-[#EF4444]" />
              <span>{downParticipants.length} {isAr ? 'مراهن' : 'bettors'}</span>
            </span>
          </div>
        </div>

        <div className="text-end">
          <div className="text-[9px] text-[#78716C] uppercase font-bold">{isAr ? 'حوض الهبوط' : 'DOWN Pool'}</div>
          <div className="font-mono font-black text-sm sm:text-base text-[#EF4444]">
            ${totalPool.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Quick Bet Action inside Left Box */}
      <div className="bg-[#FEF2F2] rounded-xl border border-[#FCA5A5]/40 p-2 mb-2">
        <div className="flex items-center justify-between text-[11px] text-[#78716C] mb-1">
          <span>{isAr ? 'الرهان الحالي:' : 'Bet Amount:'}</span>
          <span className="font-mono font-bold text-[#1F2937]">
            ${selectedBetAmount} USDT
          </span>
        </div>

        {/* Source selector if wallet connected */}
        {isWalletConnected && (
          <div className="grid grid-cols-2 gap-1 mb-1.5 p-0.5 bg-white rounded-lg text-[10px] font-bold">
            <button
              onClick={() => setBetSource('SITE_BALANCE')}
              className={`py-0.5 rounded cursor-pointer transition-colors ${
                betSource === 'SITE_BALANCE'
                  ? 'bg-[#EF4444] text-white'
                  : 'text-[#78716C] hover:bg-gray-100'
              }`}
            >
              {isAr ? 'الرصيد' : 'Balance'} (${userBalance.toFixed(0)})
            </button>
            <button
              onClick={() => setBetSource('WEB3_WALLET')}
              className={`py-0.5 rounded cursor-pointer transition-colors ${
                betSource === 'WEB3_WALLET'
                  ? 'bg-[#EF4444] text-white'
                  : 'text-[#78716C] hover:bg-gray-100'
              }`}
            >
              {isAr ? 'المحفظة' : 'Wallet'} (${walletBalance.toFixed(0)})
            </button>
          </div>
        )}

        {/* Big Red Bet DOWN Button */}
        <button
          onClick={() => onPlaceBet(selectedBetAmount, betSource)}
          disabled={!canBet}
          className={`w-full py-2.5 rounded-xl font-black text-xs sm:text-sm text-white flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
            isLocked
              ? 'bg-[#A8A29E] cursor-not-allowed opacity-60'
              : selectedBetAmount > currentAvailableBalance
              ? 'bg-[#DC2626] opacity-75 cursor-not-allowed'
              : 'bg-[#EF4444] hover:bg-[#DC2626] active:scale-[0.98]'
          }`}
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>
            {isLocked
              ? isAr ? 'المراهنة مغلقة' : 'LOCKED'
              : selectedBetAmount > currentAvailableBalance
              ? isAr ? 'الرصيد غير كافٍ' : 'Low Balance'
              : isAr ? `راهن هبوط ($${selectedBetAmount})` : `Bet DOWN ($${selectedBetAmount})`}
          </span>
        </button>

        <div className="flex items-center justify-between text-[10px] text-[#991B1B] mt-1 px-1">
          <span>{isAr ? 'العائد المتوقع:' : 'Est. Payout:'}</span>
          <span className="font-mono font-black text-xs">${projectedPayout.toFixed(2)}</span>
        </div>
      </div>

      {/* Live Scrollable List of Bettors on DOWN */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between text-[10px] font-bold text-[#78716C] uppercase mb-1 px-1">
          <span>{isAr ? 'قائمة المراهنين' : 'Bettors List'}</span>
          <span className="font-mono text-[10px] text-[#EF4444]">{downParticipants.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pe-1 max-h-[220px] sm:max-h-none">
          {downParticipants.length === 0 ? (
            <div className="h-full min-h-[90px] flex items-center justify-center text-center p-3 text-[11px] text-[#78716C] font-bold bg-[#FEF2F2]/50 rounded-xl border border-dashed border-[#FCA5A5]/60">
              {isAr ? 'بانتظار أول رهان...' : 'Waiting for first bet...'}
            </div>
          ) : (
            downParticipants.map((p) => {
              // Calculate bettor's effective multiplier
              const pWinGross =
                totalPool > 0 ? (p.amount / totalPool) * opposingPool * (1 - commission / 100) : 0;
              const pPayout = p.amount + pWinGross;
              const pMult = p.amount > 0 ? (pPayout / p.amount).toFixed(2) : currentMultiplier;

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-1.5 rounded-xl border text-xs transition-colors ${
                    p.isUser
                      ? 'bg-[#EF4444]/15 border-[#EF4444]/40 font-bold'
                      : 'bg-white border-[#FEE2E2]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-5 h-5 rounded-full bg-[#F5F2EB] shrink-0 object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://api.dicebear.com/7.x/bottts/svg?seed=ClashMaster';
                      }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-[11px] text-[#1F2937] truncate">
                        {p.name} {p.isUser ? (isAr ? '(أنت)' : '(You)') : ''}
                      </span>
                      <span className="text-[9px] font-mono text-[#EF4444] font-bold">
                        {pMult}x
                      </span>
                    </div>
                  </div>

                  <div className="font-mono font-black text-xs text-[#EF4444] shrink-0 text-end">
                    +${p.amount.toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
