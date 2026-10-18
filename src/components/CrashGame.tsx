import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { storage } from '../services/storage';
import { soundManager } from '../services/sound';
import {
  ConnectedWalletState,
  UserProfile,
  CrashHistoryItem,
  CrashParticipant,
} from '../types';
import {
  History,
  BookOpen,
  Plus,
  Users,
  Coins,
  TrendingUp,
  ShieldCheck,
  Zap,
  X,
  Play,
  Pause,
  ArrowUpRight,
  Flame,
} from 'lucide-react';
import { DepositModal } from './DepositModal';
import { RulesModal } from './RulesModal';

export type CrashGameState = 'WAITING' | 'FLYING' | 'CRASHED';

interface CrashGameProps {
  user: UserProfile | null;
  walletState: ConnectedWalletState;
  onUpdateUser: (data: Partial<UserProfile>) => void;
  onShowNotification: (type: 'success' | 'error' | 'win', msg: string) => void;
  onOpenDepositModal?: () => void;
}

export interface BetSlotState {
  amount: number;
  isPlaced: boolean;
  cashedOut: boolean;
  cashoutMultiplier: number | null;
  payout: number | null;
  autoPlayEnabled: boolean;
  autoCashoutEnabled: boolean;
  autoCashoutValue: number;
  source: 'SITE_BALANCE' | 'WEB3_WALLET';
}

/**
 * Real Crash Point Generation using Master Admin settings & provably fair hash
 */
function generateCrashPoint(): { point: number; hash: string } {
  return storage.getCrashPoint();
}

