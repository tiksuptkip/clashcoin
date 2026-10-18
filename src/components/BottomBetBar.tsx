import React from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Wallet } from 'lucide-react';

interface BottomBetBarProps {
  selectedAmount: number;
  onSelectAmount: (amt: number) => void;
  userBalance: number;
  walletBalance: number;
  isWalletConnected: boolean;
  isLocked: boolean;
}

export const BottomBetBar: React.FC<BottomBetBarProps> = ({
  selectedAmount,
  onSelectAmount,
  userBalance,
  walletBalance,
  isWalletConnected,
  isLocked,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const amounts = [10, 20, 50, 100, 250];
  const maxAvailable = Math.max(0, userBalance, isWalletConnected ? walletBalance : 0);

  const handleMaxClick = () => {
    const maxVal = Math.floor(Math.min(1000, maxAvailable > 0 ? maxAvailable : 100));
    onSelectAmount(maxVal);
  };

  return (
    <div className="w-full shrink-0 mt-2 py-2 px-3 bg-[#FFFDF9] border border-[#E6E1D5] rounded-2xl shadow-xs select-none">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Balance readout */}
        <div className="flex items-center gap-2 text-xs font-bold text-[#78716C]">
          <div className="flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-[#10B981]" />
            <span>{isAr ? 'الرصيد المتاح:' : 'Balance:'}</span>
            <span className="font-mono text-[#047857] font-black">
              ${userBalance.toFixed(2)} USDT
            </span>
          </div>

          {isWalletConnected && (
            <>
              <div className="h-3 w-px bg-[#E6E1D5]" />
              <div className="flex items-center gap-1">
                <span>{isAr ? 'المحفظة:' : 'Wallet:'}</span>
                <span className="font-mono text-[#10B981] font-black">
                  ${walletBalance.toFixed(2)} USDT
                </span>
              </div>
            </>
          )}
        </div>

        {/* 3. Centered bet amount buttons: [10$] [20$] [50$] [100$] [250$] [MAX] - all in one row, green color, rounded */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
          {amounts.map((amt) => {
            const isSelected = selectedAmount === amt;
            return (
              <button
                key={amt}
                onClick={() => onSelectAmount(amt)}
                disabled={isLocked}
                className={`min-h-[38px] px-3 sm:px-4 py-1.5 rounded-full font-mono text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#10B981] text-white shadow-md shadow-[#10B981]/25 ring-2 ring-[#059669] scale-105'
                    : 'bg-[#ECFDF5] text-[#047857] border border-[#10B981]/40 hover:bg-[#10B981]/15 active:scale-95'
                } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {amt}$
              </button>
            );
          })}

          {/* [MAX] button */}
          <button
            onClick={handleMaxClick}
            disabled={isLocked}
            className={`min-h-[38px] px-3.5 sm:px-4 py-1.5 rounded-full font-mono text-xs sm:text-sm font-black transition-all cursor-pointer ${
              selectedAmount === maxAvailable && maxAvailable > 0
                ? 'bg-[#10B981] text-white shadow-md shadow-[#10B981]/25 ring-2 ring-[#059669]'
                : 'bg-[#ECFDF5] text-[#047857] border border-[#10B981]/40 hover:bg-[#10B981]/15 active:scale-95'
            } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            MAX
          </button>
        </div>

        {/* Active Selected Amount indicator / custom input */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[#78716C] text-[11px] font-bold">
            {isAr ? 'المحدد:' : 'Selected:'}
          </span>
          <div className="relative flex items-center">
            <DollarSign className="w-3.5 h-3.5 text-[#10B981] absolute start-1.5 pointer-events-none" />
            <input
              type="number"
              min={1}
              max={1000}
              value={selectedAmount || ''}
              onChange={(e) => onSelectAmount(Math.max(1, parseFloat(e.target.value) || 0))}
              disabled={isLocked}
              className="w-20 ps-5 pe-2 py-1 bg-white border border-[#10B981]/40 rounded-xl font-mono text-xs font-black text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#10B981]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
