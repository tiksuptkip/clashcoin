/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import './i18n';

// Types
import {
  CoinSymbol,
  RoundDuration,
  ConnectedWalletState,
  UserProfile,
  AdminSettings,
  PredictionSide,
  Round,
} from './types';

// Services
import { binanceFeed, PriceTick } from './services/binanceSocket';
import { storage } from './services/storage';
import { soundManager } from './services/sound';

// Components
import { Header } from './components/Header';
import { TopArenaBar } from './components/TopArenaBar';
import { TeamDownBox } from './components/TeamDownBox';
import { TeamUpBox } from './components/TeamUpBox';
import { CenterChartBox } from './components/CenterChartBox';
import { BottomBetBar } from './components/BottomBetBar';
import { LandscapeNotice } from './components/LandscapeNotice';
import { HamburgerMenuModal } from './components/HamburgerMenuModal';
import { RulesModal } from './components/RulesModal';
import { SecretAdmin } from './components/SecretAdmin';
import { ConnectWalletModal } from './components/ConnectWalletModal';
import { AuthModal } from './components/AuthModal';
import { ProvablyFairModal } from './components/ProvablyFairModal';
import { ProfileModal } from './components/ProfileModal';
import { DepositModal } from './components/DepositModal';
import { WalletPage } from './components/WalletPage';
import { HistoryPage } from './components/HistoryPage';
import { DashboardPage } from './components/DashboardPage';
import { TopModeSwitcher, MainAppMode } from './components/TopModeSwitcher';
import { CrashGame } from './components/CrashGame';
import { SportsBetting } from './components/SportsBetting';

