#!/usr/bin/env python3
"""
build.py -- assembles index.html from src/ files.

Usage:
    python3 build.py           # build once
    python3 build.py --watch   # rebuild on every save (needs: pip install watchdog)

Build order:
    src/shell.html      HTML shell with <!-- BABEL_CONTENT_PLACEHOLDER -->
    src/app-utils.js    Pure utility functions and constants (no React dependency)
    src/app-core.js     UI primitives, TacticsBoard component body
    src/app-logos.js    Base64 logo constants used by exportPDF
    src/app-export.js   SVG helpers, exportPDF, exportSVG
    src/app-ui.js       PlayerPanel, JSX render tree, root.render
"""

import os
import sys

SRC_DIR = "src"
OUTPUT = "index.html"
SHELL = os.path.join(SRC_DIR, "shell.html")
PARTS = ["app-utils.js", "app-core.js", "app-logos.js", "app-export.js", "app-ui.js"]
PLACEHOLDER = "<!-- BABEL_CONTENT_PLACEHOLDER -->"

# Sanity checks -- things that must be present in each file
REQUIRED = {
    "app-utils.js":  ["const W=", "function phaseLabel", "function hexToRgb"],
    "app-core.js":   ["function TacticsBoard", "function Card"],
    "app-logos.js":  ["NN_LOGO_REV", "NN_LOGO_LINEN"],
    "app-export.js": ["function pitchSVGLines", "function exportPDF"],
    "app-ui.js":     ["function PlayerPanel", "root.render"],
}


def build():
    # Read shell
    if not os.path.exists(SHELL):
        _fail(f"{SHELL} not found.")

    with open(SHELL, encoding="utf-8") as f:
        shell = f.read()

    if PLACEHOLDER not in shell:
        _fail(f"'{PLACEHOLDER}' not found in {SHELL}")

    # Read and validate each JS file
    js_parts = []
    for name in PARTS:
        path = os.path.join(SRC_DIR, name)
        if not os.path.exists(path):
            _fail(f"{path} not found.")

        with open(path, encoding="utf-8") as f:
            content = f.read()

        for required_string in REQUIRED.get(name, []):
            if required_string not in content:
                _fail(
                    f"{path} is missing expected content: {required_string!r}\n"
                    "The file may be corrupted."
                )

        js_parts.append(
            f"// -- {name} {'─' * max(0, 60 - len(name))}\n{content}"
        )

    # Assemble
    combined_js = "\n\n".join(js_parts)
    result = shell.replace(
        PLACEHOLDER,
        f'<script type="text/babel" data-presets="react">\n{combined_js}\n</script>',
    )

    with open(OUTPUT, "w", encoding="utf-8") as f:
        f.write(result)

    total_kb = sum(len(p) for p in js_parts) // 1024
    print(f"OK: Built {OUTPUT}  ({total_kb} KB of JS across {len(PARTS)} files)")
    return True


def watch():
    try:
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler
        import time
    except ImportError:
        _fail("watchdog not installed. Run: pip install watchdog")

    class Handler(FileSystemEventHandler):
        def on_modified(self, event):
            if not event.is_directory and (
                event.src_path.endswith(".js")
                or event.src_path.endswith(".html")
            ):
                print(f"\nChanged: {event.src_path}")
                build()

    observer = Observer()
    observer.schedule(Handler(), SRC_DIR, recursive=False)
    observer.start()
    print(f"Watching {SRC_DIR}/ for changes... (Ctrl+C to stop)\n")
    build()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


def _fail(msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    if "--watch" in sys.argv:
        watch()
    else:
        ok = build()
        sys.exit(0 if ok else 1)
