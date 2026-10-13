import React, { useState, useEffect } from 'react';
import { 
  Question, 
  GameSettings, 
  LevelInfo, 
  GameSessionResult, 
  AnswerRecord 
} from './types/game';
import { INITIAL_QUESTIONS } from './data/initialQuestions';
import { HomeView } from './components/HomeView';
import { ThreeFlightGame } from './components/ThreeFlightGame';
import { ResultsView } from './components/ResultsView';
import { GameSettingsModal } from './components/GameSettingsModal';
import { InstructionsModal } from './components/InstructionsModal';
import { QuestionBankModal } from './components/QuestionBankModal';
import { TeacherGradebookModal } from './components/TeacherGradebookModal';
import { saveGradeRecord } from './services/gradebookStorage';

const DEFAULT_SETTINGS: GameSettings = {
  playerName: 'Siswa Penerbang',
  playerClass: 'Kelas 7 SMP',
  selectedSubject: 'all',
  selectedGrade: 'all',
  gameMode: 'latihan',
  flightSpeed: 'normal',
  numberOfOptions: 4,
  bgmVolume: 0.5,
  sfxVolume: 0.7,
  engineVolume: 0.3,
  isMuted: false,
  showDebug: false,
  enableTilt: true,
  ifpTouchMode: true,
  highContrast: false,
  shuffleQuestions: true,
  shuffleOptions: false,
};

