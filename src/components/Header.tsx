import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { ConnectedWalletState, UserProfile } from '../types';
import {
  Wallet,
  Globe,
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Shield,
  Layers,
  Clock,
  LayoutDashboard,
  Volume2,
  VolumeX,
  Home,
  History,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { soundManager } from '../services/sound';
import { supabaseSync } from '../services/supabase';
import { storage } from '../services/storage';

interface HeaderProps {
  walletState: ConnectedWalletState;
  user: UserProfile | null;
  onUpdateUser?: (u: UserProfile) => void;
  onOpenConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenMenu: () => void;
  inGameMode?: boolean;
  gameTitle?: string;
  onReturnHome?: () => void;
  onOpenHistory?: () => void;
  onOpenDeposit?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  walletState,
  user,
  onUpdateUser,
  onOpenConnectWallet,
  onDisconnectWallet,
  onOpenAuth,
  onOpenProfile,
  onOpenMenu,
  inGameMode = false,
  gameTitle,
  onReturnHome,
  onOpenHistory,
  onOpenDeposit,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  const isJordan = user?.country === 'JO' || user?.currency === 'JOD';

  const toggleCountry = () => {
    const nextCountry = isJordan ? 'EG' : 'JO';
    const nextCurrency = isJordan ? 'EGP' : 'JOD';
    const updated = storage.updateUser({
      country: nextCountry,
      currency: nextCurrency,
    });
    if (updated && onUpdateUser) {
      onUpdateUser(updated);
    }
  };

  useEffect(() => {
    return soundManager.subscribe((muted) => {
      setIsMuted(muted);
    });
  }, []);

  const toggleSound = () => {
    soundManager.toggleMute();
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
    if (typeof document !== 'undefined') {
      document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = nextLang;
      localStorage.setItem('coc_language', nextLang);
    }
  };

  const handleLogout = async () => {
    storage.logout();
    try {
      await supabaseSync.signOut();
    } catch {
      // Ignore
    }
    window.location.reload();
  };

  const truncatedAddress = walletState.address
    ? `${walletState.address.slice(0, 6)}...${walletState.address.slice(-4)}`
    : null;

  // =========================================================================
  // Clean Game Header: When entering any game or sports section
  // Uncluttered view keeping ONLY:
  // 1. Clear button to return to the main homepage
  // 2. User balance indicator
  // 3. History icon (السجل)
  // =========================================================================
  if (inGameMode) {
    return (
      <header className="sticky top-0 z-40 w-full bg-[#0e1726]/95 backdrop-blur-md border-b border-[#1e293b] px-3 sm:px-6 py-2.5 text-white transition-all shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* 1. Clear Button to return to the main homepage */}
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

          {/* Right: ONLY (1) User balance indicator + (2) History icon (السجل) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* History icon ("السجل") */}
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-2xl bg-[#1e293b] hover:bg-[#334155] text-xs sm:text-sm font-bold text-[#E2E8F0] hover:text-white transition-all cursor-pointer border border-white/10 shadow-xs active:scale-95"
              title={isAr ? 'عرض سجل الرهانات والجولات' : 'View Bets History'}
            >
              <History className="w-4 h-4 text-[#F59E0B]" />
              <span>{isAr ? 'السجل' : 'History'}</span>
            </button>

            {/* Real User Balance Indicator */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-[#090d16] px-3 sm:px-4 py-1.5 rounded-2xl border border-white/15 font-mono text-xs sm:text-sm font-black shadow-inner">
              <span className="text-[10px] sm:text-xs text-[#94A3B8] font-sans font-bold">
                {isAr ? 'الرصيد:' : 'Balance:'}
              </span>
              <span className="text-[#10B981] font-mono tracking-tight text-sm sm:text-base">
                {(user?.balance ?? walletState.balanceUSDT ?? 0).toFixed(2)}
              </span>
              <span className="text-[11px] sm:text-xs text-[#F59E0B] font-sans font-bold">
                {isJordan ? 'د.أ' : 'ج.م'}
              </span>

              {onOpenDeposit && (
                <button
                  onClick={onOpenDeposit}
                  className="ms-1 w-6 h-6 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white flex items-center justify-center font-bold text-xs shadow-xs transition-transform active:scale-90 cursor-pointer"
                  title={isAr ? 'إيداع سريع' : 'Quick Deposit'}
                >
                  +
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFBF0]/95 backdrop-blur-md border-b border-[#E6E1D5] px-3 sm:px-6 py-2 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Brand Logo */}
        <div className="flex items-center">
          <Logo size="sm" showDomain={true} />
        </div>

        {/* Right: Country Switcher + Language + Wallet Connect + Hamburger Menu (☰) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Country / Currency Switcher: Jordan 🇯🇴 JOD vs Egypt 🇪🇬 EGP */}
          <button
            onClick={toggleCountry}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-[#E6E1D5] bg-[#F5F2EB] hover:bg-white text-xs font-bold text-[#1F2937] transition-all cursor-pointer min-h-[40px] shadow-2xs"
            title={isJordan ? 'التحويل إلى مصر (ج.م EGP)' : 'التحويل إلى الأردن (د.أ JOD)'}
          >
            <span className="text-sm">{isJordan ? '🇯🇴' : '🇪🇬'}</span>
            <span className="font-mono text-[11px] font-black text-[#D97706]">
              {isJordan ? 'د.أ' : 'ج.م'}
            </span>
          </button>

          {/* Language Switcher Button (AR / EN) */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#E6E1D5] bg-[#F5F2EB] hover:bg-white text-xs font-bold text-[#1F2937] transition-colors cursor-pointer min-h-[40px]"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="font-mono text-[11px]">{i18n.language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* Fighter Avatar & Profile Button (if logged in) */}
          {user && (
            <>
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl border border-[#E6E1D5] bg-[#FFFDF9] hover:bg-white hover:border-[#F59E0B] text-xs font-bold text-[#1F2937] transition-all cursor-pointer min-h-[40px] shadow-2xs group"
                title={i18n.language === 'ar' ? 'الملف الشخصي والصورة الرمزية' : 'Profile & Avatar'}
              >
                <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-[#F5F2EB] border border-[#F59E0B]/50 shrink-0">
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
                <div className="hidden md:flex flex-col text-start leading-tight min-w-0 max-w-[85px]">
                  <span className="text-[11px] font-black text-[#1F2937] truncate group-hover:text-[#F59E0B] transition-colors">
                    {user.display_name || (user.username ? `@${user.username}` : (i18n.language === 'ar' ? 'الحساب' : 'Profile'))}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#047857]">
                    {user.country === 'EG' || user.currency === 'EGP'
                      ? `${(user.balance ?? 0).toFixed(0)} ج.م`
                      : user.country === 'JO' || user.currency === 'JOD'
                      ? `${(user.balance ?? 0).toFixed(0)} د.أ`
                      : `$${(user.balance ?? 0).toFixed(0)}`}
                  </span>
                </div>
              </button>

              {/* Quick Logout Button in Header */}
              <button
                onClick={handleLogout}
                className="flex items-center justify-center h-10 w-10 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer shrink-0"
                title={i18n.language === 'ar' ? 'تسجيل الخروج من الحساب' : 'Log Out'}
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4 stroke-[2.2]" />
              </button>
            </>
          )}

          {/* Connect Wallet Button */}
          {walletState.isConnected ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#10B981]/40 bg-[#10B981]/10 hover:bg-[#10B981]/20 text-xs font-bold text-[#047857] transition-all cursor-pointer min-h-[40px]"
              >
                <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="font-mono text-xs">{truncatedAddress}</span>
                <span className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-[#10B981]/30">
                  ${walletState.balanceUSDT.toFixed(0)}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {userDropdownOpen && (
                <div className="absolute end-0 mt-2 w-52 bg-white rounded-2xl border border-[#E6E1D5] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="p-2 border-b border-[#F3EFE6] text-xs">
                    <div className="text-[10px] text-[#78716C]">{walletState.walletName}</div>
                    <div className="font-mono font-bold text-[#1F2937] truncate">{walletState.address}</div>
                    <div className="mt-1 font-mono text-xs text-[#047857]">
                      Wallet: ${walletState.balanceUSDT.toFixed(2)} USDT
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onDisconnectWallet();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-start px-2 py-1.5 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors flex items-center gap-2 cursor-pointer mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('common.disconnectWallet')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenConnectWallet}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white text-xs font-bold shadow-xs hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap min-h-[40px]"
            >
              <Wallet className="w-4 h-4 fill-white/20" />
              <span>{t('common.connectWallet')}</span>
            </button>
          )}

          {/* Sound Mute/Unmute Button (🔊 / 🔇) */}
          <button
            onClick={toggleSound}
            className={`flex items-center justify-center h-10 w-10 rounded-xl border transition-all cursor-pointer ${
              isMuted
                ? 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#DC2626] hover:bg-[#EF4444]/20'
                : 'border-[#10B981]/40 bg-[#10B981]/10 text-[#047857] hover:bg-[#10B981]/20'
            }`}
            title={isMuted ? (i18n.language === 'ar' ? 'تشغيل الصوت' : 'Unmute Sound') : (i18n.language === 'ar' ? 'كتم الصوت' : 'Mute Sound')}
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Hamburger Menu Button (☰) */}
          <button
            onClick={onOpenMenu}
            className="flex items-center justify-center h-10 w-10 rounded-xl border border-[#E6E1D5] bg-[#F5F2EB] hover:bg-white text-[#1F2937] transition-colors cursor-pointer"
            title="Menu"
            aria-label="Navigation Menu"
          >
            <Menu className="w-5 h-5 text-[#1F2937]" />
          </button>
        </div>
      </div>
    </header>
  );
};
