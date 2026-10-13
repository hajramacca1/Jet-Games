import { GameSessionResult } from '../types/game';
import { SUBJECT_METADATA } from '../data/initialQuestions';

const GRADEBOOK_STORAGE_KEY = 'eduflight_student_gradebook_v1';

export function saveGradeRecord(result: GameSessionResult): void {
  try {
    const existing = loadAllGradeRecords();
    const updated = [result, ...existing];
    localStorage.setItem(GRADEBOOK_STORAGE_KEY, JSON.stringify(updated));
    // Trigger custom event so any open UI updates immediately in real-time
    window.dispatchEvent(new CustomEvent('eduflight_grade_saved', { detail: result }));
  } catch {
    // Ignore storage errors
  }
}

export function loadAllGradeRecords(): GameSessionResult[] {
  try {
    const raw = localStorage.getItem(GRADEBOOK_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function clearAllGradeRecords(): void {
  try {
    localStorage.removeItem(GRADEBOOK_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('eduflight_grade_saved'));
  } catch {
    // Ignore
  }
}

export function downloadGradebookCSV(records: GameSessionResult[]): void {
  const headers = [
    'No',
    'Tanggal',
    'Nama Siswa',
    'Kelas',
    'Mata Pelajaran',
    'Level',
    'Mode Permainan',
    'Jawaban Benar',
    'Jawaban Salah',
    'Total Soal',
    'Akurasi (%)',
    'Total Skor',
    'Durasi (Detik)',
  ];

  const rows = records.map((r, idx) => [
    idx + 1,
    `"${r.date.replace(/"/g, '""')}"`,
    `"${r.playerName.replace(/"/g, '""')}"`,
    `"${r.playerClass.replace(/"/g, '""')}"`,
    `"${(SUBJECT_METADATA[r.subject]?.label || r.subject).replace(/"/g, '""')}"`,
    r.levelNumber,
    r.gameMode === 'latihan' ? 'Latihan' : 'Evaluasi',
    r.correctCount,
    r.wrongCount,
    r.totalQuestions,
    `${r.accuracy}%`,
    r.score,
    r.totalDurationSeconds,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
    [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `rekap_nilai_siswa_eduflight_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
