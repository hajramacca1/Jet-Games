import React, { useState } from 'react';
import { Question, SubjectKey, GradeLevel, DifficultyLevel } from '../types/game';
import { SUBJECT_METADATA, INITIAL_QUESTIONS } from '../data/initialQuestions';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  RotateCcw, 
  Search, 
  Check, 
  BookOpen,
  AlertCircle,
  FileText
} from 'lucide-react';
import { exportQuestionsToPDF } from '../services/pdfExport';

interface QuestionBankModalProps {
  questions: Question[];
  onSaveQuestions: (updated: Question[]) => void;
  onClose: () => void;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  questions,
  onSaveQuestions,
  onClose,
}) => {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit / Add Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Filtered list
  const filteredQuestions = questions.filter((q) => {
    const matchSubject = selectedSubjectFilter === 'all' || q.subject === selectedSubjectFilter;
    const matchGrade = selectedGradeFilter === 'all' || q.grade === selectedGradeFilter;
    const matchSearch = searchQuery === '' || 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSubject && matchGrade && matchSearch;
  });

  const handleStartCreate = () => {
    const newQ: Question = {
      id: `soal-${Date.now()}`,
      subject: (selectedSubjectFilter !== 'all' ? selectedSubjectFilter : 'matematika') as SubjectKey,
      grade: 'SMP',
      classLevel: 'Kelas 7',
      topic: 'Topik Baru',
      competency: 'Tujuan pembelajaran',
      question: '',
      options: [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' },
      ],
      correctAnswerId: 'A',
      explanation: '',
      difficulty: 'sedang',
      cognitiveLevel: 'C2-Memahami',
      points: 100,
    };
    setEditingQuestion(newQ);
    setIsEditing(true);
  };

  const handleStartEdit = (q: Question) => {
    setEditingQuestion(JSON.parse(JSON.stringify(q)));
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus soal ini dari bank soal?')) {
      const updated = questions.filter((q) => q.id !== id);
      onSaveQuestions(updated);
    }
  };

  const handleSaveQuestionForm = () => {
    if (!editingQuestion) return;
    if (!editingQuestion.question.trim()) {
      alert('Teks pertanyaan tidak boleh kosong!');
      return;
    }
    const hasEmptyOption = editingQuestion.options.some((o) => !o.text.trim());
    if (hasEmptyOption) {
      alert('Semua pilihan jawaban harus diisi!');
      return;
    }

    const existingIndex = questions.findIndex((q) => q.id === editingQuestion.id);
    let updated: Question[];
    if (existingIndex >= 0) {
      updated = [...questions];
      updated[existingIndex] = editingQuestion;
    } else {
      updated = [editingQuestion, ...questions];
    }

    onSaveQuestions(updated);
    setIsEditing(false);
    setEditingQuestion(null);
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bank_soal_eduflight_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Mata Pelajaran', 'Jenjang', 'Kelas', 'Topik', 'Pertanyaan', 'Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D', 'Kunci', 'Pembahasan', 'Poin'];
    const rows = questions.map((q) => [
      q.id,
      q.subject,
      q.grade,
      q.classLevel,
      `"${q.topic.replace(/"/g, '""')}"`,
      `"${q.question.replace(/"/g, '""')}"`,
      `"${(q.options[0]?.text || '').replace(/"/g, '""')}"`,
      `"${(q.options[1]?.text || '').replace(/"/g, '""')}"`,
      `"${(q.options[2]?.text || '').replace(/"/g, '""')}"`,
      `"${(q.options[3]?.text || '').replace(/"/g, '""')}"`,
      q.correctAnswerId,
      `"${q.explanation.replace(/"/g, '""')}"`,
      q.points,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `bank_soal_eduflight_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].question && parsed[0].options) {
          onSaveQuestions(parsed);
          setImportStatus(`Berhasil mengimpor ${parsed.length} soal!`);
        } else {
          setImportStatus('Format JSON tidak valid atau struktur soal tidak sesuai.');
        }
      } catch {
        setImportStatus('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan bank soal ke kumpulan soal awal sistem? Perubahan buatan sendiri akan digantikan.')) {
      onSaveQuestions(INITIAL_QUESTIONS);
      setImportStatus('Bank soal dikembalikan ke setelan default.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Bank Soal Guru & Kurikulum</h3>
              <p className="text-xs text-slate-400">Total {questions.length} soal tersedia dalam database</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportQuestionsToPDF(filteredQuestions, selectedSubjectFilter, selectedGradeFilter)}
              className="px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-600/40 hover:bg-rose-900/60 text-xs font-semibold text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Cetak dan Ekspor Soal ke PDF"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>Ekspor PDF</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Unduh JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor JSON</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Unduh CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
            <label className="px-3 py-1.5 rounded-lg bg-sky-950/60 border border-sky-600/40 hover:bg-sky-900/60 text-xs font-semibold text-sky-300 flex items-center gap-1.5 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Impor Soal</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Import Notification Banner */}
        {importStatus && (
          <div className="px-5 py-2.5 bg-sky-950/40 border-b border-sky-800/40 text-xs text-sky-300 flex items-center justify-between">
            <span>{importStatus}</span>
            <button onClick={() => setImportStatus(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Question List */}
          {!isEditing ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Filter Strip */}
              <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari materi soal atau topik..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <select
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="all">Semua Mata Pelajaran</option>
                  {Object.entries(SUBJECT_METADATA).filter(([k]) => k !== 'all').map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>

                <select
                  value={selectedGradeFilter}
                  onChange={(e) => setSelectedGradeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="all">Semua Jenjang</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                </select>

                <button
                  onClick={handleStartCreate}
                  className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-xs text-white flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Soal Baru</span>
                </button>

                <button
                  onClick={handleResetToDefault}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Reset ke Default"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Questions List scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredQuestions.length === 0 ? (
                  <div className="py-16 text-center text-slate-500">
                    <p className="text-sm">Tidak ada soal yang sesuai dengan filter pencarian.</p>
                  </div>
                ) : (
                  filteredQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sky-400">#{idx + 1}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium uppercase">
                            {SUBJECT_METADATA[q.subject]?.label || q.subject}
                          </span>
                          <span className="text-slate-400">· {q.classLevel}</span>
                          <span className="text-slate-400">· {q.topic}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleStartEdit(q)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            title="Edit Soal"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 transition-colors"
                            title="Hapus Soal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className={`font-semibold text-white text-sm ${q.isArabic ? 'font-arabic text-base text-right' : ''}`}>
                        {q.question}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {q.options.map((opt) => (
                          <div
                            key={opt.id}
                            className={`p-2 rounded-lg border flex items-center gap-2 ${
                              opt.id === q.correctAnswerId
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 font-bold'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span className="w-5 h-5 rounded bg-white/10 flex items-center justify-center shrink-0">
                              {opt.id}
                            </span>
                            <span className="truncate">{opt.text}</span>
                          </div>
                        ))}
                      </div>

                      <p className="text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">Pembahasan: </span>
                        {q.explanation}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Question Add/Edit Form */
            editingQuestion && (
              <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="font-bold text-white text-base">
                    {questions.some((q) => q.id === editingQuestion.id) ? 'Edit Soal' : 'Tambah Soal Baru'}
                  </h4>
                  <button
                    onClick={() => { setIsEditing(false); setEditingQuestion(null); }}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Batal
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Mata Pelajaran</label>
                    <select
                      value={editingQuestion.subject}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, subject: e.target.value as SubjectKey })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    >
                      {Object.entries(SUBJECT_METADATA).filter(([k]) => k !== 'all').map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Jenjang</label>
                    <select
                      value={editingQuestion.grade}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, grade: e.target.value as GradeLevel })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    >
                      <option value="SD">SD</option>
                      <option value="SMP">SMP</option>
                      <option value="SMA">SMA</option>
                      <option value="Umum">Umum</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Kelas</label>
                    <input
                      type="text"
                      value={editingQuestion.classLevel}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, classLevel: e.target.value })}
                      placeholder="Contoh: Kelas 7"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Topik Pembelajaran</label>
                    <input
                      type="text"
                      value={editingQuestion.topic}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, topic: e.target.value })}
                      placeholder="Contoh: Operasi Pecahan Aljabar"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Capaian / Kompetensi</label>
                    <input
                      type="text"
                      value={editingQuestion.competency}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, competency: e.target.value })}
                      placeholder="Tujuan pembelajaran yang diukur"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-400">Pertanyaan</label>
                    <label className="flex items-center gap-1.5 text-xs text-sky-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingQuestion.isArabic || false}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, isArabic: e.target.checked })}
                        className="accent-sky-500 rounded"
                      />
                      <span>Gunakan Teks Arab / Font Kaligrafi</span>
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={editingQuestion.question}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                    placeholder="Tuliskan soal di sini..."
                    className={`w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500 ${
                      editingQuestion.isArabic ? 'font-arabic text-lg text-right' : ''
                    }`}
                  />
                </div>

                {/* Options A, B, C, D */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Pilihan Jawaban & Kunci</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {editingQuestion.options.map((opt, idx) => (
                      <div key={opt.id} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-sky-300">Pilihan {opt.id}</span>
                          <label className="flex items-center gap-1.5 text-xs text-emerald-400 cursor-pointer">
                            <input
                              type="radio"
                              name="correctAnswer"
                              checked={editingQuestion.correctAnswerId === opt.id}
                              onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswerId: opt.id })}
                              className="accent-emerald-500"
                            />
                            <span>Kunci Jawaban</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const newOptions = [...editingQuestion.options];
                            newOptions[idx] = { ...opt, text: e.target.value };
                            setEditingQuestion({ ...editingQuestion, options: newOptions });
                          }}
                          placeholder={`Jawaban ${opt.id}`}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Pembahasan Edukatif</label>
                  <textarea
                    rows={2}
                    value={editingQuestion.explanation}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                    placeholder="Jelaskan alasan mengapa jawaban tersebut benar untuk memandu siswa..."
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    onClick={() => { setIsEditing(false); setEditingQuestion(null); }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveQuestionForm}
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-xs text-white flex items-center gap-1.5 shadow-lg"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Soal</span>
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
