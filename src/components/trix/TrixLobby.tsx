import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Menu,
  Bell,
  User,
  Search,
  Heart,
  Lock,
  Plus,
  Play,
  Trophy,
  Shield,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { SupportedCurrency, UserProfile } from '../../types';

export type TrixLobbyVariant = 'TRIX_COMPLEX' | 'TRIX' | 'TRIX_PARTNER';

export interface TrixLobbyProps {
  user: UserProfile | null;
  activeCurrency: SupportedCurrency;
  currentBalance: number;
  currencySymbol: string;
  onSelectGame: (variant: TrixLobbyVariant) => void;
  onOpenDeposit: () => void;
  onOpenLeaderboard: () => void;
  onReturnHome?: () => void;
}

export const TrixLobby: React.FC<TrixLobbyProps> = ({
  user,
  activeCurrency,
  currentBalance,
  currencySymbol,
  onSelectGame,
  onOpenDeposit,
  onOpenLeaderboard,
  onReturnHome,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeNavTab, setActiveNavTab] = useState<'store' | 'games' | 'home' | 'clubs' | 'events'>('games');
  const [lockedToast, setLockedToast] = useState<string | null>(null);

  const [favoriteGames, setFavoriteGames] = useState<Record<string, boolean>>({
    tarneeb: true,
    complex: true,
    trix_complex: true,
    trix: true,
    trix_partner: true,
  });

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteGames((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLockedClick = (gameName: string) => {
    setLockedToast(`${gameName}: قريباً`);
    setTimeout(() => {
      setLockedToast((curr) => (curr?.startsWith(gameName) ? null : curr));
    }, 2800);
  };

  // User display name & level calculation (Defaults to "New-OLE2TN" as requested)
  const userName = user?.display_name || user?.username || 'New-OLE2TN';
  const userLevel = 6;
  const userProgressPercent = 84;

  // 1. "My Games" 5 Cards
  const myGamesList = [
    {
      id: 'tarneeb',
      name: 'Tarneeb',
      nameAr: 'طرنيب',
      badge: null,
      locked: true,
      lockedText: 'قريبا',
      pattern: 'bg-gradient-to-br from-[#71717A]/40 to-[#3F3F46]/60',
      cardsPreview: 'A♠ K♠',
      isTrix: false,
    },
    {
      id: 'complex',
      name: 'Complex',
      nameAr: 'كومبلكس',
      badge: 'COMPLEX',
      locked: false,
      variant: 'TRIX_COMPLEX' as TrixLobbyVariant,
      pattern: 'bg-gradient-to-br from-[#78350F] to-[#451A03]',
      cardsPreview: '🎲 👑',
      isTrix: true,
    },
    {
      id: 'trix_complex',
      name: 'Trix Complex',
      nameAr: 'تركس كومبلكس',
      badge: 'COMPLEX',
      locked: false,
      isMain: true,
      variant: 'TRIX_COMPLEX' as TrixLobbyVariant,
      pattern: 'bg-gradient-to-br from-[#991B1B] to-[#7F1D1D]',
      cardsPreview: '♦Q ♣K',
      isTrix: true,
    },
    {
      id: 'trix',
      name: 'Trix',
      nameAr: 'تركس',
      badge: null,
      locked: false,
      variant: 'TRIX' as TrixLobbyVariant,
      pattern: 'bg-gradient-to-br from-[#7F1D1D] to-[#581C87]',
      cardsPreview: '♦J ♣J',
      isTrix: true,
    },
    {
      id: 'trix_partner',
      name: 'Trix Partner',
      nameAr: 'تركس شراكة',
      badge: 'PARTNER',
      locked: false,
      variant: 'TRIX_PARTNER' as TrixLobbyVariant,
      pattern: 'bg-gradient-to-br from-[#831843] to-[#991B1B]',
      cardsPreview: '♠J ♥J',
      isTrix: true,
    },
  ];

  // 2. "All Games" Section
  const allGamesList = [
    {
      id: 'tarneeb',
      name: 'Tarneeb',
      nameAr: 'Classic Levant Trick-Taking',
      locked: true,
      badge: 'قريبا',
      color: 'bg-[#52525B]',
      cardsPreview: 'A♠ K♠',
      isTrix: false,
    },
    {
      id: 'complex',
      name: 'Complex',
      nameAr: '4 Penalty Contracts Combined',
      locked: false,
      badge: 'COMPLEX',
      variant: 'TRIX_COMPLEX' as TrixLobbyVariant,
      color: 'bg-[#78350F]',
      cardsPreview: '🎲 👑',
      isTrix: true,
    },
    {
      id: 'trix_complex',
      name: 'Trix Complex',
      nameAr: 'Main Game: 4 Kingdoms + Trix',
      locked: false,
      badge: 'POPULAR',
      variant: 'TRIX_COMPLEX' as TrixLobbyVariant,
      color: 'bg-[#991B1B]',
      cardsPreview: '♦Q ♣K',
      isTrix: true,
    },
    {
      id: 'trix',
      name: 'Trix',
      nameAr: 'Classic 4-Kingdom Solo',
      locked: false,
      variant: 'TRIX' as TrixLobbyVariant,
      color: 'bg-[#7C2D12]',
      cardsPreview: '♦J ♣J',
      isTrix: true,
    },
    {
      id: 'trix_partner',
      name: 'Trix Partner',
      nameAr: 'Team Partnership (2 vs 2)',
      locked: false,
      badge: 'PARTNER',
      variant: 'TRIX_PARTNER' as TrixLobbyVariant,
      color: 'bg-[#831843]',
      cardsPreview: '♠J ♥J',
      isTrix: true,
    },
  ];

  const filteredMyGames = myGamesList.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.nameAr.includes(searchQuery)
  );

  const filteredAllGames = allGamesList.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.nameAr.includes(searchQuery)
  );

  return (
    <div
      dir="ltr"
      className="w-full min-h-screen bg-[#1A1D26] text-white flex flex-col items-center justify-between font-sans select-none pb-24 overflow-x-hidden"
    >
      {/* Toast notification for locked games */}
      {lockedToast && (
        <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-3">
          <div className="bg-[#242A36] border border-[#FACC15]/40 text-[#FACC15] px-4 py-2 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 pointer-events-auto">
            <Lock className="w-4 h-4 text-[#FACC15]" />
            <span>{lockedToast}</span>
          </div>
        </div>
      )}

      {/* Main Container max-w-md matching exact reference */}
      <div className="w-full max-w-[480px] mx-auto px-4 py-3 flex flex-col gap-3.5">
        {/* =========================================================================
            1. TOP BAR:
            - Row 1: Settings gear / menu on left, Bell / profile on right
            ========================================================================= */}
        <div className="w-full flex items-center justify-between pt-1">
          {/* Left: Settings gear & Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenLeaderboard()}
              className="p-1 text-white/90 hover:text-white hover:scale-105 transition-all cursor-pointer"
              title="Settings & Leaderboard"
              aria-label="Settings"
            >
              <Settings className="w-6 h-6 stroke-[2]" />
            </button>
            <button
              onClick={() => {
                if (onReturnHome) onReturnHome();
              }}
              className="p-1 text-white/90 hover:text-white hover:scale-105 transition-all cursor-pointer"
              title="Main Menu"
              aria-label="Menu"
            >
              <Menu className="w-6 h-6 stroke-[2]" />
            </button>
          </div>

          {/* Right: Bell & Profile */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLeaderboard}
              className="relative p-1 text-white/90 hover:text-white hover:scale-105 transition-all cursor-pointer"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-6 h-6 stroke-[2] rotate-12" />
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#EF4444]" />
            </button>
            <button
              onClick={onOpenLeaderboard}
              className="p-1 text-white/90 hover:text-white hover:scale-105 transition-all cursor-pointer"
              title="Profile"
              aria-label="Profile"
            >
              <User className="w-6 h-6 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            1. TOP BAR:
            - Row 2: Avatar circle, Name "New-OLE2TN", Level 6 badge with orange
              progress bar "84%", Plus button, Coin balance 120, Red fez 0.
            ========================================================================= */}
        <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2">
          {/* User Capsule: Avatar, Name, Level 6 (84%), + button */}
          <div className="flex items-center bg-[#242A36] rounded-full p-1 pr-1.5 border border-white/10 shadow-md">
            {/* Dark glossy avatar circle with red status dot */}
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1A1D26] border border-white/20 flex items-center justify-center shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#111] flex items-center justify-center text-white/60">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              </div>
              <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#EF4444] border-2 border-[#242A36]" />
            </div>

            {/* Name + Level Bar */}
            <div className="flex flex-col ml-2 mr-1">
              <span className="text-xs font-bold text-white tracking-wide truncate max-w-[80px] sm:max-w-[95px]">
                {userName}
              </span>

              {/* Level Pill: Hexagon badge 6 + orange progress bar 84% */}
              <div className="flex items-center mt-0.5">
                <div className="w-4 h-4 rounded-full bg-[#FACC15] text-black font-black text-[9px] flex items-center justify-center shrink-0 shadow-xs z-10">
                  {userLevel}
                </div>
                <div className="w-14 sm:w-16 h-3 bg-[#1A1D26] rounded-r-full overflow-hidden relative -ml-1 border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-[#F59E0B] to-[#EA580C] rounded-r-full"
                    style={{ width: `${userProgressPercent}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white leading-none">
                    {userProgressPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Plus Button */}
            <button
              onClick={onOpenDeposit}
              className="w-7 h-7 rounded-full bg-[#1A1D26] hover:bg-[#2F3747] border border-white/15 flex items-center justify-center text-white/90 hover:text-white transition-all cursor-pointer ml-1"
              title="Deposit / Add Funds"
              aria-label="Add funds"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Coin Balance Capsule: Gold coin with small green plus badge, balance 120 */}
          <div
            onClick={onOpenDeposit}
            className="flex items-center bg-[#242A36] hover:bg-[#2D3545] rounded-full px-2.5 py-1.5 border border-white/10 shadow-md cursor-pointer transition-all"
            title="Coin Balance"
          >
            <div className="relative w-6 h-6 rounded-full bg-gradient-to-b from-[#FDE047] to-[#CA8A04] flex items-center justify-center shadow-xs shrink-0 border border-[#FEF08A]">
              <span className="text-[11px] leading-none select-none">👑</span>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#22C55E] text-black font-black text-[8px] flex items-center justify-center border border-[#242A36]">
                +
              </span>
            </div>
            <span className="ml-2 font-mono font-bold text-xs text-white">
              {currentBalance > 0 ? Math.floor(currentBalance) : 120}
            </span>
          </div>

          {/* Red Fez Capsule: Red fez hat with gold tassel, small green plus badge, value 0 */}
          <div
            onClick={onOpenDeposit}
            className="flex items-center bg-[#242A36] hover:bg-[#2D3545] rounded-full px-2.5 py-1.5 border border-white/10 shadow-md cursor-pointer transition-all"
            title="Fez Balance"
          >
            <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
              {/* Fez SVG Graphic */}
              <svg viewBox="0 0 32 32" className="w-5 h-5 drop-shadow">
                <path d="M7 26 L10 11 L22 11 L25 26 Z" fill="#DC2626" />
                <ellipse cx="16" cy="11" rx="6" ry="2" fill="#B91C1C" />
                <ellipse cx="16" cy="26" rx="9" ry="2.5" fill="#991B1B" />
                <circle cx="16" cy="10.5" r="1.5" fill="#FACC15" />
                <path d="M16 10.5 Q22 14 20 20" stroke="#FACC15" strokeWidth="1.5" fill="none" />
              </svg>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#22C55E] text-black font-black text-[8px] flex items-center justify-center border border-[#242A36]">
                +
              </span>
            </div>
            <span className="ml-1.5 font-mono font-bold text-xs text-white">
              0
            </span>
          </div>
        </div>

        {/* =========================================================================
            2. SEARCH BAR:
            Dark rounded bar with magnifying icon and placeholder "Search"
            ========================================================================= */}
        <div className="w-full relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-[#242A36] text-white text-sm rounded-full pl-10 pr-4 py-2 border border-white/10 placeholder-gray-400 focus:outline-none focus:border-[#22C55E] transition-colors shadow-inner"
          />
        </div>

        {/* =========================================================================
            3. BANNER:
            Blue patterned background card, big white text "Trix Complex",
            green "Play Now" button, top-right green ribbon "New games"
            ========================================================================= */}
        <div className="w-full relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#172554] via-[#1E3A8A] to-[#1E40AF] border border-blue-500/20 shadow-xl p-4 flex items-center justify-between">
          {/* Subtle geometric damask pattern watermark */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(#93C5FD 1px, transparent 1px), radial-gradient(#93C5FD 1px, #1E3A8A 1px)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 10px 10px',
            }}
          />

          {/* Top-Right Slanted Green Ribbon: "New games" */}
          <div className="absolute top-2.5 right-0 z-20">
            <div className="bg-[#22C55E] text-white font-black text-[10px] uppercase tracking-wider px-3 py-0.5 rounded-l-md shadow-md flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 fill-white" />
              <span>New games</span>
            </div>
          </div>

          {/* Left card graphic mockup + info */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-20 h-24 rounded-xl bg-gradient-to-b from-[#14B8A6] to-[#0D9488] p-1.5 flex flex-col justify-between shadow-lg border border-teal-300/30">
              <div className="text-center">
                <span className="block text-[11px] font-black text-white leading-tight">Trix</span>
                <span className="block text-[9px] font-bold text-teal-100 uppercase">Complex</span>
              </div>
              <div className="flex justify-center -space-x-1.5">
                <div className="w-5 h-7 rounded bg-white text-[#DC2626] font-black text-[10px] flex items-center justify-center shadow-xs">
                  ♦Q
                </div>
                <div className="w-5 h-7 rounded bg-white text-black font-black text-[10px] flex items-center justify-center shadow-xs">
                  ♣K
                </div>
              </div>
            </div>

            {/* Center Info + Play Now */}
            <div className="flex flex-col items-start gap-2">
              <h2 className="text-xl font-black text-white tracking-wide">
                Trix Complex
              </h2>
              <button
                onClick={() => onSelectGame('TRIX_COMPLEX')}
                className="px-5 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-black text-xs shadow-lg shadow-green-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Play Now</span>
              </button>
            </div>
          </div>

          {/* Bottom-right subtle heart toggle */}
          <button
            onClick={(e) => toggleFavorite('banner_game', e)}
            className="absolute bottom-3 right-3 text-white/40 hover:text-[#EF4444] transition-colors cursor-pointer z-10"
            title="Favorite"
            aria-label="Favorite"
          >
            <Heart className={`w-4 h-4 ${favoriteGames['banner_game'] ? 'fill-[#EF4444] text-[#EF4444]' : ''}`} />
          </button>
        </div>

        {/* =========================================================================
            4. "MY GAMES" HORIZONTAL SCROLL (5 CARDS):
            Tarneeb (locked/greyed out), Complex, Trix Complex (highlighted with gold border, main game),
            Trix, Trix Partner. Below each: red heart icon ❤️. Only Trix variants are clickable; others show "قريبا".
            ========================================================================= */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-wide">My games</h3>
            <span className="text-[11px] text-gray-400">
              {filteredMyGames.length} games
            </span>
          </div>

          {/* Horizontal scrollable row with 5 cards */}
          <div className="w-full flex items-start gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x">
            {filteredMyGames.map((game) => {
              const isFav = favoriteGames[game.id] ?? false;
              const isLocked = game.locked;

              return (
                <div
                  key={game.id}
                  onClick={() => {
                    if (isLocked) {
                      handleLockedClick(game.name);
                    } else if (game.variant) {
                      onSelectGame(game.variant);
                    }
                  }}
                  className={`flex flex-col items-center shrink-0 w-[78px] snap-start transition-transform ${
                    isLocked
                      ? 'cursor-pointer opacity-75'
                      : 'cursor-pointer hover:scale-105 active:scale-95'
                  }`}
                >
                  {/* Card Container 78x78px */}
                  <div
                    className={`relative w-[78px] h-[78px] rounded-2xl p-1.5 flex flex-col justify-between overflow-hidden shadow-lg ${
                      game.pattern
                    } ${
                      game.isMain
                        ? 'border-2 border-[#FFD700] ring-2 ring-[#FFD700]/50 shadow-[0_0_15px_rgba(255,215,0,0.5)]'
                        : 'border border-white/10'
                    }`}
                  >
                    {/* Top yellow tag if present */}
                    {game.badge && (
                      <div className="self-center -mt-0.5 px-1.5 py-0.2 rounded-xs bg-[#FACC15] text-black font-black text-[8px] uppercase tracking-wider shadow-xs">
                        {game.badge}
                      </div>
                    )}

                    {/* Middle Card / Pieces Visual Graphic */}
                    <div className="flex-1 flex items-center justify-center">
                      <div className="flex items-center justify-center -space-x-1">
                        <div className="w-6 h-9 rounded bg-white text-black font-bold text-[9px] flex items-center justify-center shadow-md border border-black/10">
                          {game.cardsPreview.split(' ')[0]}
                        </div>
                        <div className="w-6 h-9 rounded bg-white text-[#DC2626] font-bold text-[9px] flex items-center justify-center shadow-md border border-black/10">
                          {game.cardsPreview.split(' ')[1]}
                        </div>
                      </div>
                    </div>

                    {/* Locked Badge Overlay for non-Trix variants */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-2xs flex flex-col items-center justify-center gap-0.5">
                        <Lock className="w-4 h-4 text-[#FACC15]" />
                        <span className="text-[9px] font-black text-[#FACC15] leading-none">
                          قريباً · Soon
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Label below card */}
                  <span className="mt-1.5 text-xs font-bold text-white text-center leading-tight truncate w-full">
                    {game.name}
                  </span>

                  {/* Red heart below label */}
                  <button
                    onClick={(e) => toggleFavorite(game.id, e)}
                    className="mt-0.5 text-[#EF4444] hover:scale-110 transition-transform cursor-pointer"
                    title="Toggle Favorite"
                    aria-label={`Favorite ${game.name}`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-[#EF4444]' : 'text-gray-500'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            5. "ALL GAMES" SECTION:
            Dark rows matching theme #242A36
            ========================================================================= */}
        <div className="w-full flex flex-col gap-2">
          <h3 className="text-sm font-bold text-white tracking-wide">All games</h3>

          {/* List container in #242A36 */}
          <div className="w-full bg-[#242A36] rounded-2xl border border-white/10 divide-y divide-white/5 overflow-hidden shadow-lg">
            {filteredAllGames.map((game) => {
              const isLocked = game.locked;
              const isFav = favoriteGames[game.id] ?? false;

              return (
                <div
                  key={game.id}
                  onClick={() => {
                    if (isLocked) {
                      handleLockedClick(game.name);
                    } else if (game.variant) {
                      onSelectGame(game.variant);
                    }
                  }}
                  className={`w-full p-3 flex items-center justify-between transition-colors ${
                    isLocked
                      ? 'opacity-75 cursor-pointer hover:bg-white/5'
                      : 'hover:bg-white/5 cursor-pointer active:bg-white/10'
                  }`}
                >
                  {/* Left: Thumbnail Icon + Game Title */}
                  <div className="flex items-center gap-3">
                    {/* Game Card Icon */}
                    <div
                      className={`w-12 h-12 rounded-xl ${game.color} p-1 flex items-center justify-center shrink-0 shadow-md border border-white/10`}
                    >
                      <div className="flex -space-x-1">
                        <div className="w-4 h-6 rounded bg-white text-black font-bold text-[8px] flex items-center justify-center shadow-xs">
                          {game.cardsPreview.split(' ')[0]}
                        </div>
                        <div className="w-4 h-6 rounded bg-white text-[#DC2626] font-bold text-[8px] flex items-center justify-center shadow-xs">
                          {game.cardsPreview.split(' ')[1]}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {game.name}
                        </span>
                        {isLocked && (
                          <span className="px-1.5 py-0.2 rounded bg-black/40 text-[9px] font-bold text-[#FACC15] border border-white/10">
                            {game.badge}
                          </span>
                        )}
                        {!isLocked && game.badge && (
                          <span className="px-1.5 py-0.2 rounded bg-[#22C55E]/20 text-[9px] font-bold text-[#22C55E] border border-[#22C55E]/30">
                            {game.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {game.nameAr}
                      </span>
                    </div>
                  </div>

                  {/* Right: Heart + Play CTA / Chevron */}
                  <div className="flex items-center gap-2.5">
                    {!isLocked ? (
                      <button
                        onClick={() => game.variant && onSelectGame(game.variant)}
                        className="px-3 py-1 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        Play
                      </button>
                    ) : (
                      <span className="text-[11px] font-black text-[#FACC15] bg-black/50 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[#FACC15]" />
                        <span>قريباً · Soon</span>
                      </span>
                    )}
                    <button
                      onClick={(e) => toggleFavorite(game.id, e)}
                      className="p-1 text-[#EF4444] hover:scale-110 transition-transform cursor-pointer"
                      title="Favorite"
                      aria-label="Favorite"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-[#EF4444]' : 'text-gray-500'}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          6. BOTTOM NAVIGATION (5 ICONS):
          Store badge 3, Games selected green (with cards popping out),
          Home, Clubs, Events badge 1.
          ========================================================================= */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#161922] border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="w-full max-w-[480px] mx-auto px-4 py-2 flex items-center justify-between">
          {/* 1. Store with red badge 3 */}
          <button
            onClick={() => {
              setActiveNavTab('store');
              onOpenDeposit();
            }}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeNavTab === 'store' ? 'text-[#22C55E]' : 'text-gray-400 hover:text-white'
            }`}
            title="Store"
            aria-label="Store"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[#EF4444] text-white font-black text-[9px] flex items-center justify-center border border-[#161922]">
                3
              </span>
            </div>
            <span className="text-[10px] font-bold">Store</span>
          </button>

          {/* 2. Games (Elevated active button with 3 playing cards popping out) */}
          <button
            onClick={() => setActiveNavTab('games')}
            className="relative -top-2 flex flex-col items-center cursor-pointer group"
            title="Games"
            aria-label="Games"
          >
            {/* 3 Playing cards popping out */}
            <div className="relative w-12 h-7 flex items-center justify-center">
              <div className="absolute -left-0.5 -rotate-15 w-4 h-6 rounded bg-white text-black font-bold text-[7px] flex items-center justify-center shadow-md border border-black/10">
                A♠
              </div>
              <div className="absolute rotate-0 z-10 w-4 h-6 rounded bg-white text-[#DC2626] font-bold text-[7px] flex items-center justify-center shadow-md border border-black/10">
                K♥
              </div>
              <div className="absolute -right-0.5 rotate-15 w-4 h-6 rounded bg-white text-[#DC2626] font-bold text-[7px] flex items-center justify-center shadow-md border border-black/10">
                Q♦
              </div>
            </div>

            {/* Green rounded pill container */}
            <div className="px-3.5 py-1 rounded-xl bg-[#22C55E] text-white font-black text-[11px] shadow-lg shadow-green-600/40 group-hover:bg-[#16A34A] transition-colors">
              Games
            </div>
          </button>

          {/* 3. Home (Returns to clashofcoin.bet main arena) */}
          <button
            onClick={() => {
              setActiveNavTab('home');
              if (onReturnHome) onReturnHome();
            }}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeNavTab === 'home' ? 'text-[#22C55E]' : 'text-gray-400 hover:text-white'
            }`}
            title="Home"
            aria-label="Home"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              {/* Jester Hat Icon SVG */}
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M12 2L15 8L20 4L18 12L22 15L16 17L12 22L8 17L2 15L6 12L4 4L9 8L12 2Z" />
              </svg>
            </div>
            <span className="text-[10px] font-bold">Home</span>
          </button>

          {/* 4. Clubs */}
          <button
            onClick={() => {
              setActiveNavTab('clubs');
              setLockedToast('Clubs: قريباً');
              setTimeout(() => setLockedToast(null), 2500);
            }}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeNavTab === 'clubs' ? 'text-[#22C55E]' : 'text-gray-400 hover:text-white'
            }`}
            title="Clubs"
            aria-label="Clubs"
          >
            <div className="relative">
              <Shield className="w-5 h-5" />
              <div className="absolute inset-0 flex items-center justify-center text-[7px] text-[#FACC15] font-black">
                ★
              </div>
            </div>
            <span className="text-[10px] font-bold">Clubs</span>
          </button>

          {/* 5. Events with red badge 1 (Opens Leaderboard) */}
          <button
            onClick={() => {
              setActiveNavTab('events');
              onOpenLeaderboard();
            }}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeNavTab === 'events' ? 'text-[#22C55E]' : 'text-gray-400 hover:text-white'
            }`}
            title="Events"
            aria-label="Events"
          >
            <div className="relative">
              <Trophy className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[#EF4444] text-white font-black text-[9px] flex items-center justify-center border border-[#161922]">
                1
              </span>
            </div>
            <span className="text-[10px] font-bold">Events</span>
          </button>
        </div>
      </div>
    </div>
  );
};
