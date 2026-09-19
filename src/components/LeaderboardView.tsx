import React, { useState, useEffect } from 'react';
import { Award, Trophy, Medal, Search, Flame, Clock } from 'lucide-react';
import { StudentAttempt, PhysicsGame } from '../types';

interface LeaderboardViewProps {
  games: PhysicsGame[];
  onPlayGame: (game: PhysicsGame) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ games, onPlayGame }) => {
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetch('/api/attempts')
      .then(res => res.json())
      .then(data => setAttempts(data))
      .catch(err => console.error(err));
  }, []);

  // Filter attempts
  const filtered = attempts
    .filter(a => !selectedGameId || a.gameId === selectedGameId)
    .filter(a => !searchQuery || a.studentName.toLowerCase().includes(searchQuery.toLowerCase()))
    // sort by percentage desc, then duration asc
    .sort((a, b) => b.percentage - a.percentage || a.durationSec - b.durationSec);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="text-center max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
          <Trophy className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Үздіктер Рейтингі
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Ең жоғары балл жинап, физиканы үздік меңгерген оқушылар көшбасшылары
        </p>
      </div>

      {/* Filter controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Оқушы атын іздеу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedGameId}
          onChange={(e) => setSelectedGameId(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none"
        >
          <option value="">Барлық сабақтар бойынша</option>
          {games.map(g => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      </div>

      {/* Leaderboard List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            Әзірге рейтингте нәтижелер жоқ
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.slice(0, 50).map((item, idx) => {
              const rank = idx + 1;
              const isTop1 = rank === 1;
              const isTop2 = rank === 2;
              const isTop3 = rank === 3;

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition ${
                    isTop1
                      ? 'bg-amber-50/40'
                      : isTop2
                      ? 'bg-slate-50/70'
                      : isTop3
                      ? 'bg-amber-100/20'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Rank Badge */}
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-sm sm:text-base shrink-0">
                      {isTop1 ? (
                        <div className="w-full h-full bg-amber-400 text-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                          <Medal className="w-5 h-5 text-amber-900" />
                        </div>
                      ) : isTop2 ? (
                        <div className="w-full h-full bg-slate-300 text-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                          <Medal className="w-5 h-5 text-slate-700" />
                        </div>
                      ) : isTop3 ? (
                        <div className="w-full h-full bg-amber-700/30 text-amber-900 rounded-xl flex items-center justify-center shadow-sm">
                          <Medal className="w-5 h-5 text-amber-900" />
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">#{rank}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2 truncate">
                        <span>{item.studentName}</span>
                        {item.className && (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            {item.className}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-2">
                        <span>{item.gameTitle}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.durationSec} сек
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <span
                      className={`text-lg sm:text-xl font-extrabold block ${
                        item.percentage >= 90
                          ? 'text-emerald-600'
                          : item.percentage >= 70
                          ? 'text-blue-600'
                          : 'text-slate-700'
                      }`}
                    >
                      {item.percentage}%
                    </span>
                    <span className="text-xs text-slate-400">
                      {item.score}/{item.total} балл
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
