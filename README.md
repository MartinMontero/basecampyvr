# Basecamp

Basecamp is a four-to-six-week program for entrepreneurs, creators and community builders in the Kitsilano neighbourhood of Vancouver. Participants take an idea as far as they can, ideally to a first working version, with peers beside them and a demo at the end.

## How the site is built and deployed

The site is static HTML. There is no build step and no framework. It is served by a Cloudflare Worker using static assets and is deployed from this GitHub repository. `wrangler.jsonc` sets the asset directory to the repository root (`"."`), so every file in the repository is served unless it is listed in `.assetsignore`.

Fonts (Fraunces and Bricolage Grotesque) load from Google Fonts. The hero image, the logo and two background photos are embedded in `index.html` as base64 data. Keep that in mind before opening the file in an editor: it is over 1 MB, mostly image data.

## Files

| Path | What it is |
|------|------------|
| `index.html` | The whole home page: styles, scripts and page content. |
| `model.html` | The "Our Model" page. |
| `wrangler.jsonc` | Cloudflare Workers configuration. |
| `.assetsignore` | Files that are in the repository but must not be served. |
| `scripts/` | Helper scripts. Listed in `.assetsignore`, so not served. |
| `LICENSE` | Licence text. |
| `README.md` | This file. Listed in `.assetsignore`, so not served. |

`LOOP.md` is a working record of an earlier outage. It is also listed in `.assetsignore`.

## Contact form

The contact form is a Tally embed. Submissions are managed in the Tally account, not in this repository.

| Form | Tally ID | Where it sits |
|------|----------|---------------|
| Contact | `RGY8Mp` | `#contact` |

The form is an `<iframe>` with a `data-tally-src` attribute. A script at the bottom of `index.html` loads Tally's widget asynchronously. If the widget fails to load, the `onerror` handler copies each `data-tally-src` into `src`, so the form still appears. Keep both pieces when editing.

## Founder photo

The About section has a marked place for a founder photo. Add the `<img>` there once the file `media/founder-martin-montero.jpg` exists. Keep the image under 600 KB, with a longest side of at most 2400 pixels.
