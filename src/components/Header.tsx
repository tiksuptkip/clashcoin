import React from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { ConnectedWalletState, UserProfile } from '../types';
import {
  Menu,
  Home,
  History,
  User,
  Plus,
} from 'lucide-react';

interface HeaderProps {
  walletState: ConnectedWalletState;
  user: UserProfile | null;
  onOpenProfile: () => void;
  onOpenMenu: () => void;
  inGameMode?: boolean;
  gameTitle?: string;
  onReturnHome?: () => void;
  onOpenHistory?: () => void;
  onOpenDeposit?: () => void;
  // Kept optional for backward compatibility
  onUpdateUser?: (u: UserProfile) => void;
  onOpenConnectWallet?: () => void;
  onDisconnectWallet?: () => void;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  walletState,
  user,
  onOpenProfile,
  onOpenMenu,
  inGameMode = false,
  gameTitle,
  onReturnHome,
  onOpenHistory,
  onOpenDeposit,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const isJordan = user?.country === 'JO' || user?.currency === 'JOD';
  const currencySymbol = isJordan ? 'د.أ' : 'ج.م';
  const realBalance = user?.balance ?? walletState.balanceUSDT ?? 0;

  // =========================================================================
  // 1. SUB-PAGES / GAME VIEWS HEADER:
  // Minimal, clean, and completely uncluttered view keeping ONLY:
  // - Clear button to return to the main homepage
  // - User balance indicator (+ deposit)
  // - History icon (السجل)
  // - Hamburger Menu (☰) for accessing wallet, currency, language, rules
  // (NO shortcut icons, NO language selectors, NO currency switchers, NO wallet connect buttons)
  // =========================================================================
  if (inGameMode) {
    return (
      <header className="sticky top-0 z-40 w-full bg-[#0e1726]/95 backdrop-blur-md border-b border-[#1e293b] px-3 sm:px-6 py-2.5 text-white transition-all shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Clear button to return to the main homepage */}
          <div className="flex items-center gap-2">
            <button
              onClick={onReturnHome}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-[#1e293b] hover:bg-[#334155] text-white text-xs sm:text-sm font-black transition-all cursor-pointer border border-white/10 shadow-sm active:scale-95 group"
              title={isAr ? 'العودة إلى الصفحة الرئيسية' : 'Return to Homepage'}
            >
              <Home className="w-4 h-4 text-[#F59E0B] group-hover:scale-110 transition-transform" />
              <span>{isAr ? 'الرئيسية' : 'Homepage'}</span>
            </button>

            {gameTitle && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 text-xs font-bold text-[#E2E8F0]">
                {gameTitle}
              </span>
            )}
          </div>

          {/* Right: History + Balance + Hamburger Menu */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* History icon ("السجل") */}
            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#1e293b] hover:bg-[#334155] text-xs sm:text-sm font-bold text-[#E2E8F0] hover:text-white transition-all cursor-pointer border border-white/10 shadow-xs active:scale-95"
                title={isAr ? 'عرض سجل الرهانات والجولات' : 'View Bets History'}
              >
                <History className="w-4 h-4 text-[#F59E0B]" />
                <span className="hidden xs:inline">{isAr ? 'السجل' : 'History'}</span>
              </button>
            )}

            {/* Real User Balance Indicator */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-[#090d16] px-3 sm:px-3.5 py-1.5 rounded-2xl border border-white/15 font-mono text-xs sm:text-sm font-black shadow-inner">
              <span className="text-[10px] sm:text-xs text-[#94A3B8] font-sans font-bold">
                {isAr ? 'الرصيد:' : 'Balance:'}
              </span>
              <span className="text-[#10B981] font-mono tracking-tight text-sm sm:text-base">
                {realBalance.toFixed(2)}
              </span>
              <span className="text-[11px] sm:text-xs text-[#F59E0B] font-sans font-bold">
                {currencySymbol}
              </span>

              {onOpenDeposit && (
                <button
                  onClick={onOpenDeposit}
                  className="ms-0.5 sm:ms-1 w-6 h-6 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white flex items-center justify-center font-bold text-xs shadow-xs transition-transform active:scale-90 cursor-pointer"
                  title={isAr ? 'إيداع سريع' : 'Quick Deposit'}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              )}
            </div>

            {/* Hamburger Menu Button (☰) */}
            <button
              onClick={onOpenMenu}
              className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-[#1e293b] hover:bg-[#334155] border border-white/10 text-white transition-colors cursor-pointer"
              title={isAr ? 'القائمة' : 'Menu'}
              aria-label="Navigation Menu"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </header>
    );
  }

  // =========================================================================
  // 2. MAIN HOMEPAGE HEADER:
  // Ultra-minimal and clean layout:
  // - Left: Brand Logo
  // - Right: Real Balance + Profile Avatar + Hamburger Menu (☰)
  // (NO language selectors, NO currency switchers, NO wallet connection buttons - all moved to Hamburger Menu)
  // =========================================================================
  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFBF0]/95 backdrop-blur-md border-b border-[#E6E1D5] px-3 sm:px-6 py-2.5 transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Brand Logo */}
        <div className="flex items-center">
          <Logo size="sm" showDomain={true} />
        </div>

        {/* Right: Balance + Profile Avatar + Hamburger Menu (☰) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Real User Balance Indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F5F2EB] px-3 sm:px-3.5 py-1.5 rounded-2xl border border-[#E6E1D5] font-mono text-xs sm:text-sm font-black shadow-2xs">
            <span className="text-[10px] sm:text-xs text-[#78716C] font-sans font-bold">
              {isAr ? 'الرصيد:' : 'Balance:'}
            </span>
            <span className="text-[#047857] font-mono tracking-tight text-sm sm:text-base">
              {realBalance.toFixed(2)}
            </span>
            <span className="text-[11px] sm:text-xs text-[#D97706] font-sans font-bold">
              {currencySymbol}
            </span>

            {onOpenDeposit && (
              <button
                onClick={onOpenDeposit}
                className="ms-0.5 sm:ms-1 w-6 h-6 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white flex items-center justify-center font-bold text-xs shadow-xs transition-transform active:scale-90 cursor-pointer"
                title={isAr ? 'إيداع رصيد' : 'Deposit'}
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            )}
          </div>

          {/* Fighter Profile Avatar (if user logged in) */}
          {user && (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 p-1 rounded-2xl border border-[#E6E1D5] bg-[#FFFDF9] hover:bg-white hover:border-[#F59E0B] text-xs font-bold text-[#1F2937] transition-all cursor-pointer min-h-[38px] shadow-2xs group"
              title={isAr ? 'الملف الشخصي' : 'Profile'}
            >
              <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-[#F5F2EB] border border-[#F59E0B]/50 shrink-0">
                <img
                  src={user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=ClashMaster'}
                  alt={user.display_name || user.username || 'User'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://api.dicebear.com/7.x/bottts/svg?seed=ClashMaster';
                  }}
                />
              </div>
            </button>
          )}

          {/* Hamburger Menu Button (☰) */}
          <button
            onClick={onOpenMenu}
            className="flex items-center justify-center h-10 w-10 rounded-2xl border border-[#E6E1D5] bg-[#F5F2EB] hover:bg-white text-[#1F2937] transition-colors cursor-pointer shadow-2xs"
            title={isAr ? 'القائمة الرئيسية' : 'Menu'}
            aria-label="Navigation Menu"
          >
            <Menu className="w-5 h-5 text-[#1F2937]" />
          </button>
        </div>
      </div>
    </header>
  );
};
