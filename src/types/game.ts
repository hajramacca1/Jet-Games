export type SubjectKey = 
  | 'matematika'
  | 'pai'
  | 'ipa'
  | 'ips'
  | 'bahasa_indonesia'
  | 'bahasa_inggris'
  | 'informatika'
  | 'ppkn';

export type GradeLevel = 'SD' | 'SMP' | 'SMA' | 'Umum';

export type DifficultyLevel = 'mudah' | 'sedang' | 'sulit';

export type CognitiveLevel = 'C1-Mengingat' | 'C2-Memahami' | 'C3-Menerapkan' | 'C4-Menganalisis' | 'C5-Mengevaluasi';

export interface QuestionOption {
  id: string; // e.g. 'A', 'B', 'C', 'D'
  text: string;
  isArabic?: boolean;
}

export interface Question {
  id: string;
  subject: SubjectKey;
  grade: GradeLevel;
  classLevel: string; // e.g. "Kelas 4", "Kelas 7", "Kelas 10"
  topic: string;
  competency: string; // Tujuan pembelajaran / capaian
  question: string;
  isArabic?: boolean; // For RTL and Amiri font styling
  options: QuestionOption[];
  correctAnswerId: string; // e.g. 'B'
  explanation: string;
  difficulty: DifficultyLevel;
  cognitiveLevel: CognitiveLevel;
  points: number;
}

export type GameMode = 'latihan' | 'evaluasi';

export interface GameSettings {
  playerName: string;
  playerClass: string;
  selectedSubject: SubjectKey | 'all';
  selectedGrade: GradeLevel | 'all';
  gameMode: GameMode;
  flightSpeed: 'santai' | 'normal' | 'cepat'; // 18, 26, 36 units/sec
  numberOfOptions: 2 | 3 | 4 | 5 | 6; // default 4
  bgmVolume: number; // 0 to 1
  sfxVolume: number; // 0 to 1
  engineVolume: number; // 0 to 1
  isMuted: boolean;
  showDebug: boolean;
  enableTilt: boolean;
  ifpTouchMode: boolean; // extra large touch buttons for interactive flat panels
  highContrast: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}

export interface LevelInfo {
  levelNumber: number;
  title: string;
  subtitle: string;
  theme: 'langit_cerah' | 'kepulauan_tropis' | 'lembah_senja' | 'malam_aurora' | 'kosmik_antariksa';
  skyColor: number;
  fogColor: number;
  targetScore: number;
  unlocked: boolean;
}

export interface AnswerRecord {
  questionId: string;
  question: string;
  chosenOptionId: string;
  chosenOptionText: string;
  correctOptionId: string;
  correctOptionText: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  explanation: string;
  subject: SubjectKey;
  topic: string;
  pointsEarned: number;
}

export interface GameSessionResult {
  playerName: string;
  playerClass: string;
  subject: string;
  levelNumber: number;
  score: number;
  maxScore: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  totalDurationSeconds: number;
  date: string;
  gameMode: GameMode;
  answers: AnswerRecord[];
}
