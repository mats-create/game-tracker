# Nutmeg&Needle — Game Tracker BRIEF

This file is read at the start of every Claude conversation.
It is the single source of truth for project context, constraints, and current status.

---

## What this app is

A football tactics board web app for Nutmeg&Needle. Users can:
- Place and move players on a pitch
- Draw arrows, add symbols, place move markers
- Generate tactical moments using AI (Anthropic API)
- Save and load boards via Firebase Firestore
- Export as PDF, colour SVG, or embroidery SVG

**Live app:** https://mats-create.github.io/game-tracker/
**Repo:** https://github.com/mats-create/game-tracker

---

## File structure

The app is split across five files. **Edit only the `src/` files — never `index.html` directly.**

| File | Contents | Size |
|---|---|---|
| `src/app-utils.js` | Pure utility functions, constants, sizing helpers | ~20KB |
| `src/app-core.js` | Canvas draw functions, TacticsBoard component body, Firebase, AI | ~90KB |
| `src/app-logos.js` | Base64 logo constants used by exportPDF | ~200KB |
| `src/app-export.js` | SVG helpers, exportPDF, exportSVG | ~50KB |
| `src/app-ui.js` | UI primitives, PlayerPanel, JSX render tree, root.render | ~65KB |
| `src/shell.html` | HTML shell with CDN tags and Firebase init | ~3KB |

`index.html` is **auto-built** from these files by GitHub Actions every time a `src/` file is pushed. Do not edit it manually.

---

## How sessions work

### Starting a session
Tell Claude which file you are working on and what the task is. Upload the relevant `src/` file(s) from GitHub.

**For most tasks, only one file is needed:**
- UI panels, controls, player list, button styles → upload `src/app-ui.js`
- Canvas drawing, board logic, AI, Firebase, zoom/pan → upload `src/app-core.js`
- PDF export, SVG export → upload `src/app-export.js`
- Pure utilities (colours, geometry, draw helpers) → upload `src/app-utils.js`
- Not sure? Upload the relevant files -- all are under 100KB

**Example session opener:**
> "Today's task: [describe what you want to do]. Here is the file: [upload file]"

### During a session
- Claude makes all code changes — Mats never edits code directly
- Claude delivers the complete updated file
- Mats downloads the updated file and uploads it to GitHub to replace the existing one

### Uploading a file back to GitHub
1. Go to `src/` in the repo
2. Click **Add file → Upload files**
3. Drop all changed files at once
4. Commit to `main` with a short description — GitHub Actions builds `index.html` automatically

### After a session
- Ask Claude to update BRIEF.md, BACKLOG.md, and README.md as needed
- Commit updated files to GitHub

### One conversation = one task
Planning conversations (no file needed) are cheap and useful.
Build conversations (with file uploads) should focus on one task only.

---

## Technical constraints — must always be respected

These are hard rules. Breaking any of them silently breaks the app.

- **No optional chaining (`?.`) or nullish coalescing (`??`)** — Babel standalone with `data-presets="react"` does not support them. Use explicit `&&` guard chains instead.
- **No `ctx.roundRect()`** — not universally supported. Use `roundRectPath()` helper instead.
- **No backticks in comments** — breaks Babel parsing.
- **Single top-level component** — one `TacticsBoard` function + `root.render`. Never split into multiple top-level components.
- **All board state in `useRef(S)`** — never `useState` for board state. Stale closures will silently break canvas rendering.
- **Canvas `ctx.save()`/`ctx.restore()` balance** — imbalance causes zoom transform to break. Use explicit `ctx.setTransform` before phase markers section.
- **Event icons for step markers** — must use pure canvas path geometry (no emoji) so they render in SVG and PDF exports.

---

## UI style

Material Design 3 (MD3) principles:
- MD3 colour tokens: surface / on-surface / primary / secondary
- Card elevation via borders (not shadows)
- Button variants: filled, tonal, outlined
- Typography: Inter only (400/700; 500 for UI subheadings), 14sp body / 12sp label
- 8px grid, sentence case always
- No ripple/animation
- Canvas area is untouched by MD3 styling

---

## Brand constraints — always apply

- Inter only — never any other font
- Never coral adjacent to green as foreground text — always a neutral between them
- No coral as large background fill
- Kit naming always "The [Move Name]"
- Banned words: artisan, bespoke, curated, exclamation marks
- Voice: knowing, dry wit, craft-proud, inclusive, concise

**Palette:**

| Token | Hex |
|---|---|
| Pitch black | #1A1A1A |
| Coral (light) | #CC3300 |
| Coral (dark) | #FF6633 |
| Pitch green | #4A6741 |
| Linen | #F0E6D3 |
| Off white | #F5F5F5 |
| Mid grey | #666666 |

**DMC threads:** Noir (310), Linen (3866), Pitch (3362), Coral (350), Ash (646), White (blanc)

---

## Ghost element design — locked

These treatments are final and must be consistent across canvas and all three export paths (colour SVG, embroidery SVG, aida PDF).

**Ghost player:**
- Off-white (`#F5F5F5`) fill with 45° diagonal team-colour stripes at 55% opacity
- Stripe width 2.5px, matching the dashed ring
- Dashed team-colour ring at 2.5px
- No jersey number

**Ghost ball:**
- `#CCCCCC` fill
- Pentagon + spokes in `#AAAAAA` (same geometry as solid ball)
- Dashed ring in `#AAAAAA` at 1.5px

---

## Current status

**Last updated:** 2026-05-17  
**Last completed:** GT-030/031/032/033 — pan arrow buttons, ball pentagon export, independent ball size, ghost element redesign  
**Current state:** Fully functional. Firebase Auth + Firestore board library, PWA manifest, GitHub Pages hosting, auto-build pipeline.  
**Known issues:** None  
**Next task:** Check BACKLOG.md for next priority item

---

## Work log

| Date | Task | Outcome |
|---|---|---|
| 2026-05-13 | Workflow restructure | GitHub as source of truth, BRIEF.md established |
| 2026-05-13 | Ways of working | File-split plan created |
| 2026-05-13 | File split | App split into src/ files, auto-build pipeline working |
| 2026-05-17 | Way of working finalised | Download/upload file workflow confirmed, session checklist created |
| 2026-05-17 | Technical investigation | First-iteration backlog created, BACKLOG.md added to repo |
| 2026-05-17 | GT-001/002/003 | Logo extraction, utils extraction, file size reduction |
| 2026-05-17 | GT-010/011/020/021/022 | AI helpers, UI primitives, delete consolidation, sizing helpers |
| 2026-05-17 | GT-030 | Wheel pan removed, ↑↓←→ + Centre buttons added |
| 2026-05-17 | GT-031 | Pentagon pattern in all ball export paths |
| 2026-05-17 | GT-032 | Independent ball size XS/S/M/L |
| 2026-05-17 | GT-033 | Ghost player stripes + ghost ball grey — all paths consistent |

---

## End of session checklist

- [ ] Claude delivers updated `src/` file(s)
- [ ] Upload updated file(s) to GitHub
- [ ] Ask Claude to update BRIEF.md, BACKLOG.md, README.md
- [ ] Upload updated docs to GitHub
