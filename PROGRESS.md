# DRAWING APOCALYPSE — Progress record

Workflow (spec §24): BUILD → PLAY → IDENTIFY ONE PROBLEM → DIRECT A FIX → PLAY AGAIN → LOCK IT → NEXT SYSTEM.

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

## Unfinished systems by phase
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
