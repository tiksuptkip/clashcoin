import React from 'react';
import { CoinSymbol } from '../types';

interface CoinSelectorProps {
  selectedCoin: CoinSymbol;
  onSelectCoin: (coin: CoinSymbol) => void;
  prices: Record<CoinSymbol, number>;
  changes: Record<CoinSymbol, number>;
}

const COIN_METAS: { symbol: CoinSymbol; name: string; iconColor: string }[] = [
  { symbol: 'BTC', name: 'Bitcoin', iconColor: 'bg-[#F59E0B]' },
  { symbol: 'ETH', name: 'Ethereum', iconColor: 'bg-[#10B981]' },
  { symbol: 'SOL', name: 'Solana', iconColor: 'bg-[#8B5CF6]' },
  { symbol: 'BNB', name: 'BNB Chain', iconColor: 'bg-[#FBBF24]' },
  { symbol: 'XRP', name: 'Ripple', iconColor: 'bg-[#78716C]' },
];

export const CoinSelector: React.FC<CoinSelectorProps> = ({
  selectedCoin,
  onSelectCoin,
  prices,
  changes,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full">
      {COIN_METAS.map((c) => {
        const isSelected = selectedCoin === c.symbol;
        const price = prices[c.symbol] || 0;
        const change = changes[c.symbol] || 0;
        const isPositive = change >= 0;

        return (
          <button
            key={c.symbol}
            onClick={() => onSelectCoin(c.symbol)}
            className={`flex flex-col items-start p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
              isSelected
                ? 'bg-white border-[#F59E0B] shadow-sm ring-1 ring-[#F59E0B]/30'
                : 'bg-[#F5F2EB]/80 border-[#E6E1D5] hover:bg-white/90 hover:border-[#D9D2C5]'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-[#1F2937]">{c.symbol}</span>
                <span className="text-[10px] text-[#78716C] uppercase hidden md:inline">{c.name}</span>
              </div>
              <span
                className={`text-[11px] font-tabular font-semibold px-1.5 py-0.2 rounded ${
                  isPositive
                    ? 'text-[#10B981] bg-[#10B981]/10'
                    : 'text-[#EF4444] bg-[#EF4444]/10'
                }`}
              >
                {isPositive ? '+' : ''}
                {change.toFixed(2)}%
              </span>
            </div>

            <div className="font-tabular font-bold text-sm text-[#1F2937]">
              ${price >= 1 ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : price.toFixed(4)}
            </div>
          </button>
        );
      })}
    </div>
  );
};
