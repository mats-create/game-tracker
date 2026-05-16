# Nutmeg&Needle Game Tracker — Project Brief

## Overview
Football tactics board PWA for Nutmeg&Needle. Generates interactive pitch diagrams that export as embroidery SVG patterns and PDF instruction sheets. Built as a multi-file app, auto-built via GitHub Actions and hosted on GitHub Pages.

**Live app:** https://mats-create.github.io/game-tracker/
**Repo:** https://github.com/mats-create/game-tracker

---

## Architecture

### Source files (edit these only — never index.html)
| File | Role |
|---|---|
| `src/app-core.js` | Canvas rendering, board state, all drawing logic |
| `src/app-export.js` | SVG and PDF export — independent rendering pipeline |
| `src/app-ui.js` | React UI components, controls, panels |
| `src/shell.html` | HTML shell, script loading, manifest link |

### Build
GitHub Actions auto-builds `src/` into `index.html` on push to main. Never edit `index.html` directly.

### Stack
React 18 via CDN, Babel standalone (`data-presets="react"`), jsPDF, Canvas API, Anthropic API (AI moment generation), Firebase (Auth + Firestore + Hosting — planned migration).

---

## Board State
All board state lives in `useRef(S)`. Serialised via `boardState()` / `applyBoardState()`. Never use `useState` for canvas-rendered state — stale closure bugs will result.

### State fields
| Field | Type | Notes |
|---|---|---|
| `players` | `Player[]` | x, y, num, name, team, ghost, hidden |
| `arrows` | `Arrow[]` | style, shape, color, points |
| `phases` | `Phase[]` | label, note, markers[], defaultEvent. Markers have x, y, eventType |
| `phaseColor` | string | Hex color for all step markers and legend badge |
| `balls` | `Ball[]` | x, y, ghost |
| `colorA/colorB` | string | Team jersey hex colors |
| `edgeColorA/edgeColorB` | string | Team ring/trim hex colors |
| `teamNameA/teamNameB` | string | Display names for each team |
| `arrowColor` | string | Current arrow color |
| `arrowHeadSize` | s/m/l | Current arrowhead size key |
| `arrowStyle` | solid/dashed/wave | Current arrow line style |
| `arrowShape` | straight/curve/elbow/free | Current arrow shape |
| `view` | full/left/right | Pitch view mode |
| `pR` | number | Player radius (from PSIZES) |
| `markerSize` | xs/s/m/l | Step marker size key (auto-syncs with pR tier) |
| `labelContrast` | normal/outline/dark | Player number rendering mode |
| `activePh` | number | Index of active phase for marker placement |
| `legend` | {x, y, scale} | Player legend position and scale |
| `stepLegend` | {x, y, scale} | Step legend position and scale |
| `selectedArrowIdx` | number/null | Currently selected arrow index |
| `selectedBallIdx` | number/null | Currently selected ball index |
| `selectedPhaseMarker` | {phaseIdx, markerIdx}/null | Currently selected step marker |

---

## Player & Marker Sizes
```
PSIZES: xs=7, s=10, m=14, l=19  (radius in px)
```

### Font size formulas (current)
| Element | Formula |
|---|---|
| Player numbers (canvas + SVG) | `Math.max(9, Math.round(r * 1.1))` |
| Phase marker labels (canvas) | `Math.max(7, Math.round(half * 1.3))` |
| Step legend mini-markers (canvas) | `Math.max(5, Math.round(br * 0.9))` |
| Legend dot numbers (SVG) | `Math.max(8, Math.round(dr * 1.2))` |

### Optical centering
Canvas marker labels use a `+Math.round(fontSize * 0.06)` y-nudge for optical vertical centering. SVG text elements use `dy="0.36em"` instead of `dominant-baseline="middle"` (more reliable across renderers). `Inter,sans-serif` used everywhere for consistency with the app font.

---

## Key Technical Constraints
- No optional chaining (`?.`) or nullish coalescing (`??`) — Babel standalone limitation
- No `ctx.roundRect()` — use `roundRectPath()` helper
- No backtick characters in comments
- All board state in `useRef(S)` — never `useState` for canvas state
- `ctx.save()` / `ctx.restore()` balance is critical — use `ctx.setTransform` explicitly before phase marker sections rather than relying on save/restore balance
- `useState` must never be called inside IIFEs within JSX render
- Event icons for step markers use pure canvas path geometry (no emoji) — shared `eventIconSVGPath()` function at module scope serves both canvas and SVG export
- Exports (SVG/PDF) work from serialised state alone, no canvas dependency
- Single top-level React component

---

## Export Pipeline
`app-export.js` has its own independent SVG string-building code. Font sizes and rendering logic are **duplicated** from `app-core.js` — when changing rendering in one file, always check the other.

**Known technical debt:** The duplicated sizing logic between `app-core.js` and `app-export.js` should be refactored into shared pure helper functions (e.g. `playerNumFontSize(r)`, `markerLabelSize(half)`, `legendDotNumSize(dr)`), defined once and called from both files. Not urgent but should be done before the next round of rendering changes.

---

## Brand
- **Palette:** #1A1A1A Pitch black · #CC3300 Coral · #4A6741 Pitch green · #F0E6D3 Linen · #F5F5F5 Off white · #666666 Mid grey
- **Thread system:** Noir DMC310 · Linen DMC3866 · Pitch DMC3362 · Coral DMC350 · Ash DMC646 · White DMCblanc
- **Font:** Inter only (400/700; 500 for UI subheadings only)
- **Voice:** knowing, dry wit, craft-proud, inclusive, concise
- **Banned words:** artisan, bespoke, curated. No exclamation marks. Sentence case always.

---

## Completed Work

### Session — May 2026 (readability + centering)
- **Player number font size:** increased scalar from `r*0.85` to `r*1.1` in both `app-core.js` and `app-export.js`. At M size (r=14) this takes numbers from 43% to 54% of circle diameter — readable on screen and stitch-worthy at small physical sizes.
- **Marker label optical centering:** fixed vertical positioning of phase marker letters (A, B, C…) on pitch canvas and in SVG/PDF exports. Canvas uses `+0.06em` y-nudge; SVG uses `dy="0.36em"` replacing unreliable `dominant-baseline="middle"`. `Inter,sans-serif` applied consistently everywhere.
- **Player number centering in SVG exports:** same `dy="0.36em"` fix applied to all player number `<text>` elements in `app-export.js` — pitch players (normal + ghost), legend dot numbers, and pattern PDF ghost players.

### Earlier sessions
- Interactive pitch canvas with zoom/pan, draggable players and arrows
- Step/phase markers with event icons, ghost players, visibility toggles
- Editable jersey numbers and team names
- AI-powered moment generation (Anthropic API)
- JSON save/load (4 slots)
- Colour SVG export, layered embroidery SVG (A4 landscape, Inkscape-compatible)
- PDF embroidery instructions sheet with DMC thread suggestions
- Full arrow system: solid/dashed/wave styles, straight/curve/elbow/free shapes, configurable arrowhead size and colour

---

## Known Issues
None.

---

## Next Steps
- Review outstanding feature backlog and prioritise
- Firebase migration (build order): Auth → Firestore library → Library UI → Web App Manifest → Firebase Hosting → Headless export
- Shopify store setup

---

## Working Method
- Always upload the full source file; Claude delivers the complete updated file for GitHub paste
- Investigate and plan before executing on complex features
- Edit only `src/` files — never `index.html`
- Commit message format: short imperative description of what changed and why
