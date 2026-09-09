import { CONFIG } from '../config';

export interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AtlasData {
  player: SpriteRect[]; // 0: neutral, 1: bank left, 2: bank right
  thruster: SpriteRect[]; // 4 frames
  drone: SpriteRect[]; // 2 frames
  skimmer: SpriteRect[]; // 2 frames
  lancer: SpriteRect[]; // 2 frames (idle, charge)
  mine: SpriteRect[]; // 4 frames
  warden: SpriteRect[]; // 3 phase frames
  playerBullet: SpriteRect;
  enemyBullet: SpriteRect[]; // 2 frames
  dropSpread: SpriteRect;
  dropRapid: SpriteRect;
  dropShield: SpriteRect;
  dropPulse: SpriteRect;
  explosion: SpriteRect[]; // 6 frames
}

export const ATLAS_RECTS: AtlasData = {
  player: [
    { x: 0, y: 0, w: 16, h: 16 },
    { x: 16, y: 0, w: 16, h: 16 },
    { x: 32, y: 0, w: 16, h: 16 },
  ],
  thruster: [
    { x: 48, y: 0, w: 8, h: 8 },
    { x: 56, y: 0, w: 8, h: 8 },
    { x: 64, y: 0, w: 8, h: 8 },
    { x: 72, y: 0, w: 8, h: 8 },
  ],
  drone: [
    { x: 80, y: 0, w: 12, h: 12 },
    { x: 92, y: 0, w: 12, h: 12 },
  ],
  skimmer: [
    { x: 104, y: 0, w: 14, h: 12 },
    { x: 118, y: 0, w: 14, h: 12 },
  ],
  lancer: [
    { x: 132, y: 0, w: 16, h: 16 },
    { x: 148, y: 0, w: 16, h: 16 },
  ],
  mine: [
    { x: 164, y: 0, w: 12, h: 12 },
    { x: 176, y: 0, w: 12, h: 12 },
    { x: 188, y: 0, w: 12, h: 12 },
    { x: 200, y: 0, w: 12, h: 12 },
  ],
  playerBullet: { x: 0, y: 16, w: 3, h: 8 },
  enemyBullet: [
    { x: 4, y: 16, w: 4, h: 4 },
    { x: 8, y: 16, w: 4, h: 4 },
  ],
  dropSpread: { x: 16, y: 16, w: 10, h: 10 },
  dropRapid: { x: 26, y: 16, w: 10, h: 10 },
  dropShield: { x: 36, y: 16, w: 10, h: 10 },
  dropPulse: { x: 46, y: 16, w: 10, h: 10 },
  explosion: [
    { x: 60, y: 16, w: 16, h: 16 },
    { x: 76, y: 16, w: 16, h: 16 },
    { x: 92, y: 16, w: 16, h: 16 },
    { x: 108, y: 16, w: 16, h: 16 },
    { x: 124, y: 16, w: 16, h: 16 },
    { x: 140, y: 16, w: 16, h: 16 },
  ],
  warden: [
    { x: 0, y: 32, w: 64, h: 48 },
    { x: 64, y: 32, w: 64, h: 48 },
    { x: 128, y: 32, w: 64, h: 48 },
  ],
};

let cachedAtlasCanvas: HTMLCanvasElement | null = null;

/**
 * Creates or retrieves the 16-bit pixel-art sprite atlas canvas.
 * Renders all sprites deterministically onto a single 256x128 canvas.
 */