const LEVELS: LevelInfo[] = [
  {
    levelNumber: 1,
    title: 'Langit Cerah Pemula',
    subtitle: 'Mengenal rute terbang & gerbang navigasi dasar',
    theme: 'langit_cerah',
    skyColor: 0x38BDF8,
    fogColor: 0xBAE6FD,
    targetScore: 300,
    unlocked: true,
  },
  {
    levelNumber: 2,
    title: 'Kepulauan Tropis & Samudra',
    subtitle: 'Menembus angin sepoi di atas pulau karang',
    theme: 'kepulauan_tropis',
    skyColor: 0x0284C7,
    fogColor: 0x7DD3FC,
    targetScore: 400,
    unlocked: true,
  },
  {
    levelNumber: 3,
    title: 'Lembah Pengetahuan Senja',
    subtitle: 'Tantangan kecepatan melintasi ngarai emas',
    theme: 'lembah_senja',
    skyColor: 0xC2410C,
    fogColor: 0xFDBA74,
    targetScore: 500,
    unlocked: true,
  },
  {
    levelNumber: 4,
    title: 'Malam Aurora & Bintang',
    subtitle: 'Menganalisis soal di bawah taburan cahaya kutub',
    theme: 'malam_aurora',
    skyColor: 0x0F172A,
    fogColor: 0x1E293B,
    targetScore: 600,
    unlocked: true,
  },
  {
    levelNumber: 5,
    title: 'Misi Kosmik Antariksa',
    subtitle: 'Ujian penalaran tertinggi di orbit kosmos',
    theme: 'kosmik_antariksa',
    skyColor: 0x050816,
    fogColor: 0x0F172A,
    targetScore: 800,
    unlocked: true,
  },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'playing' | 'results'>('home');
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [showGradebook, setShowGradebook] = useState(false);

  // Settings
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('eduflight_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Questions Database
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem('eduflight_questions');
      return saved ? JSON.parse(saved) : INITIAL_QUESTIONS;
    } catch {
      return INITIAL_QUESTIONS;
    }
  });

  // Active game session questions (filtered for current run)
  const [activeSessionQuestions, setActiveSessionQuestions] = useState<Question[]>([]);
  const [sessionResult, setSessionResult] = useState<GameSessionResult | null>(null);

  // Load high score
  useEffect(() => {
    try {
      const savedHighScore = localStorage.getItem('eduflight_highscore');
      if (savedHighScore) setHighScore(parseInt(savedHighScore, 10));
    } catch {
      // Ignore
    }
  }, []);

  // Save settings
  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('eduflight_settings', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  // Save questions from Teacher Question Bank
  const handleSaveQuestions = (updated: Question[]) => {
    setQuestions(updated);
    try {
      localStorage.setItem('eduflight_questions', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  // Start game with filtered questions
  const handleStartGame = () => {
    let pool = questions;

    // Filter by subject if selected
    if (settings.selectedSubject !== 'all') {
      pool = pool.filter((q) => q.subject === settings.selectedSubject);
    }

    // Filter by grade if selected
    if (settings.selectedGrade !== 'all') {
      const filteredByGrade = pool.filter((q) => q.grade === settings.selectedGrade);
      if (filteredByGrade.length >= 3) {
        pool = filteredByGrade;
      }
    }

    // Fallback if not enough questions match filter
    if (pool.length === 0) {
      pool = questions;
    }

    // Optionally slice or shuffle
    let sessionPool = [...pool];
    if (settings.shuffleQuestions) {
      sessionPool.sort(() => Math.random() - 0.5);
    }

    // Take 6 questions per session
    sessionPool = sessionPool.slice(0, 6);

    // Limit or expand options count to match settings.numberOfOptions (2 to 6)
    const formattedPool = sessionPool.map((q) => {
      const targetOptionCount = settings.numberOfOptions;
      if (q.options.length === targetOptionCount) return q;

      // If needs more or fewer, adapt cleanly
      let opts = [...q.options];
      const correctOpt = opts.find((o) => o.id === q.correctAnswerId) || opts[0];

      if (opts.length > targetOptionCount) {
        // Keep correct answer and take remaining
        const distractors = opts.filter((o) => o.id !== correctOpt.id).slice(0, targetOptionCount - 1);
        opts = [correctOpt, ...distractors].sort((a, b) => a.id.localeCompare(b.id));
      }

      return {
        ...q,
        options: opts,
      };
    });

    setActiveSessionQuestions(formattedPool);
    setCurrentScreen('playing');
  };

  // Handle Game Over
  const handleGameOver = (result: GameSessionResult) => {
    setSessionResult(result);
    // Real-time student grade persistence
    saveGradeRecord(result);

    if (result.score > highScore) {
      setHighScore(result.score);
      try {
        localStorage.setItem('eduflight_highscore', result.score.toString());
      } catch {
        // Ignore
      }
    }
    setCurrentScreen('results');
  };

  // Re-test incorrect questions
  const handleRetryIncorrect = (incorrectRecords: AnswerRecord[]) => {
    const incorrectIds = new Set(incorrectRecords.map((r) => r.questionId));
    const matchingQuestions = questions.filter((q) => incorrectIds.has(q.id));

    if (matchingQuestions.length > 0) {
      setActiveSessionQuestions(matchingQuestions);
      setCurrentScreen('playing');
    } else {
      handleStartGame();
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 font-sans">
      {/* SCREEN 1: HOME VIEW */}
      {currentScreen === 'home' && (
        <HomeView
          levels={LEVELS}
          currentLevelIndex={currentLevelIndex}
          onSelectLevel={setCurrentLevelIndex}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onStartGame={handleStartGame}
          onOpenSettings={() => setShowSettings(true)}
          onOpenInstructions={() => setShowInstructions(true)}
          onOpenQuestionBank={() => setShowQuestionBank(true)}
          onOpenGradebook={() => setShowGradebook(true)}
          highScore={highScore}
        />
      )}

      {/* SCREEN 2: 3D PLAYING VIEW */}
      {currentScreen === 'playing' && (
        <ThreeFlightGame
          questions={activeSessionQuestions}
          settings={settings}
          levelInfo={LEVELS[currentLevelIndex] || LEVELS[0]}
          onGameOver={handleGameOver}
          onExit={() => setCurrentScreen('home')}
        />
      )}

      {/* SCREEN 3: RESULTS VIEW */}
      {currentScreen === 'results' && sessionResult && (
        <ResultsView
          result={sessionResult}
          onPlayAgain={handleStartGame}
          onRetryIncorrect={handleRetryIncorrect}
          onBackToHome={() => setCurrentScreen('home')}
        />
      )}

      {/* MODALS */}
      {showSettings && (
        <GameSettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showInstructions && (
        <InstructionsModal
          onClose={() => setShowInstructions(false)}
        />
      )}

      {showQuestionBank && (
        <QuestionBankModal
          questions={questions}
          onSaveQuestions={handleSaveQuestions}
          onClose={() => setShowQuestionBank(false)}
        />
      )}

      {showGradebook && (
        <TeacherGradebookModal
          onClose={() => setShowGradebook(false)}
        />
      )}
    </div>
  );
}
