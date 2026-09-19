import React from 'react';
import { Atom, Award, KeyRound, LayoutGrid, UploadCloud, BookOpen, BookCheck, Sparkles } from 'lucide-react';

export type NavTabType = 'catalog' | 'upload' | 'categories' | 'journal' | 'leaderboard' | 'join';

interface NavbarProps {
  currentTab: NavTabType;
  setCurrentTab: (tab: NavTabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div
            id="brand-logo"
            onClick={() => setCurrentTab('catalog')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition">
              <Atom className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-base sm:text-lg text-slate-900 leading-tight tracking-tight flex items-center gap-2">
                <span>Физика әлемі</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Мұғалім порталы
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                7–11 сынып · HTML ойындар мен оқушылар журналы
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
            {/* 1. Games Catalog */}
            <button
              id="nav-catalog-btn"
              onClick={() => setCurrentTab('catalog')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 ${
                currentTab === 'catalog'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Ойындар</span>
            </button>

            {/* 2. HTML IMPORT BUTTON (PROMINENT) */}
            <button
              id="nav-html-import-btn"
              onClick={() => setCurrentTab('upload')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 shadow-sm ${
                currentTab === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>HTML импорттау</span>
            </button>

            {/* 3. CATEGORIES MANAGEMENT BUTTON */}
            <button
              id="nav-categories-btn"
              onClick={() => setCurrentTab('categories')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 ${
                currentTab === 'categories'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Бөлімдер қосу</span>
            </button>

            {/* 4. Student Journal */}
            <button
              id="nav-journal-btn"
              onClick={() => setCurrentTab('journal')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 ${
                currentTab === 'journal'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookCheck className="w-4 h-4" />
              <span>Журнал</span>
            </button>

            {/* 5. Leaderboard */}
            <button
              id="nav-leaderboard-btn"
              onClick={() => setCurrentTab('leaderboard')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 hidden md:flex ${
                currentTab === 'leaderboard'
                  ? 'bg-amber-50 text-amber-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Рейтинг</span>
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* 6. Student Join Mode */}
            <button
              id="nav-join-btn"
              onClick={() => setCurrentTab('join')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 ${
                currentTab === 'join'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="Оқушының кодпен кіру экраны"
            >
              <KeyRound className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Оқушы режимі</span>
              <span className="sm:hidden">Код</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

