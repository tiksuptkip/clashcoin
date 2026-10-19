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
  Building,
} from 'lucide-react';

interface WalletPageProps {
  user: UserProfile | null;
  walletState: ConnectedWalletState;
  deposits: DepositRecord[];
  withdrawals: WithdrawalRequest[];
  withdrawalFeeRate: number;
  onOpenConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onRequestWithdrawal: (amount: number, network: 'TRC20' | 'BEP20', address: string) => void;
  onSimulateDeposit: (amount: number, network: 'TRC20' | 'BEP20') => void;
  onUpdateUser?: (u: UserProfile) => void;
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
  onUpdateUser,
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // Country state: Jordan vs Egypt
  const [activeCountry, setActiveCountry] = useState<'JO' | 'EG'>(() => {
    if (user?.country === 'JO' || user?.currency === 'JOD') return 'JO';
    return 'EG';
  });

  const isJordan = activeCountry === 'JO';
  const currencySymbol = isJordan ? 'د.أ' : 'ج.م';

  const [activeTab, setActiveTab] = useState<'connect' | 'deposit' | 'withdraw' | 'history'>('deposit');

  // Deposit Mode (Local Country Wallets vs Crypto)
  const [depositCategory, setDepositCategory] = useState<'LOCAL' | 'CRYPTO'>('LOCAL');
  const [localMethod, setLocalMethod] = useState<EgyptianPaymentMethod>(() =>
    isJordan ? 'JORDAN_CLIQ' : 'VODAFONE_CASH'
  );
  const [senderAccount, setSenderAccount] = useState('');
  const [depositAmount, setDepositAmount] = useState<number>(() => (isJordan ? 10 : 100));
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [depositSuccessMsg, setDepositSuccessMsg] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [depositNetwork, setDepositNetwork] = useState<'TRC20' | 'BEP20'>('TRC20');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Withdrawal state
  const [withdrawMethod, setWithdrawMethod] = useState<EgyptianPaymentMethod>(() =>
    isJordan ? 'JORDAN_CLIQ' : 'VODAFONE_CASH'
  );
  const [withdrawCategory, setWithdrawCategory] = useState<'LOCAL' | 'CRYPTO'>('LOCAL');
  const [withdrawDestination, setWithdrawDestination] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(() => (isJordan ? 10 : 100));
  const [withdrawNetwork, setWithdrawNetwork] = useState<'TRC20' | 'BEP20'>('TRC20');
  const [withdrawSubmitted, setWithdrawSubmitted] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  // Selected receipt modal
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  const settings = storage.getSettings();

  const handleCountrySwitch = (country: 'JO' | 'EG') => {
    setActiveCountry(country);
    if (country === 'JO') {
      setLocalMethod('JORDAN_CLIQ');
      setWithdrawMethod('JORDAN_CLIQ');
      setDepositAmount(10);
      setWithdrawAmount(10);
    } else {
      setLocalMethod('VODAFONE_CASH');
      setWithdrawMethod('VODAFONE_CASH');
      setDepositAmount(100);
      setWithdrawAmount(100);
    }
    setDepositError('');
    setWithdrawError('');
    const updated = storage.updateUser({
      country,
      currency: country === 'JO' ? 'JOD' : 'EGP',
    });
    if (updated && onUpdateUser) {
      onUpdateUser(updated);
    }
  };

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
    const minDep = isJordan ? 1 : 10;
    if (!depositAmount || depositAmount < minDep) {
      setDepositError(
        isAr
          ? `الحد الأدنى للإيداع هو ${minDep} ${currencySymbol}`
          : `Minimum deposit is ${minDep} ${currencySymbol}`
      );
      return;
    }
    if (!receiptImage) {
      setDepositError(isAr ? 'يرجى رفع صورة إيصال التحويل لتأكيد الإيداع' : 'Please upload transfer receipt screenshot');
      return;
    }

