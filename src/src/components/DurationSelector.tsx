import React from 'react';
import { useTranslation } from 'react-i18next';
import { RoundDuration } from '../types';
import { Clock } from 'lucide-react';

interface DurationSelectorProps {
  duration: RoundDuration;
  onSelectDuration: (d: RoundDuration) => void;
  disabled?: boolean;
}

export const DurationSelector: React.FC<DurationSelectorProps> = ({
  duration,
  onSelectDuration,
  disabled = false,
}) => {
  const { i18n } = useTranslation();

  const options: { value: RoundDuration; labelAr: string; labelEn: string }[] = [
    { value: 15, labelAr: '15ث', labelEn: '15s' },
    { value: 30, labelAr: '30ث', labelEn: '30s' },
    { value: 45, labelAr: '45ث', labelEn: '45s' },
    { value: 60, labelAr: '60ث', labelEn: '60s' },
  ];

  const isAr = i18n.language === 'ar';

  return (
    <div className="flex items-center gap-1 p-1 bg-[#F5F2EB] rounded-xl border border-[#E6E1D5]">
      <div className="flex items-center gap-1 px-1.5 text-[11px] font-bold text-[#78716C]">
        <Clock className="w-3 h-3 text-[#F59E0B]" />
      </div>
      <div className="flex items-center gap-1">
        {options.map((opt) => {
          const isActive = duration === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onSelectDuration(opt.value)}
              disabled={disabled}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#F59E0B] text-black shadow-xs font-black'
                  : 'text-[#78716C] hover:text-[#1F2937] hover:bg-white/60'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isAr ? opt.labelAr : opt.labelEn}
            </button>
          );
        })}
      </div>
    </div>
  );
};
