import React from 'react';
import { 
  LevelInfo, 
  SubjectKey, 
  GameSettings, 
  GameMode 
} from '../types/game';
import { SUBJECT_METADATA } from '../data/initialQuestions';
import { 
  Play, 
  Settings, 
  BookOpen, 
  HelpCircle, 
  Layers, 
  Trophy, 
  User, 
  Gauge, 
  Tv, 
  Volume2, 
  VolumeX, 
  Compass,
  FileSpreadsheet,
  GraduationCap
} from 'lucide-react';

interface HomeViewProps {
  levels: LevelInfo[];
  currentLevelIndex: number;
  onSelectLevel: (index: number) => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onStartGame: () => void;
  onOpenSettings: () => void;
  onOpenInstructions: () => void;
  onOpenQuestionBank: () => void;
  onOpenGradebook: () => void;
  highScore: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  levels,
  currentLevelIndex,
  onSelectLevel,
  settings,
  onUpdateSettings,
  onStartGame,
  onOpenSettings,
  onOpenInstructions,
  onOpenQuestionBank,
  onOpenGradebook,
  highScore,
}) => {
  const currentLevel = levels[currentLevelIndex] || levels[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-black text-xl">
              ✈️
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                EDUFLIGHT 3D
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  IFP & Web Ready
                </span>
              </h1>
              <p className="text-xs text-slate-400">Petualangan Pesawat Pembelajaran Interaktif</p>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={onOpenInstructions}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Petunjuk</span>
            </button>

            <button
              onClick={onOpenQuestionBank}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:text-white bg-amber-950/40 hover:bg-amber-900/50 border border-amber-600/40 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>Bank Soal (Guru)</span>
            </button>

            <button
              onClick={onOpenGradebook}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/40 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>Rekap Nilai (Live)</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 md:px-3 md:py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors flex items-center gap-1.5"
              title="Pengaturan"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Pengaturan</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col gap-8">
        {/* Hero Section Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Player Config & Start Game CTA */}
          <div className="lg:col-span-7 flex flex-col justify-between p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden">
            {/* Background Accent Glow */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Badge & Title */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-2">
                  <Compass className="w-4 h-4" />
                  <span>Siap Menjelajahi Angkasa Pengetahuan</span>
                  <span>·</span>
                  <span className="text-amber-400 font-bold">Skor Terbaik: {highScore} Poin</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-snug">
                  Kendalikan Pesawat 3D, Terobos Gerbang Jawaban Benar!
                </h2>
                <p className="text-slate-400 text-sm md:text-base mt-2 leading-relaxed">
                  Dirancang khusus untuk layar sentuh Interaktif (IFP Papan Tulis Kelas), laptop, Chromebook, dan tablet. Rasakan sensasi navigasi pesawat nyata sambil mengasah kemampuan berpikir kritis.
                </p>
              </div>

              {/* Player Identity inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    Nama Pilot / Siswa
                  </label>
                  <input
                    type="text"
                    value={settings.playerName}
                    onChange={(e) => onUpdateSettings({ playerName: e.target.value })}
                    placeholder="Contoh: Ahmad Fauzan"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    Kelas / Jenjang
                  </label>
                  <input
                    type="text"
                    value={settings.playerClass}
                    onChange={(e) => onUpdateSettings({ playerClass: e.target.value })}
                    placeholder="Contoh: Kelas 7 SMP / 5 SD"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              {/* Game Mode Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Pilih Mode Permainan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onUpdateSettings({ gameMode: 'latihan' })}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      settings.gameMode === 'latihan'
                        ? 'bg-sky-600/20 border-sky-500 text-white shadow-md shadow-sky-500/10'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-sm text-sky-300 flex items-center gap-1.5">
                      <span>Mode Latihan</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Nyawa tak terbatas & pembahasan langsung setelah melewati gerbang.
                    </p>
                  </button>

                  <button
                    onClick={() => onUpdateSettings({ gameMode: 'evaluasi' })}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      settings.gameMode === 'evaluasi'
                        ? 'bg-rose-600/20 border-rose-500 text-white shadow-md shadow-rose-500/10'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-sm text-rose-300 flex items-center gap-1.5">
                      <span>Mode Evaluasi (Ujian)</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      3 Nyawa hati & pembahasan lengkap tersedia di akhir sesi.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* Launch Game Button */}
            <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center gap-4">
              <button
                onClick={onStartGame}
                className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-[0.99] font-extrabold text-white text-base md:text-lg flex items-center justify-center gap-3 shadow-xl shadow-sky-600/30 transition-all cursor-pointer"
              >
                <Play className="w-6 h-6 fill-white" />
                <span>Mulai Terbang Sekarang</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Graphic Preview & Level Showcase */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Visual Cover Card */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 group aspect-video sm:aspect-[16/10] lg:h-72 shadow-xl">
              <img
                src="/src/assets/images/eduflight_hero_banner_1791853339169.jpg"
                alt="EduFlight 3D Preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-5 flex flex-col justify-end">
                <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                  Level Aktif #{currentLevel.levelNumber}
                </span>
                <h3 className="text-lg md:text-xl font-bold text-white">
                  {currentLevel.title}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {currentLevel.subtitle}
                </p>
              </div>
            </div>

            {/* IFP & Classroom Features Highlight */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-slate-400">Keunggulan Perangkat & IFP:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2">
                  <Tv className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Dukungan Layar Penuh IFP</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Kontrol Sentuh & Keyboard</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: SUBJECT SELECTOR */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">Pilih Mata Pelajaran</h3>
              <p className="text-xs text-slate-400">Pilih materi yang ingin dipelajari dalam petualangan penerbangan ini</p>
            </div>
            <span className="text-xs text-slate-500 font-medium">8 Disiplin Ilmu</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Object.entries(SUBJECT_METADATA).map(([key, meta]) => {
              const isSelected = settings.selectedSubject === key;
              return (
                <button
                  key={key}
                  onClick={() => onUpdateSettings({ selectedSubject: key as SubjectKey | 'all' })}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                    isSelected
                      ? 'bg-sky-600/20 border-sky-400 shadow-lg shadow-sky-500/10'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${meta.color} flex items-center justify-center text-white mb-2 shadow`}>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h4 className={`text-xs md:text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {meta.label}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {meta.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: 5 LEVEL EXPEDITIONS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">Pilih Level & Lingkungan 3D</h3>
              <p className="text-xs text-slate-400">Setiap level memiliki atmosfer 3D, kecepatan, dan variasi rute yang berbeda</p>
            </div>
            <span className="text-xs text-sky-400 font-semibold">5 Ekspedisi Penerbangan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {levels.map((lvl, idx) => {
              const isSelected = currentLevelIndex === idx;
              return (
                <button
                  key={lvl.levelNumber}
                  onClick={() => onSelectLevel(idx)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-950/60 border-sky-400 shadow-xl shadow-sky-500/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-800 text-sky-300">
                      Level {lvl.levelNumber}
                    </span>
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </div>
                  <h4 className="font-bold text-sm text-white">{lvl.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {lvl.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <p>EDUFLIGHT 3D · Game Interaktif Pembelajaran Sekolah & Interactive Flat Panel</p>
      </footer>
    </div>
  );
};