export const CrashGame: React.FC<CrashGameProps> = ({
  user,
  walletState,
  onUpdateUser,
  onShowNotification,
  onOpenDepositModal,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const isJordan = user?.country === 'JO' || user?.currency === 'JOD';
  const isEgypt = user?.country === 'EG' || user?.currency === 'EGP';
  const currencySymbol = isJordan ? 'د.أ' : isEgypt ? 'ج.م' : 'USDT';

  // Game state visible to React
  const [gameState, setGameState] = useState<CrashGameState>('WAITING');
  // 1. Round Timing & Countdown: 8 seconds WAITING countdown
  const [countdown, setCountdown] = useState<number>(8.0);
  const [flightDuration, setFlightDuration] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [crashPoint, setCrashPoint] = useState<number>(() => {
    const init = generateCrashPoint();
    return init.point;
  });
  const [currentRoundHash, setCurrentRoundHash] = useState<string>('0x7a8f...39c');
  const [history, setHistory] = useState<CrashHistoryItem[]>(() => storage.getCrashHistory());

  // Dual Betting Slots State (Default amount: 20 in active currency)
  const [bet1, setBet1] = useState<BetSlotState>({
    amount: isJordan ? 1 : 20,
    isPlaced: false,
    cashedOut: false,
    cashoutMultiplier: null,
    payout: null,
    autoPlayEnabled: false,
    autoCashoutEnabled: false,
    autoCashoutValue: 2.0,
    source: 'SITE_BALANCE',
  });

  const [bet2, setBet2] = useState<BetSlotState>({
    amount: isJordan ? 1 : 20,
    isPlaced: false,
    cashedOut: false,
    cashoutMultiplier: null,
    payout: null,
    autoPlayEnabled: false,
    autoCashoutEnabled: false,
    autoCashoutValue: 3.0,
    source: 'SITE_BALANCE',
  });

  // Active round participants (real users only)
  const [participants, setParticipants] = useState<CrashParticipant[]>([]);

  // Real Stats from real user bets
  const totalBetsCount = user?.totalBetsPlaced ?? 0;
  const totalBetsAmount = Number(
    ((user?.totalWonAmount ?? 0) + (user?.totalLostAmount ?? 0)).toFixed(2)
  );
  const totalProfitAmount = Number(
    Math.max(0, (user?.totalWonAmount ?? 0) - (user?.totalLostAmount ?? 0)).toFixed(2)
  );

  // Modals
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<CrashHistoryItem | null>(null);

  // Canvas & Animation References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // State Machine Refs (protects from re-render resets)
  const gameStateRef = useRef<CrashGameState>('WAITING');
  const waitingStartTimeRef = useRef<number>(performance.now());
  const flightStartTimeRef = useRef<number>(0);
  const crashStartTimeRef = useRef<number>(0);
  const multiplierRef = useRef<number>(1.0);
  const crashPointRef = useRef<number>(crashPoint);
  const roundHashRef = useRef<string>(currentRoundHash);

  // Mirror refs for live reads in requestAnimationFrame
  const userRef = useRef<UserProfile>(user);
  const walletStateRef = useRef<ConnectedWalletState>(walletState);
  const bet1Ref = useRef<BetSlotState>(bet1);
  const bet2Ref = useRef<BetSlotState>(bet2);
  const participantsRef = useRef<CrashParticipant[]>([]);

  // Plane position & visual effects refs
  const lastPlanePosRef = useRef<{ x: number; y: number; angle: number }>({ x: 45, y: 300, angle: 0 });
  const exhaustParticlesRef = useRef<
    Array<{ x: number; y: number; vx: number; vy: number; life: number; decay: number; size: number; color: string }>
  >([]);
  const explosionParticlesRef = useRef<
    Array<{ x: number; y: number; vx: number; vy: number; rot: number; vrot: number; size: number; life: number; decay: number; color: string }>
  >([]);
  const shockwaveRef = useRef<{ radius: number; maxRadius: number; alpha: number }>({ radius: 0, maxRadius: 0, alpha: 0 });

  // Sync state refs
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    walletStateRef.current = walletState;
  }, [walletState]);

  useEffect(() => {
    bet1Ref.current = bet1;
  }, [bet1]);

  useEffect(() => {
    bet2Ref.current = bet2;
  }, [bet2]);

  // Setup participants for a new round (real player bets only, no simulated bots)
  const setupParticipants = useCallback(() => {
    setParticipants([]);
    participantsRef.current = [];
  }, []);

  // Execute cashout for slot 1 or 2
  const executeCashout = useCallback(
    (slotIndex: 1 | 2) => {
      const curMult = multiplierRef.current;
      if (gameStateRef.current !== 'FLYING' || curMult < 1.01) return;

      const targetRef = slotIndex === 1 ? bet1Ref : bet2Ref;
      const setTarget = slotIndex === 1 ? setBet1 : setBet2;
      const currentSlot = targetRef.current;

      if (!currentSlot.isPlaced || currentSlot.cashedOut) return;

      // Real balance payout via storage
      const res = storage.cashOutCrashBet(currentSlot.amount, curMult, currentSlot.source);
      if (res.success) {
        soundManager.playCashout();

        const updatedSlot: BetSlotState = {
          ...currentSlot,
          cashedOut: true,
          cashoutMultiplier: curMult,
          payout: res.payout,
        };

        targetRef.current = updatedSlot;
        setTarget(updatedSlot);

        // Update global user balance
        const updatedUser = storage.getUser();
        if (updatedUser) onUpdateUser(updatedUser);

        // Global user balance is updated above and stats are derived from user

        // Celebrate with confetti
        confetti({
          particleCount: 70,
          spread: 75,
          origin: { y: 0.62 },
          colors: ['#10B981', '#F59E0B', '#FDE047', '#FFFFFF'],
        });

        onShowNotification(
          'win',
          isAr
            ? `كاش أوت ناجح! ربحت ${res.payout} ${currencySymbol} (ربح: +${res.profit} ${currencySymbol}) عند ${curMult.toFixed(2)}x`
            : `Cash out success! Won ${res.payout} ${currencySymbol} (+${res.profit} profit) at ${curMult.toFixed(2)}x`
        );
      }
    },
    [onUpdateUser, onShowNotification, isAr, currencySymbol]
  );

  // Initialize participants on mount
  useEffect(() => {
    setupParticipants();
  }, [setupParticipants]);

  // Master State Machine & Accelerating Flight Animation Loop (requestAnimationFrame)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helper: Draw the 1xBet Sleek Yellow Jet Airplane
    const drawPlane = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      rot: number,
      scale: number = 1
    ) => {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.scale(scale, scale);

      // 1. Dynamic Jet Thruster Flame
      const flameLen = 18 + Math.sin(performance.now() / 25) * 7;
      const fGrad = c.createLinearGradient(-18, 0, -18 - flameLen, 0);
      fGrad.addColorStop(0, '#FFFFFF');
      fGrad.addColorStop(0.25, '#FDE047');
      fGrad.addColorStop(0.65, '#F59E0B');
      fGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      c.fillStyle = fGrad;
      c.beginPath();
      c.moveTo(-18, -4);
      c.lineTo(-18 - flameLen, 0);
      c.lineTo(-18, 4);
      c.closePath();
      c.fill();

      // 2. Main Fuselage (Yellow / Gold Jet)
      const bodyGrad = c.createLinearGradient(0, -6, 0, 6);
      bodyGrad.addColorStop(0, '#FDE047');
      bodyGrad.addColorStop(0.5, '#F59E0B');
      bodyGrad.addColorStop(1, '#D97706');
      c.fillStyle = bodyGrad;
      c.beginPath();
      c.ellipse(0, 0, 24, 6.5, 0, 0, Math.PI * 2);
      c.fill();

      // Upper aerodynamic highlight
      c.fillStyle = 'rgba(255, 255, 255, 0.65)';
      c.beginPath();
      c.ellipse(3, -2.5, 17, 2.2, 0, 0, Math.PI * 2);
      c.fill();

      // 3. Top Delta Wing (Amber/Gold)
      c.fillStyle = '#D97706';
      c.beginPath();
      c.moveTo(-4, -4);
      c.lineTo(-15, -22);
      c.lineTo(7, -4);
      c.closePath();
      c.fill();

      // Wingtip Red Navigation Light
      c.fillStyle = '#EF4444';
      c.beginPath();
      c.arc(-15, -22, 2, 0, Math.PI * 2);
      c.fill();

      // 4. Bottom Delta Wing
      c.fillStyle = '#B45309';
      c.beginPath();
      c.moveTo(-4, 4);
      c.lineTo(-15, 22);
      c.lineTo(7, 4);
      c.closePath();
      c.fill();

      // Wingtip Green Navigation Light
      c.fillStyle = '#10B981';
      c.beginPath();
      c.arc(-15, 22, 2, 0, Math.PI * 2);
      c.fill();

      // 5. Vertical Tail Fin & Rudder
      c.fillStyle = '#EA580C';
      c.beginPath();
      c.moveTo(-15, 0);
      c.lineTo(-23, -12);
      c.lineTo(-12, 0);
      c.closePath();
      c.fill();

      // 6. Cockpit Canopy Glass (Glossy Cyan reflection)
      const glassGrad = c.createLinearGradient(5, -3, 14, 0);
      glassGrad.addColorStop(0, '#FFFFFF');
      glassGrad.addColorStop(0.4, '#BAE6FD');
      glassGrad.addColorStop(1, '#0284C7');
      c.fillStyle = glassGrad;
      c.beginPath();
      c.ellipse(8, -1, 7, 3, 0, 0, Math.PI * 2);
      c.fill();

      c.restore();
    };

    let lastTickSecond = 8;

    // Master Animation Frame Loop
    const frameLoop = () => {
      const now = performance.now();
      const currentState = gameStateRef.current;

      // Dynamic Canvas Resolution Sync
      const rect = canvas.getBoundingClientRect();
      const targetW = Math.max(500, Math.round(rect.width || 720));
      const targetH = Math.max(260, Math.round(rect.height || 320));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const width = canvas.width;
      const height = canvas.height;

      // 1xBet signature dark navy blue background (#0e1929)
      ctx.fillStyle = '#0e1929';
      ctx.fillRect(0, 0, width, height);

      // Fine coordinate grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridStep = 36;
      for (let x = 0; x < width; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Subtle faint low-opacity clouds behind ascending airplane
      ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.beginPath();
      ctx.arc(width * 0.28, height * 0.38, 65, 0, Math.PI * 2);
      ctx.arc(width * 0.62, height * 0.25, 80, 0, Math.PI * 2);
      ctx.arc(width * 0.82, height * 0.55, 55, 0, Math.PI * 2);
      ctx.fill();

      // Origin Axes
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(35, height - 35);
      ctx.lineTo(width - 20, height - 35);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(35, height - 35);
      ctx.lineTo(35, 20);
      ctx.stroke();

      // Flight coordinates
      const startX = 42;
      const startY = height - 40;
      const maxFlightW = width - 120;
      const maxFlightH = height - 75;

      // -------------------------------------------------------------
      // STATE 1: WAITING (8.0s countdown before takeoff)
      // -------------------------------------------------------------
      if (currentState === 'WAITING') {
        const elapsedWaiting = now - waitingStartTimeRef.current;
        const remainingSec = Math.max(0, (8000 - elapsedWaiting) / 1000);
        setCountdown(Number(remainingSec.toFixed(1)));

        // Audio tick in final 3 seconds
        const currentSecInt = Math.ceil(remainingSec);
        if (currentSecInt !== lastTickSecond && currentSecInt <= 3 && currentSecInt > 0) {
          lastTickSecond = currentSecInt;
          soundManager.playTick();
        }

        // Draw runway marking
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.setLineDash([12, 10]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(35, startY + 10);
        ctx.lineTo(width - 20, startY + 10);
        ctx.stroke();
        ctx.restore();

        // Idle gentle bob on the runway
        const idleBob = Math.sin(now / 220) * 1.5;
        drawPlane(ctx, startX, startY + idleBob, 0, 1.0);
        lastPlanePosRef.current = { x: startX, y: startY, angle: 0 };

        // Check if countdown ended -> transition to FLYING
        if (elapsedWaiting >= 8000) {
          gameStateRef.current = 'FLYING';
          flightStartTimeRef.current = performance.now();
          multiplierRef.current = 1.0;
          setGameState('FLYING');
          setMultiplier(1.0);
          soundManager.playPlaneTakeoff();
        }
      }

      // -------------------------------------------------------------
      // STATE 2: FLYING (Faster Accelerating Growth Multiplier & Bezier Curve)
      // Accelerating growth formula: multiplier = 1.0 + Math.pow(elapsedSec * 0.58, 1.92)
      // -------------------------------------------------------------
      else if (currentState === 'FLYING') {
        const elapsedSec = (now - flightStartTimeRef.current) / 1000;
        setFlightDuration(Number(elapsedSec.toFixed(1)));
        // Faster accelerating growth multiplier
        const currentMult = 1.0 + Math.pow(elapsedSec * 0.58, 1.92);
        multiplierRef.current = currentMult;
        setMultiplier(Number(currentMult.toFixed(2)));

        // Auto Cashout check for Bet 1
        const b1 = bet1Ref.current;
        if (b1.isPlaced && !b1.cashedOut && b1.autoCashoutEnabled && currentMult >= b1.autoCashoutValue) {
          executeCashout(1);
        }

        // Auto Cashout check for Bet 2
        const b2 = bet2Ref.current;
        if (b2.isPlaced && !b2.cashedOut && b2.autoCashoutEnabled && currentMult >= b2.autoCashoutValue) {
          executeCashout(2);
        }

        // Smooth visual flight progress
        const normalized = Math.max(0, currentMult - 1.0) / (currentMult + 1.8);
        const progress = Math.min(0.95, Math.pow(normalized, 0.72) * 1.15);

        const targetX = startX + progress * maxFlightW;
        const targetY = startY - progress * maxFlightH;

        // Cubic Bezier Control Points (ctx.bezierCurveTo)
        const cp1x = startX + (targetX - startX) * 0.45;
        const cp1y = startY;
        const cp2x = startX + (targetX - startX) * 0.82;
        const cp2y = startY - (startY - targetY) * 0.38;

        // Tangent derivative for slope angle
        const tangentDx = 3 * (targetX - cp2x);
        const tangentDy = 3 * (targetY - cp2y);
        const baseAngle = Math.atan2(tangentDy, tangentDx);

        const hoverY = Math.sin(now / 130) * 1.8;
        const hoverAngle = Math.cos(now / 160) * 0.025;

        const planeX = targetX;
        const planeY = targetY + hoverY;
        const planeAngle = baseAngle + hoverAngle;

        lastPlanePosRef.current = { x: planeX, y: planeY, angle: planeAngle };

        // 1. Shaded area below Bezier curve
        const fillGrad = ctx.createLinearGradient(0, planeY, 0, startY);
        fillGrad.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
        fillGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.08)');
        fillGrad.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, planeX, planeY);
        ctx.lineTo(planeX, startY);
        ctx.closePath();
        ctx.fill();

        // 2. Trajectory Glow Stroke
        ctx.save();
        ctx.lineWidth = 6;
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, planeX, planeY);
        ctx.stroke();
        ctx.restore();

        // 3. Core Line
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#FDE047';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, planeX, planeY);
        ctx.stroke();

        // 4. Exhaust Particles
        const tailOffset = 20;
        const tailX = planeX - Math.cos(planeAngle) * tailOffset;
        const tailY = planeY - Math.sin(planeAngle) * tailOffset;

        for (let i = 0; i < 2; i++) {
          const spread = (Math.random() - 0.5) * 0.4;
          const pAngle = planeAngle + Math.PI + spread;
          const speed = 2.5 + Math.random() * 3.5;
          exhaustParticlesRef.current.push({
            x: tailX,
            y: tailY,
            vx: Math.cos(pAngle) * speed,
            vy: Math.sin(pAngle) * speed,
            life: 1.0,
            decay: 0.04 + Math.random() * 0.03,
            size: 3.5 + Math.random() * 3.5,
            color: Math.random() > 0.4 ? '#F59E0B' : Math.random() > 0.5 ? '#FDE047' : '#EF4444',
          });
        }

        // Draw the Yellow Jet
        drawPlane(ctx, planeX, planeY, planeAngle, 1.0);

        // Check if Plane Crashed (multiplier >= crashPoint)
        if (currentMult >= crashPointRef.current) {
          gameStateRef.current = 'CRASHED';
          crashStartTimeRef.current = performance.now();
          multiplierRef.current = crashPointRef.current;
          setGameState('CRASHED');
          setMultiplier(crashPointRef.current);
          soundManager.playPlaneCrash();

          // Spawn explosion particles
          const pX = lastPlanePosRef.current.x;
          const pY = lastPlanePosRef.current.y;
          const debrisColors = ['#EF4444', '#F59E0B', '#F97316', '#FBBF24', '#FFFFFF', '#DC2626'];
          const parts = [];
          for (let i = 0; i < 45; i++) {
            const pAngle = Math.random() * Math.PI * 2;
            const speed = 3.0 + Math.random() * 8;
            parts.push({
              x: pX,
              y: pY,
              vx: Math.cos(pAngle) * speed,
              vy: Math.sin(pAngle) * speed,
              rot: Math.random() * Math.PI * 2,
              vrot: (Math.random() - 0.5) * 0.4,
              size: 3 + Math.random() * 6,
              life: 1.0,
              decay: 0.02 + Math.random() * 0.025,
              color: debrisColors[Math.floor(Math.random() * debrisColors.length)],
            });
          }
          explosionParticlesRef.current = parts;
          shockwaveRef.current = { radius: 8, maxRadius: 85, alpha: 1.0 };

          // Record losses for uncashed bets
          const activeBet1 = bet1Ref.current;
          if (activeBet1.isPlaced && !activeBet1.cashedOut) {
            storage.recordCrashLoss(activeBet1.amount);
          }
          const activeBet2 = bet2Ref.current;
          if (activeBet2.isPlaced && !activeBet2.cashedOut) {
            storage.recordCrashLoss(activeBet2.amount);
          }

          // Save round to history
          storage.addCrashHistory(crashPointRef.current, roundHashRef.current);
          setHistory([...storage.getCrashHistory()]);
        }
      }

      // -------------------------------------------------------------
      // STATE 3: CRASHED (3.0s explosion and Flew Away display)
      // -------------------------------------------------------------
      else if (currentState === 'CRASHED') {
        const elapsedCrash = now - crashStartTimeRef.current;

        // Draw fading trajectory line in red
        const pX = lastPlanePosRef.current.x;
        const pY = lastPlanePosRef.current.y;
        const cp1x = startX + (pX - startX) * 0.45;
        const cp1y = startY;
        const cp2x = startX + (pX - startX) * 0.82;
        const cp2y = startY - (startY - pY) * 0.38;

        const fillGrad = ctx.createLinearGradient(0, pY, 0, startY);
        fillGrad.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
        fillGrad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pX, pY);
        ctx.lineTo(pX, startY);
        ctx.closePath();
        ctx.fill();

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#EF4444';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pX, pY);
        ctx.stroke();

        // Expanding Shockwave
        if (shockwaveRef.current.alpha > 0.01) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(pX, pY, shockwaveRef.current.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(239, 68, 68, ${shockwaveRef.current.alpha * 0.9})`;
          ctx.lineWidth = 3.5;
          ctx.stroke();
          ctx.restore();

          shockwaveRef.current.radius += 3.0;
          shockwaveRef.current.alpha *= 0.94;
        }

        // Explosion Debris Shards
        explosionParticlesRef.current.forEach((p) => {
          if (p.life > 0) {
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vrot;
            p.life -= p.decay;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
          }
        });

        // Center Flash
        ctx.save();
        const flashGrad = ctx.createRadialGradient(pX, pY, 2, pX, pY, 32);
        flashGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        flashGrad.addColorStop(0.3, 'rgba(245, 158, 11, 0.85)');
        flashGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.5)');
        flashGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.arc(pX, pY, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // After 3.0 seconds -> Transition back to WAITING (8s countdown)
        if (elapsedCrash >= 3000) {
          const nextData = generateCrashPoint();
          crashPointRef.current = nextData.point;
          roundHashRef.current = nextData.hash;
          setCrashPoint(nextData.point);
          setCurrentRoundHash(nextData.hash);

          // Reset timers and states for 8 seconds WAITING
          gameStateRef.current = 'WAITING';
          waitingStartTimeRef.current = performance.now();
          multiplierRef.current = 1.0;
          setGameState('WAITING');
          setMultiplier(1.0);
          setCountdown(8.0);
          lastTickSecond = 8;

          exhaustParticlesRef.current = [];
          explosionParticlesRef.current = [];
          shockwaveRef.current = { radius: 0, maxRadius: 0, alpha: 0 };

          // Handle Auto Play for Slot 1
          setBet1((prev) => {
            if (prev.autoPlayEnabled) {
              const freshUser = storage.getUser();
              if (freshUser && freshUser.balance >= prev.amount) {
                storage.placeCrashBet(prev.amount, prev.source);
                const u = storage.getUser();
                if (u) onUpdateUser(u);
                return {
                  ...prev,
                  isPlaced: true,
                  cashedOut: false,
                  cashoutMultiplier: null,
                  payout: null,
                };
              } else {
                onShowNotification('error', isAr ? 'الرصيد غير كافٍ للتشغيل التلقائي.' : 'Insufficient balance for auto bet.');
                return {
                  ...prev,
                  autoPlayEnabled: false,
                  isPlaced: false,
                  cashedOut: false,
                  cashoutMultiplier: null,
                  payout: null,
                };
              }
            }
            return {
              ...prev,
              isPlaced: false,
              cashedOut: false,
              cashoutMultiplier: null,
              payout: null,
            };
          });

          // Handle Auto Play for Slot 2
          setBet2((prev) => {
            if (prev.autoPlayEnabled) {
              const freshUser = storage.getUser();
              if (freshUser && freshUser.balance >= prev.amount) {
                storage.placeCrashBet(prev.amount, prev.source);
                const u = storage.getUser();
                if (u) onUpdateUser(u);
                return {
                  ...prev,
                  isPlaced: true,
                  cashedOut: false,
                  cashoutMultiplier: null,
                  payout: null,
                };
              } else {
                return {
                  ...prev,
                  autoPlayEnabled: false,
                  isPlaced: false,
                  cashedOut: false,
                  cashoutMultiplier: null,
                  payout: null,
                };
              }
            }
            return {
              ...prev,
              isPlaced: false,
              cashedOut: false,
              cashoutMultiplier: null,
              payout: null,
            };
          });

          setupParticipants();
        }
      }

      // Render Exhaust Particles
      for (let i = exhaustParticlesRef.current.length - 1; i >= 0; i--) {
        const p = exhaustParticlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.size *= 0.96;

        if (p.life <= 0) {
          exhaustParticlesRef.current.splice(i, 1);
        } else {
          ctx.save();
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.life * 0.85);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      animFrameIdRef.current = requestAnimationFrame(frameLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(frameLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [executeCashout, isAr, onShowNotification, onUpdateUser, setupParticipants]);

  // Place or Cancel Bet handler
  const handleToggleBet = (slotIndex: 1 | 2) => {
    const targetState = slotIndex === 1 ? bet1 : bet2;
    const setTarget = slotIndex === 1 ? setBet1 : setBet2;

    if (targetState.isPlaced) {
      if (gameStateRef.current === 'WAITING') {
        storage.refundCrashBet(targetState.amount, targetState.source);
        const u = storage.getUser();
        if (u) onUpdateUser(u);
        setTarget((prev) => ({ ...prev, isPlaced: false }));
        onShowNotification('success', isAr ? 'تم إلغاء الرهان واسترجاع المبلغ.' : 'Bet cancelled and refunded.');
      }
      return;
    }

    if (gameStateRef.current !== 'WAITING' || countdown <= 5) {
      onShowNotification(
        'error',
        isAr ? 'تم إغلاق باب الرهانات (أقل من 5 ثوانٍ متبقية أو الطائرة تحلق).' : 'Betting is locked (less than 5 seconds remaining or flying).'
      );
      return;
    }

    if (targetState.amount <= 0) {
      onShowNotification('error', isAr ? 'يرجى تحديد مبلغ الرهان.' : 'Please enter bet amount.');
      return;
    }

    const res = storage.placeCrashBet(targetState.amount, targetState.source);
    if (!res.success) {
      onShowNotification('error', res.error || (isAr ? 'فشل تسجيل الرهان.' : 'Failed to place bet.'));
      return;
    }

    soundManager.playPlaceBet();
    setTarget((prev) => ({
      ...prev,
      isPlaced: true,
      cashedOut: false,
      cashoutMultiplier: null,
      payout: null,
    }));
    const freshU = storage.getUser();
    if (freshU) onUpdateUser(freshU);

    onShowNotification(
      'success',
      isAr
        ? `تم وضع الرهان: ${targetState.amount} ${currencySymbol} (لوحة #${slotIndex})`
        : `Bet placed: ${targetState.amount} ${currencySymbol} (Panel #${slotIndex})`
    );
  };

  const getMultiplierBadgeStyle = (mult: number) => {
    if (mult < 2.0) {
      return 'bg-[#132238] text-[#38BDF8] border-[#38BDF8]/30 hover:border-[#38BDF8]';
    } else if (mult < 10.0) {
      return 'bg-[#281338] text-[#C084FC] border-[#C084FC]/40 hover:border-[#C084FC] font-bold';
    } else {
      return 'bg-[#382b13] text-[#FDE047] border-[#FDE047]/60 hover:border-[#FDE047] font-black shadow-[0_0_12px_rgba(253,224,71,0.25)]';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 space-y-3 select-none">
      {/* =========================================================================
          1. TOP BAR: [السجل] [الأحكام والشروط] [الرصيد: 2,340.50 EGP] [+] [إيداع]
          ========================================================================= */}
      <div className="bg-[#0e1929] border border-[#1e293b] rounded-2xl p-2.5 sm:px-4 flex items-center justify-between gap-3 shadow-lg text-white">
        <div className="flex items-center gap-2">
          {/* History Button ("السجل") */}
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-xs font-bold text-[#E2E8F0] transition-colors cursor-pointer border border-white/5 shadow-xs"
          >
            <History className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>{isAr ? 'السجل' : 'History'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Real Balance display e.g. "2,340.50 د.أ" */}
          <div className="flex items-center gap-2 bg-[#0a111c] px-3.5 py-1.5 rounded-xl border border-white/10 font-mono text-sm font-black text-white">
            <span className="text-xs text-[#94A3B8] font-sans font-bold">
              {isAr ? 'الرصيد:' : 'Balance:'}
            </span>
            <span className="text-base font-black text-[#10B981]">
              {(user?.balance ?? 0).toFixed(2)}
            </span>
            <span className="text-xs text-[#F59E0B] font-sans font-bold">{currencySymbol}</span>
          </div>

          {/* Green Deposit Button [+] */}
          <button
            type="button"
            onClick={() => {
              if (onOpenDepositModal) {
                onOpenDepositModal();
              } else {
                setIsDepositOpen(true);
              }
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            title={isAr ? 'إيداع رصيد جديد' : 'Deposit funds'}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">{isAr ? 'إيداع' : 'Deposit'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. COMPACT AIRPLANE CHART CONTAINER (Mobile Portrait Optimized)
          - Responsive compact height so plane and cashout buttons fit in single mobile screen
          - Swapped counters: Game Timer placed where takeoff flight duration used to be!
          ========================================================================= */}
      <div className="w-full max-w-3xl mx-auto bg-[#0e1929] border border-[#1e293b] rounded-3xl overflow-hidden relative shadow-2xl h-[210px] sm:h-[300px] flex flex-col justify-between">
        {/* Top-Left Provably Fair Round Badge inside chart */}
        <div className="p-3 sm:p-4 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-[#94A3B8] border border-white/10 text-[11px] font-mono flex items-center gap-1.5" title={currentRoundHash}>
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="truncate max-w-[90px] sm:max-w-[130px]">
                {currentRoundHash.length > 12 ? `${currentRoundHash.slice(0, 6)}...${currentRoundHash.slice(-4)}` : currentRoundHash}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3 h-3 fill-current text-[#F59E0B]" />
              <span>Aviator</span>
            </span>
          </div>
        </div>

        {/* STRICTLY TOP-RIGHT CORNER GIANT MULTIPLIER COUNTER */}
        <div className="absolute top-2.5 sm:top-4 right-3 sm:right-6 pointer-events-none z-20 text-right dir-ltr">
          {gameState === 'FLYING' && (
            <div className="space-y-0 text-right animate-in zoom-in-95">
              <div className="text-4xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight text-white drop-shadow-[0_8px_24px_rgba(255,255,255,0.4)]">
                {multiplier.toFixed(2)}
                <span className="text-2xl sm:text-4xl text-[#F59E0B] font-bold ms-1">x</span>
              </div>
              <span className="text-[10px] sm:text-xs font-black text-[#F59E0B] animate-pulse block uppercase tracking-wider drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]">
                {isAr ? 'في الجو... اسحب أرباحك!' : 'Flying... Cash Out!'}
              </span>
            </div>
          )}

          {gameState === 'CRASHED' && (
            <div className="space-y-1 text-right animate-in zoom-in duration-150">
              <span className="px-2.5 py-0.5 rounded-xl bg-[#EF4444]/20 border border-[#EF4444] text-[#EF4444] text-[10px] sm:text-xs font-black tracking-wider uppercase inline-block drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]">
                {isAr ? 'طارت الطائرة!' : 'FLEW AWAY!'}
              </span>
              <div className="text-3xl sm:text-5xl font-black font-mono text-[#EF4444] drop-shadow-[0_6px_20px_rgba(239,68,68,0.5)]">
                {multiplier.toFixed(2)}
                <span className="text-xl sm:text-2xl text-[#EF4444]">x</span>
              </div>
            </div>
          )}
        </div>

        {/* SWAPPED COUNTERS: Game Timer in place of Takeoff Countdown! */}
        {gameState === 'WAITING' ? (
          <div className="absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#F59E0B]/50 flex items-center gap-2 z-20 shadow-lg animate-in fade-in">
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-bold text-[#F59E0B] uppercase tracking-wider">
                {isAr ? 'مدة إقلاع الطائرة' : 'TAKEOFF COUNTDOWN'}
              </span>
              <span className="text-lg sm:text-2xl font-black font-mono text-white leading-none">
                {countdown.toFixed(1)}s
              </span>
            </div>
            {countdown <= 5 && (
              <span className="text-[10px] font-black bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded animate-pulse border border-red-500/30">
                {isAr ? 'مغلق' : 'LOCKED'}
              </span>
            )}
          </div>
        ) : gameState === 'FLYING' ? (
          <div className="absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#10B981]/50 flex items-center gap-2 z-20 shadow-lg animate-in fade-in">
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-bold text-[#34D399] uppercase tracking-wider">
                {isAr ? '⏱️ مؤقت اللعبة' : '⏱️ GAME TIMER'}
              </span>
              <span className="text-lg sm:text-2xl font-black font-mono text-white leading-none">
                00:{flightDuration < 10 ? '0' : ''}{flightDuration.toFixed(1)}s
              </span>
            </div>
          </div>
        ) : (
          <div className="absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#EF4444]/40 flex items-center gap-2 z-20 shadow-lg">
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-bold text-[#F87171] uppercase tracking-wider">
                {isAr ? 'مدة الجولة' : 'ROUND DURATION'}
              </span>
              <span className="text-sm sm:text-lg font-black font-mono text-[#F87171] leading-none">
                {flightDuration.toFixed(1)}s
              </span>
            </div>
          </div>
        )}

        {/* HTML5 Canvas */}
        <canvas
          ref={canvasRef}
          width={720}
          height={300}
          className="w-full h-full object-cover flex-1"
        />
      </div>



      {/* =========================================================================
          3. DUAL BETTING PANELS (EXACT 1XBET STACKED LAYOUT)
          - Two identical panels stacked vertically
          - Top row: Auto Play toggle on the left, Input field with delete (X) and default (20) on the right
          - Bottom row: Large orange action button on the left, 2x3 quick grid ([10, 50, 100], [400, 1000, 5000]) on the right
          ========================================================================= */}
      <div className="space-y-3">
        {/* Betting Panel 1 */}
        <BetPanelCard
          slotIndex={1}
          betState={bet1}
          onChangeBetState={setBet1}
          gameState={gameState}
          countdown={countdown}
          currentMultiplier={multiplier}
          currencySymbol={currencySymbol}
          onToggleBet={() => handleToggleBet(1)}
          onCashout={() => executeCashout(1)}
          isAr={isAr}
        />

        {/* Betting Panel 2 */}
        <BetPanelCard
          slotIndex={2}
          betState={bet2}
          onChangeBetState={setBet2}
          gameState={gameState}
          countdown={countdown}
          currentMultiplier={multiplier}
          currencySymbol={currencySymbol}
          onToggleBet={() => handleToggleBet(2)}
          onCashout={() => executeCashout(2)}
          isAr={isAr}
        />
      </div>

      {/* =========================================================================
          4. STATS BAR (DARK-RED BACKGROUND, 3 COLUMNS FROM RIGHT TO LEFT)
          - عدد الرهانات (Total Bets count with user icon, e.g. 249)
          - مجموع الرهانات (Total Bets amount, e.g. 17521.29 EGP)
          - مجموع الربح (Total Profit, e.g. 764.82 EGP)
          ========================================================================= */}
      <div className="bg-[#3A080E] border border-[#5A1018] rounded-2xl p-2.5 sm:p-3 text-white shadow-xl">
        <div className="grid grid-cols-3 divide-x divide-x-reverse divide-[#5A1018]/80 text-center items-center">
          {/* Column 1 (Rightmost in RTL): عدد الرهانات */}
          <div className="px-2">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#FCA5A5] mb-0.5">
              <Users className="w-3.5 h-3.5 text-[#F87171]" />
              <span>{isAr ? 'عدد الرهانات' : 'Total Bets'}</span>
            </div>
            <div className="font-mono text-base sm:text-lg font-black text-white">
              {totalBetsCount}
            </div>
          </div>

          {/* Column 2 (Middle in RTL): مجموع الرهانات */}
          <div className="px-2">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#FCA5A5] mb-0.5">
              <Coins className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>{isAr ? 'مجموع الرهانات' : 'Total Bets Volume'}</span>
            </div>
            <div className="font-mono text-base sm:text-lg font-black text-[#FDE047]">
              {totalBetsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
            </div>
          </div>

          {/* Column 3 (Leftmost in RTL): مجموع الربح */}
          <div className="px-2">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#FCA5A5] mb-0.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#34D399]" />
              <span>{isAr ? 'مجموع الربح' : 'Total Profit'}</span>
            </div>
            <div className="font-mono text-base sm:text-lg font-black text-[#34D399]">
              {totalProfitAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. LIVE PLAYERS TABLE
          - Columns from right to left: اسم المستخدم | الفرص | الرهان | الأرباح
          - Masked IDs (e.g. 23*******), x0 / multiplier, active bets in EGP, profits
          ========================================================================= */}
      <div className="bg-[#0e1929] border border-[#1e293b] rounded-2xl p-3 sm:p-4 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#F59E0B]" />
            <h3 className="text-sm font-black">
              {isAr ? 'جدول المشاركين الحي' : 'Live Players'}
            </h3>
          </div>
          <span className="text-xs font-mono text-[#94A3B8] bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
            {participants.length + (bet1.isPlaced ? 1 : 0) + (bet2.isPlaced ? 1 : 0)}{' '}
            {isAr ? 'لاعب' : 'players'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-[#1e293b] text-[#94A3B8]">
                <th className="py-2.5 px-3 text-start font-bold">
                  {isAr ? 'اسم المستخدم' : 'Username'}
                </th>
                <th className="py-2.5 px-3 text-center font-bold">
                  {isAr ? 'الفرص' : 'Odds'}
                </th>
                <th className="py-2.5 px-3 text-end font-bold">
                  {isAr ? 'الرهان' : 'Bet'}
                </th>
                <th className="py-2.5 px-3 text-end font-bold">
                  {isAr ? 'الأرباح' : 'Profit'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/60 font-mono">
              {/* User Bet 1 */}
              {bet1.isPlaced && (
                <tr className="bg-[#F59E0B]/10 text-white font-bold">
                  <td className="py-2.5 px-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
                    <span>
                      {user?.phoneNumber ? user.phoneNumber.slice(0, 4) + '****' : (isAr ? 'رهانك #1' : 'Your Bet #1')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {bet1.cashedOut ? (
                      <span className="px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-black">
                        {bet1.cashoutMultiplier?.toFixed(2)}x
                      </span>
                    ) : (
                      <span className="text-[#94A3B8]">x0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-end text-white">
                    {bet1.amount.toFixed(2)} {currencySymbol}
                  </td>
                  <td className="py-2.5 px-3 text-end">
                    {bet1.cashedOut ? (
                      <span className="text-[#10B981] font-black">
                        +{bet1.payout?.toFixed(2)} {currencySymbol}
                      </span>
                    ) : gameState === 'CRASHED' ? (
                      <span className="text-[#EF4444]">0.00 {currencySymbol}</span>
                    ) : (
                      <span className="text-[#94A3B8]">...</span>
                    )}
                  </td>
                </tr>
              )}

              {/* User Bet 2 */}
              {bet2.isPlaced && (
                <tr className="bg-[#F59E0B]/10 text-white font-bold">
                  <td className="py-2.5 px-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
                    <span>
                      {user?.phoneNumber ? user.phoneNumber.slice(0, 4) + '****' : (isAr ? 'رهانك #2' : 'Your Bet #2')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {bet2.cashedOut ? (
                      <span className="px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-black">
                        {bet2.cashoutMultiplier?.toFixed(2)}x
                      </span>
                    ) : (
                      <span className="text-[#94A3B8]">x0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-end text-white">
                    {bet2.amount.toFixed(2)} {currencySymbol}
                  </td>
                  <td className="py-2.5 px-3 text-end">
                    {bet2.cashedOut ? (
                      <span className="text-[#10B981] font-black">
                        +{bet2.payout?.toFixed(2)} {currencySymbol}
                      </span>
                    ) : gameState === 'CRASHED' ? (
                      <span className="text-[#EF4444]">0.00 {currencySymbol}</span>
                    ) : (
                      <span className="text-[#94A3B8]">...</span>
                    )}
                  </td>
                </tr>
              )}

              {/* Real Bets Only (No Fake Bot Rows) */}
              {!bet1.isPlaced && !bet2.isPlaced && participants.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[#94A3B8] text-xs font-bold">
                    {isAr
                      ? 'لا توجد رهانات نشطة في هذه الجولة. ضع رهانك الآن للمشاركة وسحب الأرباح!'
                      : 'No active bets in this round. Place your bet to fly and cash out!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        user={user}
        settings={storage.getSettings()}
        onDepositSuccess={() => {
          const u = storage.getUser();
          if (u) onUpdateUser(u);
        }}
        onShowNotification={onShowNotification}
      />

      {/* Rules Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Provably Fair History Modal */}
      {(isHistoryModalOpen || selectedHistoryItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0e1929] border border-[#1e293b] rounded-3xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                <h3 className="text-base font-black">
                  {isAr ? 'سجل وعدالة جولات الطائرة' : 'Aviator Provably Fair'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setSelectedHistoryItem(null);
                }}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-[#132238]/60 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <span className="text-[10px] text-[#94A3B8] block">#{item.id}</span>
                    <span className="text-[#38BDF8] truncate max-w-[160px] block text-[10px]">
                      {item.hash}
                    </span>
                  </div>
                  <div className="text-end">
                    <span className={`text-base font-black ${item.multiplier >= 10 ? 'text-[#FDE047]' : item.multiplier >= 2 ? 'text-[#C084FC]' : 'text-[#38BDF8]'}`}>
                      {item.multiplier.toFixed(2)}x
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsHistoryModalOpen(false);
                setSelectedHistoryItem(null);
              }}
              className="w-full py-2.5 rounded-xl bg-[#F59E0B] text-black font-extrabold text-xs cursor-pointer hover:bg-[#D97706] transition-colors"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// REUSABLE BET PANEL CARD (EXACT 1XBET STRUCTURE)
// - Top Row: "تمكين التشغيل التلقائي" (left) | Input + Delete (X) + Default (20) (right)
// - Bottom Row: Large Orange Action Button (left) | 2x3 Grid [10, 50, 100], [400, 1000, 5000] (right)
// =========================================================================
interface BetPanelCardProps {
  slotIndex: 1 | 2;
  betState: BetSlotState;
  onChangeBetState: React.Dispatch<React.SetStateAction<BetSlotState>>;
  gameState: CrashGameState;
  countdown: number;
  currentMultiplier: number;
  currencySymbol: string;
  onToggleBet: () => void;
  onCashout: () => void;
  isAr: boolean;
}

const BetPanelCard: React.FC<BetPanelCardProps> = ({
  slotIndex,
  betState,
  onChangeBetState,
  gameState,
  countdown,
  currentMultiplier,
  currencySymbol,
  onToggleBet,
  onCashout,
  isAr,
}) => {
  const currentLivePayout = Number((betState.amount * currentMultiplier).toFixed(2));
  const currentLiveProfit = Number(Math.max(0, currentLivePayout - betState.amount).toFixed(2));

  // 2x3 Grid of quick amount buttons adapted to currency:
  const isJordanianCurrency = currencySymbol === 'د.أ';
  const quickAmountsRow1 = isJordanianCurrency ? [1, 2, 5] : [10, 50, 100];
  const quickAmountsRow2 = isJordanianCurrency ? [10, 20, 50] : [400, 1000, 5000];

  return (
    <div className="bg-[#101b2b] border border-[#1e2e42] rounded-2xl p-2.5 sm:p-3.5 text-white shadow-xl space-y-2">
      {/* =====================================================================
          TOP ROW:
          - "تمكين التشغيل التلقائي" (Auto Play) on the left
          - Clear input field with delete button (X) and default on the right
          ===================================================================== */}
      <div className="flex flex-row items-center justify-between gap-3">
        {/* RIGHT in RTL: Input field with delete (X) button */}
        <div className="flex-1 max-w-[240px] sm:max-w-[280px]">
          <div className="relative">
            <input
              type="number"
              min={isJordanianCurrency ? 1 : 10}
              max={50000}
              disabled={betState.isPlaced}
              value={betState.amount || ''}
              onChange={(e) =>
                onChangeBetState((prev) => ({
                  ...prev,
                  amount: Math.max(0, parseFloat(e.target.value) || 0),
                }))
              }
              className="w-full ps-3.5 pe-16 py-1.5 sm:py-2 bg-black/60 border border-[#2b3c52] rounded-xl font-mono text-sm sm:text-base font-bold text-white focus:outline-none focus:border-[#F59E0B]"
            />

            {/* Delete button (X) */}
            {betState.amount > 0 && !betState.isPlaced && (
              <button
                type="button"
                onClick={() => onChangeBetState((prev) => ({ ...prev, amount: 0 }))}
                className="absolute end-10 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-white rounded-full transition-colors cursor-pointer"
                title={isAr ? 'مسح' : 'Clear'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <span className="absolute end-2.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-[#F59E0B]">
              {currencySymbol}
            </span>
          </div>
        </div>

        {/* LEFT in RTL: "تمكين التشغيل التلقائي" (Auto Play) checkbox / toggle */}
        <div className="flex items-center gap-2">
          {/* Auto Cashout optional input */}
          <div className="hidden sm:flex items-center gap-1">
            <label className="flex items-center gap-1 cursor-pointer text-[11px] text-[#CBD5E1]">
              <input
                type="checkbox"
                checked={betState.autoCashoutEnabled}
                onChange={(e) =>
                  onChangeBetState((prev) => ({ ...prev, autoCashoutEnabled: e.target.checked }))
                }
                className="w-3.5 h-3.5 accent-[#F59E0B] rounded cursor-pointer"
              />
              <span className="font-bold">{isAr ? 'سحب آلي' : 'Auto'}</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="1.05"
              max="100"
              disabled={!betState.autoCashoutEnabled}
              value={betState.autoCashoutValue}
              onChange={(e) =>
                onChangeBetState((prev) => ({
                  ...prev,
                  autoCashoutValue: Math.max(1.05, parseFloat(e.target.value) || 2.0),
                }))
              }
              className={`w-14 px-1.5 py-0.5 bg-black/70 border rounded-lg font-mono text-[11px] font-bold text-center focus:outline-none ${
                betState.autoCashoutEnabled
                  ? 'border-[#F59E0B] text-[#F59E0B]'
                  : 'border-[#334155] text-[#64748B]'
              }`}
            />
            <span className="font-mono text-[11px] text-[#94A3B8]">x</span>
          </div>

          {/* "تمكين التشغيل التلقائي" Button Toggle */}
          <button
            type="button"
            onClick={() =>
              onChangeBetState((prev) => ({ ...prev, autoPlayEnabled: !prev.autoPlayEnabled }))
            }
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              betState.autoPlayEnabled
                ? 'bg-[#10B981] text-black border-[#10B981] shadow-xs'
                : 'bg-[#162436] text-[#94A3B8] hover:text-white border-white/5'
            }`}
          >
            {betState.autoPlayEnabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="text-[11px] sm:text-xs">
              {isAr
                ? betState.autoPlayEnabled
                  ? 'التشغيل التلقائي: مفعّل'
                  : 'تمكين التشغيل التلقائي'
                : betState.autoPlayEnabled
                ? 'Auto Play: ON'
                : 'Enable Auto Play'}
            </span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          MAIN / BOTTOM ROW:
          - A precise 2x3 grid of quick amount buttons on the right:
            Row 1: [10], [50], [100]
            Row 2: [400], [1000], [5000]
          - A large orange action button on the left:
            "وضع الرهان (على الجولة التالية)"
          ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
        {/* RIGHT in RTL: 2x3 Grid of Quick Amount Buttons */}
        <div className="sm:col-span-6 space-y-1.5 flex flex-col justify-center">
          {/* Row 1: [10], [50], [100] */}
          <div className="grid grid-cols-3 gap-1.5">
            {quickAmountsRow1.map((q) => (
              <button
                key={q}
                type="button"
                disabled={betState.isPlaced}
                onClick={() => onChangeBetState((prev) => ({ ...prev, amount: q }))}
                className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-mono font-black border transition-all cursor-pointer ${
                  betState.amount === q
                    ? 'bg-[#F59E0B] text-black border-[#F59E0B] shadow-xs scale-102'
                    : 'bg-[#162436] border-[#2b3c52] text-[#CBD5E1] hover:text-white hover:border-[#F59E0B]/50'
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Row 2: [400], [1000], [5000] */}
          <div className="grid grid-cols-3 gap-1.5">
            {quickAmountsRow2.map((q) => (
              <button
                key={q}
                type="button"
                disabled={betState.isPlaced}
                onClick={() => onChangeBetState((prev) => ({ ...prev, amount: q }))}
                className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-mono font-black border transition-all cursor-pointer ${
                  betState.amount === q
                    ? 'bg-[#F59E0B] text-black border-[#F59E0B] shadow-xs scale-102'
                    : 'bg-[#162436] border-[#2b3c52] text-[#CBD5E1] hover:text-white hover:border-[#F59E0B]/50'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* LEFT in RTL: Large Orange Action Button */}
        <div className="sm:col-span-6 flex">
          {/* Active Bet & Plane Flying -> CASH OUT BUTTON */}
          {betState.isPlaced && !betState.cashedOut && gameState === 'FLYING' ? (
            <button
              type="button"
              onClick={onCashout}
              className="w-full min-h-[64px] py-3 bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] hover:from-[#059669] hover:to-[#065F46] text-white font-black rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.55)] transition-all cursor-pointer flex flex-col items-center justify-center leading-tight active:scale-[0.99] animate-pulse border-2 border-[#34D399]"
            >
              <div className="flex items-center gap-1.5">
                <ArrowUpRight className="w-5 h-5 text-white stroke-[3]" />
                <span className="text-xl sm:text-2xl font-black tracking-wide uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                  {isAr ? 'سحب الأرباح' : 'CASH OUT'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-extrabold text-[#D1FAE5] pt-0.5">
                <span>
                  {currentLivePayout.toFixed(2)} {currencySymbol}
                </span>
                <span className="text-xs bg-black/40 px-2 py-0.5 rounded-lg text-[#FDE047]">
                  (+{currentLiveProfit.toFixed(2)} {currencySymbol})
                </span>
              </div>
            </button>
          ) : betState.isPlaced && betState.cashedOut ? (
            /* Already Cashed Out */
            <div className="w-full min-h-[64px] py-2 bg-[#10B981]/20 border border-[#10B981] text-[#34D399] font-black text-center rounded-2xl flex flex-col items-center justify-center leading-tight">
              <span className="text-xs font-bold uppercase">{isAr ? 'تم سحب الأرباح بنجاح!' : 'CASHED OUT!'}</span>
              <span className="font-mono text-base font-extrabold text-white">
                +{betState.payout?.toFixed(2)} {currencySymbol}{' '}
                <span className="text-xs text-[#FDE047]">@{betState.cashoutMultiplier?.toFixed(2)}x</span>
              </span>
            </div>
          ) : betState.isPlaced && gameState === 'CRASHED' ? (
            /* Crashed */
            <div className="w-full min-h-[64px] py-2 bg-[#EF4444]/20 border border-[#EF4444] text-[#F87171] font-black text-center rounded-2xl flex flex-col items-center justify-center leading-tight">
              <span className="text-xs">{isAr ? 'طارت الطائرة (خسارة الرهان)' : 'FLEW AWAY (LOST)'}</span>
              <span className="font-mono text-sm text-white/80">
                {betState.amount} {currencySymbol}
              </span>
            </div>
          ) : betState.isPlaced && gameState === 'WAITING' ? (
            /* Bet Placed, Waiting for round -> Cancel Button */
            <button
              type="button"
              onClick={onToggleBet}
              className="w-full min-h-[64px] py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-black rounded-2xl shadow-md transition-all cursor-pointer flex flex-col items-center justify-center leading-tight"
            >
              <span className="text-base sm:text-lg">{isAr ? 'إلغاء الرهان (استرجاع المبلغ)' : 'CANCEL BET (REFUND)'}</span>
              <span className="font-mono text-xs opacity-80 pt-0.5">
                {betState.amount} {currencySymbol}
              </span>
            </button>
          ) : gameState === 'WAITING' && countdown <= 5 && !betState.isPlaced ? (
            <button
              type="button"
              disabled
              className="w-full min-h-[64px] py-2 bg-[#2d3748] text-[#94a3b8] font-black rounded-2xl shadow-inner flex flex-col items-center justify-center leading-tight cursor-not-allowed opacity-80 border border-white/5"
            >
              <span className="text-base sm:text-lg">{isAr ? 'تم إغلاق الرهان (< 5ث)' : 'BETTING LOCKED (< 5s)'}</span>
              <span className="text-[11px] text-[#cbd5e1] font-bold">
                {isAr ? 'انتظر الجولة القادمة' : 'Wait for next round'}
              </span>
            </button>
          ) : (
            /* Large Orange Action Button: "وضع الرهان (على الجولة التالية)" */
            <button
              type="button"
              onClick={onToggleBet}
              className={`w-full min-h-[64px] py-2 font-black rounded-2xl shadow-lg transition-all flex flex-col items-center justify-center leading-tight cursor-pointer active:scale-[0.99] ${
                gameState === 'WAITING'
                  ? 'bg-gradient-to-r from-[#F59E0B] via-[#EA580C] to-[#D97706] hover:from-[#D97706] hover:to-[#C2410C] text-black font-black'
                  : 'bg-gradient-to-r from-[#D97706] to-[#B45309] text-black opacity-90'
              }`}
            >
              <span className="text-base sm:text-lg">
                {isAr ? 'وضع الرهان' : 'Place Bet'}
              </span>
              <span className="text-[11px] sm:text-xs text-black/80 font-bold">
                {isAr ? '(على الجولة التالية)' : '(For Next Round)'}
              </span>
              <span className="font-mono text-xs text-black/90 font-bold pt-0.5">
                {betState.amount} {currencySymbol}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
