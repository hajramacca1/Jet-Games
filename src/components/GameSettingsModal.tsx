import React from 'react';
import { GameSettings } from '../types/game';
import { sound } from '../services/soundEngine';
import { X, Volume2, VolumeX, Gauge, Layers, Tv, Eye, Sliders } from 'lucide-react';

interface GameSettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const handleBgmChange = (val: number) => {
    onUpdateSettings({ bgmVolume: val });
    sound.setVolumes(val, settings.sfxVolume, settings.engineVolume, settings.isMuted);
  };

  const handleSfxChange = (val: number) => {
    onUpdateSettings({ sfxVolume: val });
    sound.setVolumes(settings.bgmVolume, val, settings.engineVolume, settings.isMuted);
    sound.playGatePass();
  };

  const handleEngineChange = (val: number) => {
    onUpdateSettings({ engineVolume: val });
    sound.setVolumes(settings.bgmVolume, settings.sfxVolume, val, settings.isMuted);
  };

  const handleToggleMute = () => {
    const newMuted = !settings.isMuted;
    onUpdateSettings({ isMuted: newMuted });
    sound.setVolumes(settings.bgmVolume, settings.sfxVolume, settings.engineVolume, newMuted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg font-bold text-white">Pengaturan Permainan</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Kecepatan Pesawat */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-sky-400" />
            Kecepatan Jelajah Pesawat
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['santai', 'normal', 'cepat'] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => onUpdateSettings({ flightSpeed: spd })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                  settings.flightSpeed === spd
                    ? 'bg-sky-600/30 border-sky-500 text-sky-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd === 'santai' ? 'Santai (Pemula)' : spd === 'normal' ? 'Normal (Standar)' : 'Cepat (Tantangan)'}
              </button>
            ))}
          </div>
        </div>

        {/* Jumlah Pilihan Gerbang */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Jumlah Pilihan Gerbang Jawaban (2 - 6 Pilihan)
          </label>
          <div className="grid grid-cols-5 gap-2">
            {([2, 3, 4, 5, 6] as const).map((count) => (
              <button
                key={count}
                onClick={() => onUpdateSettings({ numberOfOptions: count })}
                className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                  settings.numberOfOptions === count
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {count} Gerbang
              </button>
            ))}
          </div>
        </div>

        {/* Audio Sliders */}
        <div className="space-y-3 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              Kontrol Audio & Suara
            </span>
            <button
              onClick={handleToggleMute}
              className={`text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
                settings.isMuted 
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-300' 
                  : 'bg-slate-700 border-slate-600 text-slate-200'
              }`}
            >
              {settings.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{settings.isMuted ? 'Muted' : 'Aktif'}</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Musik Latar (BGM)</span>
                <span>{Math.round(settings.bgmVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.bgmVolume}
                onChange={(e) => handleBgmChange(parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Efek Suara Gerbang (SFX)</span>
                <span>{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Deru Mesin Pesawat</span>
                <span>{Math.round(settings.engineVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.engineVolume}
                onChange={(e) => handleEngineChange(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Aksesibilitas & IFP Toggles */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-slate-300 block">Aksesibilitas & Tampilan</span>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 cursor-pointer">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-sky-400" />
              <div>
                <p className="text-xs font-semibold text-white">Mode Layar Sentuh IFP</p>
                <p className="text-[11px] text-slate-400">Tombol kemudi ekstra besar untuk papan sentuh kelas</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.ifpTouchMode}
              onChange={(e) => onUpdateSettings({ ifpTouchMode: e.target.checked })}
              className="w-4 h-4 accent-sky-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 cursor-pointer">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-semibold text-white">Mode Kontras Tinggi</p>
                <p className="text-[11px] text-slate-400">Memperjelas teks soal agar terbaca dari jarak jauh</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => onUpdateSettings({ highContrast: e.target.checked })}
              className="w-4 h-4 accent-emerald-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 cursor-pointer">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs font-semibold text-white">Mode Debug & Telemetri</p>
                <p className="text-[11px] text-slate-400">Tampilkan koordinat pesawat, jarak gerbang, dan FPS</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.showDebug}
              onChange={(e) => onUpdateSettings({ showDebug: e.target.checked })}
              className="w-4 h-4 accent-amber-500 rounded"
            />
          </label>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-white text-sm transition-colors"
        >
          Simpan & Tutup
        </button>
      </div>
    </div>
  );
};
