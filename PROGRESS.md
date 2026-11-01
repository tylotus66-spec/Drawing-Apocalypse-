# DRAWING APOCALYPSE — Progress record

Workflow (spec §24): BUILD → PLAY → IDENTIFY ONE PROBLEM → DIRECT A FIX → PLAY AGAIN → LOCK IT → NEXT SYSTEM.

## v0.2.3 — ORB matched to Ty's exact reference (design-ref/orb-exact.jpg) · sw.js v0.2.3 · headless-tested only
- **Hybrid ORB.** `da-tools/make_orb_assets.py` derives texture layers from orb-exact.jpg into `img/orb/`:
  - Sphere interior (galaxy + glass) as a square crop of the fitted circle (centre 744,600, r 456), 1024 and 512 px.
  - The flame ring as RGBA with the background keyed out (magenta hue + saturation + value key, white filaments kept only inside plumes, only regions connected to the ring), 1024 and 512 px.
  - A mask of the baked-in blue lightning (512).
  - A flattened static still (512) for the no-WebGL fallback.
  - One small asteroid inside the sphere was inpainted out. Rocks, space and nebula outside are not included.
- **Animated in WebGL** (`js/orb.js`):
  - The galaxy swirls slowly back and forth inside the glass. The swirl is zero at the rim, so the reference's glass reflections and thick rim stay fixed. The core breathes, and stars twinkle.
  - The flame plumes flow outward (two-phase flow-map sampling) with noise billow and flicker, and swell when ORB speaks.
  - The baked lightning flickers region by region, and 3 thin procedural bolts (1 in lite) strike sparsely on top.
  - Ty's specular `pow(…,380.)*2.4` is kept as a subtle layer (×0.3) under the reference's own reflections.
- **Layout.** The sphere is now 62% of the ORB box (was 50%). Slot sizes were scaled so the sphere stays the same size on every screen.
- **Lite / reduced motion.** Lite uses the 512 layers, a single flow phase, 1 bolt and no twinkles. Reduced motion runs at 30 fps and 0.35x speed. Adaptive resolution is unchanged.
- **Canvas2D fallback** draws the static still.
- All ORB assets are precached by the service worker.

## v0.2.2 — ORB fidelity pass · sw.js v0.2.2 · headless-tested only
- **Flames:** three layers of curling tongues (26/39/57 per ring) with translucent crimson bodies, bright hot-pink outlines and a Voronoi crackle-vein network. They surround the whole perimeter and are tallest on top. A thin hot-pink rim line is drawn where the flames meet the glass.
- **Galaxy:** larger tilted disk with 2+4-arm tighter spirals, dust lanes, star-cloud grain, a peach bulge and a brighter white core. Purple dust clouds and denser stars (three layers).
- **Lightning:** 6 bolts (3 in lite). Each is lit about 90% of its cycle, so several are visible in any frame. They are thicker and use 3-octave fractal jag with 3 forked branches each, in neon blue-violet. They start round the rim and cross the sphere, and thin out over the bright core.
- **Specular:** Ty's `pow(…,380.)*2.4` hotspot kept. A sharp thin curved crescent reflection and a translucent pink glass lip are layered on top.
- **Cost:** heavier than v0.2.1. Cheaper noise is used where possible, and the adaptive-resolution floor drops from 0.5 to 0.4. Measured with `da-tools/orbfps.py` (SwiftShader CPU, not representative of phone GPUs): full quality about 35–53 fps at 393 px after adapting; lite 60 fps.

## v0.2.1 — visual correction pass (not Phase 3) · sw.js v0.2.1 · headless-tested only
- **ORB rebuilt** (`js/orb.js`, one WebGL fragment shader, one canvas re-parented between screens): black-glass sphere; procedural tilted spiral galaxy with white core and hot-pink/magenta arms; star field; animated branching neon-blue lightning clipped inside the glass; curved specular arcs + hotspot; animated hot-pink flame tongues with veins and sparks around the **entire** perimeter (tallest on top). Blue/cyan is used only inside the ORB.
  - Carries Ty's `orb1` tuning (commit 820e615) at equal or stronger values: flame pulse `*(1+.15*sin(t*2.3))` and speak swell, flame alpha `(… +.4*uSpeak)` with `col*1.6`, `alpha*1.1`; arms `pow(…,2.2)`; arm colour `mix((1,.05,.55),(1,.35,.8),clump)`; white core ×3.4; lightning ×1.35 with an inward mask; specular `pow(…,380)*2.4`.
  - Performance: DPR capped at 2, canvas capped at 720 px (480 px lite). Lite path (reduced motion or Low graphics) drops extra star layer, flame veins and half the bolts, and runs at 30 fps. Adaptive resolution lowers the pixel count when frames run slow. Canvas2D fallback unchanged.
