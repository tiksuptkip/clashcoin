import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ConnectedWalletState, UserBet, UserProfile } from '../types';
import {
  Trophy,
  TrendingUp,
  Percent,
  Share2,
  Copy,
  Check,
  Gift,
  Zap,
  ArrowRight,
  Wallet,
  Upload,
  Camera,
  User,
  Shield,
  CheckCheck,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { supabaseSync } from '../services/supabase';
import { PRESET_AVATARS } from '../services/storage';

interface DashboardPageProps {
  user: UserProfile | null;
  walletState: ConnectedWalletState;
  bets: UserBet[];
  onGoToArena: () => void;
  onOpenConnectWallet: () => void;
  onUpdateUser: (userData: Partial<UserProfile>) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  walletState,
  bets,
  onGoToArena,
  onOpenConnectWallet,
  onUpdateUser,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [copiedLink, setCopiedLink] = useState(false);

  // Profile editing state
  const [username, setUsername] = useState(user?.username || '');
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(
    user?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=ClashMaster'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const wonBets = bets.filter((b) => b.status === 'WON').length;
  const settledBets = bets.filter((b) => b.status !== 'ACTIVE').length;
  const winRate = settledBets > 0 ? Math.round((wonBets / settledBets) * 100) : 50;
  const netProfit = (user?.totalWonAmount ?? 0) - (user?.totalLostAmount ?? 0);

  const referralLink = `https://ClashOfCoin.bet?ref=${user?.referralCode || 'CLASH'}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const sqlCode = `-- إنشاء باكت التخزين للصور (Supabase Storage)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- سياسات رفع الصور (Storage RLS Policies)
CREATE POLICY "Avatar public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- تأكد من وجود أعمدة profiles في قاعدة البيانات
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setUploadError(isAr ? 'حجم الصورة يجب ألا يتجاوز 4MB' : 'Image size must be under 4MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Upload to Supabase Storage 'avatars' bucket
      const res = await supabaseSync.uploadAvatar(user?.id || 'anonymous', file);

      if (res.publicUrl) {
        setAvatarUrl(res.publicUrl);
        onUpdateUser({ avatar_url: res.publicUrl });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        // Fallback preview locally
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            setAvatarUrl(dataUrl);
            onUpdateUser({ avatar_url: dataUrl });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2500);
          }
        };
        reader.readAsDataURL(file);

        if (res.error) {
          setShowSqlGuide(true);
        }
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setAvatarUrl(dataUrl);
          onUpdateUser({ avatar_url: dataUrl });
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2500);
        }
      };
      reader.readAsDataURL(file);
      setShowSqlGuide(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectPreset = (url: string) => {
    setAvatarUrl(url);
    onUpdateUser({ avatar_url: url });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();
    const cleanDisplayName = displayName.trim();

    onUpdateUser({
      username: cleanUsername || undefined,
      display_name: cleanDisplayName || undefined,
      avatar_url: avatarUrl,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-[#F59E0B]/15 via-[#FFFDF9] to-[#10B981]/15 rounded-3xl border border-[#E6E1D5] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F59E0B]/20 text-[#B45309] text-xs font-bold mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>{isAr ? 'الملف الشخصي وأداء المتسابق' : 'Fighter Profile & Performance'}</span>
          </div>
          <h1 className="text-2xl font-black text-[#1F2937]">{t('dashboard.welcome')}</h1>
          <p className="text-xs text-[#78716C] mt-1">
            {isAr
              ? 'تتبع دقة توقعاتك، خصص هويتك وصورتك الرمزية، وأدر أرباح الإحالات والمحافظ.'
              : 'Track your prediction precision, manage your identity & avatar, and earn passive bonuses.'}
          </p>
        </div>

        <button
          onClick={onGoToArena}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white text-xs font-black shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98]"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>{isAr ? 'دخول الحلبة المباشرة' : 'Enter Live Arena'}</span>
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        </button>
      </div>

      {/* 1. Fighter Identity & Avatar Card */}
      <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F3EFE6] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/15 text-[#D97706] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#1F2937]">
                {isAr ? 'هوية المقاتل والصورة الشخصية (Avatar)' : 'Fighter Identity & Avatar'}
              </h2>
              <p className="text-xs text-[#78716C]">
                {isAr
                  ? 'صورتك واسمك يظهران لجميع المتسابقين في حوض الصعود والهبوط وسجل الجولات'
                  : 'Your avatar & name are displayed live to all participants in UP/DOWN battle pools'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              className="text-xs font-bold text-[#78716C] hover:text-[#F59E0B] flex items-center gap-1 cursor-pointer bg-[#F5F2EB] px-2.5 py-1.5 rounded-xl border border-[#E6E1D5]"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Supabase Storage (SQL)</span>
            </button>
          </div>
        </div>

        {/* Collapsible SQL helper */}
        {showSqlGuide && (
          <div className="p-4 bg-[#18181b] rounded-2xl border border-[#27272a] text-white space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs text-[#a1a1aa]">
              <span className="font-bold text-[#F59E0B]">
                Supabase Storage & Profiles Migration SQL:
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1 text-xs text-[#F59E0B] hover:text-white cursor-pointer bg-[#27272a] px-2.5 py-1 rounded-lg"
              >
                {copiedSql ? <CheckCheck className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ كود SQL' : 'Copy SQL')}</span>
              </button>
            </div>
            <pre className="font-mono text-[10px] text-[#10B981] overflow-x-auto p-3 bg-black/60 rounded-xl max-h-36">
              {sqlCode}
            </pre>
          </div>
        )}

        {/* Avatar Upload & Settings Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Avatar Picture & Upload Column */}
          <div className="md:col-span-4 flex flex-col items-center p-4 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] text-center space-y-3">
            <div className="relative group">
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-3 border-[#F59E0B] shadow-md bg-white p-1">
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://api.dicebear.com/7.x/bottts/svg?seed=Fallback';
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-md transition-transform active:scale-95 cursor-pointer flex items-center justify-center"
                title={isAr ? 'رفع صورة جديدة' : 'Upload custom avatar'}
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full py-2 px-3 rounded-xl bg-white border border-[#E6E1D5] hover:border-[#F59E0B] text-xs font-bold text-[#1F2937] shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>
                {isUploading
                  ? (isAr ? 'جاري الرفع إلى Supabase...' : 'Uploading to Supabase...')
                  : (isAr ? 'رفع صورة من جهازك' : 'Upload Photo')}
              </span>
            </button>

            <span className="text-[10px] text-[#78716C]">
              {isAr ? 'Supabase Storage: bucket `avatars`' : 'Stored in Supabase `avatars` bucket'}
            </span>

            {uploadError && (
              <div className="text-[11px] text-[#DC2626] font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Form and Quick Avatars Column */}
          <div className="md:col-span-8 space-y-4">
            {/* Quick Preset Avatars Picker */}
            <div>
              <label className="text-xs font-bold text-[#78716C] block mb-1.5">
                {isAr ? 'أو اختر شخصية رمزية بنقرة واحدة:' : 'Or pick a preset avatar with 1-click:'}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = avatarUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url)}
                      title={preset.label}
                      className={`relative p-1 rounded-xl border transition-all cursor-pointer flex flex-col items-center bg-white ${
                        isSelected
                          ? 'border-[#F59E0B] ring-2 ring-[#F59E0B]/30 shadow-xs scale-105'
                          : 'border-[#E6E1D5] hover:border-[#F59E0B]/60'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-10 h-10 object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F59E0B] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inputs Form */}
            <form onSubmit={handleSaveProfile} className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#78716C] block mb-1">
                    {isAr ? 'اسم المستخدم الفريد (Username):' : 'Unique Username:'}
                  </label>
                  <div className="relative">
                    <span className="absolute start-3 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-[#A8A29E]">
                      @
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) =>
                        setUsername(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_]/g, '')
                            .slice(0, 20)
                        )
                      }
                      placeholder="cryptoking"
                      className="w-full ps-8 pe-3 py-2 bg-[#FFFDF9] border border-[#E6E1D5] rounded-xl text-xs font-mono font-bold text-[#1F2937] focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                  <span className="text-[10px] text-[#A8A29E] mt-0.5 block">
                    {isAr ? 'مخزن في عمود public.profiles.username' : 'Synced to public.profiles.username'}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#78716C] block mb-1">
                    {isAr ? 'اسم العرض (Display Name):' : 'Display Name:'}
                  </label>
                  <div className="relative">
                    <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value.slice(0, 30))}
                      placeholder={isAr ? 'الملك 👑' : 'Crypto King 👑'}
                      className="w-full ps-9 pe-3 py-2 bg-[#FFFDF9] border border-[#E6E1D5] rounded-xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                  <span className="text-[10px] text-[#A8A29E] mt-0.5 block">
                    {isAr ? 'مخزن في عمود public.profiles.display_name' : 'Synced to public.profiles.display_name'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white font-extrabold text-xs rounded-xl shadow-xs transition-transform active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'حفظ هوية المقاتل' : 'Save Fighter Identity'}</span>
                </button>

                {saveSuccess && (
                  <span className="text-xs font-bold text-[#10B981] flex items-center gap-1 animate-in fade-in">
                    <Check className="w-4 h-4" />
                    <span>{isAr ? 'تم حفظ التعديلات بنجاح!' : 'Profile saved successfully!'}</span>
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-[#FFFDF9] rounded-2xl border border-[#E6E1D5] shadow-xs">
          <div className="text-xs font-bold text-[#78716C] mb-1">{t('dashboard.totalBets')}</div>
          <div className="font-mono font-black text-2xl text-[#1F2937]">
            {user?.totalBetsPlaced ?? 0}
          </div>
          <div className="text-[11px] text-[#A8A29E] mt-0.5">Across 5 coin rooms</div>
        </div>

        <div className="p-4 bg-[#FFFDF9] rounded-2xl border border-[#E6E1D5] shadow-xs">
          <div className="text-xs font-bold text-[#78716C] mb-1">{t('dashboard.winRate')}</div>
          <div className="font-mono font-black text-2xl text-[#10B981] flex items-center gap-1">
            <span>{winRate}%</span>
            <Percent className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-[11px] text-[#A8A29E] mt-0.5">{wonBets} won of {settledBets} rounds</div>
        </div>

        <div className="p-4 bg-[#FFFDF9] rounded-2xl border border-[#E6E1D5] shadow-xs">
          <div className="text-xs font-bold text-[#78716C] mb-1">{t('dashboard.netProfit')}</div>
          <div
            className={`font-mono font-black text-2xl ${
              netProfit >= 0 ? 'text-[#047857]' : 'text-[#DC2626]'
            }`}
          >
            {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#A8A29E] mt-0.5">Cumulative net earnings</div>
        </div>

        <div className="p-4 bg-[#FFFDF9] rounded-2xl border border-[#E6E1D5] shadow-xs">
          <div className="text-xs font-bold text-[#78716C] mb-1">{t('dashboard.referralEarned')}</div>
          <div className="font-mono font-black text-2xl text-[#D97706]">
            ${(user?.referralEarnings ?? 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-[#A8A29E] mt-0.5">Direct referral commissions</div>
        </div>
      </div>

      {/* Connected Wallet & Account Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wallet status card */}
        <div className="p-5 bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F3EFE6] pb-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#F59E0B]" />
              <h2 className="text-sm font-bold text-[#1F2937]">Connected Web3 Credentials</h2>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                walletState.isConnected
                  ? 'bg-[#10B981]/10 text-[#047857]'
                  : 'bg-[#78716C]/10 text-[#78716C]'
              }`}
            >
              {walletState.isConnected ? walletState.walletName : 'No Wallet'}
            </span>
          </div>

          {walletState.isConnected ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#F5F2EB]">
                <span className="text-[#78716C]">Public Address:</span>
                <span className="font-mono font-bold text-[#1F2937]">
                  {walletState.address?.slice(0, 8)}...{walletState.address?.slice(-6)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#F5F2EB]">
                <span className="text-[#78716C]">Network:</span>
                <span className="font-bold text-[#1F2937]">{walletState.chainName}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[#78716C]">Connected USDT Balance:</span>
                <span className="font-mono font-black text-sm text-[#047857]">
                  ${walletState.balanceUSDT.toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-xs text-[#78716C] mb-3">
                Link your Web3 wallet for Polymarket-style instant round execution without manual deposits.
              </p>
              <button
                onClick={onOpenConnectWallet}
                className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {t('common.connectWallet')}
              </button>
            </div>
          )}
        </div>

        {/* Referral Program Card */}
        <div className="p-5 bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F3EFE6] pb-3">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#10B981]" />
              <h2 className="text-sm font-bold text-[#1F2937]">{t('dashboard.referralProgram')}</h2>
            </div>
            <span className="text-xs font-bold text-[#047857] bg-[#10B981]/15 px-2 py-0.5 rounded-full">
              Earn 5% House Share
            </span>
          </div>

          <p className="text-xs text-[#78716C]">
            Share your unique referral code or link. Friends receive a 10% welcome bonus, and you earn
            5% of the platform edge on all their battle rounds perpetually.
          </p>

          <div>
            <span className="text-[11px] font-bold text-[#78716C] block mb-1">
              {t('dashboard.yourReferralLink')}:
            </span>
            <div className="flex items-center justify-between bg-[#F5F2EB] px-3 py-2 rounded-xl border border-[#E6E1D5]">
              <span className="font-mono text-xs font-bold text-[#1F2937] truncate me-2">
                {referralLink}
              </span>
              <button
                onClick={handleCopyReferral}
                className="flex items-center gap-1 text-xs font-bold text-[#D97706] hover:text-[#B45309] shrink-0 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? t('common.copied') : t('common.copy')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