export function getSpriteAtlas(): HTMLCanvasElement {
  if (cachedAtlasCanvas) {
    return cachedAtlasCanvas;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;

  const C = CONFIG.COLORS;

  // Helper to draw pixels from a string matrix
  function drawPixelMatrix(
    x: number,
    y: number,
    matrix: string[],
    colorMap: Record<string, string>
  ) {
    for (let r = 0; r < matrix.length; r++) {
      const row = matrix[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch !== ' ' && ch !== '.' && colorMap[ch]) {
          ctx!.fillStyle = colorMap[ch];
          ctx!.fillRect(x + c, y + r, 1, 1);
        }
      }
    }
  }

  // 1. Player Ships (Neutral, Bank Left, Bank Right)
  const playerNeutral = [
    '       AA       ',
    '       AA       ',
    '      AAAA      ',
    '      AAAA      ',
    '      ABBA      ',
    '     AABBBA     ',
    '     AABBAA     ',
    '    AAA  AAA    ',
    '   AAAA  AAAA   ',
    '   AACC  CCAA   ',
    '  AAAAA  AAAAA  ',
    ' AAAAAAAAAAAAAA ',
    ' A AA  AA  AA A ',
    'AA  A  AA  A  AA',
    'A      AA      A',
    '       AA       ',
  ];

  const playerBankLeft = [
    '      AA        ',
    '      AA        ',
    '     AAAA       ',
    '     AAAA       ',
    '     ABBA       ',
    '    AABBBA      ',
    '    AABBAA      ',
    '   AAA  AAA     ',
    '  AAAA  AAAA    ',
    '  AACC  CCAA    ',
    ' AAAAA  AAAAA   ',
    'AAAAAAAAAAAAAA  ',
    ' AA AA  AA  AA  ',
    'AA   A  AA   A  ',
    'A       AA      ',
    '        AA      ',
  ];

  const playerBankRight = [
    '        AA      ',
    '        AA      ',
    '       AAAA     ',
    '       AAAA     ',
    '       ABBA     ',
    '      AABBBA    ',
    '      AABBAA    ',
    '     AAA  AAA   ',
    '    AAAA  AAAA  ',
    '    AACC  CCAA  ',
    '   AAAAA  AAAAA ',
    '  AAAAAAAAAAAAAA',
    '  AA  AA  AA AA ',
    '  A   AA  A   AA',
    '      AA       A',
    '      AA        ',
  ];

  const playerColors = {
    A: C.AQUA,
    B: C.BONE,
    C: C.VOID_LIFT,
  };

  drawPixelMatrix(0, 0, playerNeutral, playerColors);
  drawPixelMatrix(16, 0, playerBankLeft, playerColors);
  drawPixelMatrix(32, 0, playerBankRight, playerColors);

  // 2. Thrusters (4 frames, 8x8)
  const thrusters = [
    [
      '  BBBB  ',
      '  BAAB  ',
      '  BAAB  ',
      '   AA   ',
      '   AA   ',
      '    A   ',
      '        ',
      '        ',
    ],
    [
      '  BBBB  ',
      '  BAAB  ',
      '  BAAB  ',
      '  AAAA  ',
      '   AA   ',
      '   AA   ',
      '    A   ',
      '        ',
    ],
    [
      '  BBBB  ',
      '  BAAB  ',
      '  BAAB  ',
      '  AAAA  ',
      '  AAAA  ',
      '   AA   ',
      '   AA   ',
      '    A   ',
    ],
    [
      '  BBBB  ',
      '  BAAB  ',
      '  BAAB  ',
      '   AA   ',
      '  AAAA  ',
      '   AA   ',
      '    A   ',
      '        ',
    ],
  ];

  const thrusterColors = {
    B: C.AMBER,
    A: C.BONE,
  };

  for (let i = 0; i < 4; i++) {
    drawPixelMatrix(48 + i * 8, 0, thrusters[i], thrusterColors);
  }

  // 3. Drone (12x12, 2 frames)
  const drone1 = [
    '    VVVV    ',
    '   VVVVVV   ',
    '  VVCCVVCC  ',
    '  VVCCVVCC  ',
    ' VVVVVVVVVV ',
    'VVVVVBBVVVVV',
    'VVVVBBBBVVVV',
    ' VVVVVVVVVV ',
    '  VVVVVVVV  ',
    '  VV    VV  ',
    ' VV      VV ',
    ' V        V ',
  ];

  const drone2 = [
    '    VVVV    ',
    '   VVVVVV   ',
    '  VVCCVVCC  ',
    '  VVCCVVCC  ',
    ' VVVVVVVVVV ',
    'VVVVBBBBVVVV',
    'VVVVVBBVVVVV',
    ' VVVVVVVVVV ',
    '  VVVVVVVV  ',
    '  VV    VV  ',
    '  VV    VV  ',
    '  V      V  ',
  ];

  const droneColors = {
    V: C.VIOLET,
    C: C.CORAL,
    B: C.AMBER,
  };

  drawPixelMatrix(80, 0, drone1, droneColors);
  drawPixelMatrix(92, 0, drone2, droneColors);

  // 4. Skimmer (14x12, 2 frames)
  const skimmer1 = [
    '     VVVV     ',
    '    VVVVVV    ',
    '   VVVCCVVV   ',
    '  VVVVCCVVVV  ',
    ' VVVVVVVVVVVV ',
    'VVVVVVBBVVVVVV',
    'VV VVVVVVVV VV',
    'V  VVVVVVVV  V',
    '   VVV  VVV   ',
    '   VV    VV   ',
    '   V      V   ',
    '              ',
  ];
  const skimmer2 = [
    '     VVVV     ',
    '    VVVVVV    ',
    '   VVVCCVVV   ',
    '  VVVVCCVVVV  ',
    ' VVVVVVVVVVVV ',
    'VVVVVVBBVVVVVV',
    'VV VVVVVVVV VV',
    'V  VVVVVVVV  V',
    '   VVV  VVV   ',
    '    VV  VV    ',
    '    VV  VV    ',
    '    V    V    ',
  ];
  drawPixelMatrix(104, 0, skimmer1, droneColors);
  drawPixelMatrix(118, 0, skimmer2, droneColors);

  // 5. Lancer (16x16, 2 frames: Idle & Charge)
  const lancerIdle = [
    '      VV      ',
    '     VVVV     ',
    '    VVVVVV    ',
    '   VVVCCVVV   ',
    '  VVVVCCVVVV  ',
    ' VVVVVVVVVVVV ',
    'VVVVVVBBVVVVVV',
    'VV VVVVVVVV VV',
    'VV VVVVVVVV VV',
    'V  VVVVVVVV  V',
    '   VVV  VVV   ',
    '   VV    VV   ',
    '   VV    VV   ',
    '   VV    VV   ',
    '   V      V   ',
    '              ',
  ];
  const lancerCharge = [
    '      CC      ',
    '     CCCC     ',
    '    CCCCCC    ',
    '   CCB  BCC   ',
    '  CCCCBBCCCC  ',
    ' CCCCCCCCCCCC ',
    'VVVVVVBBVVVVVV',
    'VV VVVVVVVV VV',
    'VV VVVVVVVV VV',
    'V  VVVVVVVV  V',
    '   VVV  VVV   ',
    '   VV    VV   ',
    '   VV    VV   ',
    '   VV    VV   ',
    '   V      V   ',
    '              ',
  ];
  drawPixelMatrix(132, 0, lancerIdle, droneColors);
  drawPixelMatrix(148, 0, lancerCharge, droneColors);

  // 6. Mine (12x12, 4 frames)
  const mineFrames = [
    [
      '    CCCC    ',
      '   CBBBBC   ',
      '  CBAAAABC  ',
      ' CBAA  AABC ',
      ' CBA    ABC ',
      ' CBA    ABC ',
      ' CBAA  AABC ',
      '  CBAAAABC  ',
      '   CBBBBC   ',
      '    CCCC    ',
      '            ',
      '            ',
    ],
    [
      '    CCCC    ',
      '   CAAAAC   ',
      '  CA    AC  ',
      ' CA      AC ',
      ' CA      AC ',
      ' CA      AC ',
      ' CA      AC ',
      '  CA    AC  ',
      '   CAAAAC   ',
      '    CCCC    ',
      '            ',
      '            ',
    ],
    [
      '    CCCC    ',
      '   CBBBBC   ',
      '  CBAAAABC  ',
      ' CBAA  AABC ',
      ' CBA    ABC ',
      ' CBA    ABC ',
      ' CBAA  AABC ',
      '  CBAAAABC  ',
      '   CBBBBC   ',
      '    CCCC    ',
      '            ',
      '            ',
    ],
    [
      '    CCCC    ',
      '   CBBBBC   ',
      '  CBCCCCBC  ',
      ' CBC    CBC ',
      ' CBC    CBC ',
      ' CBC    CBC ',
      ' CBC    CBC ',
      '  CBCCCCBC  ',
      '   CBBBBC   ',
      '    CCCC    ',
      '            ',
      '            ',
    ],
  ];
  const mineColors = {
    C: C.CORAL,
    B: C.AMBER,
    A: C.BONE,
  };
  for (let i = 0; i < 4; i++) {
    drawPixelMatrix(164 + i * 12, 0, mineFrames[i], mineColors);
  }

  // 7. Bullets
  // Player Bullet (3x8)
  const pBullet = [
    ' B ',
    'BAB',
    'AAA',
    'AAA',
    'AAA',
    'AAA',
    'AAA',
    ' A ',
  ];
  drawPixelMatrix(0, 16, pBullet, { A: C.AQUA, B: C.BONE });

  // Enemy Bullets (4x4, 2 frames)
  const eBullet1 = [
    ' CC ',
    'CABC',
    'CABC',
    ' CC ',
  ];
  const eBullet2 = [
    'CAAC',
    'ABBA',
    'ABBA',
    'CAAC',
  ];
  const eColors = { C: C.CORAL, A: C.AMBER, B: C.BONE };
  drawPixelMatrix(4, 16, eBullet1, eColors);
  drawPixelMatrix(8, 16, eBullet2, eColors);

  // 8. Power-Up Capsules (10x10)
  // Spread (Aqua with S)
  const dropSpread = [
    '  AAAAAA  ',
    ' AAAAAAAA ',
    'AA SSSS AA',
    'AA S    AA',
    'AA SSSS AA',
    'AA    S AA',
    'AA SSSS AA',
    'AA      AA',
    ' AAAAAAAA ',
    '  AAAAAA  ',
  ];
  // Rapid (Amber with R)
  const dropRapid = [
    '  YYYYYY  ',
    ' YYYYYYYY ',
    'YY RRRR YY',
    'YY R  R YY',
    'YY RRRR YY',
    'YY R R  YY',
    'YY R  R YY',
    'YY      YY',
    ' YYYYYYYY ',
    '  YYYYYY  ',
  ];
  // Shield (Aqua with SH)
  const dropShield = [
    '  AAAAAA  ',
    ' AAAAAAAA ',
    'AA SHSH AA',
    'AA SHSH AA',
    'AA SHSH AA',
    'AA SHSH AA',
    'AA  SH  AA',
    'AA      AA',
    ' AAAAAAAA ',
    '  AAAAAA  ',
  ];
  // Pulse (Violet with P)
  const dropPulse = [
    '  VVVVVV  ',
    ' VVVVVVVV ',
    'VV PPPP VV',
    'VV P  P VV',
    'VV PPPP VV',
    'VV P    VV',
    'VV P    VV',
    'VV      VV',
    ' VVVVVVVV ',
    '  VVVVVV  ',
  ];

  const capsuleColors = {
    A: C.AQUA,
    Y: C.AMBER,
    V: C.VIOLET,
    S: C.BONE,
    R: C.BONE,
    SH: C.BONE,
    P: C.BONE,
  };

  drawPixelMatrix(16, 16, dropSpread, capsuleColors);
  drawPixelMatrix(26, 16, dropRapid, capsuleColors);
  drawPixelMatrix(36, 16, dropShield, capsuleColors);
  drawPixelMatrix(46, 16, dropPulse, capsuleColors);

  // 9. Explosion (16x16, 6 frames)
  const exp1 = [
    '                ',
    '                ',
    '                ',
    '                ',
    '                ',
    '                ',
    '       BB       ',
    '      BAAB      ',
    '      BAAB      ',
    '       BB       ',
    '                ',
    '                ',
    '                ',
    '                ',
    '                ',
    '                ',
  ];
  const exp2 = [
    '                ',
    '                ',
    '                ',
    '                ',
    '      CCCC      ',
    '     CBBBBC     ',
    '    CBAAAABC    ',
    '    CBAAAABC    ',
    '    CBAAAABC    ',
    '    CBAAAABC    ',
    '     CBBBBC     ',
    '      CCCC      ',
    '                ',
    '                ',
    '                ',
    '                ',
  ];
  const exp3 = [
    '                ',
    '                ',
    '     CC  CC     ',
    '    CBB  BBC    ',
    '   CBAA  AABC   ',
    '  CBAA    AABC  ',
    '  CBA      ABC  ',
    '  CBA      ABC  ',
    '  CBA      ABC  ',
    '  CBAA    AABC  ',
    '   CBAA  AABC   ',
    '    CBB  BBC    ',
    '     CC  CC     ',
    '                ',
    '                ',
    '                ',
  ];
  const exp4 = [
    '   C        C   ',
    '  C C      C C  ',
    '   C C    C C   ',
    '    C B  B C    ',
    '   C  BAAB  C   ',
    '  C  BA  AB  C  ',
    '    BA    AB    ',
    '   BA      AB   ',
    '   BA      AB   ',
    '    BA    AB    ',
    '  C  BA  AB  C  ',
    '   C  BAAB  C   ',
    '    C B  B C    ',
    '   C C    C C   ',
    '  C C      C C  ',
    '   C        C   ',
  ];
  const exp5 = [
    '  C          C  ',
    '   B        B   ',
    '    A      A    ',
    '     B    B     ',
    '      A  A      ',
    '       BB       ',
    '  B   A  A   B  ',
    '   A B    B A   ',
    '   A B    B A   ',
    '  B   A  A   B  ',
    '       BB       ',
    '      A  A      ',
    '     B    B     ',
    '    A      A    ',
    '   B        B   ',
    '  C          C  ',
  ];
  const exp6 = [
    ' .            . ',
    '   .        .   ',
    '     .    .     ',
    '                ',
    '   .        .   ',
    '                ',
    ' .    .  .    . ',
    '                ',
    '                ',
    ' .    .  .    . ',
    '                ',
    '   .        .   ',
    '                ',
    '     .    .     ',
    '   .        .   ',
    ' .            . ',
  ];

  const expColors = {
    A: C.BONE,
    B: C.AMBER,
    C: C.CORAL,
    '.': C.BONE_DIM,
  };

  const expList = [exp1, exp2, exp3, exp4, exp5, exp6];
  for (let i = 0; i < 6; i++) {
    drawPixelMatrix(60 + i * 16, 16, expList[i], expColors);
  }

  // 10. Warden Boss (64x48, 3 phase states)
  // Phase 1 (Violet + Aqua Core)
  function drawWarden(startX: number, startY: number, primaryColor: string, secondaryColor: string, coreColor: string) {
    // Left and right symmetric boss body
    for (let r = 0; r < 48; r++) {
      for (let c = 0; c < 32; c++) {
        let color = '';
        // Outer wing shape
        if (r >= 10 && r <= 36 && c >= (48 - r) / 2 && c <= 30) {
          color = primaryColor;
        }
        // Heavy armor plates
        if (r >= 16 && r <= 32 && c >= 8 && c <= 28) {
          color = secondaryColor;
        }
        // Central bridge & core
        if (r >= 20 && r <= 28 && c >= 24) {
          color = coreColor;
        }
        // Heavy cannons
        if ((r <= 8 || r >= 40) && c >= 14 && c <= 20) {
          color = primaryColor;
        }
        // Cannon barrels
        if ((r === 4 || r === 44) && c >= 8 && c <= 14) {
          color = C.BONE;
        }

        if (color) {
          // Draw left side
          ctx!.fillStyle = color;
          ctx!.fillRect(startX + c, startY + r, 1, 1);
          // Draw symmetric right side
          ctx!.fillRect(startX + 63 - c, startY + r, 1, 1);
        }
      }
    }
  }

  // Phase 1: Violet + Void Lift + Aqua Core
  drawWarden(0, 32, C.VIOLET, C.VOID_LIFT, C.AQUA);
  // Phase 2: Violet + Amber + Coral Core
  drawWarden(64, 32, C.VIOLET, C.AMBER, C.CORAL);
  // Phase 3: Coral + Amber + Bone White Core
  drawWarden(128, 32, C.CORAL, C.AMBER, C.BONE);

  cachedAtlasCanvas = canvas;
  return canvas;
}
