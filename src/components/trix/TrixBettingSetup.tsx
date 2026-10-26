import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Wallet,
  Coins,
  ShieldCheck,
  Bot,
  Users,
  Trophy,
  AlertCircle,
  Plus,
  Minus,
  Sparkles,
  Info,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { SupportedCurrency, UserProfile } from '../../types';
import { TrixGameMode, TrixBotDifficulty } from '../../types/trix';
import { TrixLobbyVariant } from './TrixLobby';
import { storage } from '../../services/storage';

export interface TrixBettingSetupProps {
  variant: TrixLobbyVariant;
  user: UserProfile | null;
  activeCurrency: SupportedCurrency;
  currentBalance: number;
  currencySymbol: string;
  onBack: () => void;
  onConfirmStart: (mode: TrixGameMode, betAmount: number, botDifficulty: TrixBotDifficulty) => void;
  onOpenDeposit: () => void;
  onAddDemoFunds?: () => void;
}

export const TrixBettingSetup: React.FC<TrixBettingSetupProps> = ({
  variant,
  user,
  activeCurrency,
  currentBalance,
  currencySymbol,
  onBack,
  onConfirmStart,
  onOpenDeposit,
  onAddDemoFunds,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // Game variant details
  const variantInfo = useMemo(() => {
    switch (variant) {
      case 'TRIX':
        return {
          title: 'Trix Classic',
          badge: 'CLASSIC',
          defaultMode: 'SOLO' as TrixGameMode,
          desc: 'Classic 4-Kingdom Game (Every player for himself)',
        };
      case 'TRIX_PARTNER':
        return {
          title: 'Trix Partner',
          badge: 'PARTNER',
          defaultMode: 'PARTNERSHIP' as TrixGameMode,
          desc: 'Partnership Mode 2 vs 2 (You & partner vs opponents)',
        };
      case 'TRIX_COMPLEX':
      default:
        return {
          title: 'Trix Complex',
          badge: 'COMPLEX',
          defaultMode: 'PARTNERSHIP' as TrixGameMode,
          desc: '4 Penalty Contracts in a single hand, followed by Trix',
        };
    }
  }, [variant]);

  // Currency configuration
  const currencyConfig = useMemo(() => {
    switch (activeCurrency) {
      case 'JOD':
        return {
          minBet: 1,
          step: 1,
          presets: [1, 2, 5, 10, 20, 50],
          name: 'JOD (Jordan)',
        };
      case 'EGP':
        return {
          minBet: 100,
          step: 50,
          presets: [100, 200, 500, 1000, 2000],
          name: 'EGP (Egypt)',
        };
      case 'USDT':
      default:
        return {
          minBet: 5,
          step: 5,
          presets: [5, 10, 25, 50, 100],
          name: 'USDT (Tether)',
        };
    }
  }, [activeCurrency]);

  const [selectedMode, setSelectedMode] = useState<TrixGameMode>(variantInfo.defaultMode);
  const [betAmount, setBetAmount] = useState<number>(currencyConfig.minBet);
  const [botDifficulty, setBotDifficulty] = useState<TrixBotDifficulty>('EXPERT');

  // House commission (from settings, default 5%)
  const commissionRate = storage.getSettings().trixCommissionRate ?? 5.0;

  // Proportional Pot & Dynamic Payout Calculations
  const roomPlayersCount = 4;
  const totalRoomPot = useMemo(() => betAmount * roomPlayersCount, [betAmount]);
  const houseFeeAmount = useMemo(
    () => Number((totalRoomPot * (commissionRate / 100)).toFixed(2)),
    [totalRoomPot, commissionRate]
  );
  const netPrizePool = useMemo(() => totalRoomPot - houseFeeAmount, [totalRoomPot, houseFeeAmount]);

  // Expected payout for the user
  const potentialPayout = useMemo(() => {
    if (selectedMode === 'PARTNERSHIP') {
      // Split between 2 winning partners
      return Number((netPrizePool / 2).toFixed(2));
    } else {
      // Solo: Winner takes full net pot
      return Number(netPrizePool.toFixed(2));
    }
  }, [netPrizePool, selectedMode]);

  const payoutMultiplier = useMemo(() => {
    if (betAmount <= 0) return 0;
    return Number((potentialPayout / betAmount).toFixed(2));
  }, [potentialPayout, betAmount]);

  const netProfit = useMemo(() => {
    return Number((potentialPayout - betAmount).toFixed(2));
  }, [potentialPayout, betAmount]);

  // Validation
  const hasSufficientBalance = currentBalance >= betAmount;
  const isBetValid = betAmount >= currencyConfig.minBet;

  const handlePresetClick = (amount: number) => {
    setBetAmount(amount);
  };

  const handleAdjustBet = (delta: number) => {
    setBetAmount((prev) => {
      const next = prev + delta;
      return Math.max(currencyConfig.minBet, next);
    });
  };

  const handleConfirm = () => {
    if (!hasSufficientBalance) {
      onOpenDeposit();
      return;
    }
    if (!isBetValid) return;
    onConfirmStart(selectedMode, betAmount, botDifficulty);
  };

  return (
    <div
      dir="ltr"
      className="w-full min-h-screen bg-[#1A1D26] text-white flex flex-col items-center justify-between font-sans select-none pb-12 overflow-x-hidden"
    >
      {/* Container max-w-md matching mobile-first Jawaker style */}
      <div className="w-full max-w-[480px] mx-auto px-4 py-3 flex flex-col gap-4">

        {/* ---------------- 1. TOP HEADER WITH BACK BUTTON ---------------- */}
        <div className="w-full flex items-center justify-between pt-1">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#242A36] hover:bg-[#2D3545] border border-white/10 text-white font-bold text-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Lobby</span>
          </button>

          <div className="flex flex-col items-center">
            <span className="text-xs font-black text-[#FACC15] tracking-wider uppercase">
              {variantInfo.badge}
            </span>
            <h1 className="text-sm font-bold text-white">
              {variantInfo.title}
            </h1>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-[#11151F] border border-white/10 text-[11px] font-mono font-bold text-[#22C55E]">
            {activeCurrency}
          </div>
        </div>

        {/* ---------------- 2. WALLET STATUS CARD ---------------- */}
        <div className="w-full bg-[#242A36] rounded-2xl p-3.5 border border-white/10 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#22C55E]/20 to-[#16A34A]/20 border border-[#22C55E]/30 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#22C55E]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-gray-400">
                Available Wallet Balance
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-mono font-black text-white">
                  {currentBalance.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-[#FACC15]">
                  {currencySymbol}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenDeposit}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Deposit</span>
          </button>
        </div>

        {/* Balance Warning if insufficient */}
        {!hasSufficientBalance && (
          <div className="w-full bg-[#DC2626]/20 border border-[#EF4444]/40 rounded-xl p-3 flex flex-col gap-2 text-xs text-red-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-white block">
                  Insufficient balance for this bet!
                </span>
                <span className="text-[11px] text-gray-300">
                  Available: {currentBalance.toFixed(2)} {currencySymbol}. Required: {betAmount} {currencySymbol}.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onOpenDeposit}
                className="flex-1 py-1.5 px-3 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-xs text-center cursor-pointer transition-colors"
              >
                Deposit Funds
              </button>
              {onAddDemoFunds && (
                <button
                  type="button"
                  onClick={onAddDemoFunds}
                  className="py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-[#FACC15] font-bold text-xs text-center cursor-pointer transition-colors"
                >
                  + Add Demo Funds
                </button>
              )}
            </div>
          </div>
        )}

        {/* ---------------- 3. GAME MODE SELECTION ---------------- */}
        <div className="w-full flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
            <span>Game Mode</span>
            <span className="text-[10px] text-gray-400">
              {selectedMode === 'PARTNERSHIP' ? 'Partnership 2v2' : 'Solo 4 Players'}
            </span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedMode('PARTNERSHIP')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                selectedMode === 'PARTNERSHIP'
                  ? 'bg-gradient-to-b from-[#22C55E]/20 to-[#16A34A]/10 border-[#22C55E] text-white shadow-md'
                  : 'bg-[#242A36] border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5 text-[#22C55E]" />
              <span className="text-xs font-bold text-white">
                Partnership (2v2)
              </span>
              <span className="text-[9px] text-gray-400 text-center leading-tight">
                You & partner vs opponents
              </span>
            </button>

            <button
              onClick={() => setSelectedMode('SOLO')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                selectedMode === 'SOLO'
                  ? 'bg-gradient-to-b from-[#22C55E]/20 to-[#16A34A]/10 border-[#22C55E] text-white shadow-md'
                  : 'bg-[#242A36] border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <Trophy className="w-5 h-5 text-[#FACC15]" />
              <span className="text-xs font-bold text-white">
                Solo (4 Players)
              </span>
              <span className="text-[9px] text-gray-400 text-center leading-tight">
                1st place takes entire pool
              </span>
            </button>
          </div>
        </div>

        {/* ---------------- 4. BET AMOUNT CONFIGURATION & PRESETS ---------------- */}
        <div className="w-full bg-[#242A36] rounded-2xl p-4 border border-white/10 shadow-lg flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300">
              Your Entry Bet
            </span>
            <span className="text-[11px] text-[#FACC15] font-mono">
              Min: {currencyConfig.minBet} {currencySymbol}
            </span>
          </div>

          {/* Stepper + Input */}
          <div className="flex items-center justify-between bg-[#11151F] rounded-xl p-1.5 border border-white/10">
            <button
              onClick={() => handleAdjustBet(-currencyConfig.step)}
              disabled={betAmount <= currencyConfig.minBet}
              className="w-10 h-10 rounded-lg bg-[#242A36] hover:bg-[#2D3545] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white font-bold transition-all cursor-pointer"
            >
              <Minus className="w-4 h-4 stroke-[3]" />
            </button>

            <div className="flex items-baseline gap-1.5 font-mono">
              <input
                type="number"
                value={betAmount}
                min={currencyConfig.minBet}
                step={currencyConfig.step}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0) setBetAmount(val);
                }}
                className="w-24 text-center bg-transparent text-xl font-black text-white focus:outline-none"
              />
              <span className="text-sm font-bold text-[#FACC15]">
                {currencySymbol}
              </span>
            </div>

            <button
              onClick={() => handleAdjustBet(currencyConfig.step)}
              className="w-10 h-10 rounded-lg bg-[#242A36] hover:bg-[#2D3545] flex items-center justify-center text-white font-bold transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-5 gap-1.5">
            {currencyConfig.presets.map((preset) => {
              const isSelected = betAmount === preset;
              return (
                <button
                  key={preset}
                  onClick={() => handlePresetClick(preset)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#22C55E] text-black shadow-md'
                      : 'bg-[#11151F] hover:bg-white/10 text-gray-300'
                  }`}
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </div>

        {/* ---------------- 5. PROPORTIONAL POT & WINNINGS BREAKDOWN ---------------- */}
        <div className="w-full bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-2xl p-4 border border-blue-500/20 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-[#FACC15]" />
              <span className="text-xs font-bold text-white">
                Proportional Pot & Dynamic Payout
              </span>
            </div>
            <span className="text-[10px] text-[#22C55E] font-bold">
              4 Players Pool
            </span>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-2">
            {/* Total Room Pot */}
            <div className="bg-[#11151F]/80 rounded-xl p-2.5 border border-white/5 flex flex-col">
              <span className="text-[10px] text-gray-400 leading-tight">
                Total Pot (4x)
              </span>
              <span className="text-sm font-mono font-bold text-white mt-1">
                {totalRoomPot} {currencySymbol}
              </span>
              <span className="text-[9px] text-gray-500 mt-0.5">
                4 × {betAmount}
              </span>
            </div>

            {/* Platform Commission 5% */}
            <div className="bg-[#11151F]/80 rounded-xl p-2.5 border border-white/5 flex flex-col">
              <span className="text-[10px] text-gray-400 leading-tight">
                House Fee ({commissionRate}%)
              </span>
              <span className="text-sm font-mono font-bold text-[#F59E0B] mt-1">
                {houseFeeAmount} {currencySymbol}
              </span>
              <span className="text-[9px] text-gray-500 mt-0.5">
                {commissionRate}% fixed
              </span>
            </div>

            {/* Expected Winning Payout */}
            <div className="bg-[#22C55E]/15 rounded-xl p-2.5 border border-[#22C55E]/40 flex flex-col">
              <span className="text-[10px] text-[#22C55E] font-bold leading-tight">
                Your Win Payout
              </span>
              <span className="text-sm font-mono font-black text-white mt-1">
                {potentialPayout} {currencySymbol}
              </span>
              <span className="text-[9px] text-[#FACC15] font-black mt-0.5">
                {payoutMultiplier}x (+{netProfit})
              </span>
            </div>
          </div>

          {/* Explanatory Rule Footer */}
          <div className="flex items-start gap-1.5 text-[10px] text-gray-400 bg-black/30 p-2 rounded-lg">
            <Info className="w-3.5 h-3.5 text-[#FACC15] shrink-0 mt-0.5" />
            <span>
              {selectedMode === 'PARTNERSHIP'
                ? `In partnership, the net pot (${netPrizePool.toFixed(2)} ${currencySymbol}) is divided 50/50 between the winning pair (1.90x return).`
                : `In solo mode, the 1st place champion wins the entire net pot (${netPrizePool.toFixed(2)} ${currencySymbol}) for a 3.80x return.`}
            </span>
          </div>
        </div>

        {/* ---------------- 6. AI BOT OPPONENTS SELECTION ---------------- */}
        <div className="w-full flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-[#FACC15]" />
              <span>AI Opponents (Jawaker AI)</span>
            </span>
            <span className="text-[10px] text-[#22C55E] font-bold">
              {botDifficulty === 'EXPERT' ? 'Expert (Hard)' : botDifficulty}
            </span>
          </label>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'EXPERT' as TrixBotDifficulty, label: 'Expert (Hard)', desc: 'Jawaker AI' },
              { id: 'MEDIUM' as TrixBotDifficulty, label: 'Medium', desc: 'Balanced' },
              { id: 'EASY' as TrixBotDifficulty, label: 'Casual', desc: 'Standard' },
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => setBotDifficulty(b.id)}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  botDifficulty === b.id
                    ? 'bg-[#22C55E]/20 border-[#22C55E] text-white shadow-xs'
                    : 'bg-[#242A36] border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">{b.label}</div>
                <div className="text-[9px] text-gray-400">{b.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ---------------- 7. CONFIRM ACTION BUTTONS ---------------- */}
        <div className="w-full flex flex-col gap-2 mt-2">
          <button
            onClick={handleConfirm}
            disabled={!hasSufficientBalance || !isBetValid}
            className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              hasSufficientBalance && isBetValid
                ? 'bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white hover:brightness-110 active:scale-[0.98]'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>
              Confirm & Enter Table ({betAmount} {currencySymbol})
            </span>
          </button>

          <button
            onClick={onBack}
            className="w-full py-2.5 rounded-xl bg-transparent hover:bg-white/5 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel & Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};
