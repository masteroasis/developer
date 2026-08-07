# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This repository currently contains only two files, with no build tooling, package manifest, test suite, or framework:

- `hello_world.txt` — a plain text note (`#Odin Project`), suggesting this repo originated as Odin Project coursework/exercises.
- `webpage.html` — a bare HTML fragment (no `<!DOCTYPE>`/`<html>`/`<head>` wrapper) with a header, paragraph, an `<insert>` placeholder tag, and a button.

There is no README, no `package.json`/`Makefile`/other build config, and no `.cursorrules` or Copilot instructions to incorporate.

## Working in this repo

- There are no build, lint, or test commands to run — none are configured.
- `webpage.html` is not a complete HTML document; if extending it, be aware it's missing `<!DOCTYPE html>`, `<html>`, `<head>`, and `<body>` tags.
- Since there's no existing architecture or convention to follow, infer intent from the user's request rather than assuming a particular framework or structure. Ask before introducing tooling (e.g., a package manager or bundler) that isn't already present.

Update this file as the repository grows real structure (source directories, a package manifest, tests, etc.) so future guidance stays accurate.
