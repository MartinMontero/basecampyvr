# PLAN.md — ordered fixes for AUDIT.md findings

Phase 2 of RPI. One logical change per commit, in this order. Every item lists acceptance criteria (AC). Verification = flows harness (F1–F13) + vnu + curl matrix on a clean clone, twice consecutively (Phase 4).

Gates check: no item un-inlines assets, adds a build step, changes hosting, deletes files, edits LOOP.md, touches the GitHub Pages configuration, or deploys — Rule 9 / architecture gate not triggered by this plan. (P0-1 remediation on the **live** site requires a redeploy: listed in SHIP.md as a gated, owner-approved step.)

1. **Harden `.assetsignore`** (P0-1)
   `.git`, `.wrangler`, `*.md`, `LICENSE`, `wrangler.jsonc`, `.nojekyll` (covers the RPI docs too; `.assetsignore` itself and `_headers` are not served — verified).
   AC: `wrangler deploy --dry-run` manifest = index.html, model.html (+ 404.html, _headers once added); dev probes: `/.git/HEAD`, `/README.md`, `/LICENSE`, `/wrangler.jsonc`, `/AUDIT.md` → 404.

2. **Guard the hash deep-link handler** (P1-2, P2-9)
   Replace `querySelector(location.hash)` with `getElementById(decodeURIComponent(location.hash.slice(1)))` + try/catch around the whole block so no top-level throw can kill the Tally loader/failsafe ordering.
   AC: F5 passes (deep-link scrolls + reveals); F5b passes (`/#/nonsense!` → zero pageerrors, both Tally iframes get src, failsafe fires).

3. **rel="noopener" on all 12 target=_blank links** (P1-3)
   AC: F9 passes on both pages (0 missing).

4. **CSS-only reveal failsafe; retire the broken noscript hack** (P1-1)
   `.rv` gets `animation: rv-reveal .6s ease 1.5s forwards` (mirrors the existing 1.5 s JS failsafe exactly); remove the inert noscript-in-style block; keep the JS IO reveal for the first 1.5 s; drop the now-redundant JS setTimeout.
   AC: F13 passes (JS disabled → all 44 .rv visible); F2/F2b unchanged; vnu noscript errors gone.

5. **Refactor inline handlers + inline styles into the single script/style blocks** (CSP prerequisite; P2-6)
   Burger/menu onclicks → addEventListener in the script block (model.html gains its first small `<script>`); banner backgrounds + max-width wrappers + redundant color override → classes. No behavior change.
   AC: grep: 0 `onclick=`/`style=` attributes in both pages; F2–F4 pass; visual spot-check at 3 widths unchanged.

6. **Mobile menu a11y** (P1-6) — Escape closes (returns focus to burger), focus moves into menu on open, focus trap while open, `aria-expanded`/`aria-controls` on burger. Both pages.
   AC: F4 all four checks pass on index; equivalent manual probe passes on model.html.

7. **prefers-reduced-motion** (P1-7) — media block disabling keyframes/transitions/smooth-scroll + JS parallax gated on matchMedia.
   AC: F12 passes (0s animation, no smooth), content still fully visible.

8. **Validation fixes** (P1-8) — iframe width/frameborder/marginheight/marginwidth → CSS; `.am h4`/`.cc h4`/`.ti h4` → h3 (selectors updated, rendering identical).
   AC: vnu: 0 errors / 0 warnings on both pages (or documented exceptions = none expected).

9. **Contrast fixes** (P1-12) — minimal token/value changes validated by contrast.py: footer opacities raised to clear 4.5:1; `.am p` → --text-soft; --text-soft darkened just enough to clear 4.5 on --linen (fixes .ti p, nav.solid, .quote cite, .cc p margin); --ember darkened ~#b0521f-range for the two CTAs; `.ey` gets a darker teal text value. Both pages.
   AC: contrast.py re-run: 0 fails at AA for all 28 audited pairs; visual character preserved (muted footer stays muted, just legible).

