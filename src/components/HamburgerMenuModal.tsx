import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Wallet,
  Clock,
  LayoutDashboard,
  ShieldCheck,
  BookOpen,
  Globe,
  User,
  ExternalLink,
  Volume2,
  VolumeX,
  LogOut,
  Key,
  Shield,
} from 'lucide-react';
import { ConnectedWalletState, UserProfile } from '../types';
import { soundManager } from '../services/sound';
import { supabaseSync } from '../services/supabase';
import { storage } from '../services/storage';

interface HamburgerMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: 'arena' | 'wallet' | 'history' | 'dashboard') => void;
  onOpenProvablyFair: () => void;
  onOpenRules: () => void;
  walletState: ConnectedWalletState;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export const HamburgerMenuModal: React.FC<HamburgerMenuModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenProvablyFair,
  onOpenRules,
  walletState,
  user,
  onOpenAuth,
  onOpenProfile,
}) => {
  const { t, i18n } = useTranslation();
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [volume, setVolume] = useState(soundManager.getVolume());

  useEffect(() => {
    return soundManager.subscribe((muted, vol) => {
      setIsMuted(muted);
      setVolume(vol);
    });
  }, []);

  if (!isOpen) return null;

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
    if (typeof document !== 'undefined') {
      document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = nextLang;
      localStorage.setItem('coc_language', nextLang);
    }
  };

  const isAr = i18n.language === 'ar';

  const handleLogout = async () => {
    storage.logout();
    try {
      await supabaseSync.signOut();
    } catch {
      // Ignore
    }
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-xs p-3 animate-in fade-in">
      <div className="relative w-full max-w-sm bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] shadow-2xl p-5 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#F3EFE6] pb-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-base text-[#1F2937]">قائمة ClashOfCoin</span>
            <span className="text-[10px] font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded">
              .bet
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#F5F2EB] hover:bg-[#E6E1D5] text-[#1F2937] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile & Balance Overview */}
        <div className="p-3 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] space-y-2.5">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-white border-2 border-[#F59E0B] shrink-0 p-0.5 shadow-xs">
                <img
                  src={user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=ClashMaster'}
                  alt={user.display_name || user.username || 'User'}
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://api.dicebear.com/7.x/bottts/svg?seed=ClashMaster';
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-[#1F2937] truncate">
                  {user.display_name || (user.username ? `@${user.username}` : (isAr ? 'مقاتل كلاش' : 'Clash Fighter'))}
                </div>
                <div className="text-[10px] font-mono text-[#78716C] truncate">
                  {user.username ? `@${user.username}` : user.email || 'guest@clashofcoin.bet'}
                </div>
                <div className="font-mono font-black text-xs text-[#047857] mt-0.5">
                  {user.country === 'EG' || user.currency === 'EGP' ? `${(user.balance ?? 0).toFixed(2)} ج.م` : `$${(user.balance ?? 0).toFixed(2)} USDT`}
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenProfile();
                }}
                className="p-2 bg-white rounded-xl border border-[#E6E1D5] text-xs font-bold text-[#1F2937] hover:bg-[#F5F2EB] hover:border-[#F59E0B] transition-all cursor-pointer flex flex-col items-center gap-0.5 shrink-0"
                title={isAr ? 'تعديل الملف الشخصي والصورة' : 'Edit Profile & Avatar'}
              >
                <User className="w-4 h-4 text-[#F59E0B]" />
                <span className="text-[9px]">{isAr ? 'تعديل' : 'Edit'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 py-1">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#D97706]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-[#1F2937]">
                    {isAr ? 'مستخدم ضيف (غير مسجل)' : 'Guest (Not logged in)'}
                  </div>
                  <div className="text-[10px] text-[#78716C]">
                    {isAr ? '0.00 ج.م' : '$0.00 USDT'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                {isAr ? 'دخول / تسجيل' : 'Sign In / Register'}
              </button>
            </div>
          )}

          {/* Quick Account & Logout row */}
          {user && (
            <div className="pt-2 border-t border-[#E6E1D5] grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FFFDF9] border border-[#E6E1D5] hover:border-[#F59E0B] text-[#1F2937] font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>{isAr ? 'إدارة الحساب' : 'Manage Account'}</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isAr ? 'تسجيل الخروج' : 'Log Out'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className="space-y-1 text-sm font-bold">
          <button
            onClick={() => {
              onClose();
              onSelectTab('arena');
            }}
            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl text-start hover:bg-[#F5F2EB] text-[#1F2937] flex items-center gap-3 transition-colors cursor-pointer"
          >
            <span className="p-2 rounded-lg bg-[#F59E0B]/15 text-[#D97706]">⚔️</span>
            <span>{t('nav.arena')}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onSelectTab('wallet');
            }}
            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl text-start hover:bg-[#F5F2EB] text-[#1F2937] flex items-center gap-3 transition-colors cursor-pointer"
          >
            <span className="p-2 rounded-lg bg-[#10B981]/15 text-[#047857]">
              <Wallet className="w-4 h-4" />
            </span>
            <span>{t('nav.wallet')}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onSelectTab('history');
            }}
            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl text-start hover:bg-[#F5F2EB] text-[#1F2937] flex items-center gap-3 transition-colors cursor-pointer"
          >
            <span className="p-2 rounded-lg bg-[#EF4444]/15 text-[#DC2626]">
              <Clock className="w-4 h-4" />
            </span>
            <span>{t('nav.history')}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onSelectTab('dashboard');
            }}
            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl text-start hover:bg-[#F5F2EB] text-[#1F2937] flex items-center gap-3 transition-colors cursor-pointer"
          >
            <span className="p-2 rounded-lg bg-[#8B5CF6]/15 text-[#7C3AED]">
              <LayoutDashboard className="w-4 h-4" />
            </span>
            <span>{t('nav.dashboard')}</span>
          </button>
        </div>

        {/* Volume Slider & Sound Control */}
        <div className="pt-2 border-t border-[#F3EFE6] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#1F2937]">
            <span className="flex items-center gap-2">
              <button
                onClick={() => soundManager.toggleMute()}
                className="p-1 rounded-lg hover:bg-[#E6E1D5] cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-[#EF4444]" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#10B981]" />
                )}
              </button>
              <span>{isAr ? 'مستوى الصوت' : 'Sound Volume'}</span>
            </span>
            <span className="font-mono text-[11px] text-[#78716C]">
              {isMuted ? (isAr ? 'مكتوم' : 'Muted') : `${Math.round(volume * 100)}%`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#78716C] font-mono">0%</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (isMuted && val > 0) {
                  soundManager.setMuted(false);
                }
                soundManager.setVolume(val);
              }}
              className="w-full accent-[#10B981] h-1.5 bg-[#E6E1D5] rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-[#78716C] font-mono">100%</span>
          </div>
        </div>

        {/* Informational Popups: Terms & Conditions (الأحكام والشروط) & Provably Fair & Admin */}
        <div className="pt-2 border-t border-[#F3EFE6] space-y-1">
          <button
            onClick={() => {
              onClose();
              onOpenRules();
            }}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl text-start bg-[#F5F2EB]/60 hover:bg-[#F5F2EB] text-xs font-black text-[#1F2937] flex items-center justify-between transition-colors cursor-pointer border border-[#E6E1D5]/60"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#F59E0B]" />
              <span>{isAr ? 'الأحكام والشروط وقواعد اللعب' : 'Terms, Conditions & Rules'}</span>
            </div>
            <span className="text-[10px] bg-[#F59E0B]/15 text-[#D97706] px-1.5 py-0.5 rounded font-bold">
              {isAr ? 'هام' : 'INFO'}
            </span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenProvablyFair();
            }}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl text-start hover:bg-[#F5F2EB] text-xs font-bold text-[#78716C] hover:text-[#1F2937] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            <span>{isAr ? 'النزاهة الرقمية SHA-256' : 'Provably Fair Verification'}</span>
          </button>

          {/* Master Admin Access Link */}
          <button
            onClick={() => {
              onClose();
              window.location.hash = '#/mainadminsamjordan';
            }}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl text-start hover:bg-[#F5F2EB] text-xs font-bold text-[#F59E0B] hover:text-[#D97706] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Shield className="w-4 h-4 text-[#F59E0B]" />
            <span>{isAr ? 'لوحة تحكم الإدارة الكاملة' : 'Master Admin Dashboard'}</span>
          </button>
        </div>

        {/* Language Switcher in Drawer */}
        <div className="pt-2 border-t border-[#F3EFE6]">
          <button
            onClick={toggleLanguage}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#F5F2EB] hover:bg-[#E6E1D5] text-xs font-bold text-[#1F2937] flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#F59E0B]" />
              <span>{isAr ? 'اللغة / Language' : 'Language / اللغة'}</span>
            </span>
            <span className="font-mono text-[#D97706]">{isAr ? 'English (EN)' : 'العربية (AR)'}</span>
          </button>
        </div>

        {/* Full Red Logout Button in Drawer (only when logged in) */}
        {user && (
          <div className="pt-2 border-t border-[#F3EFE6]">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.98]"
              title={isAr ? 'تسجيل الخروج من الحساب وإعادة ضبط الجلسة' : 'Log out from account and reset session'}
            >
              <LogOut className="w-4 h-4 stroke-[2.5]" />
              <span>{isAr ? 'تسجيل الخروج من الحساب (Log Out)' : 'Log Out from Account (تسجيل الخروج)'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
