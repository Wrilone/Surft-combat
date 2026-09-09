# SURFT COMBAT
### Build Plan: PRD, DRD, TRD, ADR

| | |
|---|---|
| **Product** | Surft Combat |
| **Type** | Browser arcade shoot-em-up, retro 16-bit |
| **Platform** | Next.js 15 (App Router), single client route, static export capable |
| **Owner** | Ridwan Adeshina (Surft) |
| **Version** | 1.0 build plan |
| **Status** | Ready to build |

**Controls at a glance**

| Action | Desktop | Mobile |
|---|---|---|
| Move | Arrow keys (also WASD) | Drag anywhere on the play field |
| Shoot | Spacebar (hold for auto) | Auto-fire while finger is down |
| Special | Shift | Two-finger tap or on-screen pulse button |
| Pause | Esc or P | Tap the HUD pause pip |

---

# 1. PRD: Product Requirements Document

## 1.1 What this is

A single-screen space combat shooter that runs in the browser at 60fps, playable in under a second from page load, with no account, no download, and no tutorial. The player flies a ship, moves in four directions, and shoots forward at waves of enemies. It looks and sounds like a 1991 arcade cabinet.

Surft Combat doubles as a portfolio piece. The domain, the brand mark, and the polish are part of the deliverable, so it needs to survive being shown to a client who is judging your front-end craft.

## 1.2 Who it is for

| Audience | What they need | Why they matter |
|---|---|---|
| Casual player on desktop | Instant play, keyboard controls, one more run | Core loop validation |
| Casual player on mobile | Controls that work with one thumb, no keyboard | Roughly 65% of traffic to a link shared on social |
| Prospective client | Proof that Surft ships polished, performant front-end | The commercial reason this exists |
| Students at the training hub | A readable codebase to learn game loops and canvas from | Teaching material |

## 1.3 Goals

1. A player lands, understands the controls in under 5 seconds, and starts playing without reading anything.
2. A full run lasts 3 to 8 minutes. Death is fast, restart is one key press.
3. Mobile play feels native, not like a desktop game with buttons bolted on.
4. 60fps on a 2019 mid-range Android phone.
5. Time to interactive under 2 seconds on 4G.

## 1.4 Non-goals for v1

- Multiplayer of any kind, local or online.
- Accounts, auth, or a server-side leaderboard.
- Story mode, cutscenes, dialogue.
- Ship customisation or a shop.
- Landscape-only lock on mobile. It must work in portrait.
- Native app wrappers.

## 1.5 Core loop

```
   spawn wave  ->  dodge + shoot  ->  collect drop  ->  clear wave
        ^                                                   |
        |                                                   v
   next sector  <-  boss cleared  <-  wave 5 boss  <-  waves 1-4
```

Death sends the player to a game over card showing score, best score, sector reached, and a restart prompt. No menus in between.

## 1.6 Mechanics

### Player ship

| Property | Value |
|---|---|
| Sprite | 16 x 16 px |
| Hitbox | 8 x 8 px, centred (forgiving, standard for the genre) |
| Speed | 90 px/s in internal resolution units |
| Diagonal | Normalised, so diagonal is not faster |
| Lives | 3 |
| Invulnerability | 1.2s on respawn, ship flashes at 12Hz |
| Base fire rate | 6 shots/s while spacebar is held |
| Bullet speed | 260 px/s upward |

Movement is bounded by the play field with a 4px margin. No screen wrap.

### Enemies

| Enemy | HP | Behaviour | Score | Introduced |
|---|---|---|---|---|
| Drone | 1 | Descends straight, slight drift | 100 | Sector 1, wave 1 |
| Skimmer | 2 | Sine weave across the field | 250 | Sector 1, wave 2 |
| Lancer | 3 | Descends, fires an aimed shot every 1.8s | 400 | Sector 1, wave 4 |
| Mine | 2 | Static, splits into 3 drones on death | 300 | Sector 2, wave 2 |
| Warden (boss) | 40 + 10 per sector | Three-phase pattern, moves horizontally | 5000 | Every wave 5 |

