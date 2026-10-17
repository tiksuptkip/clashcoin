import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Upload,
  User,
  Check,
  Sparkles,
  Camera,
  AlertCircle,
  Copy,
  CheckCheck,
  Shield,
  Wallet,
  Coins,
  LogOut,
} from 'lucide-react';
import { UserProfile } from '../types';
import { supabaseSync } from '../services/supabase';
import { PRESET_AVATARS } from '../services/storage';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (userData: Partial<UserProfile>) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [username, setUsername] = useState(user.username || '');
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [country, setCountry] = useState<string>(user.country || 'EG');
  const [avatarUrl, setAvatarUrl] = useState(
    user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=ClashMaster'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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

    // Check size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      setUploadError(isAr ? 'حجم الصورة يجب أن لا يتجاوز 4 ميجابايت' : 'Image size must be under 4MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. Try uploading to Supabase Storage 'avatars' bucket
      const res = await supabaseSync.uploadAvatar(user.id, file);

      if (res.publicUrl) {
        setAvatarUrl(res.publicUrl);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 2500);
      } else {
        // Fallback: Read as Data URL so the user avatar works locally even if storage bucket isn't provisioned yet
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            setAvatarUrl(dataUrl);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 2500);
          }
        };
        reader.readAsDataURL(file);

        if (res.error) {
          setShowSqlGuide(true);
        }
      }
    } catch (err: any) {
      // Fallback preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setAvatarUrl(dataUrl);
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 2500);
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
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();
    const cleanDisplayName = displayName.trim();

    onUpdateUser({
      username: cleanUsername || undefined,
      display_name: cleanDisplayName || undefined,
      avatar_url: avatarUrl,
      country,
      currency: country === 'EG' ? 'EGP' : 'USD',
    });

    onClose();
  };

  const handleLogout = async () => {
    try {
      await supabaseSync.signOut();
    } catch {
      // Ignore
    }
    try {
      localStorage.removeItem('clash_of_coin_user');
      localStorage.removeItem('coc_user');
      localStorage.removeItem('coc_wallet');
      localStorage.removeItem('coc_bets');
      localStorage.removeItem('coc_deposits');
      localStorage.removeItem('coc_withdrawals');
      localStorage.removeItem('coc_sports_bets');
    } catch {
      // Ignore
    }
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] shadow-2xl p-6 max-h-[92vh] overflow-y-auto">
        {/* Header Controls: Quick Logout & Close */}
        <div className="absolute top-5 end-5 flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
            title={isAr ? 'تسجيل الخروج من الحساب' : 'Log Out from Account'}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isAr ? 'خروج' : 'Log Out'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#78716C] hover:text-[#1F2937] hover:bg-[#F5F2EB] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Header */}
        <div className="mb-5 border-b border-[#F3EFE6] pb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#B45309] text-xs font-bold mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'الملف الشخصي والصورة الرمزية' : 'Fighter Profile & Avatar'}</span>
          </div>
          <h2 className="text-xl font-black text-[#1F2937]">
            {isAr ? 'تعديل هوية المقاتل' : 'Edit Fighter Identity'}
          </h2>
          <p className="text-xs text-[#78716C] mt-0.5">
            {isAr
              ? 'خصص صورتك واسم المستخدم الذي يظهر للمتسابقين داخل حلبات الصراع'
              : 'Customize your avatar and username shown to rivals across live arena rounds'}
          </p>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] mb-5">
          {/* Avatar Preview */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#F59E0B] shadow-md bg-white p-1 flex items-center justify-center">
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
              className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-md transition-transform active:scale-95 cursor-pointer flex items-center justify-center"
              title={isAr ? 'رفع صورة جديدة' : 'Upload custom avatar'}
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Upload Controls */}
          <div className="flex-1 text-center sm:text-start space-y-2">
            <div>
              <div className="text-sm font-bold text-[#1F2937]">
                {displayName || (username ? `@${username}` : (isAr ? 'مقاتل كلاش' : 'Clash Fighter'))}
              </div>
              <div className="font-mono text-xs text-[#78716C]">
                {username ? `@${username}` : (isAr ? 'لم يتم تحديد اسم مستخدم' : 'No username set')}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E6E1D5] hover:border-[#F59E0B] text-xs font-bold text-[#1F2937] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>{isUploading ? (isAr ? 'جاري الرفع...' : 'Uploading...') : (isAr ? 'رفع صورة من جهازك' : 'Upload from device')}</span>
              </button>

              {uploadSuccess && (
                <span className="text-xs font-bold text-[#10B981] flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تم تحديث الصورة!' : 'Avatar updated!'}</span>
                </span>
              )}
            </div>

            <p className="text-[10px] text-[#A8A29E]">
              {isAr
                ? 'تدعم الصيغ: PNG, JPG, WebP بحجم أقصى 4MB. تُحفظ في Supabase Storage (avatars)'
                : 'Supports PNG, JPG, WebP up to 4MB. Stored in Supabase Storage (avatars)'}
            </p>
          </div>
        </div>

        {uploadError && (
          <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-xs text-[#DC2626] font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Quick Crypto Bot Avatars */}
        <div className="mb-5">
          <label className="text-xs font-bold text-[#78716C] block mb-2">
            {isAr ? 'أو اختر شخصية رمزية سريعة:' : 'Or choose a preset avatar:'}
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

        {/* Form Fields: username, display_name */}
        <form onSubmit={handleSave} className="space-y-4">
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
                placeholder="crypto_warrior"
                className="w-full ps-8 pe-3 py-2.5 bg-[#FFFDF9] border border-[#E6E1D5] rounded-xl text-xs font-mono font-bold text-[#1F2937] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
            <p className="text-[10px] text-[#A8A29E] mt-1">
              {isAr
                ? 'حروف إنجليزية صغيرة، أرقام، وشرطة سفلية فقط (حتى 20 حرفاً)'
                : 'Lowercase English letters, numbers, and underscores only (up to 20 chars)'}
            </p>
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
                placeholder={isAr ? 'ملك العملات 👑' : 'Crypto King 👑'}
                className="w-full ps-9 pe-3 py-2.5 bg-[#FFFDF9] border border-[#E6E1D5] rounded-xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#78716C] block mb-1">
              {isAr ? 'الدولة والعملة المالية (Country & Currency):' : 'Country & Currency:'}
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#FFFDF9] border border-[#E6E1D5] rounded-xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#F59E0B] cursor-pointer"
            >
              <option value="EG">🇪🇬 مصر (Egypt) · الجنيه المصري (EGP / ج.م)</option>
              <option value="OTHER">🌐 أخرى / دولي (International) · الدولار (USD)</option>
            </select>
            <p className="text-[10px] text-[#A8A29E] mt-1">
              {country === 'EG'
                ? (isAr ? 'النظام المالي بالكامل بالجنيه المصري ومحافظ فودافون كاش وإنستاباي مفعّلة (باستثناء حلبة الكريبتو بالدولار USDT).' : 'Egyptian currency (EGP) and local wallets enabled.')
                : (isAr ? 'النظام المالي بالدولار الأمريكي USD.' : 'International USD mode.')}
            </p>
          </div>

          {/* Account Balance Snapshot */}
          <div className="p-3 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#F59E0B]" />
              <span className="font-bold text-[#78716C]">{isAr ? 'رصيد الحساب:' : 'Balance:'}</span>
              <span className="font-mono font-black text-[#047857]">
                {country === 'EG' || user.currency === 'EGP' ? `${user.balance.toFixed(2)} ج.م` : `$${user.balance.toFixed(2)} USDT`}
              </span>
            </div>
            <div className="font-mono text-[11px] text-[#78716C]">
              {user.email || 'guest@clashofcoin.bet'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white font-extrabold text-xs rounded-xl shadow-xs transition-transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isAr ? 'حفظ التغييرات' : 'Save Changes'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-[#F5F2EB] hover:bg-[#E6E1D5] text-[#1F2937] font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>

          {/* Full Logout Button in Profile Modal */}
          <div className="pt-3 border-t border-[#E6E1D5]">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.98]"
              title={isAr ? 'تسجيل الخروج من الحساب' : 'Log out from account'}
            >
              <LogOut className="w-4 h-4 stroke-[2.5]" />
              <span>{isAr ? 'تسجيل الخروج من الحساب (Log Out)' : 'Log Out from Account (تسجيل الخروج)'}</span>
            </button>
          </div>
        </form>

        {/* Collapsible Supabase Storage & Profiles SQL info */}
        <div className="mt-5 pt-3 border-t border-[#F3EFE6]">
          <button
            type="button"
            onClick={() => setShowSqlGuide(!showSqlGuide)}
            className="text-[11px] font-bold text-[#78716C] hover:text-[#F59E0B] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>
              {isAr
                ? 'إعدادات Supabase Storage وسياسات RLS (SQL)'
                : 'Supabase Storage & RLS Schema (SQL)'}
            </span>
            <span className="text-[10px] text-[#A8A29E] font-mono">
              {showSqlGuide ? '[-]' : '[+]'}
            </span>
          </button>

          {showSqlGuide && (
            <div className="mt-2 p-3 bg-[#18181b] rounded-xl border border-[#27272a] text-white space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs text-[#a1a1aa]">
                <span>Supabase SQL Console Snippet:</span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-1 text-[11px] text-[#F59E0B] hover:text-white cursor-pointer"
                >
                  {copiedSql ? <CheckCheck className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الكود' : 'Copy SQL')}</span>
                </button>
              </div>
              <pre className="font-mono text-[10px] text-[#10B981] overflow-x-auto p-2 bg-black/60 rounded-lg max-h-36">
                {sqlCode}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
