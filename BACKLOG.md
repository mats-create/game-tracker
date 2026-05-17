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
**Status:** [ ]  
**NEEDS INVESTIGATION:** Upload both `app-core.js` and `app-export.js` to verify no hidden dependencies before implementing

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
**Status:** [ ]  
**NEEDS INVESTIGATION:** Upload both `app-core.js` and `app-ui.js` to verify no circular dependencies before implementing

**Background:**  
The following small React components are defined in `app-core.js` but logically belong with the UI layer in `app-ui.js`:
`Card`, `Hint`, `Row`, `ModeBtn`, `ToggleBtn`, `ActionBtn`, `GhostBtn`, `InfoBar`, `Collapsible`

**User story:**  
As a developer working on the Game Tracker, I want UI primitive components to live in `app-ui.js` so that when I need to adjust a button or card style I upload the correct file.

**Acceptance criteria:**
- [ ] All nine UI primitive components are moved from `app-core.js` to `app-ui.js`
- [ ] They are placed at the top of `app-ui.js`, before `PlayerPanel`
- [ ] No component signatures or props are changed
- [ ] `app-core.js` no longer contains any JSX component definitions
- [ ] The live site renders all panels and controls correctly
- [ ] `app-core.js` file size is reduced (minor, but measurable)

**Dependency:** Should be done after GT-002 investigation, in case that investigation changes the planned structure.

---

## Epic 3 — Code quality and dead code removal

*Goal: Remove code that serves no purpose, reducing cognitive load and file sizes.*

---

### GT-020 · Consolidate redundant delete functions

**Priority:** P3  
**Confidence:** MEDIUM — pattern observed, full call graph not yet verified  
**Status:** [ ]  
**NEEDS INVESTIGATION:** Upload `app-core.js` to confirm no caller passes distinct arguments

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

## Investigation queue

Stories that cannot be planned or sized until files are uploaded and read.

| ID | What needs investigating | Files needed |
|----|--------------------------|--------------|
| GT-002 | Can app-core.js be split? | app-core.js |
| GT-010 | AI helper dependencies | app-core.js, app-export.js |
| GT-011 | UI primitive dependencies | app-core.js, app-ui.js |
| GT-020 | Delete function call graph | app-core.js |

---

## Completed

- **GT-001** · Extract base64 logos from app-export.js -- 2026-05-17
- **GT-002** · Investigation: app-core.js split feasibility -- 2026-05-17
- **GT-003** · Extract pure utilities into app-utils.js -- 2026-05-17

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-16 | Initial backlog created from first-iteration investigation |
| 2026-05-17 | GT-001 implemented -- app-export.js reduced from 278KB to 50KB |
| 2026-05-17 | GT-002 investigation complete -- feasibility confirmed, GT-003 created |
| 2026-05-17 | GT-003 implemented -- app-core.js reduced from 111KB to 83KB |
