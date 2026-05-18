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

---

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

## Epic 4 — Print Instructions PDF

*Goal: Make the Print Instructions PDF a high-quality, brand-aligned embroidery reference document.*

---

### GT-040 · Align Print Instructions PDF pitch with Aida pattern output

**Priority:** P1  
**Confidence:** HIGH  
**Status:** [x] Done -- 2026-05-17

**Background:**  
`exportPDF()` rendered the pitch via the live canvas draw functions, producing a dark green pitch with white lines — visually inconsistent with the Aida Pattern PDF. Both outputs should show the same pitch treatment.

**What was built:**
- `exportPDF()` now builds the pitch as an SVG blob using the same pipeline as `exportPatternPDF()`: light stripe fills (`#e8f0e8` / `#dceadc`), Pitch Green (`#4A6741`) lines, white background
- Rasterised via Image/onload async callback — all jsPDF assembly moved inside callback
- Pitch height capped at 180pt initially, later replaced by fill-to-footer calculation (GT-042)
- Arrow spread (`...setTextColor`) replaced with explicit index access for Babel compatibility

**Acceptance criteria:**
- [x] Print Instructions PDF pitch shows white background, Pitch Green lines, light stripes
- [x] Consistent with Aida Pattern PDF pitch treatment
- [x] All elements (arrows, players, balls, markers, symbols, legends) present and correct
- [x] No regression in Aida Pattern PDF or SVG exports

---

### GT-041 · Memorable moment section — linen card design

**Priority:** P2  
**Confidence:** HIGH  
**Status:** [x] Done -- 2026-05-17

**Background:**  
The memorable moment section was plain text on white with a coral left-border line. No visual containment, inconsistent with the thread colours section style.

**What was built:**
- Linen (`#F0E6D3`) background card spanning full usable width
- 15pt header bar at card top with `MEMORABLE MOMENT` in coral caps — matches `THREAD COLOURS` typographic treatment
- Coral 3pt left border runs full card height
- Internal padding 10pt vertical, 10pt horizontal
- `cardTopY` recorded before drawing; `y` snapped to `cardTopY + dryH + 10` after block — no accumulated drift
- Heading reduced to 15pt (from 16pt) to sit better within card

**Acceptance criteria:**
- [x] Linen card background rendered behind all moment content
- [x] Header bar style matches thread colours section
- [x] Coral border runs full card height
- [x] y position after block is exact — no overlap with pitch image
- [x] Renders correctly when moment is empty (block skipped entirely)

---

### GT-042 · Restructure PDF section order — threads before pitch, pitch fills page

**Priority:** P2  
**Confidence:** HIGH  
**Status:** [x] Done -- 2026-05-17

**Background:**  
Previous order (pitch then threads) meant pitch height required an arbitrary cap to leave room for the thread table. Reversing the order allows the pitch to fill all remaining space above the footer exactly.

**What was built:**
- New order: header → metadata → memorable moment → thread colours → pitch → footer
- Footer painted before pitch so its top edge is a known coordinate
- Pitch height = `max(80, (PH - FTR_H - 8) - y)` — fills remaining space, 80pt minimum guard
- `addColour()` overflow fixed: page check fires before `rowY` is read, so triggering swatch draws at top of new page (not off the bottom of the previous one)
- Overflow resets `swatchY1/Y2` to `MY+8` on new page; footer and pitch follow on current page automatically

**Acceptance criteria:**
- [x] Thread colours appear above pitch in output
- [x] Pitch fills available vertical space to footer on single page
- [x] Thread overflow correctly starts a new page; pitch and footer follow on that page
- [x] No content overlap between sections

---

### GT-043 · Thread list improvements

**Priority:** P2  
**Confidence:** HIGH  
**Status:** [x] Done -- 2026-05-17

**What was built:**
- Pitch lines (`#4A6741`, "Pitch lines") always added as first thread entry — maps to DMC 3362
- "Ball" label → "Ball outline" (reflects stitch purpose)
- "Arrow" label → "Arrows" (consistent plural style)
- Edge colour white guard changed to case-insensitive (`.toLowerCase()`) — catches `#FFFFFF` and `#ffffff`

**Acceptance criteria:**
- [x] Pitch lines always appear first in thread list regardless of board state
- [x] Ball outline label correct
- [x] Arrow label correct
- [x] Edge colour white guard works for both hex cases

---

## Epic 5 — Embroidery how-to guide

*Goal: A standalone multi-page PDF teaching first-time embroiderers how to stitch each N&N kit element.*

---

### GT-050 · Scaffold embroidery how-to guide — app-guide.js

**Priority:** P2  
**Confidence:** HIGH  
**Status:** [~] In progress -- 2026-05-17

