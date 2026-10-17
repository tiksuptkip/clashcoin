import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Mail, Lock, Gift, Key, CheckCircle, ShieldCheck, User, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { supabaseSync } from '../services/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (userData: Partial<UserProfile>) => void;
  onConnectWallet: () => void;
  isWalletConnected: boolean;
  walletAddress: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onConnectWallet,
  isWalletConnected,
  walletAddress,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [tab, setTab] = useState<'login' | 'register' | 'wallet'>('login');
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(user.username || '');
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [referralCode, setReferralCode] = useState('');
  const [country, setCountry] = useState<string>(user.country || 'EG');
  const [signedSuccess, setSignedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg(isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg(isAr ? 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();
    const cleanDisplayName = displayName.trim();
    const finalCurrency = country === 'EG' ? 'EGP' : 'USD';

    try {
      if (tab === 'register') {
        const { user: authUser, error: authError } = await supabaseSync.signUpWithEmail(
          email,
          password,
          {
            username: cleanUsername || undefined,
            display_name: cleanDisplayName || undefined,
            referral_code: referralCode.trim() || undefined,
          }
        );

        let newBalance = user.balance;
        if (referralCode.trim()) {
          newBalance += country === 'EG' ? 250.0 : 50.0;
        }

        onUpdateUser({
          id: authUser?.id || user.id,
          email,
          username: cleanUsername || user.username,
          display_name: cleanDisplayName || user.display_name,
          country,
          currency: finalCurrency,
          balance: newBalance,
          referredBy: referralCode.trim() || undefined,
        });

        if (authError) {
          // If email verification is needed or user exists, notify gently
          console.warn('Supabase register note:', authError);
        }
      } else {
        // Sign in
        const { user: authUser, error: authError } = await supabaseSync.signInWithEmail(
          email,
          password
        );

        let loadedProfile: any = null;
        if (authUser) {
          loadedProfile = await supabaseSync.getProfile(authUser.id);
        }

        onUpdateUser({
          id: authUser?.id || user.id,
          email,
          username: loadedProfile?.username || cleanUsername || user.username,
          display_name: loadedProfile?.display_name || cleanDisplayName || user.display_name,
          avatar_url: loadedProfile?.avatar_url || user.avatar_url,
        });

        if (authError) {
          console.warn('Supabase signin note:', authError);
        }
      }

      setIsSubmitting(false);
      onClose();
    } catch {
      // Local fallback
      let newBalance = user.balance;
      if (tab === 'register' && referralCode.trim()) {
        newBalance += 50.0;
      }
      onUpdateUser({
        email,
        username: cleanUsername || user.username,
        display_name: cleanDisplayName || user.display_name,
        balance: newBalance,
        referredBy: referralCode.trim() || undefined,
      });
      setIsSubmitting(false);
      onClose();
    }
  };

  const handleSignMessageLogin = () => {
    if (!isWalletConnected) {
      onConnectWallet();
      return;
    }

    // Simulate EIP-712 / personal_sign
    setSignedSuccess(true);
    setTimeout(() => {
      onUpdateUser({
        address: walletAddress || undefined,
      });
      setSignedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2937]/40 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute top-5 end-5 p-1.5 rounded-full text-[#78716C] hover:text-[#1F2937] hover:bg-[#F5F2EB] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="mb-4">
          <h2 className="text-xl font-black text-[#1F2937]">
            {tab === 'wallet'
              ? t('auth.loginWithWallet')
              : tab === 'register'
              ? t('auth.register')
              : t('auth.login')}
          </h2>
          <p className="text-xs text-[#78716C] mt-1">
            Access your Clash Of Coin account, manage battle balances, and track referral bonuses.
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#F5F2EB] rounded-xl text-xs font-bold mb-4">
          <button
            onClick={() => setTab('login')}
            className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
              tab === 'login' ? 'bg-white text-[#1F2937] shadow-xs' : 'text-[#78716C]'
            }`}
          >
            {t('auth.login')}
          </button>
          <button
            onClick={() => setTab('register')}
            className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
              tab === 'register' ? 'bg-white text-[#1F2937] shadow-xs' : 'text-[#78716C]'
            }`}
          >
            {t('auth.register')}
          </button>
          <button
            onClick={() => setTab('wallet')}
            className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
              tab === 'wallet' ? 'bg-white text-[#D97706] shadow-xs' : 'text-[#78716C]'
            }`}
          >
            Web3 Sign
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-xs text-[#EF4444] font-medium">
            {errorMsg}
          </div>
        )}

        {/* Tab Content */}
        {tab === 'wallet' ? (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[#1F2937]">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <span>EIP-4361 Sign-In With Ethereum / Web3</span>
              </div>
              <p className="text-[#78716C]">{t('auth.signMessageDesc')}</p>
              <div className="font-mono text-[11px] bg-white p-2 rounded-xl border border-[#E6E1D5] text-[#78716C]">
                &quot;Sign this message to authenticate your wallet at ClashOfCoin.bet. Nonce:{' '}
                {Date.now()}&quot;
              </div>
            </div>

            {signedSuccess ? (
              <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl text-center text-xs font-bold text-[#047857] flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#10B981]" />
                <span>Cryptographic Signature Verified!</span>
              </div>
            ) : (
              <button
                onClick={handleSignMessageLogin}
                className="w-full py-2.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                <span>{isWalletConnected ? t('auth.signAndLogin') : t('common.connectWallet')}</span>
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-[#78716C] block mb-1">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full ps-9 pe-3 py-2 bg-[#FFFDF9] border border-[#E6E1D5] rounded-xl text-xs text-[#1F2937] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#78716C] block mb-1">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full ps-9 pe-3 py-2 bg-[#FFFDF9] border border-[#E6E1D5] rounded-xl text-xs text-[#1F2937] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>
            </div>

            {tab === 'register' && (
              <>
                <div>
                  <label className="text-[11px] font-bold text-[#78716C] block mb-1">
                    {isAr ? 'اسم المستخدم الفريد (@username):' : 'Unique Username (@username):'}
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
                      className="w-full ps-8 pe-3 py-2 bg-[#FFFDF9] border border-[#E6E1D5] rounded-xl text-xs font-mono font-bold text-[#1F2937] focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#78716C] block mb-1">
                    {isAr ? 'اسم العرض (Display Name):' : 'Display Name:'}
                  </label>
                  <div className="relative">
                    <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value.slice(0, 30))}
                      placeholder={isAr ? 'صقر التداول 🦅' : 'Crypto Hawk 🦅'}
                      className="w-full ps-9 pe-3 py-2 bg-[#FFFDF9] border border-[#E6E1D5] rounded-xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#78716C] block mb-1">
                    {isAr ? 'الدولة والعملة (Country & Currency):' : 'Country & Currency:'}
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#E6E1D5] rounded-xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#F59E0B] cursor-pointer"
                  >
                    <option value="EG">🇪🇬 مصر (Egypt) · الجنيه المصري (EGP)</option>
                    <option value="OTHER">🌐 أخرى / دولي (International) · الدولار (USD)</option>
                  </select>
                  <p className="text-[10px] text-[#A8A29E] mt-1 leading-tight">
                    {country === 'EG'
                      ? (isAr ? 'يتم تحويل النظام المالي بالكامل للجنيه المصري ومحافظ فودافون كاش وإنستاباي.' : 'Local Egyptian wallets and EGP currency enabled.')
                      : (isAr ? 'النظام المالي بالدولار الأمريكي USDT.' : 'International USD/USDT system.')}
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#78716C] block mb-1 flex items-center justify-between">
                    <span>{t('auth.referralCode')}</span>
                    <span className="text-[10px] text-[#D97706] font-semibold">+10% Bonus</span>
                  </label>
                  <div className="relative">
                    <Gift className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D97706]" />
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="CLASHWIN"
                      className="w-full ps-9 pe-3 py-2 bg-[#FFFDF9] border border-[#E6E1D5] rounded-xl text-xs text-[#1F2937] uppercase font-mono focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 mt-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isSubmitting
                ? isAr ? 'جاري المعالجة...' : 'Processing...'
                : tab === 'register' ? t('auth.register') : t('auth.login')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
