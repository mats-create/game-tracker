# Nutmeg&Needle — Tactics Board

Football tactics board for designing embroidery kit templates. Part of the [Nutmeg&Needle](https://nutmegneedle.com) product system.

## What it does

Draw football tactics on a pitch canvas — players, arrows, phases, balls — then export as print-ready SVG or PDF with DMC thread colour suggestions for embroidery.

## Features

- Interactive pitch canvas with zoom (±) and pan (↑↓←→) controls
- Player markers with jersey numbers and team colours
- Ghost players (diagonal-striped, no number) and ghost balls for showing alternative positions
- Arrows (straight, curved, dashed) with customisable styles and arrowhead sizes
- Phase markers to sequence a move step by step, with event icons
- Ball placement with independent size control (XS/S/M/L) and score/goal marker
- AI-assisted moment description (Anthropic API)
- Colour SVG export and layered embroidery SVG (Inkscape-compatible)
- PDF/aida pattern export with DMC thread guide and football pentagon ball pattern
- Cloud board library via Firebase (Google sign-in, syncs across devices)

## Tech

Single-page React 18 app — Babel standalone (no build step), jsPDF, Firebase Auth + Firestore. Source split across `src/` files, concatenated into `index.html` by a GitHub Actions pipeline on every push.

## Hosting

Served via GitHub Pages. Firebase project: `game-tracker-mph`.

## Usage

Open [https://mats-create.github.io/game-tracker/](https://mats-create.github.io/game-tracker/) in any browser. Sign in with Google to save and sync boards.