10. **Visible Tally fallback** (P1-11) — one muted caption line under each embed: direct form URL (tally.so/r/vGLqGQ, tally.so/r/RGY8Mp) + mailto:scoutmontero@gmail.com.
    AC: F6 visible-fallback check passes; links carry rel=noopener.

11. **Favicon** (P1-4) — 48×48 optimized PNG derived from the existing logo blob, inlined as data: URI `<link rel="icon">` on both pages; model's broken link replaced.
    AC: F1/F8 zero failed internal requests (no /favicon.ico, no /assets/... 404s).

12. **`_headers` with CSP + security headers** (P1-5)
    `/*`: Content-Security-Policy (default-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'sha256-<index>' 'sha256-<model>' https://tally.so; frame-src https://tally.so; connect-src https://tally.so), X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy: camera=(), microphone=(), geolocation=().
    style-src keeps 'unsafe-inline' for the two `<style>` elements + Tally-injected styles headroom — script-src is the lock that matters; rationale + hash-regen command documented in README.
    AC: under wrangler dev, headers present on 200/307/404; zero CSP violations in console across all flows; fonts + data: images unaffected. Live-Tally leg UNTESTED (sandbox) — rollback note in SHIP.md.

13. **Styled 404 page** (P2-10, logged decision) — minimal 404.html on existing tokens + `not_found_handling: "404-page"` in wrangler.jsonc.
    AC: `/nonexistent` → 404 status with styled body under dev; 404.html excluded from nav/sitemap concerns (single line links home).

14. **Logo/JPEG dedup, inline preserved** (P2-1, P2-2) — nav/footer logos switch to an optimized ~72×72 derivative (few KB, still inline data: URIs, `<img>` + alt preserved); hero keeps the original 280px blob; duplicated banner JPEG referenced once via a shared CSS rule.
    AC: pixel spot-check at 1×/2× DPR unchanged for nav/footer/hero; per-page weight re-measured and recorded (expect index ≈ −0.45 MB raw, model ≈ −0.4 MB raw); all images still data: URIs (no new network requests).

15. **Meta/polish** (P2-4, P2-5, P2-7, P2-8) — meta description + canonical (https://basecampyvr.ca/ and /model) + og:title/og:description/og:type on both pages; -webkit-backdrop-filter; en-dash fix; og:image logged-skipped (needs external URL).
    AC: tags present; vnu still clean.

16. **Dead CSS removal** (P2-3) — mailto-era form styles (index:161–185 minus the two intro classes).
    AC: grep confirms no HTML references the removed selectors; visual diff nil.

17. **README rewrite + CHANGELOG.md** (P1-9) — stack (CF Worker static assets), structure, local dev (`npx wrangler dev --persist-to "$(mktemp -d)"` + why), deploy (`npx wrangler deploy`, what it uploads), Tally setup as-built (vGLqGQ/RGY8Mp), CSP hash-regen command, cert-renewal note (Google DV via HTTP DCV, expires 2026-10-10, auto-renew expected — from LOOP.md). CHANGELOG: prototype → production deltas.
    AC: every README claim matches a verifiable repo/config fact.

18. **VERIFICATION.md + SHIP.md** — Phase 4 loop results (two consecutive full green runs), then final report.

## Non-goals (explicit)
- No un-inlining of assets, no build step, no framework, no new external services, no hosting change.
- No Cloudflare zone/DNS/TLS work (out of scope; owner + support).
- No Tally form configuration changes (owner's account).
- No LOOP.md edits; no deletion of `.nojekyll`; no GitHub Pages reconfiguration (owner action, documented in SHIP.md).
- No `wrangler deploy` (Rule 9 — listed in SHIP.md with exact steps for the owner).
- No image re-encoding beyond the logo-derivative in item 14 (progressive-JPEG idea logged only).
- og:image, socials, analytics: out of scope.
