import React, { useState, useEffect } from 'react';
import { Navbar, NavTabType } from './components/Navbar';
import { GameCatalog } from './components/GameCatalog';
import { JoinByCode } from './components/JoinByCode';
import { LeaderboardView } from './components/LeaderboardView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { HtmlImportView } from './components/HtmlImportView';
import { CategoriesManager } from './components/CategoriesManager';
import { StudentJoinModal } from './components/StudentJoinModal';
import { QrCodeModal } from './components/QrCodeModal';
import { GameDetailsModal } from './components/GameDetailsModal';
import { GamePlayer } from './components/GamePlayer';
import { ResultAnalysis } from './components/ResultAnalysis';
import { PhysicsGame, StudentAttempt, PhysicsCategory } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTabType>('catalog');
  const [games, setGames] = useState<PhysicsGame[]>([]);
  const [categories, setCategories] = useState<PhysicsCategory[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState<boolean>(true);

  // Active Play session state
  const [activeScreen, setActiveScreen] = useState<'browse' | 'playing' | 'result'>('browse');
  const [activeGame, setActiveGame] = useState<PhysicsGame | null>(null);
  const [currentStudent, setCurrentStudent] = useState<{ name: string; className: string }>({ name: '', className: '' });
  const [lastAttempt, setLastAttempt] = useState<StudentAttempt | null>(null);

  // Modals
  const [detailsModalGame, setDetailsModalGame] = useState<PhysicsGame | null>(null);
  const [joinModalGame, setJoinModalGame] = useState<PhysicsGame | null>(null);
  const [qrModalGame, setQrModalGame] = useState<PhysicsGame | null>(null);

  // Fetch games list
  const fetchGames = async () => {
    try {
      setIsLoadingGames(true);
      const res = await fetch('/api/games');
      const data = await res.json();
      if (Array.isArray(data)) {
        setGames(data);
      }
    } catch (err) {
      console.error('Failed to load games:', err);
    } finally {
      setIsLoadingGames(false);
    }
  };

  // Fetch categories list
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    fetchGames();
    fetchCategories();
  }, []);

  // Handle URL query parameter ?code=... (e.g. from QR scan or WhatsApp link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam && games.length > 0) {
      const match = games.find(g => g.shareCode.toUpperCase() === codeParam.toUpperCase());
      if (match) {
        setJoinModalGame(match);
      }
    }
  }, [games]);

  // When student starts a game from catalog or join code
  const handleSelectGameToPlay = (game: PhysicsGame) => {
    setJoinModalGame(game);
  };

  // Student confirms name & optional class in modal
  const handleConfirmJoin = (studentName: string, className: string) => {
    if (!joinModalGame) return;
    setActiveGame(joinModalGame);
    setCurrentStudent({ name: studentName, className });
    setJoinModalGame(null);
    setActiveScreen('playing');
  };

  // When game completes and results are saved
  const handleGameFinished = (attempt: StudentAttempt) => {
    setLastAttempt(attempt);
    setActiveScreen('result');
    fetchGames(); // refresh play counts
  };

  // Teacher preview mode (starts with a test student profile)
  const handleTeacherPreview = (game: PhysicsGame) => {
    setActiveGame(game);
    setCurrentStudent({ name: 'Мұғалім (Сынақ)', className: 'Мұғалім режимі' });
    setActiveScreen('playing');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setActiveScreen('browse');
        }}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {/* ACTIVE PLAYING SCREEN */}
        {activeScreen === 'playing' && activeGame && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <GamePlayer
              game={activeGame}
              studentName={currentStudent.name}
              className={currentStudent.className}
              onBack={() => {
                if (confirm('Ойыннан шығуды растайсыз ба? Жинаған баллыңыз сақталмауы мүмкін.')) {
                  setActiveScreen('browse');
                }
              }}
              onFinish={handleGameFinished}
            />
          </div>
        )}

        {/* ACTIVE RESULT & MISTAKES ANALYSIS SCREEN */}
        {activeScreen === 'result' && lastAttempt && (
          <ResultAnalysis
            attempt={lastAttempt}
            game={activeGame}
            onPlayAgain={() => {
              if (activeGame) {
                setActiveScreen('playing');
              } else {
                setActiveScreen('browse');
              }
            }}
            onGoToLeaderboard={() => {
              setActiveScreen('browse');
              setCurrentTab('leaderboard');
            }}
            onGoToCatalog={() => {
              setActiveScreen('browse');
              setCurrentTab('catalog');
            }}
          />
        )}

        {/* STANDARD BROWSING VIEWS */}
        {activeScreen === 'browse' && (
          <>
            {/* 1. Games Catalog */}
            {currentTab === 'catalog' && (
              <GameCatalog
                games={games}
                categoriesList={categories}
                onSelectGame={handleSelectGameToPlay}
                onOpenDetails={(g) => setDetailsModalGame(g)}
                onOpenQr={(g) => setQrModalGame(g)}
                onGoToUpload={() => setCurrentTab('upload')}
                onGoToCategories={() => setCurrentTab('categories')}
                onGoToJournal={() => setCurrentTab('journal')}
              />
            )}

            {/* 2. HTML Import View */}
            {currentTab === 'upload' && (
              <HtmlImportView
                categories={categories}
                onGameCreated={() => {
                  fetchGames();
                  fetchCategories();
                }}
                onRefreshCategories={fetchCategories}
                onGoToGames={() => setCurrentTab('catalog')}
              />
            )}

            {/* 3. Categories Management */}
            {currentTab === 'categories' && (
              <CategoriesManager
                categories={categories}
                games={games}
                onRefreshCategories={fetchCategories}
                onSelectCategoryFilter={(catName) => {
                  setCurrentTab('catalog');
                }}
              />
            )}

            {/* 4. Student Journal / Teacher Central */}
            {currentTab === 'journal' && (
              <TeacherDashboard
                games={games}
                categoriesList={categories}
                initialTab="journal"
                onRefreshGames={fetchGames}
                onRefreshCategories={fetchCategories}
                onOpenQrModal={(g) => setQrModalGame(g)}
                onPreviewGame={handleTeacherPreview}
              />
            )}

            {/* 5. Leaderboard View */}
            {currentTab === 'leaderboard' && (
              <LeaderboardView
                games={games}
                onPlayGame={handleSelectGameToPlay}
              />
            )}

            {/* 6. Join by 6-digit Code (Student View) */}
            {currentTab === 'join' && (
              <JoinByCode
                games={games}
                onFoundGame={(g) => setJoinModalGame(g)}
              />
            )}
          </>
        )}
      </main>

      {/* DETAILED GAME PASSPORT / STATS MODAL */}
      {detailsModalGame && (
        <GameDetailsModal
          game={detailsModalGame}
          onClose={() => setDetailsModalGame(null)}
          onPlayGame={(g) => {
            setDetailsModalGame(null);
            handleSelectGameToPlay(g);
          }}
          onOpenQr={(g) => {
            setDetailsModalGame(null);
            setQrModalGame(g);
          }}
          onViewJournal={(g) => {
            setDetailsModalGame(null);
            setCurrentTab('journal');
          }}
        />
      )}

      {/* STUDENT JOIN NAME/CLASS DIALOG MODAL */}
      {joinModalGame && (
        <StudentJoinModal
          game={joinModalGame}
          onClose={() => setJoinModalGame(null)}
          onConfirmJoin={handleConfirmJoin}
        />
      )}

      {/* CLASSROOM QR CODE PROJECTION MODAL */}
      {qrModalGame && (
        <QrCodeModal
          game={qrModalGame}
          onClose={() => setQrModalGame(null)}
          onStartGame={(g) => {
            setQrModalGame(null);
            handleSelectGameToPlay(g);
          }}
        />
      )}

      {/* Educational Platform Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">⚛️ Физика әлемі</span>
            <span>·</span>
            <span>Мұғалімдерге арналған интерактивті HTML ойындар мен бағалау порталы</span>
          </div>
          <div>
            <span>Қазақстан мектептері үшін · 7–11 сынып оқу бағдарламасы</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
