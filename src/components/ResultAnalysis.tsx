import React from 'react';
import { Award, Clock, RotateCcw, CheckCircle2, XCircle, AlertTriangle, ArrowRight, BookOpen, ThumbsUp, Sparkles } from 'lucide-react';
import { StudentAttempt, PhysicsGame } from '../types';

interface ResultAnalysisProps {
  attempt: StudentAttempt;
  game?: PhysicsGame | null;
  onPlayAgain: () => void;
  onGoToLeaderboard: () => void;
  onGoToCatalog: () => void;
}

export const ResultAnalysis: React.FC<ResultAnalysisProps> = ({
  attempt,
  game,
  onPlayAgain,
  onGoToLeaderboard,
  onGoToCatalog
}) => {
  const { percentage, score, total, durationSec, mistakes, studentName, className, gameTitle } = attempt;

  // Grade classification
  const getGradeInfo = (pct: number) => {
    if (pct >= 90) {
      return {
        label: 'Өте жақсы! (5)',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        message: 'Тамаша нәтиже! Физика заңдарын жоғары деңгейде меңгергеніңді көрсеттің.',
        icon: Sparkles,
        ringColor: '#10b981'
      };
    }
    if (pct >= 70) {
      return {
        label: 'Жақсы! (4)',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
        message: 'Жақсы нәтиже! Білімің сенімді, бірақ кейбір формулаларды қайталаған артық етпейді.',
        icon: ThumbsUp,
        ringColor: '#2563eb'
      };
    }
    if (pct >= 50) {
      return {
        label: 'Қанағаттанарлық (3)',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        message: 'Тақырыпты түсінгенің байқалады. Төмендегі қателерге назар аударып, қайта тапсырып көр.',
        icon: AlertTriangle,
        ringColor: '#f59e0b'
      };
    }
    return {
      label: 'Қайталау қажет (2)',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      message: 'Уайымдама! Қатемен жұмыс жасап, ережелерді қайталаған соң міндетті түрде қайта ойнап көр.',
      icon: BookOpen,
      ringColor: '#ef4444'
    };
  };

  const grade = getGradeInfo(percentage);
  const minutes = Math.floor(durationSec / 60);
  const remainingSecs = durationSec % 60;
  const timeText = minutes > 0 ? `${minutes} мин ${remainingSecs} сек` : `${remainingSecs} сек`;

  return (
    <div id="result-analysis-screen" className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-6 animate-fadeIn">
      {/* Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm text-center relative overflow-hidden">
        {/* Subtle accent bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />

        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border mb-4 bg-slate-100 text-slate-700">
            <span>{gameTitle}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Сынақ нәтижесі
          </h1>

          <p className="text-slate-600 mt-1 text-sm sm:text-base">
            Оқушы: <strong className="text-slate-900">{studentName}</strong>
            {className && <span className="ml-2 text-slate-500">({className})</span>}
          </p>

          {/* Big Score Display */}
          <div className="my-8 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-8 shadow-inner" style={{ borderColor: grade.ringColor }}>
              <div className="text-center">
                <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                  {percentage}%
                </span>
                <span className="block text-xs font-semibold text-slate-500 mt-0.5">
                  {score} / {total} балл
                </span>
              </div>
            </div>

            <div className={`mt-4 px-4 py-1.5 rounded-full text-sm font-bold border ${grade.badgeClass}`}>
              {grade.label}
            </div>

            <p className="text-slate-600 text-sm mt-3 max-w-md">
              {grade.message}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-4 border-t border-slate-100 text-left">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Дұрыс жауап</span>
              </div>
              <div className="text-lg font-bold text-slate-900">
                {score} <span className="text-xs text-slate-400 font-normal">/ {total}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Жұмсалған уақыт</span>
              </div>
              <div className="text-lg font-bold text-slate-900">
                {timeText}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Қателер саны</span>
              </div>
              <div className="text-lg font-bold text-slate-900">
                {mistakes.length}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <button
              id="result-play-again-btn"
              onClick={onPlayAgain}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition flex items-center gap-2 text-sm sm:text-base"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Қайта ойнау (нәтижені жақсарту)</span>
            </button>

            <button
              id="result-leaderboard-btn"
              onClick={onGoToLeaderboard}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl border border-slate-300 transition flex items-center gap-2 text-sm sm:text-base"
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>Рейтингті қарау</span>
            </button>

            <button
              id="result-catalog-btn"
              onClick={onGoToCatalog}
              className="px-5 py-3 text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center gap-1.5 transition"
            >
              <span>Басқа сабақтар</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Қатемен жұмыс (Work with Mistakes section) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Қатемен жұмыс және Түсіндірмелер
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {mistakes.length > 0
                  ? `Жіберілген ${mistakes.length} қате талданды. Дұрыс жауап пен физикалық заңдылықты есте сақтаңыз.`
                  : 'Құттықтаймыз! Сіз барлық сұраққа мүлтіксіз дұрыс жауап бердіңіз.'}
              </p>
            </div>
          </div>
        </div>

        {mistakes.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Қателер жоқ! 100% дәлдік
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Сіз барлық теориялық және практикалық сұрақтарды мүлтіксіз шештіңіз.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {mistakes.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-bold text-slate-900 text-sm sm:text-base flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{item.question}</span>
                  </div>
                  {item.topic && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0">
                      {item.topic}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-sm">
                  {/* Student Answer */}
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 block">
                        Сіздің жауабыңыз:
                      </span>
                      <span className="font-medium">{item.studentAnswer || 'Жауап берілмеді'}</span>
                    </div>
                  </div>

                  {/* Correct Answer */}
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 block">
                        Дұрыс жауап:
                      </span>
                      <span className="font-bold">{item.correctAnswer}</span>
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                {item.explanation && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 flex items-start gap-2">
                    <span className="font-bold text-blue-600 shrink-0">💡 Түсіндірме:</span>
                    <span>{item.explanation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
