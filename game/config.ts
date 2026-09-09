export const CONFIG = {
  // Dimensions
  LANDSCAPE_WIDTH: 320,
  LANDSCAPE_HEIGHT: 180,
  PORTRAIT_WIDTH: 180,
  PORTRAIT_HEIGHT: 320,

  // Game Loop
  STEP: 1 / 60,
  MAX_FRAME_DELTA: 0.25,

  // Colors
  COLORS: {
    VOID: '#150B29',
    VOID_LIFT: '#241242',
    AQUA: '#22E4C8',
    CORAL: '#FF4D6D',
    AMBER: '#FFC23C',
    VIOLET: '#8B3DD9',
    BONE: '#F2EAE4',
    BONE_DIM: '#9C8FA8',
  },

  // Player Settings
  PLAYER: {
    WIDTH: 16,
    HEIGHT: 16,
    HITBOX_WIDTH: 8,
    HITBOX_HEIGHT: 8,
    SPEED: 90, // px/s
    START_LIVES: 3,
    MAX_LIVES: 5,
    INVULNERABLE_TIME: 1.2, // s
    RESPAWN_FLASH_HZ: 12,
    BASE_FIRE_RATE: 6, // shots per second
    RAPID_FIRE_RATE: 11, // shots per second
    BULLET_SPEED: 260, // px/s upward
    MARGIN: 4,
    START_PULSES: 1,
    MAX_PULSES: 3,
    SPREAD_DURATION: 12, // s
    RAPID_DURATION: 12, // s
  },

  // Enemies
  ENEMY_TYPES: {
    DRONE: {
      NAME: 'DRONE',
      HP: 1,
      SCORE: 100,
      WIDTH: 12,
      HEIGHT: 12,
      SPEED: 45,
      INTRODUCED_SECTOR: 1,
      INTRODUCED_WAVE: 1,
    },
    SKIMMER: {
      NAME: 'SKIMMER',
      HP: 2,
      SCORE: 250,
      WIDTH: 14,
      HEIGHT: 12,
      SPEED: 55,
      SINE_FREQ: 2.5,
      SINE_AMP: 30,
      INTRODUCED_SECTOR: 1,
      INTRODUCED_WAVE: 2,
    },
    LANCER: {
      NAME: 'LANCER',
      HP: 3,
      SCORE: 400,
      WIDTH: 16,
      HEIGHT: 16,
      SPEED: 35,
      FIRE_INTERVAL: 1.8,
      CHARGE_TIME: 0.4,
      INTRODUCED_SECTOR: 1,
      INTRODUCED_WAVE: 4,
    },
    MINE: {
      NAME: 'MINE',
      HP: 2,
      SCORE: 300,
      WIDTH: 12,
      HEIGHT: 12,
      SPEED: 10,
      SPLIT_COUNT: 3,
      INTRODUCED_SECTOR: 2,
      INTRODUCED_WAVE: 2,
    },
    WARDEN: {
      NAME: 'WARDEN',
      BASE_HP: 40,
      HP_PER_SECTOR: 10,
      SCORE: 5000,
      WIDTH: 64,
      HEIGHT: 48,
      SPEED: 30,
    },
  },

  // Enemy Bullets
  ENEMY_BULLET: {
    WIDTH: 4,
    HEIGHT: 4,
    SPEED: 110,
  },

  // Power-ups
  POWERUP: {
    WIDTH: 10,
    HEIGHT: 10,
    DROP_CHANCE: 1 / 8, // 1 in 8 enemies
    SPEED: 40, // px/s downward
  },

  // Sector Scaling
  SCALING: {
    WAVES_PER_SECTOR: 5,
    BASE_ENEMY_COUNT: 4,
    ENEMY_COUNT_PER_SECTOR: 2,
    ENEMY_COUNT_CAP: 18,
    SPEED_MULT_BASE: 1,
    SPEED_MULT_RATE: 0.08,
    SPEED_MULT_CAP: 1.6,
    FIRE_MULT_BASE: 1,
    FIRE_MULT_RATE: 0.12,
    FIRE_MULT_CAP: 2.0,
  },

  // Scoring & Combos
  SCORING: {
    COMBO_MAX: 8,
    COMBO_DECAY_TIME: 2.0, // seconds
    WAVE_CLEAR_BASE: 500, // * sector
    NO_HIT_SECTOR_BONUS: 2500,
  },

  // Particles & Effects
  FX: {
    SCREEN_SHAKE_HIT: 8,
    SCREEN_SHAKE_KILL: 4,
    HIT_STOP_DURATION: 0.5,
    HIT_STOP_TIME_SCALE: 0.25,
    PULSE_FLASH_TIME: 0.4,
    WAVE_BANNER_TIME: 1.2,
  },

  // Touch control thumb offset
  TOUCH: {
    VERTICAL_OFFSET: 48,
    DEADZONE: 2,
  },

  // Spatial Hash
  SPATIAL_HASH_CELL_SIZE: 32,
};

export type EnemyTypeName = 'DRONE' | 'SKIMMER' | 'LANCER' | 'MINE' | 'WARDEN';
export type PowerUpType = 'SPREAD' | 'RAPID' | 'SHIELD' | 'PULSE';
