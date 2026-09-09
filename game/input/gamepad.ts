import { InputState } from './InputState';

export class GamepadInput {
  private prevPulse = false;
  private prevPause = false;

  public poll(state: InputState) {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;

    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (!gp || !gp.connected) continue;

      // Stick / Dpad Move
      let gx = gp.axes[0] ?? 0;
      let gy = gp.axes[1] ?? 0;

      // Deadzone
      if (Math.abs(gx) < 0.15) gx = 0;
      if (Math.abs(gy) < 0.15) gy = 0;

      // Dpad buttons (12: up, 13: down, 14: left, 15: right)
      if (gp.buttons[14]?.pressed) gx = -1;
      if (gp.buttons[15]?.pressed) gx = 1;
      if (gp.buttons[12]?.pressed) gy = -1;
      if (gp.buttons[13]?.pressed) gy = 1;

      if (gx !== 0) state.moveX = gx;
      if (gy !== 0) state.moveY = gy;

      // Fire (Button 0: A, Button 7: RT, Button 5: RB)
      const fire =
        (gp.buttons[0]?.pressed ?? false) ||
        (gp.buttons[7]?.pressed ?? false) ||
        (gp.buttons[5]?.pressed ?? false);
      if (fire) state.firing = true;

      // Pulse (Button 1: B, Button 2: X, Button 6: LT)
      const pulsePress =
        (gp.buttons[1]?.pressed ?? false) ||
        (gp.buttons[2]?.pressed ?? false) ||
        (gp.buttons[6]?.pressed ?? false);
      if (pulsePress && !this.prevPulse) {
        state.pulse = true;
      }
      this.prevPulse = pulsePress;

      // Pause (Button 9: Start, Button 8: Select)
      const pausePress =
        (gp.buttons[9]?.pressed ?? false) ||
        (gp.buttons[8]?.pressed ?? false);
      if (pausePress && !this.prevPause) {
        state.pause = true;
      }
      this.prevPause = pausePress;

      // Only need first active gamepad
      break;
    }
  }
}
