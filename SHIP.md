# SHIP.md — final report

Branch `claude/basecamp-vr-production-p2uz90`, 19 commits over `main` @ 3c9f0be, 2026-07-19. Everything below is verified in this sandbox unless explicitly marked **UNTESTED** with the reason.

## What changed

Full delta in `CHANGELOG.md`; findings + evidence in `AUDIT.md`; test record in `VERIFICATION.md`. Headlines:

1. **Served-asset leak closed (P0).** The old config uploaded and served the entire `.git` directory plus README/LICENSE/wrangler.jsonc (locally reproduced: `/.git/HEAD` → 200). `.assetsignore` now restricts the upload manifest to `index.html`, `model.html`, `404.html` (+ `_headers` as config). **The live site keeps serving the old asset set until the redeploy below.**
2. **CSP + security headers** via `_headers` (hash-locked `script-src`, Tally/Google-Fonts allowances, `frame-ancestors 'none'`, nosniff, XFO, Referrer-Policy, Permissions-Policy) — verified on 200/307/404 responses with zero CSP violations in-browser.
3. **Resilience:** malformed-hash crash fixed (used to kill both forms); broken noscript failsafe replaced with a CSS-only reveal (works with JS disabled/blocked/crashed); visible fallback links under both Tally embeds; styled 404 page.
4. **Accessibility:** keyboard-complete mobile menu (Escape/focus/trap/aria), `prefers-reduced-motion`, WCAG AA contrast across both pages (worst pair 1.66:1 → all ≥ 4.5:1), heading hierarchy.
5. **Standards:** Nu HTML Checker 0 errors 0 warnings on all three pages (was 8+6 on index).
6. **Performance:** logo/JPEG dedup, all assets still inline — index 1,562,564 → 1,007,440 B raw, model 462,471 → 31,666 B raw.
7. **Docs:** README rewritten to match reality; CHANGELOG added; `LOOP.md` untouched (verified: no diff vs main).
8. **Local dev unbroken:** `npx wrangler dev` used to reload-loop forever; documented working command `npx wrangler dev --persist-to "$(mktemp -d)"`.

## What was tested (evidence in VERIFICATION.md)

- Two consecutive full flow-suite runs on a clean clone: **35/35 and 35/35** (cold load, scroll/reveal/parallax/failsafe, anchor + cross-page nav, mobile menu incl. keyboard, hash deep-links incl. malformed, Tally-blocked fallbacks, rel-noopener sweep, responsive ×3 widths, reduced motion, no-JS).
- Routing/headers curl matrix; `wrangler deploy --dry-run` manifest; vnu ×3 pages; CSP-violation sweep; contrast recomputation; gitleaks (3 methods, full history) and osv-scanner clean.

## UNTESTED here, and why

| Item | Reason | How to verify (owner) |
|---|---|---|
| Live basecampyvr.ca (TLS, current `.git` exposure, headers after deploy) | sandbox egress blocks the domain | `curl -sI https://basecampyvr.ca/ \| grep -i content-security`; `curl -s -o /dev/null -w '%{http_code}' https://basecampyvr.ca/.git/HEAD` → expect 404 after deploy (**if it returns 200 today, that confirms the live leak — deploy promptly**) |
| Tally embeds actually loading + submitting; `tally.so/r/<id>` direct links | tally.so blocked at egress; forms live in owner's account | load `/#apply` in a browser; submit a test application; click both "Open the form directly" links |
| Tally under the new CSP | can't fetch embed.js to enumerate its sub-resources | after deploy, open DevTools console on `/#apply`; any `Refused to …` line naming tally → widen that CSP directive in `_headers` (or delete `_headers` to roll back entirely — site works without it) |
| Google Fonts rendering in-browser | proxy resets Chromium's tunnel to fonts.googleapis.com (curl reaches it fine) | visual check — Fraunces/Bricolage should render; fallback stacks + `display=swap` guarantee readable text regardless |
| github.io mirror state | egress blocked | visit martinmontero.github.io/basecampyvr |

## Residual risks (owner territory)

- **Cert auto-renewal:** Google DV certs (Cloudflare-for-SaaS, HTTP DCV) expire **2026-10-10**; renewal ~90-day via edge HTTP challenge is expected to succeed despite the zone defect (no DNS dependency — LOOP.md attempt #8). Calendar a check ~2026-09-25.
- **Zone serve-plane defect** (phantom catch-all, unserved managed DCV records) still blocks TXT-validation paths — Cloudflare support ticket per LOOP.md; harmless to current serving.
- **Legacy GitHub Pages** still builds on every push and publishes a duplicate site at github.io (canonical tags now point at basecampyvr.ca, mitigating SEO duplication). Retire in **Settings → Pages** (owner-only; not reachable from this session's tooling), after which `.nojekyll` can be deleted — both were left untouched per Rule 9.
- **CSP hash maintenance:** editing an inline `<script>` without regenerating the hashes in `_headers` stops that page's JS (content still displays via the CSS failsafe). Regen one-liner is in README.
- Commit metadata exposes a second personal email (these3remain@gmail.com) — inherent to public GitHub history; rewriting history was not considered (destructive, Rule 9).

## Deploy steps (Rule 9-gated — not performed)

From a clone with this branch (or after merging to main):

```sh
npx wrangler login            # or export CLOUDFLARE_API_TOKEN=...
npx wrangler deploy           # uploads index.html, model.html, 404.html + _headers config
```

Post-deploy verification:

```sh
curl -s -o /dev/null -w '%{http_code}\n' https://basecampyvr.ca/            # 200
curl -s -o /dev/null -w '%{http_code}\n' https://basecampyvr.ca/model      # 200
curl -s -o /dev/null -w '%{http_code}\n' https://basecampyvr.ca/.git/HEAD  # 404  ← the P0 check
curl -s -o /dev/null -w '%{http_code}\n' https://basecampyvr.ca/nope       # 404 (styled page)
curl -sI https://basecampyvr.ca/ | grep -i content-security-policy         # CSP present
```

Then browser-check `/#apply` and `/#contact` (Tally loads, no console `Refused to…` lines) and submit a test form.

## Gates honored

No deploy, no file/branch deletion, no history rewrite, no GitHub Pages changes, no LOOP.md edits, no un-inlining/build-step/hosting change. All work is additive commits on the designated branch.
