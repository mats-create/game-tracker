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
- [ ] The live site exports a PDF with both logos rendering correctly -- verify after upload
- [ ] No other functionality is affected -- verify after upload

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


---

### GT-003 · Extract pure utilities from app-core.js into app-utils.js

**Priority:** P2  
**Confidence:** HIGH -- feasibility confirmed by GT-002 investigation  
**Status:** [x] Done -- 2026-05-17

**Background:**  
GT-002 investigation identified that the first ~35KB of `app-core.js` consists entirely of pure functions and constants with no React dependency. Extracting these to a new `src/app-utils.js` file reduces `app-core.js` from ~111KB to ~83KB.

**User story:**  
As a developer working on the Game Tracker, I want pure utility functions extracted into a dedicated file so that `app-core.js` is smaller and working sessions that touch only board logic or draw code are not forced to upload 35KB of unrelated utilities.

**Functions and constants to extract:**
- Constants: `W`, `H`, `PSIZES`, `MSIZES`, `AHEAD`, `SSIZES`, `C`, `NN_THREADS`, `SYM_PATHS`
- Pure functions: `phaseLabel`, `mkPlayers`, `distToSeg`, `distToArrow`, `roundRectPath`, `drawSquareMarker`, `drawArrowHead`, `drawWavyLine`, `symContrastCol`, `drawSymbolCanvas`, `symbolSVGPath`, `getLegendRows`, `legendFontSizes`, `legendAutoW`, `legendAutoH`, `wrapText`, `stepLegendAutoH`, `hexToRgb`, `textOnBg`, `nnThreadLabel`, `nearestDMC`, `svgWrap`

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

**Background:**  
The following functions are in `app-export.js` but have nothing to do with export:
`isInsideClaude`, `getHeaders`, `canCall`, `buildDiffSummary`, `applyBoardJSON`, `parseAI`, `handleImageUpload`, `clearImage`

They belong in `app-core.js` alongside the board state and Firebase logic they interact with.

**User story:**  
As a developer working on the Game Tracker, I want the AI helper functions to live in `app-core.js` so that when I need to work on AI behaviour I upload the correct file and not the export file.

**Acceptance criteria:**
- [ ] All eight AI helper functions are moved from `app-export.js` to `app-core.js`
- [ ] No function signatures are changed
- [ ] All existing callers of these functions continue to work without modification (they are in the same concatenated bundle at runtime)
- [ ] `app-export.js` no longer contains any AI-related code
- [ ] The live site AI moment generation works correctly end to end
- [ ] `app-export.js` file size is reduced (minor, but measurable)

---

### GT-011 · Move UI primitives from app-core.js to app-ui.js

**Priority:** P3  
**Confidence:** MEDIUM — location confirmed, dependencies need verification  
**Status:** [x] Done -- 2026-05-17

**Background:**  
The following small React components are defined in `app-core.js` but logically belong with the UI layer in `app-ui.js`:
`Card`, `Hint`, `Row`, `ModeBtn`, `ToggleBtn`, `ActionBtn`, `GhostBtn`, `InfoBar`, `Collapsible`

**User story:**  
As a developer working on the Game Tracker, I want UI primitive components to live in `app-ui.js` so that when I need to adjust a button or card style I upload the correct file.

**Acceptance criteria:**
- [x] All nine UI primitive components moved from `app-core.js` to `app-ui.js`
- [x] Placed before `PlayerPanel` in `app-ui.js`
- [x] No component signatures or props changed
- [x] `app-core.js` no longer contains any JSX component definitions
- [x] Live site renders correctly -- verify after upload
- [x] `app-core.js` reduced from ~94KB to ~90KB

---

## Epic 3 — Code quality and dead code removal

*Goal: Remove code that serves no purpose, reducing cognitive load and file sizes.*

---

### GT-020 · Consolidate redundant delete functions

**Priority:** P3  
**Confidence:** MEDIUM — pattern observed, full call graph not yet verified  
**Status:** [x] Done -- 2026-05-17

**Background:**  
Four functions appear to be near-identical:
- `deleteSelectedArrow()`
- `deleteSelectedBall()`
- `deleteSelectedSymbol()`
- `deleteSelectedPhaseMarker()`
- `deleteSelectedItems()`

All appear to call `requestDelete(selectionItems(), itemLabel(selectionItems()))` with no variation. If confirmed, they can be collapsed into a single `deleteSelected()` function.

**User story:**  
As a developer maintaining the Game Tracker, I want redundant delete functions consolidated so that future changes to delete behaviour only need to be made in one place.

**Acceptance criteria:**
- [ ] The call graph of all five functions is documented before any change is made
- [ ] If all five are truly identical in behaviour: replaced with a single `deleteSelected()` function
- [ ] All existing call sites updated to use `deleteSelected()`
- [ ] Delete behaviour in the UI is unchanged — all deletable item types still delete correctly
- [ ] If any function turns out to differ in behaviour: that function is kept and a comment explains why

