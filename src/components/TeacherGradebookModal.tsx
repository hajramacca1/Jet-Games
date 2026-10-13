import React, { useState, useEffect } from 'react';
import { GameSessionResult } from '../types/game';
import { loadAllGradeRecords, clearAllGradeRecords, downloadGradebookCSV } from '../services/gradebookStorage';
import { exportGradesReportToPDF } from '../services/pdfExport';
import { SUBJECT_METADATA } from '../data/initialQuestions';
import { 
  X, 
  Download, 
  FileText, 
  Trash2, 
  Search, 
  Trophy, 
  GraduationCap, 
  Clock, 
  CheckCircle2, 
  XCircle,
  RefreshCw
} from 'lucide-react';

interface TeacherGradebookModalProps {
  onClose: () => void;
}

export const TeacherGradebookModal: React.FC<TeacherGradebookModalProps> = ({ onClose }) => {
  const [records, setRecords] = useState<GameSessionResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterClass, setFilterClass] = useState('all');

  const refreshRecords = () => {
    setRecords(loadAllGradeRecords());
  };

  useEffect(() => {
    refreshRecords();

    // Listen to real-time events when new student completes a session
    const handleGradeUpdate = () => {
      refreshRecords();
    };

    window.addEventListener('eduflight_grade_saved', handleGradeUpdate);
    return () => {
      window.removeEventListener('eduflight_grade_saved', handleGradeUpdate);
    };
  }, []);

  const handleClear = () => {
    if (window.confirm('Hapus semua riwayat rekap nilai siswa? Tindakan ini tidak dapat dibatalkan.')) {
      clearAllGradeRecords();
      refreshRecords();
    }
  };

  // Filtered records
  const filteredRecords = records.filter((r) => {
    const matchSearch = searchQuery === '' || 
      r.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.playerClass.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubject = filterSubject === 'all' || r.subject === filterSubject;
    const matchClass = filterClass === 'all' || r.playerClass === filterClass;
    return matchSearch && matchSubject && matchClass;
  });

  // Calculate statistics
  const totalSessions = filteredRecords.length;
  const avgAccuracy = totalSessions > 0 
    ? Math.round(filteredRecords.reduce((sum, r) => sum + r.accuracy, 0) / totalSessions) 
    : 0;
  const highestScore = totalSessions > 0 
    ? Math.max(...filteredRecords.map((r) => r.score)) 
    : 0;

  // Unique classes for filter
  const uniqueClasses = Array.from(new Set(records.map((r) => r.playerClass).filter(Boolean)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Rekap Nilai Siswa Real-Time
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold animate-pulse">
                  Live Terhubung
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Penyimpanan otomatis setiap kali siswa menyelesaikan penerbangan evaluasi
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportGradesReportToPDF(filteredRecords)}
              disabled={filteredRecords.length === 0}
              className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              title="Download Rekap Nilai PDF"
            >
              <FileText className="w-4 h-4 text-rose-400" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={() => downloadGradebookCSV(filteredRecords)}
              disabled={filteredRecords.length === 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              title="Download Rekap Nilai Excel / CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Excel/CSV</span>
            </button>

            <button
              onClick={refreshRecords}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleClear}
              disabled={records.length === 0}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors disabled:opacity-50"
              title="Kosongkan Rekap"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Total Sesi Siswa</span>
              <span className="text-lg font-bold text-white tabular-nums">{totalSessions} Sesi</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Rata-rata Ketepatan</span>
              <span className="text-lg font-bold text-emerald-400 tabular-nums">{avgAccuracy}%</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Skor Tertinggi Tercapai</span>
              <span className="text-lg font-bold text-amber-300 tabular-nums">{highestScore} Poin</span>
            </div>
          </div>
        </div>

        {/* Filter Strip */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa atau kelas..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">Semua Mata Pelajaran</option>
            {Object.entries(SUBJECT_METADATA).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          {uniqueClasses.length > 0 && (
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">Semua Kelas</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          )}
        </div>

        {/* Grade Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredRecords.length === 0 ? (
            <div className="py-20 text-center text-slate-500 space-y-2">
              <GraduationCap className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">Belum ada sesi evaluasi siswa yang tersimpan.</p>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Setiap kali siswa menyelesaikan latihan atau evaluasi di EDUFLIGHT 3D, nilainya akan otomatis masuk dan terekam di tabel ini.
              </p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/50">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">Waktu/Tanggal</th>
                    <th className="py-3 px-3">Nama Siswa</th>
                    <th className="py-3 px-3">Kelas</th>
                    <th className="py-3 px-3">Mata Pelajaran</th>
                    <th className="py-3 px-3">Level</th>
                    <th className="py-3 px-3">Mode</th>
                    <th className="py-3 px-3">Jawaban</th>
                    <th className="py-3 px-3">Akurasi</th>
                    <th className="py-3 px-3">Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredRecords.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-400">{rec.date}</td>
                      <td className="py-3 px-3 font-bold text-white">{rec.playerName}</td>
                      <td className="py-3 px-3 text-slate-300">{rec.playerClass}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                          {SUBJECT_METADATA[rec.subject]?.label || rec.subject}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium">Level {rec.levelNumber}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          rec.gameMode === 'latihan' 
                            ? 'bg-sky-950 text-sky-300 border border-sky-800' 
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {rec.gameMode === 'latihan' ? 'Latihan' : 'Evaluasi'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="text-emerald-400">{rec.correctCount}</span> / 
                        <span className="text-rose-400">{rec.wrongCount}</span> ({rec.totalQuestions})
                      </td>
                      <td className="py-3 px-3 font-bold tabular-nums">
                        <span className={rec.accuracy >= 75 ? 'text-emerald-400' : rec.accuracy >= 50 ? 'text-amber-400' : 'text-rose-400'}>
                          {rec.accuracy}%
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-amber-300 tabular-nums">
                        {rec.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
