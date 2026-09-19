import React, { useState } from 'react';
import { upload as uploadToBlob } from '@vercel/blob/client';
import {
  UploadCloud, FileCode, CheckCircle2, AlertCircle, Download,
  Sparkles, Plus, Code, HelpCircle, Check, ArrowRight, Layers
} from 'lucide-react';
import { PhysicsCategory, PhysicsGame } from '../types';

interface HtmlImportViewProps {
  categories: PhysicsCategory[];
  onGameCreated: () => void;
  onRefreshCategories: () => void;
  onGoToGames: () => void;
}

export const HtmlImportView: React.FC<HtmlImportViewProps> = ({
  categories,
  onGameCreated,
  onRefreshCategories,
  onGoToGames
}) => {
  // Form fields
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('Кинематика');
  const [description, setDescription] = useState<string>('');
  const [targetGrades, setTargetGrades] = useState<string[]>(['7', '8', '9']);
  const [deadline, setDeadline] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedHtml, setPastedHtml] = useState<string>('');
  const [importMode, setImportMode] = useState<'file' | 'code'>('file');

  // Inline Category quick-add state
  const [isAddingCategoryInline, setIsAddingCategoryInline] = useState<boolean>(false);
  const [inlineCatName, setInlineCatName] = useState<string>('');
  const [inlineCatLoading, setInlineCatLoading] = useState<boolean>(false);

  // Status state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string; shareCode?: string } | null>(null);
  const [showCodeGuide, setShowCodeGuide] = useState<boolean>(false);

  // Quick Add Category from form
  const handleQuickAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineCatName.trim()) return;

    setInlineCatLoading(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inlineCatName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setCategory(inlineCatName.trim());
        setInlineCatName('');
        setIsAddingCategoryInline(false);
        onRefreshCategories();
      } else {
        alert(data.error || 'Бөлімді қосу қатесі');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInlineCatLoading(false);
    }
  };

  // Helper to handle pasted code with auto-title and auto-category
  const handlePastedHtmlChange = (code: string) => {
    setPastedHtml(code);
    if (!title.trim() && code.trim()) {
      const match = code.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (match && match[1].trim()) {
        setTitle(match[1].trim());
      }
    }
    const lower = code.toLowerCase();
    if (lower.includes('кинематика') || lower.includes('қозғалыс') || lower.includes('жылдамдық') || lower.includes('үдеу')) {
      const kin = categories.find(c => c.name.toLowerCase().includes('кинематика'));
      if (kin) setCategory(kin.name);
    } else if (lower.includes('динамика') || lower.includes('ньютон') || lower.includes('күш')) {
      const dyn = categories.find(c => c.name.toLowerCase().includes('динамика'));
      if (dyn) setCategory(dyn.name);
    }
  };

  // Submit HTML game upload
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let effectiveTitle = title.trim();
    if (!effectiveTitle && importMode === 'code' && pastedHtml) {
      const match = pastedHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (match && match[1].trim()) {
        effectiveTitle = match[1].trim();
        setTitle(effectiveTitle);
      }
    }

    if (!effectiveTitle) {
      setStatus({ type: 'error', message: 'Сабақтың немесе ойынның атауын жазыңыз' });
      return;
    }

    if (importMode === 'file' && !selectedFile) {
      setStatus({ type: 'error', message: 'Компьютерден HTML (.html/.htm) файлын таңдаңыз' });
      return;
    }

    if (importMode === 'file' && selectedFile) {
      const lowerName = selectedFile.name.toLowerCase();
      const isHtml = lowerName.endsWith('.html') || lowerName.endsWith('.htm');
      const maxSize = 50 * 1024 * 1024;
      if (!isHtml) {
        setStatus({ type: 'error', message: 'Тек .html немесе .htm файл қабылданады.' });
        return;
      }
      if (selectedFile.size === 0) {
        setStatus({ type: 'error', message: 'Таңдалған HTML файл бос.' });
        return;
      }
      if (selectedFile.size > maxSize) {
        setStatus({ type: 'error', message: 'HTML файл тым үлкен. Максималды өлшем: 50 MB.' });
        return;
      }
    }

    if (importMode === 'code' && !pastedHtml.trim()) {
      setStatus({ type: 'error', message: 'HTML кодын өріске қойыңыз' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 120000);
      let res: Response;

      // Vercel Functions have a 4.5 MB request-body limit. Upload the HTML
      // directly from the browser to Vercel Blob, then send only metadata
      // (pathname/title/etc.) to /api/games.
      let blobPathname: string | null = null;
      const useBlobUpload = window.location.hostname.endsWith('.vercel.app') || window.location.hostname !== 'localhost';

      if (useBlobUpload) {
        const fileForUpload = importMode === 'file'
          ? selectedFile
          : new File([pastedHtml], 'physics-game.html', { type: 'text/html' });

        if (!fileForUpload) {
          throw new Error('HTML файл таңдалмады.');
        }

        const blob = await uploadToBlob(
          `fizgame/games/${Date.now()}-${fileForUpload.name.replace(/[^a-zA-Z0-9._-]+/g, '_')}`,
          fileForUpload,
          {
            access: 'private',
            handleUploadUrl: '/api/blob-upload',
            multipart: fileForUpload.size > 4 * 1024 * 1024,
            abortSignal: controller.signal,
            onUploadProgress: (progress) => {
              setStatus({
                type: 'success',
                message: `HTML жүктелуде: ${Math.round(progress.percentage)}%`
              });
            }
          }
        );

        blobPathname = blob.pathname;

        res = await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: effectiveTitle,
            description: description.trim(),
            category: category || 'Жалпы физика',
            targetGrades,
            deadline: deadline || null,
            blobPathname
          }),
          signal: controller.signal
        });
      } else {
        // Local-development fallback when Vercel Blob is intentionally disabled.
        if (importMode === 'code') {
          res = await fetch('/api/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: effectiveTitle,
              description: description.trim(),
              category: category || 'Жалпы физика',
              targetGrades,
              deadline: deadline || null,
              htmlContent: pastedHtml
            }),
            signal: controller.signal
          });
        } else {
          const formData = new FormData();
          formData.append('title', effectiveTitle);
          formData.append('description', description.trim());
          formData.append('category', category || 'Жалпы физика');
          formData.append('targetGrades', JSON.stringify(targetGrades));
          if (deadline) formData.append('deadline', deadline);
          if (selectedFile) formData.append('file', selectedFile);

          res = await fetch('/api/games', {
            method: 'POST',
            body: formData,
            signal: controller.signal
          });
        }
      }

      window.clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const textResp = await res.text();
        throw new Error(
          !res.ok
            ? `Сервер қатесі (${res.status}): файл форматы немесе өлшемі сәйкес келмеді`
            : (textResp && textResp.length < 150 ? textResp : 'Серверден қате келді')
        );
      }

      if (res.ok && data.success) {
        setStatus({
          type: 'success',
          message: 'HTML ойын сәтті импортталды және тіркелді!',
          shareCode: data.game?.shareCode
        });
        // Reset form fields
        setTitle('');
        setDescription('');
        setSelectedFile(null);
        setPastedHtml('');
        onGameCreated();
      } else {
        throw new Error(data.error || `Импорттау сәтсіз аяқталды (${res.status})`);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setStatus({
          type: 'error',
          message: 'Сервер жауап бермеді (120 секунд). Сервердің жұмысын және HTML файл өлшемін тексеріңіз.'
        });
      } else if (err instanceof TypeError) {
        setStatus({
          type: 'error',
          message: 'Серверге қосылу мүмкін болмады. Backend іске қосылғанын тексеріңіз.'
        });
      } else {
        setStatus({ type: 'error', message: err.message || 'Серверге жүктеу кезінде қате орын алды' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur border border-white/20 mb-3 text-blue-100">
            <UploadCloud className="w-4 h-4 text-amber-300" />
            <span>Мұғалімнің HTML импорттау құралы</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            HTML ойын / симуляцияны импорттау
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-blue-100 leading-relaxed">
            Кез келген интерактивті HTML физика ойынын, виртуалды зертхананы немесе викторинаны жүктеңіз. Жүйе оған автоматты түрде сыныпқа арналған QR-код және 6 таңбалы кіру кодын жасайды.
          </p>
        </div>
      </div>

      {/* Success Banner */}
      {status?.type === 'success' && (
        <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-3xl text-emerald-900 space-y-3 animate-fadeIn shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-base text-emerald-950">
                {status.message}
              </h3>
              <p className="text-xs text-emerald-700">
                Ойын сабақтар каталогына қосылды. Оқушылар бірден ойнай алады.
              </p>
            </div>
          </div>

          {status.shareCode && (
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-emerald-800">
                Сабақтың кіру коды: <strong className="font-mono text-base bg-white px-2.5 py-1 rounded-lg border border-emerald-300">{status.shareCode}</strong>
              </span>
              <button
                onClick={onGoToGames}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <span>Ойындар тізіміне өту</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Banner */}
      {status?.type === 'error' && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{status.message}</span>
        </div>
      )}

      {/* Main Import Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
              Сабақтың немесе ойынның атауы <span className="text-rose-500">*</span>
            </label>
            <input
              id="html-import-title"
              type="text"
              required
              placeholder="Мысалы: Динамика — Ньютон заңдары және Күштер тренажері"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Category Selection + Quick Add Inline */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                Физика бөлімі (Санат) <span className="text-rose-500">*</span>
              </label>

              <button
                type="button"
                onClick={() => setIsAddingCategoryInline(!isAddingCategoryInline)}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingCategoryInline ? 'Жабу' : '+ Жаңа бөлім қосу'}</span>
              </button>
            </div>

            {/* Quick Add Inline Box */}
            {isAddingCategoryInline ? (
              <div className="bg-white p-3.5 rounded-xl border-2 border-blue-300 shadow-sm space-y-2 animate-fadeIn">
                <span className="text-xs font-bold text-slate-700 block">
                  Жаңа бөлім атауын жазыңыз:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Мысалы: Астрофизика, Толқындық оптика, Гидростатика..."
                    value={inlineCatName}
                    onChange={(e) => setInlineCatName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    disabled={inlineCatLoading || !inlineCatName.trim()}
                    onClick={handleQuickAddCategory}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition"
                  >
                    {inlineCatLoading ? 'Қосылуда...' : 'Қосу'}
                  </button>
                </div>
              </div>
            ) : (
              <select
                id="html-import-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Description & Target Grades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                Қысқаша түсіндірме немесе нұсқаулық
              </label>
              <textarea
                id="html-import-description"
                rows={3}
                placeholder="Оқушыға арналған қысқаша кеңес: мысалы, 4 сұрақтан тұрады, калькуляторды қолдануға болады..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                Мақсатты сыныптар:
              </label>
              <div className="flex flex-wrap gap-2">
                {['7', '8', '9', '10', '11'].map((gr) => {
                  const isChecked = targetGrades.includes(gr);
                  return (
                    <button
                      type="button"
                      key={gr}
                      onClick={() => {
                        if (isChecked) {
                          setTargetGrades(targetGrades.filter(g => g !== gr));
                        } else {
                          setTargetGrades([...targetGrades, gr]);
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                        isChecked
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {gr}-сынып
                    </button>
                  );
                })}
              </div>

              <div className="pt-1">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Тапсыру мерзімі (Дедлайн, міндетті емес):
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* HTML Source Mode: File vs Code */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                HTML файлын ұсыну түрі:
              </span>
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setImportMode('file')}
                  className={`px-3.5 py-1.5 rounded-lg transition ${
                    importMode === 'file'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Файлды жүктеу (.html)
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('code')}
                  className={`px-3.5 py-1.5 rounded-lg transition ${
                    importMode === 'code'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  HTML кодын қою
                </button>
              </div>
            </div>

            {/* Mode 1: File Upload Box */}
            {importMode === 'file' ? (
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-3xl p-8 text-center bg-slate-50 transition cursor-pointer relative group">
                <input
                  id="html-file-selector"
                  type="file"
                  accept=".html,.htm"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const f = e.target.files[0];
                      setSelectedFile(f);
                      if (!title.trim()) {
                        setTitle(f.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
                      }
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-3">
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-105 transition">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="font-bold text-sm sm:text-base text-slate-900 block">
                      {selectedFile ? selectedFile.name : 'HTML файлын осында сүйреңіз немесе басып таңдаңыз'}
                    </span>
                    <span className="text-xs text-slate-500 mt-1 block">
                      {selectedFile
                        ? `Өлшемі: ${(selectedFile.size / 1024).toFixed(1)} КБ (жүктеуге дайын)`
                        : 'Қолдау көрсетілетін формат: .html, .htm (HTML5 симуляциялар мен тесттер)'}
                    </span>
                  </div>
                  {selectedFile && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Файл таңдалды</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Mode 2: Direct Code Paste */
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>HTML / CSS / JS толық кодын осында қойыңыз:</span>
                  <span>{pastedHtml.length} таңба</span>
                </div>
                <textarea
                  id="html-code-textarea"
                  rows={8}
                  placeholder="<!DOCTYPE html><html><head>...</head><body><h1>Физика ойыны</h1>...</body></html>"
                  value={pastedHtml}
                  onChange={(e) => handlePastedHtmlChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCodeGuide(!showCodeGuide)}
              className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1.5 font-medium"
            >
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <span>Ойын біткенде балл қалай сақталады? (Bridge кодын көру)</span>
            </button>

            <button
              id="html-import-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm sm:text-base rounded-2xl shadow-md transition flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-5 h-5" />
              <span>{isSubmitting ? 'Импортталуда...' : 'Ойынды импорттау және жариялау'}</span>
            </button>
          </div>
        </form>

        {/* Universal Bridge Helper Accordion */}
        {showCodeGuide && (
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs text-slate-700 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <Code className="w-4 h-4 text-blue-600" />
                <span>Нәтижені журналға өткізуге арналған код</span>
              </span>
              <a
                href="/api/template/html"
                download
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold flex items-center gap-1 text-[11px]"
              >
                <Download className="w-3 h-3" />
                <span>Үлгі шаблонды (.html) жүктеу</span>
              </a>
            </div>
            <p className="leading-relaxed">
              HTML ойыныңызда оқушы тестті бітірген кезде келесі функцияны шақырсаңыз, жиналған балл мен қателері бірден мұғалім журналына түседі:
            </p>
            <pre className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono overflow-x-auto text-[11px] leading-relaxed">
{`// Ойын біткен сәтте шақырылады:
window.reportResult({
  score: 4,               // Жинаған балы
  total: 5,               // Барлық сұрақ саны
  percentage: 80,         // Пайыздық көрсеткіші
  durationSec: 65,        // Жұмсалған уақыт (секунд)
  mistakes: [             // Қате жауаптары (қатемен жұмыс парағы үшін)
    {
      question: "Үдеудің өлшем бірлігі?",
      studentAnswer: "м/с",
      correctAnswer: "м/с²",
      explanation: "Үдеу a = (v - v₀)/t, сондықтан оның өлшем бірлігі м/с² болады."
    }
  ]
});`}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
