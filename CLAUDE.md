# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This repository has no build tooling, package manifest, test suite, or framework — it's plain static HTML/CSS/JS served as-is. Files:

- `index.html` / `styles.css` — the Lakefront Technology Professional Services marketing site: a single-page layout with header/nav, hero, services grid, about, "why us", contact form, and footer. All styling lives in `styles.css` (no CSS framework, no build step); the only inline JS is a one-line footer year updater.
- `hello_world.txt` — a leftover plain-text note (`#Odin Project`) from this repo's original Odin Project coursework origin.
- `webpage.html` — an earlier standalone HTML fragment (no `<!DOCTYPE>`/`<html>`/`<head>` wrapper), unrelated to the Lakefront site; not linked from `index.html`.

There is no README, no `package.json`/`Makefile`/other build config, and no `.cursorrules` or Copilot instructions to incorporate.

## Working in this repo

- There are no build, lint, or test commands — none are configured. Preview changes by serving the directory statically, e.g. `python3 -m http.server` and opening `index.html`.
- Keep `index.html` and `styles.css` as plain, dependency-free HTML/CSS unless the user asks for a framework or build step — nothing in the repo currently requires one.
- The color palette and section conventions (eyebrow label, section title, card grid) are defined at the top of `styles.css` under `:root` and are reused across all sections — extend via those existing classes/variables rather than introducing new one-off styles.
- Since there's no other existing architecture to follow, infer intent from the user's request rather than assuming a particular framework or structure. Ask before introducing tooling (e.g., a package manager or bundler) that isn't already present.

Update this file as the repository grows real structure (source directories, a package manifest, tests, etc.) so future guidance stays accurate.
