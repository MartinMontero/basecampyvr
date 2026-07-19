# AUDIT.md — basecampyvr production-readiness audit

Date: 2026-07-19 · Branch: `claude/basecamp-vr-production-p2uz90` (== `main` @ 3c9f0be) · Phase 1 of RPI.

Method: static read of both pages (base64-stripped copies, line numbers preserved); `wrangler deploy --dry-run` manifest inspection (`WRANGLER_LOG=debug`, wrangler 4.112.0); live probes against `npx wrangler dev` serving a clean clone; Nu HTML Checker (vnu-jar 26.7.16, run locally); Playwright flow harness (Chromium, 35 checks); gitleaks v8 (full history, three independent legs); osv-scanner 2.4.0; WCAG 2.1 contrast computation (28 pairs, rgba composited over real backdrops); current Cloudflare Workers static-assets docs.

Sandbox egress limits: tally.so, basecampyvr.ca, *.workers.dev, martinmontero.github.io, validator.w3.org, api.osv.dev unreachable; fonts.googleapis.com reachable via curl but **not** from the test browser (proxy tunnel reset) — so the in-browser Google-Fonts leg and everything on the live domain are marked UNTESTED with reason wherever claimed.

## Repo map

| File | Size | Role |
|---|---|---|
| index.html | 1,562,564 B (438 lines) | Landing page. Inline CSS (lines 10–234), inline JS (399–437), 9 base64 images |
| model.html | 462,471 B (269 lines) | "Our Model" page. Inline CSS; no `<script>` block, inline onclick handlers only; 2 base64 images |
| wrangler.jsonc | 106 B | Worker `basecampyvr`, `assets.directory: "."`, no `main` (assets-only — valid per docs) |
| .assetsignore | 8 B | `LOOP.md` only |
| .nojekyll | 1 B | GitHub Pages legacy artifact |
| README.md | 3,700 B | Stale (P1-9) |
| LOOP.md | 5,997 B | Ops record of TLS outage — read-only, out of scope |
| LICENSE | 16,726 B | MPL-2.0 |

Design tokens (`:root`, index:11 / model:12–17): --void #050c08 · --deep #0e2218 · --forest #14302a · --canopy #1e4a38 · --fern #3a7a50 · --ocean #1a4a5a · --teal #3a8a8a · --teal-bright #5ab8a8 · --gold #c49a40 · --ember #c06030 · --parchment #f2ead8 · --cream #faf6ec · --linen #f6f2e8 · --text #1a1810 · --text-mid #4a4438 · --text-soft #7a7468 · --text-faint #a8a098 (index only). Fonts: Fraunces + Bricolage Grotesque via Google Fonts `<link>` (display=swap, generic fallbacks present in every font-family stack).

Flow list (= the test plan; implemented as `flows.mjs`, results `flows-audit.json`):
F1 index cold load · F2 scroll (nav solid / reveal / parallax) · F2b 1.5 s reveal failsafe · F3 desktop anchor nav + model link · F4 mobile burger (mouse + keyboard) · F5 hash deep-links · F5b malformed-hash robustness · F6/F7 Tally apply/contact embed + blocked-embed fallback · F8 model.html direct + cross-page anchors · F9 target=_blank rel audit · F10 routing matrix · F11 responsive 375/768/1440 · F12 prefers-reduced-motion · F13 no-JS rendering.
Baseline harness result: 23/35 pass; 8 failing rows = real site bugs (below), 4 = sandbox artifacts (fonts/tally egress, documented in flows agent triage).

## P0 — security / broken

