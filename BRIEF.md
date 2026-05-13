# Nutmeg&Needle — Game Tracker: Project Brief

> **How to use this file**
> Every new Claude conversation starts with: "Read BRIEF.md from `https://raw.githubusercontent.com/mats-create/game-tracker/main/BRIEF.md` and index.html from `https://raw.githubusercontent.com/mats-create/game-tracker/main/index.html` — today's task: [X]"
> Raw URLs must be typed explicitly in the opening message — the standard GitHub URLs do not work reliably.
> Claude updates this file at the end of each session. Mats commits the updated version to GitHub.

---

## Repo & hosting

| Item | Value |
|---|---|
| GitHub repo | https://github.com/mats-create/game-tracker |
| Live app | https://mats-create.github.io/game-tracker/ |
| Firebase project | game-tracker-mph |
| Main file | index.html (single-file HTML/React app, no build step) |

---

## What the app is

A football tactics board for designing Nutmeg&Needle embroidery kit templates. Users draw moves on a pitch canvas (players, arrows, phases, ball), then export as embroidery-ready SVG or PDF with DMC thread colour suggestions.

---

## Tech stack

- React 18 via CDN + Babel standalone (`data-presets="react"`)
- jsPDF for PDF export
- Firebase Auth (Google sign-in only) + Firestore (board library)
- Single `TacticsBoard` function component + `root.render` — no build tooling

---

## Hard technical constraints

These must be respected in every code change — violations silently break things:

- **No optional chaining** (`?.`) or **nullish coalescing** (`??`) — Babel standalone doesn't support them; use explicit `&&` guard chains
- **No `ctx.roundRect()`** — not universally supported
- **No backticks in comments**
- **Single top-level component** (`TacticsBoard`) + `root.render`
- **All board state in `useRef`** — never `useState` inside IIFEs within JSX render (breaks canvas + violates Rules of Hooks)
- **Canvas transforms**: use explicit `ctx.setTransform` before phase markers rather than relying on `save()`/`restore()` balance
- **Event icons**: pure canvas path geometry only (no emoji) — shared `eventIconSVG()` function serves both SVG and PDF

---

## Current feature set

- Interactive pitch canvas: zoom/pan, draggable players and arrows
- Player markers with jersey numbers and team colours
- Arrow types: straight, curved, dashed
- Phase/step markers with event icons
- Ghost players and visibility toggles
- Editable jersey numbers and team names
- AI-assisted moment generation (Anthropic API, text + image input)
- JSON save/load via Firebase Firestore (named board library, Google sign-in)
- Colour SVG export
- Embroidery SVG export (A4 landscape, Inkscape-layered)
- PDF embroidery instructions with DMC thread suggestions
- PWA: Web App Manifest, favicons, installable
- Hosted via GitHub Pages

---

## UI style

Material Design 3 (MD3) principles:
- MD3 colour tokens: surface / on-surface / primary / secondary
- Card elevation via borders (not shadows)
- Button variants: filled, tonal, outlined
- Typography: 14sp body / 12sp label, Inter only (400/700; 500 for UI subheadings)
- 8px grid
- No ripple/animation
- Sentence case always
- Canvas area is untouched by MD3 styling

---

## Brand constraints (always apply)

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

## Current status

**Last updated:** 2026-05-13
**Last completed:** Ways-of-working session — identified root cause of context overload (438KB single file), planned file-split restructuring
**Current state of app:** Fully functional. Firebase Auth + Firestore, PWA, GitHub Pages. No code changes made this session.
**Known issues / open items:** PDF embroidery pattern output under investigation (see GT4/GT5 discussion). File-split restructuring required before further feature work.
**Next task:** Phase 1 of file-split — create named backup copy in repo, then investigate and plan the exact split

---

## Work log

| Date | Task | Outcome |
|---|---|---|
| 2026-05-13 | Workflow restructure | GitHub as source of truth, BRIEF.md established |
| 2026-05-13 | Workflow fix | Raw GitHub URLs required in session openers — BRIEF.md updated |
| 2026-05-13 | Ways of working | Root cause of context overload identified — file-split plan created |

---

## File-split plan (NEXT MAJOR TASK)

### Why
index.html is 438KB. The fetch tool truncates at ~20% of the file, so export functions are never visible. Uploading the file as an attachment causes context overload within 1-2 exchanges. This is unsustainable for all future work.

### Proposed structure after split

| File | Contents | Est. size |
|---|---|---|
| `index.html` | HTML shell, CDN script tags, root render call only | ~5KB |
| `app-core.js` | TacticsBoard component, state, canvas draw functions | ~200KB |
| `app-export.js` | PDF and SVG export functions | ~100KB |
| `app-ui.js` | JSX panels, controls, UI components | ~130KB |

Each file fetchable independently via raw GitHub URL. Build sessions only load the file(s) relevant to the task.

### How sessions work after the split

- Export work: fetch `app-export.js` only
- UI work: fetch `app-ui.js` only
- Core/canvas work: fetch `app-core.js` only
- Full context needed: fetch all three (still smaller per file than current single file)

### Execution phases

| Phase | Task | Status |
|---|---|---|
| 1 | Create named backup: `index-backup-20260513.html` committed to repo | To do |
| 2 | Analyse file — map exact cut points, dependencies between sections | To do |
| 3 | Build split files one at a time, test after each | To do |
| 4 | Full end-to-end test: sign-in, draw, save, export | To do |

### Rules for execution
- Backup must be confirmed committed before any code changes
- One phase per conversation — do not combine phases
- Test in browser after every file change before proceeding
- If anything breaks, roll back to backup immediately
- Mats is non-technical — all instructions must be at "for dummies" level

---

## How sessions work

1. Start new conversation with: *"Read BRIEF.md from `https://raw.githubusercontent.com/mats-create/game-tracker/main/BRIEF.md` and index.html from `https://raw.githubusercontent.com/mats-create/game-tracker/main/index.html` — today's task: [X]"*
2. Claude reads both files directly via raw URLs (no pasting needed) — raw URLs must be typed explicitly in the opening message
3. Claude delivers updated `index.html` as a file
4. Mats commits to GitHub via the web UI (Edit → paste → Commit)
5. Claude updates BRIEF.md current status section
6. Mats commits updated BRIEF.md

**One conversation = one task. Planning conversations don't need the HTML file.**

---

## End of session checklist

After every build session, before closing the conversation:

- [ ] Commit updated `index.html` to GitHub
- [ ] Ask Claude to produce updated "Current status" section for BRIEF.md
- [ ] Commit updated `BRIEF.md` to GitHub
- [ ] If any new constraints or decisions were made, ask Claude to note them in the relevant BRIEF.md section before committing

---

## Assets note

Key assets not yet in the repo (add when needed for a specific task):

- Brand reference: `nn_brand_reference.html`
- Embroidery guide: `nutmegneedle-embroidery-guide.pdf`
- Logo package: 63 files (regenerated via `generate_logos.py`)
- Favicon package: already in repo ✓
