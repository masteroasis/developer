# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This repository has no build tooling, package manifest, test suite, or framework — it's plain static HTML/CSS/JS served as-is. Files:

- `index.html` / `styles.css` / `script.js` — the Lakefront Technology Professional Services marketing site: a single-page layout with header/nav, hero, services grid, about, "why us", contact form, and footer. All styling lives in `styles.css` (no CSS framework, no build step). `script.js` (vanilla JS, no dependencies) drives the footer year, scroll-reveal animations (`.reveal` / `.reveal.is-visible`, via `IntersectionObserver`), animated stat counters (`[data-count]`/`[data-suffix]`), the hero's mouse-parallax pine-tree scene (`.parallax-layer[data-depth]`), and the header's scrolled-shadow state — all gated behind a `prefers-reduced-motion` check in JS, with a matching CSS `@media (prefers-reduced-motion: reduce)` override as a fallback.
- `hello_world.txt` — a leftover plain-text note (`#Odin Project`) from this repo's original Odin Project coursework origin.
- `webpage.html` — an earlier standalone HTML fragment (no `<!DOCTYPE>`/`<html>`/`<head>` wrapper), unrelated to the Lakefront site; not linked from `index.html`.
- `.github/workflows/deploy.yml` — deploys the site to Cloudflare Pages via `cloudflare/pages-action`, using Direct Upload (no build step, `directory: .`). Runs on push to `main` (production deploy) and on pull requests targeting `main` (preview deploy). Requires two repo secrets that are not stored in this repo: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, plus a Cloudflare Pages project named `lakefront-technology` (update `projectName` in the workflow if the actual project is named differently).
- `thewaters/` — a self-contained, dependency-free site for **thewaters.life**, a church women's group. A *separate* project from the Lakefront site, parked here until it is exported to its own repo; `thewaters/README.md` is the source of truth for its setup, editing workflow, open decisions, and GoDaddy DNS steps. Publishable files live in `thewaters/public/`; its `deploy.yml` uses `cloudflare/wrangler-action` (not the deprecated `pages-action`) and is inert while nested in a subdirectory, since GitHub only runs workflows from the repository root. Notes for working in it:
  - Warm sunlit-water theme with a canvas bubble field (`.bubble-field`) fixed behind the page; bubbles rise ambiently and are accelerated by scroll velocity. Sections are deliberately **translucent** so the bubbles show through — giving a full-width block an opaque background breaks the effect. Cards use frosted glass (`--card` + `backdrop-filter`) to stay readable over the motion.
  - `public/config.js` holds all feature switches (events source, contact endpoint, volunteer/booking links, support items). Every feature is off until a URL is pasted in, and each section renders an honest "not connected" note instead of a dead control. It ships to the browser, so it must only ever contain public URLs — never API keys or Stripe secret keys.
  - Bulletin content comes from `public/events.js`, or from a published Google Sheet CSV / JSON feed when `eventsSource` is a URL, falling back to `events.js` if the remote source fails. Event dates parse as local, not UTC, so they don't render a day early west of Greenwich.
  - Scheduling (RSVP, volunteer slots) and sales (fees, merch, giving) are laid out but intentionally inert pending one open question: whether the church already uses Planning Center, Breeze, or Tithe.ly. See "Decisions still open" in that README before building either out.

There is no README, no `package.json`/`Makefile`/other build config, and no `.cursorrules` or Copilot instructions to incorporate.

## Working in this repo

- There are no build, lint, or test commands — none are configured. Preview changes by serving the directory statically, e.g. `python3 -m http.server` and opening `index.html`.
- Keep `index.html`, `styles.css`, and `script.js` plain and dependency-free unless the user asks for a framework or build step — nothing in the repo currently requires one.
- The color palette and section conventions (eyebrow label, section title, card grid) are defined at the top of `styles.css` under `:root` and are reused across all sections — extend via those existing classes/variables rather than introducing new one-off styles.
- New scroll-triggered entrance animations should use the existing `.reveal` class rather than inventing a new mechanism; staggering within a grid happens automatically via the `.reveal:nth-child(n)` delay rules already in `styles.css`.
- Since there's no other existing architecture to follow, infer intent from the user's request rather than assuming a particular framework or structure. Ask before introducing tooling (e.g., a package manager or bundler) that isn't already present.
- Deployment is handled by the Cloudflare Pages workflow above, not by any local build/publish command.

Update this file as the repository grows real structure (source directories, a package manifest, tests, etc.) so future guidance stays accurate.
