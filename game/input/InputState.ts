export interface InputState {
  moveX: number; // -1 to 1
  moveY: number; // -1 to 1
  firing: boolean;
  pulse: boolean; // edge-triggered, consumed on read
  pause: boolean; // edge-triggered, consumed on read
}

export function createInputState(): InputState {
  return {
    moveX: 0,
    moveY: 0,
    firing: false,
    pulse: false,
    pause: false,
  };
}
