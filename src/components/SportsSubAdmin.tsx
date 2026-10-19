import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { storage, JORDANIAN_CLUBS, EGYPTIAN_CLUBS } from '../services/storage';
import { FootballClub, SportsMatch } from '../types';
import {
  Trophy,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Shield,
  Activity,
  Calendar,
  Clock,
  Sparkles,
  Lock,
  ChevronDown,
} from 'lucide-react';

interface SportsSubAdminProps {
  onBackToApp: () => void;
}

export const SportsSubAdmin: React.FC<SportsSubAdminProps> = ({ onBackToApp }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [matches, setMatches] = useState<SportsMatch[]>(() => storage.getSportsMatches());
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState<'ALL' | 'JORDAN' | 'EGYPT'>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'FINISHED'>('ALL');

  // Add Match Modal Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLeague, setNewLeague] = useState<string>('الدوري الأردني للمحترفين');
  const [newHomeClubId, setNewHomeClubId] = useState<string>('faisaly');
  const [newAwayClubId, setNewAwayClubId] = useState<string>('wehdat');
  const [newStadium, setNewStadium] = useState<string>('ستاد عمان الدولي');
  const [newRoundName, setNewRoundName] = useState<string>('الجولة 14');
  const [newStartTimeText, setNewStartTimeText] = useState<string>('اليوم 19:00');
  const [newHomeOdd, setNewHomeOdd] = useState<number>(2.10);
  const [newDrawOdd, setNewDrawOdd] = useState<number>(3.20);
  const [newAwayOdd, setNewAwayOdd] = useState<number>(3.40);
  const [newOverOdd, setNewOverOdd] = useState<number>(1.85);
  const [newUnderOdd, setNewUnderOdd] = useState<number>(1.95);
  const [newBttsYesOdd, setNewBttsYesOdd] = useState<number>(1.80);
  const [newBttsNoOdd, setNewBttsNoOdd] = useState<number>(1.95);

  // Score settlement state per match
  const [scoreInputs, setScoreInputs] = useState<Record<string, { home: number; away: number }>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const isJordanLeague = (league: string) =>
    league.includes('الأردن') || league.includes('أردني') || league.includes('Jordan');

  const availableClubsForLeague = isJordanLeague(newLeague)
    ? Object.values(JORDANIAN_CLUBS)
    : Object.values(EGYPTIAN_CLUBS);

  const filteredMatches = matches.filter((m) => {
    if (selectedLeagueFilter === 'JORDAN' && !isJordanLeague(m.league)) return false;
    if (selectedLeagueFilter === 'EGYPT' && isJordanLeague(m.league)) return false;
    if (selectedStatusFilter !== 'ALL' && m.status !== selectedStatusFilter) return false;
    return true;
  });

  const handleLeagueChange = (league: string) => {
    setNewLeague(league);
    if (isJordanLeague(league)) {
      setNewHomeClubId('faisaly');
      setNewAwayClubId('wehdat');
      setNewStadium('ستاد عمان الدولي');
    } else {
      setNewHomeClubId('ahly');
      setNewAwayClubId('zamalek');
      setNewStadium('ستاد القاهرة الدولي');
    }
  };

  const handleAddMatch = (e: React.FormEvent) => {
    e.preventDefault();

    const clubsPool = isJordanLeague(newLeague) ? JORDANIAN_CLUBS : EGYPTIAN_CLUBS;
    const homeTeam = clubsPool[newHomeClubId];
    const awayTeam = clubsPool[newAwayClubId];

    if (!homeTeam || !awayTeam) {
      showNotification('error', 'يرجى اختيار الفريقين بشكل صحيح');
      return;
    }

    if (newHomeClubId === newAwayClubId) {
      showNotification('error', 'لا يمكن اختيار نفس الفريق كصاحب أرض وضيف في نفس المباراة!');
      return;
    }

    const newMatch: SportsMatch = {
      id: 'm_' + Date.now().toString(36),
      homeTeam,
      awayTeam,
      league: newLeague,
      roundName: newRoundName,
      stadium: newStadium,
      status: 'UPCOMING',
      homeScore: 0,
      awayScore: 0,
      startTimeText: newStartTimeText,
      odds: {
        home: Number(newHomeOdd.toFixed(2)),
        draw: Number(newDrawOdd.toFixed(2)),
        away: Number(newAwayOdd.toFixed(2)),
        over25: Number(newOverOdd.toFixed(2)),
        under25: Number(newUnderOdd.toFixed(2)),
        bttsYes: Number(newBttsYesOdd.toFixed(2)),
        bttsNo: Number(newBttsNoOdd.toFixed(2)),
      },
    };

    storage.addSportsMatch(newMatch);
    setMatches(storage.getSportsMatches());
    setIsAddModalOpen(false);
    showNotification('success', `تم إضافة مباراة: ${homeTeam.nameAr} ضد ${awayTeam.nameAr} بنجاح!`);
  };

  const handleSettleMatch = (matchId: string) => {
    const input = scoreInputs[matchId];
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const homeScore = input ? input.home : match.homeScore;
    const awayScore = input ? input.away : match.awayScore;

    const res = storage.settleSingleMatch(matchId, homeScore, awayScore);
    setMatches(storage.getSportsMatches());
    showNotification(
      'success',
      `تم إنهاء مباراة (${match.homeTeam.nameAr} ${homeScore} - ${awayScore} ${match.awayTeam.nameAr}) وحسم الرهانات! الرهانات الفائزة: ${res.wonBets}، إجمالي الأرباح المدفوعة: ${res.totalPayout} د.أ/ج.م`
    );
  };

  const handleDeleteMatch = (matchId: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذه المباراة؟')) {
      storage.deleteSportsMatch(matchId);
      setMatches(storage.getSportsMatches());
      showNotification('success', 'تم حذف المباراة بنجاح.');
    }
  };

  const handleScoreChange = (matchId: string, side: 'home' | 'away', val: number) => {
    const match = matches.find((m) => m.id === matchId);
    const curr = scoreInputs[matchId] || {
      home: match?.homeScore ?? 0,
      away: match?.awayScore ?? 0,
    };
    setScoreInputs({
      ...scoreInputs,
      [matchId]: {
        ...curr,
        [side]: Math.max(0, val),
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] text-white p-3 sm:p-6 font-sans dir-rtl text-start selection:bg-[#F59E0B]/20">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Top Sub-Admin Navigation Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#111827] border border-[#1F2937] p-4 rounded-3xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white shadow-lg">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  لوحة تحكم كرة القدم الأردنية والمصرية
                </h1>
                <span className="text-[10px] font-mono font-bold bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] px-2 py-0.5 rounded-full">
                  /admincashsport
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                إدارة مباريات الدوري الأردني والمصري، إضافة الفرق والمواجهات، ورصد وتأكيد النتائج النهائية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>إضافة مواجهة جديدة</span>
            </button>

            <button
              onClick={onBackToApp}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-[#1F2937] hover:bg-[#374151] text-xs font-bold text-[#E5E7EB] transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </button>
          </div>
        </div>

        {/* Security Role Notice */}
        <div className="p-3.5 bg-[#1E293B]/60 border border-[#334155] rounded-2xl flex items-center gap-3 text-xs text-[#94A3B8]">
          <Shield className="w-5 h-5 text-[#38BDF8] shrink-0" />
          <p>
            <strong className="text-white">صلاحية أدمن رياضي فرعي (Sub-Admin):</strong> هذه الصفحة مخصصة فقط لجدولة المباريات ورصد نتائج فرق الدوري الأردني والدوري المصري. لا تملك هذه اللوحة أي صلاحية للتحكم بأموال اللاعبين أو أرباح المنصة أو المحافظ المالية، التزاماً بضوابط الأمان.
          </p>
        </div>

        {/* Notification Alert */}
        {notification && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
              notification.type === 'success'
                ? 'bg-[#10B981]/15 border border-[#10B981]/40 text-[#34D399]'
                : 'bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#F87171]'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#111827] border border-[#1F2937] p-3.5 rounded-2xl">
            <span className="text-[11px] font-bold text-[#9CA3AF] block">الدوري الأردني 🇯🇴</span>
            <span className="text-2xl font-black text-[#38BDF8] mt-1 block">
              {matches.filter((m) => isJordanLeague(m.league)).length} مواجهة
            </span>
          </div>

          <div className="bg-[#111827] border border-[#1F2937] p-3.5 rounded-2xl">
            <span className="text-[11px] font-bold text-[#9CA3AF] block">الدوري المصري 🇪🇬</span>
            <span className="text-2xl font-black text-[#F59E0B] mt-1 block">
              {matches.filter((m) => !isJordanLeague(m.league)).length} مواجهة
            </span>
          </div>

          <div className="bg-[#111827] border border-[#1F2937] p-3.5 rounded-2xl">
            <span className="text-[11px] font-bold text-[#9CA3AF] block">مباريات مباشرة (LIVE)</span>
            <span className="text-2xl font-black text-[#10B981] mt-1 block">
              {matches.filter((m) => m.status === 'LIVE').length}
            </span>
          </div>

          <div className="bg-[#111827] border border-[#1F2937] p-3.5 rounded-2xl">
            <span className="text-[11px] font-bold text-[#9CA3AF] block">مباريات محسومة</span>
            <span className="text-2xl font-black text-[#A78BFA] mt-1 block">
              {matches.filter((m) => m.status === 'FINISHED').length}
            </span>
          </div>
        </div>

        {/* League and Status Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111827] border border-[#1F2937] p-3 rounded-2xl">
          {/* League Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedLeagueFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedLeagueFilter === 'ALL'
                  ? 'bg-[#10B981] text-white'
                  : 'bg-[#1F2937] text-[#9CA3AF] hover:text-white'
              }`}
            >
              جميع الدوريات ({matches.length})
            </button>

            <button
              onClick={() => setSelectedLeagueFilter('JORDAN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                selectedLeagueFilter === 'JORDAN'
                  ? 'bg-[#0284C7] text-white'
                  : 'bg-[#1F2937] text-[#9CA3AF] hover:text-white'
              }`}
            >
              <span>🇯🇴 الدوري الأردني للمحترفين</span>
              <span className="opacity-80">({matches.filter((m) => isJordanLeague(m.league)).length})</span>
            </button>

            <button
              onClick={() => setSelectedLeagueFilter('EGYPT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                selectedLeagueFilter === 'EGYPT'
                  ? 'bg-[#D97706] text-white'
                  : 'bg-[#1F2937] text-[#9CA3AF] hover:text-white'
              }`}
            >
              <span>🇪🇬 الدوري المصري الممتاز</span>
              <span className="opacity-80">({matches.filter((m) => !isJordanLeague(m.league)).length})</span>
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => setSelectedStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                selectedStatusFilter === 'ALL' ? 'bg-[#374151] text-white' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setSelectedStatusFilter('UPCOMING')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                selectedStatusFilter === 'UPCOMING' ? 'bg-[#374151] text-white' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              قادمة
            </button>
            <button
              onClick={() => setSelectedStatusFilter('LIVE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                selectedStatusFilter === 'LIVE' ? 'bg-[#10B981]/20 text-[#34D399]' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              مباشر
            </button>
            <button
              onClick={() => setSelectedStatusFilter('FINISHED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                selectedStatusFilter === 'FINISHED' ? 'bg-[#374151] text-white' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              منتهية
            </button>
          </div>
        </div>

        {/* Matches List Cards */}
        <div className="space-y-3">
          {filteredMatches.length === 0 ? (
            <div className="p-8 text-center bg-[#111827] border border-[#1F2937] rounded-3xl text-sm text-[#9CA3AF]">
              لا توجد مباريات مطابقة للفلتر المحدد حالياً. يمكنك إضافة مواجهة جديدة بالزر أعلاه.
            </div>
          ) : (
            filteredMatches.map((match) => {
              const inputScore = scoreInputs[match.id] || {
                home: match.homeScore,
                away: match.awayScore,
              };

              return (
                <div
                  key={match.id}
                  className="bg-[#111827] border border-[#1F2937] hover:border-[#374151] rounded-3xl p-4 sm:p-5 transition-all shadow-md space-y-4"
                >
                  {/* Top Match Info Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F2937] pb-3 text-xs text-[#9CA3AF]">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#1F2937] text-white font-bold border border-white/5">
                        {match.league}
                      </span>
                      <span>{match.roundName}</span>
                      <span>•</span>
                      <span>{match.stadium}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {match.status === 'LIVE' ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#10B981] bg-[#10B981]/15 px-2.5 py-0.5 rounded-full border border-[#10B981]/30 animate-pulse">
                          <Activity className="w-3.5 h-3.5" />
                          <span>مباشر الدقيقة {match.minute || 45}'</span>
                        </span>
                      ) : match.status === 'FINISHED' ? (
                        <span className="text-xs font-bold text-[#9CA3AF] bg-[#1F2937] px-2.5 py-0.5 rounded-full">
                          انتهت (Final)
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-2.5 py-0.5 rounded-full border border-[#F59E0B]/20">
                          {match.startTimeText}
                        </span>
                      )}

                      <button
                        onClick={() => handleDeleteMatch(match.id)}
                        className="p-1 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors cursor-pointer"
                        title="حذف المباراة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Teams and Live Score Management */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Home Team */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner border"
                        style={{
                          backgroundColor: `${match.homeTeam.primaryColor}20`,
                          borderColor: match.homeTeam.primaryColor,
                        }}
                      >
                        {match.homeTeam.badgeSymbol}
                      </div>
                      <div>
                        <div className="text-base font-black text-white">{match.homeTeam.nameAr}</div>
                        <div className="text-xs text-[#9CA3AF] font-mono">{match.homeTeam.shortName}</div>
                      </div>
                    </div>

                    {/* Middle: Live Score Inputs & Result Setter */}
                    <div className="flex flex-col items-center justify-center bg-[#0B0F19] border border-[#1F2937] p-3 rounded-2xl space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <span className="text-[10px] text-[#9CA3AF] block mb-1">المضيف</span>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={inputScore.home}
                            onChange={(e) =>
                              handleScoreChange(match.id, 'home', parseInt(e.target.value) || 0)
                            }
                            className="w-14 h-12 bg-[#1F2937] text-white text-center font-mono text-2xl font-black rounded-xl border border-white/10 focus:outline-none focus:border-[#10B981]"
                          />
                        </div>

                        <span className="text-2xl font-black text-[#6B7280] pt-4">-</span>

                        <div className="text-center">
                          <span className="text-[10px] text-[#9CA3AF] block mb-1">الضيف</span>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={inputScore.away}
                            onChange={(e) =>
                              handleScoreChange(match.id, 'away', parseInt(e.target.value) || 0)
                            }
                            className="w-14 h-12 bg-[#1F2937] text-white text-center font-mono text-2xl font-black rounded-xl border border-white/10 focus:outline-none focus:border-[#10B981]"
                          />
                        </div>
                      </div>

                      {/* Settle / Finalize Match Button */}
                      <button
                        onClick={() => handleSettleMatch(match.id)}
                        className="w-full py-2 px-3 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>إنهاء المباراة وحسم الرهانات فوراً</span>
                      </button>
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center justify-end md:justify-start gap-3 flex-row-reverse md:flex-row">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner border"
                        style={{
                          backgroundColor: `${match.awayTeam.primaryColor}20`,
                          borderColor: match.awayTeam.primaryColor,
                        }}
                      >
                        {match.awayTeam.badgeSymbol}
                      </div>
                      <div className="text-end md:text-start">
                        <div className="text-base font-black text-white">{match.awayTeam.nameAr}</div>
                        <div className="text-xs text-[#9CA3AF] font-mono">{match.awayTeam.shortName}</div>
                      </div>
                    </div>
                  </div>

                  {/* Odds Display Strip */}
                  <div className="pt-2 border-t border-[#1F2937] flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="text-[11px] font-sans font-bold text-[#9CA3AF]">الفرص المسجلة:</span>
                    <span className="bg-[#1F2937] px-2.5 py-1 rounded-lg text-white">
                      1: <strong className="text-[#10B981]">{match.odds.home.toFixed(2)}</strong>
                    </span>
                    <span className="bg-[#1F2937] px-2.5 py-1 rounded-lg text-white">
                      X: <strong className="text-[#F59E0B]">{match.odds.draw.toFixed(2)}</strong>
                    </span>
                    <span className="bg-[#1F2937] px-2.5 py-1 rounded-lg text-white">
                      2: <strong className="text-[#38BDF8]">{match.odds.away.toFixed(2)}</strong>
                    </span>
                    <span className="bg-[#1F2937] px-2.5 py-1 rounded-lg text-[#9CA3AF]">
                      +2.5: {match.odds.over25.toFixed(2)} | -2.5: {match.odds.under25.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal: Add New Match */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 animate-in fade-in">
            <div className="w-full max-w-xl bg-[#111827] border border-[#1F2937] rounded-3xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#10B981]/20 text-[#10B981] flex items-center justify-center">
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </div>
                  <h3 className="text-lg font-black text-white">إضافة مواجهة جديدة</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1F2937] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddMatch} className="space-y-4 text-xs font-bold">
                {/* League Choice */}
                <div>
                  <label className="text-[#9CA3AF] block mb-1">اختر البطولة / الدوري:</label>
                  <select
                    value={newLeague}
                    onChange={(e) => handleLeagueChange(e.target.value)}
                    className="w-full p-2.5 bg-[#1F2937] border border-white/10 rounded-xl text-white font-bold cursor-pointer"
                  >
                    <option value="الدوري الأردني للمحترفين">🇯🇴 الدوري الأردني للمحترفين</option>
                    <option value="كأس الأردن">🇯🇴 كأس الأردن</option>
                    <option value="الدوري المصري الممتاز">🇪🇬 الدوري المصري الممتاز</option>
                    <option value="كأس مصر">🇪🇬 كأس مصر</option>
                  </select>
                </div>

                {/* Team Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#9CA3AF] block mb-1">صاحب الأرض (Home Team):</label>
                    <select
                      value={newHomeClubId}
                      onChange={(e) => setNewHomeClubId(e.target.value)}
                      className="w-full p-2.5 bg-[#1F2937] border border-white/10 rounded-xl text-white font-bold cursor-pointer"
                    >
                      {availableClubsForLeague.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.badgeSymbol} {c.nameAr} ({c.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[#9CA3AF] block mb-1">الفريق الضيف (Away Team):</label>
                    <select
                      value={newAwayClubId}
                      onChange={(e) => setNewAwayClubId(e.target.value)}
                      className="w-full p-2.5 bg-[#1F2937] border border-white/10 rounded-xl text-white font-bold cursor-pointer"
                    >
                      {availableClubsForLeague.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.badgeSymbol} {c.nameAr} ({c.city})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Stadium & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#9CA3AF] block mb-1">الملعب (Stadium):</label>
                    <input
                      type="text"
                      value={newStadium}
                      onChange={(e) => setNewStadium(e.target.value)}
                      className="w-full p-2.5 bg-[#1F2937] border border-white/10 rounded-xl text-white"
                      placeholder="ستاد عمان الدولي"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[#9CA3AF] block mb-1">موعد المباراة (Time Text):</label>
                    <input
                      type="text"
                      value={newStartTimeText}
                      onChange={(e) => setNewStartTimeText(e.target.value)}
                      className="w-full p-2.5 bg-[#1F2937] border border-white/10 rounded-xl text-white"
                      placeholder="اليوم 19:30"
                      required
                    />
                  </div>
                </div>

                {/* Odds 1X2 */}
                <div>
                  <label className="text-[#9CA3AF] block mb-1">نسب وفرص الفوز (1X2 Odds):</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-[#10B981] block">1 (فوز الأرض)</span>
                      <input
                        type="number"
                        step="0.05"
                        min="1.01"
                        value={newHomeOdd}
                        onChange={(e) => setNewHomeOdd(parseFloat(e.target.value) || 1.05)}
                        className="w-full p-2 bg-[#1F2937] border border-white/10 rounded-xl text-white font-mono"
                        required
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#F59E0B] block">X (التعادل)</span>
                      <input
                        type="number"
                        step="0.05"
                        min="1.01"
                        value={newDrawOdd}
                        onChange={(e) => setNewDrawOdd(parseFloat(e.target.value) || 1.05)}
                        className="w-full p-2 bg-[#1F2937] border border-white/10 rounded-xl text-white font-mono"
                        required
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#38BDF8] block">2 (فوز الضيف)</span>
                      <input
                        type="number"
                        step="0.05"
                        min="1.01"
                        value={newAwayOdd}
                        onChange={(e) => setNewAwayOdd(parseFloat(e.target.value) || 1.05)}
                        className="w-full p-2 bg-[#1F2937] border border-white/10 rounded-xl text-white font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Over / Under & BTTS */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[10px] text-[#9CA3AF] block mb-1">أكثر من 2.5 / أقل من 2.5</span>
                    <div className="grid grid-cols-2 gap-1.5 font-mono">
                      <input
                        type="number"
                        step="0.05"
                        value={newOverOdd}
                        onChange={(e) => setNewOverOdd(parseFloat(e.target.value) || 1.8)}
                        className="p-2 bg-[#1F2937] border border-white/10 rounded-xl text-white"
                        placeholder="+2.5"
                      />
                      <input
                        type="number"
                        step="0.05"
                        value={newUnderOdd}
                        onChange={(e) => setNewUnderOdd(parseFloat(e.target.value) || 1.9)}
                        className="p-2 bg-[#1F2937] border border-white/10 rounded-xl text-white"
                        placeholder="-2.5"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#9CA3AF] block mb-1">كلا الفريقين يسجل (BTTS)</span>
                    <div className="grid grid-cols-2 gap-1.5 font-mono">
                      <input
                        type="number"
                        step="0.05"
                        value={newBttsYesOdd}
                        onChange={(e) => setNewBttsYesOdd(parseFloat(e.target.value) || 1.8)}
                        className="p-2 bg-[#1F2937] border border-white/10 rounded-xl text-white"
                        placeholder="نعم"
                      />
                      <input
                        type="number"
                        step="0.05"
                        value={newBttsNoOdd}
                        onChange={(e) => setNewBttsNoOdd(parseFloat(e.target.value) || 1.9)}
                        className="p-2 bg-[#1F2937] border border-white/10 rounded-xl text-white"
                        placeholder="لا"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1F2937] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-[#1F2937] text-[#9CA3AF] hover:text-white cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-black cursor-pointer shadow-md"
                  >
                    حفظ ونشر المباراة
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
