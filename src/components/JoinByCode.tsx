import React, { useState } from 'react';
import { KeyRound, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
import { PhysicsGame } from '../types';

interface JoinByCodeProps {
  games: PhysicsGame[];
  onFoundGame: (game: PhysicsGame) => void;
}

export const JoinByCode: React.FC<JoinByCodeProps> = ({ games, onFoundGame }) => {
  const [code, setCode] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setError('Мұғалім берген кодты жазыңыз');
      return;
    }

    const found = games.find(g => g.shareCode.toUpperCase() === clean);
    if (found) {
      setError('');
      onFoundGame(found);
    } else {
      setError('Мұндай кодпен сабақ табылмады. Кодты тексеріп көріңіз.');
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Код арқылы кіру
        </h2>
        <p className="text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
          Мұғалім интерактивті тақтада немесе чатта көрсеткен 6 таңбалы кодты енгізіңіз
        </p>

        <form onSubmit={handleSearch} className="mt-6 space-y-4">
          <div>
            <input
              id="join-code-input"
              type="text"
              required
              autoFocus
              maxLength={12}
              placeholder="МЫСАЛЫ: KINEMA"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (error) setError('');
              }}
              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-center font-mono text-xl sm:text-2xl font-extrabold text-slate-900 tracking-widest placeholder:text-slate-300 focus:outline-none focus:border-blue-600 focus:bg-white transition uppercase"
            />
            {error && (
              <p className="text-xs text-rose-600 font-semibold mt-2">
                {error}
              </p>
            )}
          </div>

          <button
            id="submit-join-code-btn"
            type="submit"
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-base"
          >
            <span>Ойынды табу</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        {/* Available codes quick hints */}
        {games.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100 text-left">
            <span className="text-xs font-semibold text-slate-400 block mb-2">
              💡 Қазір белсенді мысал кодтар:
            </span>
            <div className="flex flex-wrap gap-2">
              {games.slice(0, 3).map((g) => (
                <button
                  key={g.id}
                  onClick={() => onFoundGame(g)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-xs font-mono font-bold text-slate-700 border border-slate-200 transition"
                >
                  {g.shareCode}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
