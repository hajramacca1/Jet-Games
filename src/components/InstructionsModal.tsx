import React from 'react';
import { X, Tv, Keyboard, MousePointer, HelpCircle, ShieldCheck } from 'lucide-react';

interface InstructionsModalProps {
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg font-bold text-white">Panduan Bermain & Kendali IFP</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Cara Bermain */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-sky-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Aturan & Tujuan Penerbangan
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Anda adalah pilot pesawat penjelajah angkasa. Pesawat bergerak maju secara otomatis melalui rute 3D. Di depan pesawat terdapat <strong>Gerbang Jawaban 3D</strong> dengan pilihan A, B, C, D (atau 2–6 gerbang).
          </p>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
            <li>Baca pertanyaan yang tampil pada panel atas layar.</li>
            <li>Arahkan pesawat menuju gerbang dengan pilihan jawaban yang Anda yakini benar.</li>
            <li>Pesawat harus benar-benar melintasi bagian dalam gerbang untuk mengunci pilihan!</li>
            <li>Jawaban benar memberikan <strong>+100 Poin</strong>, bonus kombo streak, dan bonus kecepatan.</li>
          </ul>
        </div>

        {/* 2. Kendali Perangkat (IFP, Keyboard, Mouse) */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white">Pilihan Metode Pengendalian</h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* IFP & Layar Sentuh */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                <Tv className="w-4 h-4" />
                <span>Papan Sentuh / IFP</span>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1">
                <li>• Tekan tombol kemudi kiri/kanan di sudut bawah.</li>
                <li>• <strong>Sentuh langsung kartu opsi jawaban</strong> untuk memandu pesawat otomatis ke gerbang tersebut!</li>
              </ul>
            </div>

            {/* Keyboard */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Keyboard className="w-4 h-4" />
                <span>Keyboard Laptop/PC</span>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1">
                <li>• <strong>Panah Kiri / Kanan</strong> atau <strong>A / D</strong> untuk belok.</li>
                <li>• <strong>Panah Atas / Bawah</strong> atau <strong>W / S</strong> untuk ketinggian.</li>
                <li>• <strong>Spasi</strong> untuk Jeda permainan.</li>
              </ul>
            </div>

            {/* Mouse */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <MousePointer className="w-4 h-4" />
                <span>Mouse / Touchpad</span>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1">
                <li>• Klik tombol panah di layar bawah.</li>
                <li>• Klik opsi gerbang jawaban yang dituju untuk manuver cepat.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 3. Perbedaan Mode Permainan */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2 text-xs">
          <span className="font-bold text-white block">Mode Latihan vs Mode Evaluasi:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="font-semibold text-sky-300">Mode Latihan:</p>
              <p className="text-slate-400 mt-0.5">
                Nyawa tak terbatas. Begitu melewati gerbang, jendela pembahasan langsung muncul memberi penjelasan materi.
              </p>
            </div>
            <div>
              <p className="font-semibold text-rose-300">Mode Evaluasi (Ujian):</p>
              <p className="text-slate-400 mt-0.5">
                Memiliki 3 nyawa hati. Tidak ada jeda penjelasan di tengah jalan; analisis lengkap disajikan pada halaman hasil akhir.
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-white text-sm transition-colors cursor-pointer"
        >
          Saya Siap Mengemudikan Pesawat!
        </button>
      </div>
    </div>
  );
};
