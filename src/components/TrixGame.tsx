import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import {
  TrixCard,
  TrixGameMode,
  TrixGameState,
  TrixKingdomContract,
  PlayerPosition,
  TrixPlayer,
  TrixTrickPlay,
  TrixBotDifficulty,
} from '../types/trix';
import { SupportedCurrency, UserProfile, ConnectedWalletState, CurrencyBalances } from '../types';
import {
  createDeck,
  shuffleDeck,
  sortHand,
  initializeTrixGame,
  isValidTrickCard,
  isValidTrixCard,
  resolveTrickWinner,
  calculateContractPenalties,
  getBotMove,
  CONTRACT_NAMES,
  SUIT_SYMBOLS,
  BOT_NAMES,
} from '../services/trixGameEngine';
import { storage, normalizeCurrency } from '../services/storage';
import { soundManager } from '../services/sound';
import { TrixLeaderboard } from './TrixLeaderboard';
import { TrixLobby, TrixLobbyVariant } from './trix/TrixLobby';
import { TrixBettingSetup } from './trix/TrixBettingSetup';
import {
  Crown,
  Volume2,
  VolumeX,
  MessageSquare,
  Users,
  RotateCcw,
  Play,
  X,
  Sparkles,
  Trophy,
  ArrowLeft,
  LogOut,
  AlertTriangle,
  Bot,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

interface TrixGameProps {
  user: UserProfile | null;
  walletState: ConnectedWalletState;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onShowNotification: (type: 'success' | 'error' | 'win', message: string) => void;
  onOpenDepositModal: () => void;
  onReturnHome?: () => void;
}

// 8 Strict Anti-Cheat Preset Chat Options (No free typing, no private team channels)
const PRESET_CHAT_OPTIONS = [
  'برافو',
  'حظ أوفر',
  'ما معي',
  'العب بسرعة',
  'يلا شريك',
  'آسف',
  '🙂',
  '😡',
];

// Active Speech Bubble display interface
interface ActiveChatBubble {
  playerPos: PlayerPosition;
  text: string;
  expiresAt: number;
}

export const TrixGame: React.FC<TrixGameProps> = ({
  user,
  walletState,
  onUpdateUser,
  onShowNotification: propShowNotification,
  onOpenDepositModal,
  onReturnHome,
}) => {
  const onShowNotification = (
    typeOrObj: 'success' | 'error' | 'win' | { type: 'success' | 'error' | 'win'; message: string },
    maybeMsg?: string
  ) => {
    if (typeof typeOrObj === 'object') {
      propShowNotification(typeOrObj.type, typeOrObj.message);
    } else {
      propShowNotification(typeOrObj, maybeMsg || '');
    }
  };

  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // 3-View Flow: LOBBY -> BETTING_SETUP -> TABLE
  const [viewMode, setViewMode] = useState<'LOBBY' | 'BETTING_SETUP' | 'TABLE'>('LOBBY');
  const [selectedVariant, setSelectedVariant] = useState<TrixLobbyVariant>('TRIX_COMPLEX');

  // Currency & Balance
  const activeCurrency: SupportedCurrency = normalizeCurrency(
    user?.currency || (user?.country === 'JO' ? 'JOD' : 'EGP')
  );
  const [localBalances, setLocalBalances] = useState<CurrencyBalances>(() => storage.getCurrencyBalances());

  useEffect(() => {
    let currentUser = storage.getUser();
    if (!currentUser) {
      currentUser = storage.updateUser({
        id: 'usr_player_ole2tn',
        username: 'New-OLE2TN',
        display_name: 'New-OLE2TN',
        currency: activeCurrency,
        currencyBalances: { EGP: 1000, JOD: 50, USDT: 100 },
        balance: 1000,
        walletBalance: 1000,
      });
      onUpdateUser(currentUser);
      setLocalBalances({ ...storage.getCurrencyBalances() });
    } else {
      setLocalBalances({ ...storage.getCurrencyBalances() });
    }
  }, [user]);

  const currentBalance = localBalances[activeCurrency] ?? 0;

  const currencyConfig = useMemo(() => {
    switch (activeCurrency) {
      case 'JOD':
        return { minBet: 1, presets: [1, 2, 5, 10, 20], symbol: 'د.أ', label: 'دينار أردني (JOD)' };
      case 'EGP':
        return { minBet: 100, presets: [100, 200, 500, 1000, 2000], symbol: 'ج.م', label: 'جنيه مصري (EGP)' };
      case 'USDT':
      default:
        return { minBet: 5, presets: [5, 10, 25, 50, 100], symbol: 'USDT', label: 'USDT (Crypto)' };
    }
  }, [activeCurrency]);

  // Core Game State
  const [gameState, setGameState] = useState<TrixGameState | null>(null);
  const [selectedMode, setSelectedMode] = useState<TrixGameMode>('PARTNERSHIP');
  const [betAmount, setBetAmount] = useState<number>(currencyConfig.minBet);
  const [botDifficulty, setBotDifficulty] = useState<TrixBotDifficulty>('EXPERT');

  // Human user seat (0 = Bottom / Me)
  const [mySeatPos, setMySeatPos] = useState<PlayerPosition>(0);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  // Countdown & Modals
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showContractModal, setShowContractModal] = useState<boolean>(false);
  const [showScoreModal, setShowScoreModal] = useState<boolean>(false);
  const [showSeatsModal, setShowSeatsModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());

  // Room occupancy: track number of human vs smart AI bot seats
  const { humanCount, botCount } = useMemo(() => {
    if (!gameState) return { humanCount: 1, botCount: 3 };
    let humans = 0;
    let bots = 0;
    gameState.players.forEach((p) => {
      if (p.isBot === false || p.isUser) humans++;
      else bots++;
    });
    return { humanCount: humans, botCount: bots };
  }, [gameState]);

  // Anti-Cheat Chat State: Only presets, 2-sec floating bubble, per-player mute
  const [activeBubbles, setActiveBubbles] = useState<Record<number, ActiveChatBubble | null>>({
    0: null,
    1: null,
    2: null,
    3: null,
  });
  const [mutedPlayers, setMutedPlayers] = useState<Record<number, boolean>>({
    0: false,
    1: false,
    2: false,
    3: false,
  });
  const [showChatBar, setShowChatBar] = useState<boolean>(false);

  // Timers
  const botTurnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const trickResolveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevTurnPosRef = useRef<number | null>(null);

  // Find King (who holds 7♥ / 7 of Hearts)
  const currentKingPos = useMemo<PlayerPosition>(() => {
    if (!gameState) return 0;
    for (let i = 0; i < 4; i++) {
      if (gameState.players[i].hand.some((c) => c.suit === 'HEARTS' && c.rank === 7)) {
        return i as PlayerPosition;
      }
    }
    return gameState.kingdomOwnerPos ?? 0;
  }, [gameState]);

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      if (botTurnTimerRef.current) clearTimeout(botTurnTimerRef.current);
      if (trickResolveTimerRef.current) clearTimeout(trickResolveTimerRef.current);
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    };
  }, []);

  // Update default bet amount when active currency changes
  useEffect(() => {
    setBetAmount(currencyConfig.minBet);
  }, [currencyConfig]);

  // Audio Cue: Player turn start chime
  useEffect(() => {
    if (!gameState) {
      prevTurnPosRef.current = null;
      return;
    }
    const currentTurn = gameState.turnPlayerPos;
    const isPlaying = gameState.status === 'PLAYING_TRICK' || gameState.status === 'PLAYING_TRIX';

    if (isPlaying && currentTurn === mySeatPos && prevTurnPosRef.current !== mySeatPos) {
      soundManager.playPlayerTurnStart();
    }
    if (isPlaying) {
      prevTurnPosRef.current = currentTurn;
    }
  }, [gameState?.turnPlayerPos, gameState?.status, mySeatPos]);

  // -------------------------------------------------------------
  // 1. Start Game with 1 Real + 3 Bots after 3s Countdown
  // -------------------------------------------------------------
  const startNewTrixMatch = useCallback(
    (
      modeToUse: TrixGameMode = selectedMode,
      betAmt: number = betAmount,
      botDiff: TrixBotDifficulty = botDifficulty
    ) => {
      soundManager.playCardShuffle();
      const commissionRate = storage.getSettings().trixCommissionRate ?? 5.0;
      const initialGame = initializeTrixGame(
        modeToUse,
        activeCurrency,
        betAmt,
        user?.display_name || user?.username || 'New-USR77',
        user?.avatar_url,
        commissionRate,
        botDiff
      );

      // Ensure user profile exists in storage for bet deduction
      let currentUser = storage.getUser();
      if (!currentUser) {
        currentUser = {
          id: 'usr_player_ole2tn',
          username: user?.username || 'New-OLE2TN',
          display_name: user?.display_name || 'New-OLE2TN',
          currency: activeCurrency,
          balance: 120,
          walletBalance: 120,
          currencyBalances: { EGP: 1000, JOD: 50, USDT: 100 },
          country: activeCurrency === 'JOD' ? 'JO' : 'EG',
          createdAt: Date.now(),
        } as UserProfile;
        storage.updateUser(currentUser);
        onUpdateUser(currentUser);
      }

      // Deduct entry bet from user balance
      const betResult = storage.placeTrixRoomBet(betAmt, activeCurrency);
      if (!betResult.success) {
        onShowNotification('error', betResult.error || 'رصيدك غير كافٍ لدخول طاولة التركس');
        return;
      }
      setLocalBalances({ ...storage.getCurrencyBalances() });

      // Sync user profile balance
      const freshUser = storage.getUser();
      if (freshUser) {
        onUpdateUser({
          balance: freshUser.balance,
          currencyBalances: freshUser.currencyBalances,
        });
      }

      setGameState(initialGame);
      setViewMode('TABLE');
      setCountdown(3);

      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      let count = 3;
      countdownTimerRef.current = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
          soundManager.playClick();
        } else {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          setCountdown(null);
          soundManager.playCardShuffle();

          // If King is human, prompt contract modal, else bot auto-picks
          const king = initialGame.players.findIndex((p) =>
            p.hand.some((c) => c.suit === 'HEARTS' && c.rank === 7)
          );
          if (king === mySeatPos) {
            setShowContractModal(true);
          } else {
            setTimeout(() => {
              executeBotSelectContract(initialGame);
            }, 1000);
          }
        }
      }, 1000);
    },
    [selectedMode, betAmount, activeCurrency, user, botDifficulty, mySeatPos]
  );

  // Return to Lobby mid-game or after game: if mid-game, swap human seat with bot so game never stops
  const handleExitToLobby = () => {
    soundManager.playClick();
    if (gameState && gameState.status !== 'MATCH_END') {
      const updatedPlayers = gameState.players.map((p) =>
        p.position === mySeatPos ? { ...p, isUser: false, isBot: true, name: 'New-LUX01E' } : p
      );
      const botHandledState: TrixGameState = {
        ...gameState,
        players: updatedPlayers,
      };
      setGameState(botHandledState);
      if (gameState.turnPlayerPos === mySeatPos) {
        scheduleBotTurn(botHandledState);
      }
    }
    setViewMode('LOBBY');
  };

  // -------------------------------------------------------------
  // Smart AI Bot Fill-In & Live Hot-Swap Mechanics
  // Automatically fills empty seats when room has <4 players.
  // Seamlessly hot-swaps human <-> AI bot preserving hand & scores!
  // -------------------------------------------------------------
  const handleHotSwapSeat = (
    seatPos: PlayerPosition,
    newType: 'HUMAN' | 'BOT',
    customName?: string,
    customAvatar?: string
  ) => {
    if (!gameState) return;
    soundManager.playClick();

    const currentSeatPlayer = gameState.players[seatPos];
    if (!currentSeatPlayer) return;

    const HUMAN_PROFILES = [
      { name: 'طارق التميمي (Tariq)', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
      { name: 'سارة المصري (Sarah)', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
      { name: 'أحمد خالد (Ahmed)', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
      { name: 'عمر القاسم (Omar)', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
    ];

    let updatedPlayer: TrixPlayer;

    if (newType === 'HUMAN') {
      const defaultHuman = HUMAN_PROFILES[seatPos % HUMAN_PROFILES.length];
      const assignedName = customName || defaultHuman.name;
      const assignedAvatar = customAvatar || defaultHuman.avatar;

      updatedPlayer = {
        ...currentSeatPlayer,
        name: assignedName,
        avatar: assignedAvatar,
        isBot: false,
        isUser: seatPos === mySeatPos,
      };

      onShowNotification(
        'success',
        isAr
          ? `تم التبديل الفوري! انضم ${assignedName} للمقعد ${seatPos === 2 ? '(الشريك)' : `رقم ${seatPos + 1}`} واحتفظ بكامل أوراق اليد والنقاط.`
          : `Hot-swap complete! ${assignedName} took over seat ${seatPos + 1} with full hand and scores preserved.`
      );
    } else {
      const botPreset = BOT_NAMES[(seatPos - 1 + 4) % BOT_NAMES.length] || {
        name: `New-BOT${seatPos}`,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=Bot${seatPos}`,
      };

      updatedPlayer = {
        ...currentSeatPlayer,
        name: botPreset.name,
        avatar: botPreset.avatar,
        isBot: true,
        isUser: false,
      };

      onShowNotification(
        'success',
        isAr
          ? `تم تفعيل البوت الذكي لمقعد ${seatPos === 2 ? '(الشريك)' : `رقم ${seatPos + 1}`} بنجاح.`
          : `Smart AI Bot took over seat ${seatPos + 1} seamlessly.`
      );
    }

    const updatedPlayers = gameState.players.map((p) =>
      p.position === seatPos ? updatedPlayer : p
    );

    const updatedState: TrixGameState = {
      ...gameState,
      players: updatedPlayers,
    };

    setGameState(updatedState);

    // If newly swapped to a bot and it is currently this seat's turn, trigger bot play immediately!
    if (newType === 'BOT' && updatedState.turnPlayerPos === seatPos) {
      scheduleBotTurn(updatedState);
    } else if (newType === 'HUMAN' && updatedState.turnPlayerPos === seatPos) {
      if (botTurnTimerRef.current) clearTimeout(botTurnTimerRef.current);
    }
  };

  const handleSimulateScenario = (scenario: 'PARTNER_HUMAN' | 'THREE_HUMANS' | 'ALL_BOTS') => {
    if (!gameState) return;
    soundManager.playClick();

    if (scenario === 'PARTNER_HUMAN') {
      handleHotSwapSeat(2, 'HUMAN', 'طارق التميمي (Tariq)');
    } else if (scenario === 'THREE_HUMANS') {
      let updated = [...gameState.players];
      updated[1] = {
        ...updated[1],
        name: 'سارة المصري (Sarah)',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        isBot: false,
        isUser: false,
      };
      updated[2] = {
        ...updated[2],
        name: 'طارق التميمي (Tariq)',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        isBot: false,
        isUser: false,
      };
      updated[3] = {
        ...updated[3],
        name: BOT_NAMES[2].name,
        avatar: BOT_NAMES[2].avatar,
        isBot: true,
        isUser: false,
      };
      setGameState({ ...gameState, players: updated });
      onShowNotification(
        'success',
        isAr ? 'تم ضبط الغرفة: 3 لاعبين حقيقيين + 1 بوت ذكي (مقعد اليسار) بنجاح!' : 'Configured: 3 Humans + 1 Smart AI Bot!'
      );
    } else if (scenario === 'ALL_BOTS') {
      let updated = [...gameState.players];
      for (let i = 1; i <= 3; i++) {
        const botPreset = BOT_NAMES[(i - 1) % BOT_NAMES.length];
        updated[i] = {
          ...updated[i],
          name: botPreset.name,
          avatar: botPreset.avatar,
          isBot: true,
          isUser: false,
        };
      }
      setGameState({ ...gameState, players: updated });
      onShowNotification(
        'success',
        isAr ? 'تم ملء جميع المقاعد الشاغرة ببوتات ذكية متقدمة.' : 'All open seats filled with Smart AI bots.'
      );
      const nextTurnPlayer = updated[gameState.turnPlayerPos];
      if (nextTurnPlayer && nextTurnPlayer.isBot !== false && !nextTurnPlayer.isUser) {
        scheduleBotTurn({ ...gameState, players: updated });
      }
    }
  };

  // -------------------------------------------------------------
  // 2. King Kingdom Selection (5 Kingdoms)
  // -------------------------------------------------------------
  const handleSelectContract = (contract: TrixKingdomContract) => {
    if (!gameState) return;
    soundManager.playCardFlip();
    setShowContractModal(false);

    const playedSoFar = gameState.playedContractsByOwner[gameState.kingdomOwnerPos] || [];
    const updatedPlayed = {
      ...gameState.playedContractsByOwner,
      [gameState.kingdomOwnerPos]: [...playedSoFar, contract],
    };

    const updatedState: TrixGameState = {
      ...gameState,
      currentContract: contract,
      playedContractsByOwner: updatedPlayed,
      status: contract === 'TRIX' ? 'PLAYING_TRIX' : 'PLAYING_TRICK',
      currentTrick: [],
      leadSuit: null,
      roundLog: [`المملكة: ${CONTRACT_NAMES[contract].ar}`, ...gameState.roundLog.slice(0, 5)],
    };

    setGameState(updatedState);

    // If bot has the lead turn, trigger bot play
    const nextTurnPlayer = updatedState.players[updatedState.turnPlayerPos];
    if (nextTurnPlayer && nextTurnPlayer.isBot !== false && !nextTurnPlayer.isUser) {
      scheduleBotTurn(updatedState);
    }
  };

  const executeBotSelectContract = (state: TrixGameState) => {
    const ownerPos = state.kingdomOwnerPos;
    const bot = state.players[ownerPos];
    const played = state.playedContractsByOwner[ownerPos] || [];
    const available = (['BANAT', 'DINARI', 'LTOOSH', 'SHEIKH_KOBA', 'TRIX'] as TrixKingdomContract[]).filter(
      (c) => !played.includes(c)
    );

    let chosen: TrixKingdomContract = available[0] || 'TRIX';
    const hasSheikh = bot.hand.some((c) => c.suit === 'HEARTS' && c.rank === 13);
    const queensCount = bot.hand.filter((c) => c.rank === 12).length;
    const diamondsCount = bot.hand.filter((c) => c.suit === 'DIAMONDS').length;

    if (available.includes('SHEIKH_KOBA') && !hasSheikh) {
      chosen = 'SHEIKH_KOBA';
    } else if (available.includes('BANAT') && queensCount === 0) {
      chosen = 'BANAT';
    } else if (available.includes('DINARI') && diamondsCount <= 2) {
      chosen = 'DINARI';
    } else if (available.includes('TRIX')) {
      chosen = 'TRIX';
    }

    const updatedPlayed = {
      ...state.playedContractsByOwner,
      [ownerPos]: [...played, chosen],
    };

    const updatedState: TrixGameState = {
      ...state,
      currentContract: chosen,
      playedContractsByOwner: updatedPlayed,
      status: chosen === 'TRIX' ? 'PLAYING_TRIX' : 'PLAYING_TRICK',
      currentTrick: [],
      leadSuit: null,
      roundLog: [`اختار ${bot.name} مملكة: ${CONTRACT_NAMES[chosen].ar}`, ...state.roundLog.slice(0, 5)],
    };

    soundManager.playCardFlip();
    setGameState(updatedState);

    const nextTurnPlayer = updatedState.players[updatedState.turnPlayerPos];
    if (nextTurnPlayer && nextTurnPlayer.isBot !== false && !nextTurnPlayer.isUser) {
      scheduleBotTurn(updatedState);
    }
  };

  // -------------------------------------------------------------
  // 3. Card Play Logic (Human & Bots)
  // -------------------------------------------------------------
  const handlePlayUserCard = (card: TrixCard) => {
    if (!gameState || gameState.turnPlayerPos !== mySeatPos) return;

    // Validate legality
    const myPlayer = gameState.players[mySeatPos];
    const leadSuit = gameState.currentTrick.length > 0 ? gameState.currentTrick[0].card.suit : null;
    const sheikhPlayed = gameState.players.some((p) =>
      p.tricksWon.some((t) => t.some((c) => c.suit === 'HEARTS' && c.rank === 13))
    );

    if (gameState.currentContract === 'TRIX') {
      if (!isValidTrixCard(card, gameState.trixBoard)) {
        soundManager.playLose();
        return;
      }
    } else {
      if (!isValidTrickCard(card, myPlayer.hand, leadSuit, gameState.currentContract!, sheikhPlayed)) {
        soundManager.playLose();
        return;
      }
    }

    soundManager.playCardFlip();

    // Execute card play
    executePlayCard(mySeatPos, card);
  };

  const executePlayCard = (playerPos: PlayerPosition, card: TrixCard) => {
    if (!gameState) return;

    const player = gameState.players[playerPos];
    const newHand = player.hand.filter((c) => c.id !== card.id);
    const updatedPlayers = gameState.players.map((p) =>
      p.position === playerPos ? { ...p, hand: newHand } : p
    );

    // Trix Building Game Mode
    if (gameState.currentContract === 'TRIX') {
      const suitState = { ...gameState.trixBoard[card.suit] };
      if (card.rank === 11) {
        suitState.jackPlayed = true;
        suitState.lowRank = 11;
        suitState.highRank = 11;
        suitState.cardsPlayed = [card];
      } else if (card.rank < 11) {
        suitState.lowRank = card.rank;
        suitState.cardsPlayed = [...suitState.cardsPlayed, card];
      } else {
        suitState.highRank = card.rank;
        suitState.cardsPlayed = [...suitState.cardsPlayed, card];
      }

      const updatedBoard = {
        ...gameState.trixBoard,
        [card.suit]: suitState,
      };

      // Check if player emptied their hand (Finish rank)
      const newFinishOrder = [...gameState.trixFinishOrder];
      if (newHand.length === 0 && !newFinishOrder.includes(playerPos)) {
        newFinishOrder.push(playerPos);
      }

      // Check if all players finished or game advances
      if (newFinishOrder.length >= 3) {
        finishTrixContract(updatedPlayers, newFinishOrder);
        return;
      }

      // Next turn (counter-clockwise)
      const nextTurn = ((playerPos + 1) % 4) as PlayerPosition;
      const nextState: TrixGameState = {
        ...gameState,
        players: updatedPlayers,
        trixBoard: updatedBoard,
        trixFinishOrder: newFinishOrder,
        turnPlayerPos: nextTurn,
      };

      setGameState(nextState);
      const nextPlayer = nextState.players[nextTurn];
      if (nextPlayer && nextPlayer.isBot !== false && !nextPlayer.isUser) {
        scheduleBotTurn(nextState);
      }
      return;
    }

    // Standard Trick Contracts (Banat, Dinari, Ltoosh, Sheikh Koba)
    const newTrickPlay: TrixTrickPlay = { playerPos, card };
    const updatedTrick = [...gameState.currentTrick, newTrickPlay];
    const leadSuit = updatedTrick.length === 1 ? card.suit : gameState.leadSuit;

    // Trick Complete (4 cards played)
    if (updatedTrick.length === 4) {
      const winnerPos = resolveTrickWinner(updatedTrick);
      const trickCards = updatedTrick.map((t) => t.card);

      const resolvedPlayers = updatedPlayers.map((p) => {
        if (p.position === winnerPos) {
          return {
            ...p,
            tricksWon: [...p.tricksWon, trickCards],
          };
        }
        return p;
      });

      const nextState: TrixGameState = {
        ...gameState,
        players: resolvedPlayers,
        currentTrick: updatedTrick,
        leadSuit,
        status: 'TRICK_RESOLVED',
      };

      setGameState(nextState);

      // Settle trick after 800ms
      if (trickResolveTimerRef.current) clearTimeout(trickResolveTimerRef.current);
      trickResolveTimerRef.current = setTimeout(() => {
        // Check if hand finished (0 cards in hands)
        if (resolvedPlayers[0].hand.length === 0) {
          finishTrickContract(resolvedPlayers);
        } else {
          const afterTrickState: TrixGameState = {
            ...nextState,
            currentTrick: [],
            leadSuit: null,
            status: 'PLAYING_TRICK',
            turnPlayerPos: winnerPos,
          };
          setGameState(afterTrickState);

          const nextPlayer = afterTrickState.players[winnerPos];
          if (nextPlayer && nextPlayer.isBot !== false && !nextPlayer.isUser) {
            scheduleBotTurn(afterTrickState);
          }
        }
      }, 800);
    } else {
      // Advance to next player
      const nextTurn = ((playerPos + 1) % 4) as PlayerPosition;
      const nextState: TrixGameState = {
        ...gameState,
        players: updatedPlayers,
        currentTrick: updatedTrick,
        leadSuit,
        turnPlayerPos: nextTurn,
      };
      setGameState(nextState);

      const nextPlayer = nextState.players[nextTurn];
      if (nextPlayer && nextPlayer.isBot !== false && !nextPlayer.isUser) {
        scheduleBotTurn(nextState);
      }
    }
  };

  const scheduleBotTurn = (state: TrixGameState) => {
    if (botTurnTimerRef.current) clearTimeout(botTurnTimerRef.current);

    // Realistic bot decision timing (450ms - 650ms)
    botTurnTimerRef.current = setTimeout(() => {
      const botPos = state.turnPlayerPos;
      const player = state.players[botPos];
      if (!player) return;
      if (player.isUser || player.isBot === false) return; // Only execute if it's an AI bot!

      const card = getBotMove(state, botPos, 'EXPERT');
      if (card && card !== 'PASS') {
        soundManager.playCardFlip();
        executePlayCard(botPos, card);
      } else if (state.currentContract === 'TRIX') {
        // Pass turn in Trix mode if no legal card
        const nextTurn = ((botPos + 1) % 4) as PlayerPosition;
        const passState: TrixGameState = {
          ...state,
          turnPlayerPos: nextTurn,
        };
        setGameState(passState);
        const nextPlayer = passState.players[nextTurn];
        if (nextPlayer && nextPlayer.isBot !== false && !nextPlayer.isUser) {
          scheduleBotTurn(passState);
        }
      }
    }, 550);
  };

  // -------------------------------------------------------------
  // 4. Contract and Match Conclusion
  // -------------------------------------------------------------
  const finishTrickContract = (players: TrixPlayer[]) => {
    if (!gameState) return;
    const contract = gameState.currentContract!;

    const updatedPlayers = players.map((p) => {
      const allCardsTaken = p.tricksWon.flat();
      const penaltyResult = calculateContractPenalties(contract, allCardsTaken, p.tricksWon.length);
      const delta = penaltyResult.points;
      return {
        ...p,
        score: p.score + delta,
        contractScores: {
          ...p.contractScores,
          [contract]: delta,
        },
        tricksWon: [],
      };
    });

    advanceGameToNextHand(updatedPlayers);
  };

  const finishTrixContract = (players: TrixPlayer[], finishOrder: PlayerPosition[]) => {
    if (!gameState) return;
    const rankPoints: Record<number, number> = { 0: 200, 1: 75, 2: 25, 3: -50 };

    // Player not in finish order is 4th place
    const allPos: PlayerPosition[] = [0, 1, 2, 3];
    const finalOrder = [...finishOrder];
    allPos.forEach((p) => {
      if (!finalOrder.includes(p)) finalOrder.push(p);
    });

    const updatedPlayers = players.map((p) => {
      const rankIdx = finalOrder.indexOf(p.position);
      const pts = rankPoints[rankIdx] ?? -50;
      return {
        ...p,
        score: p.score + pts,
        contractScores: {
          ...p.contractScores,
          TRIX: pts,
        },
      };
    });

    advanceGameToNextHand(updatedPlayers);
  };

  const advanceGameToNextHand = (players: TrixPlayer[]) => {
    if (!gameState) return;
    soundManager.playRoundEnd();

    // Re-deal 13 cards to each player
    const deck = shuffleDeck(createDeck());
    const rawHands: TrixCard[][] = [
      sortHand(deck.slice(0, 13)),
      sortHand(deck.slice(13, 26)),
      sortHand(deck.slice(26, 39)),
      sortHand(deck.slice(39, 52)),
    ];

    // Next king moves clockwise
    const nextKingPos = ((gameState.kingdomOwnerPos + 1) % 4) as PlayerPosition;
    const nextKingdomIdx = gameState.currentKingdomIndex + 1;

    // Check if entire match of 4 kingdoms concluded
    if (nextKingdomIdx >= 4) {
      handleMatchVictory(players);
      return;
    }

    const reDealtPlayers = players.map((p, idx) => ({
      ...p,
      hand: rawHands[idx],
      tricksWon: [],
    }));

    const nextState: TrixGameState = {
      ...gameState,
      players: reDealtPlayers,
      currentKingdomIndex: nextKingdomIdx,
      kingdomOwnerPos: nextKingPos,
      currentContract: null,
      currentTrick: [],
      leadSuit: null,
      turnPlayerPos: nextKingPos,
      status: 'SELECTING_CONTRACT',
    };

    setGameState(nextState);

    if (nextKingPos === mySeatPos) {
      setShowContractModal(true);
    } else {
      setTimeout(() => {
        executeBotSelectContract(nextState);
      }, 1200);
    }
  };

  const handleMatchVictory = (finalPlayers: TrixPlayer[]) => {
    if (!gameState) return;
    const isPartnership = gameState.mode === 'PARTNERSHIP';
    const teamAScore = finalPlayers[0].score + finalPlayers[2].score;
    const teamBScore = finalPlayers[1].score + finalPlayers[3].score;
    const userWon = isPartnership ? teamAScore >= teamBScore : finalPlayers[0].score === Math.max(...finalPlayers.map((p) => p.score));

    if (userWon) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      soundManager.playWin();
      storage.payoutTrixWin(gameState.roomPot * 0.95, gameState.currency);
    } else {
      soundManager.playLose();
    }

    // Record in global persistent leaderboard
    storage.recordTrixUserMatchResult({
      won: userWon,
      score: isPartnership ? teamAScore : finalPlayers[0].score,
      mode: gameState.mode,
    });

    const finishedState: TrixGameState = {
      ...gameState,
      players: finalPlayers,
      status: 'MATCH_END',
      winnerTeam: isPartnership ? (teamAScore >= teamBScore ? 'TEAM_A' : 'TEAM_B') : 'SOLO',
    };
    setGameState(finishedState);
    setShowScoreModal(true);
  };

  // -------------------------------------------------------------
  // 5. Anti-Cheat Preset Chat Handlers (2-Sec Public Bubbles)
  // -------------------------------------------------------------
  const sendPresetChat = (text: string) => {
    soundManager.playMessageSent();
    setShowChatBar(false);
    showChatBubble(mySeatPos, text);

    // Bot banter reaction after 800ms
    setTimeout(() => {
      const bots = [1, 2, 3].filter((p) => p !== mySeatPos);
      const responder = bots[Math.floor(Math.random() * bots.length)] as PlayerPosition;
      let botReply = 'برافو';
      if (text === '🙂') botReply = '🙂';
      else if (text === 'العب بسرعة') botReply = 'يلا شريك';
      else if (text === 'آسف') botReply = 'حظ أوفر';
      else if (text === 'يلا شريك') botReply = 'برافو';

      showChatBubble(responder, botReply);
    }, 850);
  };

  const showChatBubble = (pos: PlayerPosition, text: string) => {
    if (mutedPlayers[pos]) return;
    const expiresAt = Date.now() + 2000;
    setActiveBubbles((prev) => ({
      ...prev,
      [pos]: { playerPos: pos, text, expiresAt },
    }));

    setTimeout(() => {
      setActiveBubbles((prev) => {
        if (prev[pos]?.expiresAt === expiresAt) {
          return { ...prev, [pos]: null };
        }
        return prev;
      });
    }, 2000);
  };

  const toggleMutePlayer = (pos: PlayerPosition) => {
    soundManager.playClick();
    setMutedPlayers((prev) => ({
      ...prev,
      [pos]: !prev[pos],
    }));
  };

  // Render variables
  const myPlayer = gameState?.players[mySeatPos];
  const topPlayer = gameState?.players[((mySeatPos + 2) % 4) as PlayerPosition];
  const rightPlayer = gameState?.players[((mySeatPos + 1) % 4) as PlayerPosition];
  const leftPlayer = gameState?.players[((mySeatPos + 3) % 4) as PlayerPosition];

  // Helper for 1-click test funds in betting setup
  const handleAddDemoFunds = () => {
    let currentUser = storage.getUser();
    if (!currentUser) {
      currentUser = {
        id: 'usr_player_ole2tn',
        username: user?.username || 'New-OLE2TN',
        display_name: user?.display_name || 'New-OLE2TN',
        currency: activeCurrency,
        balance: 120,
        walletBalance: 120,
        currencyBalances: { EGP: 1000, JOD: 50, USDT: 100 },
        country: activeCurrency === 'JOD' ? 'JO' : 'EG',
        createdAt: Date.now(),
      } as UserProfile;
      storage.updateUser(currentUser);
      onUpdateUser(currentUser);
    }
    const amt = activeCurrency === 'JOD' ? 50 : activeCurrency === 'EGP' ? 1000 : 100;
    storage.creditBalance(amt, activeCurrency);
    setLocalBalances({ ...storage.getCurrencyBalances() });
    const fresh = storage.getUser();
    if (fresh) {
      onUpdateUser({
        balance: fresh.balance,
        currencyBalances: fresh.currencyBalances,
      });
    }
  };

  // =============================================================
  // 3-VIEW FLOW: LOBBY -> BETTING_SETUP -> TABLE
  // =============================================================
  if (viewMode === 'LOBBY') {
    return (
      <>
        <TrixLobby
          user={user}
          activeCurrency={activeCurrency}
          currentBalance={currentBalance}
          currencySymbol={currencyConfig.symbol}
          onSelectGame={(variant) => {
            setSelectedVariant(variant);
            setViewMode('BETTING_SETUP');
          }}
          onOpenDeposit={onOpenDepositModal}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
          onReturnHome={onReturnHome}
        />
        {/* Global Leaderboard Modal */}
        {showLeaderboardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
            <div className="relative max-w-5xl w-full my-auto max-h-[92vh] overflow-y-auto rounded-3xl">
              <TrixLeaderboard
                user={user}
                onClose={() => setShowLeaderboardModal(false)}
                onPlayClick={() => {
                  setShowLeaderboardModal(false);
                  setViewMode('BETTING_SETUP');
                }}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  if (viewMode === 'BETTING_SETUP') {
    return (
      <TrixBettingSetup
        variant={selectedVariant}
        user={user}
        activeCurrency={activeCurrency}
        currentBalance={currentBalance}
        currencySymbol={currencyConfig.symbol}
        onBack={() => setViewMode('LOBBY')}
        onConfirmStart={(mode, betAmt, diff) => {
          setSelectedMode(mode);
          setBetAmount(betAmt);
          setBotDifficulty(diff);
          startNewTrixMatch(mode, betAmt, diff);
        }}
        onOpenDeposit={onOpenDepositModal}
        onAddDemoFunds={handleAddDemoFunds}
      />
    );
  }

  // =============================================================
  // MAIN CLEAN CANVAS RENDER (Strict Reference Alignment)
  // =============================================================
  return (
    <div className="w-full min-h-screen bg-[#1E1E1E] text-white flex flex-col items-center justify-between p-2 sm:p-4 select-none font-sans overflow-x-hidden">
      {/* ---------------- 1. HEADER: ONLY "Trix Complex" CENTERED + EXIT GAME BUTTON ---------------- */}
      <header className="w-full flex items-center justify-between px-3 py-2 max-w-5xl">
        {/* Left: Exit Game button + minimal mute toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExitModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-xs font-bold text-red-300 hover:text-white transition-all cursor-pointer border border-red-500/30 active:scale-95"
            title={isAr ? 'الخروج من اللعبة' : 'Exit Game'}
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>{isAr ? 'الخروج من اللعبة (Exit Game)' : 'Exit Game'}</span>
          </button>
          <button
            onClick={() => {
              const m = soundManager.toggleMute();
              setIsMuted(m);
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white transition-all cursor-pointer"
            title="Mute Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#EF4444]" /> : <Volume2 className="w-4 h-4 text-[#2EB872]" />}
          </button>
        </div>

        {/* Center title */}
        <div className="flex flex-col items-center">
          <h1 className="text-base sm:text-xl font-bold tracking-wider text-white text-center">
            {selectedVariant === 'TRIX_PARTNER' ? 'Trix Partner' : selectedVariant === 'TRIX' ? 'Trix' : 'Trix Complex'}
          </h1>
          <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
            {isAr ? '4 مقاعد كاملة (ملء ذكي وتبديل فوري)' : '4 Seats (Auto-Fill & Hot-Swap)'}
          </span>
        </div>

        {/* Right: Seats & Hot-Swap + Scores */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSeatsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-sky-400 border border-sky-400/20 hover:border-sky-400/40 transition-all cursor-pointer"
            title={isAr ? 'إدارة المقاعد والتبديل الحي' : 'Seats & Hot-Swap'}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isAr ? `المقاعد (${humanCount} بشر / ${botCount} بوت)` : `Seats (${humanCount}H / ${botCount}B)`}
            </span>
          </button>

          <button
            onClick={() => setShowScoreModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#FACC15] border border-white/10 transition-all cursor-pointer"
            title={isAr ? 'لوحة النتائج' : 'Scoreboard'}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAr ? 'النتائج' : 'Scores'}</span>
          </button>
        </div>
      </header>

      {/* ---------------- 2. MAIN TABLE (Green Felt #2EB872, Silver Border #C0C0C0) ---------------- */}
      <main className="relative w-[96vw] sm:w-[85vw] lg:w-[75vw] max-w-[1100px] h-[66vh] min-h-[500px] max-h-[720px] rounded-[32px] bg-[#2EB872] border-[8px] border-[#C0C0C0] shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_0_50px_rgba(0,0,0,0.18)] flex flex-col justify-between p-3 sm:p-5 overflow-hidden my-auto">
        {/* Subtle center watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <Crown className="w-48 h-48 text-white stroke-[1]" />
        </div>

        {/* --- TOP-LEFT: ONE COMPACT SCORE WIDGET (Cross shape + Trix button) --- */}
        <div className="absolute top-4 left-4 z-20 flex flex-col items-center gap-1.5">
          {/* 4 Small Boxes in Cross Shape */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Top player score box */}
            <div className="absolute top-0 w-5 h-5 rounded-md bg-black/80 border border-white/20 text-[10px] font-mono font-bold flex items-center justify-center text-white">
              {topPlayer?.score ?? 0}
            </div>
            {/* Left player score box */}
            <div className="absolute left-0 w-5 h-5 rounded-md bg-black/80 border border-white/20 text-[10px] font-mono font-bold flex items-center justify-center text-white">
              {leftPlayer?.score ?? 0}
            </div>
            {/* Right player score box */}
            <div className="absolute right-0 w-5 h-5 rounded-md bg-black/80 border border-white/20 text-[10px] font-mono font-bold flex items-center justify-center text-white">
              {rightPlayer?.score ?? 0}
            </div>
            {/* Bottom player score box */}
            <div className="absolute bottom-0 w-5 h-5 rounded-md bg-[#2EB872] text-black font-mono font-bold text-[10px] flex items-center justify-center shadow-sm">
              {myPlayer?.score ?? 0}
            </div>
          </div>

          {/* Trix Button below cross */}
          <button
            onClick={() => setShowScoreModal(true)}
            className="px-2.5 py-0.5 rounded-md bg-black/80 hover:bg-black text-[10px] font-bold text-[#FACC15] border border-white/20 transition-all cursor-pointer shadow-sm"
          >
            Trix
          </button>
        </div>

        {/* --- 3-SECOND COUNTDOWN OVERLAY --- */}
        {countdown !== null && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs">
            <span className="text-6xl sm:text-7xl font-black text-[#FACC15] animate-ping font-mono">
              {countdown}
            </span>
            <span className="text-xs text-white/80 mt-2 font-bold">
              {isAr ? 'جاري توزيع الأوراق والبدء...' : 'Starting match...'}
            </span>
          </div>
        )}

        {/* ---------------- TOP PLAYER (Opponent 1 / Partner) (50%, 15%) ---------------- */}
        <div className="absolute left-1/2 top-[15%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
          {topPlayer && (
            <div className="relative flex flex-col items-center">
              {/* Active Chat Bubble */}
              {activeBubbles[topPlayer.position] && (
                <div className="absolute -top-10 px-3 py-1 rounded-full bg-white text-black font-bold text-xs shadow-xl animate-bounce whitespace-nowrap z-30">
                  {activeBubbles[topPlayer.position]?.text}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white" />
                </div>
              )}

              {/* Opponent Red Fanned Card Backs (20x28px, fanned 140deg behind avatar) */}
              <div className="absolute -top-4 w-28 h-10 flex items-center justify-center pointer-events-none">
                {topPlayer.hand.slice(0, 13).map((_, i) => {
                  const total = Math.min(topPlayer.hand.length, 13);
                  const angle = total > 1 ? -70 + (i * 140) / (total - 1) : 0;
                  return (
                    <div
                      key={i}
                      className="absolute w-[20px] h-[28px] rounded-[3px] bg-[#C41E1E] border border-white/30 shadow-xs transition-transform"
                      style={{
                        transform: `rotate(${angle}deg) translateY(-8px)`,
                        transformOrigin: 'bottom center',
                      }}
                    />
                  );
                })}
              </div>

              {/* 52px Black Sphere Avatar #111 with Grey Icon */}
              <div
                className={`relative w-[52px] h-[52px] rounded-full bg-[#111] flex items-center justify-center border-2 border-white/20 shadow-lg transition-transform ${gameState?.turnPlayerPos === topPlayer.position ? 'scale-105 ring-4 ring-[#FACC15]' : ''}`}
              >
                <img
                  src={topPlayer.avatar}
                  alt={topPlayer.name}
                  className="w-10 h-10 rounded-full object-cover"
                />

                {/* 18px Pulsing Gold Crown if holds 7♥ */}
                {topPlayer.position === currentKingPos && (
                  <span
                    className="absolute -top-2 -right-2 text-[18px] animate-pulse drop-shadow cursor-default"
                    title={isAr ? 'المملكة عنده' : 'King of hand'}
                  >
                    👑
                  </span>
                )}
              </div>

              {/* Name Pill: yellow name + green score */}
              <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/80 border border-white/10 shadow-sm text-xs">
                <span className="text-[#FACC15] font-bold text-[11px] truncate max-w-[80px]">
                  {topPlayer.name}
                </span>
                <span className="bg-[#2EB872] text-black font-black px-1.5 py-0.2 rounded text-[10px] font-mono leading-none">
                  {topPlayer.score}
                </span>
                <button
                  onClick={() => toggleMutePlayer(topPlayer.position)}
                  className="text-white/40 hover:text-white text-[9px] cursor-pointer"
                >
                  {mutedPlayers[topPlayer.position] ? '🔇' : ''}
                </button>
              </div>

              {/* Partner Card Privacy Badge & Hot-Swap Trigger */}
              <div className="mt-1 flex items-center gap-1">
                {selectedMode === 'PARTNERSHIP' && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-900/70 border border-blue-400/30 text-blue-300 font-bold"
                    title={isAr ? 'أوراق الشريك مخفية تماماً لمنع الغش' : 'Teammate cards strictly hidden'}
                  >
                    🔒 {isAr ? 'الشريك' : 'Partner'}
                  </span>
                )}
                <button
                  onClick={() => handleHotSwapSeat(topPlayer.position, topPlayer.isBot ? 'HUMAN' : 'BOT')}
                  className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all cursor-pointer flex items-center gap-0.5 active:scale-95"
                  title={isAr ? 'تبديل فوري بين بوت ذكي ولاعب حقيقي' : 'Hot-swap AI / Human'}
                >
                  <span>{topPlayer.isBot ? '🤖 بوت' : '👤 بشري'}</span>
                  <span className="text-amber-400 text-[10px]">⇄</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ---------------- LEFT PLAYER (8%, 50%) ---------------- */}
        <div className="absolute left-[8%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
          {leftPlayer && (
            <div className="relative flex flex-col items-center">
              {/* Active Chat Bubble */}
              {activeBubbles[leftPlayer.position] && (
                <div className="absolute -top-10 px-3 py-1 rounded-full bg-white text-black font-bold text-xs shadow-xl animate-bounce whitespace-nowrap z-30">
                  {activeBubbles[leftPlayer.position]?.text}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white" />
                </div>
              )}

              {/* Opponent Red Fanned Card Backs (20x28px, fanned 140deg) */}
              <div className="absolute -top-4 w-28 h-10 flex items-center justify-center pointer-events-none">
                {leftPlayer.hand.slice(0, 13).map((_, i) => {
                  const total = Math.min(leftPlayer.hand.length, 13);
                  const angle = total > 1 ? -70 + (i * 140) / (total - 1) : 0;
                  return (
                    <div
                      key={i}
                      className="absolute w-[20px] h-[28px] rounded-[3px] bg-[#C41E1E] border border-white/30 shadow-xs"
                      style={{
                        transform: `rotate(${angle}deg) translateY(-8px)`,
                        transformOrigin: 'bottom center',
                      }}
                    />
                  );
                })}
              </div>

              {/* 52px Black Sphere Avatar */}
              <div
                className={`relative w-[52px] h-[52px] rounded-full bg-[#111] flex items-center justify-center border-2 border-white/20 shadow-lg transition-transform ${gameState?.turnPlayerPos === leftPlayer.position ? 'scale-105 ring-4 ring-[#FACC15]' : ''}`}
              >
                <img
                  src={leftPlayer.avatar}
                  alt={leftPlayer.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                {leftPlayer.position === currentKingPos && (
                  <span
                    className="absolute -top-2 -right-2 text-[18px] animate-pulse drop-shadow cursor-default"
                    title={isAr ? 'المملكة عنده' : 'King of hand'}
                  >
                    👑
                  </span>
                )}
              </div>

              {/* Name Pill: yellow name + green score */}
              <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/80 border border-white/10 shadow-sm text-xs">
                <span className="text-[#FACC15] font-bold text-[11px] truncate max-w-[70px]">
                  {leftPlayer.name}
                </span>
                <span className="bg-[#2EB872] text-black font-black px-1.5 py-0.2 rounded text-[10px] font-mono leading-none">
                  {leftPlayer.score}
                </span>
                <button
                  onClick={() => toggleMutePlayer(leftPlayer.position)}
                  className="text-white/40 hover:text-white text-[9px] cursor-pointer"
                >
                  {mutedPlayers[leftPlayer.position] ? '🔇' : ''}
                </button>
              </div>

              {/* Hot-Swap Trigger */}
              <div className="mt-1 flex items-center gap-1">
                <button
                  onClick={() => handleHotSwapSeat(leftPlayer.position, leftPlayer.isBot ? 'HUMAN' : 'BOT')}
                  className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all cursor-pointer flex items-center gap-0.5 active:scale-95"
                  title={isAr ? 'تبديل فوري بين بوت ذكي ولاعب حقيقي' : 'Hot-swap AI / Human'}
                >
                  <span>{leftPlayer.isBot ? '🤖 بوت' : '👤 بشري'}</span>
                  <span className="text-amber-400 text-[10px]">⇄</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ---------------- RIGHT PLAYER (92%, 50%) ---------------- */}
        <div className="absolute left-[92%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
          {rightPlayer && (
            <div className="relative flex flex-col items-center">
              {/* Active Chat Bubble */}
              {activeBubbles[rightPlayer.position] && (
                <div className="absolute -top-10 px-3 py-1 rounded-full bg-white text-black font-bold text-xs shadow-xl animate-bounce whitespace-nowrap z-30">
                  {activeBubbles[rightPlayer.position]?.text}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white" />
                </div>
              )}

              {/* Opponent Red Fanned Card Backs */}
              <div className="absolute -top-4 w-28 h-10 flex items-center justify-center pointer-events-none">
                {rightPlayer.hand.slice(0, 13).map((_, i) => {
                  const total = Math.min(rightPlayer.hand.length, 13);
                  const angle = total > 1 ? -70 + (i * 140) / (total - 1) : 0;
                  return (
                    <div
                      key={i}
                      className="absolute w-[20px] h-[28px] rounded-[3px] bg-[#C41E1E] border border-white/30 shadow-xs"
                      style={{
                        transform: `rotate(${angle}deg) translateY(-8px)`,
                        transformOrigin: 'bottom center',
                      }}
                    />
                  );
                })}
              </div>

              {/* 52px Black Sphere Avatar */}
              <div
                className={`relative w-[52px] h-[52px] rounded-full bg-[#111] flex items-center justify-center border-2 border-white/20 shadow-lg transition-transform ${gameState?.turnPlayerPos === rightPlayer.position ? 'scale-105 ring-4 ring-[#FACC15]' : ''}`}
              >
                <img
                  src={rightPlayer.avatar}
                  alt={rightPlayer.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                {rightPlayer.position === currentKingPos && (
                  <span
                    className="absolute -top-2 -right-2 text-[18px] animate-pulse drop-shadow cursor-default"
                    title={isAr ? 'المملكة عنده' : 'King of hand'}
                  >
                    👑
                  </span>
                )}
              </div>

              {/* Name Pill: yellow name + green score */}
              <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/80 border border-white/10 shadow-sm text-xs">
                <span className="text-[#FACC15] font-bold text-[11px] truncate max-w-[70px]">
                  {rightPlayer.name}
                </span>
                <span className="bg-[#2EB872] text-black font-black px-1.5 py-0.2 rounded text-[10px] font-mono leading-none">
                  {rightPlayer.score}
                </span>
                <button
                  onClick={() => toggleMutePlayer(rightPlayer.position)}
                  className="text-white/40 hover:text-white text-[9px] cursor-pointer"
                >
                  {mutedPlayers[rightPlayer.position] ? '🔇' : ''}
                </button>
              </div>

              {/* Hot-Swap Trigger */}
              <div className="mt-1 flex items-center gap-1">
                <button
                  onClick={() => handleHotSwapSeat(rightPlayer.position, rightPlayer.isBot ? 'HUMAN' : 'BOT')}
                  className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all cursor-pointer flex items-center gap-0.5 active:scale-95"
                  title={isAr ? 'تبديل فوري بين بوت ذكي ولاعب حقيقي' : 'Hot-swap AI / Human'}
                >
                  <span>{rightPlayer.isBot ? '🤖 بوت' : '👤 بشري'}</span>
                  <span className="text-amber-400 text-[10px]">⇄</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ---------------- CENTER TABLE: 4 PLAYED CARD SPOTS (Standard Proportions) ---------------- */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-52 sm:w-56 h-52 sm:h-56 flex items-center justify-center pointer-events-none z-10">
          {/* North Played Card (Top) */}
          <div className="absolute top-1 sm:top-2 w-[62px] h-[88px] sm:w-[68px] sm:h-[96px] flex items-center justify-center">
            {gameState?.currentTrick.find((t) => t.playerPos === topPlayer?.position) ? (
              <RenderSingleCard
                card={gameState.currentTrick.find((t) => t.playerPos === topPlayer?.position)!.card}
              />
            ) : null}
          </div>

          {/* West Played Card (Left) */}
          <div className="absolute left-0 w-[62px] h-[88px] sm:w-[68px] sm:h-[96px] flex items-center justify-center">
            {gameState?.currentTrick.find((t) => t.playerPos === leftPlayer?.position) ? (
              <RenderSingleCard
                card={gameState.currentTrick.find((t) => t.playerPos === leftPlayer?.position)!.card}
              />
            ) : null}
          </div>

          {/* East Played Card (Right) */}
          <div className="absolute right-0 w-[62px] h-[88px] sm:w-[68px] sm:h-[96px] flex items-center justify-center">
            {gameState?.currentTrick.find((t) => t.playerPos === rightPlayer?.position) ? (
              <RenderSingleCard
                card={gameState.currentTrick.find((t) => t.playerPos === rightPlayer?.position)!.card}
              />
            ) : null}
          </div>

          {/* South Played Card (Me / Bottom) */}
          <div className="absolute bottom-1 sm:bottom-2 w-[62px] h-[88px] sm:w-[68px] sm:h-[96px] flex items-center justify-center">
            {gameState?.currentTrick.find((t) => t.playerPos === myPlayer?.position) ? (
              <RenderSingleCard
                card={gameState.currentTrick.find((t) => t.playerPos === myPlayer?.position)!.card}
              />
            ) : null}
          </div>
        </div>

        {/* ---------------- BOTTOM PLAYER (ME) & 13 HAND CARDS (Exact Fan Layout) ---------------- */}
        <div className="absolute left-1/2 bottom-2 -translate-x-1/2 z-20 flex flex-col items-center w-full max-w-4xl px-2">
          {/* Active Chat Bubble for Me */}
          {activeBubbles[mySeatPos] && (
            <div className="mb-2 px-3.5 py-1 rounded-full bg-white text-black font-bold text-xs shadow-2xl animate-bounce">
              {activeBubbles[mySeatPos]?.text}
              <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white mx-auto" />
            </div>
          )}

          {/* Simulated / Hot-Swapped Human Turn Alert */}
          {gameState && gameState.turnPlayerPos !== mySeatPos && !gameState.players[gameState.turnPlayerPos]?.isBot && (
            <div className="mb-1.5 px-3 py-1 rounded-full bg-blue-950/85 border border-blue-400/40 text-blue-200 text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
              <span>👤 {isAr ? `دور اللاعب ${gameState.players[gameState.turnPlayerPos]?.name} (بشري)` : `Turn: ${gameState.players[gameState.turnPlayerPos]?.name} (Human)`}</span>
              <button
                onClick={() => {
                  const activePos = gameState.turnPlayerPos;
                  const card = getBotMove(gameState, activePos, 'EXPERT');
                  if (card && card !== 'PASS') {
                    executePlayCard(activePos, card);
                  }
                }}
                className="px-2 py-0.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-black cursor-pointer shadow-xs active:scale-95"
              >
                {isAr ? 'العب نيابة عنه' : 'Auto Move'}
              </button>
            </div>
          )}

          {/* Exact 13 Cards Fan Layout with Standard Playing Card Proportions (Aspect Ratio ~2.5:3.5) */}
          <div
            dir="ltr"
            className="relative flex items-end justify-center mb-1.5 px-2 sm:px-4 h-[95px] sm:h-[115px] md:h-[125px] max-w-full overflow-visible select-none"
          >
            {myPlayer?.hand.map((card, idx) => {
              const totalCards = myPlayer.hand.length;
              const isTurn = gameState?.turnPlayerPos === mySeatPos;

              // Calculate Fan Geometry:
              const mid = (totalCards - 1) / 2;
              const offset = idx - mid;
              // Step angle: for 13 cards => spans -15.6 deg to +15.6 deg
              const stepAngle = totalCards > 1 ? Math.min(2.7, 34 / (totalCards - 1)) : 0;
              const angle = offset * stepAngle;

              // Vertical parabolic arch: center card is highest, outer cards dip slightly
              const normalizedDist = Math.abs(offset) / Math.max(mid, 1);
              const arcY = Math.pow(normalizedDist, 1.6) * 16; // dip up to 16px

              // Card legality check
              const leadSuit = gameState?.currentTrick.length ? gameState.currentTrick[0].card.suit : null;
              const sheikhPlayed = gameState?.players.some((p) =>
                p.tricksWon.some((t) => t.some((c) => c.suit === 'HEARTS' && c.rank === 13))
              ) ?? false;

              const isCardLegal = gameState?.currentContract === 'TRIX'
                ? isValidTrixCard(card, gameState.trixBoard)
                : gameState?.currentContract
                ? isValidTrickCard(card, myPlayer.hand, leadSuit, gameState.currentContract, sheikhPlayed)
                : true;

              const isPlayable = isTurn && isCardLegal;

              return (
                <button
                  key={card.id || `${card.suit}_${card.rank}_${idx}`}
                  onClick={() => handlePlayUserCard(card)}
                  disabled={!isTurn || !isCardLegal}
                  className={`group relative rounded-[7px] sm:rounded-[9px] bg-white border border-neutral-300 shadow-[0_4px_16px_rgba(0,0,0,0.38),0_1px_3px_rgba(0,0,0,0.25)] flex flex-col justify-between p-1 sm:p-1.5 text-start cursor-pointer transition-all duration-200 ease-out origin-bottom ${
                    isPlayable
                      ? 'hover:!rotate-0 hover:!-translate-y-7 hover:!scale-110 hover:!z-50 hover:shadow-[0_20px_35px_rgba(0,0,0,0.6)] ring-2 ring-amber-400'
                      : isTurn
                      ? 'opacity-60 cursor-not-allowed'
                      : 'opacity-95 hover:!-translate-y-2'
                  } ${
                    idx > 0 ? '-ml-7 sm:-ml-9 md:-ml-10 lg:-ml-11' : ''
                  }`}
                  style={{
                    width: 'clamp(54px, 7vw, 76px)',
                    height: 'clamp(78px, 10vw, 110px)',
                    transform: `rotate(${angle}deg) translateY(${arcY}px)`,
                    zIndex: idx + 1,
                    color: card.isRed ? '#DC2626' : '#171717',
                  }}
                  title={
                    isTurn
                      ? isCardLegal
                        ? `العب ${card.label}${card.suitSymbol}`
                        : 'ورقة غير قانونية لهذا الدور'
                      : `${card.label}${card.suitSymbol}`
                  }
                >
                  {/* Top-Left Corner Rank & Mini Suit Pip */}
                  <div className="flex flex-col items-start leading-none font-black text-xs sm:text-sm tracking-tight select-none">
                    <span>{card.label}</span>
                    <span className="text-[10px] sm:text-xs leading-none mt-0.5">{card.suitSymbol}</span>
                  </div>

                  {/* Center Suit Emblem (Standard authentic playing card face) */}
                  <div className="self-center text-xl sm:text-2xl md:text-3xl leading-none select-none opacity-95 group-hover:scale-110 transition-transform">
                    {card.suitSymbol}
                  </div>

                  {/* Bottom-Right Inverted Rank & Mini Suit Pip */}
                  <div className="self-end leading-none font-black text-[10px] sm:text-xs tracking-tight select-none rotate-180 flex flex-col items-start">
                    <span>{card.label}</span>
                    <span className="text-[8px] sm:text-[10px] leading-none mt-0.5">{card.suitSymbol}</span>
                  </div>

                  {/* Subtle Golden Glow Indicator on Player's Turn */}
                  {isPlayable && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-sm" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Bar: 52px Black Sphere Avatar + "Score 0" bar + Seats Hot-Swap button + Chat */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Avatar 52px with 18px crown if King */}
            <div className="relative w-[52px] h-[52px] rounded-full bg-[#111] flex items-center justify-center border-2 border-white/20 shadow-lg">
              <img
                src={myPlayer?.avatar || user?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Me'}
                alt={myPlayer?.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              {mySeatPos === currentKingPos && (
                <span
                  className="absolute -top-2 -right-2 text-[18px] animate-pulse drop-shadow cursor-default"
                  title={isAr ? 'المملكة عندك' : 'You are King'}
                >
                  👑
                </span>
              )}
            </div>

            {/* Bottom: My Score Bar Black+Green: "Score 0" */}
            <div className="px-3.5 py-1 rounded-xl bg-black/90 border border-[#2EB872] text-xs font-mono font-bold text-[#2EB872] shadow-md flex items-center gap-2">
              <span>Score</span>
              <span className="text-white font-black">{myPlayer?.score ?? 0}</span>
            </div>

            {/* Room Seats & Hot-Swap Quick Button */}
            <button
              onClick={() => setShowSeatsModal(true)}
              className="p-2 rounded-xl bg-black/80 hover:bg-black text-sky-400 border border-sky-400/30 transition-all cursor-pointer shadow-md flex items-center gap-1.5 text-xs font-bold"
              title={isAr ? 'إدارة المقاعد والتبديل الحي' : 'Seats & Hot-Swap'}
            >
              <Users className="w-4 h-4" />
              <span className="text-[10px] hidden xs:inline">{humanCount}H/{botCount}B</span>
            </button>

            {/* Anti-Cheat Chat Quick Button */}
            <button
              onClick={() => setShowChatBar((prev) => !prev)}
              className="p-2 rounded-xl bg-black/80 hover:bg-black text-[#FACC15] border border-white/20 transition-all cursor-pointer shadow-md"
              title="Anti-cheat preset messages"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* --- ANTI-CHEAT PRESET CHAT DRAWER (8 Presets Only, Public, 2-sec bubbles) --- */}
        {showChatBar && (
          <div className="absolute bottom-20 right-4 z-40 bg-black/90 backdrop-blur-md rounded-2xl border border-white/20 p-2.5 shadow-2xl flex flex-wrap gap-1.5 max-w-xs animate-fadeIn">
            {PRESET_CHAT_OPTIONS.map((msg, i) => (
              <button
                key={i}
                onClick={() => sendPresetChat(msg)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#FACC15] hover:text-black text-xs font-bold transition-colors cursor-pointer"
              >
                {msg}
              </button>
            ))}
          </div>
        )}

        {/* --- KINGDOM SELECTION POPUP NEAR KING ONLY ON HIS TURN --- */}
        {showContractModal && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="bg-[#1E1E1E] border-2 border-[#FFD700] rounded-2xl p-5 max-w-sm w-full text-center shadow-2xl space-y-4">
              <div className="flex items-center justify-center gap-2 text-[#FFD700]">
                <Crown className="w-6 h-6 animate-bounce" />
                <h3 className="font-bold text-sm sm:text-base">
                  {isAr ? 'المملكة عندك - اختر العقد' : 'You are King - Select Kingdom'}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {(['SHEIKH_KOBA', 'BANAT', 'DINARI', 'LTOOSH', 'TRIX'] as TrixKingdomContract[]).map((contract) => (
                  <button
                    key={contract}
                    onClick={() => handleSelectContract(contract)}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-95"
                  >
                    <span className="text-xl">{CONTRACT_NAMES[contract].icon}</span>
                    <span>{CONTRACT_NAMES[contract].ar.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ---------------- 3. FOOTER CONTROLS & SCORE / SEATS MODALS ---------------- */}
      <footer className="w-full flex items-center justify-between px-3 py-2 max-w-5xl text-xs text-[#94A3B8]">
        <div className="flex items-center gap-2">
          <span>{isAr ? 'الرهان:' : 'Bet:'}</span>
          <span className="text-white font-mono font-bold">
            {betAmount} {currencyConfig.symbol}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLeaderboardModal(true)}
            className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
          >
            <Trophy className="w-3.5 h-3.5 text-[#FACC15]" />
            <span>{isAr ? 'لوحة الشرف' : 'Leaderboard'}</span>
          </button>

          <button
            onClick={() => setShowExitModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-xs font-bold text-red-300 hover:text-white border border-red-500/30 transition-all cursor-pointer active:scale-95"
            title={isAr ? 'الخروج من اللعبة' : 'Exit Game'}
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>{isAr ? 'الخروج من اللعبة (Exit Game)' : 'Exit Game'}</span>
          </button>
        </div>
      </footer>

      {/* =============================================================
          EXIT GAME CONFIRMATION MODAL
          ============================================================= */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#1E1E1E] rounded-3xl border-2 border-red-500/40 p-6 max-w-sm w-full text-white shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8 text-[#EF4444] animate-pulse" />
            </div>

            <h3 className="text-base sm:text-lg font-black text-white">
              {isAr ? 'تأكيد الخروج من اللعبة' : 'Confirm Game Exit'}
              <span className="block text-xs text-gray-400 font-normal mt-0.5">Confirm Game Exit</span>
            </h3>

            {/* Exact Arabic warning message requested */}
            <div className="space-y-1 bg-red-950/40 p-3.5 rounded-2xl border border-red-500/25">
              <p className="text-sm font-bold text-[#FCA5A5] leading-relaxed" dir="rtl">
                إذا قمت بالخروج ستخسر الرهان وتفقد نقودك. هل تريد الخروج حقاً؟
              </p>
              <p className="text-[11px] text-gray-300 font-medium" dir="ltr">
                If you leave, you will lose your bet and forfeit your money. Do you really want to exit?
              </p>
            </div>

            {/* Action Buttons: "نعم" (Yes) and "لا" (No) */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  soundManager.playLose();
                  setShowExitModal(false);
                  handleExitToLobby();
                  onShowNotification('error', isAr ? 'إذا قمت بالخروج ستخسر الرهان وتفقد نقودك' : 'Left the game and forfeited your bet.');
                }}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>نعم (Yes)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setShowExitModal(false);
                }}
                className="py-3 px-4 rounded-xl bg-[#2E3440] hover:bg-[#3B4252] border border-white/20 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>لا (No)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          MODAL 2: TRIX SCOREBOARD MODAL
          ============================================================= */}
      {showScoreModal && gameState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#1E1E1E] rounded-3xl border border-white/20 p-5 max-w-sm w-full text-white shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="text-sm font-bold">{isAr ? 'لوحة النتائج' : 'Scoreboard'}</h3>
              <button
                onClick={() => setShowScoreModal(false)}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <img src={p.avatar} alt={p.name} className="w-6 h-6 rounded-full" />
                    <span className="font-bold text-white">{p.name}</span>
                  </div>
                  <span
                    className={`font-mono font-bold ${
                      p.score >= 0 ? 'text-[#2EB872]' : 'text-[#EF4444]'
                    }`}
                  >
                    {p.score > 0 ? `+${p.score}` : p.score}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowScoreModal(false)}
              className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* =============================================================
          MODAL 4: ROOM SEATS & HOT-SWAP MANAGEMENT MODAL
          ============================================================= */}
      {showSeatsModal && gameState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#1E1E1E] rounded-3xl border border-white/20 p-5 sm:p-6 max-w-lg w-full text-white shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">
                  {isAr ? 'إدارة مقاعد الغرفة والتبديل الفوري (Hot-Swap)' : 'Room Seats & Hot-Swap Management'}
                </h3>
              </div>
              <button
                onClick={() => setShowSeatsModal(false)}
                className="text-white/60 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanatory banner */}
            <div className="bg-sky-950/40 border border-sky-500/25 rounded-2xl p-3 text-xs space-y-1.5 text-sky-200">
              <p className="font-bold flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-sky-400" />
                <span>
                  {isAr
                    ? 'ملء آلي ذكي وتبديل فوري دون مقاطعة اللعب'
                    : 'Smart AI Auto-Fill & Seamless Hot-Swap'}
                </span>
              </p>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                {isAr
                  ? 'أي مقعد شاغر يمتلئ تلقائياً ببوت ذكي خبير بقوانين التركس واللطوش والشراكة. عند انضمام أي لاعب بشري، يتم التبديل فورياً مع الحفاظ التام على أوراقه ونقاطه.'
                  : 'Empty seats are automatically filled by Smart AI bots running Levant Trix strategies. When a human joins, they take over the exact seat, hand, and scores immediately.'}
              </p>
            </div>

            {/* 4 Seats List */}
            <div className="space-y-2">
              {gameState.players.map((player) => {
                const isMe = player.position === mySeatPos;
                const isPartnerSeat = selectedMode === 'PARTNERSHIP' && player.position === 2;
                return (
                  <div
                    key={player.id}
                    className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={player.avatar}
                          alt={player.name}
                          className="w-10 h-10 rounded-full object-cover border border-white/20"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 text-[11px] p-0.5 rounded-full ${
                            player.isBot ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        >
                          {player.isBot ? '🤖' : '👤'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-white">
                            {player.name}
                          </span>
                          {isMe && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#2EB872] text-black font-black">
                              {isAr ? 'أنت' : 'You'}
                            </span>
                          )}
                          {isPartnerSeat && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-900/70 border border-blue-400/30 text-blue-300 font-bold">
                              {isAr ? 'الشريك 🔒' : 'Partner 🔒'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400">
                          <span>
                            {player.isBot
                              ? isAr
                                ? 'بوت ذكي (Smart AI)'
                                : 'Smart AI Bot'
                              : isAr
                              ? 'لاعب بشري (Human)'
                              : 'Human Player'}
                          </span>
                          <span>•</span>
                          <span>
                            {player.hand.length} {isAr ? 'أوراق' : 'cards'}
                          </span>
                          <span>•</span>
                          <span className="font-mono font-bold text-white">
                            {player.score} {isAr ? 'نقطة' : 'pts'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hot-Swap Action Button */}
                    {!isMe ? (
                      <button
                        onClick={() =>
                          handleHotSwapSeat(
                            player.position,
                            player.isBot ? 'HUMAN' : 'BOT'
                          )
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm ${
                          player.isBot
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-amber-600 hover:bg-amber-500 text-white'
                        }`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>
                          {player.isBot
                            ? isAr
                              ? 'انضمام بشري (Join)'
                              : 'Join as Human'
                            : isAr
                              ? 'تحويل لبوت (To Bot)'
                              : 'Swap to AI'}
                        </span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-bold px-2 py-1 bg-emerald-950/40 rounded-lg border border-emerald-500/20">
                        {isAr ? 'مقعدك الرئيسي' : 'Your Seat'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Simulation Presets */}
            <div className="border-t border-white/10 pt-3 space-y-2">
              <span className="text-[11px] font-bold text-gray-400 block">
                {isAr ? 'سيناريوهات المحاكاة السريعة:' : 'Quick Simulation Presets:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => handleSimulateScenario('PARTNER_HUMAN')}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-sky-300 hover:text-white transition-all cursor-pointer text-center"
                >
                  {isAr ? 'انضمام الشريك (طارق)' : 'Join Human Partner'}
                </button>
                <button
                  onClick={() => handleSimulateScenario('THREE_HUMANS')}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-emerald-300 hover:text-white transition-all cursor-pointer text-center"
                >
                  {isAr ? '3 لاعبين + 1 بوت' : '3 Humans + 1 Bot'}
                </button>
                <button
                  onClick={() => handleSimulateScenario('ALL_BOTS')}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-amber-300 hover:text-white transition-all cursor-pointer text-center"
                >
                  {isAr ? 'إعادة لبوتات ذكية' : 'Reset to AI Bots'}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowSeatsModal(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer transition-colors"
            >
              {isAr ? 'إغلاق والعودة للطاولة' : 'Close and Return to Table'}
            </button>
          </div>
        </div>
      )}

      {/* =============================================================
          MODAL 3: GLOBAL LEADERBOARD MODAL
          ============================================================= */}
      {showLeaderboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="relative max-w-5xl w-full my-auto max-h-[92vh] overflow-y-auto rounded-3xl">
            <TrixLeaderboard
              user={user}
              onClose={() => setShowLeaderboardModal(false)}
              onPlayClick={() => setShowLeaderboardModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// Helper: Render Single Playing Card with Standard Proportions
// Aspect ratio ~2.5:3.5, white card, crisp pips, center emblem
// -------------------------------------------------------------
const RenderSingleCard: React.FC<{ card: TrixCard }> = ({ card }) => {
  return (
    <div
      className="w-[62px] h-[88px] sm:w-[68px] sm:h-[96px] rounded-[7px] sm:rounded-[9px] bg-white border border-neutral-300 shadow-[0_8px_20px_rgba(0,0,0,0.45)] flex flex-col justify-between p-1 sm:p-1.5 select-none text-start animate-scaleIn"
      style={{ color: card.isRed ? '#DC2626' : '#171717' }}
    >
      <div className="flex flex-col items-start leading-none font-black text-xs sm:text-sm tracking-tight select-none">
        <span>{card.label}</span>
        <span className="text-[10px] sm:text-xs leading-none mt-0.5">{card.suitSymbol}</span>
      </div>

      <div className="self-center text-xl sm:text-2xl leading-none select-none">
        {card.suitSymbol}
      </div>

      <div className="self-end leading-none font-black text-[10px] sm:text-xs tracking-tight select-none rotate-180 flex flex-col items-start">
        <span>{card.label}</span>
        <span className="text-[8px] sm:text-[10px] leading-none mt-0.5">{card.suitSymbol}</span>
      </div>
    </div>
  );
};
