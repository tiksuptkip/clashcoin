/**
 * Clash Of Coin - Web Audio Sound Engine
 * Provides synthesized real-time audio with zero external dependencies,
 * zero network lag, and instant instant mute/unmute control.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8;
  private listeners: Set<(muted: boolean, volume: number) => void> = new Set();
  private activeNodes: Set<AudioNode> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      // Default: sound ON (unmuted) on first visit
      const savedMute = localStorage.getItem('clash_sound_muted');
      this.isMuted = savedMute === 'true';

      const savedVol = localStorage.getItem('clash_sound_volume');
      this.volume = savedVol !== null ? parseFloat(savedVol) : 0.8;

      // Unlock AudioContext on first user interaction
      const unlockAudio = () => {
        this.initContext();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };

      window.addEventListener('pointerdown', unlockAudio, { once: true });
      window.addEventListener('keydown', unlockAudio, { once: true });
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public subscribe(cb: (muted: boolean, volume: number) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.isMuted, this.volume));
  }

  /**
   * Instantly toggles mute state and silences any sound playing mid-sound.
   */
  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('clash_sound_muted', muted ? 'true' : 'false');
    }

    if (this.ctx && this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }

    if (muted) {
      this.stopAllActive();
    }

    this.notify();
  }

  public setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    if (typeof window !== 'undefined') {
      localStorage.setItem('clash_sound_volume', clamped.toString());
    }

    if (this.ctx && this.masterGain && !this.isMuted) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }

    this.notify();
  }

  /**
   * Stop all active synthesized oscillators or nodes immediately
   */
  public stopAllActive(): void {
    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // Ignore already stopped nodes
      }
    });
    this.activeNodes.clear();
  }

  /**
   * tick: plays every second in the last 10 seconds of countdown
   * High-contrast mechanical clock tick click
   */
  public playTick(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(980, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);

      gain.gain.setValueAtTime(0.45 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.masterGain);

      this.activeNodes.add(osc);
      osc.start(now);
      osc.stop(now + 0.04);
      osc.onended = () => {
        this.activeNodes.delete(osc);
        osc.disconnect();
        gain.disconnect();
      };
    } catch {
      // Audio playback safety catch
    }
  }

  /**
   * place_bet: when user places a bet
   * Polyphonic casino chip / coin drop chime
   */
  public playPlaceBet(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;

      // Two rapid metallic coin chimes
      const freqs = [1760, 2349]; // A6 & D7
      freqs.forEach((freq, idx) => {
        const offset = idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + offset);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.9, now + offset + 0.15);

        gain.gain.setValueAtTime(0.4 * this.volume, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        this.activeNodes.add(osc);
        osc.start(now + offset);
        osc.stop(now + offset + 0.2);
        osc.onended = () => {
          this.activeNodes.delete(osc);
          osc.disconnect();
          gain.disconnect();
        };
      });
    } catch {
      // Audio safety
    }
  }

  /**
   * win: when user's team wins
   * Triumphant victory fanfare chord (C5 -> E5 -> G5 -> C6 shimmer)
   */
  public playWin(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, time: 0 },       // C5
        { freq: 659.25, time: 0.09 },    // E5
        { freq: 783.99, time: 0.18 },    // G5
        { freq: 1046.5, time: 0.28 },    // C6
        { freq: 1318.5, time: 0.40 },    // E6 sustained
      ];

      notes.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.35 * this.volume, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.55);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        this.activeNodes.add(osc);
        osc.start(now + time);
        osc.stop(now + time + 0.6);
        osc.onended = () => {
          this.activeNodes.delete(osc);
          osc.disconnect();
          gain.disconnect();
        };
      });
    } catch {
      // Audio safety
    }
  }

  /**
   * lose: when user's team loses
   * Gentle, soft descending mellow tone
   */
  public playLose(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 293.66, time: 0 },    // D4
        { freq: 261.63, time: 0.15 }, // C4
        { freq: 220.00, time: 0.32 }, // A3
        { freq: 174.61, time: 0.50 }, // F3
      ];

      notes.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.25 * this.volume, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        this.activeNodes.add(osc);
        osc.start(now + time);
        osc.stop(now + time + 0.45);
        osc.onended = () => {
          this.activeNodes.delete(osc);
          osc.disconnect();
          gain.disconnect();
        };
      });
    } catch {
      // Audio safety
    }
  }

  /**
   * round_start: when new round starts
   * Boxing bell / resonant battle gong
   */
  public playRoundStart(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1760, now); // A6 overtone

      gain.gain.setValueAtTime(0.5 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      this.activeNodes.add(osc1);
      this.activeNodes.add(osc2);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.25);
      osc2.stop(now + 1.25);

      osc1.onended = () => {
        this.activeNodes.delete(osc1);
        this.activeNodes.delete(osc2);
        osc1.disconnect();
        osc2.disconnect();
        gain.disconnect();
      };
    } catch {
      // Audio safety
    }
  }

  /**
   * plane_takeoff: jet engine spool-up and ascending pitch
   */
  public playPlaneTakeoff(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 1.2);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.3 * this.volume, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      this.activeNodes.add(osc);
      osc.start(now);
      osc.stop(now + 1.35);

      osc.onended = () => {
        this.activeNodes.delete(osc);
        osc.disconnect();
        gain.disconnect();
      };
    } catch {
      // Audio safety
    }
  }

  /**
   * plane_crash: explosive low frequency impact boom
   */
  public playPlaneCrash(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      // Low boom oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.6);

      gain.gain.setValueAtTime(0.6 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.masterGain);

      this.activeNodes.add(osc);
      osc.start(now);
      osc.stop(now + 0.75);

      osc.onended = () => {
        this.activeNodes.delete(osc);
        osc.disconnect();
        gain.disconnect();
      };
    } catch {
      // Audio safety
    }
  }

  /**
   * cashout: bright coin + register chime
   */
  public playCashout(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 1046.5, time: 0 },    // C6
        { freq: 1318.5, time: 0.08 }, // E6
        { freq: 2093.0, time: 0.16 }, // C7
      ];

      notes.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.4 * this.volume, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        this.activeNodes.add(osc);
        osc.start(now + time);
        osc.stop(now + time + 0.5);

        osc.onended = () => {
          this.activeNodes.delete(osc);
          osc.disconnect();
          gain.disconnect();
        };
      });
    } catch {
      // Audio safety
    }
  }

  /**
   * goal_whistle: referee sports match whistle
   */
  public playGoalWhistle(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      // High pitch dual tone referee whistle
      const freqs = [2400, 2750];
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.35 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        this.activeNodes.add(osc);
        osc.start(now);
        osc.stop(now + 0.45);

        osc.onended = () => {
          this.activeNodes.delete(osc);
          osc.disconnect();
          gain.disconnect();
        };
      });
    } catch {
      // Audio safety
    }
  }
}

export const soundManager = new SoundEngine();