### Waves and sectors

A sector is 5 waves. Wave 5 is always a boss. After a boss, the sector counter increments and difficulty scales:

- Enemy count per wave: `4 + (sector * 2)`, capped at 18.
- Enemy speed multiplier: `1 + (sector * 0.08)`, capped at 1.6.
- Enemy fire rate multiplier: `1 + (sector * 0.12)`, capped at 2.0.

There is no win state. The game runs until the player dies. Score is the measure.

### Power-ups

Dropped by 1 in 8 enemies and always by a boss. Drift downward at 40 px/s, collected on contact.

| Drop | Effect | Duration |
|---|---|---|
| Spread | Three-shot fan | 12s |
| Rapid | Fire rate 6/s to 11/s | 12s |
| Shield | Absorbs one hit | Until used |
| Pulse | Adds one screen-clear charge | Permanent, max 3 |

Picking up a drop the player already has refreshes the timer rather than stacking.

### Scoring

- Base score per kill as per the enemy table.
- Combo multiplier climbs one step per kill, x1 to x8, and decays after 2s without a kill.
- Wave clear bonus: `500 * sector`.
- No-hit sector bonus: 2500.

Best score persists in `localStorage` under `surft.combat.best`.

## 1.7 Controls specification

### Desktop

| Key | Action |
|---|---|
| Arrow Up / W | Move up |
| Arrow Down / S | Move down |
| Arrow Left / A | Move left |
| Arrow Right / D | Move right |
| Space | Fire, hold for continuous |
| Shift | Pulse (screen clear) |
| Esc / P | Pause |
| Enter | Start, restart |
| M | Mute |

Arrow keys and Space must have `preventDefault` applied so the page never scrolls during play. Diagonals are supported, since keys are tracked as a held-key set rather than a single last-pressed key.

### Mobile

The spacebar has no mobile equivalent, so v1 does not simulate one. Instead:

**Default scheme: drag and auto-fire.**
- Touching anywhere in the play field grabs the ship.
- The ship follows the finger with a vertical offset of 48px, so the thumb never covers the ship.
- Firing is automatic while the finger is down.
- Lifting the finger stops movement and firing.
- Two-finger tap triggers Pulse.

**Alternate scheme: on-screen pad.** Selectable in settings for players who prefer it.
- A directional pad bottom-left, a fire button bottom-right, a pulse button above fire.
- Buttons are 64px minimum touch targets with 12px spacing.
- The pad is a floating pad: it appears where the thumb lands within the left third of the screen.

Both schemes must respect `env(safe-area-inset-*)`. Neither may trigger page scroll, pull-to-refresh, text selection, or the iOS magnifier.

## 1.8 Success metrics

| Metric | Target |
|---|---|
| Frame rate, mid-range Android | 60fps sustained, no frame over 20ms |
| Lighthouse performance | 95+ |
| Time to first playable frame | Under 2s on 4G |
| Median session length | Over 3 minutes |
| Runs per session | 2 or more |
| Mobile bounce before first input | Under 25% |

## 1.9 Out of scope, parked for v2

Online leaderboard, ship select, daily seeded run, gamepad rumble, achievements, replay export, sector-specific backdrops.

---

# 2. DRD: Design Requirements Document

## 2.1 Art direction

The reference is not generic pixel art. It is the specific look of a CRT arcade cabinet in a dark room: deep violet void, hot coral and aqua light sources, phosphor bloom on bright pixels, and visible scanlines. The "Surft" name carries a wave, so the aqua channel is used deliberately for anything friendly (shields, drops, wave pulse) while coral and amber carry threat and reward.

Three rules hold the whole thing together:

1. **Everything snaps to the pixel grid.** No sub-pixel positions at render time, no anti-aliasing, no smooth scaling. Positions are floats internally and floored at draw.
2. **Colour has meaning.** Aqua is the player and player-friendly. Coral is damage in both directions. Amber is score and reward. Violet is the enemy tier. Nothing is coloured for decoration.
3. **Boldness is spent on light.** The bloom and the CRT treatment are the memorable thing. The sprites themselves stay simple and readable, and the UI stays quiet.

