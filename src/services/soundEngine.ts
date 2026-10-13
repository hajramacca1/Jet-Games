/**
 * Web Audio API synthesizer for EduFlight 3D
 * Zero external audio dependencies - 100% offline, low-latency, and crash-proof.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private engineGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private bgmGain: GainNode | null = null;
  private bgmTimer: number | null = null;
  private isBgmPlaying: boolean = false;

  private isMuted: boolean = false;
  private bgmVolume: number = 0.5;
  private sfxVolume: number = 0.7;
  private engineVolume: number = 0.3;

  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized && this.ctx && this.ctx.state === 'running') return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.isInitialized = true;
    } catch {
      // AudioContext may be blocked until user gesture
    }
  }

  public setVolumes(bgm: number, sfx: number, engine: number, muted: boolean) {
    this.bgmVolume = Math.max(0, Math.min(1, bgm));
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    this.engineVolume = Math.max(0, Math.min(1, engine));
    this.isMuted = muted;

    if (this.engineGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.engineVolume * 0.15;
      this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    }

    if (this.bgmGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.bgmVolume * 0.18;
      this.bgmGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.2);
    }
  }

  // --- ENGINE DRONE SYNTHESIS ---
  public startEngine() {
    this.init();
    if (!this.ctx || this.engineOsc) return;

    try {
      const now = this.ctx.currentTime;
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(65, now); // 65 Hz jet hum

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(240, now);
      this.engineFilter.Q.setValueAtTime(2, now);

      this.engineGain = this.ctx.createGain();
      const initialGain = this.isMuted ? 0 : this.engineVolume * 0.15;
      this.engineGain.gain.setValueAtTime(initialGain, now);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
    } catch {
      // Audio engine start failure gracefully ignored
    }
  }

  public updateEnginePitch(speedRatio: number, pitchOffset: number) {
    if (!this.ctx || !this.engineOsc || !this.engineFilter) return;

    try {
      const now = this.ctx.currentTime;
      // Base frequency modulated by speed and climbing/descending
      const baseFreq = 65 + (speedRatio - 1) * 25 + pitchOffset * 10;
      this.engineOsc.frequency.setTargetAtTime(Math.max(45, Math.min(130, baseFreq)), now, 0.1);

      const filterFreq = 220 + (speedRatio - 1) * 120;
      this.engineFilter.frequency.setTargetAtTime(Math.max(160, Math.min(500, filterFreq)), now, 0.1);
    } catch {
      // Ignore
    }
  }

  public stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch {
        // Ignore
      }
      this.engineOsc = null;
      this.engineFilter = null;
      this.engineGain = null;
    }
  }

  // --- SOUND EFFECTS ---
  public playGatePass() {
    if (this.isMuted || !this.ctx || this.sfxVolume <= 0) return;
    this.init();

    try {
      const now = this.ctx.currentTime;
      // Filtered noise sweep
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);

      gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch {
      // Ignore
    }
  }

  public playCorrect() {
    if (this.isMuted || !this.ctx || this.sfxVolume <= 0) return;
    this.init();

    try {
      // Uplifting arpeggio: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.4, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.36);
      });
    } catch {
      // Ignore
    }
  }

  public playWrong() {
    if (this.isMuted || !this.ctx || this.sfxVolume <= 0) return;
    this.init();

    try {
      // Soft gentle descending dual tone
      const notes = [220, 164.81];
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + idx * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(this.sfxVolume * 0.3, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.3);
      });
    } catch {
      // Ignore
    }
  }

  public playLevelClear() {
    if (this.isMuted || !this.ctx || this.sfxVolume <= 0) return;
    this.init();

    try {
      // Fanfare: G4, C5, E5, G5, C6 (extended flourish)
      const notes = [392, 523.25, 659.25, 783.99, 1046.5];
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + idx * 0.1;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.45, noteTime + 0.03);
        const duration = idx === notes.length - 1 ? 0.8 : 0.25;
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + duration + 0.05);
      });
    } catch {
      // Ignore
    }
  }

  // --- AMBIENT BGM CHORD SYNTHESIS ---
  public startBGM() {
    if (this.isBgmPlaying) return;
    this.init();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    this.bgmGain = this.ctx.createGain();
    const vol = this.isMuted ? 0 : this.bgmVolume * 0.18;
    this.bgmGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    this.bgmGain.connect(this.ctx.destination);

    // Warm ambient chords in F major / D minor (dreamy flight atmosphere)
    const chords = [
      [261.63, 329.63, 392.00, 523.25], // C maj
      [220.00, 261.63, 329.63, 440.00], // A min
      [174.61, 220.00, 261.63, 349.23], // F maj
      [196.00, 246.94, 293.66, 392.00], // G maj
    ];

    let chordIdx = 0;

    const playNextChord = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;

      const chord = chords[chordIdx % chords.length];
      chordIdx++;
      const now = this.ctx.currentTime;
      const chordDuration = 3.8;

      chord.forEach((freq) => {
        if (!this.ctx || !this.bgmGain) return;
        const osc = this.ctx.createOscillator();
        const chordNoteGain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Soft swelling attack & gentle release
        chordNoteGain.gain.setValueAtTime(0.0001, now);
        chordNoteGain.gain.linearRampToValueAtTime(0.07, now + 1.2);
        chordNoteGain.gain.exponentialRampToValueAtTime(0.0001, now + chordDuration);

        osc.connect(chordNoteGain);
        chordNoteGain.connect(this.bgmGain);

        osc.start(now);
        osc.stop(now + chordDuration + 0.1);
      });

      this.bgmTimer = window.setTimeout(playNextChord, 3500);
    };

    playNextChord();
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.bgmGain) {
      try {
        this.bgmGain.disconnect();
      } catch {
        // Ignore
      }
      this.bgmGain = null;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.setVolumes(this.bgmVolume, this.sfxVolume, this.engineVolume, this.isMuted);
    return this.isMuted;
  }
}

export const sound = new SoundEngine();
