import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LandscapeNotice: React.FC = () => {
  const { i18n } = useTranslation();
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [bypassed, setBypassed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if small mobile device in portrait orientation
      const isMobile = window.innerWidth <= 768 || window.innerHeight <= 500;
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsPortraitMobile(isMobile && isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortraitMobile || bypassed) return null;

  const isAr = i18n.language === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/95 text-white p-6 backdrop-blur-md animate-in fade-in">
      <div className="max-w-xs text-center space-y-5">
        {/* Animated Phone Rotate Icon */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#F59E0B]/10 animate-ping" />
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#F59E0B] flex items-center justify-center animate-spin duration-1000">
            <RotateCw className="w-8 h-8 text-[#F59E0B]" />
          </div>
          <Smartphone className="absolute w-10 h-10 text-white animate-bounce" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {isAr ? 'الرجاء تدوير الهاتف' : 'Please Rotate Your Phone'}
          </h2>
          <p className="text-xs text-[#a1a1aa] mt-2 leading-relaxed">
            {isAr
              ? 'اللعبة مصممة لتناسب شاشة الهاتف بالعرض (Landscape) بالكامل بدون أي تمرير.'
              : 'The battle arena is optimized for Landscape mode to fit the entire game in one screen.'}
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setBypassed(true)}
            className="text-xs text-[#71717a] underline hover:text-[#a1a1aa] cursor-pointer py-2 px-3"
          >
            {isAr ? 'المتابعة بالوضع الرأسي مؤقتاً' : 'Continue in portrait anyway'}
          </button>
        </div>
      </div>
    </div>
  );
};
