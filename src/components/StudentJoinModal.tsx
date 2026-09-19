import React, { useState } from 'react';
import { X, Play, User, GraduationCap } from 'lucide-react';
import { PhysicsGame } from '../types';

interface StudentJoinModalProps {
  game: PhysicsGame | null;
  onClose: () => void;
  onConfirmJoin: (studentName: string, className: string) => void;
}

export const StudentJoinModal: React.FC<StudentJoinModalProps> = ({
  game,
  onClose,
  onConfirmJoin
}) => {
  const [studentName, setStudentName] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!game) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setError('Өтінеміз, өз аты-жөніңізді жазыңыз');
      return;
    }
    setError('');
    onConfirmJoin(studentName.trim(), className.trim());
  };

  const quickClasses = ['7 «А»', '8 «А»', '9 «А»', '10 «А»', '11 «А»'];

  return (
    <div
      id="student-join-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="student-join-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {game.category}
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-2">
              {game.title}
            </h3>
            {game.description && (
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                {game.description}
              </p>
            )}
          </div>
          <button
            id="close-student-join-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              <span>Аты-жөніңіз <span className="text-rose-500">*</span></span>
            </label>
            <input
              id="student-name-input"
              type="text"
              required
              autoFocus
              value={studentName}
              onChange={(e) => {
                setStudentName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Мысалы: Асқар Нұрлан"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-slate-500" />
                <span>Сыныбыңыз (міндетті емес)</span>
              </label>
              <span className="text-xs text-slate-400">қалауыңыз бойынша</span>
            </div>
            <input
              id="student-class-input"
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Мысалы: 9 «А» немесе бос қалдырыңыз"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-sm"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickClasses.map((cls) => (
                <button
                  type="button"
                  key={cls}
                  onClick={() => setClassName(cls)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition font-medium ${
                    className === cls
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              id="confirm-student-join-btn"
              type="submit"
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 text-base"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Ойынды бастау</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
