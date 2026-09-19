import React, { useState } from 'react';
import { Search, Play, QrCode as QrIcon, Clock, Award, Sparkles, BookOpen, UploadCloud, Plus, BookCheck, Info, ArrowUpRight } from 'lucide-react';
import { PhysicsGame, PhysicsCategory } from '../types';

interface GameCatalogProps {
  games: PhysicsGame[];
  categoriesList?: PhysicsCategory[];
  onSelectGame: (game: PhysicsGame) => void;
  onOpenDetails: (game: PhysicsGame) => void;
  onOpenQr: (game: PhysicsGame) => void;
  onGoToUpload?: () => void;
  onGoToCategories?: () => void;
  onGoToJournal?: () => void;
}

export const GameCatalog: React.FC<GameCatalogProps> = ({
  games,
  categoriesList = [],
  onSelectGame,
  onOpenDetails,
  onOpenQr,
  onGoToUpload,
  onGoToCategories,
  onGoToJournal
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Барлығы');
  const [selectedGrade, setSelectedGrade] = useState<string>('Барлығы');

  // Unified Categories list
  const catNamesFromDb = categoriesList.map(c => c.name);
  const catNamesFromGames = games.map(g => g.category).filter(Boolean);
  const allUniqueCategories = ['Барлығы', ...Array.from(new Set([...catNamesFromDb, ...catNamesFromGames]))];
  const grades = ['Барлығы', '7', '8', '9', '10', '11'];

  // Filtered games
  const filtered = games.filter(g => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
    const matchCat = selectedCategory === 'Барлығы' || g.category === selectedCategory;
    const matchGrade = selectedGrade === 'Барлығы' || (g.targetGrades && g.targetGrades.includes(selectedGrade));
    return matchSearch && matchCat && matchGrade;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Teacher Action Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur border border-white/20 mb-3 text-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Физика пәні мұғалімінің жұмыс орталығы</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              Интерактивті HTML физика ойындары
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-blue-100 leading-relaxed font-normal">
              Өз компьютеріңіздегі кез келген HTML симулятор мен викторинаны импорттаңыз, жаңа бөлімдер қосыңыз және оқушылар нәтижесін бақылаңыз.
            </p>
          </div>

          {/* Direct Action Buttons for Teacher */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onGoToUpload && (
              <button
                id="catalog-quick-upload-btn"
                onClick={onGoToUpload}
                className="px-4 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>📥 HTML файл импорттау</span>
              </button>
            )}

            {onGoToCategories && (
              <button
                id="catalog-quick-categories-btn"
                onClick={onGoToCategories}
                className="px-4 py-3 bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-xs sm:text-sm rounded-2xl transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>➕ Жаңа бөлім қосу</span>
              </button>
            )}

            {onGoToJournal && (
              <button
                id="catalog-quick-journal-btn"
                onClick={onGoToJournal}
                className="px-4 py-3 bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-xs sm:text-sm rounded-2xl transition flex items-center gap-2"
              >
                <BookCheck className="w-4 h-4" />
                <span>📊 Журнал</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Search */}
        <div className="mt-6 flex items-center max-w-md bg-white rounded-2xl p-1.5 shadow-lg relative z-10">
          <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
          <input
            type="text"
            placeholder="Сабақтарды іздеу: Ньютон, үдеу, оптика..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="space-y-3">
        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs sm:text-sm">
          <span className="text-slate-400 font-bold shrink-0 mr-1">Бөлім:</span>
          {allUniqueCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition shrink-0 whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}

          {onGoToCategories && (
            <button
              onClick={onGoToCategories}
              className="px-3 py-1.5 rounded-xl font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Бөлім қосу</span>
            </button>
          )}
        </div>

        {/* Grades */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-bold shrink-0 mr-1">Сынып:</span>
          {grades.map((gr) => (
            <button
              key={gr}
              onClick={() => setSelectedGrade(gr)}
              className={`px-3 py-1 rounded-lg font-bold transition shrink-0 ${
                selectedGrade === gr
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {gr === 'Барлығы' ? 'Барлық сыныптар' : `${gr}-сынып`}
            </button>
          ))}
        </div>
      </div>

      {/* Games Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-slate-500 font-medium">
          <span>Табылған сабақтар: <strong className="text-slate-900">{filtered.length}</strong></span>
          {onGoToUpload && (
            <button
              onClick={onGoToUpload}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-1"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>+ Тағы бір HTML ойын жүктеу</span>
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              Сұраныс бойынша сабақтар табылмады
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Басқа бөлімді таңдаңыз немесе жаңа HTML ойын жүктеп көріңіз.
            </p>
            {onGoToUpload && (
              <button
                onClick={onGoToUpload}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4" />
                <span>HTML файл импорттау</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((game) => (
              <div
                key={game.id}
                id={`game-card-${game.id}`}
                onClick={() => onOpenDetails(game)}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-400 transition-all duration-200 flex flex-col justify-between group cursor-pointer relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                      {game.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetails(game);
                        }}
                        title="Толық ақпаратты көру"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenQr(game);
                        }}
                        title="Интерактивті тақтаға QR-код шығару"
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                      >
                        <QrIcon className="w-4 h-4 text-indigo-600" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition flex items-center gap-1.5">
                      <span>{game.title}</span>
                      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition shrink-0 opacity-0 group-hover:opacity-100" />
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {game.description || 'Физикалық интерактивті тапсырмалар мен сұрақтар.'}
                  </p>

                  {/* Grades pills */}
                  {game.targetGrades && game.targetGrades.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4">
                      {game.targetGrades.map((gr) => (
                        <span
                          key={gr}
                          className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600"
                        >
                          {gr}-сынып
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>Ойналды: <strong className="text-slate-700">{game.playCount}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectGame(game);
                      }}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>Ойнау</span>
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

