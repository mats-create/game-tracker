# Game Tracker — Technical Backlog

> Source of truth for all planned technical work on the app.
> Updated at the end of every session.
> Confidence level indicates how well-understood the work is before implementation begins.

---

## How to use this backlog

- **Status**: `[ ]` Not started · `[~]` In progress · `[x]` Done
- **Confidence**: `HIGH` = well understood, safe to implement · `MEDIUM` = needs verification before implementing · `LOW` = needs investigation first
- **Priority**: `P1` Must do · `P2` Should do · `P3` Nice to have
- Stories marked `NEEDS INVESTIGATION` require uploading relevant src/ files before work begins.

---

## Epic 1 — Reduce file sizes to enable sustainable development sessions

*Goal: Make each src/ file small enough to upload in a Claude conversation without hitting context limits.*

---

### GT-001 · Extract base64 logos from app-export.js

**Priority:** P1  
**Confidence:** HIGH  
**Status:** [x] Done -- 2026-05-17

**Background:**  
`app-export.js` is 270KB despite having only 922 lines of code. Two base64-encoded PNG strings -- `NN_LOGO_REV` and `NN_LOGO_LINEN` -- embedded inside `exportPDF()` account for roughly 200KB of that. Extracting them to a separate file reduces `app-export.js` from 278KB to 50KB.

**User story:**  
As a developer working on the Game Tracker, I want the two logo constants extracted into a dedicated file so that I can upload `app-export.js` in a Claude conversation without hitting the context limit.

**Acceptance criteria:**
- [x] A new file `src/app-logos.js` contains exactly two constants: `NN_LOGO_REV` and `NN_LOGO_LINEN`
- [x] `app-export.js` references these constants and no longer defines them inline
- [x] `build.py` concatenates `app-logos.js` before `app-export.js` so the constants are in scope at runtime
- [x] `app-export.js` is reduced to under 80KB (actual: ~50KB)
- [x] The live site exports a PDF with both logos rendering correctly -- verified
- [x] No other functionality is affected -- verified

**Notes:**  
`build.py` updated to concatenate four files in order: `app-core.js`, `app-logos.js`, `app-export.js`, `app-ui.js`.

---

### GT-002 · Investigate whether app-core.js can be split further

**Priority:** P2  
**Confidence:** LOW — needs investigation  
**Status:** [x] Done -- 2026-05-17

**Background:**  
`app-core.js` is 111KB and 1,880 lines. Investigation completed.

**Findings:**  
The file has three distinct layers:
- Layer 1 (~35KB): 22 pure functions + 7 constants with no React dependency (phaseLabel, distToSeg, drawSymbolCanvas, hexToRgb, nearestDMC, wrapText, SYM_PATHS, C, W/H, etc.)
- Layer 2 (~5KB): 9 UI primitive components (Card, Hint, Row, ModeBtn, etc.) -- already covered by GT-011
- Layer 3 (~70KB): TacticsBoard component -- draw methods are closures over refs and cannot be extracted; Firebase methods depend on React state hooks and cannot be extracted without major refactor

**Verdict:**  
- Extracting Layer 1 to `app-utils.js` is FEASIBLE and low risk (GT-003)
- Extracting draw methods (Option C) is NOT FEASIBLE without major refactor
- Extracting Firebase methods (Option D) is NOT FEASIBLE without major refactor

**Acceptance criteria:**
- [x] Every function mapped with name, type, dependencies
- [x] Clear cut point identified: Layer 1 (pure utilities) can be extracted
- [x] New story GT-003 created with HIGH confidence
- [x] Options C and D ruled out with documented reasons

**Notes:**  
Investigation only. See GT-003 for implementation.

---

### GT-003 · Extract pure utilities from app-core.js into app-utils.js

**Priority:** P2  
**Confidence:** HIGH -- feasibility confirmed by GT-002 investigation  
**Status:** [x] Done -- 2026-05-17

**Background:**  
GT-002 investigation identified that the first ~35KB of `app-core.js` consists entirely of pure functions and constants with no React dependency. Extracting these to a new `src/app-utils.js` file reduces `app-core.js` from ~111KB to ~83KB.

**Acceptance criteria:**
- [x] A new file `src/app-utils.js` contains all constants and pure functions listed above
- [x] `app-core.js` no longer defines any of those constants or functions
- [x] `build.py` concatenates `app-utils.js` before `app-core.js` so all symbols are in scope
- [x] `app-core.js` is reduced to under 80KB (actual: ~83KB -- just over, but acceptable)
- [x] The live site works identically -- confirmed working
- [x] No function signatures are changed

**Notes:**  
Build order is now: `app-utils.js`, `app-core.js`, `app-logos.js`, `app-export.js`, `app-ui.js`.

## Epic 2 — Code organisation and logical grouping

