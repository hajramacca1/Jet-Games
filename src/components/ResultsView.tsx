import React, { useState } from 'react';
import { GameSessionResult, AnswerRecord } from '../types/game';
import { 
  Trophy, 
  RotateCcw, 
  Printer, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Home, 
  Award, 
  Clock, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { exportGradesReportToPDF } from '../services/pdfExport';

interface ResultsViewProps {
  result: GameSessionResult;
  onPlayAgain: () => void;
  onRetryIncorrect: (incorrectRecords: AnswerRecord[]) => void;
  onBackToHome: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  result,
  onPlayAgain,
  onRetryIncorrect,
  onBackToHome,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const incorrectAnswers = result.answers.filter((a) => !a.isCorrect);

  // Download Session CSV
  const handleDownloadCSV = () => {
    const headers = ['Nomor', 'Soal', 'Pilihan Siswa', 'Jawaban Benar', 'Status', 'Waktu (detik)', 'Poin', 'Pembahasan'];
    const rows = result.answers.map((a, idx) => [
      idx + 1,
      `"${a.question.replace(/"/g, '""')}"`,
      `"${a.chosenOptionId}. ${a.chosenOptionText.replace(/"/g, '""')}"`,
      `"${a.correctOptionId}. ${a.correctOptionText.replace(/"/g, '""')}"`,
      a.isCorrect ? 'BENAR' : 'SALAH',
      a.timeSpentSeconds,
      a.pointsEarned,
      `"${a.explanation.replace(/"/g, '""')}"`,
    ]);

    const summaryMeta = [
      ['NAMA SISWA', result.playerName],
      ['KELAS', result.playerClass],
      ['MATA PELAJARAN', result.subject],
      ['SKOR AKHIR', result.score],
      ['AKURASI', `${result.accuracy}%`],
      ['TANGGAL', result.date],
      [''],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      summaryMeta.map(r => r.join(',')).join('\n') + '\n' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `laporan_penerbangan_${result.playerName.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  // Performance Badge
  const getBadge = () => {
    if (result.accuracy >= 90) return { title: 'Penerbang Ulung (Ace Pilot)', color: 'text-amber-400 bg-amber-500/20 border-amber-500/40' };
    if (result.accuracy >= 75) return { title: 'Kapten Penjelajah', color: 'text-sky-400 bg-sky-500/20 border-sky-500/40' };
    if (result.accuracy >= 50) return { title: 'Kadet Berbakat', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40' };
    return { title: 'Penerbang Pemula Semangat', color: 'text-slate-300 bg-slate-800 border-slate-700' };
  };

  const badge = getBadge();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        {/* Printable Official School Header (Visible on print or screen) */}
        <div className="hidden print:block border-b-2 border-black pb-4 text-black text-center">
          <h2 className="text-2xl font-bold uppercase tracking-wider">Laporan Hasil Evaluasi Belajar Interaktif</h2>
          <p className="text-sm">EduFlight 3D — Petualangan Pesawat Pembelajaran</p>
          <div className="flex justify-between text-xs mt-3 text-left">
            <div>
              <p>Nama Siswa: <strong>{result.playerName}</strong></p>
              <p>Kelas: <strong>{result.playerClass}</strong></p>
            </div>
            <div>
              <p>Mata Pelajaran: <strong>{result.subject}</strong></p>
              <p>Tanggal: <strong>{result.date}</strong></p>
            </div>
          </div>
        </div>

        {/* HERO RESULT CARD */}
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shrink-0">
                <Trophy className="w-10 h-10" />
              </div>
              <div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-2 ${badge.color}`}>
                  <Award className="w-3.5 h-3.5" />
                  <span>{badge.title}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                  Misi Selesai, Pilot {result.playerName}!
                </h2>
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                  Kelas {result.playerClass} · Level {result.levelNumber} · {result.date}
                </p>
              </div>
            </div>

            {/* Final Big Score */}
            <div className="text-center md:text-right px-6 py-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Total Skor Penerbangan</span>
              <span className="text-3xl md:text-4xl font-extrabold text-amber-300 tabular-nums">
                {result.score}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                Nilai Skala 100: <strong className="text-white">{result.accuracy}</strong>
              </span>
            </div>
          </div>

          {/* Quick Metrics KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-xs text-slate-400 block">Ketepatan Jawaban</span>
              <span className="text-xl font-bold text-sky-400 tabular-nums">{result.accuracy}%</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-xs text-slate-400 block">Jawaban Benar</span>
              <span className="text-xl font-bold text-emerald-400 tabular-nums">{result.correctCount} Soal</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-xs text-slate-400 block">Jawaban Salah</span>
              <span className="text-xl font-bold text-rose-400 tabular-nums">{result.wrongCount} Soal</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-xs text-slate-400 block">Durasi Terbang</span>
              <span className="text-xl font-bold text-amber-400 tabular-nums">{result.totalDurationSeconds}s</span>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS STRIP */}
        <div className="flex flex-wrap items-center gap-3 no-print">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Main Lagi</span>
          </button>

          {incorrectAnswers.length > 0 && (
            <button
              onClick={() => onRetryIncorrect(incorrectAnswers)}
              className="py-3 px-5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ulangi {incorrectAnswers.length} Soal Salah</span>
            </button>
          )}

          <button
            onClick={() => exportGradesReportToPDF([result])}
            className="py-3 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 font-semibold text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Unduh Laporan Nilai PDF"
          >
            <FileText className="w-4 h-4 text-rose-400" />
            <span>Unduh PDF</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Unduh Data CSV untuk Nilai Guru"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Unduh CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Cetak Laporan Penilaian"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>Cetak Hasil</span>
          </button>

          <button
            onClick={onBackToHome}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>

        {/* DETAILED ANSWER AUDIT & LEARNING EXPLANATION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-lg font-bold text-white">Rincian Jawaban & Pembahasan</h3>
            <span className="text-xs text-slate-400">{result.answers.length} Soal Terjawab</span>
          </div>

          <div className="space-y-3">
            {result.answers.map((ans, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-colors overflow-hidden ${
                    ans.isCorrect
                      ? 'bg-slate-900/60 border-slate-800'
                      : 'bg-slate-900/80 border-rose-900/40'
                  }`}
                >
                  <div
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/30"
                  >
                    <div className="flex items-center gap-3">
                      {ans.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs text-slate-500 font-mono">Soal #{idx + 1}</span>
                        <p className="text-sm font-semibold text-white line-clamp-1">{ans.question}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-bold ${ans.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {ans.isCorrect ? `+${ans.pointsEarned} Poin` : '0 Poin'}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded Explanation */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                          <span className="text-slate-400 block mb-0.5">Pilihan Anda:</span>
                          <span className={ans.isCorrect ? 'text-emerald-300 font-semibold' : 'text-rose-300 font-semibold'}>
                            {ans.chosenOptionId}. {ans.chosenOptionText}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-600/30">
                          <span className="text-emerald-400 block mb-0.5">Kunci Jawaban:</span>
                          <span className="text-emerald-200 font-semibold">
                            {ans.correctOptionId}. {ans.correctOptionText}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                        <span className="font-semibold text-sky-400 block mb-1">Pembahasan:</span>
                        <p className="text-slate-300 leading-relaxed">{ans.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
