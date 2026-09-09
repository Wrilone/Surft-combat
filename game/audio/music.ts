import { AudioBus } from './AudioBus';

export class MusicEngine {
  private bus: AudioBus;
  private isPlaying = false;
  private timerId: number | null = null;
  private currentStep = 0;
  private nextNoteTime = 0;
  private sector = 1;

  // 128 BPM = 2.133 beats/sec => 16th note = 60 / (128 * 4) = 0.1171875s
  private readonly tempo = 128;
  private readonly stepDuration = 60 / (128 * 4);

  // Sector 1 Theme notes (frequencies in Hz)
  private readonly leadPattern1 = [
    440.0, 0, 440.0, 523.25, 659.25, 0, 523.25, 0,
    587.33, 0, 523.25, 0, 440.0, 0, 392.0, 0,
    440.0, 0, 440.0, 523.25, 659.25, 0, 783.99, 0,
    659.25, 0, 587.33, 0, 659.25, 0, 0, 0,
  ];

  private readonly bassPattern1 = [
    110.0, 110.0, 0, 110.0, 130.81, 0, 110.0, 0,
    146.83, 0, 130.81, 0, 110.0, 0, 98.0, 0,
    110.0, 110.0, 0, 110.0, 130.81, 0, 164.81, 0,
    146.83, 0, 130.81, 0, 110.0, 110.0, 0, 0,
  ];

  // Boss / Sector 2+ Theme notes
  private readonly leadPatternBoss = [
    587.33, 587.33, 0, 587.33, 698.46, 0, 587.33, 0,
    880.0, 0, 783.99, 0, 698.46, 0, 587.33, 0,
    587.33, 587.33, 0, 587.33, 698.46, 0, 1046.5, 0,
    880.0, 0, 783.99, 0, 880.0, 0, 0, 0,
  ];

  private readonly bassPatternBoss = [
    146.83, 146.83, 146.83, 0, 174.61, 0, 146.83, 0,
    220.0, 0, 196.0, 0, 174.61, 0, 146.83, 0,
    146.83, 146.83, 146.83, 0, 174.61, 0, 261.63, 0,
    220.0, 0, 196.0, 0, 220.0, 220.0, 0, 0,
  ];

  constructor(bus: AudioBus) {
    this.bus = bus;
  }

  public start(sector = 1, isBoss = false) {
    this.sector = sector;
    if (this.isPlaying) this.stop();

    const ctx = this.bus.getContext();
    if (!ctx) return;

    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;

    this.scheduler(isBoss);
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private scheduler = (isBoss = false) => {
    if (!this.isPlaying) return;

    const ctx = this.bus.getContext();
    if (!ctx) return;

    // Schedule ahead 150ms
    while (this.nextNoteTime < ctx.currentTime + 0.15) {
      this.playStep(this.nextNoteTime, isBoss);
      this.nextNoteTime += this.stepDuration;
      this.currentStep = (this.currentStep + 1) % 32;
    }

    this.timerId = window.setTimeout(() => this.scheduler(isBoss), 50);
  };

  private playStep(time: number, isBoss: boolean) {
    const ctx = this.bus.getContext();
    const master = this.bus.getMasterNode();
    if (!ctx || !master) return;

    const leadSeq = isBoss ? this.leadPatternBoss : this.leadPattern1;
    const bassSeq = isBoss ? this.bassPatternBoss : this.bassPattern1;

    const leadFreq = leadSeq[this.currentStep];
    const bassFreq = bassSeq[this.currentStep];

    // 1. Square Lead Channel
    if (leadFreq > 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(leadFreq, time);

      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + this.stepDuration * 0.85);

      osc.connect(gain);
      gain.connect(master);

      osc.start(time);
      osc.stop(time + this.stepDuration * 0.9);
    }

    // 2. Triangle Bass Channel
    if (bassFreq > 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(bassFreq, time);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + this.stepDuration * 0.9);

      osc.connect(gain);
      gain.connect(master);

      osc.start(time);
      osc.stop(time + this.stepDuration * 0.95);
    }
  }
}
