# Nutmeg&Needle — Game Tracker: Project Brief

> **How to use this file**
> Every new Claude conversation starts with: "Read BRIEF.md and index.html from https://github.com/mats-create/game-tracker — today's task is: [X]"
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

*(Update this section at the end of each work session)*

**Last updated:** 2026-05-13
**Last completed:** Repo and workflow restructure — BRIEF.md created, GitHub established as single source of truth
**Current state of app:** Fully functional single-file app with Firebase Auth + Firestore board library, PWA manifest, GitHub Pages hosting
**Known issues / open items:** None logged yet — to be populated as work resumes
**Next task:** TBD — review outstanding Game Tracker 5 feature list and prioritise

---

## Work log

| Date | Task | Outcome |
|---|---|---|
| 2026-05-13 | Workflow restructure | GitHub as source of truth, BRIEF.md established |

---

## How sessions work

1. Start new conversation with: *"Read BRIEF.md and index.html from https://github.com/mats-create/game-tracker — today's task: [X]"*
2. Claude reads both files directly (no pasting needed)
3. Claude delivers updated `index.html` as a file
4. Mats commits to GitHub via the web UI (Edit → paste → Commit)
5. Claude updates BRIEF.md current status section
6. Mats commits updated BRIEF.md

**One conversation = one task. Planning conversations don't need the HTML file.**
