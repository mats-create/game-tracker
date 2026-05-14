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

The app is split across four files. **Edit only the `src/` files — never `index.html` directly.**

| File | Contents | Size |
|---|---|---|
| `src/app-core.js` | Constants, canvas draw functions, TacticsBoard component body | ~105KB |
| `src/app-export.js` | SVG helpers, exportPDF, exportSVG | ~270KB |
| `src/app-ui.js` | PlayerPanel, JSX render tree, root.render | ~64KB |
| `src/shell.html` | HTML shell with CDN tags and Firebase init | ~3KB |

`index.html` is **auto-built** from these files by GitHub Actions every time a `src/` file is pushed. Do not edit it manually.

---

## How sessions work

### Starting a session
Open with the task description and ask Claude to fetch the current files directly from GitHub. Always use the raw URLs — this ensures Claude works from the latest committed versions, not stale uploads.

**Standard session opener:**
> Today's task: [describe what you want to do].
>
> Please fetch the current source files from GitHub:
> - https://raw.githubusercontent.com/mats-create/game-tracker/refs/heads/main/BRIEF.md
> - https://raw.githubusercontent.com/mats-create/game-tracker/refs/heads/main/src/app-core.js
> - https://raw.githubusercontent.com/mats-create/game-tracker/refs/heads/main/src/app-ui.js
> - https://raw.githubusercontent.com/mats-create/game-tracker/refs/heads/main/src/app-export.js

Include only the files relevant to the task. BRIEF.md should always be included.

**File-to-task mapping:**
- UI panels, controls, player list → `app-ui.js`
- Canvas drawing, board logic, AI, zoom/pan → `app-core.js`
- PDF export, SVG export → `app-export.js`
- Not sure? Fetch all three — they are small enough together

### During a session
- Claude makes all code changes — Mats never edits code directly
- Claude delivers the complete updated file
- Mats downloads the updated file and uploads it to GitHub to replace the existing one

### Uploading a file back to GitHub
1. Go to the file in the repo (e.g. `src/app-ui.js`)
2. Click the pencil (edit) icon
3. Select all → paste the new content
4. Commit with a short message describing the change

Or drag the file onto the repo's main page if GitHub allows it.

### After a session
- Ask Claude to update the **Current status** section below
- Commit the updated BRIEF.md to GitHub

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

## Current status

**Last updated:** 2026-05-14
**Last completed:** Zoom/pan fix, Board Library redesign, Memorable Moment per-board persistence
**Current state:** Fully functional. All fixes confirmed working by user.
**Known issues:** None
**Next task:** Resume feature development — review outstanding feature list and prioritise

---

## Work log

| Date | Task | Outcome |
|---|---|---|
| 2026-05-13 | Workflow restructure | GitHub as source of truth, BRIEF.md established |
| 2026-05-13 | Ways of working | File-split plan created |
| 2026-05-13 | File split | App split into src/ files, auto-build pipeline working |
| 2026-05-14 | Bug fix: zoom/pan | Two-finger scroll now zooms (was routing to pan, clamped to zero at scale=1). Pinch and horizontal swipe preserved. touchAction:none added to canvas. |
| 2026-05-14 | Bug fix: Memorable Moment | currentBoardId state + key prop forces remount on board switch, defaultValues re-read correctly |
| 2026-05-14 | Board Library redesign | Active board shows full card with thumbnail + Update/JSON/Delete. Others show as compact list. Dirty-check on switch prompts save/discard. |
| 2026-05-14 | Session workflow | Standard session opener established — Claude fetches src files directly from GitHub raw URLs |

---

## End of session checklist

- [ ] Claude delivers updated `src/` file(s)
- [ ] Upload updated file(s) to GitHub
- [ ] Ask Claude to update Current status section in BRIEF.md
- [ ] Upload updated BRIEF.md to GitHub
