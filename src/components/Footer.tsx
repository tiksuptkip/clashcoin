import React from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { ShieldCheck, Lock, ExternalLink, Zap } from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: 'arena' | 'wallet' | 'history' | 'dashboard') => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  const { t } = useTranslation();

  return (
    <footer className="w-full bg-[#F5F2EB] border-t border-[#E6E1D5] py-8 px-4 lg:px-8 mt-12 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand Lockup */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <Logo size="sm" showDomain={true} />
          <p className="text-xs text-[#78716C] max-w-sm text-center md:text-start">
            Official Domain: <span className="font-bold text-[#D97706]">ClashOfCoin.bet</span>.
            The premier real-time decentralized crypto prediction battle platform.
          </p>
        </div>

        {/* Navigation Quick Links (Strictly Player Pages - No Admin) */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#78716C]">
          <button
            onClick={() => onSelectTab('arena')}
            className="hover:text-[#1F2937] transition-colors cursor-pointer"
          >
            {t('nav.arena')}
          </button>
          <span>·</span>
          <button
            onClick={() => onSelectTab('wallet')}
            className="hover:text-[#1F2937] transition-colors cursor-pointer"
          >
            {t('nav.wallet')}
          </button>
          <span>·</span>
          <button
            onClick={() => onSelectTab('history')}
            className="hover:text-[#1F2937] transition-colors cursor-pointer"
          >
            {t('nav.history')}
          </button>
          <span>·</span>
          <button
            onClick={() => onSelectTab('dashboard')}
            className="hover:text-[#1F2937] transition-colors cursor-pointer"
          >
            {t('nav.dashboard')}
          </button>
        </div>

        {/* Security & Fairness Badges */}
        <div className="flex items-center gap-3 text-xs text-[#78716C]">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#E6E1D5]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="font-bold text-[#1F2937]">SHA-256 Fair</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#E6E1D5]">
            <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="font-bold text-[#1F2937]">Binance WS API</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-[#E6E1D5] text-center text-[11px] text-[#A8A29E]">
        © 2026 Clash Of Coin (ClashOfCoin.bet). All rights reserved. Real-time prices streamed directly
        via official Binance WebSocket feeds.
      </div>
    </footer>
  );
};