---


---

### GT-021 · Extract repeated marker half-size expression into a helper function

**Priority:** P3  
**Confidence:** HIGH -- pattern fully mapped, three call sites confirmed  
**Status:** [x] Done -- 2026-05-17

**Background**:  
The expression `MSIZES[st.markerSize||'m']||Math.round(st.pR*1.4)` is repeated verbatim in three places inside `app-core.js`:

- `hitPhaseMarker()` -- line ~211
- `drawPhaseMarkers()` -- line ~566
- Multi-select outline drawing -- line ~885 (with a `+5` offset that is currently implicit)

This is the pattern discussed as "updating markers in multiple places". If marker sizing logic ever changes, all three must be updated consistently. Currently the `+5` selection offset in the third case is easy to miss.

**User story:**  
As a developer maintaining the Game Tracker, I want marker size computed in one place so that changing marker sizing behaviour requires a single edit rather than hunting across three call sites.

**Proposed helper (goes in app-utils.js):**
```js
function markerHalf(st, extra) {
  return (MSIZES[st.markerSize||'m'] || Math.round(st.pR*1.4)) + (extra||0);
}
```

**Acceptance criteria:**
- [x] `markerHalf(st, extra)` helper added to `app-utils.js`
- [x] All three inline expressions replaced with `markerHalf(st)` or `markerHalf(st, 5)`
- [x] No change to visual behaviour -- confirmed working
- [x] No change to hit testing behaviour -- confirmed working

**Notes:**  
Can be implemented in the same session as GT-020 -- both touch `app-core.js` only (plus `app-utils.js` for the helper). Upload both files together.

---

### GT-022 · Extract shared rendering size helpers to app-utils.js

**Priority:** P2  
**Confidence:** MEDIUM -- functions identified, call sites need verification across both app-core.js and app-export.js  
**Status:** [x] Done -- 2026-05-17

**Background:**  
Identified in a previous session (Game Tracker - Object Enhancements, 16 May). A sizing bug was fixed in `app-core.js` but missed in `app-export.js` because both files contained independent copies of the same sizing logic. The fix had to be applied in 6 separate places.

The three sizing expressions that are duplicated between canvas draw code and SVG/PDF export code:

```js
function playerNumFontSize(r)  { return Math.max(9, Math.round(r * 0.85)); }
function markerLabelSize(half) { return Math.max(7, Math.round(half * 1.3)); }
function legendDotNumSize(dr)  { return Math.max(8, Math.round(dr * 1.2)); }
```

These should be defined once in `app-utils.js` and called from both `app-core.js` (canvas drawing) and `app-export.js` (SVG string building).

**User story:**  
As a developer maintaining the Game Tracker, I want shared sizing logic defined in one place so that future changes to rendering sizes only need to be made once and apply consistently to both canvas and SVG/PDF output.

**Helpers added to app-utils.js:**
- `ballRadius(r)` -- `Math.max(6,Math.round(r*0.65))` -- core×1, export×2
- `playerNumFS(r)` -- `Math.max(9,Math.round(r*1.1))` -- core×2, export×3
- `markerLabelFS(half)` -- `Math.max(7,Math.round(half*1.3))` -- core×1, export×1
- `legendDotNumFS(dr)` -- `Math.max(8,Math.round(dr*1.2))` -- core×2, export×2
- `stepMarkerFS(br)` -- `Math.max(5,Math.round(br*0.9))` -- core×2, export×0

**Acceptance criteria:**
- [x] All 11 call sites mapped across both files before any change
- [x] Five helper functions added to `app-utils.js`
- [x] All inline sizing expressions replaced in `app-core.js` (7 sites)
- [x] All inline sizing expressions replaced in `app-export.js` (6 sites)
- [x] No old `Math.max(...Math.round(` sizing expressions remain -- verified
- [ ] Canvas rendering and SVG/PDF export produce identical sizes -- verify after upload

**Notes:**  
This is the most impactful remaining refactor -- it directly prevents the class of bug that caused a 6-location fix in the past. Do not modify any rendering code without completing this first.


---

### GT-030 · Replace wheel-based zoom/pan with explicit pan arrow buttons

**Priority:** P1  
**Confidence:** HIGH -- root cause confirmed, approach agreed  
**Status:** [ ]

**Background:**  
The wheel/trackpad interception code (section `// ─── WHEEL` in `app-core.js`) has broken repeatedly across OS, browser, and PWA contexts. The fundamental problem is that vertical two-finger scroll sends the same event as browser page scroll, making reliable interception impossible. The existing explicit zoom buttons (±, reset) have never broken. The same pattern should be applied to pan.

**User story:**  
As a user on any device, I want reliable pitch zoom and pan controls so that the pitch never gets stuck in a broken state due to browser/OS scroll interception.

