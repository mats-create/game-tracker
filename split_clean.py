#!/usr/bin/env python3
"""
split_clean.py — one-time setup script.

Run once from the repo root:
    python3 split_clean.py

What it does:
  1. Reads the current index.html
  2. Splits the JS into three files in src/
  3. Writes src/shell.html (the HTML wrapper)
  4. Creates .github/workflows/build.yml (auto-build on push)
  5. Runs build.py to verify everything round-trips correctly

After this you never touch index.html directly.
Edit files in src/ and push — GitHub Actions rebuilds index.html automatically.
"""

import os
import re
import sys
import subprocess

SRC = "index.html"
OUT_DIR = "src"

EXPORT_START    = "// ─── SHARED SVG HELPERS"
EXPORT_FALLBACK = "function pitchSVGLines("
UI_START        = "// ─── PLAYER PANEL SUB-COMPONENT"
UI_FALLBACK     = "function PlayerPanel()"
PLACEHOLDER     = "<!-- BABEL_CONTENT_PLACEHOLDER -->"

WORKFLOW_DIR  = os.path.join(".github", "workflows")
WORKFLOW_FILE = os.path.join(WORKFLOW_DIR, "build.yml")

WORKFLOW_CONTENT = """\
name: Build index.html from src/

on:
  push:
    branches:
      - main
    paths:
      - 'src/**'
      - 'build.py'

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Build index.html
        run: python3 build.py

      - name: Commit and push if changed
        run: |
          git config user.name  "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add index.html
          git diff --cached --quiet && echo "No changes to index.html" && exit 0
          git commit -m "Auto-build: rebuild index.html from src/"
          git push
"""


def find_first(content, *markers):
    for marker in markers:
        idx = content.find(marker)
        if idx != -1:
            return idx, marker
    return -1, None


def _write(path, content):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Wrote {path}  ({len(content):,} chars)")


