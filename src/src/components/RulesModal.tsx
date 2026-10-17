import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, BookOpen, Swords, ShieldCheck, Zap } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  if (!isOpen) return null;

  const isAr = i18n.language === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#FFFDF9] rounded-3xl border border-[#E6E1D5] shadow-2xl p-6 max-h-[85vh] overflow-y-auto space-y-4">
        <button
          onClick={onClose}
          className="absolute top-5 end-5 p-2 rounded-xl text-[#78716C] hover:text-[#1F2937] hover:bg-[#F5F2EB] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-[#D97706]">
          <BookOpen className="w-6 h-6" />
          <h2 className="text-xl font-black text-[#1F2937]">
            {isAr ? 'قواعد معركة Clash Of Coin' : 'Clash Of Coin Battle Rules'}
          </h2>
        </div>

        <div className="space-y-3 text-xs text-[#1F2937] leading-relaxed">
          <div className="p-3 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] space-y-1">
            <span className="font-bold text-sm text-[#047857] flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#10B981]" />
              {isAr ? '1. آلية الجولات الحية السريعة' : '1. Rapid Live Rounds'}
            </span>
            <p className="text-[#78716C]">
              {isAr
                ? 'يمكنك الاختيار بين جولات مدتها 15 ثانية، 30 ثانية (الافتراضي)، 45 ثانية، أو 60 ثانية. يتم قفل سعر الدخول في بداية الجولة بدقة من بينانس، ويحدد سعر الإغلاق الفريق الفائز.'
                : 'Choose between 15s, 30s (default), 45s, or 60s rounds. Entry price is locked at round start via Binance, and exit price determines the victor.'}
            </p>
          </div>

          <div className="p-3 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] space-y-1">
            <span className="font-bold text-sm text-[#D97706] flex items-center gap-1.5">
              <Swords className="w-4 h-4 text-[#F59E0B]" />
              {isAr ? '2. نظام توزيع الأرباح من الحوض' : '2. Pool Distribution System'}
            </span>
            <p className="text-[#78716C]">
              {isAr
                ? 'يتنافس فريق الصعود (UP) وفريق الهبوط (DOWN). إذا فاز فريقك، يتم توزيع حوض الفريق الخاسر بالكامل على الفائزين بنسبة وتناسب مع حجم رهان كل لاعب بعد خصم عمولة المنصة البسيطة.'
                : 'Team UP battles Team DOWN. The winning side receives the losing pool proportionally to their bet size minus the platform house commission.'}
            </p>
          </div>

          <div className="p-3 bg-[#F5F2EB] rounded-2xl border border-[#E6E1D5] space-y-1">
            <span className="font-bold text-sm text-[#7C3AED] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />
              {isAr ? '3. النزاهة الرقمية المثبتة (Provably Fair)' : '3. Cryptographic Fairness'}
            </span>
            <p className="text-[#78716C]">
              {isAr
                ? 'تعتمد جميع الجولات على تشفير SHA-256 وأسعار بينانس الرسمية المباشرة دون أي تدخل يدوي أو حسابات وهمية.'
                : 'Every round is anchored by SHA-256 cryptographic commitments and real Binance price prints.'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full min-h-[48px] py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-black font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          {isAr ? 'فهمت، دخول الحلبة الآن' : 'Understood, Enter Arena'}
        </button>
      </div>
    </div>
  );
};