## 2.2 Colour tokens

Single source of truth. Swap the anchor here and the whole game follows.

```css
:root {
  /* Base */
  --void:        #150B29;  /* backdrop, deepest layer */
  --void-lift:   #241242;  /* nebula bands, panel fills */

  /* Signal */
  --aqua:        #22E4C8;  /* player ship, shields, drops, wave pulse */
  --coral:       #FF4D6D;  /* damage, hit flash, enemy fire, lives */
  --amber:       #FFC23C;  /* score, stars, muzzle flash, combo */
  --violet:      #8B3DD9;  /* enemy hulls, boss armour */

  /* Ink */
  --bone:        #F2EAE4;  /* primary text */
  --bone-dim:    #9C8FA8;  /* secondary text, inactive */
}
```

Contrast check: bone on void is 14.2:1, amber on void is 10.1:1, aqua on void is 9.8:1. All clear WCAG AA at the sizes used. Coral on void is 5.1:1, so coral is never used for body text, only for icons, sprites, and large numerals.

## 2.3 Typography

Two faces, clearly distinct, both self-hosted as woff2 with `font-display: block` so no unstyled flash breaks the illusion.

| Role | Face | Usage |
|---|---|---|
| Display | **Silkscreen**, 400 and 700 | Title, game over, sector banners |
| Interface | **VT323**, 400 | Score, HUD, prompts, settings |

Fallback stack: `"Silkscreen", "Press Start 2P", monospace`.

Type scale, in CSS pixels at the reference viewport:

| Token | Size | Line height | Tracking |
|---|---|---|---|
| `--type-title` | 48px | 1.0 | 0.02em |
| `--type-banner` | 28px | 1.1 | 0.02em |
| `--type-hud` | 20px | 1.0 | 0 |
| `--type-body` | 18px | 1.4 | 0 |
| `--type-micro` | 14px | 1.2 | 0.04em |

Because both faces are bitmap-derived, sizes must be integer multiples where possible to avoid blurry glyphs. Do not use fractional font sizes.

## 2.4 Canvas and scaling

| Property | Value |
|---|---|
| Internal resolution | 320 x 180 |
| Aspect | 16:9 |
| Scaling | Integer nearest-neighbour, `image-rendering: pixelated` |
| Max scale | Whatever integer fits the viewport, capped at 6x |
| Letterbox fill | `--void` |

On a 1920 wide desktop the game renders at 5x (1600 x 900) centred with letterboxing. On a 393 wide phone in portrait it renders at 1x width-fit and the play field is rotated conceptually: see the portrait handling below.

### Portrait handling

The game is designed 16:9 landscape but must be playable in portrait. Rather than forcing rotation, portrait uses a **9:16 internal field of 180 x 320** with the same sprites and speeds. Wave spawn patterns are defined in normalised 0 to 1 coordinates so they map to either orientation without re-authoring.

A rotation hint is shown once, dismissible, never blocking.

## 2.5 Sprite specification

| Asset | Size | Frames | Notes |
|---|---|---|---|
| Player ship | 16 x 16 | 3 (neutral, bank-left, bank-right) | Banks on horizontal input |
| Player thruster | 8 x 8 | 4 | Loops at 12fps |
| Drone | 12 x 12 | 2 | Idle wobble |
| Skimmer | 14 x 12 | 2 | |
| Lancer | 16 x 16 | 2 | Charge tell on frame 2 before firing |
| Mine | 12 x 12 | 4 | Pulsing ring |
| Warden boss | 64 x 48 | 3 | Phase-coloured armour |
| Player bullet | 3 x 8 | 1 | Aqua core, bone tip |
| Enemy bullet | 4 x 4 | 2 | Coral, rotating |
| Drop capsule | 10 x 10 | 4 | Colour keyed to type |
| Explosion | 16 x 16 | 6 | Plays at 24fps |

All sprites ship in one atlas: `sprites.png`, power-of-two, with a JSON frame map. One image request total.

## 2.6 HUD layout

Landscape:

```
+--------------------------------------------------------------+
| SCORE 012,450          x4          SECTOR 3-2      ||| [||]   |
|                                                              |
|                                                              |
|                      . *      .        *                     |
|                                                              |
|              [drone]        [drone]                          |
|                     [skimmer]                                |
|                                                              |
|                                                              |
|                          A                                   |
|                        /|_|\   <- player                     |
|                                                              |
| BEST 048,900                                    PULSE  ()()  |
+--------------------------------------------------------------+
```

Portrait:

```
+------------------------+
| SCORE 012,450     |||  |
| x4          SECTOR 3-2 |
|                        |
|      .        *        |
|   [drone]   [drone]    |
|      [skimmer]         |
|                        |
|                        |
|          A             |
|        /|_|\           |
|                        |
|                        |
|  BEST 048,900   () ()  |
|   [ safe area inset ]  |
+------------------------+
```

HUD rules:
- Score is left aligned and monospaced so digits do not jitter as it climbs.
- Lives render as ship pips, not numbers.
- The combo multiplier only appears at x2 and above, and it pops 120% for 100ms on increment.
- The HUD is drawn on a separate canvas layer above the game canvas so it never forces a full redraw.

## 2.7 Motion and feel

The genre lives or dies on feedback. Every one of these is required, not optional.

| Event | Response |
|---|---|
| Player fires | 1px recoil on the ship, amber muzzle flash for 50ms |
| Bullet hits enemy | Enemy flashes bone white for 60ms, 3 amber sparks |
| Enemy dies | 6-frame explosion, 4px screen shake for 120ms |
| Player takes a hit | Screen flashes coral at 30% for 80ms, 8px shake, 500ms hit-stop at 0.25x time scale |
| Drop collected | Aqua ring expands from the ship, HUD label pops |
| Pulse fired | Full-screen aqua wash fading over 400ms, all enemy bullets cleared |
| Boss phase change | Screen freezes 200ms, boss flashes violet to coral |
| Wave clear | Banner slides in from the right, holds 1.2s, slides out |

Screen shake is a decaying random offset applied to the game canvas transform, never to the HUD layer. It must be capped at 8px and fully disabled under `prefers-reduced-motion`, replaced with a brief border flash instead.

Parallax starfield: three layers at 10, 22 and 45 px/s, sized 1px, 1px and 2px, tinted bone-dim, bone-dim and amber respectively.

## 2.8 Audio

Procedural, generated with the Web Audio API. No audio files, no library, so nothing to download.

| Sound | Synthesis |
|---|---|
| Player shot | Square wave, 880Hz to 220Hz over 60ms, short decay |
| Enemy hit | Noise burst, 40ms, band-passed at 2kHz |
| Explosion | Noise, 300ms, low-pass sweeping down from 4kHz |
| Player death | Square, 440Hz to 55Hz over 700ms |
| Drop pickup | Triangle arpeggio, three notes ascending, 120ms |
| Pulse | Sine sweep 60Hz to 1200Hz, 400ms, plus noise wash |
| Music | Two-channel loop: square lead, triangle bass, 128 BPM, 16-bar pattern per sector |

Audio must not initialise until the first user gesture, per browser autoplay policy. Mute state persists in `localStorage`.

## 2.9 Accessibility

- All motion effects respect `prefers-reduced-motion: reduce`.
- A high-contrast toggle raises enemy outlines to bone.
- Hitboxes are visually generous and can be shown with a debug toggle.
- Colour is never the only signal: enemy tiers differ in silhouette as well as hue.
- The game is pausable at any moment and the pause state is not timed.
- Keyboard focus is visible on all menu controls, and menus are fully operable without a mouse.
- A "slow mode" option runs the simulation at 0.75x for players who need more reaction time. Score is unaffected, since this is not competitive.

---

# 3. TRD: Technical Requirements Document