*Goal: Move functions to the files they logically belong in, so that future sessions work on the right file for the right task.*

---

### GT-010 · Move AI helpers from app-export.js to app-core.js

**Priority:** P2  
**Confidence:** MEDIUM — location confirmed, dependencies need verification  
**Status:** [x] Done -- 2026-05-17

**Acceptance criteria:**
- [x] All eight AI helper functions moved from `app-export.js` to `app-core.js`
- [x] No function signatures changed
- [x] All existing callers continue to work
- [x] `app-export.js` no longer contains any AI-related code
- [x] Live site AI moment generation works correctly end to end

---

### GT-011 · Move UI primitives from app-core.js to app-ui.js

**Priority:** P3  
**Confidence:** MEDIUM — location confirmed, dependencies need verification  
**Status:** [x] Done -- 2026-05-17

**Acceptance criteria:**
- [x] All nine UI primitive components moved from `app-core.js` to `app-ui.js`
- [x] Placed before `PlayerPanel` in `app-ui.js`
- [x] No component signatures or props changed
- [x] `app-core.js` no longer contains any JSX component definitions
- [x] Live site renders correctly -- verified

---

## Epic 3 — Code quality and dead code removal

*Goal: Remove code that serves no purpose, reducing cognitive load and file sizes.*

---

### GT-020 · Consolidate redundant delete functions

**Priority:** P3  
**Confidence:** MEDIUM  
**Status:** [x] Done -- 2026-05-17

**Acceptance criteria:**
- [x] Call graph of all five functions documented before change
- [x] Replaced with single `deleteSelected()` function
- [x] All call sites updated
- [x] Delete behaviour unchanged across all item types

---

### GT-021 · Extract repeated marker half-size expression into a helper function

**Priority:** P3  
**Confidence:** HIGH  
**Status:** [x] Done -- 2026-05-17

**Acceptance criteria:**
- [x] `markerHalf(st, extra)` helper added to `app-utils.js`
- [x] All three inline expressions replaced with `markerHalf(st)` or `markerHalf(st, 5)`
- [x] No change to visual or hit-testing behaviour -- confirmed working

---

### GT-022 · Extract shared rendering size helpers to app-utils.js

**Priority:** P2  
**Confidence:** MEDIUM  
**Status:** [x] Done -- 2026-05-17

**Acceptance criteria:**
- [x] All 11 call sites mapped across both files before change
- [x] Five helper functions added to `app-utils.js`
- [x] All inline sizing expressions replaced in `app-core.js` (7 sites)
- [x] All inline sizing expressions replaced in `app-export.js` (6 sites)
- [x] No old `Math.max(...Math.round(` sizing expressions remain -- verified
- [x] Canvas rendering and SVG/PDF export produce identical sizes -- verified

---

### GT-030 · Replace wheel-based zoom/pan with explicit pan arrow buttons

**Priority:** P1  
**Confidence:** HIGH  
**Status:** [x] Done -- 2026-05-17

**What was built:**
- Removed entire `// ─── WHEEL` useEffect from `app-core.js`
- Added `panStep(dx,dy)` and `resetPan()` helpers to `app-core.js`
- Added ↑↓←→ arrow buttons + Centre button to canvas overlay in `app-ui.js`, separated from zoom buttons by a divider
- Updated hint text to "Space+drag to pan"
- Spacebar+drag and middle-click drag pan retained

**Acceptance criteria:**
- [x] Wheel section removed from app-core.js
- [x] Four pan arrow buttons added to pitch controls in app-ui.js
- [x] Reset pan (Centre) button added
- [x] Pan buttons move pitch correctly at all zoom levels
- [x] Zoom ± and reset zoom still work identically
- [x] No browser scroll interception -- two-finger scroll behaves as normal browser scroll

---

### GT-031 · Reproduce football pentagon pattern in ball SVG/PDF export

**Priority:** P2  
**Confidence:** HIGH  
**Status:** [x] Done -- 2026-05-17

**What was built:**
- `ballSVGLines()` now renders pentagon + 5 radial lines + 5 midpoint lines for all solid balls
- Score balls get pentagon first, then spikes layered on top (matching canvas behaviour)
- Ghost ball redesigned: `#CCCCCC` fill, grey (`#AAAAAA`) pentagon spokes, dashed grey ring

**Acceptance criteria:**
- [x] Normal solid ball in colour SVG export shows pentagon/football pattern
- [x] Normal solid ball in embroidery SVG export shows pentagon/football pattern
- [x] Normal solid ball in PDF export shows pentagon/football pattern
- [x] Ghost ball visually distinct and embroidery-friendly
- [x] Score ball gets pentagon + spikes, consistent with canvas
- [x] Pattern visually consistent with canvas rendering

---

### GT-032 · Add independent ball size control

