# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Vite, port 5173)
npm run build        # Production build to /dist
npm run preview      # Preview production build locally
npm run deploy       # Build + deploy to GitHub Pages (gh-pages)
```

No test framework is configured. No linter is configured.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) auto-deploys on push to `main`. The site is hosted on GitHub Pages at base path `/Sound-trainnningSite/` (configured in `vite.config.js`).

## Architecture

This is a vanilla JavaScript (ES modules) web app built with Vite. The user listens to 3D spatial audio and identifies which of 8 compass directions the sound came from.

**Tech stack:** Vite 7, Three.js, Web Audio API (HRTF panning), localStorage for persistence.

### Manager Pattern

The app uses a manager pattern orchestrated by an `App` class in `src/main.js`. `window.app` holds the global instance.

| Manager | Location | Responsibility |
|---|---|---|
| `GameManager` | `src/game/GameManager.js` | Core game state machine (IDLE→READY→PLAYING→WAITING→FEEDBACK→END), 10 rounds per game, score tracking |
| `AudioManager` | `src/audio/AudioManager.js` | Web Audio API setup, PannerNode with HRTF model, 440Hz oscillator generation |
| `SceneManager` | `src/3d/SceneManager.js` | Three.js scene, camera, green sphere sound-source marker, device orientation support |
| `UIManager` | `src/ui/UIManager.js` | Multi-screen UI (start, game, result, history), 8-direction compass button layout |
| `HistoryManager` | `src/game/HistoryManager.js` | localStorage persistence (`soundDirectionTraining.history`), max 100 entries |
| `DiagnosticsManager` | `src/audio/DiagnosticsManager.js` | Audio channel testing (L/R separation, stereo panning, 4D spatial) |
| `FrontBackTestManager` | `src/audio/FrontBackTestManager.js` | Specialized front/back discrimination test mode |
| `DiagnosticsUI` / `DiagnosticsModeSelector` | `src/ui/` | UI for diagnostics features |
| `FrontBackTestUI` | `src/ui/FrontBackTestUI.js` | UI for front/back test mode |

### Game Flow

1. `App` constructor initializes all managers and starts `requestAnimationFrame` loop
2. User clicks START → `GameManager.start()` generates a question queue (8 directions, ≥1 each, +2 random = 10)
3. Each round: sound plays at a spatial position calculated as `x = R·sin(θ), z = -R·cos(θ)`, user picks from 8 compass buttons
4. Max 2 replays per round. Feedback shown for 1.5s between rounds
5. `endGame()` saves results via `HistoryManager` and shows result screen

### 8 Directions

Front (0°), Front-Right (45°), Right (90°), Back-Right (135°), Back (180°), Back-Left (225°), Left (270°), Front-Left (315°).

### Styling

Dark theme (#0a0a15 background). Uses 'Outfit' Google Font. Mobile responsive with 600px breakpoint. All styles in `src/style.css`.

## Language

The app UI is in Japanese. Technical documentation exists in `音声技術解説.md`.
