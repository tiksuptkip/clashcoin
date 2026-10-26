import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import {
  X,
  Trophy,
  Crown,
  TrendingUp,
  TrendingDown,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Coins,
  ShieldCheck,
  ChevronRight,
  Flame,
} from 'lucide-react';
import {
  CryptoTournament,
  TournamentMatchup,
  TournamentParticipant,
  UserProfile,
} from '../types';
import { tournamentService } from '../services/tournamentService';
import { soundManager } from '../services/sound';

interface TournamentBracketModalProps {
  tournament: CryptoTournament;
  user: UserProfile | null;
  onClose: () => void;
  onTournamentUpdated: (updated: CryptoTournament) => void;
}

export const TournamentBracketModal: React.FC<TournamentBracketModalProps> = ({
  tournament,
  user,
  onClose,
  onTournamentUpdated,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(() => {
    // Default to the first LIVE match or Grand Final
    const liveMatch = tournament.matches.find((m) => m.status === 'LIVE');
    if (liveMatch) return liveMatch.id;
    return tournament.matches[0]?.id || null;
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedMatch = tournament.matches.find((m) => m.id === selectedMatchId);

  // Currency label
  const curSymbol = tournament.currency === 'JOD' ? 'د.أ' : tournament.currency === 'EGP' ? 'ج.م' : 'USDT';

  // Prize amounts
  const pool = tournament.currentPrizePool;
  const prize1st = ((pool * tournament.prizeDistribution.first) / 100).toFixed(1);
  const prize2nd = ((pool * tournament.prizeDistribution.second) / 100).toFixed(1);
  const prize3rd = ((pool * tournament.prizeDistribution.thirdFourth) / 100).toFixed(1);

  // Group matches by round
  const round1Matches = tournament.matches.filter((m) => m.roundNumber === 1);
  const round2Matches = tournament.matches.filter((m) => m.roundNumber === 2);
  const round3Matches = tournament.matches.filter((m) => m.roundNumber === 3);

  const champion = tournament.participants.find((p) => p.id === tournament.winnerId);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePredict = (side: 'UP' | 'DOWN') => {
    if (!selectedMatch) return;
    try {
      soundManager.playPlaceBet();
    } catch {
      // Sound fallback
    }

    const res = tournamentService.submitMatchPrediction(
      tournament.id,
      selectedMatch.id,
      side,
      selectedMatch.livePrediction?.currentPrice || 67450
    );

    if (res.success && res.matchup) {
      const updated = tournamentService.getTournamentById(tournament.id);
      if (updated) {
        onTournamentUpdated({ ...updated });
        showToast(
          isAr
            ? `تم تأكيد توقعك بنجاح (${side === 'UP' ? 'صعود 📈' : 'هبوط 📉'})`
            : `Prediction confirmed (${side})`
        );
      }
    }
  };

  const handleSimulateMatch = (matchId: string) => {
    setIsSimulating(true);
    try {
      soundManager.playTick();
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const res = tournamentService.advanceMatchOutcome(tournament.id, matchId);
      setIsSimulating(false);

      if (res.success && res.tournament) {
        onTournamentUpdated({ ...res.tournament });

        if (res.payoutAwarded && res.payoutAwarded > 0) {
          try {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
            });
            soundManager.playWin();
          } catch {
            // Fallback
          }
          showToast(
            isAr
              ? `🎉 مبروك! فزت بجائزة مالية قدرها ${res.payoutAwarded} ${curSymbol} أضيفت لمحفظتك!`
              : `🎉 Congratulations! Won ${res.payoutAwarded} ${curSymbol} added to your wallet!`
          );
        } else {
          try {
            soundManager.playWin();
          } catch {
            // Fallback
          }
          showToast(isAr ? 'تم حسم نتيجة المواجهة وتأهل الفائز للدور التالي!' : 'Match completed, winner advanced!');
        }
      }
    }, 600);
  };

  const handleAutoSimulateTournament = () => {
    setIsSimulating(true);
    // Find all uncompleted matches in sequence
    const pendingMatches = tournament.matches.filter((m) => m.status !== 'COMPLETED');
    if (pendingMatches.length === 0) {
      setIsSimulating(false);
      showToast(isAr ? 'البطولة مكتملة بالفعل!' : 'Tournament already completed!');
      return;
    }

    let currentTour = { ...tournament };
    for (const match of currentTour.matches) {
      if (match.status !== 'COMPLETED' && match.player1 && match.player2) {
        const res = tournamentService.advanceMatchOutcome(currentTour.id, match.id);
        if (res.tournament) {
          currentTour = res.tournament;
        }
      }
    }

    setTimeout(() => {
      setIsSimulating(false);
      const finalTour = tournamentService.getTournamentById(tournament.id);
      if (finalTour) {
        onTournamentUpdated({ ...finalTour });
        try {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.5 },
          });
          soundManager.playWin();
        } catch {
          // Fallback
        }
        showToast(isAr ? '🏆 تم محاكاة البطولة بالكامل وتتويج البطل!' : '🏆 Full tournament simulated & Champion crowned!');
      }
    }, 800);
  };

  const renderMatchCard = (match: TournamentMatchup) => {
    const isSelected = selectedMatchId === match.id;
    const isLive = match.status === 'LIVE';
    const isDone = match.status === 'COMPLETED';

    const p1 = match.player1;
    const p2 = match.player2;

    const hasUser = p1?.isUser || p2?.isUser;

    return (
      <div
        key={match.id}
        onClick={() => setSelectedMatchId(match.id)}
        className={`group relative rounded-2xl p-3 border transition-all cursor-pointer text-xs select-none shadow-sm ${
          isSelected
            ? 'bg-[#1E293B] border-[#F59E0B] ring-2 ring-[#F59E0B]/40 shadow-lg scale-[1.02]'
            : isLive
            ? 'bg-[#0F172A] border-[#10B981]/50 hover:border-[#10B981]'
            : isDone
            ? 'bg-[#182232] border-[#334155] opacity-90'
            : 'bg-[#0B132B]/60 border-[#1E293B] opacity-60'
        } ${hasUser ? 'ring-1 ring-[#F59E0B]/60' : ''}`}
      >
        {/* Match Header Badge */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
          <span className="font-bold text-[11px] text-[#94A3B8]">
            {isAr ? match.roundNameAr.split('(')[0] : match.roundNameEn} #{match.matchIndex + 1}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              isLive
                ? 'bg-[#10B981]/20 text-[#10B981] animate-pulse border border-[#10B981]/40'
                : isDone
                ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30'
                : 'bg-[#334155]/30 text-[#94A3B8]'
            }`}
          >
            {isLive ? (isAr ? 'مباشر الآن' : 'LIVE') : isDone ? (isAr ? 'انتهت' : 'FINAL') : isAr ? 'قيد الانتظار' : 'WAITING'}
          </span>
        </div>

        {/* Player 1 Row */}
        <div
          className={`flex items-center justify-between py-1 px-1.5 rounded-xl transition-colors ${
            match.winnerId && match.winnerId === p1?.id
              ? 'bg-[#10B981]/15 text-white font-bold border border-[#10B981]/30'
              : p1?.isEliminated
              ? 'opacity-40 line-through'
              : 'text-[#E2E8F0]'
          } ${p1?.isUser ? 'border-r-2 border-r-[#F59E0B] pr-1.5' : ''}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {p1 ? (
              <>
                <img
                  src={p1.avatar}
                  alt={p1.name}
                  className="w-5 h-5 rounded-full bg-slate-700 shrink-0"
                />
                <span className="truncate text-[11px]">
                  {p1.isUser ? (
                    <span className="text-[#F59E0B] font-black">
                      ★ {p1.name} {isAr ? '(أنت)' : '(You)'}
                    </span>
                  ) : (
                    p1.name
                  )}
                </span>
                {p1.country && (
                  <span className="text-[10px] text-[#94A3B8] uppercase">[{p1.country}]</span>
                )}
              </>
            ) : (
              <span className="text-[#64748B] italic text-[11px]">
                {isAr ? 'في انتظار المتأهل...' : 'TBD...'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {match.livePrediction?.p1Choice && (
              <span
                className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                  match.livePrediction.p1Choice === 'UP'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {match.livePrediction.p1Choice}
              </span>
            )}
            <span className="font-mono font-black text-[12px]">{match.player1Score}</span>
            {match.winnerId === p1?.id && <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />}
          </div>
        </div>

        {/* Player 2 Row */}
        <div
          className={`flex items-center justify-between py-1 px-1.5 mt-1 rounded-xl transition-colors ${
            match.winnerId && match.winnerId === p2?.id
              ? 'bg-[#10B981]/15 text-white font-bold border border-[#10B981]/30'
              : p2?.isEliminated
              ? 'opacity-40 line-through'
              : 'text-[#E2E8F0]'
          } ${p2?.isUser ? 'border-r-2 border-r-[#F59E0B] pr-1.5' : ''}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {p2 ? (
              <>
                <img
                  src={p2.avatar}
                  alt={p2.name}
                  className="w-5 h-5 rounded-full bg-slate-700 shrink-0"
                />
                <span className="truncate text-[11px]">
                  {p2.isUser ? (
                    <span className="text-[#F59E0B] font-black">
                      ★ {p2.name} {isAr ? '(أنت)' : '(You)'}
                    </span>
                  ) : (
                    p2.name
                  )}
                </span>
                {p2.country && (
                  <span className="text-[10px] text-[#94A3B8] uppercase">[{p2.country}]</span>
                )}
              </>
            ) : (
              <span className="text-[#64748B] italic text-[11px]">
                {isAr ? 'في انتظار المتأهل...' : 'TBD...'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {match.livePrediction?.p2Choice && (
              <span
                className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                  match.livePrediction.p2Choice === 'UP'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {match.livePrediction.p2Choice}
              </span>
            )}
            <span className="font-mono font-black text-[12px]">{match.player2Score}</span>
            {match.winnerId === p2?.id && <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-[#09111E] rounded-3xl border border-[#334155] shadow-2xl text-white overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* ================= MODAL HEADER ================= */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center border border-[#F59E0B]/30 shrink-0">
              <Trophy className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {isAr ? tournament.titleAr : tournament.title}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30">
                  {tournament.coin} Arena
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] hidden sm:block">
                {isAr ? tournament.descriptionAr : tournament.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoSimulateTournament}
              disabled={isSimulating || tournament.status === 'COMPLETED'}
              className="px-3 py-1.5 rounded-xl bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 text-[#F59E0B] border border-[#F59E0B]/40 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">
                {isAr ? 'محاكاة البطولة ⚡' : 'Auto-Simulate ⚡'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= PRIZE POOL RIBBON ================= */}
        <div className="px-5 py-2.5 bg-[#0A1322] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono">
            <Coins className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-[#94A3B8]">{isAr ? 'مجموع الجوائز:' : 'Total Pool:'}</span>
            <span className="text-base font-black text-[#10B981]">
              {pool} {curSymbol}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="px-2.5 py-1 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 font-bold flex items-center gap-1">
              <span>🥇 1st: {prize1st} {curSymbol} (60%)</span>
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-[#94A3B8]/15 text-[#E2E8F0] border border-[#94A3B8]/30 font-bold flex items-center gap-1">
              <span>🥈 2nd: {prize2nd} {curSymbol} (25%)</span>
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-[#CD7F32]/15 text-[#FDBA74] border border-[#CD7F32]/30 font-bold flex items-center gap-1">
              <span>🥉 3rd/4th: {prize3rd} {curSymbol} (15%)</span>
            </span>
          </div>
        </div>

        {/* ================= TOAST NOTIFICATION ================= */}
        {toastMessage && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-gradient-to-r from-[#10B981]/25 to-[#047857]/25 border border-[#10B981]/50 text-white text-xs font-bold flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-[#94A3B8] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ================= MAIN CONTENT: BRACKET + DETAIL ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Champion Crown Podium (if finished) */}
          {champion && (
            <div className="p-4 rounded-3xl bg-gradient-to-r from-[#D4AF37]/20 via-[#F59E0B]/20 to-[#D4AF37]/20 border-2 border-[#D4AF37] flex items-center justify-between text-white shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37] text-black flex items-center justify-center font-black text-2xl shadow-lg">
                  🏆
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#D4AF37] uppercase">
                      {isAr ? 'بطل البطولة المتوج' : 'Tournament Champion'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#10B981] text-black font-black">
                      +{prize1st} {curSymbol}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>{champion.name}</span>
                    {champion.isUser && (
                      <span className="text-xs text-[#F59E0B] bg-[#F59E0B]/20 px-2 py-0.5 rounded-lg border border-[#F59E0B]/40">
                        {isAr ? 'أنت البطل! 🎉' : 'You are the Champion! 🎉'}
                      </span>
                    )}
                  </h3>
                </div>
              </div>
              <div className="text-end font-mono hidden sm:block">
                <span className="text-xs text-[#94A3B8]">{isAr ? 'الجائزة الكبرى:' : 'Grand Prize:'}</span>
                <p className="text-xl font-black text-[#D4AF37]">
                  {prize1st} {curSymbol}
                </p>
              </div>
            </div>
          )}

          {/* ================= BRACKET TREE COLUMNS ================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* COLUMN 1: QUARTERFINALS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2 py-1 bg-white/5 rounded-xl border border-white/10">
                <span className="font-black text-xs text-[#94A3B8]">
                  {isAr ? '1. ربع النهائي (4 مواجهات)' : '1. Quarterfinals (4 Matches)'}
                </span>
                <span className="text-[10px] text-[#10B981] font-mono">Best of 3</span>
              </div>
              <div className="space-y-3">
                {round1Matches.map((m) => renderMatchCard(m))}
              </div>
            </div>

            {/* COLUMN 2: SEMIFINALS */}
            <div className="space-y-3 md:pt-10">
              <div className="flex items-center justify-between px-2 py-1 bg-white/5 rounded-xl border border-white/10">
                <span className="font-black text-xs text-[#94A3B8]">
                  {isAr ? '2. نصف النهائي (مواجهتان)' : '2. Semifinals (2 Matches)'}
                </span>
                <span className="text-[10px] text-[#10B981] font-mono">Semi final</span>
              </div>
              <div className="space-y-6">
                {round2Matches.map((m) => renderMatchCard(m))}
              </div>
            </div>

            {/* COLUMN 3: GRAND FINAL */}
            <div className="space-y-3 md:pt-24">
              <div className="flex items-center justify-between px-2 py-1 bg-[#D4AF37]/15 rounded-xl border border-[#D4AF37]/30">
                <span className="font-black text-xs text-[#D4AF37] flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{isAr ? '3. النهائي الكبير (المباراة الفاصلة)' : '3. Grand Final'}</span>
                </span>
                <span className="text-[10px] text-[#D4AF37] font-mono">Champion Match</span>
              </div>
              <div className="space-y-3">
                {round3Matches.map((m) => renderMatchCard(m))}
              </div>
            </div>
          </div>

          {/* ================= INTERACTIVE MATCH CONTROLLER DRAWER ================= */}
          {selectedMatch && (
            <div className="p-4 sm:p-5 rounded-3xl bg-[#0D182A] border-2 border-[#1E293B] shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
                  <h4 className="font-black text-sm text-white">
                    {isAr ? 'غرفة المواجهة المباشرة والتوقع:' : 'Live Match Prediction Chamber:'}{' '}
                    <span className="text-[#F59E0B]">
                      {isAr ? selectedMatch.roundNameAr : selectedMatch.roundNameEn} #
                      {selectedMatch.matchIndex + 1}
                    </span>
                  </h4>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs text-[#94A3B8]">
                  <span>{tournament.coin}/USDT:</span>
                  <span className="font-black text-white">
                    ${selectedMatch.livePrediction?.currentPrice || 67450}
                  </span>
                </div>
              </div>

              {/* Head to Head Visual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Player 1 Card */}
                <div
                  className={`p-3 rounded-2xl border transition-all ${
                    selectedMatch.player1?.isUser
                      ? 'bg-[#1E293B] border-[#F59E0B]'
                      : 'bg-[#111C2E] border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        selectedMatch.player1?.avatar ||
                        'https://api.dicebear.com/7.x/bottts/svg?seed=P1'
                      }
                      alt="P1"
                      className="w-10 h-10 rounded-2xl bg-slate-800"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-white truncate">
                          {selectedMatch.player1?.name || (isAr ? 'في الانتظار...' : 'TBD')}
                        </span>
                        {selectedMatch.player1?.isUser && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#F59E0B] text-black">
                            {isAr ? 'أنت' : 'YOU'}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#94A3B8]">
                        {isAr ? 'النقاط المسجلة:' : 'Score:'} {selectedMatch.player1Score}
                      </span>
                    </div>
                  </div>

                  {/* Prediction Pill */}
                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-[#94A3B8]">{isAr ? 'التوقع الحالي:' : 'Pick:'}</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded-lg ${
                        selectedMatch.livePrediction?.p1Choice === 'UP'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : selectedMatch.livePrediction?.p1Choice === 'DOWN'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'text-[#64748B]'
                      }`}
                    >
                      {selectedMatch.livePrediction?.p1Choice || (isAr ? 'لم يحدد بعد' : 'Pending')}
                    </span>
                  </div>
                </div>

                {/* Player 2 Card */}
                <div
                  className={`p-3 rounded-2xl border transition-all ${
                    selectedMatch.player2?.isUser
                      ? 'bg-[#1E293B] border-[#F59E0B]'
                      : 'bg-[#111C2E] border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        selectedMatch.player2?.avatar ||
                        'https://api.dicebear.com/7.x/bottts/svg?seed=P2'
                      }
                      alt="P2"
                      className="w-10 h-10 rounded-2xl bg-slate-800"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-white truncate">
                          {selectedMatch.player2?.name || (isAr ? 'في الانتظار...' : 'TBD')}
                        </span>
                        {selectedMatch.player2?.isUser && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#F59E0B] text-black">
                            {isAr ? 'أنت' : 'YOU'}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#94A3B8]">
                        {isAr ? 'النقاط المسجلة:' : 'Score:'} {selectedMatch.player2Score}
                      </span>
                    </div>
                  </div>

                  {/* Prediction Pill */}
                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-[#94A3B8]">{isAr ? 'التوقع الحالي:' : 'Pick:'}</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded-lg ${
                        selectedMatch.livePrediction?.p2Choice === 'UP'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : selectedMatch.livePrediction?.p2Choice === 'DOWN'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'text-[#64748B]'
                      }`}
                    >
                      {selectedMatch.livePrediction?.p2Choice || (isAr ? 'لم يحدد بعد' : 'Pending')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Pick UP/DOWN or Simulate */}
              {selectedMatch.status !== 'COMPLETED' &&
                selectedMatch.player1 &&
                selectedMatch.player2 && (
                  <div className="pt-2 flex flex-wrap items-center gap-3 justify-between">
                    {/* User Prediction Choice Buttons */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#94A3B8] hidden sm:inline">
                        {isAr ? 'اختر توقعك:' : 'Your Pick:'}
                      </span>
                      <button
                        onClick={() => handlePredict('UP')}
                        className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{isAr ? 'صعود (UP) 📈' : 'UP 📈'}</span>
                      </button>

                      <button
                        onClick={() => handlePredict('DOWN')}
                        className="px-4 py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>{isAr ? 'هبوط (DOWN) 📉' : 'DOWN 📉'}</span>
                      </button>
                    </div>

                    {/* Settle / Advance Match Button */}
                    <button
                      onClick={() => handleSimulateMatch(selectedMatch.id)}
                      disabled={isSimulating}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-black font-black text-xs transition-all shadow-lg active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-40"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>
                        {isSimulating
                          ? isAr
                            ? 'جاري حسم الجولة...'
                            : 'Settling Round...'
                          : isAr
                          ? 'حسم نتيجة المواجهة الآن ⚡'
                          : 'Simulate Outcome ⚡'}
                      </span>
                    </button>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#0A1322] flex items-center justify-between text-xs text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            <span>
              {isAr
                ? 'نظام إقصائي عادل ومحمي بعقود ذكية وتغذية بينانس المباشرة'
                : 'Provably fair single elimination powered by Binance live price feeds'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-all cursor-pointer"
          >
            {isAr ? 'إغلاق الشجرة' : 'Close Bracket'}
          </button>
        </div>
      </div>
    </div>
  );
};