def main():
    # ── Pre-flight checks ────────────────────────────────────────────────
    if not os.path.exists(SRC):
        sys.exit(f"ERROR: {SRC} not found. Run this script from the repo root.")

    if not os.path.exists("build.py"):
        sys.exit("ERROR: build.py not found. Put both scripts in the repo root.")

    if os.path.exists(OUT_DIR) and os.listdir(OUT_DIR):
        answer = input(f"\n{OUT_DIR}/ already exists and has files. Overwrite? [y/N] ").strip().lower()
        if answer != "y":
            sys.exit("Aborted.")

    # ── Read source ──────────────────────────────────────────────────────
    with open(SRC, encoding="utf-8") as f:
        raw = f.read()
    print(f"\nRead {SRC}: {len(raw):,} chars")

    # ── Find the Babel <script> block ────────────────────────────────────
    babel_pat = re.compile(
        r'<script\s+type="text/babel"\s+data-presets="react">',
        re.IGNORECASE,
    )
    m = babel_pat.search(raw)
    if not m:
        sys.exit('ERROR: could not find <script type="text/babel" data-presets="react">')

    babel_tag_start    = m.start()
    babel_content_start = m.end()

    body_pos   = raw.rfind("</body>")
    babel_close = raw.rfind("</script>", babel_content_start, body_pos if body_pos != -1 else len(raw))
    if babel_close == -1:
        sys.exit("ERROR: could not find closing </script> for the Babel block")

    babel_js   = raw[babel_content_start:babel_close]
    html_after = raw[babel_close + len("</script>"):]
    print(f"Babel JS block: {len(babel_js):,} chars")

    # ── Find cut points ──────────────────────────────────────────────────
    cut_export, exp_m = find_first(babel_js, EXPORT_START, EXPORT_FALLBACK)
    if cut_export == -1:
        sys.exit(
            f"ERROR: could not find export section.\n"
            f"Searched for: {EXPORT_START!r}\n"
            f"          or: {EXPORT_FALLBACK!r}"
        )

    cut_ui, ui_m = find_first(babel_js, UI_START, UI_FALLBACK)
    if cut_ui == -1:
        sys.exit(
            f"ERROR: could not find UI section.\n"
            f"Searched for: {UI_START!r}\n"
            f"          or: {UI_FALLBACK!r}"
        )

    if cut_export >= cut_ui:
        sys.exit(
            f"ERROR: export marker ({cut_export:,}) is not before UI marker ({cut_ui:,}).\n"
            "The markers may be in an unexpected order."
        )

    print(f"Cut 1 (export): char {cut_export:,}  matched {exp_m!r}")
    print(f"Cut 2 (UI):     char {cut_ui:,}  matched {ui_m!r}")

    # ── Extract sections ─────────────────────────────────────────────────
    core_js   = babel_js[:cut_export].strip()
    export_js = babel_js[cut_export:cut_ui].strip()
    ui_js     = babel_js[cut_ui:].strip()

    # Warn if sections look wrong
    warnings = []
    if len(core_js) < 50_000:
        warnings.append(f"app-core.js is only {len(core_js):,} chars — expected ~200KB")
    if "root.render" not in ui_js:
        warnings.append("root.render not found in app-ui.js")
    if "function pitchSVGLines" not in export_js:
        warnings.append("pitchSVGLines not found in app-export.js")
    for w in warnings:
        print(f"WARNING: {w}")

    # ── Write files ──────────────────────────────────────────────────────
    print("\nWriting src/ files:")

    shell = (
        raw[:babel_tag_start].rstrip()
        + f"\n\n{PLACEHOLDER}\n\n"
        + html_after.lstrip()
    )
    _write(os.path.join(OUT_DIR, "shell.html"), shell)

    _write(
        os.path.join(OUT_DIR, "app-core.js"),
        "// app-core.js — constants, canvas draw functions, TacticsBoard component body\n"
        "// Nutmeg&Needle Game Tracker — edit this file, not index.html\n\n"
        + core_js + "\n",
    )
    _write(
        os.path.join(OUT_DIR, "app-export.js"),
        "// app-export.js — SVG helpers, exportPDF, exportSVG\n"
        "// Nutmeg&Needle Game Tracker — edit this file, not index.html\n\n"
        + export_js + "\n",
    )
    _write(
        os.path.join(OUT_DIR, "app-ui.js"),
        "// app-ui.js — PlayerPanel sub-component, JSX render tree, root.render\n"
        "// Nutmeg&Needle Game Tracker — edit this file, not index.html\n\n"
        + ui_js + "\n",
    )

    # ── Write GitHub Actions workflow ────────────────────────────────────
    print("\nWriting GitHub Actions workflow:")
    _write(WORKFLOW_FILE, WORKFLOW_CONTENT)

    # ── Verify: rebuild index.html and check it matches the original ─────
    print("\nVerifying round-trip (running build.py)...")
    result = subprocess.run([sys.executable, "build.py"], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"ERROR: build.py failed:\n{result.stderr}")
        sys.exit(1)
    print(result.stdout.strip())

    with open(OUTPUT if (OUTPUT := "index.html") else "index.html", encoding="utf-8") as f:
        rebuilt = f.read()

    if len(rebuilt) < len(raw) * 0.95:
        print(f"WARNING: rebuilt index.html ({len(rebuilt):,}) is much smaller than original ({len(raw):,})")
    else:
        print(f"OK: rebuilt index.html is {len(rebuilt):,} chars (original was {len(raw):,})")

    # ── Done ─────────────────────────────────────────────────────────────
    print("""
Done! Here is what to do next:

  1. Test locally:
       python3 -m http.server 8080
       Open http://localhost:8080 — confirm the app works

  2. Commit everything:
       git add src/ .github/ build.py split_clean.py index.html
       git commit -m "Split into src/ files with auto-build workflow"
       git push

  3. From now on:
       - Edit files in src/  (app-core.js, app-export.js, app-ui.js)
       - Push to GitHub
       - GitHub Actions rebuilds index.html automatically
       - GitHub Pages serves the updated app within ~30 seconds

  In Claude conversations:
       - Upload only the file you want to work on that day
       - No more uploading the entire 400KB index.html
""")


if __name__ == "__main__":
    main()
