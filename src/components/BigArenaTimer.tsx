import React from 'react';
import { useTranslation } from 'react-i18next';
import { Timer, Lock, Flame } from 'lucide-react';

interface BigArenaTimerProps {
  timeLeftSeconds: number;
  isLocked: boolean;
  className?: string;
}

export const BigArenaTimer: React.FC<BigArenaTimerProps> = ({
  timeLeftSeconds,
  isLocked,
  className = '',
}) => {
  const { t, i18n } = useTranslation();

  const mins = Math.floor(Math.max(0, timeLeftSeconds) / 60);
  const secs = Math.max(0, timeLeftSeconds) % 60;
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const isCritical = timeLeftSeconds <= 10;

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-3 sm:p-5 rounded-3xl transition-all duration-300 backdrop-blur-md select-none ${
        isCritical
          ? 'bg-[#18181b]/90 border-2 border-[#EF4444] shadow-[0_0_40px_rgba(239,68,68,0.4)] animate-pulse'
          : 'bg-[#18181b]/85 border border-[#3f3f46] shadow-xl'
      } ${className}`}
    >
      {/* Top micro badge */}
      <div className="flex items-center gap-1.5 mb-1 px-3 py-0.5 rounded-full bg-black/40 text-xs font-bold">
        {isCritical ? (
          <div className="flex items-center gap-1 text-[#EF4444] font-black animate-pulse">
            <Lock className="w-3.5 h-3.5" />
            <span>{i18n.language === 'ar' ? 'مغلق - جاري الحسم!' : 'LOCKED - DECIDING!'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[#F59E0B]">
            <Timer className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono text-[#e4e4e7]">LIVE ROUND</span>
          </div>
        )}
      </div>

      {/* Main HUGE 80px Timer */}
      <div
        className="font-mono font-black text-6xl sm:text-7xl lg:text-[80px] leading-none tracking-tight text-white font-tabular transition-all duration-150"
        style={{
          textShadow: isCritical
            ? '0 0 30px #EF4444, 0 0 60px #EF4444, 0 0 90px #DC2626'
            : '0 0 25px rgba(239, 68, 68, 0.9), 0 0 45px rgba(239, 68, 68, 0.55)',
        }}
      >
        {formattedTime}
      </div>

      {/* Label under it: "الوقت المتبقي" */}
      <div className="mt-1 text-xs sm:text-sm font-black text-white/90 tracking-wider flex items-center gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        <span>{i18n.language === 'ar' ? 'الوقت المتبقي' : 'TIME REMAINING'}</span>
        {isCritical && <span className="inline-block w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />}
      </div>
    </div>
  );
};
