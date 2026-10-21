# Basecamp

Basecamp is a live-in residency for entrepreneurs, creators and community builders at HI Jericho Beach in Vancouver. Residents stay four to six weeks to take an idea as far as they can, ideally to a first working version, with peers beside them and a demo at the end.

Housing is $600 CAD per resident per month. The full terms are on the site.

## How the site is built and deployed

The site is static HTML. There is no build step and no framework. It is served by a Cloudflare Worker using static assets and is deployed from this GitHub repository. `wrangler.jsonc` sets the asset directory to the repository root (`"."`), so every file in the repository is served unless it is listed in `.assetsignore`.

Fonts (Fraunces and Bricolage Grotesque) load from Google Fonts. The hero image, the logo and two background photos are embedded in `index.html`. All other images and videos are separate files in `media/`.

## Files

| Path | What it is |
|------|------------|
| `index.html` | The whole home page: styles, scripts and page content. |
| `model.html` | The "Our Model" page. |
| `media/` | Photos and videos used on the home page. See "Media" below. |
| `hi-jericho-beach.jpg` | The lead photo in the "A beachside home base" section. |
| `wrangler.jsonc` | Cloudflare Workers configuration. |
| `.assetsignore` | Files that are in the repository but must not be served. |
| `scripts/` | Helper scripts. Listed in `.assetsignore`, so not served. |
| `LICENSE` | Licence text. |

`LOOP.md` is a working record of an earlier outage. It is also listed in `.assetsignore`.

## Forms

Both forms are Tally embeds. Submissions are managed in the Tally account, not in this repository.

| Form | Tally ID | Where it sits |
|------|----------|---------------|
| Application | `vGLqGQ` | `#apply` |
| Contact | `RGY8Mp` | `#contact` |

Each form is an `<iframe>` with a `data-tally-src` attribute. A script at the bottom of `index.html` loads Tally's widget asynchronously. If the widget fails to load, the `onerror` handler copies each `data-tally-src` into `src`, so the forms still appear. Keep both pieces when editing.

## Media

Every file in `media/` is referenced from `index.html` by a relative path such as `media/pod-bed-01.jpg`. Media is never embedded as base64.

Naming rules:

- Lowercase letters, hyphens between words, two-digit numbers (`01`, `02`).
- Photos are `.jpg`. Videos are `.mp4`.
- Files sit directly in `media/`, except the tool screenshots, which sit in `media/tools/`.

Size limits used for review: photos have a longest side of at most 2400 pixels and are under 600 KB. Videos are at most 1080p and under 8 MB. No file may exceed 25 MiB.

| File | Used for |
|------|----------|
| `pod-bed-01.jpg`, `pod-bed-02.jpg` | Gallery group "The pod" |
| `video-pod-01.mp4` | Gallery group "The pod" |
| `common-kitchen-01.jpg`, `common-lounge-01.jpg`, `common-theatre-01.jpg` | Gallery group "Common areas" |
| `coworking-01.jpg`, `coworking-02.jpg` | Gallery group "Coworking room" |
| `video-coworking-01.mp4` | Gallery group "Coworking room" |
| `local-beach-01.jpg`, `local-beach-02.jpg`, `local-neighbourhood-01.jpg` | Gallery group "The beach and neighbourhood" |
| `video-beach-01.mp4` | Gallery group "The beach and neighbourhood" |
| `founder-martin-montero.jpg` | Founder photo in the About section |
| `tools/wecanjustbuildthings.jpg`, `tools/builderworkshop.jpg`, `tools/bc-aicompass.jpg`, `tools/foundersquest.jpg` | Tool screenshots in the Tools section |

A video's poster frame, if one is wanted, is saved as `media/<name>-poster.jpg`, for example `media/video-pod-01-poster.jpg`.

### Gallery

The gallery lives inside the `#space` section of `index.html`, at the comment that begins `<!-- GALLERY:`. Add one `<div class="gal">` there, with one `<h3>` and one `<div class="gal-grid">` per group, and include only files that exist. Each photo is a `<figure>` with `width` and `height` set to the file's real pixel size:

```html
<div class="gal">
  <h3>The pod</h3>
  <div class="gal-grid">
    <figure>
      <img src="media/pod-bed-01.jpg" alt="Plain description of what the photo shows" width="1600" height="1200" loading="lazy" decoding="async">
      <figcaption>One short factual line.</figcaption>
    </figure>
    <figure>
      <video controls muted playsinline preload="metadata" poster="media/video-pod-01-poster.jpg" aria-label="Plain description of what the video shows" width="1280" height="720">
        <source src="media/video-pod-01.mp4" type="video/mp4">
      </video>
      <figcaption>One short factual line.</figcaption>
    </figure>
  </div>
</div>
```

Videos do not autoplay. Leave out `poster` if no poster frame has been made.

### Founder photo

In the About section of `index.html`, replace the comment that begins `<!-- FOUNDER PHOTO:` with:

```html
<img src="media/founder-martin-montero.jpg" alt="Martin Montero, Founder &amp; Director of Basecamp" width="600" height="600" loading="lazy" decoding="async">
```

Use the file's real pixel size for `width` and `height`.

### Tool screenshots

`scripts/capture-tool-screenshots.cjs` opens each of the four tool sites at 1280 by 800 and saves a JPEG at quality 80 into `media/tools/`. It needs Playwright (`npm install playwright`, then `npx playwright install chromium`) and a network that can reach the four sites. Run it from the repository root with `node scripts/capture-tool-screenshots.cjs`. After it runs, add an `<img>` to each card in the `#tools` section, with the alt text "Screenshot of the [name] website."

## Fonts and colours

Colours are CSS variables at the top of the `<style>` block in `index.html`. Section backgrounds alternate between `.sw` (cream), `.sl` (linen) and `.sd` (dark). Text on dark sections is white or near-white.

## Licence

MPL-2.0
