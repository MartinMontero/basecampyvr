# VERIFICATION.md — Phase 4 loop results

Environment: clean clone (`git clone` → scratchpad), served with the documented command `npx wrangler dev --persist-to "$(mktemp -d)"` (wrangler 4.112.0, port 8795). Browser: Playwright Chromium. Harness: `flows.mjs` (35 checks, F1–F13).

Sandbox constraints (apply to every run; see SHIP.md § Known limitations):
- tally.so is blocked at the egress proxy → the *degraded* path is what gets exercised (embed.js onerror → direct iframe src; visible fallback caption). The live-Tally leg is UNTESTED here.
- fonts.googleapis.com is reachable via curl but not from the sandboxed browser → in-browser font rendering leg UNTESTED; the failing stylesheet also delays each page's `load` event ~13 s, which is why the harness waits on committed URLs/conditions instead of `load` in F3/F8. Production pages are unaffected (the CSS either loads in milliseconds or fails fast).
- Console-error checks count only errors whose source is the site itself; network errors from the two blocked external origins are recorded separately as expected sandbox artifacts.

## Flow runs (two consecutive full runs, exit criterion)

Both runs executed back-to-back against the same clean-clone server, 35 checks each: **Run A 35/35 PASS · Run B 35/35 PASS** (raw JSON: `flows-runA.json`, `flows-runB.json` in the session scratchpad; identical check-level results). An earlier full run before two sandbox-timing accommodations in the harness scored 33/35 — the two failures (F3 `waitForURL` on the delayed `load` event, F8 fixed 1.2 s wait shorter than the sandbox's 13 s stylesheet stall) were harness artifacts, not site behavior; the accommodations wait for the same end conditions without a deadline shorter than the sandbox's network timeout.

| Flow | What passed |
|---|---|
| F1 | index cold load: hero renders, zero site-origin console errors, zero failed internal requests |
| F2/F2b | nav solid toggle at 60 px both directions; parallax transform applied; scroll reveal; CSS failsafe reveals all 44 `.rv` by 2.4 s with no scrolling |
| F3 | all 7 anchor targets scroll into view; model.html nav link navigates (307 → `/model`, title verified) |
| F4 | burger: opens, X closes, link closes+scrolls; Enter opens; focus moves into overlay; Escape closes |
| F5/F5b | `/#apply` deep-link scrolls + reveals; `/#/nonsense!` → zero pageerrors, Tally loader and failsafe still run |
| F6/F7 | embed.js blocked → both iframes get `src` from `data-tally-src`; visible fallback caption present |
| F8 | model.html direct load clean; cross-page anchor model → index `#program` lands in view |
| F9 | 0 `target="_blank"` links missing `rel="noopener"` on either page |
| F11 | zero horizontal overflow on both pages at 375 / 768 / 1440 px |
| F12 | reduced-motion: animation/transition durations ≤ .01 ms, smooth scroll off |
| F13 | JS disabled: all 44 `.rv` elements visible |

## Routing + headers matrix (curl, clean clone)

| Request | Result |
|---|---|
| `/` | 200, 1,007,440 B |
| `/index.html`, `/index` | 307 → `/` |
| `/model` | 200, 31,666 B |
| `/model.html`, `/model/` | 307 → `/model` |
| `/nonexistent`, `/favicon.ico` | 404 serving styled 404.html (4,035 B) |
| `/.git/HEAD`, `/.git/config`, `/README.md`, `/LICENSE`, `/wrangler.jsonc`, `/LOOP.md`, `/AUDIT.md`, `/_headers`, `/.assetsignore` | **404** (leak closed; was 200 for git/README/LICENSE/wrangler pre-fix) |
| `/404` | 200 (asset served extensionless — platform behavior; page carries `noindex`) |

Headers: all five security headers on `/`; `Content-Security-Policy` present on 200, 307, and 404 responses. `wrangler deploy --dry-run` (debug): upload manifest = index.html, model.html, 404.html; `_headers` parsed as config, not served.

## CSP behavior (browser)

Zero CSP violations across `/`, `/model`, and the 404 page including scroll, reveal, and menu interaction; inline scripts execute via their sha256 hashes (menu works); `data:` background images render. Hashes in `_headers` match `sha256(<script> contents)` of both pages.

## Validation

Nu HTML Checker (vnu-jar 26.7.16, local): index.html, model.html, 404.html — **0 errors, 0 warnings** (baseline: index.html 8 errors + 6 warnings).

## Contrast

25-pair recomputation after the token changes (script in session scratchpad, method: WCAG 2.1 relative luminance, rgba composited over real backdrops): every text pair ≥ 4.5:1; worst is `.fnav a` at 4.63:1 (was 1.66:1). Sole logged exception: `.pc-n` faded card numerals (decorative order markers, opacity .5 by design).

## Security scans

- gitleaks v8: full-history git scan + byte-complete scan of all 23 blobs ever committed + independent grep sweep — **no secrets** (details in AUDIT.md § Security summary).
- osv-scanner 2.4.0: "No package sources found" (exit 128, documented no-packages code) — expected for a zero-dependency site. Trivy not used.
- `eval` / `new Function` / `document.write` / `innerHTML`: 0 occurrences.

## Page weight (before → after)

| Page | Raw | gzip -9 | brotli q11 |
|---|---|---|---|
| index.html | 1,562,564 → **1,007,440 B** | 1,149,373 → **731,143 B** | 710,809 → **714,282 B**¹ |
| model.html | 462,471 → **31,666 B** | 343,532 → **11,358 B** | 171,731 → **9,346 B** |
| 404.html (new) | 4,035 B | 2,066 B | 1,757 B |

¹ index brotli is ~flat by design: brotli's large window already deduplicated the repeated logo blob, so removing the duplicates mostly benefits raw size, gzip clients (−418 KB), and parse cost. model.html pays off everywhere (raw −93%).

## Definition-of-Done cross-check

| DoD item | Status |
|---|---|
| Fresh clone serves both pages via documented commands | PASS (clean clone + README command) |
| Zero console errors / unhandled rejections on all flows | PASS for site-origin; blocked-external network errors are sandbox artifacts (documented) |
| Nu HTML Checker clean | PASS (0 messages, 3 pages) |
| Tally blocked → iframe fallback; unreachable → visible path | PASS (mechanism + caption verified) |
| Google Fonts blocked → readable fallback stack | PASS (all font-family stacks carry generic fallbacks; pages render and all flows pass with fonts unreachable in-browser; `display=swap` prevents invisible text when the CSS does load) |
| osv-scanner clean; secrets scan clean; no eval; CSP + headers; rel=noopener | PASS (all above) |
| Keyboard nav incl. mobile menu; focus; semantics; alt text; contrast; reduced motion | PASS (F4/F12/F13, vnu, contrast table; alt text present on content images, empty alt on decorative footer logo) |
| Responsive 375/768/1440 | PASS (F11) |
| Weight recorded before/after; no render thrash | PASS (table above; parallax uses rAF throttle, IO for reveals) |
| README/CHANGELOG accurate; LOOP.md untouched | PASS (`git diff` shows no LOOP.md change) |
| Deploy-ready for wrangler target | PASS (dry-run manifest verified; deploy itself Rule 9-gated, steps in SHIP.md) |