## 3.1 Stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js, App Router | 15.x |
| Language | TypeScript, strict mode | 5.x |
| Rendering | Canvas 2D API | native |
| Styling | CSS Modules plus custom properties | native |
| Audio | Web Audio API | native |
| State (UI shell) | React `useState` and `useReducer` | 19.x |
| State (simulation) | Plain TS classes in a module, outside React | n/a |
| Storage | `localStorage` | native |
| Testing | Vitest plus Testing Library, Playwright for smoke | latest |
| Deploy | Vercel | n/a |

No game engine, no physics library, no state management library, no animation library. The whole point is a small, readable, dependency-light codebase.

## 3.2 Project structure

```
surft-combat/
├── app/
│   ├── layout.tsx              # fonts, metadata, theme colour
│   ├── page.tsx                # server shell, renders <GameClient/>
│   ├── globals.css             # tokens, resets, touch-action rules
│   └── opengraph-image.tsx     # generated share card
├── components/
│   ├── GameClient.tsx          # 'use client', owns canvas refs + lifecycle
│   ├── Hud.tsx                 # score, lives, combo, sector
│   ├── TitleScreen.tsx
│   ├── GameOverCard.tsx
│   ├── PauseOverlay.tsx
│   ├── TouchControls.tsx       # floating pad, alternate scheme only
│   └── OrientationHint.tsx
├── game/
│   ├── Engine.ts               # fixed-timestep loop, orchestration
│   ├── Renderer.ts             # all draw calls, camera shake, layers
│   ├── World.ts                # entity pools, spawn, collision, scoring
│   ├── config.ts               # every tunable number, one file
│   ├── entities/
│   │   ├── Entity.ts           # base: pos, vel, hitbox, alive, update
│   │   ├── Player.ts
│   │   ├── Enemy.ts            # behaviour switched by type
│   │   ├── Bullet.ts
│   │   ├── Drop.ts
│   │   └── Boss.ts
│   ├── systems/
│   │   ├── collision.ts        # spatial hash broadphase, AABB narrow
│   │   ├── spawner.ts          # wave definitions, normalised coords
│   │   ├── particles.ts        # pooled, no allocation in the loop
│   │   └── camera.ts           # shake, hit-stop, time scale
│   ├── input/
│   │   ├── InputState.ts       # the intent object every source writes to
│   │   ├── keyboard.ts
│   │   ├── touch.ts
│   │   └── gamepad.ts
│   ├── audio/
│   │   ├── AudioBus.ts
│   │   ├── sfx.ts
│   │   └── music.ts
│   └── assets/
│       ├── atlas.ts            # frame map
│       └── sprites.png
├── lib/
│   ├── storage.ts              # typed localStorage wrapper, SSR safe
│   └── format.ts               # score padding, time formatting
└── public/
    └── fonts/
```

## 3.3 The game loop

Fixed timestep with an accumulator and interpolated rendering. This is non-negotiable: a variable timestep makes collision unreliable and makes the game literally faster on a 120Hz display.

```ts
const STEP = 1 / 60;          // simulation step in seconds
const MAX_FRAME = 0.25;       // clamp, prevents spiral of death after a tab stall

let accumulator = 0;
let last = performance.now();

function frame(now: number) {
  raf = requestAnimationFrame(frame);

  let delta = (now - last) / 1000;
  last = now;
  if (delta > MAX_FRAME) delta = MAX_FRAME;

  accumulator += delta * camera.timeScale;   // hit-stop scales time here

  while (accumulator >= STEP) {
    world.update(STEP, input.snapshot());
    accumulator -= STEP;
  }

  renderer.draw(world, accumulator / STEP);  // alpha for interpolation
}
```

Requirements:
- The loop pauses on `visibilitychange` and resets `last` on resume so a backgrounded tab does not fast-forward.
- `input.snapshot()` returns an immutable read of the current intent so a mid-step input change cannot desync the two sub-steps in one frame.
- Zero object allocation inside `update` and `draw`. Everything is pooled. This is what keeps the GC quiet and the frame time flat.

## 3.4 Input abstraction

Every input source writes into one shape. The simulation never knows whether a human used a keyboard, a thumb, or a gamepad.

