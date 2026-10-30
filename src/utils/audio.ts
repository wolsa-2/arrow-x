/**
 * Web Audio procedural sound synthesizer for Arrow Escape Puzzle.
 * Completely self-contained, zero external audio asset dependencies.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private musicOscillators: OscillatorNode[] = [];
  private isMusicPlaying = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Subtle button click
   */
  playButton(enabled = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.04);
    } catch {
      // Audio context might be restricted before gesture
    }
  }

  /**
   * Arrow selection tap
   */
  playTap(enabled = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.06);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.06);
    } catch {
      // Audio context error handler
    }
  }

  /**
   * Successful arrow escape - uplifting whoosh + cheerful bell
   */
  playEscape(enabled = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // Bell chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, t); // C5
      osc1.frequency.exponentialRampToValueAtTime(1046.5, t + 0.18); // C6
      gain1.gain.setValueAtTime(0.2, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(t);
      osc1.stop(t + 0.22);

      // Soft air swoosh
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(320, t);
      osc2.frequency.linearRampToValueAtTime(700, t + 0.15);
      gain2.gain.setValueAtTime(0.1, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(t);
      osc2.stop(t + 0.18);
    } catch {
      // Audio error handler
    }
  }

  /**
   * Blocked movement - soft low dual bump without harsh dissonance
   */
  playBlocked(enabled = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(160, t);
      osc1.frequency.exponentialRampToValueAtTime(90, t + 0.08);
      gain1.gain.setValueAtTime(0.18, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(t);
      osc1.stop(t + 0.09);

      // Second gentle tap
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(140, t + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(80, t + 0.17);
      gain2.gain.setValueAtTime(0.15, t + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(t + 0.08);
      osc2.stop(t + 0.17);
    } catch {
      // Audio error handler
    }
  }

  /**
   * Hint activation - twinkling magical chime
   */
  playHint(enabled = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = t + idx * 0.07;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.14, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch {
      // Audio error handler
    }
  }

  /**
   * Level completion victory fanfare
   */
  playVictory(enabled = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      // Cheerful major arpeggio fanfare: C5, E5, G5, B5, C6 (prolonged bell finish)
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = t + idx * 0.09;
        const dur = idx === notes.length - 1 ? 0.6 : 0.25;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur);
      });
    } catch {
      // Audio error handler
    }
  }

  /**
   * Undo sound
   */
  playUndo(enabled = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(350, t + 0.12);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.12);
    } catch {
      // Audio error handler
    }
  }

  /**
   * Background ambient pad synthesizer
   */
  setMusic(enabled: boolean) {
    const ctx = this.getContext();
    if (!ctx) return;

    if (!enabled) {
      if (this.musicGainNode) {
        try {
          this.musicGainNode.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
          setTimeout(() => {
            this.musicOscillators.forEach((osc) => {
              try { osc.stop(); } catch {}
            });
            this.musicOscillators = [];
            this.musicGainNode = null;
            this.isMusicPlaying = false;
          }, 600);
        } catch {
          this.isMusicPlaying = false;
        }
      }
      return;
    }

    if (this.isMusicPlaying) return;

    try {
      const t = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, t);
      masterGain.gain.linearRampToValueAtTime(0.035, t + 1.5); // Soft ambient volume

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);

      masterGain.connect(filter);
      filter.connect(ctx.destination);

      // Calm warm chord: C3, G3, D4, E4
      const freqs = [130.81, 196.00, 293.66, 329.63];
      this.musicOscillators = freqs.map((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, t);
        osc.connect(masterGain);
        osc.start(t);
        return osc;
      });

      this.musicGainNode = masterGain;
      this.isMusicPlaying = true;
    } catch {
      // Audio error handler
    }
  }

  /**
   * Coin pickup / purchase sound (sparkling two-tone ping)
   */
  playCoin(enabled = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      [987.77, 1318.51].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = t + i * 0.07;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.14, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.15);
      });
    } catch {}
  }

  /**
   * Bomb / Clear Arrow explosion / whoosh sound
   */
  playBomb(enabled = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.25);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    } catch {}
  }

  /**
   * Heart refill chime
   */
  playHeartRefill(enabled = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      [440, 554.37, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = t + i * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.2);
      });
    } catch {}
  }

  /**
   * Daily reward or Ad rewarded fanfare
   */
  playReward(enabled = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = t + i * 0.07;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch {}
  }
}

export const sound = new SoundSystem();

/**
 * Haptic feedback trigger for mobile devices
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'double' = 'light', enabled = true) {
  if (!enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    switch (type) {
      case 'light':
        navigator.vibrate(15);
        break;
      case 'medium':
        navigator.vibrate(30);
        break;
      case 'heavy':
        navigator.vibrate(50);
        break;
      case 'double':
        navigator.vibrate([20, 40, 20]);
        break;
    }
  } catch {
    // Ignore haptic errors on unsupported hardware
  }
}
