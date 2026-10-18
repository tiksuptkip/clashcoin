import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDomain?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showDomain = true }) => {
  const heights = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const dotBetSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`flex items-center gap-3 bg-[#FFFBF0] select-none ${className}`}>
      {/* Crisp Custom SVG Graphic: Two clashing coins with spark in the middle */}
      <svg
        viewBox="0 0 120 70"
        className={`${heights[size]} w-auto drop-shadow-sm shrink-0`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gold Coin Gradient */}
          <linearGradient id="goldCoinGrad" x1="10" y1="10" x2="55" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Emerald Coin Gradient */}
          <linearGradient id="emeraldCoinGrad" x1="65" y1="10" x2="110" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6EE7B7" />
            <stop offset="40%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          {/* Rim Shading */}
          <linearGradient id="goldRim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          <linearGradient id="emeraldRim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A7F3D0" />
            <stop offset="100%" stopColor="#065F46" />
          </linearGradient>

          {/* Spark Gradient */}
          <radialGradient id="sparkGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="40%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Left Coin: Gold with B Symbol (slightly tilted towards center) */}
        <g transform="translate(14, 5) rotate(6, 25, 30)">
          {/* Outer Coin Drop Shadow */}
          <ellipse cx="26" cy="32" rx="23" ry="23" fill="#D97706" opacity="0.3" />
          {/* Outer Coin Body */}
          <ellipse cx="25" cy="30" rx="23" ry="23" fill="url(#goldRim)" />
          <ellipse cx="25" cy="30" rx="20.5" ry="20.5" fill="url(#goldCoinGrad)" />
          {/* Inner Groove */}
          <circle cx="25" cy="30" r="16.5" stroke="#FDE68A" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.85" />
          {/* Bold 'B' Symbol */}
          <text
            x="25"
            y="37"
            fontFamily="Inter, Arial, sans-serif"
            fontWeight="900"
            fontSize="20"
            fill="#FFFBF0"
            textAnchor="middle"
            style={{ filter: 'drop-shadow(0 1px 1px rgba(180, 83, 9, 0.6))' }}
          >
            ₿
          </text>
        </g>

        {/* Right Coin: Emerald with E Symbol (slightly tilted towards center) */}
        <g transform="translate(56, 5) rotate(-6, 25, 30)">
          {/* Outer Coin Drop Shadow */}
          <ellipse cx="26" cy="32" rx="23" ry="23" fill="#047857" opacity="0.3" />
          {/* Outer Coin Body */}
          <ellipse cx="25" cy="30" rx="23" ry="23" fill="url(#emeraldRim)" />
          <ellipse cx="25" cy="30" rx="20.5" ry="20.5" fill="url(#emeraldCoinGrad)" />
          {/* Inner Groove */}
          <circle cx="25" cy="30" r="16.5" stroke="#A7F3D0" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.85" />
          {/* Bold 'E' Symbol */}
          <text
            x="25"
            y="37"
            fontFamily="Inter, Arial, sans-serif"
            fontWeight="900"
            fontSize="19"
            fill="#FFFBF0"
            textAnchor="middle"
            style={{ filter: 'drop-shadow(0 1px 1px rgba(6, 95, 70, 0.6))' }}
          >
            Ξ
          </text>
        </g>

        {/* Central Clash Impact: Radiant Spark */}
        <g transform="translate(60, 35)">
          {/* Soft Aura */}
          <circle cx="0" cy="0" r="18" fill="url(#sparkGlow)" opacity="0.9" />
          {/* 4-Point Star Spark */}
          <path
            d="M 0 -16 Q 0 0 16 0 Q 0 0 0 16 Q 0 0 -16 0 Q 0 0 0 -16 Z"
            fill="#FFFBEB"
            stroke="#F59E0B"
            strokeWidth="0.8"
          />
          {/* Secondary 4-Point Angle Spark */}
          <path
            d="M 0 -8 Q 0 0 8 0 Q 0 0 0 8 Q 0 0 -8 0 Q 0 0 0 -8 Z"
            transform="rotate(45)"
            fill="#FEF08A"
          />
          {/* Spark Particles */}
          <circle cx="-10" cy="-12" r="1.5" fill="#F59E0B" />
          <circle cx="11" cy="-10" r="1.2" fill="#10B981" />
          <circle cx="-12" cy="11" r="1.3" fill="#F59E0B" />
          <circle cx="10" cy="12" r="1.4" fill="#10B981" />
        </g>
      </svg>

      {/* Brand Text: Clash Of Coin bold + .bet in gold */}
      <div className="flex items-baseline gap-1 tracking-tight">
        <span className={`font-black text-[#1F2937] ${textSizes[size]} whitespace-nowrap`}>
          Clash Of Coin
        </span>
        {showDomain && (
          <span className={`font-bold text-[#F59E0B] ${dotBetSizes[size]} bg-[#F59E0B]/10 px-1.5 py-0.5 rounded`}>
            .bet
          </span>
        )}
      </div>
    </div>
  );
};