- **Scaled everywhere**: large on the ORB intro (replaces the flattened logo-orb image; the logo lettering sits above the live ORB), large on HOME overlapping the logo, extra-large on the new **ORB guide** screen, scaled in onboarding steps, section headers and the Ask ORB sheet. The flame box never blocks taps.
- **New ORB guide screen** (`#/orb`, design sheet screen 9): reached by tapping the HOME ORB or "Talk to ORB". Real guidance line, four real destinations (Survival, Drawing, Create, Vault), Hear guidance, Ask ORB. Story is not listed, because it is not in the build plan yet.
- **CREATE** (sheet screen 6): the creator layout (species and element lists showing real unlocks, a plain outline silhouette, Appearance/Style/Element/Abilities/Preview toolbar, CREATE AVATAR) is shown **inactive**. Every control is disabled and labeled Phase 6. The level-5 seal and XP bar are unchanged.
- Not changed: Drawing, Survival, Vault and Settings layouts (rechecked against the sheet).
- Tests: `da-tools/v021test.py`, 78 checks (the 60 Phase 2 checks plus 18 new ones). Screens: `drawing-apocalypse-shots/v021-*`.

## Phase 2 — status: BUILT, headless-tested (Chromium), awaiting on-device test · sw.js v0.2.0
Build order per Ty's FINAL master blueprint (design-ref/FINAL-BLUEPRINT-NOTES.md, 2026-10-31): P1 foundation · **P2 core screens** · P3 PLAYABLE SURVIVAL · P4 ORB · P5 learning system · P6 progression/creator · P7 other modes one at a time · P8 polish/testing.

### Done in Phase 2
- **DRAWING** (design sheet screen 5): left category rail (ALL + 10 categories), featured card, 2-column lesson grid, search, difficulty filter (Beginner/Intermediate/Advanced/Expert), favorites filter, footer "MASTER THE ART. WATCH. LEARN. EVOLVE.".
  - 40 lessons in `content/tutorials.json` (schema 2, 4 per category, one per difficulty), all with real written steps.
  - FEATURED: **FIRE WYVERN**, 12 steps; the reference image is the drawing at **step 5 of 12** (wings blocked in).
  - Thumbnails: original SVG construction sketches generated in code (`da-tools/gen_thumbs.py`), one per lesson, related to the lesson subject. They are simple line sketches, not finished artwork.
  - Lesson page: honest "Video not uploaded yet" panel when there's no video (39 of 40 lessons). Step card (step N of M, prev/next, dots, ORB reads the step aloud with subtitles), full step list, favorite, completion.
  - Real HTML5 player when a lesson has video (`js/player.js`): play/pause, seek, time, volume, mute, captions on/off (WebVTT), speed 0.5–1.5×, fullscreen (iPhone uses native video fullscreen), previous/next step jumps (`stepTimes`), step panel follows the video, resume position. The only video is the 50-second "Sphere of Light" DEMO ANIMATION (generated in code, labeled in-app as demo animation, not tutorial footage).
  - Progress per lesson saved in `profile.tutorials` (step, studied steps, video position). Completion needs every step studied (4 s dwell or played through). XP once per lesson (`lesson:<id>`), daily "Complete a drawing lesson" live, achievement "First Lesson" live.
- **HOME**: Continue Last Activity resumes the exact lesson (or vault tab / survival mode); DRAWING tile shows real lessons-done count.
- **SURVIVAL** (screen 2): 6-mode list with honest status (Zombie Infection = next up, first playable in P3; Multiplayer = needs a server; others planned P7). CONFIRM opens the landscape preview; Exit returns to the list. No mode is playable.
- **CREATE**: locked view with real XP progress to level 5; unlocked view at level 5 (by real XP; screenshot used test-injected XP). The full creator is P6.
- **VAULT** (screen 7): tabs Characters / Elements / Weapons / Stories / Records / Achievements; collection progress computed from real unlocks; the 7 official characters shown locked; Records = completed / in-progress lessons, favorites, survival records (none), full reward & unlock history.
- **SETTINGS** (screen 10): profile card (UID, Edit) + drill-down list. Master / music / SFX / ORB voice volume, subtitles, reduced motion, aim + camera sensitivity, touch layout + button size, graphics, reset settings with confirm, delete profile with confirm. All persisted.
- **Gamepad menu navigation** (`js/gamepad.js`, standard mapping): D-pad/left stick moves focus, A activates, B back, LB/RB switch tabs. Tested only with a simulated pad in headless Chromium, not a real PS/Xbox/Backbone controller.
- **18+ section: NOT built (held).** If built later it must be gated in Settings, never a primary tab, labeled "ORB After Dark (18+)" or "18+ ORB". The name "Ink Orb" is never used.

