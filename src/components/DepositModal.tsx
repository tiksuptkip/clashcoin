import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Copy,
  Check,
  Upload,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { AdminSettings, EgyptianPaymentMethod, UserProfile } from '../types';
import { storage } from '../services/storage';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  settings: AdminSettings;
  onDepositSuccess: () => void;
  onShowNotification: (type: 'success' | 'error' | 'win', msg: string) => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  user,
  settings,
  onDepositSuccess,
  onShowNotification,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [activeCountry, setActiveCountry] = useState<'JO' | 'EG'>(() => {
    if (user?.country === 'JO' || user?.currency === 'JOD') return 'JO';
    return 'EG';
  });

  const isJordan = activeCountry === 'JO';
  const currencySymbol = isJordan ? 'د.أ' : 'ج.م';

  const [method, setMethod] = useState<EgyptianPaymentMethod>(() =>
    isJordan ? 'JORDAN_CLIQ' : 'VODAFONE_CASH'
  );
  const [senderAccount, setSenderAccount] = useState('');
  const [amount, setAmount] = useState<number>(() => (isJordan ? 10 : 100));
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Country switch handler
  const handleCountrySwitch = (country: 'JO' | 'EG') => {
    setActiveCountry(country);
    if (country === 'JO') {
      setMethod('JORDAN_CLIQ');
      setAmount(10);
    } else {
      setMethod('VODAFONE_CASH');
      setAmount(100);
    }
    setErrorMessage('');
    storage.updateUser({
      country,
      currency: country === 'JO' ? 'JOD' : 'EGP',
    });
  };

  // Quick chips
  const quickChips = isJordan ? [5, 10, 20, 50, 100, 200] : [50, 100, 250, 500, 1000, 5000];

  const getMethodDetails = (m: EgyptianPaymentMethod) => {
    switch (m) {
      // Jordanian Wallets
      case 'JORDAN_CLIQ':
        return {
          title: isAr ? 'كليك الأردن (CliQ Alias)' : 'Jordan CliQ',
          subtitle: isAr ? 'تحويل بنكي ومحافظ فوري عبر الاسم المستعار كليك' : 'Instant CliQ Transfer (Jordan)',
          number: settings.jordanCliqAlias || 'CLASHOFCOIN',
          badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
          numberLabel: isAr ? 'الاسم المستعار / كود كليك للشركة (CliQ Alias):' : 'Company CliQ Alias:',
          senderPlaceholder: 'اسمك المستعار أو رقم حسابك البنكي',
        };
      case 'JORDAN_ZAIN_CASH':
        return {
          title: isAr ? 'زين كاش الأردن (Zain Cash JO)' : 'Zain Cash Jordan',
          subtitle: isAr ? 'تحويل محفظة زين كاش الأردنية فوري' : 'Instant Zain Cash Wallet (Jordan)',
          number: settings.jordanZainCashNumber || '0791234567',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
          numberLabel: isAr ? 'رقم محفظة زين كاش الأردنية للشركة:' : 'Company Zain Cash Number:',
          senderPlaceholder: 'مثال: 0791234567',
        };
      case 'JORDAN_ORANGE_MONEY':
        return {
          title: isAr ? 'أورانج موني الأردن (Orange Money JO)' : 'Orange Money Jordan',
          subtitle: isAr ? 'تحويل محفظة أورانج موني الأردنية' : 'Instant Orange Money Wallet (Jordan)',
          number: settings.jordanOrangeMoneyNumber || '0771234567',
          badgeColor: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
          numberLabel: isAr ? 'رقم محفظة أورانج موني الأردنية للشركة:' : 'Company Orange Money Number:',
          senderPlaceholder: 'مثال: 0771234567',
        };
      case 'JORDAN_UWALLET':
        return {
          title: isAr ? 'يو والت أمنية (UWallet Jordan)' : 'UWallet Jordan',
          subtitle: isAr ? 'تحويل محفظة يو والت أمنية الأردنية' : 'Instant UWallet (Jordan)',
          number: settings.jordanUwalletNumber || '0781234567',
          badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
          numberLabel: isAr ? 'رقم محفظة يو والت للشركة:' : 'Company UWallet Number:',
          senderPlaceholder: 'مثال: 0781234567',
        };
      case 'JORDAN_BANK':
        return {
          title: isAr ? 'حوالة بنكية أردنية (Jordan Bank)' : 'Jordan Bank Transfer',
          subtitle: isAr ? 'إيداع بنكي مباشر داخل الأردن' : 'Direct Jordan Bank Transfer',
          number: settings.jordanBankDetails || 'بنك الاتحاد - الاسم: كلاش أوف كوين - IBAN: JO89UBSI000000012345678901234',
          badgeColor: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20',
          numberLabel: isAr ? 'بيانات الحساب البنكي الأردني للشركة:' : 'Company Bank Account Details:',
          senderPlaceholder: 'اسم المحول ورقم الحساب/الآيبان',
        };

      // Egyptian Wallets
      case 'VODAFONE_CASH':
        return {
          title: isAr ? 'فودافون كاش (Vodafone Cash)' : 'Vodafone Cash',
          subtitle: isAr ? 'تحويل فودافون كاش محلي فوري' : 'Instant Vodafone Cash Wallet',
          number: settings.vodafoneCashNumber || '01098451230',
          badgeColor: 'bg-red-500/10 text-red-600 border-red-500/20',
          numberLabel: isAr ? 'رقم محفظة فودافون كاش للشركة:' : 'Company Vodafone Cash Number:',
          senderPlaceholder: 'مثال: 01012345678',
        };
      case 'INSTAPAY':
        return {
          title: isAr ? 'إنستا باي (InstaPay)' : 'InstaPay',
          subtitle: isAr ? 'تحويل بنكي / محفظة فوري عبر تطبيق إنستاباي' : 'Instant Bank Transfer via InstaPay',
          number: settings.instaPayHandle || 'clashofcoin@instapay',
          badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
          numberLabel: isAr ? 'عنوان إنستا باي الخاص بالشركة (IPA / Number):' : 'Company InstaPay Address / Phone:',
          senderPlaceholder: 'عنوانك أو رقم الهاتف المسجل بإنستاباي',
        };
      case 'ETISALAT_CASH':
        return {
          title: isAr ? 'اتصالات كاش (Etisalat Cash)' : 'Etisalat Cash',
          subtitle: isAr ? 'تحويل اتصالات كاش فوري' : 'Instant Etisalat Cash Wallet',
          number: settings.etisalatCashNumber || '01123456789',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
          numberLabel: isAr ? 'رقم محفظة اتصالات كاش للشركة:' : 'Company Etisalat Cash Number:',
          senderPlaceholder: 'مثال: 01112345678',
        };
      case 'ORANGE_CASH':
        return {
          title: isAr ? 'أورانج كاش (Orange Cash)' : 'Orange Cash',
          subtitle: isAr ? 'تحويل أورانج كاش فوري' : 'Instant Orange Cash Wallet',
          number: settings.orangeCashNumber || '01234567890',
          badgeColor: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
          numberLabel: isAr ? 'رقم محفظة أورانج كاش للشركة:' : 'Company Orange Cash Number:',
          senderPlaceholder: 'مثال: 01212345678',
        };
      case 'FAWRY':
        return {
          title: isAr ? 'فوري (Fawry)' : 'Fawry Pay',
          subtitle: isAr ? 'دفع عبر كود خدمة فوري بأي منفذ' : 'Fawry Service Code / POS',
          number: settings.fawryCode || '789123',
          badgeColor: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
          numberLabel: isAr ? 'كود خدمة فوري / رقم التاجر:' : 'Fawry Merchant Code / Service:',
          senderPlaceholder: 'رقم هاتفك أو الرقم المرجعي لفوري',
        };
      case 'CRYPTO':
      default:
        return {
          title: isAr ? 'كريبتو USDT (TRC20 / BEP20)' : 'USDT Crypto',
          subtitle: isAr ? 'إيداع عملات مشفرة رقمية سريعة' : 'TRC20 / BEP20 Blockchain Transfer',
          number: 'TN3W4H8d7ClashOfCoinUSDTTRC20x892019',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
          numberLabel: isAr ? 'عنوان محفظة الإيداع USDT:' : 'Company Deposit USDT Address:',
          senderPlaceholder: 'عنوان محفظتك أو TxHash',
        };
    }
  };

  const details = getMethodDetails(method);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(isAr ? 'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت' : 'Image size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptImage(event.target?.result as string);
      setErrorMessage('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderAccount.trim()) {
      setErrorMessage(isAr ? 'يرجى إدخال رقم الهاتف أو الحساب المحول منه' : 'Please enter your sender account number');
      return;
    }
    const minRequired = isJordan ? 1 : 10;
    if (!amount || amount < minRequired) {
      setErrorMessage(
        isAr
          ? `الحد الأدنى للإيداع هو ${minRequired} ${currencySymbol}`
          : `Minimum deposit is ${minRequired} ${currencySymbol}`
      );
      return;
    }
    if (!receiptImage && method !== 'CRYPTO') {
      setErrorMessage(isAr ? 'يرجى رفع صورة إيصال التحويل لتأكيد العملية' : 'Please upload a transfer receipt image');
      return;
    }

    setIsSubmitting(true);
    try {
      storage.addDeposit(amount, method, {
        senderAccount: senderAccount.trim(),
        companyAccount: details.number,
        receiptImage: receiptImage || undefined,
        currency: isJordan ? 'JOD' : 'EGP',
      });

      setIsSubmittedSuccess(true);
      onDepositSuccess();
      onShowNotification(
        'success',
        isAr
          ? `تم إرسال طلب إيداع ${amount} ${currencySymbol} بنجاح وجاري التحقق منه فورياً`
          : `Deposit request of ${amount} ${currencySymbol} submitted successfully!`
      );
    } catch {
      setErrorMessage(isAr ? 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة ثانية' : 'Error submitting deposit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] shadow-2xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 end-5 p-1.5 rounded-full text-[#78716C] hover:text-[#1F2937] hover:bg-[#F5F2EB] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-[#F3EFE6] pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/15 text-[#047857] text-xs font-black">
              <Coins className="w-3.5 h-3.5" />
              <span>{isAr ? 'شحن الرصيد الفوري' : 'Instant Balance Deposit'}</span>
            </div>

            {/* Country Selector Toggle (Jordan 🇯🇴 vs Egypt 🇪🇬) */}
            <div className="flex items-center bg-[#F5F2EB] p-1 rounded-xl border border-[#E6E1D5]">
              <button
                type="button"
                onClick={() => handleCountrySwitch('JO')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                  isJordan
                    ? 'bg-white text-[#1F2937] shadow-xs border border-[#E6E1D5]'
                    : 'text-[#78716C] hover:text-[#1F2937]'
                }`}
              >
                <span>🇯🇴</span>
                <span>الأردن (د.أ)</span>
              </button>
              <button
                type="button"
                onClick={() => handleCountrySwitch('EG')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                  !isJordan
                    ? 'bg-white text-[#1F2937] shadow-xs border border-[#E6E1D5]'
                    : 'text-[#78716C] hover:text-[#1F2937]'
                }`}
              >
                <span>🇪🇬</span>
                <span>مصر (ج.م)</span>
              </button>
            </div>
          </div>

          <h2 className="text-xl font-black text-[#1F2937]">
            {isJordan
              ? (isAr ? 'إيداع بالمحافظ الأردنية والكريبتو' : 'Deposit via Jordanian Wallets & Crypto')
              : (isAr ? 'إيداع بالمحافظ المصرية والكريبتو' : 'Deposit via Egyptian Wallets & Crypto')}
          </h2>
          <p className="text-xs text-[#78716C] mt-0.5">
            {isJordan
              ? (isAr ? 'اشحن حسابك فورياً بالدينار الأردني عبر كليك، زين كاش، أورانج، يو والت، أو كريبتو USDT' : 'Fund in JOD via CliQ, Zain, Orange, UWallet, or USDT')
              : (isAr ? 'اشحن حسابك فورياً بالجنيه عبر فودافون كاش، إنستاباي، اتصالات، أورانج، فوري، أو كريبتو USDT' : 'Fund in EGP via Vodafone Cash, InstaPay, Etisalat, Orange, Fawry, or USDT')}
          </p>
        </div>

        {isSubmittedSuccess ? (
          <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center mx-auto border border-[#10B981]/30">
              <CheckCircle className="w-9 h-9" />
            </div>
            <h3 className="text-lg font-black text-[#1F2937]">
              {isAr ? 'تم استلام طلب الإيداع بنجاح!' : 'Deposit Submitted Successfully!'}
            </h3>
            <p className="text-xs text-[#78716C] max-w-sm mx-auto leading-relaxed">
              {isAr
                ? `طلب الإيداع بمبلغ ${amount} ${currencySymbol} قيد المراجعة السريعة لدى قسم المالية، وسيتم إضافته لحسابك في غضون دقائق معدودة.`
                : `Your deposit request for ${amount} ${currencySymbol} is under quick review and will be credited to your account shortly.`}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isAr ? 'تم، العودة إلى اللعب' : 'Done, Back to Game'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-xs font-bold text-[#DC2626] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Payment Method Dropdown Filtered by Country */}
            <div>
              <label className="text-xs font-bold text-[#78716C] block mb-1.5">
                {isAr
                  ? isJordan
                    ? '1. اختر طريقة التحويل الأردنية:'
                    : '1. اختر طريقة التحويل المصرية:'
                  : '1. Select Local Payment Method:'}
              </label>
              <div className="relative">
                <select
                  value={method}
                  onChange={(e) => {
                    setMethod(e.target.value as EgyptianPaymentMethod);
                    setErrorMessage('');
                  }}
                  className="w-full px-3.5 py-3 bg-[#F5F2EB] border border-[#E6E1D5] rounded-2xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] transition-all cursor-pointer"
                >
                  {isJordan ? (
                    <>
                      <option value="JORDAN_CLIQ">🔵 كليك الأردن (CliQ Alias - فوري)</option>
                      <option value="JORDAN_ZAIN_CASH">🟢 زين كاش الأردن (Zain Cash JO)</option>
                      <option value="JORDAN_ORANGE_MONEY">🟠 أورانج موني الأردن (Orange Money JO)</option>
                      <option value="JORDAN_UWALLET">🟣 يو والت أمنية (UWallet Jordan)</option>
                      <option value="JORDAN_BANK">🏛️ حوالة بنكية أردنية (Jordan Bank Transfer)</option>
                      <option value="CRYPTO">🪙 كريبتو USDT (TRC20 / BEP20)</option>
                    </>
                  ) : (
                    <>
                      <option value="VODAFONE_CASH">🔴 فودافون كاش (Vodafone Cash)</option>
                      <option value="INSTAPAY">🟣 إنستا باي (InstaPay - تحويل بنكي / محفظة)</option>
                      <option value="ETISALAT_CASH">🟢 اتصالات كاش (Etisalat Cash)</option>
                      <option value="ORANGE_CASH">🟠 أورانج كاش (Orange Cash)</option>
                      <option value="FAWRY">🟡 فوري كود خدمة (Fawry Pay)</option>
                      <option value="CRYPTO">🪙 كريبتو USDT (TRC20 / BEP20)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* 2. Company Receiving Wallet Display with Copy */}
            <div className="p-4 bg-gradient-to-br from-[#F5F2EB] to-[#EFECE3] rounded-2xl border border-[#E6E1D5] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#78716C]">{details.numberLabel}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${details.badgeColor}`}>
                  {details.title.split(' ')[0]}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-[#D9D2C5] shadow-xs">
                <span className="font-mono text-base font-black text-[#1F2937] tracking-wider select-all break-all">
                  {details.number}
                </span>

                <button
                  type="button"
                  onClick={() => handleCopy(details.number)}
                  className="px-3 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-black font-extrabold text-xs rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}</span>
                </button>
              </div>

              <p className="text-[11px] text-[#78716C] leading-relaxed">
                {isAr
                  ? 'يرجى تحويل المبلغ المطلوب إلى رقم/عنوان الشركة الموضح أعلاه، ثم ملء البيانات أدناه لربط الإيداع بحسابك.'
                  : 'Please send funds to the company number above, then submit your details below.'}
              </p>
            </div>

            {/* 3. Sender's Phone/Account Number */}
            <div>
              <label className="text-xs font-bold text-[#78716C] block mb-1">
                {isAr ? '2. رقم الهاتف / الحساب المرسل منه (رقمك):' : '2. Sender Account / Phone Number:'}
              </label>
              <div className="relative">
                <Smartphone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                <input
                  type="text"
                  required
                  value={senderAccount}
                  onChange={(e) => setSenderAccount(e.target.value)}
                  placeholder={details.senderPlaceholder}
                  className="w-full ps-9 pe-3 py-2.5 bg-[#F5F2EB] border border-[#E6E1D5] rounded-xl font-mono text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>
            </div>

            {/* 4. Transferred Amount */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-[#78716C] mb-1">
                <span>
                  {isAr
                    ? `3. المبلغ المحول بـ ${isJordan ? 'الدينار الأردني (JOD)' : 'الجنيه المصري (EGP)'}:`
                    : '3. Transferred Amount:'}
                </span>
                <span className="font-mono text-[#047857]">
                  {amount} {currencySymbol}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={isJordan ? 1 : 10}
                  step={isJordan ? 1 : 5}
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(Math.max(isJordan ? 1 : 10, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2.5 bg-[#F5F2EB] border border-[#E6E1D5] rounded-xl font-mono text-sm font-bold text-[#1F2937] focus:outline-none focus:border-[#F59E0B]"
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#78716C]">
                  {currencySymbol}
                </span>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {quickChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setAmount(chip)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                      amount === chip
                        ? 'bg-[#F59E0B] text-black border-[#F59E0B] shadow-2xs'
                        : 'bg-white text-[#78716C] border-[#E6E1D5] hover:border-[#F59E0B]'
                    }`}
                  >
                    {chip} {currencySymbol}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Upload Transfer Receipt Image */}
            <div>
              <label className="text-xs font-bold text-[#78716C] block mb-1">
                {isAr ? '4. صورة إيصال التحويل (Upload Receipt):' : '4. Transfer Receipt Screenshot:'}
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />

              {receiptImage ? (
                <div className="relative p-2 bg-[#F5F2EB] rounded-2xl border border-[#10B981] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
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
                      <span className="text-[10px] text-[#78716C] truncate block">
                        جاهز للمراجعة من قبل الإدارة
                      </span>
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
                  <div className="w-10 h-10 rounded-full bg-white text-[#F59E0B] shadow-2xs flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#1F2937]">
                    {isAr ? 'اضغط هنا لرفع صورة إيصال التحويل (سكرين شوت)' : 'Click to upload receipt screenshot'}
                  </span>
                  <span className="text-[10px] text-[#78716C]">
                    يدعم PNG, JPG, WebP حتى 5 ميجابايت
                  </span>
                </button>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[48px] py-3 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-black text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? (isAr ? 'جاري إرسال الطلب...' : 'Submitting...')
                    : (isAr ? `تأكيد إرسال طلب إيداع ${amount} ${currencySymbol}` : `Submit Deposit of ${amount} ${currencySymbol}`)}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
