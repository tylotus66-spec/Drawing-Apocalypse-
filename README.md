# DRAWING APOCALYPSE

**DRAW. LEARN. EVOLVE. SURVIVE.**

A mobile web app (installable PWA) for iPhone and Android. This is the **Phase 1** build: app foundation, the five-section navigation, the visual identity, HOME, the player profile, SETTINGS, the unified progression system, and **ORB: The Eternal Guide**.

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
js/orb.js             ORB renderer (WebGL shader + Canvas2D fallback)
js/voice.js           ORB voice (Web Speech API) + subtitles
js/audio.js           WebAudio buses (master/music/sfx/voice), synthesized UI sounds, ambient music, ORB hum
js/guide.js           contextual ORB tips + "Ask ORB" scripted help topics
js/fx.js              ember / ash particles
js/screens/*.js       home, drawing, survival, create, vault, settings, onboarding
content/tutorials.json  drawing library manifest (loaded at runtime; CMS-ready)
sw.js                 offline service worker (bump VERSION on changes)
```

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
All code, graphics, icons and sounds are original (the sounds are synthesized in code). No third-party libraries are used in Phase 1. Phase 3 will add a 3D engine (for example three.js, MIT), vendored locally.
