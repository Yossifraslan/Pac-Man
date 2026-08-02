export class AudioManager {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this._menuMusicPlaying = false;
    this._menuMusicStopped = false;
    this._menuMusicTimeout = null;
    this._activeOscillators = []; // track all playing notes
  }

  _ensureCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  _ctx() {
    this._ensureCtx();
    return this.ctx;
  }

  setEnabled(v) {
    this.enabled = v;
    if (!v) this.stopMenuMusic();
  }

  _beep(freq, duration, type = "square", vol = 0.06) {
    if (!this.enabled) return;
    this._ensureCtx();
    const ctx = this._ctx();
    const play = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = vol;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + duration,
      );
      osc.stop(ctx.currentTime + duration);
    };
    if (ctx.state === "suspended") {
      ctx.resume().then(play);
    } else {
      play();
    }
  }

  _scheduleNote(freq, startTime, duration) {
    if (!this.enabled) return;
    const ctx = this._ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    gain.gain.setValueAtTime(0.04, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.9);
    osc.stop(startTime + duration);

    // Track it so we can kill it early if needed
    this._activeOscillators.push(osc);
    osc.onended = () => {
      const i = this._activeOscillators.indexOf(osc);
      if (i !== -1) this._activeOscillators.splice(i, 1);
    };
  }

  _stopAllOscillators() {
    for (const osc of this._activeOscillators) {
      try {
        osc.stop();
      } catch (_) {}
    }
    this._activeOscillators = [];
  }

  startMenuMusic() {
    if (!this.enabled || this._menuMusicPlaying) return;
    this._menuMusicStopped = false;
    this._ensureCtx();
    if (this.ctx.state === "suspended") {
      this.ctx.resume().then(() => this._playMelody());
      return;
    }
    this._playMelody();
  }

  _playMelody() {
    if (this._menuMusicStopped) return;
    this._menuMusicPlaying = true;

    const notes = [
      [659, 0.12],
      [587, 0.12],
      [494, 0.12],
      [523, 0.12],
      [587, 0.12],
      [440, 0.24],
      [0, 0.12],
      [494, 0.12],
      [523, 0.12],
      [587, 0.12],
      [659, 0.24],
      [523, 0.12],
      [440, 0.24],
      [0, 0.24],
      [784, 0.12],
      [740, 0.12],
      [698, 0.12],
      [659, 0.24],
      [523, 0.12],
      [587, 0.12],
      [659, 0.24],
      [440, 0.12],
      [494, 0.12],
      [523, 0.12],
      [440, 0.48],
      [0, 0.12],
    ];

    const ctx = this._ctx();
    let time = ctx.currentTime + 0.05;
    let total = 0;

    for (const [freq, dur] of notes) {
      if (freq > 0) this._scheduleNote(freq, time, dur);
      time += dur;
      total += dur;
    }

    this._menuMusicTimeout = setTimeout(() => {
      this._menuMusicPlaying = false;
      if (!this._menuMusicStopped) this.startMenuMusic();
    }, total * 1000);
  }

  stopMenuMusic() {
    this._menuMusicStopped = true;
    this._menuMusicPlaying = false;
    clearTimeout(this._menuMusicTimeout);
    this._menuMusicTimeout = null;
    this._stopAllOscillators(); // kill scheduled notes immediately
  }

  eatDot() {
    this._beep(880, 0.04, "square", 0.04);
  }

  eatPellet() {
    this._beep(200, 0.25, "sawtooth", 0.07);
  }

  eatGhost() {
    this._beep(600, 0.18, "triangle", 0.08);
  }

  death() {
    this._beep(400, 0.1, "sawtooth", 0.08);
    setTimeout(() => this._beep(300, 0.1, "sawtooth", 0.08), 100);
    setTimeout(() => this._beep(200, 0.25, "sawtooth", 0.08), 200);
  }

  levelUp() {
    this._beep(523, 0.1, "square", 0.06);
    setTimeout(() => this._beep(659, 0.1, "square", 0.06), 120);
    setTimeout(() => this._beep(784, 0.2, "square", 0.06), 240);
  }

  powerUp() {
    this._beep(1000, 0.12, "sine", 0.05);
  }

  pause() {
    this._beep(440, 0.08, "sine", 0.04);
  }
}