```ts
export interface InputState {
  moveX: -1 | 0 | 1 | number;   // -1 left .. 1 right, analog from touch
  moveY: -1 | 0 | 1 | number;   // -1 up .. 1 down
  firing: boolean;
  pulse: boolean;               // edge-triggered, consumed on read
  pause: boolean;               // edge-triggered
}
```

**keyboard.ts** tracks a `Set<string>` of held codes. `moveX` is `(right ? 1 : 0) - (left ? 1 : 0)`. Diagonal vectors are normalised in `Player.update`, not here. `preventDefault` is applied to `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, and `Space` only, and only while the game is in a playing state, so page scroll still works on the title screen.

**touch.ts** implements both schemes. In drag mode it converts the touch position to internal-resolution coordinates, applies the 48px thumb offset, and produces a normalised direction vector toward the target with a 2px deadzone. `firing` is true whenever a touch is active. Listeners are attached with `{ passive: false }` so `preventDefault` works on `touchmove`.

**gamepad.ts** polls once per frame via `navigator.getGamepads()`. Left stick and d-pad map to move, A or right trigger to fire. This is 30 lines and worth having.

CSS support required on the canvas container:

```css
.playfield {
  touch-action: none;
  overscroll-behavior: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
```

## 3.5 Collision

- Broadphase: uniform spatial hash, 32px cells in internal units. Rebuilt each step from the active entity pools.
- Narrowphase: AABB overlap. No rotation, no SAT, no physics resolution. Collisions are events, not forces.
- Pairs checked: player bullets against enemies, enemy bullets against player, enemies against player, drops against player. Nothing else.
- Enemy against enemy is never checked. It saves the majority of the work and the player cannot tell.

Worst case is roughly 200 entities. Even a naive O(n²) pass would hold 60fps, but the spatial hash keeps headroom for particle-heavy boss phases.

## 3.6 Rendering

Two stacked canvases:

| Layer | Canvas | Redraw |
|---|---|---|
| Game | `#game` | Every frame, full clear |
| HUD | `#hud` | Only when a HUD value changes |

Renderer requirements:
- `ctx.imageSmoothingEnabled = false` on both contexts, reset after any canvas resize since resizing clears context state.
- All draw positions passed through `Math.floor` before `drawImage`.
- Sprites drawn from the single atlas via the 9-argument `drawImage`.
- Screen shake applied with `ctx.translate` on the game layer only, inside a `save`/`restore` pair.
- Backing store sized to `internalWidth * scale` with `canvas.style` sized in CSS pixels. Do not multiply by `devicePixelRatio`: at integer nearest-neighbour scaling the extra pixels buy nothing and cost fill rate.

Resize handling debounces at 150ms, recomputes the integer scale, resizes both canvases, and forces a HUD repaint.

## 3.7 State machine

```
      BOOT
        |
        v
      TITLE  <----------------------+
        |  (Enter / tap)            |
        v                           |
     PLAYING <---> PAUSED           |
        |                           |
        | (lives = 0)               |
        v                           |
     GAME_OVER  --------------------+
```

`BOOT` loads the atlas and fonts, shows a two-second-max loading state, and never blocks on audio. The state lives in React because it drives which overlay component renders. The simulation state lives outside React entirely.

## 3.8 Performance budget

| Metric | Budget |
|---|---|
| Frame time, p95 | Under 8ms |
| Frame time, max | Under 20ms |
| Heap growth over a 5-minute run | Under 2MB |
| GC pauses during play | Zero major |
| JS bundle, game chunk gzipped | Under 60KB |
| Total transfer, first load | Under 180KB |
| LCP | Under 1.5s on 4G |
| CLS | 0 |

Enforcement: a dev-only overlay (toggled with backtick) showing FPS, frame time, entity count, and pool utilisation.

## 3.9 Persistence

```ts
interface SurftSave {
  best: number;
  sectorsCleared: number;
  muted: boolean;
  controlScheme: 'drag' | 'pad';
  reducedMotion: boolean | null;   // null = follow system
  runs: number;
}
```

Stored under one key, `surft.combat.v1`, as JSON. All reads are wrapped in try/catch and return defaults, since Safari private mode throws on write. All access is guarded by a `typeof window` check so SSR does not break.

## 3.10 Testing

| Level | Tool | Coverage |
|---|---|---|
| Unit | Vitest | Collision maths, spawn tables, score and combo logic, input normalisation, storage wrapper |
| Component | Testing Library | HUD renders correct values, overlays mount per state |
| Integration | Vitest with a headless step driver | Run 600 simulated steps with a scripted input tape, assert deterministic score |
| E2E smoke | Playwright | Page loads, canvas mounts, keydown moves the ship, touch drag moves the ship |
| Manual device | Real hardware | iPhone SE, a mid-range Android, iPad, 1080p and 1440p desktop |

The determinism test matters most: with a fixed timestep and a seeded RNG, the same input tape must always produce the same score. That single test catches most physics and ordering regressions.

## 3.11 SEO, sharing, and PWA basics

- `metadata` in `layout.tsx` with title, description, and theme colour `#150B29`.
- Generated OG image via `opengraph-image.tsx` showing the title treatment on the void backdrop.
- `manifest.json` with icons, `display: fullscreen`, `orientation: any`.
- `viewport-fit=cover` plus `user-scalable=no` on the viewport meta, so double-tap zoom does not fight the controls.

---

# 4. ADR: Architecture Decision Records

Format for each: context, decision, consequences, alternatives considered.

---

### ADR-001: Next.js App Router with a single client route

**Context.** The game is one screen. Next.js brings routing, bundling, font optimisation, image handling, and Vercel deployment, but the game itself is a client-only canvas application that cannot server-render.

**Decision.** Use the App Router. `app/page.tsx` stays a server component that renders metadata, the OG card, and a `<GameClient />` marked `'use client'`. Everything under `game/` is imported only from the client component.

**Consequences.** Positive: real HTML for crawlers and share cards, font optimisation, near-zero deploy config. Negative: a hydration boundary to respect, and any accidental import of `game/` from a server component crashes the build on `window`. Guard all browser access behind `useEffect` or `typeof window`.

**Alternatives.** Plain Vite SPA (smaller, but loses SSR metadata and the framework story a client wants to see). Astro (good, but overkill for one route).

---

### ADR-002: Canvas 2D, not WebGL and not DOM

**Context.** Peak load is around 200 sprites plus 150 particles at 60fps on mobile.

**Decision.** Canvas 2D with a single sprite atlas.

**Consequences.** Positive: no shader code, no context loss handling, trivial to debug, tiny bundle, readable for the students at the hub. Negative: a hard ceiling around 1000 to 2000 sprites per frame, and no free shader effects, so CRT scanlines and bloom are done with a pre-rendered overlay and additive composite rather than a fragment shader.

**Alternatives.** WebGL via a thin wrapper (10x the headroom, but adds complexity the entity count does not justify). DOM sprites (dies past about 100 elements). PixiJS (roughly 130KB gzipped for capability that is not needed here).

---

### ADR-003: Fixed timestep with an accumulator

**Context.** Displays run at 60, 90, 120, and 144Hz. A `delta`-scaled variable timestep makes the game speed device-dependent and makes fast bullets tunnel through thin hitboxes.

**Decision.** Simulate at a fixed 1/60s. Accumulate real time, run as many whole steps as fit, interpolate the render by the leftover fraction. Clamp any frame delta above 250ms.

**Consequences.** Positive: identical behaviour on every device, deterministic and therefore testable, collision is reliable. Negative: the render interpolation is extra code, and a device that cannot hit 60fps will run multiple sim steps per frame and feel heavy. The clamp bounds this.

**Alternatives.** Variable timestep (simpler, unacceptable for the reasons above). Fixed timestep without interpolation (visible judder at 120Hz).

---

### ADR-004: Hand-written entity pools, no ECS and no engine

**Context.** The scope is roughly 6 entity types with simple behaviour. It is also teaching material.

**Decision.** A small `Entity` base class, one subclass per type, held in pre-allocated pools with an `alive` flag. `update` and `draw` iterate the pools a