# Nutmeg&Needle — Tactics Board

Football tactics board for designing embroidery kit templates. Part of the [Nutmeg&Needle](https://nutmegneedle.com) product system.

## What it does

Draw football tactics on a pitch canvas — players, arrows, phases, balls — then export as print-ready SVG or PDF with DMC thread colour suggestions for embroidery.

## Features

- Interactive pitch canvas with zoom and pan
- Player markers with jersey numbers and team colours
- Arrows (straight, curved, dashed) with customisable styles
- Phase markers to sequence a move step by step
- AI-assisted moment description (Anthropic API)
- Colour SVG export and layered embroidery SVG (Inkscape-compatible)
- PDF export with DMC thread guide
- Cloud board library via Firebase (Google sign-in, syncs across devices)

## Tech

Single-file HTML app — React 18, Babel standalone, jsPDF, Firebase (Auth + Firestore). No build step required.

## Hosting

Served via GitHub Pages. Firebase project: `game-tracker-mph`.

## Usage

Open [https://mats-create.github.io/game-tracker/](https://mats-create.github.io/game-tracker/) in any browser. Sign in with Google to save and sync boards.