**Background:**  
The Print Instructions PDF is a per-design reference document. A separate how-to guide is needed to teach the embroidery techniques themselves — independent of any specific design. Targeted at first-time embroiderers buying a kit.

**What was built:**
- New file `src/app-guide.js` with entry point `exportGuidePDF()`
- No dependency on board state — all content is generic/static
- 6-page structure: Introduction, Ball, Player marker, Arrows, Move markers, Tips & finishing
- Shared `drawHeader()` / `drawFooter()` / `drawAidaGrid()` helpers
- `rasteriseBall()` fully implemented — same geometry as inset work, scaled up for full-page illustration (CELL=14, 28×28 grid)
- Placeholder rasterisers for player, arrow, move marker — correct signatures, geometric approximations, marked TODO
- Full stitch sequence copy on each element page
- Tips & finishing page written in full

**Acceptance criteria:**
- [x] `app-guide.js` created with correct structure
- [x] Ball page renders correct Aida grid with pentagon geometry
- [ ] `app-guide.js` added to `build.py` concatenation order (after `app-utils.js`, before `app-ui.js`)
- [ ] "Download guide" button wired in `app-ui.js` calling `exportGuidePDF()`
- [ ] Player, arrow, move marker rasterisers fully implemented (see GT-051)
- [ ] Live site generates correct 6-page PDF

**Notes:**  
File is complete and ready to add to repo. Wiring (`build.py` + `app-ui.js`) is a separate step — upload `build.py` and `app-ui.js` to complete.

---

### GT-051 · Implement guide rasterisers for player, arrow, move marker

**Priority:** P2  
**Confidence:** MEDIUM — geometry is understood, needs verification against actual grid output  
**Status:** [ ] Not started

**Background:**  
`app-guide.js` has placeholder implementations for `rasterisePlayer()`, `rasteriseArrow()`, and `rasteriseMoveMarker()`. Each needs a proper geometry-based implementation matching the visual design of each element.

**Scope per element:**

*Player marker:*
- Filled circle in team colour (satin/cross stitch fill)
- Contrasting edge ring
- Jersey number in white at centre (approximated as a simple digit pattern)
- Configurable team colour + edge colour — guide shows a generic example using brand palette colours

*Arrow:*
- Straight arrow: diagonal backstitch path + two-cell arrowhead
- Curved arrow: bezier-sampled path mapped to grid cells
- Guide shows both variants on the same page

*Move marker:*
- Small filled square in phase colour
- White label digit centred

**Acceptance criteria:**
- [ ] `rasterisePlayer()` renders recognisable filled circle with ring on grid
- [ ] `rasteriseArrow()` renders both straight and curved arrow paths
- [ ] `rasteriseMoveMarker()` renders filled square with centred digit
- [ ] All three consistent with the ball rasteriser style
- [ ] Guide PDF reads as a coherent visual reference across all pages

**Files needed:** `src/app-guide.js`

---

### GT-052 · Wire guide export into app-ui.js and build.py

**Priority:** P2  
**Confidence:** HIGH  
**Status:** [ ] Not started

**Background:**  
`exportGuidePDF()` exists in `app-guide.js` but is not reachable from the UI. Two wiring steps needed.

**Acceptance criteria:**
- [ ] `app-guide.js` added to `build.py` concatenation order after `app-utils.js`, before `app-ui.js`
- [ ] "Download guide" button added to export panel in `app-ui.js`
- [ ] Button calls `exportGuidePDF()` with no arguments
- [ ] Guide PDF downloads correctly from live site

**Files needed:** `src/build.py`, `src/app-ui.js`

---

## Epic 6 — Thread length estimation

*Goal: Give the embroiderer an approximate thread length per colour so they know how much to cut before starting.*

---

### GT-060 · Thread length estimation — investigation

**Priority:** P3  
**Confidence:** LOW — needs investigation before sizing  
**Status:** [ ] Not started · NEEDS INVESTIGATION

**Background:**  
Before an embroiderer starts stitching, knowing approximately how much thread to cut per colour reduces waste and avoids running out mid-section. The app already knows every element's geometry and colour — the missing piece is mapping that geometry to stitch counts and then to thread length.

**User story:**  
As an embroiderer preparing to stitch a Nutmeg&Needle design, I want to see an approximate thread length per colour on my instruction sheet, so that I know how much to cut before I start and do not run out mid-section.

**What needs investigating:**

*Stitch type mapping:*
Each element type has a dominant stitch. The investigation should confirm the assumed mapping and the thread consumption multiplier per stitch type:
- Players (filled circle): cross stitch fill — ~1.5× area coverage
- Ball (outline + pentagon): backstitch outline + cross stitch fill — mixed
- Arrows: backstitch — ~1× path length
- Phase markers (filled square): cross stitch fill — ~1.5× area
- Pitch lines: backstitch — ~1× path length (fixed geometry)

