import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ShieldCheck, Copy, Check, Hash } from 'lucide-react';
import { Round } from '../types';

interface ProvablyFairModalProps {
  isOpen: boolean;
  round: Round | null;
  onClose: () => void;
}

export const ProvablyFairModal: React.FC<ProvablyFairModalProps> = ({
  isOpen,
  round,
  onClose,
}) => {
  const { t } = useTranslation();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  if (!isOpen || !round) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleVerify = () => {
    setIsVerified(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2937]/40 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute top-5 end-5 p-1.5 rounded-full text-[#78716C] hover:text-[#1F2937] hover:bg-[#F5F2EB] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-[#D97706] mb-2">
          <ShieldCheck className="w-6 h-6" />
          <h2 className="text-xl font-black text-[#1F2937]">{t('provablyFair.title')}</h2>
        </div>
        <p className="text-xs text-[#78716C] mb-4">{t('provablyFair.description')}</p>

        <div className="space-y-3 bg-[#F5F2EB]/80 p-4 rounded-2xl border border-[#E6E1D5] text-xs">
          {/* Server Seed */}
          <div>
            <div className="text-[11px] font-bold text-[#78716C] mb-1">
              {t('provablyFair.serverSeed')}:
            </div>
            <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-[#E6E1D5]">
              <span className="font-mono text-[11px] truncate text-[#1F2937]">{round.serverSeed}</span>
              <button
                onClick={() => handleCopy(round.serverSeed, 'server')}
                className="text-[#78716C] hover:text-[#1F2937] ps-2 cursor-pointer"
              >
                {copiedKey === 'server' ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Client Seed */}
          <div>
            <div className="text-[11px] font-bold text-[#78716C] mb-1">
              {t('provablyFair.clientSeed')}:
            </div>
            <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-[#E6E1D5]">
              <span className="font-mono text-[11px] truncate text-[#1F2937]">{round.clientSeed}</span>
              <button
                onClick={() => handleCopy(round.clientSeed, 'client')}
                className="text-[#78716C] hover:text-[#1F2937] ps-2 cursor-pointer"
              >
                {copiedKey === 'client' ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Timestamp */}
          <div>
            <div className="text-[11px] font-bold text-[#78716C] mb-1">
              {t('provablyFair.roundTimestamp')}:
            </div>
            <div className="bg-white px-2.5 py-1.5 rounded-xl border border-[#E6E1D5] font-mono text-[11px] text-[#1F2937]">
              {round.startTime} ({new Date(round.startTime).toUTCString()})
            </div>
          </div>

          {/* SHA-256 Hash */}
          <div>
            <div className="text-[11px] font-bold text-[#78716C] mb-1 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>SHA-256 Commitment Hash:</span>
            </div>
            <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-[#E6E1D5]">
              <span className="font-mono text-[11px] text-[#D97706] truncate">
                {round.provablyFairHash}
              </span>
              <button
                onClick={() => handleCopy(round.provablyFairHash, 'hash')}
                className="text-[#78716C] hover:text-[#1F2937] ps-2 cursor-pointer"
              >
                {copiedKey === 'hash' ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {isVerified && (
          <div className="mt-4 p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl flex items-center gap-2 text-xs text-[#047857] font-semibold animate-in fade-in">
            <ShieldCheck className="w-5 h-5 text-[#10B981] shrink-0" />
            <span>{t('provablyFair.verifiedSuccess')}</span>
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={handleVerify}
            className="flex-1 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {t('provablyFair.verifyButton')}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-[#F5F2EB] hover:bg-[#E6E1D5] text-[#78716C] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
