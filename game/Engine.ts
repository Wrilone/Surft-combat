import { CONFIG } from './config';
import { World } from './World';
import { Renderer } from './Renderer';
import { InputState, createInputState } from './input/InputState';
import { KeyboardInput } from './input/keyboard';
import { TouchInput } from './input/touch';
import { GamepadInput } from './input/gamepad';
import { AudioBus } from './audio/AudioBus';
import { SoundEffects } from './audio/sfx';
import { MusicEngine } from './audio/music';

export type GameState = 'BOOT' | 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface EngineCallbacks {
  onStateChange?: (state: GameState) => void;
  onMuteChange?: (muted: boolean) => void;
}

export class Engine {
  public state: GameState = 'BOOT';
  public world: World;
  public renderer: Renderer;

  // Audio
  public audioBus: AudioBus;
  public sfx: SoundEffects;
  public music: MusicEngine;

  // Input
  public keyboard: KeyboardInput;
  public touch: TouchInput;
  public gamepad: GamepadInput;
  private currentInput: InputState = createInputState();

  // Loop & Accumulator
  private rafId: number | null = null;
  private isRunning = false;
  private lastTime = 0;
  private accumulator = 0;

  // Performance stats
  public fps = 60;
  public frameTime = 0;
  public showDebug = false;
  private frameCount = 0;
  private fpsTimer = 0;

  public callbacks: EngineCallbacks = {};

  constructor(
    gameCanvas: HTMLCanvasElement,
    hudCanvas: HTMLCanvasElement,
    initialBestScore = 0
  ) {
    this.world = new World(initialBestScore);
    this.renderer = new Renderer(gameCanvas, hudCanvas);

    this.audioBus = new AudioBus();
    this.sfx = new SoundEffects(this.audioBus);
    this.music = new MusicEngine(this.audioBus);

    this.world.sfx = this.sfx;
    this.world.music = this.music;

    this.keyboard = new KeyboardInput();
    this.touch = new TouchInput(() => ({
      width: this.world.width,
      height: this.world.height,
    }));
    this.gamepad = new GamepadInput();

    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', this.onVisibilityChange);
      window.addEventListener('keydown', this.onDebugKey);
    }
  }

  public destroy() {
    this.stop();
    this.keyboard.destroy();
    this.touch.detach();
    this.music.stop();

    if (typeof window !== 'undefined') {
      window.removeEventListener('visibilitychange', this.onVisibilityChange);
      window.removeEventListener('keydown', this.onDebugKey);
    }
  }

  private onDebugKey = (e: KeyboardEvent) => {
    if (e.code === 'Backquote') {
      this.showDebug = !this.showDebug;
    }
  };

  private onVisibilityChange = () => {
    if (document.hidden) {
      if (this.state === 'PLAYING') {
        this.pause();
      }
    } else {
      this.lastTime = performance.now();
      this.accumulator = 0;
    }
  };

  public setState(newState: GameState) {
    this.state = newState;
    this.keyboard.isGameActive = newState === 'PLAYING';
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(newState);
    }
  }

  public startNewGame() {
    this.audioBus.init();
    this.world.resetGame();
    this.setState('PLAYING');
    this.lastTime = performance.now();
    this.accumulator = 0;
  }

  public pause() {
    if (this.state === 'PLAYING') {
      this.setState('PAUSED');
      this.music.stop();
    }
  }

  public resume() {
    if (this.state === 'PAUSED') {
      this.setState('PLAYING');
      this.lastTime = performance.now();
      this.accumulator = 0;
      if (this.music) {
        this.music.start(this.world.spawner.sector, this.world.spawner.isBossWave);
      }
    }
  }

  public restart() {
    this.startNewGame();
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.loop);
  }

  public stop() {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop = (now: number) => {
    if (!this.isRunning) return;

    this.rafId = requestAnimationFrame(this.loop);

    const startCompute = performance.now();
    let delta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (delta > CONFIG.MAX_FRAME_DELTA) {
      delta = CONFIG.MAX_FRAME_DELTA;
    }

    // FPS calculation
    this.frameCount++;
    this.fpsTimer += delta;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    // Process inputs
    this.pollInputs();

    // Loop logic
    if (this.state === 'PLAYING') {
      // Hit-stop scales accumulator delta
      this.accumulator += delta * this.world.camera.timeScale;

      const STEP = CONFIG.STEP;
      while (this.accumulator >= STEP) {
        // Snapshot intent
        const snapshot = { ...this.currentInput };
        this.world.update(STEP, snapshot);
        this.accumulator -= STEP;

        // Reset consumed edge flags
        this.currentInput.pulse = false;
        this.currentInput.pause = false;
      }

      // Render interpolated frame
      const alpha = Math.max(0, Math.min(1, this.accumulator / STEP));
      this.renderer.draw(this.world, alpha);

      // Check for Game Over trigger
      if (this.world.isGameOver && this.state === 'PLAYING') {
        this.setState('GAME_OVER');
      }
    } else if (this.state === 'TITLE' || this.state === 'BOOT') {
      // Idle starfield render
      this.world.camera.update(delta);
      this.renderer.draw(this.world, 1.0);
    }

    this.frameTime = performance.now() - startCompute;
  };

  private pollInputs() {
    this.currentInput.moveX = 0;
    this.currentInput.moveY = 0;
    this.currentInput.firing = false;

    // 1. Keyboard
    this.keyboard.writeTo(this.currentInput);

    // 2. Touch
    this.touch.writeTo(this.currentInput, this.world.player.x, this.world.player.y);

    // 3. Gamepad
    this.gamepad.poll(this.currentInput);

    // Check mute toggle
    if (this.keyboard.consumeMute()) {
      const isMuted = this.audioBus.toggleMute();
      if (this.callbacks.onMuteChange) {
        this.callbacks.onMuteChange(isMuted);
      }
    }

    // Check pause request
    if (this.currentInput.pause) {
      this.currentInput.pause = false;
      if (this.state === 'PLAYING') {
        this.pause();
      } else if (this.state === 'PAUSED') {
        this.resume();
      }
    }

    // Check start / restart on Enter
    if (this.keyboard.consumeEnter()) {
      if (this.state === 'TITLE' || this.state === 'GAME_OVER') {
        this.startNewGame();
      }
    }
  }
}
