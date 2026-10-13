import { jsPDF } from 'jspdf';
import { Question, GameSessionResult } from '../types/game';
import { SUBJECT_METADATA } from '../data/initialQuestions';

/**
 * Generate formatted PDF for question banks
 */
export function exportQuestionsToPDF(questions: Question[], filterSubject = 'all', filterGrade = 'all') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 18;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('BANK SOAL PEMBELAJARAN INTERAKTIF', pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;

  doc.setFontSize(12);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text('EDUFLIGHT 3D — Petualangan Pesawat Pembelajaran', pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  // Metadata strip
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600

  const subjectLabel = filterSubject === 'all' ? 'Semua Mata Pelajaran' : (SUBJECT_METADATA[filterSubject]?.label || filterSubject);
  const gradeLabel = filterGrade === 'all' ? 'Semua Jenjang' : filterGrade;
  const dateStr = new Date().toLocaleDateString('id-ID', { dateStyle: 'long' });

  doc.text(`Mata Pelajaran: ${subjectLabel}`, 14, currentY);
  doc.text(`Jenjang: ${gradeLabel}`, pageWidth / 2, currentY, { align: 'center' });
  doc.text(`Tanggal Cetak: ${dateStr}`, pageWidth - 14, currentY, { align: 'right' });
  currentY += 4;
  doc.text(`Total Soal: ${questions.length} Butir`, 14, currentY);
  currentY += 8;

  doc.line(14, currentY - 2, pageWidth - 14, currentY - 2);

  // Questions loop
  questions.forEach((q, idx) => {
    // Check if new page needed
    if (currentY > 260) {
      doc.addPage();
      currentY = 18;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);

    const questionTitle = `${idx + 1}. [${q.classLevel} - ${q.topic}] ${q.question}`;
    const splitTitle = doc.splitTextToSize(questionTitle, pageWidth - 28);
    doc.text(splitTitle, 14, currentY);
    currentY += splitTitle.length * 5 + 2;

    // Options
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    q.options.forEach((opt) => {
      if (currentY > 275) {
        doc.addPage();
        currentY = 18;
      }
      const isKey = opt.id === q.correctAnswerId ? ' (Kunci)' : '';
      const optText = `   ${opt.id}. ${opt.text}${isKey}`;
      const splitOpt = doc.splitTextToSize(optText, pageWidth - 32);
      doc.text(splitOpt, 16, currentY);
      currentY += splitOpt.length * 4.5;
    });

    // Explanation
    if (q.explanation) {
      if (currentY > 275) {
        doc.addPage();
        currentY = 18;
      }
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      const expText = `   Pembahasan: ${q.explanation}`;
      const splitExp = doc.splitTextToSize(expText, pageWidth - 32);
      doc.text(splitExp, 16, currentY);
      currentY += splitExp.length * 4.2;
    }

    currentY += 5; // spacing between questions
  });

  // Footer page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Halaman ${i} dari ${pageCount} — Dokumen EduFlight 3D Guru`, pageWidth / 2, 290, { align: 'center' });
  }

  doc.save(`bank_soal_eduflight_${filterSubject}_${Date.now()}.pdf`);
}

/**
 * Generate formatted PDF for Teacher Classroom Gradebook (Rekap Nilai Siswa)
 */
export function exportGradesReportToPDF(records: GameSessionResult[]) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 18;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('REKAPITULASI HASIL EVALUASI SISWA REAL-TIME', pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;

  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text('EDUFLIGHT 3D — Laporan Capaian Belajar Interaktif Papan Tulis / IFP', pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const dateStr = new Date().toLocaleDateString('id-ID', { dateStyle: 'full' });
  doc.text(`Tanggal Cetak: ${dateStr}`, 14, currentY);
  doc.text(`Total Sesi Siswa Tercatat: ${records.length} Sesi`, pageWidth - 14, currentY, { align: 'right' });
  currentY += 7;

  // Table Columns
  // [No, Tanggal, Nama Siswa, Kelas, Mata Pelajaran, Level, Mode, Benar/Total, Skor, Akurasi (%)]
  const colX = [14, 24, 52, 98, 126, 160, 180, 204, 228, 252];
  const colHeaders = ['No', 'Tanggal', 'Nama Siswa', 'Kelas', 'Mata Pelajaran', 'Level', 'Mode', 'Benar', 'Skor', 'Akurasi'];

  // Header background
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(14, currentY, pageWidth - 28, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  colHeaders.forEach((h, i) => {
    doc.text(h, colX[i], currentY + 4.8);
  });
  currentY += 9;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  records.forEach((rec, idx) => {
    if (currentY > 185) {
      doc.addPage();
      currentY = 18;

      // Repeat table header on new page
      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY, pageWidth - 28, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      colHeaders.forEach((h, i) => {
        doc.text(h, colX[i], currentY + 4.8);
      });
      currentY += 9;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    // Row alternating background
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(14, currentY - 1, pageWidth - 28, 6.5, 'F');
    }

    doc.setTextColor(51, 65, 85);
    doc.text((idx + 1).toString(), colX[0], currentY + 3.5);
    doc.text(rec.date.split(',')[0] || rec.date, colX[1], currentY + 3.5);
    doc.text(doc.splitTextToSize(rec.playerName, 42)[0] || rec.playerName, colX[2], currentY + 3.5);
    doc.text(rec.playerClass, colX[3], currentY + 3.5);
    doc.text(SUBJECT_METADATA[rec.subject]?.label || rec.subject, colX[4], currentY + 3.5);
    doc.text(`Level ${rec.levelNumber}`, colX[5], currentY + 3.5);
    doc.text(rec.gameMode === 'latihan' ? 'Latihan' : 'Evaluasi', colX[6], currentY + 3.5);
    doc.text(`${rec.correctCount}/${rec.totalQuestions}`, colX[7], currentY + 3.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(rec.score.toString(), colX[8], currentY + 3.5);

    const accColor = rec.accuracy >= 75 ? [16, 185, 129] : rec.accuracy >= 50 ? [245, 158, 11] : [239, 68, 68];
    doc.setTextColor(accColor[0], accColor[1], accColor[2]);
    doc.text(`${rec.accuracy}%`, colX[9], currentY + 3.5);

    doc.setFont('helvetica', 'normal');
    currentY += 6.5;
  });

  // Footer page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Halaman ${i} dari ${pageCount} — Rekapitulasi Resmi Nilai EduFlight 3D`, pageWidth / 2, 200, { align: 'center' });
  }

  doc.save(`rekap_nilai_siswa_eduflight_${Date.now()}.pdf`);
}