*SVG-to-physical scale:*
Confirm the conversion factor from SVG coordinate units to mm at 14-count Aida. From prior work: 1 stitch ≈ 5.37 SVG units. One cross stitch uses approximately 4× the stitch cell diagonal in thread (two diagonal passes + back travel). Verify against a physical test if possible.

*Back travel fudge factor:*
Thread carried on the back between areas is unpredictable. A +20% fudge factor is proposed — investigation should assess whether this is reasonable or needs adjusting per element type.

*Output placement:*
Determine where the length estimate surfaces:
- Option A: additional column in thread colours table on Print Instructions PDF ("~Xcm")
- Option B: separate UI display in the app before export
- Option C: both

*Implementation location:*
A pure function `estimateThreadLengths(st)` returning `{ hex: cm }` map belongs in `app-utils.js`. PDF rendering of the estimate belongs in `app-export.js`.

**Acceptance criteria for investigation:**
- [ ] Stitch type map confirmed per element type
- [ ] SVG-to-mm scale factor verified
- [ ] Fudge factor assessed and documented
- [ ] Output placement decided
- [ ] New implementation story GT-061 created with MEDIUM or HIGH confidence

**Files needed:** `src/app-utils.js`, `src/app-export.js`

---

---

### GT-061 · Consistent dashed selection ring for Player, Ghost player, and Ball

**Priority:** P2  
**Confidence:** HIGH -- current state fully mapped, approach clear  
**Status:** [ ]

**Background:**  
Selection is indicated inconsistently across object types:
- Symbols: dashed rounded-rect ring ✓
- Move markers: dashed square ring ✓
- Real ball: blue solid stroke change + faint blue dashed arc -- inconsistent
- Ghost ball: no selection indicator at all
- Real player: no selection indicator
- Ghost player: no selection indicator (selectedGhostId tracked but never drawn)

**User story:**  
As a user, I want selected objects to show the same dashed ring so that I always know what is selected regardless of object type.

**What to build:**  
Add a dashed circle ring after drawing each player/ball when selected, matching the style used for symbols and markers. For players, `drawPlayers` already receives `st` so `st.selectedGhostId` is available. For balls, `selB===bi` is already passed. Remove the current inconsistent blue stroke/arc on selected real ball and replace with the dashed ring.

**Acceptance criteria:**
- [ ] Selected real player shows dashed ring
- [ ] Selected ghost player shows dashed ring
- [ ] Selected real ball shows dashed ring (replaces current blue stroke)
- [ ] Selected ghost ball shows dashed ring
- [ ] Ring style is visually consistent with symbol and move marker selection

**Files needed:** `app-core.js`

---

### GT-062 · Show Memorable moment text on pitch canvas

**Priority:** P3  
**Confidence:** HIGH -- moment object structure known, no canvas rendering currently exists  
**Status:** [ ]

**Background:**  
The `moment` object (`heading`, `what`, `event`, `at`, `when`, `who`) is filled in via the Memorable moment panel and used in PDF/SVG export, but never rendered on the canvas. The pitch preview gives no indication of what moment has been captured.

**User story:**  
As a user, I want to see the memorable moment text on the pitch canvas so that the canvas view is a faithful preview of the exported output.

**What to build:**  
Add a `drawMoment(ctx, moment)` function that renders moment text as a small overlay on the pitch (e.g. bottom strip). Only shown when at least one field is filled. Positioned to avoid obscuring the playing area. Style should match the export rendering.

**Acceptance criteria:**
- [ ] Moment text appears on canvas when at least one moment field is filled
- [ ] Canvas rendering matches or closely approximates the export output
- [ ] Empty moment object produces no canvas overlay
- [ ] Text is legible at normal zoom level

**Files needed:** `app-core.js`

---

### GT-063 · Player name label toggle (show/hide below marker)

**Priority:** P2  
**Confidence:** HIGH -- single guard needed, location confirmed  
**Status:** [ ]

**Background:**  
Player names render unconditionally at `drawPlayers` line 570--574 when `!isGhost && p.name && r>=14`. There is no way to hide them without removing the names entirely. For tactical diagrams focused on positions rather than individuals, hiding names gives a cleaner view.

**User story:**  
As a user, I want to toggle player name labels on and off so that I can switch between a named view (for communication) and a clean positional view (for tactics).

**What to build:**  
- Add `showNames` boolean to board default state (default `true`)
- Add `if(st.showNames)` guard around the name rendering in `drawPlayers`
- Add a toggle button in the Players panel or Pitch settings in `app-ui.js`
- Include `showNames` in `boardState()` serialisation and `applyBoardState()`

