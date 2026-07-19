# CHANGELOG — prototype → production

All changes on branch `claude/basecamp-vr-production-p2uz90`, 2026-07-19. Baseline: `main` @ 3c9f0be. Full evidence: `AUDIT.md` (findings), `VERIFICATION.md` (test runs), `SHIP.md` (deploy steps + residual risks).

## Security
- **Served-asset leak closed** — `.assetsignore` now excludes `.git` (entire repo history was uploadable/servable, e.g. `/.git/HEAD` returned 200 under the old config), `.wrangler`, `*.md`, `LICENSE`, `wrangler.jsonc`, `.nojekyll`. Upload manifest is now index.html, model.html, 404.html only. **Requires a redeploy to take effect in production.**
- **CSP + security headers** shipped via `_headers`: `script-src` locked to inline-script hashes + `https://tally.so`; Google Fonts origins allowed; `frame-ancestors 'none'`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- `rel="noopener"` on all 12 `target="_blank"` links.
- Full git history secrets-scanned (gitleaks ×3 methods): clean. osv-scanner: clean (zero dependencies).

## Reliability / correctness
- Malformed URL hash (`/#/anything`) no longer throws and kill the Tally loader + reveal failsafe (both forms used to go dead for that visit).
- Broken `<noscript>` failsafe (nested inside `<style>`, inert) replaced with a CSS-only 1.5 s reveal failsafe — content now appears with JS disabled, blocked by CSP, or crashed. Redundant JS timeout removed.
- Visible fallback under both Tally embeds (direct form URL + email) for when tally.so is unreachable.
- Styled `404.html` + `not_found_handling: "404-page"` (unknown paths previously returned an empty body).
- Broken favicon on model.html (`assets/images/logo.png`, 404 every view) and missing favicon on index replaced with an inline 48px data-URI icon on both pages.
- `wrangler dev` infinite-reload loop diagnosed (assets dir `"."` contains `.wrangler`); documented working command: `npx wrangler dev --persist-to "$(mktemp -d)"`.

## Accessibility
- Mobile menu: Escape closes (focus returns to burger), focus moves into the overlay on open, Tab trapped, `aria-expanded`/`aria-controls`.
- `prefers-reduced-motion` honored on both pages (animations/transitions to .01 ms, smooth scroll off, JS parallax gated).
- WCAG AA contrast: `--text-soft` #7a7468→#726c60, `--ember` #c06030→#b4581e, footer text opacities .2/.25/.35→.5/.55/.6, eyebrow/date labels → `--teal-ink` #2f7272, fern labels on dark → `--fern-bright` #4f9d68, model dark-section eyebrow → teal-bright. Every audited text pair now ≥ 4.5:1 (worst offender was footer nav at 1.66:1). Faded card numerals kept as decorative (logged exception).
- Heading hierarchy fixed (h2→h4 skips became h3; identical rendering).

## Markup / standards
- Nu HTML Checker: index.html had 8 errors + 6 warnings → **all three pages now validate with 0 messages** (noscript-in-style, iframe `width="100%"`, obsolete `frameborder`/`marginheight`/`marginwidth`, heading skips).
- Inline `onclick` handlers and `style=""` attributes eliminated (moved into the single script/style blocks) — enables the hashed CSP.
- Meta description, canonical URL, and OG tags on both pages; `-webkit-backdrop-filter` for Safari < 18; en-dash consistency. (og:image intentionally skipped: scrapers can't read data: URIs and the architecture keeps no external assets.)
- 23 lines of dead mailto-era form CSS removed.

## Performance
- Logo PNG (166 KB, embedded byte-identical 5× across the two pages, displayed at 36/28 px in 4 of 5 slots) deduplicated: nav/footer slots use a 3 KB 72 px derivative; hero keeps the 280 px original. Duplicated banner JPEG now referenced once via a CSS custom property. All images remain inline data: URIs.
- Page weight: index.html 1,562,564 → 1,007,440 B raw (−35.5%); model.html 462,471 → 31,666 B raw (−93.2%). Compressed transfer figures in VERIFICATION.md.

## Docs
- README rewritten to match reality (was: GitHub Pages hosting, mailto: forms, three-file repo). Now: Cloudflare Worker static assets, Tally embeds, actual structure, working local-dev and deploy commands, CSP hash-regen procedure, cert-renewal and GitHub-Pages-retirement notes.
- Added `AUDIT.md`, `PLAN.md`, `VERIFICATION.md`, `SHIP.md`, this file. `LOOP.md` untouched (historical ops record).