import { Trophy, AlertCircle, CheckCircle, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';

export default function App() {
  const { t, i18n } = useTranslation();

  // Navigation tab for player site
  const [currentTab, setCurrentTab] = useState<'arena' | 'wallet' | 'history' | 'dashboard'>('arena');

  // Main mode switcher (crypto arena, crash/aviator, sportsbook)
  const [mainMode, setMainMode] = useState<MainAppMode>('crypto');

  // Secret Admin route state (/admin and /admin/dashboard)
  const [adminRoute, setAdminRoute] = useState<'/admin' | '/admin/dashboard' | null>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || path === '/admin/dashboard') {
        return path as '/admin' | '/admin/dashboard';
      }
      if (hash === '#/admin' || hash === '#/admin/dashboard') {
        return hash.replace('#', '') as '/admin' | '/admin/dashboard';
      }
    }
    return null;
  });

  // Pause battle rounds state controlled by admin
  const [isRoundsPaused, setIsRoundsPaused] = useState(false);

  // Selected coin in arena
  const [selectedCoin, setSelectedCoin] = useState<CoinSymbol>('BTC');

  // App-level state from storage
  const [user, setUser] = useState<UserProfile>(storage.getUser());
  const [settings, setSettings] = useState<AdminSettings>(storage.getSettings());
  const [walletState, setWalletState] = useState<ConnectedWalletState>(storage.getWalletState());
  const [bets, setBets] = useState(storage.getBets());
  const [withdrawals, setWithdrawals] = useState(storage.getWithdrawals());
  const [deposits, setDeposits] = useState(storage.getDeposits());

  // Current active round for the selected coin (default duration: 30s)
  const [activeRound, setActiveRound] = useState(storage.getRound(selectedCoin));
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [selectedBetAmount, setSelectedBetAmount] = useState<number>(20);

  // Live prices and 24h changes from Binance WebSocket
  const [prices, setPrices] = useState<Record<CoinSymbol, number>>({
    BTC: binanceFeed.getLatestPrice('BTC') || 64250.0,
    ETH: binanceFeed.getLatestPrice('ETH') || 3480.5,
    SOL: binanceFeed.getLatestPrice('SOL') || 152.2,
    BNB: binanceFeed.getLatestPrice('BNB') || 585.8,
    XRP: binanceFeed.getLatestPrice('XRP') || 0.584,
  });

  const [changes, setChanges] = useState<Record<CoinSymbol, number>>({
    BTC: 2.45,
    ETH: 1.82,
    SOL: 4.15,
    BNB: -0.45,
    XRP: 0.95,
  });

  // Modals state
  const [hamburgerMenuOpen, setHamburgerMenuOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [connectWalletOpen, setConnectWalletOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [provablyFairOpen, setProvablyFairOpen] = useState(false);
  const [inspectRoundId, setInspectRoundId] = useState<string | null>(null);

  // Toast notifications
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'win';
    message: string;
  } | null>(null);

  // Listen to browser URL changes for secret admin navigation
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || path === '/admin/dashboard') {
        setAdminRoute(path as '/admin' | '/admin/dashboard');
      } else if (hash === '#/admin' || hash === '#/admin/dashboard') {
        setAdminRoute(hash.replace('#', '') as '/admin' | '/admin/dashboard');
      } else {
        setAdminRoute(null);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleAdminNavigate = (route: '/admin' | '/admin/dashboard' | '/') => {
    if (route === '/') {
      setAdminRoute(null);
      window.history.pushState(null, '', '/');
    } else {
      setAdminRoute(route);
      window.history.pushState(null, '', route);
    }
  };

  // Synchronize active coin with Binance Feed
  useEffect(() => {
    binanceFeed.setActiveCoin(selectedCoin);
    const round = storage.getRound(selectedCoin);
    setActiveRound({ ...round });

    // Sync current remaining time
    const remaining = Math.max(0, Math.floor((round.endTime - Date.now()) / 1000));
    setTimeLeft(remaining);
  }, [selectedCoin]);

  // Subscribe to real-time prices for all 5 coins
  useEffect(() => {
    const coins: CoinSymbol[] = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];
    const unsubs = coins.map((c) =>
      binanceFeed.subscribePrice(c, (tick: PriceTick) => {
        setPrices((prev) => ({ ...prev, [c]: tick.price }));
        setChanges((prev) => ({ ...prev, [c]: tick.change24h }));
      })
    );

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  // Main Battle Round Countdown & Settlement Loop (Real Mode)
  useEffect(() => {
    if (isRoundsPaused) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const currentCoinRound = storage.getRound(selectedCoin);

      if (!currentCoinRound) return;

      const remaining = Math.max(0, Math.floor((currentCoinRound.endTime - now) / 1000));
      setTimeLeft(remaining);

      // Play tick sound every second in the last 10 seconds of countdown
      if (remaining <= 10 && remaining > 0) {
        soundManager.playTick();
      }

      // Check if round ended
      if (remaining <= 0) {
        // Settle the round using current Binance price
        const currentPrice = binanceFeed.getLatestPrice(selectedCoin);
        const { winningSide, userWon, payout } = storage.settleRound(selectedCoin, currentPrice);

        // Check if user participated on losing side
        const hadBet = currentCoinRound.participants.some((p) => p.isUser);

        // Play victory fanfare or loss sound
        if (userWon) {
          soundManager.playWin();
        } else if (hadBet) {
          soundManager.playLose();
        }

        // Update local state
        setUser({ ...storage.getUser() });
        setBets([...storage.getBets()]);
        setWalletState({ ...storage.getWalletState() });

        // Show celebratory confetti if any user won
        const isAr = i18n.language === 'ar';
        if (userWon) {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.55 },
            colors: ['#10B981', '#34D399', '#F59E0B', '#FFFBEB'],
          });
          showNotification(
            'win',
            isAr
              ? `فوز! توقعك لـ ${winningSide === 'UP' ? 'الصعود' : 'الهبوط'} انتصر! العائد: $${payout.toFixed(2)} USDT`
              : `WIN! Your ${winningSide} prediction won! Payout: $${payout.toFixed(2)} USDT`
          );
        } else if (currentCoinRound.participants.length > 0) {
          showNotification(
            'success',
            isAr
              ? `انتهت الجولة #${currentCoinRound.id.slice(-6)}: فوز فريق ${winningSide === 'UP' ? 'الصعود' : 'الهبوط'}`
              : `Round #${currentCoinRound.id.slice(-6)} ended: Team ${winningSide} won`
          );
        }

        // Fresh round generated by storage (starts automatically)
        const nextRound = storage.getRound(selectedCoin);
        setActiveRound({ ...nextRound });
        setTimeLeft(nextRound.duration);
        soundManager.playRoundStart();
      } else {
        // Active round ongoing: check if status changed to LOCKED (last 3s for fast rounds)
        if (remaining <= 3 && currentCoinRound.status !== 'LOCKED') {
          currentCoinRound.status = 'LOCKED';
          setActiveRound({ ...currentCoinRound });
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedCoin, isRoundsPaused]);

  const showNotification = (type: 'success' | 'error' | 'win', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // Duration change handler (15s, 30s, 45s, 60s)
  const handleSelectDuration = (newDuration: RoundDuration) => {
    const isAr = i18n.language === 'ar';
    const currentPrice = prices[selectedCoin];
    const newRound = storage.setRoundDuration(selectedCoin, newDuration, currentPrice);
    setActiveRound({ ...newRound });
    setTimeLeft(newDuration);
    soundManager.playRoundStart();
    showNotification('success', isAr ? `مدة الجولة: ${newDuration} ثانية` : `Round duration: ${newDuration} seconds`);
  };

  // Place Bet handler
  const handlePlaceBet = (side: PredictionSide, amount: number, source: 'SITE_BALANCE' | 'WEB3_WALLET') => {
    const isAr = i18n.language === 'ar';
    if (isRoundsPaused) {
      showNotification('error', isAr ? 'تم تجميد الجولات مؤقتاً من قبل الإدارة.' : 'Rounds are temporarily paused by administration.');
      return;
    }

    const res = storage.placeBet(selectedCoin, side, amount, source);

    if (!res.success) {
      showNotification('error', isAr ? (res.error || 'فشل تسجيل الرهان.') : (res.error || 'Failed to place bet.'));
      return;
    }

    // Play place bet sound
    soundManager.playPlaceBet();

    // Refresh state
    setUser({ ...storage.getUser() });
    setWalletState({ ...storage.getWalletState() });
    setBets([...storage.getBets()]);
    setActiveRound({ ...storage.getRound(selectedCoin) });

    // Subtle spark confetti on bet placed
    confetti({
      particleCount: 25,
      spread: 40,
      origin: { y: 0.7 },
      colors: side === 'UP' ? ['#10B981', '#34D399'] : ['#EF4444', '#F87171'],
    });

    showNotification(
      'success',
      isAr
        ? `تم تسجيل رهانك: $${amount} على ${side === 'UP' ? 'الصعود' : 'الهبوط'} في حلبة ${selectedCoin}/USDT!`
        : `Bet placed: $${amount} on ${side} in ${selectedCoin}/USDT arena!`
    );
  };

  // Wallet Connection Handlers
  const handleConnectWallet = (
    walletName: ConnectedWalletState['walletName'],
    address: string,
    balanceUSDT: number
  ) => {
    const isAr = i18n.language === 'ar';
    storage.setWalletConnected(walletName, address, balanceUSDT);
    setWalletState({ ...storage.getWalletState() });
    setUser({ ...storage.getUser() });
    showNotification('success', isAr ? `تم ربط ${walletName} بنجاح` : `${walletName} connected successfully`);
  };

  const handleDisconnectWallet = () => {
    const isAr = i18n.language === 'ar';
    storage.disconnectWallet();
    setWalletState({ ...storage.getWalletState() });
    showNotification('success', isAr ? 'تم فصل المحفظة.' : 'Wallet disconnected.');
  };

  // User Profile updates
  const handleUpdateUser = (updatedData: Partial<UserProfile>) => {
    const isAr = i18n.language === 'ar';
    const updated = storage.updateUser(updatedData);
    setUser({ ...updated });
    showNotification('success', isAr ? 'تم حفظ بيانات الحساب.' : 'Account profile saved successfully.');
  };

  const handleAdminUpdateBalance = (newBalance: number) => {
    const updated = storage.updateUser({ balance: Number(newBalance.toFixed(2)) });
    setUser({ ...updated });
  };

  // Withdrawal & Deposit Handlers
  const handleRequestWithdrawal = (amount: number, network: 'TRC20' | 'BEP20', address: string) => {
    const isAr = i18n.language === 'ar';
    storage.requestWithdrawal(amount, 'CRYPTO', { network, userAccount: address, currency: 'USD' });
    setUser({ ...storage.getUser() });
    setWithdrawals([...storage.getWithdrawals()]);
    showNotification('success', isAr ? `تم إرسال طلب سحب $${amount} (قيد التدقيق)` : `Withdrawal request for $${amount} submitted (under review)`);
  };

  const handleSimulateDeposit = (amount: number, network: 'TRC20' | 'BEP20') => {
    const isAr = i18n.language === 'ar';
    storage.addDeposit(amount, 'CRYPTO', { network, address: 'TN3W4H8d7ClashOfCoinUSDTTRC20x892019', currency: 'USD' });
    setUser({ ...storage.getUser() });
    setDeposits([...storage.getDeposits()]);
    showNotification('success', isAr ? `NOWPayments: تم إيداع $${amount} في رصيدك فوراً!` : `NOWPayments: $${amount} deposited to balance instantly!`);
  };

  // Admin Handlers
  const handleUpdateAdminSettings = (newSettings: Partial<AdminSettings>) => {
    const isAr = i18n.language === 'ar';
    const updated = storage.updateSettings(newSettings);
    setSettings({ ...updated });
    showNotification('success', isAr ? 'تم تحديث نسبة ربح المنصة والرسوم.' : 'House commission and fee settings updated.');
  };

  const handleApproveWithdrawal = (id: string) => {
    const isAr = i18n.language === 'ar';
    storage.approveWithdrawal(id);
    setWithdrawals([...storage.getWithdrawals()]);
    showNotification('success', isAr ? `تمت الموافقة على السحب #${id.slice(-6)}.` : `Withdrawal #${id.slice(-6)} approved.`);
  };

  const handleRejectWithdrawal = (id: string) => {
    const isAr = i18n.language === 'ar';
    storage.rejectWithdrawal(id);
    setUser({ ...storage.getUser() });
    setWithdrawals([...storage.getWithdrawals()]);
    showNotification('success', isAr ? `تم رفض السحب #${id.slice(-6)} وإعادة المبلغ للرصيد.` : `Withdrawal #${id.slice(-6)} rejected and refunded to balance.`);
  };

  const handleApproveDeposit = (id: string) => {
    const isAr = i18n.language === 'ar';
    const success = storage.approveDeposit(id);
    if (success) {
      setUser({ ...storage.getUser() });
      setDeposits([...storage.getDeposits()]);
      showNotification('success', isAr ? 'تمت الموافقة على طلب الإيداع وإضافة الرصيد بنجاح!' : 'Deposit approved and credited to balance!');
    }
  };

  const handleRejectDeposit = (id: string) => {
    const isAr = i18n.language === 'ar';
    const success = storage.rejectDeposit(id);
    if (success) {
      setDeposits([...storage.getDeposits()]);
      showNotification('success', isAr ? 'تم رفض طلب الإيداع.' : 'Deposit rejected.');
    }
  };

  // If URL route is secret /admin or /admin/dashboard, render SecretAdmin exclusively
  if (adminRoute) {
    const allRoundsList: Round[] = (['BTC', 'ETH', 'SOL', 'BNB', 'XRP'] as CoinSymbol[]).map((c) =>
      storage.getRound(c)
    );

    return (
      <SecretAdmin
        currentSubRoute={adminRoute}
        onNavigate={handleAdminNavigate}
        settings={settings}
        onUpdateSettings={handleUpdateAdminSettings}
        user={user}
        onUpdateUserBalance={handleAdminUpdateBalance}
        rounds={allRoundsList}
        isRoundsPaused={isRoundsPaused}
        onToggleRoundsPaused={() => setIsRoundsPaused(!isRoundsPaused)}
        withdrawals={withdrawals}
        deposits={deposits}
        onApproveWithdrawal={handleApproveWithdrawal}
        onRejectWithdrawal={handleRejectWithdrawal}
        onApproveDeposit={handleApproveDeposit}
        onRejectDeposit={handleRejectDeposit}
      />
    );
  }

  const currentCoinPrice = prices[selectedCoin] || 0;
  const isLocked = timeLeft <= 3;
  const priceDiff = currentCoinPrice - activeRound.entryPrice;
  const priceDiffPercent = activeRound.entryPrice > 0 ? (priceDiff / activeRound.entryPrice) * 100 : 0;
  const isUp = priceDiff >= 0;

  const upParticipants = activeRound.participants.filter((p) => p.side === 'UP');
  const downParticipants = activeRound.participants.filter((p) => p.side === 'DOWN');

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen flex flex-col bg-[#FFFBF0] text-[#1F2937] overflow-x-hidden w-full select-none">
      {/* 1. Mobile Portrait Orientation Lock Prompt */}
      <LandscapeNotice />

      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-14 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
          <div
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl border text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-200 ${
              notification.type === 'win'
                ? 'bg-[#10B981] text-white border-[#059669]'
                : notification.type === 'error'
                ? 'bg-[#EF4444] text-white border-[#DC2626]'
                : 'bg-[#1F2937] text-white border-[#374151]'
            }`}
          >
            {notification.type === 'win' ? (
              <Trophy className="w-5 h-5 text-[#FDE68A] shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Top Bar: Logo + Wallet Connect + Hamburger Menu (☰) */}
      <Header
        walletState={walletState}
        user={user}
        onOpenConnectWallet={() => setConnectWalletOpen(true)}
        onDisconnectWallet={handleDisconnectWallet}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenMenu={() => setHamburgerMenuOpen(true)}
      />

      {/* 1. Top Mode Switcher Bar: 🪙 معركة العملات | ✈️ لعبة الطائرة | ⚽ الدوري المصري */}
      <TopModeSwitcher
        activeMode={mainMode}
        onChangeMode={(mode) => {
          setMainMode(mode);
          setCurrentTab('arena');
        }}
        liveSportsCount={2}
      />

      {/* Main Single-Screen View: Homepage Mode Switcher View */}
      {currentTab === 'arena' ? (
        mainMode === 'crypto' ? (
          <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 py-1.5 flex flex-col justify-between overflow-hidden">
            {/* 1. TOP BAR (one line): [LEFT: "DOWN" in red] [CENTER: Timer 0:15 big 36px] [RIGHT: "UP" in green] */}
            <TopArenaBar
              timeLeftSeconds={timeLeft}
              isLocked={isLocked}
              upPool={activeRound.upPool}
              downPool={activeRound.downPool}
              selectedCoin={selectedCoin}
              onSelectCoin={setSelectedCoin}
              prices={prices}
              duration={activeRound.duration}
              onSelectDuration={handleSelectDuration}
              commission={settings.houseCommission}
            />

            {/* 2. MAIN ARENA - 3 COLUMNS:
                - LEFT COLUMN (25%): Red border rectangle. Title "Team DOWN". Inside: live scrollable list of bettors on DOWN.
                - CENTER COLUMN (50%): TradingView BTC chart only, no timer over it. Clean chart.
                - RIGHT COLUMN (25%): Green border rectangle. Title "Team UP". Inside: live scrollable list of bettors on UP. */}
            <div
              dir="ltr"
              className="w-full flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3 items-stretch overflow-hidden"
            >
              {/* LEFT COLUMN (25%): Red border rectangle */}
              <div className="md:col-span-3 h-full min-h-0 order-2 md:order-1">
                <TeamDownBox
                  participants={activeRound.participants}
                  totalPool={activeRound.downPool}
                  opposingPool={activeRound.upPool}
                  commission={settings.houseCommission}
                  userBalance={user.balance}
                  walletBalance={walletState.balanceUSDT}
                  isWalletConnected={walletState.isConnected}
                  isLocked={isLocked}
                  selectedBetAmount={selectedBetAmount}
                  onPlaceBet={(amt, source) => handlePlaceBet('DOWN', amt, source)}
                />
              </div>

              {/* CENTER COLUMN (50%): TradingView BTC chart only, no timer over it. Clean chart. */}
              <div className="md:col-span-6 h-full min-h-0 order-1 md:order-2">
                <CenterChartBox
                  coin={selectedCoin}
                  entryPrice={activeRound.entryPrice}
                  currentPrice={currentCoinPrice}
                  roundStatus={activeRound.status}
                  upPool={activeRound.upPool}
                  downPool={activeRound.downPool}
                  change24h={changes[selectedCoin] || 0}
                />
              </div>

              {/* RIGHT COLUMN (25%): Green border rectangle */}
              <div className="md:col-span-3 h-full min-h-0 order-3 md:order-3">
                <TeamUpBox
                  participants={activeRound.participants}
                  totalPool={activeRound.upPool}
                  opposingPool={activeRound.downPool}
                  commission={settings.houseCommission}
                  userBalance={user.balance}
                  walletBalance={walletState.balanceUSDT}
                  isWalletConnected={walletState.isConnected}
                  isLocked={isLocked}
                  selectedBetAmount={selectedBetAmount}
                  onPlaceBet={(amt, source) => handlePlaceBet('UP', amt, source)}
                />
              </div>
            </div>

            {/* 3. BOTTOM BAR: Centered bet amount buttons */}
            <BottomBetBar
              selectedAmount={selectedBetAmount}
              onSelectAmount={setSelectedBetAmount}
              userBalance={user.balance}
              walletBalance={walletState.balanceUSDT}
              isWalletConnected={walletState.isConnected}
              isLocked={isLocked}
            />
          </main>
        ) : mainMode === 'crash' ? (
          <main className="flex-1 w-full overflow-y-auto">
            <CrashGame
              user={user}
              walletState={walletState}
              onUpdateUser={handleUpdateUser}
              onShowNotification={showNotification}
              onOpenDepositModal={() => setDepositModalOpen(true)}
            />
          </main>
        ) : (
          <main className="flex-1 w-full overflow-y-auto">
            <SportsBetting
              user={user}
              walletState={walletState}
              onUpdateUser={handleUpdateUser}
              onShowNotification={showNotification}
            />
          </main>
        )
      ) : (
        /* Secondary Pages reached through Hamburger Menu (Wallet, History, Dashboard) */
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 overflow-y-auto">
          <div className="mb-4">
            <button
              onClick={() => setCurrentTab('arena')}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#F5F2EB] hover:bg-[#E6E1D5] rounded-xl text-xs font-bold text-[#1F2937] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{i18n.language === 'ar' ? 'العودة إلى الحلبة الرئيسية' : 'Back to Main Arena'}</span>
            </button>
          </div>

          {currentTab === 'wallet' && (
            <WalletPage
              user={user}
              walletState={walletState}
              deposits={deposits}
              withdrawals={withdrawals}
              withdrawalFeeRate={settings.withdrawalFee}
              onOpenConnectWallet={() => setConnectWalletOpen(true)}
              onDisconnectWallet={handleDisconnectWallet}
              onRequestWithdrawal={handleRequestWithdrawal}
              onSimulateDeposit={handleSimulateDeposit}
            />
          )}

          {currentTab === 'history' && (
            <HistoryPage
              bets={bets}
              onOpenProvablyFairForRound={(rId) => {
                setInspectRoundId(rId);
                setProvablyFairOpen(true);
              }}
            />
          )}

          {currentTab === 'dashboard' && (
            <DashboardPage
              user={user}
              walletState={walletState}
              bets={bets}
              onGoToArena={() => setCurrentTab('arena')}
              onOpenConnectWallet={() => setConnectWalletOpen(true)}
              onUpdateUser={handleUpdateUser}
            />
          )}
        </main>
      )}

      {/* Modals */}
      <HamburgerMenuModal
        isOpen={hamburgerMenuOpen}
        onClose={() => setHamburgerMenuOpen(false)}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenProvablyFair={() => setProvablyFairOpen(true)}
        onOpenRules={() => setRulesModalOpen(true)}
        walletState={walletState}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      <RulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
      />

      <ConnectWalletModal
        isOpen={connectWalletOpen}
        onClose={() => setConnectWalletOpen(false)}
        onConnect={handleConnectWallet}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
        onConnectWallet={() => {
          setAuthModalOpen(false);
          setConnectWalletOpen(true);
        }}
        isWalletConnected={walletState.isConnected}
        walletAddress={walletState.address}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
      />

      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        user={user}
        settings={settings}
        onDepositSuccess={() => {
          setUser({ ...storage.getUser() });
          setDeposits([...storage.getDeposits()]);
        }}
        onShowNotification={showNotification}
      />

      <ProvablyFairModal
        isOpen={provablyFairOpen}
        round={activeRound}
        onClose={() => {
          setProvablyFairOpen(false);
          setInspectRoundId(null);
        }}
      />
    </div>
  );
}