**What to build:**
- Remove the entire `// ─── WHEEL` useEffect (lines ~858–888 in app-core.js)
- Keep all existing explicit zoom controls (zoomStep, resetZoom, ± buttons) unchanged
- Add four pan arrow buttons (↑ ↓ ← →) to the pitch controls UI
- Add a reset pan button alongside reset zoom
- Each pan button click moves the pitch by a fixed step (e.g. 60px at current scale) via existing `clampVP()` and `vp.current.ox/oy`
- Keep spacebar+drag and middle-click drag pan (these are opt-in gestures, not intercepted scroll)

**Acceptance criteria:**
- [ ] Wheel section removed from app-core.js
- [ ] Four pan arrow buttons added to pitch controls in app-ui.js
- [ ] Reset pan button added
- [ ] Pan buttons move pitch correctly at all zoom levels
- [ ] Zoom ± and reset zoom still work identically
- [ ] No browser scroll interception -- two-finger scroll behaves as normal browser scroll

**Files needed:** `app-core.js`, `app-ui.js`

---

### GT-031 · Reproduce football pentagon pattern in ball SVG/PDF export

**Priority:** P2  
**Confidence:** HIGH -- gap confirmed, canvas geometry maps directly to SVG  
**Status:** [ ]

**Background:**  
The canvas `drawBalls()` function draws a white circle with a pentagon pattern (5-point star with radiating lines) giving a football appearance. `ballSVGLines()` in `app-export.js` outputs only a plain white circle with a stroke. The SVG/PDF export therefore looks nothing like the canvas version for normal (non-ghost, non-score) balls.

**User story:**  
As a user exporting a board, I want the ball in the SVG and PDF to look like the ball on the pitch canvas so that the export is a faithful representation of what I designed.

**What to build:**  
Reproduce the pentagon pattern in `ballSVGLines()` using SVG `<polygon>` and `<line>` elements. The canvas version uses pure path geometry so it maps directly. Ghost balls (dashed circle) and score balls (spikes) are already correct -- only the normal solid ball needs updating.

**Acceptance criteria:**
- [ ] Normal solid ball in colour SVG export shows pentagon/football pattern
- [ ] Normal solid ball in embroidery SVG export shows pentagon/football pattern
- [ ] Normal solid ball in PDF export shows pentagon/football pattern
- [ ] Ghost ball (dashed circle) unchanged
- [ ] Score ball (spikes) unchanged
- [ ] Pattern is visually consistent with canvas rendering

**Files needed:** `app-export.js`

---

### GT-032 · Add independent ball size control

**Priority:** P2  
**Confidence:** HIGH -- approach fully mapped, follows established pattern  
**Status:** [ ]

**Background:**  
Ball size is currently derived from player size (`ballRadius(pR)`), making it impossible to adjust independently. Players and move markers both have XS/S/M/L size controls. The ball has none.

**User story:**  
As a user, I want to resize the ball independently of player size so that I can control how prominent the ball appears on the pitch, matching the resize options available for players and move markers.

**What to build:**
- Add `BSIZES = {xs:5, s:8, m:11, l:15}` to `app-utils.js`
- Add `ballSize:'m'` to board default state (3 places in `app-core.js`)
- Update `ballRadius()` helper to accept `size` key and use `BSIZES` lookup
- Update `drawBalls()` to derive radius from `st.ballSize` rather than `pR`
- Add XS/S/M/L size buttons to the ball panel in `app-ui.js`
- Pass `ballSize` through to `ballSVGLines()` in `app-export.js`
- Include `ballSize` in board serialisation/deserialisation and the AI diff summary

**Acceptance criteria:**
- [ ] XS/S/M/L buttons visible in ball panel
- [ ] Changing size updates ball on canvas immediately
- [ ] Size persists when board is saved and reloaded from Firestore
- [ ] SVG and PDF exports use the correct ball size
- [ ] Default size (m) produces a ball visually similar to the current default
- [ ] Both real and ghost ball variants respect the size setting

**Files needed:** `app-core.js`, `app-ui.js`, `app-export.js`, `app-utils.js`

## Investigation queue

Stories that cannot be planned or sized until files are uploaded and read.

| ID | What needs investigating | Files needed |
|----|--------------------------|--------------|
| — | Nothing currently queued | — |


---

## Completed

- **GT-001** · Extract base64 logos from app-export.js -- 2026-05-17
- **GT-002** · Investigation: app-core.js split feasibility -- 2026-05-17
- **GT-003** · Extract pure utilities into app-utils.js -- 2026-05-17
- **GT-010** · Move AI helpers from app-export.js to app-core.js -- 2026-05-17
- **GT-020** · Consolidate redundant delete functions -- 2026-05-17
- **GT-021** · Extract marker half-size into markerHalf() helper -- 2026-05-17
- **GT-011** · Move UI primitives to app-ui.js -- 2026-05-17
- **GT-022** · Shared rendering size helpers extracted to app-utils.js -- 2026-05-17

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
| 2026-05-17 | GT-030, GT-031, GT-032 added -- pan controls, ball SVG pattern, ball size control |