### Known gaps / limitations (Phase 2)
- 39 of 40 lessons have no video. Durations are not shown for them (no fake stats).
- Coins/currency from the design sheet are not shown: no currency system exists.
- ORB guide screen (sheet 9) restyle not done; the Ask ORB sheet is unchanged.
- Lesson XP for repeated completions: none (once per lesson by design). The daily lesson challenge needs a lesson not completed before.
- `tutorials.json` updates reach installed phones on the second launch (cache-first + background refresh).
- Not tested on a real iPhone/Android, with a real controller, or in Safari/WebKit.

## Direction for later phases (recorded from Ty, binding)
- **Shooter art style**: 3D realistic — realistic characters, ruined city and corridor environments, fire, smoke, dramatic lighting.
- **Gameplay feel like Call of Duty Mobile**: twin-thumb controls (left move stick, right drag-to-aim), large fire button, ADS, crouch/jump/reload, minimap, killfeed, loadouts, polished edge HUD — all in our own art, colors and branding. **Never copy COD assets or branding.**
- **Graphics like COD Mobile**: PBR materials, dynamic lighting, post-processing (bloom, fog), polished HUD and menus.
- **Wireless controllers** (Gamepad API: PS / Xbox / Backbone): standard mapping, remappable buttons, aim assist, on-screen button prompts, touch controls auto-hide when a pad connects. Only claimed after testing.
- **Survival HUD references** (`design-ref/survival-hud*.jpg`) are for the shooter phases. ⚠ The mockups use **cyan/blue** HUD accents; our UI stays **pink/purple** with white text, so the HUD will be recolored.
- **Phase 3 = PLAYABLE SURVIVAL** (next): ruined city at night, human survivor with a pistol, move/aim/shoot/reload, health/ammo/damage, zombies spawn/chase/attack/die, survive 60 s or reach extraction, win/lose/restart/results. Controls: WASD/arrows + mouse + click + R + Esc on desktop; move stick + aim area + shoot + reload + pause with multitouch on phones.

## Phase 1 — status: BUILT, headless-tested, awaiting on-device play test

### Completed systems
- **App foundation**: an installable PWA (manifest, icons rendered from the ORB shader, offline service worker `sw.js` v0.1.0) with relative paths for GitHub Pages and a push-to-main deploy workflow.
- **Navigation**: exactly five primary tabs (HOME, DRAWING, SURVIVAL, CREATE, VAULT) with animated transitions and safe-area insets. There is no page scroll; only the inner screen content scrolls. SETTINGS is a secondary screen opened from HOME, not a tab.
- **Orientation**:
  - HOME, DRAWING, CREATE and VAULT are portrait. A "turn upright" overlay appears on phones held in landscape.
  - SURVIVAL requests fullscreen and `screen.orientation.lock('landscape')` inside the tap gesture. Where that isn't supported (iPhone Safari), a "rotate your phone" overlay with an Exit button appears instead. Exit releases the lock and fullscreen.
- **Visual identity**: black and near-black, deep purple, hot pink and magenta, black-glass panels, drifting nebula, and ember/ash particle atmosphere (strongest on HOME). There are no blue or cyan UI accents.
- **ORB renderer** (`js/orb.js`): a single WebGL fragment shader draws a ray-traced, perfectly round black-glass sphere.
  - Inside: a volumetric purple nebula, a tilted rotating spiral galaxy (white core, hot-pink and magenta arms, star clusters), two star layers, six orbiting asteroids, shooting stars, and neon-blue lightning bolts masked so they stay inside the glass.
  - Glass: curved white highlights near the top, with no seams or rings.
  - Outside: a hot-pink flame halo around the perimeter, small at idle and larger and faster while speaking.
  - Motion: bobbing, and a brightness pulse on interaction.
  - One canvas is moved between screens so ORB looks identical everywhere.
  - Canvas2D fallback for devices without WebGL, plus recovery if the WebGL context is lost.
  - Graphics quality, FPS cap and reduced-motion settings are honored.
