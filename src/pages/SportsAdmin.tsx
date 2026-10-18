import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Plus,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Lock,
  LogOut,
  Shield,
  Layers,
  ArrowRight,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { SportsMatch, FootballClub, BetSlipSelection } from '../types';
import { storage, JORDANIAN_CLUBS, EGYPTIAN_CLUBS, ALL_CLUBS } from '../services/storage';

interface SportsAdminProps {
  onBackToApp?: () => void;
}

export const SportsAdmin: React.FC<SportsAdminProps> = ({ onBackToApp }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!(
      localStorage.getItem('coc_sports_admin_session') ||
      localStorage.getItem('coc_admin_session') ||
      sessionStorage.getItem('coc_admin_token')
    );
  });
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Active view tab: 'matches' | 'add_match' | 'bets'
  const [activeTab, setActiveTab] = useState<'matches' | 'add_match' | 'bets'>('matches');
  const [matches, setMatches] = useState<SportsMatch[]>(() => storage.getSportsMatches());
  const [leagueFilter, setLeagueFilter] = useState<'ALL' | 'JO' | 'EG' | 'LIVE'>('ALL');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Match Form State
  const [newLeague, setNewLeague] = useState<string>('الدوري الأردني للمحترفين');
  const [newHomeClubId, setNewHomeClubId] = useState<string>('faisaly');
  const [newAwayClubId, setNewAwayClubId] = useState<string>('wehdat');
  const [newRoundName, setNewRoundName] = useState<string>('الجولة 13');
  const [newStadium, setNewStadium] = useState<string>('ستاد عمان الدولي');
  const [newStartTime, setNewStartTime] = useState<string>('اليوم 19:30');
  const [oddsHome, setOddsHome] = useState<number>(2.10);
  const [oddsDraw, setOddsDraw] = useState<number>(3.15);
  const [oddsAway, setOddsAway] = useState<number>(3.30);
  const [oddsOver25, setOddsOver25] = useState<number>(1.85);
  const [oddsUnder25, setOddsUnder25] = useState<number>(1.90);
  const [oddsBttsYes, setOddsBttsYes] = useState<number>(1.75);
  const [oddsBttsNo, setOddsBttsNo] = useState<number>(1.95);

  const sportsBets = storage.getSportsBets();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = password.trim();
    if (
      clean === 'sport2026' ||
      clean === 'admin' ||
      clean === 'Sam18101998&&&&' ||
      clean === 'admincashsport' ||
      clean === '123456'
    ) {
      localStorage.setItem('coc_sports_admin_session', 'true');
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('كلمة المرور غير صحيحة. كلمة المرور الافتراضية: sport2026 أو admin');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('coc_sports_admin_session');
    setIsAuthenticated(false);
  };

  const triggerFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Switch available clubs when league changes
  useEffect(() => {
    if (newLeague.includes('الأردن')) {
      setNewHomeClubId('faisaly');
      setNewAwayClubId('wehdat');
      setNewStadium('ستاد عمان الدولي');
    } else {
      setNewHomeClubId('ahly');
      setNewAwayClubId('zamalek');
      setNewStadium('ستاد القاهرة الدولي');
    }
  }, [newLeague]);

  const handleUpdateScore = (matchId: string, team: 'home' | 'away', delta: number) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    const newHome = team === 'home' ? Math.max(0, match.homeScore + delta) : match.homeScore;
    const newAway = team === 'away' ? Math.max(0, match.awayScore + delta) : match.awayScore;
    const updated = storage.updateSportsMatch(matchId, {
      homeScore: newHome,
      awayScore: newAway,
      status: match.status === 'UPCOMING' ? 'LIVE' : match.status,
    });
    if (updated) {
      setMatches([...storage.getSportsMatches()]);
      triggerFeedback('success', `تم تحديث النتيجة: ${newHome} - ${newAway}`);
    }
  };

  const handleUpdateStatus = (matchId: string, status: 'UPCOMING' | 'LIVE' | 'FINISHED') => {
    const updated = storage.updateSportsMatch(matchId, {
      status,
      startTimeText: status === 'LIVE' ? 'مباشر الآن' : status === 'FINISHED' ? 'انتهت (Final)' : 'قادمة',
    });
    if (updated) {
      setMatches([...storage.getSportsMatches()]);
      triggerFeedback('success', `تم تغيير حالة المباراة إلى: ${status}`);
    }
  };

  const handleUpdateMinute = (matchId: string, minute: number) => {
    const updated = storage.updateSportsMatch(matchId, { minute });
    if (updated) {
      setMatches([...storage.getSportsMatches()]);
    }
  };

  const handleSettleMatch = (match: SportsMatch) => {
    if (match.status !== 'FINISHED') {
      const confirmFinish = window.confirm(
        `هل تريد تأكيد إنهاء المباراة بنتيجة (${match.homeScore} - ${match.awayScore}) وتوزيع الأرباح على الفائزين؟`
      );
      if (!confirmFinish) return;
    }

    const res = storage.settleSingleMatch(match.id, match.homeScore, match.awayScore);
    setMatches([...storage.getSportsMatches()]);
    triggerFeedback(
      'success',
      `تم حسم المباراة رسميًا! تم فوز ${res.wonBets} رهان وتوزيع إجمالي $${res.totalPayout.toFixed(2)} أرباح.`
    );
  };

  const handleDeleteMatch = (matchId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المباراة من الجدول؟')) {
      storage.deleteSportsMatch(matchId);
      setMatches([...storage.getSportsMatches()]);
      triggerFeedback('success', 'تم حذف المباراة بنجاح.');
    }
  };

  const handleAddNewMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHomeClubId === newAwayClubId) {
      triggerFeedback('error', 'لا يمكن اختيار نفس الفريق للمباراة.');
      return;
    }

    const homeClub = ALL_CLUBS[newHomeClubId] || JORDANIAN_CLUBS.faisaly;
    const awayClub = ALL_CLUBS[newAwayClubId] || JORDANIAN_CLUBS.wehdat;

    const newMatch: SportsMatch = {
      id: `m_${Date.now().toString(36)}`,
      homeTeam: homeClub,
      awayTeam: awayClub,
      league: newLeague,
      roundName: newRoundName,
      stadium: newStadium,
      status: 'UPCOMING',
      homeScore: 0,
      awayScore: 0,
      startTimeText: newStartTime,
      odds: {
        home: Number(oddsHome),
        draw: Number(oddsDraw),
        away: Number(oddsAway),
        over25: Number(oddsOver25),
        under25: Number(oddsUnder25),
        bttsYes: Number(oddsBttsYes),
        bttsNo: Number(oddsBttsNo),
      },
    };

    storage.addSportsMatch(newMatch);
    setMatches([...storage.getSportsMatches()]);
    triggerFeedback('success', `تمت إضافة مباراة ${homeClub.nameAr} ضد ${awayClub.nameAr} بنجاح!`);
    setActiveTab('matches');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 text-white select-none">
        <div className="w-full max-w-md bg-[#1E293B] border border-[#334155] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#047857] mx-auto flex items-center justify-center text-3xl shadow-lg">
              ⚽
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              لوحة التحكم الرياضية (admincashsport)
            </h1>
            <p className="text-xs text-[#94A3B8]">
              إدارة مباريات الدوري الأردني والدوري المصري، وضع النتائج وحسم الرهانات
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#CBD5E1] block mb-1.5">
                كلمة مرور الأدمن الرياضي:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور (sport2026)"
                  className="w-full px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>دخول لوحة الرياضة</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => {
                if (onBackToApp) onBackToApp();
                else window.location.href = '/';
              }}
              className="text-xs text-[#94A3B8] hover:text-white underline cursor-pointer"
            >
              العودة إلى الموقع الرئيسي
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredMatches = matches.filter((m) => {
    if (leagueFilter === 'LIVE') return m.status === 'LIVE';
    if (leagueFilter === 'JO') return m.league.includes('الأردن');
    if (leagueFilter === 'EG') return m.league.includes('المصري') || m.league.includes('مصر');
    return true;
  });

  const availableClubsForForm = newLeague.includes('الأردن') ? JORDANIAN_CLUBS : EGYPTIAN_CLUBS;

  return (
    <div className="min-h-screen bg-[#0B1320] text-[#E2E8F0] p-3 sm:p-6 select-none font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header Bar */}
        <div className="bg-[#131F33] border border-[#1E2E48] rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white text-2xl shadow-md shrink-0">
              ⚽
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white">
                  إدارة المباريات الرياضية (/admincashsport)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30">
                  تحكم كامل بالفرق والنتائج
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                الدوري الأردني للمحترفين 🇯🇴 والدوري المصري الممتاز 🇪🇬 · إضافة وتعديل وحسم فوري
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => {
                if (onBackToApp) onBackToApp();
                else window.location.href = '/';
              }}
              className="px-3.5 py-2 rounded-xl bg-[#1E2E48] hover:bg-[#2A3F63] text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>الموقع الرئيسي</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-in fade-in ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/15 border-red-500/40 text-red-300'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Mode & Action Tabs */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-1.5 bg-[#131F33] p-1 rounded-2xl border border-[#1E2E48]">
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'matches'
                  ? 'bg-[#10B981] text-white shadow-md font-black'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1E2E48]'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>قائمة المباريات ({matches.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('add_match')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'add_match'
                  ? 'bg-[#10B981] text-white shadow-md font-black'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1E2E48]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة مباراة جديدة</span>
            </button>

            <button
              onClick={() => setActiveTab('bets')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'bets'
                  ? 'bg-[#10B981] text-white shadow-md font-black'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1E2E48]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>رهانات اللاعبين ({sportsBets.length})</span>
            </button>
          </div>

          {activeTab === 'matches' && (
            <div className="flex items-center gap-1 bg-[#131F33] p-1 rounded-2xl border border-[#1E2E48] text-xs font-bold">
              {[
                { id: 'ALL', label: 'الكل' },
                { id: 'JO', label: '🇯🇴 الأردني' },
                { id: 'EG', label: '🇪🇬 المصري' },
                { id: 'LIVE', label: 'مباشر الآن' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setLeagueFilter(filter.id as any)}
                  className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                    leagueFilter === filter.id
                      ? 'bg-[#1E2E48] text-white font-black'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TAB 1: MATCHES LIST & REAL-TIME CONTROLS */}
        {activeTab === 'matches' && (
          <div className="space-y-3">
            {filteredMatches.length === 0 ? (
              <div className="p-12 text-center bg-[#131F33] rounded-3xl border border-[#1E2E48] text-[#94A3B8] space-y-2">
                <Trophy className="w-12 h-12 mx-auto text-[#10B981]/40" />
                <p className="text-sm font-bold">لا توجد مباريات مطابقة للفلتر المحدد.</p>
              </div>
            ) : (
              filteredMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-[#131F33] border border-[#1E2E48] rounded-3xl p-4 sm:p-5 shadow-lg space-y-4"
                >
                  {/* Match Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E2E48] pb-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[#38BDF8]">{match.league}</span>
                      <span className="text-[#64748B]">·</span>
                      <span className="text-[#94A3B8] font-bold">{match.roundName}</span>
                      <span className="text-[#64748B]">·</span>
                      <span className="text-[#64748B]">{match.stadium}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-[#94A3B8]">{match.startTimeText}</span>

                      {/* Status Selector */}
                      <select
                        value={match.status}
                        onChange={(e) =>
                          handleUpdateStatus(match.id, e.target.value as 'UPCOMING' | 'LIVE' | 'FINISHED')
                        }
                        className={`px-2.5 py-1 rounded-xl text-xs font-black border cursor-pointer focus:outline-none ${
                          match.status === 'LIVE'
                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : match.status === 'FINISHED'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-[#1E2E48] text-white border-white/10'
                        }`}
                      >
                        <option value="UPCOMING" className="bg-[#0F172A] text-white">قادمة (Upcoming)</option>
                        <option value="LIVE" className="bg-[#0F172A] text-red-400">مباشر (LIVE)</option>
                        <option value="FINISHED" className="bg-[#0F172A] text-emerald-400">منتهية (Finished)</option>
                      </select>

                      <button
                        onClick={() => handleDeleteMatch(match.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                        title="حذف المباراة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Match Center: Score & Teams */}
                  <div className="grid grid-cols-12 items-center gap-2 sm:gap-4 py-2">
                    {/* Home Team */}
                    <div className="col-span-5 flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border shrink-0"
                        style={{
                          backgroundColor: match.homeTeam.primaryColor + '20',
                          borderColor: match.homeTeam.primaryColor + '50',
                        }}
                      >
                        <span>{match.homeTeam.badgeSymbol}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-sm sm:text-base text-white truncate">
                          {match.homeTeam.nameAr}
                        </div>
                        <div className="text-[11px] text-[#94A3B8]">
                          {match.homeTeam.city} · {match.homeTeam.shortName}
                        </div>
                      </div>
                    </div>

                    {/* Live Score Controls */}
                    <div className="col-span-2 text-center flex flex-col items-center justify-center gap-1.5">
                      <div className="font-mono text-2xl sm:text-3xl font-black text-white px-3 py-1 bg-[#0B1320] rounded-2xl border border-[#1E2E48] tracking-wider">
                        {match.homeScore} - {match.awayScore}
                      </div>

                      {/* Increment / Decrement Score buttons */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 bg-[#0B1320] p-0.5 rounded-lg border border-white/5">
                          <button
                            onClick={() => handleUpdateScore(match.id, 'home', 1)}
                            className="w-6 h-6 rounded bg-[#1E2E48] hover:bg-[#2A3F63] text-xs font-bold cursor-pointer"
                            title="إضافة هدف لصاحب الأرض"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleUpdateScore(match.id, 'home', -1)}
                            className="w-6 h-6 rounded bg-[#1E2E48] hover:bg-[#2A3F63] text-xs font-bold cursor-pointer"
                            title="خصم هدف"
                          >
                            -
                          </button>
                        </div>

                        <span className="text-[10px] text-[#64748B] font-mono">:</span>

                        <div className="flex items-center gap-0.5 bg-[#0B1320] p-0.5 rounded-lg border border-white/5">
                          <button
                            onClick={() => handleUpdateScore(match.id, 'away', 1)}
                            className="w-6 h-6 rounded bg-[#1E2E48] hover:bg-[#2A3F63] text-xs font-bold cursor-pointer"
                            title="إضافة هدف للضيف"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleUpdateScore(match.id, 'away', -1)}
                            className="w-6 h-6 rounded bg-[#1E2E48] hover:bg-[#2A3F63] text-xs font-bold cursor-pointer"
                            title="خصم هدف"
                          >
                            -
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="col-span-5 flex items-center justify-end gap-3 text-end">
                      <div className="min-w-0">
                        <div className="font-black text-sm sm:text-base text-white truncate">
                          {match.awayTeam.nameAr}
                        </div>
                        <div className="text-[11px] text-[#94A3B8]">
                          {match.awayTeam.city} · {match.awayTeam.shortName}
                        </div>
                      </div>
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border shrink-0"
                        style={{
                          backgroundColor: match.awayTeam.primaryColor + '20',
                          borderColor: match.awayTeam.primaryColor + '50',
                        }}
                      >
                        <span>{match.awayTeam.badgeSymbol}</span>
                      </div>
                    </div>
                  </div>

                  {/* Minute Slider & Settle Action */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1E2E48]">
                    {/* Live Minute Control */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[#94A3B8] font-bold">دقيقة المباراة:</span>
                      <input
                        type="number"
                        min={0}
                        max={120}
                        value={match.minute ?? 0}
                        onChange={(e) => handleUpdateMinute(match.id, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 bg-[#0B1320] border border-[#1E2E48] rounded-lg text-center font-mono font-bold text-white focus:outline-none focus:border-[#10B981]"
                      />
                      <span className="text-[11px] text-[#64748B]">دقيقة</span>
                    </div>

                    {/* Settle Match Button */}
                    <button
                      type="button"
                      onClick={() => handleSettleMatch(match)}
                      className="px-4 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>حسم النتيجة رسميًا وتوزيع الأرباح</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: ADD NEW MATCH FORM */}
        {activeTab === 'add_match' && (
          <div className="bg-[#131F33] border border-[#1E2E48] rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
            <div className="border-b border-[#1E2E48] pb-3">
              <h2 className="text-base sm:text-lg font-black text-white">
                إضافة مباراة جديدة إلى جدول المراهنات
              </h2>
              <p className="text-xs text-[#94A3B8]">
                اختر الدوري والفرق المتبارية وحدد المضاعفات (Odds) لتظهر فوراً للاعبين
              </p>
            </div>

            <form onSubmit={handleAddNewMatch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* League Selection */}
                <div>
                  <label className="text-xs font-bold text-[#CBD5E1] block mb-1">
                    الدوري / البطولة:
                  </label>
                  <select
                    value={newLeague}
                    onChange={(e) => setNewLeague(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0B1320] border border-[#1E2E48] rounded-xl text-white font-bold text-xs focus:outline-none focus:border-[#10B981]"
                  >
                    <option value="الدوري الأردني للمحترفين">🇯🇴 الدوري الأردني للمحترفين</option>
                    <option value="كأس الأردن">🇯🇴 كأس الأردن</option>
                    <option value="الدوري المصري الممتاز">🇪🇬 الدوري المصري الممتاز</option>
                    <option value="كأس مصر">🇪🇬 كأس مصر</option>
                  </select>
                </div>

                {/* Round Name */}
                <div>
                  <label className="text-xs font-bold text-[#CBD5E1] block mb-1">
                    اسم الجولة:
                  </label>
                  <input
                    type="text"
                    value={newRoundName}
                    onChange={(e) => setNewRoundName(e.target.value)}
                    placeholder="مثال: الجولة 14 · قمة الديربي"
                    className="w-full px-3.5 py-2.5 bg-[#0B1320] border border-[#1E2E48] rounded-xl text-white text-xs font-bold focus:outline-none focus:border-[#10B981]"
                    required
                  />
                </div>

                {/* Home Team */}
                <div>
                  <label className="text-xs font-bold text-[#CBD5E1] block mb-1">
                    الفريق المضيف (صاحب الأرض 1):
                  </label>
                  <select
                    value={newHomeClubId}
                    onChange={(e) => setNewHomeClubId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0B1320] border border-[#1E2E48] rounded-xl text-white font-bold text-xs focus:outline-none focus:border-[#10B981]"
                  >
                    {Object.values(availableClubsForForm).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.badgeSymbol} {c.nameAr} ({c.city})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Away Team */}
                <div>
                  <label className="text-xs font-bold text-[#CBD5E1] block mb-1">
                    الفريق الضيف (2):
                  </label>
                  <select
                    value={newAwayClubId}
                    onChange={(e) => setNewAwayClubId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0B1320] border border-[#1E2E48] rounded-xl text-white font-bold text-xs focus:outline-none focus:border-[#10B981]"
                  >
                    {Object.values(availableClubsForForm).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.badgeSymbol} {c.nameAr} ({c.city})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stadium */}
                <div>
                  <label className="text-xs font-bold text-[#CBD5E1] block mb-1">
                    ملعب المباراة:
                  </label>
                  <input
                    type="text"
                    value={newStadium}
                    onChange={(e) => setNewStadium(e.target.value)}
                    placeholder="مثال: ستاد عمان الدولي"
                    className="w-full px-3.5 py-2.5 bg-[#0B1320] border border-[#1E2E48] rounded-xl text-white text-xs font-bold focus:outline-none focus:border-[#10B981]"
                    required
                  />
                </div>

                {/* Start Time */}
                <div>
                  <label className="text-xs font-bold text-[#CBD5E1] block mb-1">
                    توقيت المباراة (نص العرض):
                  </label>
                  <input
                    type="text"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    placeholder="مثال: اليوم 19:30 أو غداً 21:00"
                    className="w-full px-3.5 py-2.5 bg-[#0B1320] border border-[#1E2E48] rounded-xl text-white text-xs font-bold focus:outline-none focus:border-[#10B981]"
                    required
                  />
                </div>
              </div>

              {/* Odds Configuration */}
              <div className="pt-2 border-t border-[#1E2E48] space-y-3">
                <h3 className="text-xs font-black text-[#F59E0B]">مضاعفات الرهان (Odds):</h3>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                  <div>
                    <label className="text-[10px] text-[#94A3B8] font-bold block mb-1">فوز 1:</label>
                    <input
                      type="number"
                      step="0.05"
                      min={1.05}
                      value={oddsHome}
                      onChange={(e) => setOddsHome(parseFloat(e.target.value) || 1.1)}
                      className="w-full px-2 py-1.5 bg-[#0B1320] border border-[#1E2E48] rounded-lg text-white font-mono text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#94A3B8] font-bold block mb-1">تعادل X:</label>
                    <input
                      type="number"
                      step="0.05"
                      min={1.05}
                      value={oddsDraw}
                      onChange={(e) => setOddsDraw(parseFloat(e.target.value) || 1.1)}
                      className="w-full px-2 py-1.5 bg-[#0B1320] border border-[#1E2E48] rounded-lg text-white font-mono text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#94A3B8] font-bold block mb-1">فوز 2:</label>
                    <input
                      type="number"
                      step="0.05"
                      min={1.05}
                      value={oddsAway}
                      onChange={(e) => setOddsAway(parseFloat(e.target.value) || 1.1)}
                      className="w-full px-2 py-1.5 bg-[#0B1320] border border-[#1E2E48] rounded-lg text-white font-mono text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#94A3B8] font-bold block mb-1">+2.5 هدف:</label>
                    <input
                      type="number"
                      step="0.05"
                      min={1.05}
                      value={oddsOver25}
                      onChange={(e) => setOddsOver25(parseFloat(e.target.value) || 1.1)}
                      className="w-full px-2 py-1.5 bg-[#0B1320] border border-[#1E2E48] rounded-lg text-white font-mono text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#94A3B8] font-bold block mb-1">-2.5 هدف:</label>
                    <input
                      type="number"
                      step="0.05"
                      min={1.05}
                      value={oddsUnder25}
                      onChange={(e) => setOddsUnder25(parseFloat(e.target.value) || 1.1)}
                      className="w-full px-2 py-1.5 bg-[#0B1320] border border-[#1E2E48] rounded-lg text-white font-mono text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#94A3B8] font-bold block mb-1">كلاهما نعم:</label>
                    <input
                      type="number"
                      step="0.05"
                      min={1.05}
                      value={oddsBttsYes}
                      onChange={(e) => setOddsBttsYes(parseFloat(e.target.value) || 1.1)}
                      className="w-full px-2 py-1.5 bg-[#0B1320] border border-[#1E2E48] rounded-lg text-white font-mono text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#94A3B8] font-bold block mb-1">كلاهما لا:</label>
                    <input
                      type="number"
                      step="0.05"
                      min={1.05}
                      value={oddsBttsNo}
                      onChange={(e) => setOddsBttsNo(parseFloat(e.target.value) || 1.1)}
                      className="w-full px-2 py-1.5 bg-[#0B1320] border border-[#1E2E48] rounded-lg text-white font-mono text-xs text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>نشر المباراة فوراً في جدول المراهنات</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: PLAYERS BETS VIEW */}
        {activeTab === 'bets' && (
          <div className="bg-[#131F33] border border-[#1E2E48] rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2E48] pb-3">
              <h2 className="text-base font-black text-white">
                سجل رهانات اللاعبين الرياضية
              </h2>
              <span className="text-xs font-mono text-[#94A3B8]">
                إجمالي الرهانات: {sportsBets.length}
              </span>
            </div>

            {sportsBets.length === 0 ? (
              <div className="p-8 text-center text-[#94A3B8] text-xs font-bold">
                لا توجد رهانات نشطة مسجلة حالياً.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs font-sans">
                  <thead>
                    <tr className="border-b border-[#1E2E48] text-[#94A3B8]">
                      <th className="py-2.5 px-3 text-start">رقم الرهان</th>
                      <th className="py-2.5 px-3 text-start">التوقعات والمباريات</th>
                      <th className="py-2.5 px-3 text-center">المضاعف</th>
                      <th className="py-2.5 px-3 text-end">المبلغ</th>
                      <th className="py-2.5 px-3 text-end">الربح المتوقع</th>
                      <th className="py-2.5 px-3 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2E48]/60 font-mono">
                    {sportsBets.map((b) => (
                      <tr key={b.id} className="hover:bg-[#1E2E48]/30 transition-colors">
                        <td className="py-2.5 px-3 text-[#CBD5E1] text-[11px]">
                          {b.id.slice(0, 10)}
                        </td>
                        <td className="py-2.5 px-3 text-white font-sans">
                          {b.selections.map((s, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-bold text-[#F59E0B]">{s.matchTitle}</span>: {s.marketLabel} ({s.pickLabel})
                            </div>
                          ))}
                        </td>
                        <td className="py-2.5 px-3 text-center text-[#F59E0B] font-bold">
                          {b.totalOdds}x
                        </td>
                        <td className="py-2.5 px-3 text-end text-white font-bold">
                          ${b.amount}
                        </td>
                        <td className="py-2.5 px-3 text-end text-[#10B981] font-bold">
                          ${b.potentialPayout}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.status === 'WON'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : b.status === 'LOST'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {b.status === 'WON' ? 'فائز' : b.status === 'LOST' ? 'خاسر' : 'قيد الانتظار'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
