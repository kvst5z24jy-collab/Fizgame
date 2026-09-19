import React, { useEffect, useState } from 'react';
import {
  X,
  Play,
  QrCode as QrIcon,
  Award,
  Clock,
  Users,
  CheckCircle2,
  Calendar,
  Share2,
  Copy,
  Check,
  FileCode2,
  ArrowRight,
  TrendingUp,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { PhysicsGame, StudentAttempt } from '../types';

interface GameDetailsModalProps {
  game: PhysicsGame | null;
  onClose: () => void;
  onPlayGame: (game: PhysicsGame) => void;
  onOpenQr: (game: PhysicsGame) => void;
  onViewJournal?: (game: PhysicsGame) => void;
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({
  game,
  onClose,
  onPlayGame,
  onOpenQr,
  onViewJournal
}) => {
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  useEffect(() => {
    if (!game) return;

    setLoadingAttempts(true);
    fetch(`/api/attempts?gameId=${encodeURIComponent(game.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAttempts(data);
        } else {
          setAttempts([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load game attempts:', err);
        setAttempts([]);
      })
      .finally(() => {
        setLoadingAttempts(false);
      });
  }, [game]);

  if (!game) return null;

  const joinUrl = `${window.location.origin}/?code=${game.shareCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(game.shareCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Calculations
  const totalPlays = attempts.length;
  const avgPercentage = totalPlays
    ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalPlays)
    : game.avgScore || 0;

  const avgDuration = totalPlays
    ? Math.round(attempts.reduce((sum, a) => sum + (a.durationSec || 0), 0) / totalPlays)
    : 0;

  const formatDuration = (sec: number) => {
    if (!sec) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m > 0) {
      return `${m} мин ${s} сек`;
    }
    return `${s} сек`;
  };

  const passedCount = attempts.filter((a) => (a.percentage || 0) >= 70).length;
  const passRate = totalPlays ? Math.round((passedCount / totalPlays) * 100) : 0;

  // Top performers (Leaderboard for this specific game)
  const topAttempts = [...attempts]
    .sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      return a.durationSec - b.durationSec;
    })
    .slice(0, 5);

  const formattedDate = game.createdAt
    ? new Date(game.createdAt).toLocaleDateString('kk-KZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Күні көрсетілмеген';

  return (
    <div
      id="game-details-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="game-details-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150 relative"
      >
        {/* Modal Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-5 sm:p-6 shrink-0 relative">
          <button
            id="close-game-details-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            title="Жабу"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2 pr-10">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-md border border-white/20">
              {game.category}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/25 text-emerald-200 border border-emerald-400/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Белсенді ойын
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-white leading-snug pr-8">
            {game.title}
          </h2>

          <p className="mt-1.5 text-xs text-blue-100/90 leading-relaxed line-clamp-2">
            {game.description || 'Физикалық симуляция мен интерактивті тест тапсырмасы.'}
          </p>

          {/* Quick Access Info Bar */}
          <div className="mt-3.5 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2.5 text-xs text-blue-100">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-300 shrink-0" />
              <span className="text-[11px] sm:text-xs">Қосылған: <strong>{formattedDate}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15">
              <span className="text-[11px]">Код:</span>
              <strong className="font-mono text-xs sm:text-sm tracking-wider text-amber-300">{game.shareCode}</strong>
              <button
                onClick={handleCopyCode}
                className="p-1 hover:bg-white/20 rounded text-blue-200 hover:text-white transition"
                title="Кодты көшіру"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body Content (Scrollable) */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Key Metrics / Statistics */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Оқушылардың белсенділік статистикасы</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-1.5">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="text-lg font-extrabold text-slate-800">{totalPlays}</div>
                <div className="text-[10px] font-medium text-slate-500 mt-0.5">Ойналу саны</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-1.5">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div className="text-lg font-extrabold text-slate-800">{avgPercentage}%</div>
                <div className="text-[10px] font-medium text-slate-500 mt-0.5">Орташа нәтиже</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-1.5">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm font-extrabold text-slate-800 truncate" title={formatDuration(avgDuration)}>
                  {formatDuration(avgDuration)}
                </div>
                <div className="text-[10px] font-medium text-slate-500 mt-0.5">Орташа уақыт</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-lg font-extrabold text-slate-800">{passRate}%</div>
                <div className="text-[10px] font-medium text-slate-500 mt-0.5">Сәттілік (≥70%)</div>
              </div>
            </div>
          </div>

          {/* Target Grades & File Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Мақсатты сыныптар</span>
              </div>
              {game.targetGrades && game.targetGrades.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {game.targetGrades.map((grade) => (
                    <span
                      key={grade}
                      className="px-2 py-0.5 rounded-md text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs"
                    >
                      {grade}-сынып
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500">Барлық сыныптар үшін</span>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FileCode2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Бастапқы файл</span>
              </div>
              <p className="text-xs font-mono text-slate-700 truncate" title={game.originalName || game.fileName}>
                📄 {game.originalName || game.fileName}
              </p>
              <div className="mt-1 text-[10px] text-slate-400">
                Bridge API интеграциясы бар
              </div>
            </div>
          </div>

          {/* Share & Direct Link Box */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Share2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900">Оқушыларға арналған сілтеме</div>
                <div className="text-[11px] text-slate-500 font-mono truncate max-w-[200px] sm:max-w-xs">
                  {joinUrl}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                id="details-copy-link-btn"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-white hover:bg-slate-50 text-blue-700 border border-blue-300 font-bold text-xs rounded-lg shadow-2xs transition flex items-center justify-center gap-1.5"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Көшірілді!' : 'Сілтеме'}</span>
              </button>

              <button
                id="details-show-qr-btn"
                onClick={() => {
                  onClose();
                  onOpenQr(game);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-2xs transition flex items-center gap-1.5"
                title="Интерактивті тақтаға QR-код шығару"
              >
                <QrIcon className="w-3.5 h-3.5" />
                <span>QR-код</span>
              </button>
            </div>
          </div>

          {/* Top Students / Leaderboard for this game */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Осы ойынның үздік оқушылары</span>
              </h3>
              {onViewJournal && attempts.length > 0 && (
                <button
                  onClick={() => {
                    onClose();
                    onViewJournal(game);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-1"
                >
                  <span>Журналдан көру</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {loadingAttempts ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Нәтижелер жүктелуде...
              </div>
            ) : topAttempts.length === 0 ? (
              <div className="py-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Award className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                <p className="text-xs font-semibold text-slate-600">Әзірге ешкім ойнамаған</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Ойынды бірінші болып сынап көріңіз!</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {topAttempts.map((att, idx) => (
                  <div key={att.id} className="p-2.5 sm:px-3.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-extrabold text-[10px] ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-700/10 text-amber-900'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800">{att.studentName}</div>
                        <div className="text-[10px] text-slate-400">
                          {att.className ? `${att.className} сынып` : 'Сынып жоқ'} · {formatDuration(att.durationSec)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-xs sm:text-sm text-emerald-600">
                        {att.percentage}%
                      </span>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {att.score}/{att.total} ұпай
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition"
          >
            Жабу
          </button>

          <div className="flex items-center gap-2">
            <button
              id="details-play-game-btn"
              onClick={() => {
                onClose();
                onPlayGame(game);
              }}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Ойынды бастау</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
