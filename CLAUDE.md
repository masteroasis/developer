# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This repository has no build tooling, package manifest, test suite, or framework — it's plain static HTML/CSS/JS served as-is. Files:

- `index.html` / `styles.css` / `script.js` — the Lakefront Technology Professional Services marketing site: a single-page layout with header/nav, hero, services grid, about, "why us", contact form, and footer. All styling lives in `styles.css` (no CSS framework, no build step). `script.js` (vanilla JS, no dependencies) drives the footer year, scroll-reveal animations (`.reveal` / `.reveal.is-visible`, via `IntersectionObserver`), animated stat counters (`[data-count]`/`[data-suffix]`), the hero's mouse-parallax pine-tree scene (`.parallax-layer[data-depth]`), and the header's scrolled-shadow state — all gated behind a `prefers-reduced-motion` check in JS, with a matching CSS `@media (prefers-reduced-motion: reduce)` override as a fallback.
- `email-config.js` — EmailJS credentials (`publicKey`/`serviceId`/`templateId`) for the contact form, set on `window.LAKEFRONT_EMAIL_CONFIG`. These are browser-side public keys by design, not secrets; abuse is limited via the domain allowlist and rate limits in the EmailJS dashboard. `script.js` detects unfilled placeholder values and falls back to telling visitors to email directly, so the form degrades gracefully rather than silently failing.
- `hello_world.txt` — a leftover plain-text note (`#Odin Project`) from this repo's original Odin Project coursework origin.
- `webpage.html` — an earlier standalone HTML fragment (no `<!DOCTYPE>`/`<html>`/`<head>` wrapper), unrelated to the Lakefront site; not linked from `index.html`.
- `.github/workflows/deploy.yml` — deploys the site to Cloudflare Pages via `cloudflare/pages-action`, using Direct Upload (no build step, `directory: .`). Runs on push to `main` (production deploy) and on pull requests targeting `main` (preview deploy). Requires two repo secrets that are not stored in this repo: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, plus a Cloudflare Pages project named `lakefront-technology` (update `projectName` in the workflow if the actual project is named differently).

There is no README, no `package.json`/`Makefile`/other build config, and no `.cursorrules` or Copilot instructions to incorporate.

## Working in this repo

- There are no build, lint, or test commands — none are configured. Preview changes by serving the directory statically, e.g. `python3 -m http.server` and opening `index.html`.
- Keep `index.html`, `styles.css`, and `script.js` plain and dependency-free unless the user asks for a framework or build step — nothing in the repo currently requires one.
- The color palette and section conventions (eyebrow label, section title, card grid) are defined at the top of `styles.css` under `:root` and are reused across all sections — extend via those existing classes/variables rather than introducing new one-off styles.
- New scroll-triggered entrance animations should use the existing `.reveal` class rather than inventing a new mechanism; staggering within a grid happens automatically via the `.reveal:nth-child(n)` delay rules already in `styles.css`.
- Since there's no other existing architecture to follow, infer intent from the user's request rather than assuming a particular framework or structure. Ask before introducing tooling (e.g., a package manager or bundler) that isn't already present.
- Deployment is handled by the Cloudflare Pages workflow above, not by any local build/publish command.

Update this file as the repository grows real structure (source directories, a package manifest, tests, etc.) so future guidance stays accurate.