- **ORB voice** (`js/voice.js`): Web Speech API using the deepest-sounding English voice found by a name heuristic (a manual voice picker is in Settings). Pitch 0.55, rate 0.82, sentence-by-sentence delivery with natural pauses, and a WebAudio cosmic hum underneath. Subtitles are always shown when voice is off and can be toggled when it's on (three sizes). Voice on/off and volume settings are honored.
- **ORB guidance**:
  - Tapping ORB on any screen speaks contextual tips for that screen.
  - "Ask ORB" answers typed questions by keyword-matching 14 written help topics. It's labeled in the UI as scripted guide topics, not AI.
  - ORB announces level-ups and unlocks.
- **Onboarding**: "Awaken ORB" (the tap also unlocks audio on iOS), then ORB asks for a username (validated, optional profile image), then a narrated tour of the five sections, then a one-time +100 XP reward and a lore entry.
- **HOME dashboard**:
  - Profile: avatar, name, level, title, XP bar.
  - Notifications bell with unread count, and the settings gear.
  - ORB hero with a dynamic message: new-player guidance, or for returning players a summary of rewards and open challenges.
  - Four main actions that open the right sections. CONTINUE DRAWING deep-links to the Fire Wyvern lesson.
  - Daily challenges with progress, Claim buttons and a reset countdown.
  - Progression card: level, XP, elements, species, achievements, missions, tutorials, streak, and available rewards.
  - Featured mission, featured tutorial, current avatar card, and player statistics.
- **Account / data layer** (`js/store.js`):
  - Local profile behind an async adapter interface. `LocalAdapter` is live; the `RemoteAdapter` contract is documented for the backend.
  - Export and import of a backup JSON file, with an integrity check on import.
  - Delete profile, which restarts onboarding.
- **SETTINGS** (spec §19), all persisted:
  - Account: name, image, backup.
  - Audio: master, music, SFX and voice volumes; voice on/off; voice picker; test voice; subtitles and subtitle size.
  - Language: English for now.
  - Display: graphics quality, 30/60 FPS, interface scaling.
  - Controls: camera and aim sensitivity, layout, button size, vibration, controller rumble, live Bluetooth gamepad detection, and the default mapping table.
  - Accessibility: reduce motion, high contrast, larger text.
  - Notifications: per-category toggles.
  - Privacy: statement, reset settings, delete data.
- **Unified progression** (`js/progression.js` + `js/config.js`):
  - XP curve; level unlock table in one config file (Level 5 = CREATE).
  - XP is the sum of an append-only ledger of unique reward ids, so duplicates are impossible and levels and unlocks are derived from it.
  - Daily reset by local date, plus a streak counter.
  - 14 achievements (8 live in Phase 1, 6 phase-gated, all with real counters).
  - Notifications log.
  - Tamper detection hash on the local save.
- **Real XP sources in Phase 1**:
  - Onboarding: 100 XP, once.
  - "Talk to ORB": 25 XP per day.
  - "Visit every section": 40 XP per day.
  - Achievements: First Steps, Explorer, Curious Mind, Listener, Element Seeker, Dedicated, Devoted, Challenger.
  - There is no grant-XP button.
- **CREATE**: enforced Level 5 lock UI showing the current level, an XP bar toward level 5 and what unlocks. Once a player reaches level 5, an "unsealed" state appears with an honest Phase 6 panel.
- **VAULT**:
  - All 30 official elements in spec order, shown locked or unlocked from real progression. FIRE is the starting element (`START_UNLOCKS` in config). Each element has a detail sheet with its description, four abilities and the unlock level.
  - Achievements, with real progress.
  - Characters: species unlocks and selectable earned titles.
  - Drawing: saved tutorials.
  - Weapons: Phase 3 panel.
  - Collectibles: lore entries.
- **DRAWING**:
  - 10 categories × 4 difficulties as browsable structure, loaded from `content/tutorials.json` (a CMS-ready manifest).
  - The Fire Wyvern 12-step lesson page shows an honest "video not uploaded yet" state.
  - Bookmarking is persisted.
  - There is no drawing canvas and no fake playback.