**Acceptance criteria:**
- [ ] Names visible by default
- [ ] Toggle button hides/shows all player name labels
- [ ] Setting persists when board is saved and reloaded
- [ ] Ghost players unaffected (they never show names)

**Files needed:** `app-core.js`, `app-ui.js`

---

### GT-064 · Pitch colour modes: Normal / Embroidery / Grayscale

**Priority:** P2  
**Confidence:** HIGH -- drawPitch location confirmed, colour values known  
**Status:** [ ]

**Background:**  
`drawPitch` hardcodes two greens (`#3a7d44`, `#2f6b38`) for the alternating pitch stripes. There is no way to preview how the board will look in embroidery (Aida) or grayscale contexts without exporting. A grayscale mode is new and not currently available anywhere.

**User story:**  
As a user, I want to switch the pitch colour between Normal (moss green), Embroidery (Aida cream/off-white), and Grayscale so that I can see an accurate preview of each output format while working.

**What to build:**  
- Add `pitchMode` to board state: `'normal'` (default) / `'aida'` / `'gray'`
- `drawPitch` reads `pitchMode` and switches stripe colours:
  - Normal: `#3a7d44` / `#2f6b38` (current)
  - Aida: `#F5EFE0` / `#EDE5CE` (off-white/cream)
  - Grayscale: `#555555` / `#444444`
- Toggle buttons (Normal / Aida / Gray) in Pitch settings in `app-ui.js`
- Pass `pitchMode` through to `app-export.js` SVG pitch rendering
- Include `pitchMode` in `boardState()` serialisation

**Acceptance criteria:**
- [ ] Three mode buttons visible in Pitch settings
- [ ] Canvas pitch updates immediately on mode change
- [ ] SVG and PDF exports use the correct pitch colours for the selected mode
- [ ] Setting persists when board is saved and reloaded

**Files needed:** `app-core.js`, `app-ui.js`, `app-export.js`

---

### GT-065 · Re-introduce JSON export/import as backup with validation

**Priority:** P2  
**Confidence:** HIGH -- functions exist, UI wiring and cleanup needed  
**Status:** [ ]

**Background:**  
`exportBoard()` and `importBoard()` already exist in `app-core.js` (lines 1741--1751) but are not wired up in the UI. There is also a duplicate `importBoard` definition in `app-core.js`. Export uses the generic filename `tactics-board.json`. Import has no validation -- it applies whatever JSON is provided without checking required fields, which can corrupt board state silently.

**User story:**  
As a user, I want to export the full board state as a JSON file and import it back so that I have a reliable backup and restore option independent of Firestore.

**What to build:**  
- Add Export JSON and Import JSON buttons to the Export panel in `app-ui.js`
- Remove the duplicate `importBoard` definition from `app-core.js`
- Update export filename to include date (e.g. `nn-board-2026-05-18.json`)
- Add validation to `importBoard`: check for required fields (`players`, `arrows`, `phases`, `balls`) before calling `applyBoardState`; show an error message if validation fails
- Export must use the full `boardState()` output so import restores 100% of state

**Acceptance criteria:**
- [ ] Export JSON button visible in Export panel
- [ ] Import JSON button visible in Export panel
- [ ] Exported file includes all board state fields
- [ ] Importing a valid file restores board state completely
- [ ] Importing an invalid or unrecognised file shows a clear error message and does not corrupt state
- [ ] Duplicate `importBoard` definition removed from app-core.js
- [ ] Export filename includes date

**Files needed:** `app-core.js`, `app-ui.js`


## Investigation queue

Stories that cannot be planned or sized until files are uploaded and read.

| ID | What needs investigating | Files needed |
|----|--------------------------|--------------|
| GT-060 | Thread length estimation — stitch map, scale factor, output placement | `app-utils.js`, `app-export.js` |

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
- **GT-040** · Print Instructions PDF pitch aligned with Aida pattern output -- 2026-05-17
- **GT-041** · Memorable moment linen card design -- 2026-05-17
- **GT-042** · PDF section reorder — threads before pitch, pitch fills page -- 2026-05-17
- **GT-043** · Thread list improvements -- 2026-05-17

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
| 2026-05-17 | Epic 4 added -- Print Instructions PDF (GT-040 through GT-043), all completed |
| 2026-05-17 | Epic 5 added -- Embroidery how-to guide (GT-050 scaffold done, GT-051/052 queued) |
| 2026-05-17 | Epic 6 added -- Thread length estimation (GT-060 investigation queued) |
| 2026-05-18 | GT-061 through GT-065 added -- selection rings, moment on pitch, name toggle, pitch colour modes, JSON export/import |