### P0-1 `wrangler deploy` publishes the entire `.git` directory (plus repo metadata files) as public assets
- Evidence: clean clone, `WRANGLER_LOG=debug npx wrangler deploy --dry-run` → "Read 239 files"; manifest contains `/.git/HEAD`, `/.git/config`, all `/.git/objects/*`; only `.assetsignore` + `LOOP.md` ignored. Served by `wrangler dev` under baseline config: `GET /.git/HEAD` → 200 `ref: refs/heads/...`; `/.git/config`, `/README.md`, `/LICENSE`, `/wrangler.jsonc`, `/.nojekyll` → 200.
- Docs confirm no default exclusions on Workers static assets (unlike Pages): `.git` is uploaded unless `.assetsignore`d (developers.cloudflare.com/workers/static-assets/binding/#ignoring-assets, migrate-from-pages guide).
- Impact: full git history (43 commits incl. deleted `main.js`, `style.css`, prior index.html revisions) reconstructable from the live site. History was secrets-scanned clean (see Security summary), so exposure is source history, not credentials — still must be closed.
- Live site: UNTESTED from sandbox (egress blocked). If the production deploy was made from any normal clone, this is live now. **Owner check: `curl -i https://basecampyvr.ca/.git/HEAD`.** Remediation needs a redeploy (Rule 9-gated).
- Fix verified locally: extended `.assetsignore` → all leak paths 404; manifest drops to index.html + model.html.

### P0-2 `npx wrangler dev` unusable in this repo — infinite reload loop
- Evidence: wrangler dev with `assets.directory: "."` writes `.wrangler/state|tmp` inside the watched directory → "Reloading local server..." forever (219+ reloads; all requests time out). Reproduced in repo and clean clone. `.assetsignore` does not stop the watcher. Control: minimal project with assets in a subdirectory — no loop.
- Fix verified: `npx wrangler dev --persist-to "$(mktemp -d)"` → 1 initial reload, then stable; both pages served (200, full byte counts). Documented as the local-dev command. (A `site/` subdirectory layout would also fix it but changes repo layout — not proposed; architecture stays canonical.)

## P1 — correctness / UX / docs

### P1-1 `<noscript>` failsafe inert — no-JS visitors see no content
- index:233: `<noscript><style>…</style></noscript>` sits inside the open `<style>` element → parsed as invalid CSS, dropped. Browser-verified (JS disabled): `document.querySelectorAll('noscript').length === 0`, the noscript text is literal CSS text inside the head style element, all 44 `.rv` elements at computed opacity 0. vnu: 3 errors (CSS parse error, stray `</noscript>`, stray `</style>`).
- Note: the JS failsafe (index:434) already reveals all `.rv` at 1.5 s regardless of scroll position, so scroll-reveal is by design only active for the first 1.5 s. A CSS-only failsafe animation reproduces exactly this behavior without JS (fix direction; see PLAN item 4).

### P1-2 Malformed URL hash throws, killing the Tally loader and the reveal failsafe
- index:416–419: `document.querySelector(window.location.hash)` throws `SyntaxError` for selector-invalid hashes (e.g. `/#/section`). Browser-verified on `/#/nonsense!`: pageerror raised; both Tally iframes stay `src`-less **forever** (loader at 422–431 never runs) and 4/44 `.rv` never reveal (failsafe at 434–436 never runs). Control `/#zzz` (valid selector, no match): no throw.
- Impact: any visit with a tracking-style fragment disables both forms — the site's primary conversion path.

### P1-3 12 `target="_blank"` links missing `rel="noopener"`
- index: lines 294, 304, 395, 396 (4 links). model: 145 (×2), 186 (×2), 249, 250, 251, 252 (8 links). Browser-verified: `rel=""` on all 12. Modern browsers imply noopener, but the DoD requires the attribute explicitly.

### P1-4 Broken favicon (model) / missing favicon (index)
- model:7 `<link rel="icon" href="assets/images/logo.png">` — no `assets/` directory exists; 404 on every model.html view. index declares no icon → `/favicon.ico` 404 = the one genuine console error on index cold load (CDP-verified).

### P1-5 No security headers / CSP
- No `_headers` file; no Worker script; nothing sets CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- Mechanism verified in docs (workers/static-assets/headers/: "Harden security" section; 100 rules / 2,000 chars-per-line limits) **and empirically**: `_headers` rules apply to 200s, to html_handling 307 redirects, and to 404 responses (x-test-header present on all three under wrangler dev); `/_headers` itself is not served (404) with no `.assetsignore` entry needed. (Docs leave the 307/404 and self-serving questions open; resolved empirically here.)
- CSP prerequisite: inline onclick handlers (12×) and inline style attributes (6×) must be refactored into the single script/style blocks so `script-src` can be hash-based instead of 'unsafe-inline' — explicitly in-scope per the DoD.

### P1-6 Mobile menu not fully keyboard-operable
- Browser-verified: Enter on burger opens (real `<button>`s), but Escape does not close (`esc-closes:false`; no keydown handler exists), focus stays behind the overlay (`activeElement in .mm: false`), no `aria-expanded`/`aria-controls`, no focus trap — Tab walks into visually hidden page content behind the overlay. Same structure duplicated in model.html.

### P1-7 No `prefers-reduced-motion` support
- Browser-verified under emulated reduce: hero keyframes 0.9 s, reveal transitions 0.6 s, `scroll-behavior:smooth` all still active; JS parallax unconditional; grep: 0 occurrences of `prefers-reduced-motion` in either page.

### P1-8 Nu HTML Checker: index.html 8 errors / 6 warnings; model.html clean
- noscript-in-style ×3 (=P1-1); iframe `width="100%"` invalid ×2 (378, 389); heading skip h2→h4 ×3 (324, 353, 366); obsolete `frameborder`/`marginheight`/`marginwidth` ×6 (warnings). model.html: 0 messages.

### P1-9 README.md contradicts reality
- Claims GitHub Pages hosting (lines 17, 30, 72), mailto: forms "currently" (39, 74), three-file repo (21–26), Tally as a future upgrade (41–48). Reality: Cloudflare Worker static assets, Tally live (vGLqGQ apply / RGY8Mp contact), model.html + wrangler.jsonc + LOOP.md + .assetsignore present. Full rewrite required (DoD).

### P1-10 Legacy GitHub Pages deployment still builds and publishes on every push
- GitHub Actions: settings-driven dynamic workflow `pages build and deployment` (path `dynamic/pages/pages-build-deployment`, no in-repo file), 31 runs, latest 2026-07-12, success, branch main. A duplicate of the site remains published at martinmontero.github.io/basecampyvr (mirror UNTESTED from sandbox: egress 000; the Actions history is the evidence of publication).
- Not disableable from inside the repo (Settings → Pages, owner-only; no Pages API in this session's toolset). `.nojekyll` deletion is Rule 9-gated and wouldn't stop the build anyway. → Owner action documented in SHIP.md; `.nojekyll` kept so the legacy build keeps functioning until intentionally retired.

### P1-11 Tally unreachable ⇒ no visible apply/contact path
- Browser-verified with tally.so blocked: embed.js `onerror` fallback fires correctly (both iframes get `src` = data-tally-src — the mechanism works), but if tally.so is down entirely the iframes render as empty boxes; #apply/#contact contain no direct link or address. DoD requires a visible fallback path.

### P1-12 Contrast failures (WCAG 2.1 AA, 4.5:1 applies — no audited text qualifies as "large")
28 pairs computed (composited rgba over real backdrops; script `contrast.py`, data `contrast.json`). Failures, worst first — all rules duplicated in model.html fail there too:
| Style | Effective ratio | Where |
|---|---|---|
| `.fnav a` rgba(242,234,216,.2) on --void | **1.66:1** | index:195, model:88 |
| `footer p` rgba(.25) on --void | **1.98:1** | index:192, model:85 |
| `.am p` --text-faint on #fff | **2.58:1** | index:118 |
| `footer a` rgba(.35) on --void | **2.81:1** | index:193, model:86 |
| `.ti p` --text-soft on --linen | 4.15:1 | index:159 |
| `.ncta` / `.btn-a` #fff on --ember | 4.24:1 | index:29, 49; model:32 |
| `nav.solid .nlinks a` --text-soft on cream bar | 4.33:1 | index:27; model:29 |
| `.ey` --teal on cream/linen | 3.75 / 3.62:1 | index:70; model:45 (P2 — short labels) |
| `.quote cite` --text-soft on cream | 4.30:1 | index:90; model:74 (P2) |
Passes: all --deep-section text 5.54–7.08:1; body copy on cream 8.95–16.46:1; `.cc p` text-soft on white 4.64:1 (thin margin). Photo-backdrop text (hero pills, transparent nav): 7.3–8.0:1 against the dark bound (#050c08 + gradient overlay), below AA against a hypothetical mid-gray region — bounds only, photo backdrop is not deterministic.

## P2 — polish / perf

- P2-1 Logo PNG (280×280 RGBA, 166,138 B decoded, sha256 6c64d694…) embedded byte-identical **5×**: index nav/hero/footer + model nav/footer = 830,690 B decoded, ~41% of both pages' combined decoded weight. Displayed at 36/28 px (nav/footer) — ~8× oversized there; hero displays up to 240 CSS px (undersized for 2× DPR, so hero keeps the 280px source). 2.119 B/px indicates no optimizer pass.
- P2-2 Same 1200×1800 JPEG (92,291 B) embedded 2× in index (origin-bg line 93, photo-banner line 382).
- P2-3 Dead CSS: mailto-era form styles index:161–185 (`.fg*`, `.ok*`, select arrow svg) — forms are Tally iframes; only `.apply-intro`/`.contact-intro` from that block are still used.
- P2-4 `backdrop-filter` unprefixed only (index:20, 46, 51; model:24) — Safari < 18 loses the blur; add `-webkit-` prefix.
- P2-5 No meta description / canonical / og tags on either page; site is live on ≥3 origins (basecampyvr.ca, www, workers.dev, github.io mirror) with no canonical. og:image not feasible without an externally-addressable image (data: URIs are ignored by scrapers) — logged, skipped.
- P2-6 Inline styles: index:308, 346, 375, 377, 382, 388 (banner backgrounds, max-width wrappers, redundant `color:#ffffff !important` at 375 — `.sd .hd` is already #fff). Folded into the stylesheet during the CSP refactor.
- P2-7 `http://` links to piepdx.com (model:145, 251). https reachability UNTESTED from sandbox → left as-is, logged.
- P2-8 model.html footer "October 2026 - May 2027" hyphen vs index en-dash.
- P2-9 All 6 unique JPEGs baseline (not progressive) — a few % + earlier paint available via re-encode; not required.
- P2-10 Unknown paths return an empty-body 404 (`not_found_handling` default "none"). Styled 404 = logged decision (PLAN item 10): 404.html + `not_found_handling: "404-page"` (docs: nearest-404.html semantics verified; headers apply to it — verified empirically).
- P2-11 Page weight (baseline, to re-measure after changes): index 1,562,564 B raw (code 35,604 B = 2.3%), gzip-9 1,149,373 B, brotli-q11 710,809 B; model 462,471 B raw (code 19,431 B), gzip-9 343,532 B, brotli-q11 171,731 B. The 438 KB gzip↔brotli gap on index is the duplicated blobs (brotli's large window dedupes them; gzip's 32 KB window cannot).

## Security summary
- eval / new Function / document.write / innerHTML: 0 occurrences in either page (grep).
- Secrets: **clean** — three independent legs: (1) gitleaks v8 git-mode (`--log-opts=--all`): "no leaks found", exit 0; (2) byte-complete scan of all 23 unique blobs ever committed (`git cat-file --batch-all-objects` export → `gitleaks dir`): clean — covers every version of every file incl. deleted `main.js`, `style.css`, CNAME, old index.html; (3) manual `git log -p --all` grep for key/token/password/private-key/AKIA/ghp_/sk-: only hits are the word "token" in LOOP.md prose (DCV documentation, placeholder values). No .env/key files ever committed; no Cloudflare account/zone IDs in history. INFO: second personal author email (these3remain@gmail.com, 34 commits) in public commit metadata — inherent to GitHub, not a leak; noted for owner awareness (matches the `these3remain.workers.dev` subdomain).
- osv-scanner 2.4.0: `osv-scanner scan source -r .` → "No package sources found", 0 Extract calls, exit 128 (documented no-packages code) — the expected clean result for a zero-dependency static site. api.osv.dev blocked by sandbox but immaterial (no packages to query). Trivy not used.
- External services in use: Google Fonts + Tally only — matches the allowed set.

## Routing matrix (wrangler dev; matches the documented auto-trailing-slash table verbatim)
| Request | Result |
|---|---|
| / | 200 index.html (1,562,564 B) |
| /index.html, /index | 307 → / |
| /model | 200 model.html (462,471 B) |
| /model.html, /model/ | 307 → /model |
| /index.html/ | 404 |
| /nonexistent | 404 empty body |
| /favicon.ico | 404 (P1-4) |
| /assets/images/logo.png | 404 (P1-4) |
| /LOOP.md, /.assetsignore | 404 (correctly excluded) |

## Ambiguity log (dominant pattern followed; nothing invented)
- Nav item lists differ between pages (index 8 items, model 6) — treated as intentional per-page curation; left alone.
- index:375 white `!important` override duplicates `.sd .hd` — removed as redundant in the inline-style sweep; no visual change.
- Empty 404 vs styled 404: no design intent on record → decision logged in PLAN (styled 404.html using existing tokens).
- Quiet-footer look (opacity .2–.35 text on near-black) is clearly deliberate but fails WCAG at 1.66–2.81:1 → minimal opacity raise to clear 4.5:1, preserving the muted hierarchy; logged as a design delta.
- Scroll-reveal is already self-disabling at 1.5 s via the JS failsafe → CSS-only failsafe mirrors existing observable behavior; logged.
- `visible apply/contact fallback` (P1-11) has no design precedent → one muted caption line under each embed, styled with existing token classes; logged.
