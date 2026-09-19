import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, Layers, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { PhysicsCategory, PhysicsGame } from '../types';

interface CategoriesManagerProps {
  categories: PhysicsCategory[];
  games: PhysicsGame[];
  onRefreshCategories: () => void;
  onSelectCategoryFilter?: (categoryName: string) => void;
}

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  categories,
  games,
  onRefreshCategories,
  onSelectCategoryFilter
}) => {
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatDesc, setNewCatDesc] = useState<string>('');
  const [newCatGrades, setNewCatGrades] = useState<string[]>(['7', '8', '9']);
  const [newCatColor, setNewCatColor] = useState<string>('blue');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const colorOptions = [
    { label: 'Көк', value: 'blue', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Индиго', value: 'indigo', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { label: 'Жасыл', value: 'emerald', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { label: 'Сары / Қызғылт сары', value: 'amber', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'Күлгін', value: 'purple', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    { label: 'Қызыл', value: 'rose', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    { label: 'Ашық көк (Cyan)', value: 'cyan', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  ];

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setErrorMsg('Бөлім атауын жазыңыз');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim(),
          grades: newCatGrades,
          color: newCatColor
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Бөлім қосу қатесі');
      }

      setSuccessMsg(`«${newCatName.trim()}» бөлімі сәтті қосылды!`);
      setNewCatName('');
      setNewCatDesc('');
      setIsAddingNew(false);
      onRefreshCategories();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Қате орын алды');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat: PhysicsCategory) => {
    const gamesInCat = games.filter(g => g.category.toLowerCase() === cat.name.toLowerCase()).length;
    let confirmPrompt = `«${cat.name}» бөлімін өшіруді растайсыз ба?`;
    if (gamesInCat > 0) {
      confirmPrompt += `\nНазар аударыңыз: бұл бөлімде ${gamesInCat} сабақ бар.`;
    }

    if (!confirm(confirmPrompt)) return;

    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(cat.id || cat.name)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onRefreshCategories();
      }
    } catch (err) {
      console.error('Delete category error:', err);
    }
  };

  const getColorClass = (color?: string) => {
    switch (color) {
      case 'indigo': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'emerald': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'amber': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'purple': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'rose': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'cyan': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Физика пәнінің оқу жоспары</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Физика бөлімдері мен тақырыптар
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            Мұғалім осы жерден өз сабақтарына арналған жаңа физика бөлімдерін қоса алады. Қосылған бөлімдер бірден HTML ойындарды жүктеу кезінде және сабақтар фильтрінде шығады.
          </p>
        </div>

        <button
          id="open-add-category-btn"
          onClick={() => {
            setIsAddingNew(!isAddingNew);
            setErrorMsg('');
          }}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-sm transition flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isAddingNew ? 'Форманы жабу' : '+ Жаңа бөлім қосу'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* FORM: ADD NEW CATEGORY */}
      {isAddingNew && (
        <div className="bg-slate-50 border-2 border-blue-200 rounded-3xl p-6 sm:p-8 animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Жаңа физика бөлімін қосу
            </h2>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Бөлім атауы <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Мысалы: Толқындық оптика, Астрономия, Кванттық физика..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Түстік белгі (Тэг түсі)
                </label>
                <select
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {colorOptions.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Қысқаша сипаттамасы (қандай тақырыптар кіреді)
              </label>
              <input
                type="text"
                placeholder="Мысалы: Жарықтың дисперсиясы, дифракция, интерференция және спектрлер"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Қай сыныптарда өтіледі:
              </label>
              <div className="flex flex-wrap gap-2">
                {['7', '8', '9', '10', '11'].map((gr) => {
                  const isChecked = newCatGrades.includes(gr);
                  return (
                    <button
                      type="button"
                      key={gr}
                      onClick={() => {
                        if (isChecked) {
                          setNewCatGrades(newCatGrades.filter(g => g !== gr));
                        } else {
                          setNewCatGrades([...newCatGrades, gr]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        isChecked
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {gr}-сынып
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 text-xs font-bold rounded-xl transition"
              >
                Бас тарту
              </button>

              <button
                id="submit-create-category-btn"
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Сақталуда...' : 'Бөлімді сақтау'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CATEGORIES GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 font-semibold">
          <span>Барлық белсенді бөлімдер саны: <strong className="text-slate-900">{categories.length}</strong></span>
          <span>Басқан кезде сол бөлімнің ойындары ашылады</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const gamesCount = games.filter(
              g => g.category && g.category.toLowerCase() === cat.name.toLowerCase()
            ).length;

            return (
              <div
                key={cat.id || cat.name}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${getColorClass(cat.color)}`}>
                      {cat.name}
                    </span>

                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      title="Бөлімді өшіру"
                      className="text-slate-300 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[32px]">
                    {cat.description || 'Оқу бағдарламасына сәйкес физика тақырыптары.'}
                  </p>

                  {cat.grades && cat.grades.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {cat.grades.map(gr => (
                        <span key={gr} className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {gr}-сынып
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Сабақтар: <strong className="text-slate-900">{gamesCount}</strong></span>
                  </span>

                  {onSelectCategoryFilter && (
                    <button
                      onClick={() => onSelectCategoryFilter(cat.name)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline"
                    >
                      Сабақтарын көру →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
