# DRAWING APOCALYPSE

**DRAW. LEARN. EVOLVE. SURVIVE.**

A mobile web app (installable PWA) for iPhone and Android. This is the **Phase 2** build: the Phase 1 foundation (five-tab navigation, visual identity, profile, unified progression, **ORB: The Eternal Guide**) plus the core screens: the DRAWING lesson library with a real video player, the SURVIVAL mode select, CREATE locked/unlocked, the VAULT collection and records, and drill-down SETTINGS.

Live URL (after GitHub Pages is enabled): `https://tylotus66-spec.github.io/drawing-apocalypse/`

## Install on your phone
- **iPhone (Safari):** open the link, tap **Share**, then **Add to Home Screen**, then **Add**.
- **Android (Chrome):** open the link, tap **⋮**, then **Install app** (or **Add to Home screen**).

After the first visit, the app opens offline.

## Deploying
This repo has no build step. Pushing to `main` runs `.github/workflows/pages.yml`, which publishes the folder as-is to GitHub Pages. Set the repo's **Settings → Pages → Source** to **GitHub Actions** once.

When you change any app file, bump `VERSION` in `sw.js` so installed phones pick up the update.

## Structure
```
index.html            app shell (five-tab nav, overlays)
css/app.css           visual identity (black / deep purple / hot pink, black glass)
js/main.js            boot, router, transitions, global wiring
js/config.js          ★ progression config: XP curve, level unlock table, challenges, achievements
js/content.js         30 elements, species, drawing categories, ORB tips, help topics, lore
js/store.js           data layer (storage adapter + account API + settings)
js/progression.js     XP ledger, levels, unlocks, daily challenges, achievements, notifications
js/orb.js             ORB renderer: WebGL animation of layers derived from design-ref/orb-exact.jpg (img/orb/, built by da-tools/make_orb_assets.py); lite path; Canvas2D still fallback
js/screens/orbguide.js ORB guide screen (#/orb)
js/voice.js           ORB voice (Web Speech API) + subtitles
js/audio.js           WebAudio buses (master/music/sfx/voice), synthesized UI sounds, ambient music, ORB hum
js/guide.js           contextual ORB tips + "Ask ORB" scripted help topics
js/fx.js              ember / ash particles
js/player.js          lesson video player (HTML5 <video> + custom controls)
js/gamepad.js         Gamepad API menu navigation (D-pad/stick, A, B, LB/RB)
js/screens/*.js       home, drawing, survival, create, vault, settings, onboarding
content/tutorials.json  drawing library manifest (loaded at runtime; CMS-ready)
thumbs/               original SVG construction-sketch thumbnails, one per lesson
videos/               lesson videos, posters and WebVTT captions (not cached by the service worker)
sw.js                 offline service worker (bump VERSION on changes)
```

## Adding lesson videos
Lessons live in `content/tutorials.json` (schema 2). A lesson **without** a `video` field shows an honest "Video not uploaded yet" panel with its original reference sketch, and its written steps still work and count toward completion. To give a lesson a real video:

1. Put the files in `videos/` (or host them anywhere that serves HTTPS with range requests: Bunny, Cloudflare R2/Stream MP4, S3, etc.). Use **MP4 (H.264 + AAC)** for iPhone and, optionally, **WebM (VP9)** as a second source.
2. Add a WebVTT caption file (`videos/<id>.en.vtt`), and optionally a poster image.
3. Edit the lesson in `tutorials.json`:
```json
"video": [ { "src": "videos/fire-wyvern.mp4", "type": "video/mp4" },
           { "src": "videos/fire-wyvern.webm", "type": "video/webm" } ],
"poster": "videos/fire-wyvern-poster.webp",
"captions": [ { "src": "videos/fire-wyvern.en.vtt", "srclang": "en", "label": "English" } ],
"stepTimes": [0, 40, 95, 150, 210, 300, 380, 450, 520, 600, 690, 780]
```
`stepTimes` is the start second of each step (same count as `steps`). It powers the previous/next-step buttons and makes the step panel follow the video. Hosted URLs work the same way: use the full `https://…` address in `src`.
4. Commit and push. No app code changes are needed, and you don't need to bump anything for `videos/`. Note that `tutorials.json` is cached for offline use, so phones see the change on the *second* launch after the deploy. Bump `VERSION` in `sw.js` if you want it on the first launch.

Lesson XP (`LESSON_XP` in `js/progression.js`): Beginner 40, Intermediate 60, Advanced 80, Expert 100. It's paid once per lesson (ledger id `lesson:<id>`), only after every step has been studied (4 seconds on a step, or the video playing through it).

The only video in this build is on `sphere-of-light` (Realism · Beginner): a 50-second **demo animation** rendered in code (`da-tools/make_demo_video.py`), with captions. It is labeled "DEMO ANIMATION" in the app (`"videoKind": "demo-animation"`) and is not recorded tutorial footage; it exists to prove the player end to end.

## Tuning progression
Everything is in `js/config.js`:
- `XP_CURVE`: XP to the next level = `BASE + STEP × (level − 1)`. The defaults give level 2 at 100 XP, 3 at 250, 4 at 450 and **5 at 700**.
- `START_UNLOCKS`: what a new player starts with (FIRE + HUMAN by default, a design choice).
- `LEVEL_UNLOCKS`: what each level grants. **Level 5 unlocks CREATE**, per the spec.
- `DAILY_CHALLENGES` and `ACHIEVEMENTS`: XP values, goals, and the phase each one goes live.

XP is never stored directly. It is the sum of an append-only **reward ledger** where every entry has a unique id (for example `daily:talk-orb:2026-10-31` or `ach:explorer`), so no reward can be paid twice. Level and unlocks are computed from the ledger, so the Vault can't show something that wasn't earned.

## Backend (later phase)
Phase 1 stores the profile on the device (`localStorage`) through `LocalAdapter` in `js/store.js`. The app only talks to the `Store` API, so a server can be added later by implementing `RemoteAdapter` (auth plus get/set) without changing the screens. Cloud accounts, login, cross-device saves, multiplayer, matchmaking, leaderboards and push notifications **need a backend service** (for example Supabase, Firebase, or a custom Node or Go API with a realtime server). The server must validate progression from gameplay events rather than trusting XP values sent by the client.

## Licenses
All code, graphics, icons and sounds are original (the sounds are synthesized in code). No third-party libraries are used. The Rajdhani font (SIL Open Font License, `fonts/OFL-Rajdhani.txt`) is self-hosted. Lesson thumbnails are original SVG construction sketches generated in code; the logo art comes from Ty's design references. Phase 3 will add a 3D engine (for example three.js, MIT), vendored locally.
