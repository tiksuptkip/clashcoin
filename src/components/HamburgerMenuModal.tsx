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
} from 'lucide-react';
import { ConnectedWalletState, UserProfile } from '../types';
import { soundManager } from '../services/sound';

interface HamburgerMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: 'arena' | 'wallet' | 'history' | 'dashboard') => void;
  onOpenProvablyFair: () => void;
  onOpenRules: () => void;
  walletState: ConnectedWalletState;
  user: UserProfile;
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
                ${user.balance.toFixed(2)} USDT
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

        {/* Informational Popups: Rules & Provably Fair */}
        <div className="pt-2 border-t border-[#F3EFE6] space-y-1">
          <button
            onClick={() => {
              onClose();
              onOpenRules();
            }}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl text-start hover:bg-[#F5F2EB] text-xs font-bold text-[#78716C] hover:text-[#1F2937] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#F59E0B]" />
            <span>{isAr ? 'قواعد اللعب وتوزيع الأحواض' : 'Rules & Pool Mechanics'}</span>
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
      </div>
    </div>
  );
};