- **SURVIVAL**: a landscape placeholder screen showing the real fullscreen, orientation-lock and controller status, with a working Exit.
- **Audio**: WebAudio master, music, sfx and voice buses. Synthesized original sounds: tap, nav, toggle, deny, claim, unlock, achievement, level-up and ORB. An ambient cosmic music bed.

### Known bugs / limitations (Phase 1)
- **Voice reverb isn't possible on the web**: browsers don't let speechSynthesis audio pass through WebAudio, so the "subtle cinematic reverb" can't be applied. Voice depth depends on the voices installed on the phone. A recorded or neural TTS voice (a later asset or service) would fix both.
- **iPhone**:
  - Safari has no element Fullscreen API and no orientation lock, so SURVIVAL relies on the rotate overlay. As a Home Screen app it already runs without browser chrome.
  - Web vibration isn't supported, so the setting notes this.
- **Daily reset uses the phone clock**, so it can be cheated by changing the date. The local integrity hash only detects casual edits. Real anti-cheat needs server validation (§20).
- **Android back button**: tab changes use `history.replaceState`, so the back button leaves the app instead of stepping back through tabs.
- **Testing gaps**: tested in headless Chromium (SwiftShader WebGL) only. Real-device frame rate, battery use and voice selection on iPhone 16 Pro Max and Android are not verified yet. Use Settings → Graphics quality → Medium/Low if ORB runs hot.
- **Weekly challenges and special events** are defined in config, but hidden because every one depends on later-phase systems.

## Unfinished systems by phase (Phase 1 era list — superseded by the build order above)
- **Phase 2, DRAWING**:
  - Tutorial videos and finished reference art.
  - Video player: play, pause, rewind, fast-forward, replay, speed, volume, subtitles, narration, fullscreen, previous/next step, resume.
  - Per-step narration and subtitles, ORB step explanations.
  - Step and playback-position progress saved to the account; completion tracking and XP.
  - CMS upload pipeline.
- **Phase 3, SURVIVAL foundation**:
  - 3D engine (three.js or similar, vendored).
  - Third-person character with animations, over-the-shoulder camera with collision.
  - Dual-joystick touch controls, Gamepad API mapping and remapping.
  - Weapons, aiming, shooting, reloading.
  - Enemy and zombie AI.
  - HUD.
- **Phase 4**: Ruined City environment, environmental effects, missions, extraction, the first playable loop, mission XP.
- **Phase 5**: elemental combat for all 30 elements (offense, defense, specials, VFX, SFX, cooldowns, energy, upgrades, mastery).
- **Phase 6, CREATE**:
  - Species and customization, Normal/Steampunk/Cyberpunk styles, the 92/8 biological rule.
  - Elemental and weather effects, 3D preview, saved avatars usable in Survival.
  - The official characters: INFERNO, WOLF MAN, NIGHTMARE REX, SHADOW PERSON, WENDIGO, SKINWALKER, ZOMBIE DRAGON.
- **Phase 7, VAULT**: full inventory, weapon collection and upgrades, creature records, rewards, cloud saving.
- **Phase 8**: the game modes Hide and Seek, Story, Zombie Infection, Escape the Building and Battle Royale.
- **Phase 9**: multiplayer networking (server-authoritative), matchmaking, lobbies, co-op and competitive play, leaderboards.
- **Phase 10**: optimization, device testing, release preparation.

## Required external services / assets
1. **Backend service** for accounts and registration/login, secure auth, cloud saves, server-validated progression, inventory, events, push notifications, matchmaking, multiplayer sessions and leaderboards. Options: Supabase (Postgres, Auth, Realtime, Edge Functions), Firebase, or a custom API plus a realtime game server (for example Colyseus or Nakama). Plug it in through `RemoteAdapter` in `js/store.js`.
2. **Tutorial video assets and a CMS / video hosting** (for example Mux, Cloudflare Stream or Bunny Stream with HLS, plus a headless CMS such as Sanity, Strapi or Supabase tables). Includes finished reference artwork and subtitle files (WebVTT).
3. **Licensed or original 3D models, rigs and animations**: player, zombies and enemies, the official creatures, weapons, and the Ruined City kit. Also SFX and music, and optionally a recorded or neural ORB voice for true deep bass and reverb.
4. **Native wrapper** (for example Capacitor) if App Store or Play Store distribution is wanted. It would also give real orientation lock and haptics on iPhone. Building for iOS needs a Mac (or a cloud Mac/CI) and an Apple Developer account.
