import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserBet } from '../types';
import { TrendingUp, TrendingDown, Clock, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

interface HistoryPageProps {
  bets: UserBet[];
  onOpenProvablyFairForRound: (roundId: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  bets,
  onOpenProvablyFairForRound,
}) => {
  const { t } = useTranslation();

  const activeBets = bets.filter((b) => b.status === 'ACTIVE');
  const settledBets = bets.filter((b) => b.status !== 'ACTIVE');

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Title */}
      <div className="text-start">
        <h1 className="text-2xl font-black text-[#1F2937]">{t('nav.history')}</h1>
        <p className="text-xs text-[#78716C] mt-1">
          Detailed cryptographic audit log of all your live active and past battle predictions.
        </p>
      </div>

      {/* Active Battle Bets Section */}
      <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-[#F59E0B]" />
          <h2 className="text-sm font-bold text-[#1F2937] uppercase tracking-wide">
            {t('dashboard.activeBets')} ({activeBets.length})
          </h2>
        </div>

        {activeBets.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#A8A29E] bg-[#F5F2EB]/50 rounded-2xl border border-dashed border-[#D9D2C5]">
            {t('dashboard.noActiveBets')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeBets.map((b) => (
              <div
                key={b.id}
                className="p-3.5 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                      b.side === 'UP' ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                    }`}
                  >
                    {b.side === 'UP' ? (
                      <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <TrendingDown className="w-5 h-5 stroke-[2.5]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-[#1F2937]">{b.coin}/USDT</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          b.side === 'UP'
                            ? 'bg-[#10B981]/10 text-[#047857]'
                            : 'bg-[#EF4444]/10 text-[#DC2626]'
                        }`}
                      >
                        {b.side}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-[#78716C]">
                      Entry: ${b.entryPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="text-end">
                  <span className="text-[10px] text-[#78716C] uppercase font-bold block">
                    {t('common.yourBet')}
                  </span>
                  <span className="font-mono font-black text-sm text-[#1F2937]">
                    ${b.amount.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-[#D97706] font-semibold block animate-pulse">
                    Battle in Progress...
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settled Bets History Table */}
      <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] p-5 shadow-xs">
        <h2 className="text-sm font-bold text-[#78716C] uppercase tracking-wide mb-3">
          Settled Battles & Payouts ({settledBets.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-[#E6E1D5] text-[#78716C]">
                <th className="py-2.5 text-start font-bold">Round</th>
                <th className="py-2.5 text-start font-bold">Coin</th>
                <th className="py-2.5 text-start font-bold">Side</th>
                <th className="py-2.5 text-end font-bold">Entry Price</th>
                <th className="py-2.5 text-end font-bold">Exit Price</th>
                <th className="py-2.5 text-end font-bold">Wager</th>
                <th className="py-2.5 text-end font-bold">Payout</th>
                <th className="py-2.5 text-end font-bold">Outcome</th>
                <th className="py-2.5 text-end font-bold">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EFE6]">
              {settledBets.map((b) => {
                const won = b.status === 'WON';
                const pnl = won ? (b.payout || 0) - b.amount : -b.amount;

                return (
                  <tr key={b.id} className="hover:bg-[#F5F2EB]/50 transition-colors">
                    <td className="py-3 font-mono font-bold text-[#1F2937]">
                      #{b.roundId.slice(-6)}
                    </td>
                    <td className="py-3 font-bold text-[#1F2937]">{b.coin}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[11px] ${
                          b.side === 'UP'
                            ? 'bg-[#10B981]/10 text-[#047857]'
                            : 'bg-[#EF4444]/10 text-[#DC2626]'
                        }`}
                      >
                        {b.side === 'UP' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {b.side}
                      </span>
                    </td>
                    <td className="py-3 text-end font-mono text-[#78716C]">
                      ${b.entryPrice.toLocaleString()}
                    </td>
                    <td className="py-3 text-end font-mono font-bold text-[#1F2937]">
                      ${b.exitPrice ? b.exitPrice.toLocaleString() : '---'}
                    </td>
                    <td className="py-3 text-end font-mono font-bold text-[#1F2937]">
                      ${b.amount.toFixed(2)}
                    </td>
                    <td className="py-3 text-end font-mono font-black">
                      {won ? (
                        <span className="text-[#047857]">+${(b.payout || 0).toFixed(2)}</span>
                      ) : (
                        <span className="text-[#78716C]">$0.00</span>
                      )}
                    </td>
                    <td className="py-3 text-end">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          won
                            ? 'bg-[#10B981]/10 text-[#047857]'
                            : 'bg-[#EF4444]/10 text-[#DC2626]'
                        }`}
                      >
                        {won ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {won ? 'WON' : 'LOST'}
                      </span>
                    </td>
                    <td className="py-3 text-end">
                      <button
                        onClick={() => onOpenProvablyFairForRound(b.roundId)}
                        className="text-[#D97706] hover:text-[#B45309] font-medium flex items-center justify-end gap-1 ms-auto cursor-pointer"
                        title="Verify Provably Fair Cryptographic Seed"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-[11px] underline">SHA-256</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
