import React, { useState, useEffect } from 'react';
import {
  UploadCloud, FileText, QrCode as QrIcon, Download, Trash2, Eye,
  Search, CheckCircle2, XCircle, Clock, Award, ShieldCheck,
  PlusCircle, RefreshCw, Copy, Check, Filter, Layers, BookOpen, KeyRound, Plus
} from 'lucide-react';
import { PhysicsGame, StudentAttempt, DashboardStats, MistakeItem, PhysicsCategory } from '../types';
import { CategoriesManager } from './CategoriesManager';

interface TeacherDashboardProps {
  games: PhysicsGame[];
  categoriesList?: PhysicsCategory[];
  onRefreshGames: () => void;
  onRefreshCategories?: () => void;
  onOpenQrModal: (game: PhysicsGame) => void;
  onPreviewGame: (game: PhysicsGame) => void;
  initialTab?: 'games' | 'upload' | 'journal' | 'categories';
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  games,
  categoriesList = [],
  onRefreshGames,
  onRefreshCategories,
  onOpenQrModal,
  onPreviewGame,
  initialTab = 'games'
}) => {
  // Dashboard state
  const [activeTab, setActiveTab] = useState<'games' | 'upload' | 'journal' | 'categories'>(initialTab);
  const [stats, setStats] = useState<DashboardStats>({
    totalGames: 0,
    totalAttempts: 0,
    avgPercentage: 0,
    totalStudents: 0
  });
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');
  const [selectedAttemptModal, setSelectedAttemptModal] = useState<StudentAttempt | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadCategory, setUploadCategory] = useState<string>('Механика');
  const [uploadDescription, setUploadDescription] = useState<string>('');
  const [uploadTargetGrades, setUploadTargetGrades] = useState<string[]>(['7', '8', '9', '10', '11']);
  const [uploadDeadline, setUploadDeadline] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedHtml, setPastedHtml] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'file' | 'code'>('file');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [isAddingCategoryInline, setIsAddingCategoryInline] = useState<boolean>(false);
  const [inlineCatName, setInlineCatName] = useState<string>('');
  const [isAddingCatLoading, setIsAddingCatLoading] = useState<boolean>(false);

  // Categories list
  const categories = categoriesList.length > 0
    ? categoriesList.map(c => c.name)
    : [
        'Кинематика',
        'Динамика',
        'Статика және Сақталу заңдары',
        'Термодинамика және Молекулалық физика',
        'Электростатика және Тұрақты ток',
        'Магнетизм және Электромагниттік толқындар',
        'Оптика',
        'Атомдық және Ядролық физика',
        'Жалпы физика'
      ];

  // Fetch stats and attempts
  const fetchData = async () => {
    try {
      const [statsRes, attemptsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/attempts')
      ]);
      const statsData = await statsRes.json();
      const attemptsData = await attemptsRes.json();
      setStats(statsData);
      setAttempts(attemptsData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQuickAddCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inlineCatName.trim()) return;

    setIsAddingCatLoading(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inlineCatName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setUploadCategory(inlineCatName.trim());
        setInlineCatName('');
        setIsAddingCategoryInline(false);
        if (onRefreshCategories) onRefreshCategories();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingCatLoading(false);
    }
  };

  const handlePastedCodeChange = (code: string) => {
    setPastedHtml(code);
    if (!uploadTitle.trim() && code.trim()) {
      const match = code.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (match && match[1].trim()) {
        setUploadTitle(match[1].trim());
      }
    }
    const lower = code.toLowerCase();
    if (lower.includes('кинематика') || lower.includes('қозғалыс') || lower.includes('жылдамдық')) {
      setUploadCategory('Кинематика');
    } else if (lower.includes('динамика') || lower.includes('ньютон') || lower.includes('күш')) {
      setUploadCategory('Динамика');
    }
  };

  // Handle File Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let effectiveTitle = uploadTitle.trim();
    if (!effectiveTitle && uploadMode === 'code' && pastedHtml) {
      const match = pastedHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (match && match[1].trim()) {
        effectiveTitle = match[1].trim();
        setUploadTitle(effectiveTitle);
      }
    }

    if (!effectiveTitle) {
      setUploadStatus({ type: 'error', message: 'Сабақ атауын жазыңыз' });
      return;
    }

    if (uploadMode === 'file' && !selectedFile) {
      setUploadStatus({ type: 'error', message: 'HTML (.html) файлын таңдаңыз' });
      return;
    }

    if (uploadMode === 'code' && !pastedHtml.trim()) {
      setUploadStatus({ type: 'error', message: 'HTML кодын қойыңыз' });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      let res: Response;

      if (uploadMode === 'code') {
        res = await fetch('/api/games', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: effectiveTitle,
            description: uploadDescription.trim(),
            category: uploadCategory,
            targetGrades: uploadTargetGrades,
            deadline: uploadDeadline || null,
            htmlContent: pastedHtml
          })
        });
      } else {
        const formData = new FormData();
        formData.append('title', effectiveTitle);
        formData.append('description', uploadDescription.trim());
        formData.append('category', uploadCategory);
        formData.append('targetGrades', JSON.stringify(uploadTargetGrades));
        if (uploadDeadline) formData.append('deadline', uploadDeadline);
        if (selectedFile) formData.append('file', selectedFile);

        res = await fetch('/api/games', {
          method: 'POST',
          body: formData
        });
      }

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
        setUploadStatus({ type: 'success', message: 'Ойын сәтті жүктелді!' });
        // Reset form
        setUploadTitle('');
        setUploadDescription('');
        setSelectedFile(null);
        setPastedHtml('');
        onRefreshGames();
        fetchData();
        setTimeout(() => {
          setActiveTab('games');
          setUploadStatus(null);
        }, 1200);
      } else {
        throw new Error(data.error || `Жүктеу қатесі (${res.status})`);
      }
    } catch (err: any) {
      setUploadStatus({ type: 'error', message: err.message || 'Серверге жүктеу кезінде қате орын алды' });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Delete Game
  const handleDeleteGame = async (gameId: string, title: string) => {
    if (!confirm(`«${title}» сабағын өшіруді растайсыз ба?`)) return;

    try {
      const res = await fetch(`/api/games/${gameId}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshGames();
        fetchData();
      }
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  // Copy share link
  const copyShareLink = (shareCode: string) => {
    const url = `${window.location.origin}/?code=${shareCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCodeId(shareCode);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Filtered attempts
  const filteredAttempts = attempts.filter((a) => {
    const matchesStudent = !searchStudent || a.studentName.toLowerCase().includes(searchStudent.toLowerCase());
    const matchesGame = !selectedGameFilter || a.gameId === selectedGameFilter;
    const matchesClass = !selectedClassFilter || a.className === selectedClassFilter;
    return matchesStudent && matchesGame && matchesClass;
  });

  // Unique classes for filter dropdown
  const uniqueClasses = Array.from(new Set(attempts.map(a => a.className).filter(Boolean)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header & Stats Overview */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Мұғалімнің басқару орталығы</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Администратор
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            HTML ойындарды жүктеу, сабақтарды тақтаға шығару және оқушылар нәтижелерін сараптау.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="teacher-refresh-btn"
            onClick={() => {
              onRefreshGames();
              fetchData();
            }}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Жаңарту</span>
          </button>

          <a
            href="/api/export/csv"
            download
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel-ге жүктеу (CSV)</span>
          </a>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Сабақтар саны</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {stats.totalGames}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Активті ойындар</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Ойналған рет саны</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {stats.totalAttempts}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Тапсырылған әрекет</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Орташа көрсеткіш</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {stats.avgPercentage}%
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Оқушылардың орташа балы</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Оқушылар саны</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {stats.totalStudents}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Бірегей қатысушылар</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('games')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'games'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Сабақтар каталогы ({games.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'upload'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Жаңа HTML ойын жүктеу</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'categories'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Физика бөлімдері ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('journal')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'journal'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Оқушылар журналы ({attempts.length})</span>
        </button>
      </div>

      {/* TAB 1: GAMES MANAGEMENT */}
      {activeTab === 'games' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Барлық жүктелген физика ойындары
            </h2>
            <button
              onClick={() => setActiveTab('upload')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Жаңа ойын қосу</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {games.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {g.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {g.shareCode}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                    {g.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                    {g.description || 'Сипаттамасыз'}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">
                    <div>
                      <span>Ойналды: </span>
                      <strong className="text-slate-800">{g.playCount} рет</strong>
                    </div>
                    <div>
                      <span>Орт. балл: </span>
                      <strong className="text-blue-600">{g.avgScore || 0}%</strong>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="grid grid-cols-3 gap-2 mt-5 pt-3 border-t border-slate-100">
                  <button
                    id={`preview-btn-${g.id}`}
                    onClick={() => onPreviewGame(g)}
                    className="py-2 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 border border-slate-200 transition"
                    title="Алдын ала көру"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Көру</span>
                  </button>

                  <button
                    id={`qr-btn-${g.id}`}
                    onClick={() => onOpenQrModal(g)}
                    className="py-2 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 border border-slate-200 transition"
                    title="Тақтаға QR-код шығару"
                  >
                    <QrIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>QR-код</span>
                  </button>

                  <button
                    id={`copy-btn-${g.id}`}
                    onClick={() => copyShareLink(g.shareCode)}
                    className="py-2 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 border border-slate-200 transition"
                    title="Сілтемені көшіру"
                  >
                    {copiedCodeId === g.shareCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Көшірілді</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Сілтеме</span>
                      </>
                    )}
                  </button>

                  <button
                    id={`delete-btn-${g.id}`}
                    onClick={() => handleDeleteGame(g.id, g.title)}
                    className="col-span-3 py-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition font-medium flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Сабақты өшіру</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: UPLOAD NEW GAME */}
      {activeTab === 'upload' && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Жаңа HTML ойынды жүктеу
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Кез келген интерактивті HTML физикалық симуляциясын немесе тест ойынын импорттаңыз.
              </p>
            </div>
            <a
              href="/api/template/html"
              download
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-blue-200 transition shrink-0"
              title="Үлгі HTML ойын шаблонын жүктеу"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Үлгі шаблонды алу (.html)</span>
            </a>
          </div>

          {uploadStatus && (
            <div
              className={`p-4 rounded-xl text-sm font-medium ${
                uploadStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {uploadStatus.message}
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Сабақтың / Ойынның атауы <span className="text-rose-500">*</span>
              </label>
              <input
                id="upload-title-input"
                type="text"
                required
                placeholder="Мысалы: Оптика — Жарықтың шағылу және сыну заңдары"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Физика бөлімі (Санат)
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

                {isAddingCategoryInline ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Жаңа бөлім атауы..."
                      value={inlineCatName}
                      onChange={(e) => setInlineCatName(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      disabled={isAddingCatLoading || !inlineCatName.trim()}
                      onClick={handleQuickAddCategory}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition"
                    >
                      {isAddingCatLoading ? '...' : 'Қосу'}
                    </button>
                  </div>
                ) : (
                  <select
                    id="upload-category-select"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Дедлайн (тапсыру мерзімі, міндетті емес)
                </label>
                <input
                  id="upload-deadline-input"
                  type="datetime-local"
                  value={uploadDeadline}
                  onChange={(e) => setUploadDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Қысқаша сипаттама немесе нұсқаулық
              </label>
              <textarea
                id="upload-desc-input"
                rows={2}
                placeholder="Оқушыға арналған қысқаша нұсқау (мысалы: 10 сұрақтан тұрады, әр сұраққа 1 минут)"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Target Grades Pills */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Мақсатты сыныптар:
              </label>
              <div className="flex flex-wrap gap-2">
                {['7', '8', '9', '10', '11'].map((gr) => {
                  const isChecked = uploadTargetGrades.includes(gr);
                  return (
                    <button
                      type="button"
                      key={gr}
                      onClick={() => {
                        if (isChecked) {
                          setUploadTargetGrades(uploadTargetGrades.filter(g => g !== gr));
                        } else {
                          setUploadTargetGrades([...uploadTargetGrades, gr]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        isChecked
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {gr}-сынып
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upload Method Switch */}
            <div className="pt-2">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-semibold text-slate-700">Жүктеу түрі:</span>
                <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`px-3 py-1 rounded-md transition ${
                      uploadMode === 'file' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    HTML файл жүктеу
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('code')}
                    className={`px-3 py-1 rounded-md transition ${
                      uploadMode === 'code' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    HTML кодын қою
                  </button>
                </div>
              </div>

              {uploadMode === 'file' ? (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-blue-500 transition bg-slate-50">
                  <input
                    id="html-file-upload-input"
                    type="file"
                    accept=".html,.htm"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <label htmlFor="html-file-upload-input" className="cursor-pointer block">
                    <UploadCloud className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                    <span className="text-sm font-semibold text-slate-800 block">
                      {selectedFile ? selectedFile.name : 'HTML файлды осы жерге таңдаңыз немесе сүйреп әкеліңіз'}
                    </span>
                    <span className="text-xs text-slate-500 mt-1 block">
                      Қолдау көрсетіледі: .html, .htm (максимум 20 MB)
                    </span>
                  </label>
                </div>
              ) : (
                <div>
                  <textarea
                    id="html-code-paste-input"
                    rows={6}
                    placeholder="<!DOCTYPE html><html><head>...</head><body>...</body></html>"
                    value={pastedHtml}
                    onChange={(e) => handlePastedCodeChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="pt-3">
              <button
                id="submit-upload-game-btn"
                type="submit"
                disabled={isUploading}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Жүктелуде...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Сабақты сайтқа жариялау</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: CATEGORIES & TOPICS MANAGEMENT */}
      {activeTab === 'categories' && (
        <CategoriesManager
          categories={categoriesList}
          games={games}
          onRefreshCategories={onRefreshCategories || fetchData}
          onSelectCategoryFilter={(catName) => {
            setActiveTab('games');
          }}
        />
      )}

      {/* TAB 4: STUDENT RESULTS JOURNAL */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Оқушы аты-жөнін іздеу..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Game filter */}
              <select
                value={selectedGameFilter}
                onChange={(e) => setSelectedGameFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none"
              >
                <option value="">Барлық сабақтар</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>

              {/* Class filter */}
              {uniqueClasses.length > 0 && (
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none"
                >
                  <option value="">Барлық сыныптар</option>
                  {uniqueClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="text-xs text-slate-500 font-semibold">
              Табылды: {filteredAttempts.length} нәтиже
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3.5 px-4">Оқушының аты-жөні</th>
                    <th className="py-3.5 px-4">Сыныбы</th>
                    <th className="py-3.5 px-4">Сабақ атауы</th>
                    <th className="py-3.5 px-4 text-center">Балл (%)</th>
                    <th className="py-3.5 px-4 text-center">Уақыты</th>
                    <th className="py-3.5 px-4 text-center">Қателері</th>
                    <th className="py-3.5 px-4 text-right">Күні</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        Әзірге оқушы нәтижелері тіркелмеген немесе сүзгіге сай келмеді
                      </td>
                    </tr>
                  ) : (
                    filteredAttempts.map((att) => {
                      const mins = Math.floor(att.durationSec / 60);
                      const secs = att.durationSec % 60;
                      const durationStr = mins > 0 ? `${mins}м ${secs}с` : `${secs}с`;

                      return (
                        <tr
                          key={att.id}
                          onClick={() => setSelectedAttemptModal(att)}
                          className="hover:bg-slate-50/80 cursor-pointer transition"
                        >
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {att.studentName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {att.className ? (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                                {att.className}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                            {att.gameTitle}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                att.percentage >= 80
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : att.percentage >= 60
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {att.percentage}% ({att.score}/{att.total})
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-500 text-xs font-mono">
                            {durationStr}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {att.mistakes && att.mistakes.length > 0 ? (
                              <span className="text-xs font-bold text-rose-600 hover:underline">
                                {att.mistakes.length} қате (көру)
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-emerald-600">
                                0 қате ✨
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right text-xs text-slate-400">
                            {new Date(att.createdAt).toLocaleDateString('kk-KZ', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT ATTEMPT MISTAKES INSPECTION MODAL */}
      {selectedAttemptModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedAttemptModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                  {selectedAttemptModal.gameTitle}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {selectedAttemptModal.studentName}
                  {selectedAttemptModal.className && ` (${selectedAttemptModal.className})`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Нәтижесі: <strong>{selectedAttemptModal.percentage}%</strong> ({selectedAttemptModal.score}/{selectedAttemptModal.total}) · Жұмсалған уақыт: {selectedAttemptModal.durationSec} секунд
                </p>
              </div>
              <button
                onClick={() => setSelectedAttemptModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Оқушының жіберген қателері және жауаптары:</span>
              </h4>

              {(!selectedAttemptModal.mistakes || selectedAttemptModal.mistakes.length === 0) ? (
                <div className="p-6 text-center bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-emerald-600" />
                  <p className="font-bold">Мінсіз орындалған!</p>
                  <p className="text-xs text-emerald-700">Бұл әрекетте ешқандай қате тіркелмеген.</p>
                </div>
              ) : (
                selectedAttemptModal.mistakes.map((m: MistakeItem, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-sm">
                    <div className="font-bold text-slate-900">
                      {idx + 1}. {m.question}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                        <span className="font-semibold block text-rose-700">Оқушының жауабы:</span>
                        <span>{m.studentAnswer}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                        <span className="font-semibold block text-emerald-700">Дұрыс жауап:</span>
                        <span className="font-bold">{m.correctAnswer}</span>
                      </div>
                    </div>

                    {m.explanation && (
                      <div className="text-xs text-slate-600 p-2 bg-white rounded border border-slate-200">
                        <strong>Түсіндірме:</strong> {m.explanation}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