    setDepositError('');
    storage.addDeposit(depositAmount, localMethod, {
      senderAccount: senderAccount.trim(),
      companyAccount: getCompanyNumber(localMethod),
      receiptImage,
      currency: isJordan ? 'JOD' : 'EGP',
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
    const minWith = isJordan ? 5 : 50;
    if (withdrawAmount < minWith) {
      setWithdrawError(
        isAr
          ? `الحد الأدنى للسحب هو ${minWith} ${currencySymbol}`
          : `Minimum withdrawal is ${minWith} ${currencySymbol}`
      );
      return;
    }
    if (withdrawAmount > (user?.balance ?? 0)) {
      setWithdrawError(isAr ? 'مبلغ السحب يتجاوز رصيد حسابك المتاح' : 'Amount exceeds available balance');
      return;
    }

    setWithdrawError('');
    storage.requestWithdrawal(withdrawAmount, withdrawCategory === 'CRYPTO' ? 'CRYPTO' : withdrawMethod, {
      userAccount: withdrawDestination.trim(),
      network: withdrawCategory === 'CRYPTO' ? withdrawNetwork : undefined,
      currency: isJordan ? 'JOD' : 'EGP',
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
      {/* Header title & Country Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-start">
          <h1 className="text-2xl font-black text-[#1F2937]">
            {isAr ? 'المحفظة وإدارة الأموال' : t('wallet.title')}
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            {isJordan
              ? 'شحن وسحب فوري عبر المحافظ الأردنية (كليك CliQ، زين كاش، أورانج، UWallet، بنك الاتحاد) أو الكريبتو'
              : 'شحن وسحب فوري عبر المحافظ المصرية (فودافون كاش، إنستا باي، اتصالات، أورانج، فوري) أو الكريبتو'}
          </p>
        </div>

        {/* Dynamic Country Toggle (Jordan vs Egypt) */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5]">
          <button
            type="button"
            onClick={() => handleCountrySwitch('JO')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isJordan
                ? 'bg-[#0284C7] text-white shadow-xs'
                : 'text-[#4B5563] hover:text-[#1F2937]'
            }`}
          >
            <span>🇯🇴</span>
            <span>الأردن (د.أ)</span>
          </button>
          <button
            type="button"
            onClick={() => handleCountrySwitch('EG')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !isJordan
                ? 'bg-[#DC2626] text-white shadow-xs'
                : 'text-[#4B5563] hover:text-[#1F2937]'
            }`}
          >
            <span>🇪🇬</span>
            <span>مصر (ج.م)</span>
          </button>
        </div>
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
            {(user?.balance ?? 0).toFixed(2)}{' '}
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
            +{((user?.totalWonAmount ?? 0) - (user?.totalLostAmount ?? 0)).toFixed(2)}{' '}
            <span className="text-xs font-bold text-[#78716C]">{currencySymbol}</span>
          </div>
          <div className="text-[11px] text-[#78716C] mt-1">
            {user?.totalBetsPlaced ?? 0} {isAr ? 'رهانات مسجلة' : 'rounds entered'}
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

      {/* Tab 1: DEPOSIT TAB */}
      {activeTab === 'deposit' && (
        <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3EFE6] pb-4">
            <div>
              <h2 className="text-lg font-black text-[#1F2937]">
                {isAr ? 'شحن رصيد الحساب' : t('wallet.depositCard.title')}
              </h2>
              <p className="text-xs text-[#78716C] mt-0.5">
                {isJordan
                  ? 'شحن مباشر عبر كليك والأجهزة الأردنية أو كريبتو USDT'
                  : 'شحن مباشر عبر فودافون كاش وإنستا باي أو كريبتو USDT'}
              </p>
            </div>

            {/* Category Toggle: Local Country Wallets vs Crypto */}
            <div className="flex items-center gap-1 bg-[#F5F2EB] p-1 rounded-xl border border-[#E6E1D5]">
              <button
                type="button"
                onClick={() => setDepositCategory('LOCAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  depositCategory === 'LOCAL'
                    ? 'bg-white text-[#10B981] shadow-2xs'
                    : 'text-[#78716C]'
                }`}
              >
                {isJordan ? '🇯🇴 المحافظ الأردنية' : '🇪🇬 المحافظ المصرية'}
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

          {depositCategory === 'LOCAL' ? (
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
                      ? 'تم إرسال طلب الإيداع بنجاح! وهو قيد المراجعة وسيتم إضافة الرصيد لحسابك خلال دقائق.'
                      : 'Deposit request submitted successfully! Awaiting quick admin approval.'}
                  </span>
                </div>
              )}

              {/* 1. Payment Method Dropdown (Jordan vs Egypt) */}
              <div>
                <label className="text-xs font-bold text-[#78716C] block mb-1">
                  {isAr ? '1. طريقة التحويل:' : '1. Transfer Method:'}
                </label>
                {isJordan ? (
                  <select
                    value={localMethod}
                    onChange={(e) => setLocalMethod(e.target.value as EgyptianPaymentMethod)}
                    className="w-full px-3.5 py-2.5 bg-[#F5F2EB] border border-[#E6E1D5] rounded-xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#F59E0B] cursor-pointer"
                  >
                    <option value="JORDAN_CLIQ">🔵 كليك الأردن (CliQ Alias - فوري لجميع البنوك)</option>
                    <option value="JORDAN_ZAIN_CASH">🟢 زين كاش الأردن (Zain Cash JO)</option>
                    <option value="JORDAN_ORANGE_MONEY">🟠 أورانج موني الأردن (Orange Money JO)</option>
                    <option value="JORDAN_UWALLET">🟣 يوو wallet الأردن (UWallet JO)</option>
                    <option value="JORDAN_BANK">🏛️ تحويل بنكي أردني (بنك الاتحاد IBAN)</option>
                  </select>
                ) : (
                  <select
                    value={localMethod}
                    onChange={(e) => setLocalMethod(e.target.value as EgyptianPaymentMethod)}
                    className="w-full px-3.5 py-2.5 bg-[#F5F2EB] border border-[#E6E1D5] rounded-xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#F59E0B] cursor-pointer"
                  >
                    <option value="VODAFONE_CASH">🔴 فودافون كاش (Vodafone Cash)</option>
                    <option value="INSTAPAY">🟣 إنستا باي (InstaPay - تحويل بنكي / محفظة)</option>
                    <option value="ETISALAT_CASH">🟢 اتصالات كاش (Etisalat Cash)</option>
                    <option value="ORANGE_CASH">🟠 أورانج كاش (Orange Cash)</option>
                    <option value="FAWRY">🟡 فوري كود خدمة (Fawry Pay)</option>
                  </select>
                )}
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
                  <span className="font-mono text-sm sm:text-base font-black text-[#1F2937] tracking-wider select-all break-all">
                    {getCompanyNumber(localMethod)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(getCompanyNumber(localMethod), 'compWallet')}
                    className="px-3 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-black font-extrabold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs shrink-0 ms-2"
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
                    placeholder={isJordan ? 'مثال: 0791234567 أو اسمك على كليك' : 'مثال: 01012345678'}
                    className="w-full ps-9 pe-3 py-2.5 bg-[#F5F2EB] border border-[#E6E1D5] rounded-xl font-mono text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
              </div>

              {/* 4. Transferred Amount */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#78716C] mb-1">
                  <span>{isAr ? `3. المبلغ المحول (${currencySymbol}):` : `3. Amount in ${currencySymbol}:`}</span>
                  <span className="font-mono text-[#047857]">{depositAmount} {currencySymbol}</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={isJordan ? 1 : 10}
                    step={isJordan ? 1 : 5}
                    required
                    value={depositAmount || ''}
                    onChange={(e) => setDepositAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2.5 bg-[#F5F2EB] border border-[#E6E1D5] rounded-xl font-mono text-sm font-bold text-[#1F2937] focus:outline-none focus:border-[#F59E0B]"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#78716C]">
                    {currencySymbol}
                  </span>
                </div>
              </div>

              {/* 5. Upload Receipt Screenshot */}
              <div>
                <label className="text-xs font-bold text-[#78716C] block mb-1">
                  {isAr ? '4. صورة إيصال التحويل (لقطة شاشة):' : '4. Transfer Receipt Screenshot:'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 border-2 border-dashed border-[#D9D2C5] hover:border-[#F59E0B] rounded-2xl bg-[#F5F2EB] hover:bg-white text-xs font-bold text-[#1F2937] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-[#F59E0B]" />
                  <span>
                    {receiptImage
                      ? (isAr ? '✓ تم إرفاق الصورة (انقر للتغيير)' : '✓ Screenshot uploaded (click to change)')
                      : (isAr ? 'انقر لرفع صورة الإيصال' : 'Click to upload receipt')}
                  </span>
                </button>

                {receiptImage && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={receiptImage}
                      alt="Receipt Preview"
                      className="w-20 h-20 object-cover rounded-xl border border-[#D9D2C5]"
                    />
                    <button
                      type="button"
                      onClick={() => setReceiptImage(null)}
                      className="absolute -top-2 -end-2 w-5 h-5 bg-[#EF4444] text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isAr ? 'تأكيد وإرسال طلب الإيداع' : 'Submit Deposit Request'}
              </button>
            </form>
          ) : (
            /* Crypto Deposit USDT */
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="text-xs font-bold text-[#78716C] block mb-1">
                  {t('wallet.depositCard.networkLabel')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDepositNetwork('TRC20')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      depositNetwork === 'TRC20'
                        ? 'bg-white border-[#10B981] text-[#047857] ring-1 ring-[#10B981]/30 shadow-xs'
                        : 'bg-[#F5F2EB] border-[#E6E1D5] text-[#78716C]'
                    }`}
                  >
                    TRC20 (Tron)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositNetwork('BEP20')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      depositNetwork === 'BEP20'
                        ? 'bg-white border-[#10B981] text-[#047857] ring-1 ring-[#10B981]/30 shadow-xs'
                        : 'bg-[#F5F2EB] border-[#E6E1D5] text-[#78716C]'
                    }`}
                  >
                    BEP20 (BNB Chain)
                  </button>
                </div>
              </div>

              <div className="p-4 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] space-y-3">
                <span className="text-xs text-[#78716C] font-semibold block">
                  {depositNetwork} Deposit Address:
                </span>
                <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-xl border border-[#E6E1D5]">
                  <span className="font-mono text-xs font-bold text-[#1F2937] break-all">
                    {depositAddresses[depositNetwork]}
                  </span>
                  <button
                    type="button"
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

      {/* Tab 2: WITHDRAW TAB */}
      {activeTab === 'withdraw' && (
        <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3EFE6] pb-4">
            <div>
              <h2 className="text-lg font-black text-[#1F2937]">{isAr ? 'سحب الأرباح' : t('wallet.withdrawCard.title')}</h2>
              <p className="text-xs text-[#78716C] mt-0.5">
                {isJordan
                  ? 'اسحب أرباحك مباشرة إلى حساب كليك أو محفظتك الأردنية أو كريبتو USDT'
                  : 'اسحب أرباحك مباشرة إلى فودافون كاش أو إنستا باي أو كريبتو USDT'}
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#F5F2EB] p-1 rounded-xl border border-[#E6E1D5]">
              <button
                type="button"
                onClick={() => setWithdrawCategory('LOCAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  withdrawCategory === 'LOCAL'
                    ? 'bg-white text-[#EF4444] shadow-2xs'
                    : 'text-[#78716C]'
                }`}
              >
                {isJordan ? '🇯🇴 المحافظ الأردنية' : '🇪🇬 المحافظ المصرية'}
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

            {withdrawCategory === 'LOCAL' ? (
              <div>
                <label className="text-xs font-bold text-[#78716C] block mb-1">
                  {isAr ? 'طريقة الاستلام:' : 'Withdrawal Method:'}
                </label>
                {isJordan ? (
                  <select
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value as EgyptianPaymentMethod)}
                    className="w-full px-3.5 py-2.5 bg-[#F5F2EB] border border-[#E6E1D5] rounded-xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#EF4444] cursor-pointer"
                  >
                    <option value="JORDAN_CLIQ">🔵 كليك الأردن (CliQ Alias)</option>
                    <option value="JORDAN_ZAIN_CASH">🟢 زين كاش الأردن (Zain Cash JO)</option>
                    <option value="JORDAN_ORANGE_MONEY">🟠 أورانج موني الأردن (Orange Money JO)</option>
                    <option value="JORDAN_UWALLET">🟣 يوو wallet الأردن (UWallet JO)</option>
                    <option value="JORDAN_BANK">🏛️ تحويل بنكي أردني (IBAN)</option>
                  </select>
                ) : (
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
                )}
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
                {withdrawCategory === 'LOCAL'
                  ? (isJordan
                      ? 'الاسم المستعار في كليك أو رقم المحفظة / رقم الآيبان المستلم:'
                      : 'رقم الهاتف / الحساب المراد استلام الأرباح عليه:')
                  : 'عنوان المحفظة USDT المستلمة:'}
              </label>
              <input
                type="text"
                required
                value={withdrawDestination}
                onChange={(e) => setWithdrawDestination(e.target.value)}
                placeholder={withdrawCategory === 'LOCAL' ? (isJordan ? 'مثال: ALI_CLIQ أو 0791234567' : '010XXXXXXXX') : '0x... or T...'}
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
                    {(user?.balance ?? 0).toFixed(2)} {currencySymbol}
                  </strong>
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={isJordan ? 5 : 50}
                  step={isJordan ? 5 : 10}
                  required
                  value={withdrawAmount || ''}
                  onChange={(e) => setWithdrawAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2.5 bg-[#F5F2EB] border border-[#E6E1D5] rounded-xl font-mono text-sm font-bold text-[#1F2937] focus:outline-none focus:border-[#EF4444]"
                />
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(Math.floor(user?.balance ?? 0))}
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
