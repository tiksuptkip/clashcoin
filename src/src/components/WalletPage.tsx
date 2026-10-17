import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ConnectedWalletState,
  DepositRecord,
  EgyptianPaymentMethod,
  UserProfile,
  WithdrawalRequest,
} from '../types';
import { storage } from '../services/storage';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  QrCode,
  Copy,
  Check,
  ShieldAlert,
  Zap,
  CheckCircle,
  Clock,
  Sparkles,
  Smartphone,
  Upload,
  Coins,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface WalletPageProps {
  user: UserProfile;
  walletState: ConnectedWalletState;
  deposits: DepositRecord[];
  withdrawals: WithdrawalRequest[];
  withdrawalFeeRate: number;
  onOpenConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onRequestWithdrawal: (amount: number, network: 'TRC20' | 'BEP20', address: string) => void;
  onSimulateDeposit: (amount: number, network: 'TRC20' | 'BEP20') => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({
  user,
  walletState,
  deposits,
  withdrawals,
  withdrawalFeeRate,
  onOpenConnectWallet,
  onDisconnectWallet,
  onRequestWithdrawal,
  onSimulateDeposit,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const isEgypt = user.country === 'EG' || user.currency === 'EGP';
  const currencySymbol = isEgypt ? 'ج.م' : 'USDT';

  const [activeTab, setActiveTab] = useState<'connect' | 'deposit' | 'withdraw' | 'history'>('deposit');

  // Deposit Mode (Egyptian Wallets vs Crypto)
  const [depositCategory, setDepositCategory] = useState<'EGYPTIAN' | 'CRYPTO'>('EGYPTIAN');
  const [egyptianMethod, setEgyptianMethod] = useState<EgyptianPaymentMethod>('VODAFONE_CASH');
  const [senderAccount, setSenderAccount] = useState('');
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [depositSuccessMsg, setDepositSuccessMsg] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [depositNetwork, setDepositNetwork] = useState<'TRC20' | 'BEP20'>('TRC20');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Withdrawal state
  const [withdrawMethod, setWithdrawMethod] = useState<EgyptianPaymentMethod>('VODAFONE_CASH');
  const [withdrawCategory, setWithdrawCategory] = useState<'EGYPTIAN' | 'CRYPTO'>('EGYPTIAN');
  const [withdrawDestination, setWithdrawDestination] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(100);
  const [withdrawNetwork, setWithdrawNetwork] = useState<'TRC20' | 'BEP20'>('TRC20');
  const [withdrawSubmitted, setWithdrawSubmitted] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  // Selected receipt modal
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  const settings = storage.getSettings();

  const getCompanyNumber = (m: EgyptianPaymentMethod) => {
    return storage.getCompanyWalletForMethod(m);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setDepositError(isAr ? 'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت' : 'Image size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptImage(event.target?.result as string);
      setDepositError('');
    };
    reader.readAsDataURL(file);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderAccount.trim()) {
      setDepositError(isAr ? 'يرجى إدخال رقم الهاتف أو الحساب المحول منه' : 'Please enter sender account');
      return;
    }
    if (!depositAmount || depositAmount < 10) {
      setDepositError(isAr ? 'الحد الأدنى للإيداع هو 10 ج.م' : 'Minimum deposit is 10 EGP');
      return;
    }
    if (!receiptImage) {
      setDepositError(isAr ? 'يرجى رفع صورة إيصال التحويل لتأكيد الإيداع' : 'Please upload transfer receipt screenshot');
      return;
    }

    setDepositError('');
    storage.addDeposit(depositAmount, egyptianMethod, {
      senderAccount: senderAccount.trim(),
      companyAccount: getCompanyNumber(egyptianMethod),
      receiptImage,
      currency: isEgypt ? 'EGP' : 'USD',
    });

    setDepositSuccessMsg(true);
    setSenderAccount('');
    setReceiptImage(null);
    setTimeout(() => setDepositSuccessMsg(false), 5000);
  };

  const fee = Number(((withdrawAmount * withdrawalFeeRate) / 100).toFixed(2));
  const netWithdraw = Math.max(0, Number((withdrawAmount - fee).toFixed(2)));

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawDestination.trim()) {
      setWithdrawError(isAr ? 'يرجى إدخال رقم الهاتف / الحساب أو عنوان المحفظة' : 'Please enter destination account');
      return;
    }
    if (withdrawAmount < 50) {
      setWithdrawError(isAr ? 'الحد الأدنى للسحب هو 50 ج.م' : 'Minimum withdrawal is $50 / 50 EGP');
      return;
    }
    if (withdrawAmount > user.balance) {
      setWithdrawError(isAr ? 'مبلغ السحب يتجاوز رصيد حسابك المتاح' : 'Amount exceeds available balance');
      return;
    }

    setWithdrawError('');
    storage.requestWithdrawal(withdrawAmount, withdrawCategory === 'CRYPTO' ? 'CRYPTO' : withdrawMethod, {
      userAccount: withdrawDestination.trim(),
      network: withdrawCategory === 'CRYPTO' ? withdrawNetwork : undefined,
      currency: isEgypt ? 'EGP' : 'USD',
    });

    setWithdrawSubmitted(true);
    setTimeout(() => setWithdrawSubmitted(false), 4500);
    setWithdrawDestination('');
  };

  const depositAddresses = {
    TRC20: 'TN3W4H8d7ClashOfCoinUSDTTRC20x892019',
    BEP20: '0x94821a7E0459c3a64dE3B21ClashOfCoinBEP20',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header title */}
      <div className="text-start">
        <h1 className="text-2xl font-black text-[#1F2937]">
          {isAr ? 'المحفظة وإدارة الأموال' : t('wallet.title')}
        </h1>
        <p className="text-xs text-[#78716C] mt-1">
          {isAr
            ? 'شحن وسحب الأرباح الفوري عبر المحافظ المصرية (فودافون كاش، إنستا باي، اتصالات، أورانج، فوري) أو العملات الرقمية'
            : t('wallet.subtitle')}
        </p>
      </div>

      {/* Top Balances Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Site Balance */}
        <div className="p-4 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#78716C] mb-1 font-semibold">
            <span>{isAr ? 'رصيد المنصة المتاح' : t('wallet.connectCard.siteBalance')}</span>
            <span className="text-[10px] bg-[#10B981]/10 text-[#047857] px-2 py-0.5 rounded-full font-bold">
              {isAr ? 'متاح للرهان' : 'Available'}
            </span>
          </div>
          <div className="font-mono font-black text-2xl text-[#047857]">
            {user.balance.toFixed(2)}{' '}
            <span className="text-xs font-bold text-[#78716C]">{currencySymbol}</span>
          </div>
          <div className="text-[11px] text-[#78716C] mt-1">
            {isAr
              ? 'جاهز للمراهنة الفورية في لعبة الطائرة وحلبات العملات والرياضة'
              : 'Ready for direct instant battle wagering'}
          </div>
        </div>

        {/* Connected Web3 Wallet Balance */}
        <div className="p-4 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#78716C] mb-1 font-semibold">
            <span>{t('wallet.connectCard.walletBalance')}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                walletState.isConnected
                  ? 'bg-[#10B981]/10 text-[#047857]'
                  : 'bg-[#78716C]/10 text-[#78716C]'
              }`}
            >
              {walletState.isConnected ? walletState.walletName : isAr ? 'غير متصلة' : 'Not Connected'}
            </span>
          </div>
          <div className="font-mono font-black text-2xl text-[#1F2937]">
            ${walletState.isConnected ? walletState.balanceUSDT.toFixed(2) : '0.00'}{' '}
            <span className="text-xs font-bold text-[#78716C]">USDT</span>
          </div>
          <div className="text-[11px] text-[#78716C] mt-1">
            {walletState.isConnected
              ? `Linked to ${walletState.address?.slice(0, 6)}...${walletState.address?.slice(-4)}`
              : isAr ? 'اربط محفظة Web3 للرهان اللامركزي المباشر' : 'Connect Web3 wallet for direct wagering'}
          </div>
        </div>

        {/* Total Volume & Earnings */}
        <div className="p-4 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#78716C] mb-1 font-semibold">
            <span>{isAr ? 'صافي أرباح الحساب' : 'Career Net PnL'}</span>
            <span className="text-[10px] bg-[#F59E0B]/10 text-[#D97706] px-2 py-0.5 rounded-full font-bold">
              {isAr ? 'مثبت بنزاهة' : 'Fair Verified'}
            </span>
          </div>
          <div className="font-mono font-black text-2xl text-[#D97706]">
            +{(user.totalWonAmount - user.totalLostAmount).toFixed(2)}{' '}
            <span className="text-xs font-bold text-[#78716C]">{currencySymbol}</span>
          </div>
          <div className="text-[11px] text-[#78716C] mt-1">
            {user.totalBetsPlaced} {isAr ? 'رهانات مسجلة' : 'rounds entered'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] w-full max-w-xl">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'deposit'
              ? 'bg-white text-[#10B981] shadow-xs'
              : 'text-[#78716C] hover:text-[#1F2937]'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5 text-[#10B981]" />
          <span>{isAr ? 'إيداع رصيد' : t('wallet.tabs.deposit')}</span>
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'withdraw'
              ? 'bg-white text-[#EF4444] shadow-xs'
              : 'text-[#78716C] hover:text-[#1F2937]'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-[#EF4444]" />
          <span>{isAr ? 'سحب الأرباح' : t('wallet.tabs.withdraw')}</span>
        </button>
        <button
          onClick={() => setActiveTab('connect')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'connect'
              ? 'bg-white text-[#1F2937] shadow-xs'
              : 'text-[#78716C] hover:text-[#1F2937]'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>{isAr ? 'محفظة Web3' : t('wallet.tabs.connect')}</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-white text-[#1F2937] shadow-xs'
              : 'text-[#78716C] hover:text-[#1F2937]'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-[#78716C]" />
          <span>{isAr ? 'سجل المعاملات' : t('wallet.tabs.history')}</span>
        </button>
      </div>

      {/* Tab 1: DEPOSIT TAB (Egyptian Wallets & Crypto) */}
      {activeTab === 'deposit' && (
        <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3EFE6] pb-4">
            <div>
              <h2 className="text-lg font-black text-[#1F2937]">
                {isAr ? 'شحن رصيد الحساب' : t('wallet.depositCard.title')}
              </h2>
              <p className="text-xs text-[#78716C] mt-0.5">
                {isAr
                  ? 'اختر طريقة الدفع المناسبة، ثم حول المبلغ وأرفق صورة الإيصال ليتم إضافة الرصيد لحسابك فوراً'
                  : t('wallet.depositCard.desc')}
              </p>
            </div>

            {/* Category Toggle: Egyptian Wallets vs Crypto */}
            <div className="flex items-center gap-1 bg-[#F5F2EB] p-1 rounded-xl border border-[#E6E1D5]">
              <button
                type="button"
                onClick={() => setDepositCategory('EGYPTIAN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  depositCategory === 'EGYPTIAN'
                    ? 'bg-white text-[#10B981] shadow-2xs'
                    : 'text-[#78716C]'
                }`}
              >
                🇪🇬 {isAr ? 'المحافظ المصرية' : 'Egyptian Wallets'}
              </button>
              <button
                type="button"
                onClick={() => setDepositCategory('CRYPTO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  depositCategory === 'CRYPTO'
                    ? 'bg-white text-[#F59E0B] shadow-2xs'
                    : 'text-[#78716C]'
                }`}
              >
                🪙 {isAr ? 'كريبتو USDT' : 'Crypto USDT'}
              </button>
            </div>
          </div>

          {depositCategory === 'EGYPTIAN' ? (
            <form onSubmit={handleDepositSubmit} className="space-y-4 max-w-xl">
              {depositError && (
                <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-xs font-bold text-[#DC2626] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{depositError}</span>
                </div>
              )}

              {depositSuccessMsg && (
                <div className="p-3.5 bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl text-xs font-bold text-[#047857] flex items-center gap-2 animate-in fade-in">
                  <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0" />
                  <span>
                    {isAr
                      ? 'تم إرسال طلب الإيداع بنجاح! وهو قيد المراجعة السريعة وسيتم إضافة الرصيد لحسابك خلال دقائق.'
                      : 'Deposit request submitted successfully! Awaiting quick admin approval.'}
                  </span>
                </div>
              )}

              {/* 1. Payment Method Dropdown */}
              <div>
                <label className="text-xs font-bold text-[#78716C] block mb-1">
                  {isAr ? '1. طريقة التحويل:' : '1. Transfer Method:'}
                </label>
                <select
                  value={egyptianMethod}
                  onChange={(e) => setEgyptianMethod(e.target.value as EgyptianPaymentMethod)}
                  className="w-full px-3.5 py-2.5 bg-[#F5F2EB] border border-[#E6E1D5] rounded-xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#F59E0B] cursor-pointer"
                >
                  <option value="VODAFONE_CASH">🔴 فودافون كاش (Vodafone Cash)</option>
                  <option value="INSTAPAY">🟣 إنستا باي (InstaPay - تحويل بنكي / محفظة)</option>
                  <option value="ETISALAT_CASH">🟢 اتصالات كاش (Etisalat Cash)</option>
                  <option value="ORANGE_CASH">🟠 أورانج كاش (Orange Cash)</option>
                  <option value="FAWRY">🟡 فوري كود خدمة (Fawry Pay)</option>
                </select>
              </div>

              {/* 2. Company Wallet Number with Copy Button */}
              <div className="p-4 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#78716C] font-bold">
                  <span>{isAr ? 'رقم / حساب المحفظة للشركة:' : 'Company Wallet Account:'}</span>
                  <span className="font-mono text-[10px] text-[#047857] bg-[#10B981]/10 px-2 py-0.5 rounded">
                    {isAr ? 'معتمد' : 'Verified'}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-[#D9D2C5]">
                  <span className="font-mono text-base font-black text-[#1F2937] tracking-wider select-all">
                    {getCompanyNumber(egyptianMethod)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(getCompanyNumber(egyptianMethod), 'compWallet')}
                    className="px-3 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-black font-extrabold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    {copiedKey === 'compWallet' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'compWallet' ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}</span>
                  </button>
                </div>
              </div>

              {/* 3. Sender Phone / Account Number */}
              <div>
                <label className="text-xs font-bold text-[#78716C] block mb-1">
                  {isAr ? '2. رقم الهاتف / الحساب المحول منه (رقمك):' : '2. Sender Account / Phone:'}
                </label>
                <div className="relative">
                  <Smartphone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                  <input
                    type="text"
                    required
                    value={senderAccount}
                    onChange={(e) => setSenderAccount(e.target.value)}
                    placeholder={isAr ? 'مثال: 01012345678' : 'e.g. 01012345678'}
                    className="w-full ps-9 pe-3 py-2.5 bg-[#F5F2EB] border border-[#E6E1D5] rounded-xl font-mono text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
              </div>

              {/* 4. Transferred Amount in EGP */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#78716C] mb-1">
                  <span>{isAr ? '3. المبلغ المحول بالجنيه المصري (EGP):' : '3. Amount in EGP:'}</span>
                  <span className="font-mono text-[#047857]">{depositAmount} ج.م</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={10}
                    step={5}
                    required
                    value={depositAmount || ''}
                    onChange={(e) => setDepositAmount(Math.max(10, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2.5 bg-[#F5F2EB] border border-[#E6E1D5] rounded-xl font-mono text-sm font-bold text-[#1F2937] focus:outline-none focus:border-[#F59E0B]"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#78716C]">
                    ج.م EGP
                  </span>
                </div>
              </div>

              {/* 5. Upload Receipt Screenshot */}
              <div>
                <label className="text-xs font-bold text-[#78716C] block mb-1">
                  {isAr ? '4. صورة إيصال التحويل (Upload Receipt):' : '4. Receipt Screenshot:'}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleReceiptUpload}
                />

                {receiptImage ? (
                  <div className="p-2.5 bg-[#F5F2EB] rounded-2xl border border-[#10B981] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={receiptImage}
                        alt="Receipt"
                        className="w-12 h-12 object-cover rounded-xl border border-white shrink-0 shadow-2xs"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#047857] flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />
                          <span>{isAr ? 'تم إرفاق صورة الإيصال' : 'Receipt uploaded'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-white hover:bg-[#E6E1D5] text-[#1F2937] text-[11px] font-bold rounded-lg border border-[#D9D2C5] cursor-pointer"
                      >
                        {isAr ? 'تغيير' : 'Change'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReceiptImage(null)}
                        className="px-2 py-1 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#DC2626] text-[11px] font-bold rounded-lg cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 px-3 border-2 border-dashed border-[#D9D2C5] hover:border-[#F59E0B] bg-[#F5F2EB]/50 hover:bg-[#F5F2EB] rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5"
                  >
                    <Upload className="w-5 h-5 text-[#F59E0B]" />
                    <span className="text-xs font-bold text-[#1F2937]">
                      {isAr ? 'اضغط لرفع صورة إيصال التحويل (سكرين شوت)' : 'Click to upload receipt screenshot'}
                    </span>
                    <span className="text-[10px] text-[#78716C]">
                      PNG, JPG, WebP
                    </span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="w-full min-h-[48px] py-3 bg-[#10B981] hover:bg-[#059669] text-white font-black text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isAr ? `تأكيد إرسال طلب إيداع ${depositAmount} ج.م` : `Submit Deposit of ${depositAmount} EGP`}
              </button>
            </form>
          ) : (
            /* Crypto Deposit Mode */
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="text-xs font-bold text-[#78716C] block mb-2">
                  {t('wallet.depositCard.chooseNetwork')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDepositNetwork('TRC20')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      depositNetwork === 'TRC20'
                        ? 'bg-white border-[#F59E0B] text-[#D97706] ring-1 ring-[#F59E0B]/30 shadow-xs'
                        : 'bg-[#F5F2EB] border-[#E6E1D5] text-[#78716C]'
                    }`}
                  >
                    TRON (USDT-TRC20)
                  </button>
                  <button
                    onClick={() => setDepositNetwork('BEP20')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      depositNetwork === 'BEP20'
                        ? 'bg-white border-[#F59E0B] text-[#D97706] ring-1 ring-[#F59E0B]/30 shadow-xs'
                        : 'bg-[#F5F2EB] border-[#E6E1D5] text-[#78716C]'
                    }`}
                  >
                    BNB Chain (USDT-BEP20)
                  </button>
                </div>
              </div>

              <div className="p-4 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] space-y-3">
                <span className="text-xs font-bold text-[#78716C] block">
                  {depositNetwork} Deposit Address:
                </span>
                <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-xl border border-[#E6E1D5]">
                  <span className="font-mono text-xs font-bold text-[#1F2937] break-all">
                    {depositAddresses[depositNetwork]}
                  </span>
                  <button
                    onClick={() => handleCopy(depositAddresses[depositNetwork], 'cryptoDep')}
                    className="text-[#78716C] hover:text-[#1F2937] ps-3 shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'cryptoDep' ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onSimulateDeposit(100, depositNetwork)}
                  className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAr ? 'محاكاة إيداع فوري $100 USDT' : 'Simulate $100 Deposit'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: WITHDRAW TAB (Egyptian Wallets & Crypto) */}
      {activeTab === 'withdraw' && (
        <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3EFE6] pb-4">
            <div>
              <h2 className="text-lg font-black text-[#1F2937]">{isAr ? 'سحب الأرباح' : t('wallet.withdrawCard.title')}</h2>
              <p className="text-xs text-[#78716C] mt-0.5">
                {isAr ? 'اسحب أرباحك مباشرة إلى محفظتك الإلكترونية أو كاش أو كريبتو' : t('wallet.withdrawCard.desc')}
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#F5F2EB] p-1 rounded-xl border border-[#E6E1D5]">
              <button
                type="button"
                onClick={() => setWithdrawCategory('EGYPTIAN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  withdrawCategory === 'EGYPTIAN'
                    ? 'bg-white text-[#EF4444] shadow-2xs'
                    : 'text-[#78716C]'
                }`}
              >
                🇪🇬 {isAr ? 'محفظة مصرية' : 'Egyptian Wallet'}
              </button>
              <button
                type="button"
                onClick={() => setWithdrawCategory('CRYPTO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  withdrawCategory === 'CRYPTO'
                    ? 'bg-white text-[#F59E0B] shadow-2xs'
                    : 'text-[#78716C]'
                }`}
              >
                🪙 {isAr ? 'كريبتو USDT' : 'Crypto USDT'}
              </button>
            </div>
          </div>

          <form onSubmit={handleWithdrawSubmit} className="space-y-4 max-w-xl">
            {withdrawError && (
              <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-xs text-[#EF4444] font-medium">
                {withdrawError}
              </div>
            )}

            {withdrawSubmitted && (
              <div className="p-3.5 bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl text-xs text-[#047857] font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0" />
                <span>
                  {isAr
                    ? 'تم إرسال طلب السحب بنجاح! وهو قيد المراجعة لدى الإدارة وسيتم التحويل خلال دقائق.'
                    : 'Withdrawal request submitted! Status is PENDING and awaiting admin approval.'}
                </span>
              </div>
            )}

            {withdrawCategory === 'EGYPTIAN' ? (
              <div>
                <label className="text-xs font-bold text-[#78716C] block mb-1">
                  {isAr ? 'طريقة الاستلام:' : 'Withdrawal Method:'}
                </label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value as EgyptianPaymentMethod)}
                  className="w-full px-3.5 py-2.5 bg-[#F5F2EB] border border-[#E6E1D5] rounded-xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#EF4444] cursor-pointer"
                >
                  <option value="VODAFONE_CASH">🔴 فودافون كاش (Vodafone Cash)</option>
                  <option value="INSTAPAY">🟣 إنستا باي (InstaPay)</option>
                  <option value="ETISALAT_CASH">🟢 اتصالات كاش (Etisalat Cash)</option>
                  <option value="ORANGE_CASH">🟠 أورانج كاش (Orange Cash)</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-[#78716C] block mb-1">
                  Crypto Network
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawNetwork('TRC20')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      withdrawNetwork === 'TRC20'
                        ? 'bg-white border-[#EF4444] text-[#DC2626] ring-1 ring-[#EF4444]/30 shadow-xs'
                        : 'bg-[#F5F2EB] border-[#E6E1D5] text-[#78716C]'
                    }`}
                  >
                    USDT (TRC20)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawNetwork('BEP20')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      withdrawNetwork === 'BEP20'
                        ? 'bg-white border-[#EF4444] text-[#DC2626] ring-1 ring-[#EF4444]/30 shadow-xs'
                        : 'bg-[#F5F2EB] border-[#E6E1D5] text-[#78716C]'
                    }`}
                  >
                    USDT (BEP20)
                  </button>
                </div>
              </div>
            )}

            {/* Destination Address / Phone */}
            <div>
              <label className="text-xs font-bold text-[#78716C] block mb-1">
                {withdrawCategory === 'EGYPTIAN'
                  ? (isAr ? 'رقم الهاتف / الحساب المراد استلام الأرباح عليه:' : 'Recipient Phone Number / Account:')
                  : (isAr ? 'عنوان المحفظة USDT المستلمة:' : 'Destination USDT Address:')}
              </label>
              <input
                type="text"
                required
                value={withdrawDestination}
                onChange={(e) => setWithdrawDestination(e.target.value)}
                placeholder={withdrawCategory === 'EGYPTIAN' ? '010XXXXXXXX' : '0x... or T...'}
                className="w-full px-3 py-2.5 bg-[#F5F2EB] border border-[#E6E1D5] rounded-xl font-mono text-xs text-[#1F2937] focus:outline-none focus:border-[#EF4444]"
              />
            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-[#78716C] mb-1">
                <span>{isAr ? `مبلغ السحب (${currencySymbol}):` : t('wallet.withdrawCard.withdrawAmount')}</span>
                <span>
                  {isAr ? 'المتاح:' : 'Available:'}{' '}
                  <strong className="font-mono text-[#047857]">
                    {user.balance.toFixed(2)} {currencySymbol}
                  </strong>
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={50}
                  step={10}
                  required
                  value={withdrawAmount || ''}
                  onChange={(e) => setWithdrawAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2.5 bg-[#F5F2EB] border border-[#E6E1D5] rounded-xl font-mono text-sm font-bold text-[#1F2937] focus:outline-none focus:border-[#EF4444]"
                />
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(Math.floor(user.balance))}
                  className="absolute inset-y-1 end-1 px-3 bg-white hover:bg-[#E6E1D5] rounded-lg text-xs font-bold text-[#78716C] transition-colors cursor-pointer"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Fee summary */}
            <div className="p-3 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[#78716C]">
                <span>{isAr ? 'رسوم معالجة السحب' : t('wallet.withdrawCard.feeNotice')} ({withdrawalFeeRate}%):</span>
                <span className="font-mono font-bold text-[#DC2626]">-{fee.toFixed(2)} {currencySymbol}</span>
              </div>
              <div className="flex items-center justify-between font-bold text-[#1F2937] pt-1 border-t border-[#E6E1D5]">
                <span>{isAr ? 'الصافي للمستلم:' : t('wallet.withdrawCard.receiveAmount')}:</span>
                <span className="font-mono font-black text-sm text-[#047857]">
                  {netWithdraw.toFixed(2)} {currencySymbol}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isAr ? `تأكيد إرسال طلب سحب ${withdrawAmount} ${currencySymbol}` : t('wallet.withdrawCard.submitRequest')}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: WEB3 CONNECT TAB */}
      {activeTab === 'connect' && (
        <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F3EFE6] pb-4">
            <div>
              <h2 className="text-lg font-black text-[#1F2937]">{t('wallet.connectCard.title')}</h2>
              <p className="text-xs text-[#78716C] mt-0.5">{t('wallet.connectCard.desc')}</p>
            </div>
            {walletState.isConnected ? (
              <button
                onClick={onDisconnectWallet}
                className="px-4 py-2 rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-xs font-bold text-[#DC2626] transition-colors cursor-pointer"
              >
                {t('common.disconnectWallet')}
              </button>
            ) : (
              <button
                onClick={onOpenConnectWallet}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <Wallet className="w-4 h-4 fill-white/20" />
                <span>{t('common.connectWallet')}</span>
              </button>
            )}
          </div>

          {walletState.isConnected ? (
            <div className="p-4 bg-[#10B981]/10 rounded-2xl border border-[#10B981]/30">
              <div className="flex items-center gap-2 text-[#047857] font-bold text-sm mb-1">
                <CheckCircle className="w-4 h-4 text-[#10B981]" />
                <span>{t('wallet.connectCard.statusConnected')}</span>
              </div>
              <div className="font-mono text-xs font-bold text-[#047857] mt-2">
                Address: {walletState.address} · Balance: ${walletState.balanceUSDT.toFixed(2)} USDT
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#F5F2EB]/60 rounded-2xl border border-dashed border-[#D9D2C5]">
              <Wallet className="w-12 h-12 text-[#F59E0B] mx-auto mb-3" />
              <button
                onClick={onOpenConnectWallet}
                className="px-6 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {t('common.connectWallet')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: TRANSACTIONS HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-black text-[#1F2937]">{isAr ? 'سجل العمليات المالية' : t('wallet.tabs.history')}</h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              {isAr ? 'سجل تفصيلي لجميع طلبات الإيداع والسحب وحالتها' : 'Ledger of all deposits and withdrawals.'}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#78716C] uppercase">
              {isAr ? 'طلبات الإيداع (Deposits)' : 'Deposit Ledger'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead>
                  <tr className="border-b border-[#E6E1D5] text-[#78716C]">
                    <th className="py-2 text-start font-bold">{isAr ? 'المعرف' : 'ID'}</th>
                    <th className="py-2 text-start font-bold">{isAr ? 'الطريقة' : 'Method'}</th>
                    <th className="py-2 text-start font-bold">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="py-2 text-center font-bold">{isAr ? 'الإيصال' : 'Receipt'}</th>
                    <th className="py-2 text-end font-bold">{isAr ? 'المبلغ' : 'Amount'}</th>
                    <th className="py-2 text-end font-bold">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EFE6]">
                  {deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-[#F5F2EB]/50">
                      <td className="py-2.5 font-mono font-bold text-[#1F2937]">#{d.id.slice(-6)}</td>
                      <td className="py-2.5 font-bold">
                        {d.method ? d.method.replace('_', ' ') : d.network || 'CRYPTO'}
                      </td>
                      <td className="py-2.5 text-[#78716C]">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 text-center">
                        {d.receiptImage ? (
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(d.receiptImage!)}
                            className="p-1 rounded bg-[#F5F2EB] hover:bg-[#E6E1D5] text-[#F59E0B] inline-flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{isAr ? 'عرض' : 'View'}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#A8A29E]">-</span>
                        )}
                      </td>
                      <td className="py-2.5 text-end font-mono font-bold text-[#047857]">
                        +{d.amount.toFixed(2)} {d.currency || currencySymbol}
                      </td>
                      <td className="py-2.5 text-end">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.status === 'CONFIRMED'
                              ? 'bg-[#10B981]/10 text-[#047857]'
                              : d.status === 'PENDING'
                              ? 'bg-[#F59E0B]/10 text-[#D97706]'
                              : 'bg-[#EF4444]/10 text-[#DC2626]'
                          }`}
                        >
                          {d.status === 'CONFIRMED' ? (isAr ? 'معتمد' : 'Confirmed') : d.status === 'PENDING' ? (isAr ? 'قيد المراجعة' : 'Pending') : (isAr ? 'مرفوض' : 'Rejected')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-xs font-bold text-[#78716C] uppercase pt-4">
              {isAr ? 'طلبات السحب (Withdrawals)' : 'Withdrawal Requests'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead>
                  <tr className="border-b border-[#E6E1D5] text-[#78716C]">
                    <th className="py-2 text-start font-bold">{isAr ? 'المعرف' : 'ID'}</th>
                    <th className="py-2 text-start font-bold">{isAr ? 'الطريقة / الحساب' : 'Account'}</th>
                    <th className="py-2 text-end font-bold">{isAr ? 'المبلغ' : 'Amount'}</th>
                    <th className="py-2 text-end font-bold">{isAr ? 'الرسوم' : 'Fee'}</th>
                    <th className="py-2 text-end font-bold">{isAr ? 'الصافي' : 'Net'}</th>
                    <th className="py-2 text-end font-bold">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EFE6]">
                  {withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-[#A8A29E]">
                        {isAr ? 'لا توجد طلبات سحب مسجلة' : 'No withdrawal requests found'}
                      </td>
                    </tr>
                  ) : (
                    withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-[#F5F2EB]/50">
                        <td className="py-2.5 font-mono font-bold text-[#1F2937]">#{w.id.slice(-6)}</td>
                        <td className="py-2.5 font-mono text-[#78716C] truncate max-w-[140px]">
                          {w.userAccount || w.userAddress}
                        </td>
                        <td className="py-2.5 text-end font-mono">{w.amount.toFixed(2)}</td>
                        <td className="py-2.5 text-end font-mono text-[#DC2626]">-{w.fee.toFixed(2)}</td>
                        <td className="py-2.5 text-end font-mono font-bold text-[#047857]">
                          {w.netAmount.toFixed(2)} {w.currency || currencySymbol}
                        </td>
                        <td className="py-2.5 text-end">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              w.status === 'APPROVED'
                                ? 'bg-[#10B981]/10 text-[#047857]'
                                : w.status === 'PENDING'
                                ? 'bg-[#F59E0B]/10 text-[#D97706]'
                                : 'bg-[#EF4444]/10 text-[#DC2626]'
                            }`}
                          >
                            {w.status === 'APPROVED' ? (isAr ? 'مقبول' : 'Approved') : w.status === 'PENDING' ? (isAr ? 'قيد المراجعة' : 'Pending') : (isAr ? 'مرفوض' : 'Rejected')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Dialog */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative max-w-lg w-full bg-white rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E1D5]">
              <span className="font-bold text-xs text-[#1F2937]">
                {isAr ? 'صورة إيصال التحويل' : 'Receipt Screenshot'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="w-7 h-7 rounded-full bg-[#F5F2EB] flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto flex items-center justify-center">
              <img src={selectedReceipt} alt="Receipt preview" className="max-h-[55vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
