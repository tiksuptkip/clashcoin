import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Participant, PredictionSide, UserBet } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Zap, Clock, Users, ShieldCheck } from 'lucide-react';

interface MobileBattleControlsProps {
  upParticipants: Participant[];
  downParticipants: Participant[];
  upPool: number;
  downPool: number;
  commission: number;
  userBalance: number;
  walletBalance: number;
  isWalletConnected: boolean;
  isLocked: boolean;
  userBets: UserBet[];
  onPlaceBet: (side: PredictionSide, amount: number, source: 'SITE_BALANCE' | 'WEB3_WALLET') => void;
}

export const MobileBattleControls: React.FC<MobileBattleControlsProps> = ({
  upParticipants,
  downParticipants,
  upPool,
  downPool,
  commission,
  userBalance,
  walletBalance,
  isWalletConnected,
  isLocked,
  userBets,
  onPlaceBet,
}) => {
  const { t, i18n } = useTranslation();
  const [selectedSide, setSelectedSide] = useState<PredictionSide>('UP');
  const [betAmount, setBetAmount] = useState<number>(25);
  const [betSource, setBetSource] = useState<'SITE_BALANCE' | 'WEB3_WALLET'>('SITE_BALANCE');
  const [showHistory, setShowHistory] = useState(false);

  const totalPool = Math.max(1, upPool + downPool);
  const upMultiplier =
    upPool > 0 ? (1 + (downPool / upPool) * (1 - commission / 100)).toFixed(2) : '1.00';
  const downMultiplier =
    downPool > 0 ? (1 + (upPool / downPool) * (1 - commission / 100)).toFixed(2) : '1.00';

  const currentAvailableBalance = betSource === 'SITE_BALANCE' ? userBalance : walletBalance;

  // Selected side payout preview
  const activePool = selectedSide === 'UP' ? upPool : downPool;
  const oppPool = selectedSide === 'UP' ? downPool : upPool;
  const projectedWinningPool = activePool + betAmount;
  const projectedProfit =
    projectedWinningPool > 0
      ? (betAmount / projectedWinningPool) * oppPool * (1 - commission / 100)
      : 0;
  const projectedPayout = betAmount + projectedProfit;

  const quickAmounts = [5, 10, 25, 50, 100, 250];

  const activeBets = userBets.filter((b) => b.status === 'ACTIVE');

  return (
    <div className="w-full space-y-3 lg:hidden">
      {/* Third: UP Team vs DOWN Team Side-by-Side (50% each) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Team UP Card (50%) */}
        <button
          onClick={() => setSelectedSide('UP')}
          className={`flex flex-col items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer min-h-[90px] ${
            selectedSide === 'UP'
              ? 'bg-[#10B981]/15 border-[#10B981] shadow-md ring-2 ring-[#10B981]/40'
              : 'bg-[#F5F2EB] border-[#E6E1D5] hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-[#047857] flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-[#10B981]" />
              {t('common.up')}
            </span>
            <span className="font-mono text-xs font-black bg-[#10B981] text-white px-2 py-0.5 rounded-md">
              {upMultiplier}x
            </span>
          </div>

          <div className="font-mono font-black text-xl text-[#047857] my-1">
            {upPool > 0 ? `$${upPool.toLocaleString()}` : '$0'}
          </div>

          <span className="text-[11px] text-[#78716C] flex items-center gap-1">
            <Users className="w-3 h-3" />
            {upParticipants.length > 0
              ? `${upParticipants.length} ${t('common.participants')}`
              : 'بانتظار أول رهان...'}
          </span>
        </button>

        {/* Team DOWN Card (50%) */}
        <button
          onClick={() => setSelectedSide('DOWN')}
          className={`flex flex-col items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer min-h-[90px] ${
            selectedSide === 'DOWN'
              ? 'bg-[#EF4444]/15 border-[#EF4444] shadow-md ring-2 ring-[#EF4444]/40'
              : 'bg-[#F5F2EB] border-[#E6E1D5] hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-[#DC2626] flex items-center gap-1">
              <TrendingDown className="w-4 h-4 text-[#EF4444]" />
              {t('common.down')}
            </span>
            <span className="font-mono text-xs font-black bg-[#EF4444] text-white px-2 py-0.5 rounded-md">
              {downMultiplier}x
            </span>
          </div>

          <div className="font-mono font-black text-xl text-[#DC2626] my-1">
            {downPool > 0 ? `$${downPool.toLocaleString()}` : '$0'}
          </div>

          <span className="text-[11px] text-[#78716C] flex items-center gap-1">
            <Users className="w-3 h-3" />
            {downParticipants.length > 0
              ? `${downParticipants.length} ${t('common.participants')}`
              : 'بانتظار أول رهان...'}
          </span>
        </button>
      </div>

      {/* Fourth (Bottom): Betting Controls & Finger-friendly Action */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6E1D5] p-3.5 shadow-xs space-y-3">
        {/* Source Selector (if wallet connected) */}
        {isWalletConnected && (
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F5F2EB] rounded-xl text-xs font-bold">
            <button
              onClick={() => setBetSource('SITE_BALANCE')}
              className={`min-h-[40px] rounded-lg transition-colors cursor-pointer ${
                betSource === 'SITE_BALANCE'
                  ? 'bg-white text-[#1F2937] shadow-xs'
                  : 'text-[#78716C]'
              }`}
            >
              Site (${userBalance.toFixed(0)})
            </button>
            <button
              onClick={() => setBetSource('WEB3_WALLET')}
              className={`min-h-[40px] rounded-lg transition-colors cursor-pointer ${
                betSource === 'WEB3_WALLET'
                  ? 'bg-white text-[#10B981] shadow-xs'
                  : 'text-[#78716C]'
              }`}
            >
              Web3 (${walletBalance.toFixed(0)})
            </button>
          </div>
        )}

        {/* Quick Amount Buttons (min-height 48px for finger tap) */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#78716C] mb-1.5 font-bold">
            <span>{t('arena.quickBet')}</span>
            <span>
              {t('common.balance')}:{' '}
              <strong className="font-mono text-[#047857]">
                ${currentAvailableBalance.toFixed(2)}
              </strong>
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setBetAmount(amt)}
                className={`min-h-[48px] text-sm font-mono font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  betAmount === amt
                    ? selectedSide === 'UP'
                      ? 'bg-[#10B981] text-white border-[#10B981]'
                      : 'bg-[#EF4444] text-white border-[#EF4444]'
                    : 'bg-[#F5F2EB] border-[#E6E1D5] text-[#1F2937] active:bg-[#E6E1D5]'
                }`}
              >
                ${amt}
              </button>
            ))}
            <button
              onClick={() => setBetAmount(Math.floor(Math.min(1000, currentAvailableBalance)))}
              className="min-h-[48px] text-xs font-bold rounded-xl border border-[#E6E1D5] bg-[#F5F2EB] text-[#78716C] active:bg-[#E6E1D5] cursor-pointer flex items-center justify-center col-span-2"
            >
              MAX (${Math.floor(currentAvailableBalance)})
            </button>
          </div>
        </div>

        {/* Payout Preview Card */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F2EB] text-xs font-semibold">
          <span className="text-[#78716C]">
            {t('arena.estimatedPayout')} ({selectedSide}):
          </span>
          <span
            className={`font-mono font-black text-sm ${
              selectedSide === 'UP' ? 'text-[#047857]' : 'text-[#DC2626]'
            }`}
          >
            ${projectedPayout.toFixed(2)} USDT
          </span>
        </div>

        {/* Primary Bet Button (min-h-[52px], huge finger target) */}
        <button
          onClick={() => onPlaceBet(selectedSide, betAmount, betSource)}
          disabled={isLocked || betAmount < 1 || betAmount > currentAvailableBalance}
          className={`w-full min-h-[52px] py-3.5 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer ${
            isLocked
              ? 'bg-[#A8A29E] cursor-not-allowed opacity-60'
              : betAmount > currentAvailableBalance
              ? 'bg-[#DC2626] opacity-80 cursor-not-allowed'
              : selectedSide === 'UP'
              ? 'bg-[#10B981] hover:bg-[#059669] pulse-emerald'
              : 'bg-[#EF4444] hover:bg-[#DC2626] pulse-ruby'
          }`}
        >
          <Zap className="w-5 h-5 fill-white" />
          <span>
            {isLocked
              ? t('common.bettingLocked')
              : betAmount > currentAvailableBalance
              ? t('common.insufficientBalance')
              : `${t('common.placeBet')} ${selectedSide} ($${betAmount})`}
          </span>
        </button>

        {/* Mobile History Toggle */}
        <div className="pt-1">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl bg-[#F5F2EB] text-xs font-bold text-[#78716C] cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#F59E0B]" />
              <span>
                {t('dashboard.activeBets')} ({activeBets.length})
              </span>
            </span>
            <span className="text-[11px] underline">
              {showHistory ? 'إخفاء' : 'عرض السجل النشط'}
            </span>
          </button>

          {showHistory && (
            <div className="mt-2 space-y-1.5 animate-in fade-in">
              {activeBets.length === 0 ? (
                <div className="text-center py-4 text-xs text-[#A8A29E]">
                  {t('dashboard.noActiveBets')}
                </div>
              ) : (
                activeBets.map((b) => (
                  <div
                    key={b.id}
                    className="p-2.5 bg-white rounded-xl border border-[#E6E1D5] flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-[#1F2937]">
                      {b.coin}/USDT ({b.side})
                    </span>
                    <span className="font-mono font-bold text-[#047857]">${b.amount}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
