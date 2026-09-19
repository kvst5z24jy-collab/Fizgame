import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, ArrowLeft, Clock, User, CheckCircle, RefreshCw, Send } from 'lucide-react';
import { PhysicsGame, StudentAttempt, MistakeItem } from '../types';

interface GamePlayerProps {
  game: PhysicsGame;
  studentName: string;
  className: string;
  onBack: () => void;
  onFinish: (attempt: StudentAttempt) => void;
}

export const GamePlayer: React.FC<GamePlayerProps> = ({
  game,
  studentName,
  className,
  onBack,
  onFinish
}) => {
  const [seconds, setSeconds] = useState<number>(0);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showManualSubmit, setShowManualSubmit] = useState<boolean>(false);
  const [manualScore, setManualScore] = useState<number>(100);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format elapsed time (MM:SS)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Submit attempt to server
  const submitAttempt = async (
    score: number,
    total: number,
    percentage: number,
    mistakes: MistakeItem[]
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = {
        gameId: game.id,
        studentName,
        className,
        score,
        total,
        percentage,
        durationSec: seconds,
        mistakes
      };

      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.attempt) {
        onFinish(data.attempt);
      } else {
        throw new Error(data.error || 'Нәтижені сақтау қатесі');
      }
    } catch (err) {
      console.error('Submit error:', err);
      // Fallback local attempt object
      const localAttempt: StudentAttempt = {
        id: `local-${Date.now()}`,
        gameId: game.id,
        gameTitle: game.title,
        studentName,
        className,
        score,
        total,
        percentage,
        durationSec: seconds,
        mistakes,
        createdAt: new Date().toISOString()
      };
      onFinish(localAttempt);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Listen for Universal Bridge postMessage from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PHYSICS_GAME_RESULT') {
        const { score, total, percentage, mistakes } = event.data;
        submitAttempt(
          Number(score) || 0,
          Number(total) || 1,
          percentage !== undefined ? Number(percentage) : Math.round(((Number(score) || 0) / (Number(total) || 1)) * 100),
          Array.isArray(mistakes) ? mistakes : []
        );
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [game.id, studentName, className, seconds]);

  // Fullscreen toggle
  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullScreen(false);
    }
  };

  const reloadIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.src = `/api/play/${game.id}?t=${Date.now()}`;
    }
  };

  return (
    <div
      ref={containerRef}
      id="game-player-container"
      className="flex flex-col h-[calc(100vh-5rem)] min-h-[640px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-300 shadow-sm"
    >
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            id="player-back-btn"
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Шығу"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {game.category}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {game.shareCode}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate max-w-md">
              {game.title}
            </h2>
          </div>
        </div>

        {/* Student info and timer */}
        <div className="flex items-center gap-2 sm:gap-4 text-sm font-medium text-slate-700">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <User className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-900">{studentName}</span>
            {className && (
              <span className="text-xs text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                {className}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-mono text-slate-800">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>{formatTime(seconds)}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="player-refresh-btn"
              onClick={reloadIframe}
              title="Қайта қосу"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              id="player-fullscreen-btn"
              onClick={toggleFullScreen}
              title={isFullScreen ? 'Шығу' : 'Толық экран'}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              id="player-manual-finish-btn"
              onClick={() => setShowManualSubmit(!showManualSubmit)}
              className="ml-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Ойынды аяқтау</span>
            </button>
          </div>
        </div>
      </div>

      {/* Optional Manual Submit Dropdown (Universal Bridge for any custom external HTML) */}
      {showManualSubmit && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm text-amber-900 animate-fadeIn">
          <div>
            <strong>Нәтижені қолмен тіркеу:</strong> Егер ойын автоматты түрде нәтиже жібермесе, жинаған пайызыңызды белгілеңіз.
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <span>Пайыз:</span>
              <input
                type="number"
                min="0"
                max="100"
                value={manualScore}
                onChange={(e) => setManualScore(Number(e.target.value))}
                className="w-20 px-2 py-1 bg-white border border-amber-300 rounded text-center font-bold"
              />
              <span>%</span>
            </label>
            <button
              onClick={() => submitAttempt(Math.round(manualScore / 10), 10, manualScore, [])}
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Жіберу</span>
            </button>
          </div>
        </div>
      )}

      {/* Interactive Game Iframe */}
      <div className="flex-1 bg-white relative">
        <iframe
          ref={iframeRef}
          id="physics-game-iframe"
          src={`/api/play/${game.id}`}
          title={game.title}
          className="w-full h-full border-0 block"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
};