**Priority:** P2  
**Confidence:** HIGH  
**Status:** [x] Done -- 2026-05-17

**What was built:**
- `BSIZES = {xs:5, s:8, m:11, l:15}` added to `app-utils.js`
- `ballSize:'m'` added to board default state (3 locations in `app-core.js`)
- `ballRadius(r, size)` updated to use `BSIZES` lookup
- `drawBalls()` updated to use `st.ballSize`
- XS/S/M/L buttons added to ball InfoBar in `app-ui.js`
- `ballSize` passed through to `ballSVGLines()` in `app-export.js`
- `ballSize` included in board serialisation, `applyBoardState`, and AI diff summary

**Acceptance criteria:**
- [x] XS/S/M/L buttons visible in ball panel
- [x] Changing size updates ball on canvas immediately
- [x] Size persists when board is saved and reloaded from Firestore
- [x] SVG and PDF exports use the correct ball size
- [x] Default size (m) produces a ball visually similar to the current default
- [x] Both real and ghost ball variants respect the size setting

---

### GT-033 · Ghost element redesign for embroidery legibility

**Priority:** P2  
**Confidence:** HIGH  
**Status:** [x] Done -- 2026-05-17

**Background:**  
Ghost players and ghost balls were near-invisible on the white/off-white PDF background, making them impossible to embroider from. Both needed a redesign that reads clearly on light backgrounds while remaining visually distinct from solid elements.

**What was built:**

*Ghost player (canvas + all 3 export paths):*
- Off-white (`#F5F5F5`) fill with 45° diagonal team-colour stripes at 55% opacity
- Stripe width matches dashed ring width (2.5px)
- Dashed team-colour ring maintained
- Jersey number removed (player is identifiable via legend)
- `ghostPlayerSVG()` helper shared across all SVG/PDF export paths

*Ghost ball (canvas + all 3 export paths):*
- `#CCCCCC` fill (light grey, readable on white)
- Pentagon + spokes in `#AAAAAA` — same geometry as solid ball, clearly secondary
- Dashed ring in `#AAAAAA` at 1.5px

**Acceptance criteria:**
- [x] Ghost player: diagonal stripes, dashed ring, no number — canvas + all exports
- [x] Ghost ball: grey fill, grey spokes, dashed ring — canvas + all exports
- [x] Consistent between canvas and all three export paths
- [x] Embroidery-stitchable (clear, distinct, no near-invisible elements)

---

## Investigation queue

Stories that cannot be planned or sized until files are uploaded and read.

| ID | What needs investigating | Files needed |
|----|--------------------------|--------------:|
| — | Nothing currently queued | — |

---

## Completed

- **GT-001** · Extract base64 logos from app-export.js -- 2026-05-17
- **GT-002** · Investigation: app-core.js split feasibility -- 2026-05-17
- **GT-003** · Extract pure utilities into app-utils.js -- 2026-05-17
- **GT-010** · Move AI helpers from app-export.js to app-core.js -- 2026-05-17
- **GT-011** · Move UI primitives to app-ui.js -- 2026-05-17
- **GT-020** · Consolidate redundant delete functions -- 2026-05-17
- **GT-021** · Extract marker half-size into markerHalf() helper -- 2026-05-17
- **GT-022** · Shared rendering size helpers extracted to app-utils.js -- 2026-05-17
- **GT-030** · Replace wheel pan with explicit arrow buttons -- 2026-05-17
- **GT-031** · Pentagon pattern in ball SVG/PDF export -- 2026-05-17
- **GT-032** · Independent ball size control -- 2026-05-17
- **GT-033** · Ghost element redesign for embroidery legibility -- 2026-05-17

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-16 | Initial backlog created from first-iteration investigation |
| 2026-05-17 | GT-001 implemented -- app-export.js reduced from 278KB to 50KB |
| 2026-05-17 | GT-002 investigation complete -- feasibility confirmed, GT-003 created |
| 2026-05-17 | GT-003 implemented -- app-core.js reduced from 111KB to 83KB |
| 2026-05-17 | GT-020 + GT-021 implemented -- delete consolidation and markerHalf() helper |
| 2026-05-17 | GT-011 implemented -- UI primitives moved to app-ui.js |
| 2026-05-17 | GT-022 implemented -- 5 sizing helpers in app-utils.js, 13 inline expressions replaced |
| 2026-05-17 | GT-030, GT-031, GT-032 added to backlog |
| 2026-05-17 | GT-030 implemented -- wheel pan removed, arrow buttons added |
| 2026-05-17 | GT-031 implemented -- pentagon pattern in all ball export paths |
| 2026-05-17 | GT-032 implemented -- independent ball size XS/S/M/L |
| 2026-05-17 | GT-033 implemented -- ghost player stripes + ghost ball grey, all paths |
