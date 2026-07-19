# Basecamp — Creator & Entrepreneur Residency

A residency for creators, entrepreneurs, and community builders. Focused housing at HI Jericho Beach, Vancouver BC — October 2026 – May 2027, $600/month all-in. From idea to launch — together.

Live site: **https://basecampyvr.ca** (also `www.basecampyvr.ca`; interim mirror `basecampyvr.these3remain.workers.dev`)

The program structure draws from the [PIE Cookbook](https://github.com/MartinMontero/pie-cookbook) and the [AOS Hubs](https://github.com/andotherstuff/aos-hubs) model — see [/model](https://basecampyvr.ca/model). Basecamp continues a model first built in Philadelphia in 2014 ([Generocity coverage](https://generocity.org/philly/2014/02/25/former-halfway-house-becomes-shared-living-space-for-entrepreneurs-in-brewerytown/)).

## Stack

- **Hosting:** Cloudflare Worker **static assets** — worker `basecampyvr`, configured in `wrangler.jsonc` (assets-only, no Worker script, no `main`)
- **Architecture:** self-contained HTML files — inline CSS, inline JS, base64-inlined images. No build step, no framework, no dependencies
- **Forms:** [Tally](https://tally.so) embeds — application `vGLqGQ`, contact `RGY8Mp`. Loaded by `embed.js`; if that script fails, an `onerror` fallback sets each iframe's `src` directly; a visible caption under each embed links the direct form URL and email as a last resort
- **Fonts:** [Fraunces](https://fonts.google.com/specimen/Fraunces) + [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) via Google Fonts (`display=swap`, generic serif/sans fallbacks — the site stays readable if Google Fonts is unreachable)
- **External origins:** Google Fonts and Tally. Nothing else.

## Repository structure

```
basecampyvr/
├── index.html      landing page (HTML + CSS + JS + images, self-contained)
├── model.html      "Our Model" page
├── 404.html        styled not-found page
├── _headers        CSP + security headers (parsed by Workers, not served)
├── wrangler.jsonc  Worker config: assets directory ".", 404-page handling
├── .assetsignore   keeps .git, docs, config out of the served assets
├── LICENSE         MPL-2.0
└── *.md            docs (excluded from serving via .assetsignore)
```

## Local development

```sh
npx wrangler dev --persist-to "$(mktemp -d)"
```

The `--persist-to` (any directory outside the repo) matters: the assets directory is `"."`, and without it wrangler writes its `.wrangler` state inside the watched directory and reloads in an infinite loop, never serving.

Routing (Workers `auto-trailing-slash` default): `/` serves index.html; `/model` serves model.html (200); `/model.html` and `/model/` redirect 307 → `/model`; unknown paths get 404.html with a 404 status.

## Deploy

```sh
npx wrangler deploy
```

Uploads exactly three assets — `index.html`, `model.html`, `404.html` — plus the `_headers` rules as configuration. Everything else (`.git`, `.wrangler`, `*.md`, `LICENSE`, `wrangler.jsonc`, `.nojekyll`) is excluded by `.assetsignore`. Verify after deploying:

```sh
curl -sI https://basecampyvr.ca/ | grep -i content-security-policy
curl -s -o /dev/null -w '%{http_code}\n' https://basecampyvr.ca/.git/HEAD   # must be 404
```

### If you change an inline `<script>`

The CSP in `_headers` locks `script-src` to sha256 hashes of the two inline scripts. After editing either page's script block, regenerate and update both hashes in `_headers`, or the page's JS will not run:

```sh
python3 -c "import re,hashlib,base64,sys;[print(sys.argv[i],['sha256-'+base64.b64encode(hashlib.sha256(m.encode()).digest()).decode() for m in re.findall(r'<script>(.*?)</script>',open(sys.argv[i]).read(),re.S)]) for i in (1,2)]" index.html model.html
```

(If the JS ever fails anyway, content still renders: a CSS-only failsafe reveals everything at 1.5 s, with or without JavaScript.)

## Forms (Tally)

Both forms live in the owner's Tally account (submission dashboard, email notifications to scoutmontero@gmail.com, export/integrations). To change a form, edit it in Tally; to swap forms, replace the embed IDs in `index.html` (`tally.so/embed/<id>` in the iframes and `tally.so/r/<id>` in the fallback captions).

## Certificates / domain notes (owner)

- Edge TLS for `basecampyvr.ca`/`www` is served via Cloudflare-for-SaaS custom hostnames — Google DV certs issued 2026-07-12, expiring 2026-10-10, auto-renewal ~90-day via edge HTTP DCV expected to succeed despite the zone's DNS defect (see `LOOP.md` for the full outage record).
- The underlying zone serve-plane defect still blocks TXT-based validation paths; resolving it is a Cloudflare-support matter (`LOOP.md` §Renewal & follow-up).
- A legacy **GitHub Pages** deployment still builds this repo on every push and publishes a duplicate at `martinmontero.github.io/basecampyvr`. Retire it in repo **Settings → Pages** when ready (then `.nojekyll` can go too); harmless meanwhile.

## License

MPL-2.0
