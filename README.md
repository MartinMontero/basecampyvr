# Basecamp — Creator & Entrepreneur Residency

A residency for creators, entrepreneurs, and community builders. Focused housing on Jericho Beach, Vancouver. From idea to launch — together.

**October 2026 – May 2027 · HI Jericho Beach · $600/month all-in**

## About

Basecamp is a live-and-build residency at HI Jericho Beach in Kitsilano, Vancouver BC. Residents join rolling cohorts of 4–8 weeks to take their work from idea to a fully working version one — with support from Vancouver's creative, entrepreneurial, open-source, and university communities.

The program structure draws from the [PIE Cookbook](https://github.com/MartinMontero/pie-cookbook) accelerator methodology, adapted for a residency format that serves founders, writers, artists, civic technologists, and anyone whose work demands sustained focus and extended runway.

Basecamp is the Vancouver continuation of a model first built in Philadelphia in 2014 ([Generocity coverage](https://generocity.org/philly/2014/02/25/former-halfway-house-becomes-shared-living-space-for-entrepreneurs-in-brewerytown/)).

## Site

The site is a single self-contained `index.html` file. All images (photography and logo), CSS, and JavaScript are embedded directly — no external dependencies beyond Google Fonts. It is served from a **Cloudflare Worker** (`basecampyvr`) on the Cloudflare-registered domain `basecampyvr.ca`; this repo is the source of truth for the HTML.

### Repository structure

```
basecampyvr/
├── LICENSE
├── README.md
└── index.html    ← entire site (HTML + CSS + JS + images)
```

### Live site

`https://basecampyvr.ca` — served by the Cloudflare Worker **`basecampyvr`** (a Worker Custom Domain).
The domain is registered with **Cloudflare Registrar**; DNS, TLS, and hosting are all on Cloudflare.

> [!WARNING]
> **Do not serve this domain from GitHub Pages, and do not add a `CNAME` file to this repo.**
> `basecampyvr.ca` was previously attached to GitHub Pages as a custom domain, which caused an
> outage (GitHub's custom-domain verification conflicts with the domain being claimed elsewhere).
> The domain now belongs to the Cloudflare Worker. A `CNAME` file re-registers the GitHub Pages
> custom-domain claim and re-triggers that conflict — leave it out. Ignore the "Enforce HTTPS"
> option in GitHub **Settings → Pages**; it can never validate while Cloudflare owns the domain.

> [!IMPORTANT]
> The domain is a **Worker Custom Domain**, so its DNS record shows Type `Worker` and its proxy
> status is **locked to Proxied** (you cannot switch it to "DNS only" — the traffic must reach the
> Worker at Cloudflare's edge). TLS terminates at Cloudflare using an auto-issued edge certificate.
>
> If visitors see an SSL error (e.g. `SSL_ERROR_NO_CYPHER_OVERLAP`), the edge certificate for
> `basecampyvr.ca` is not active. Fix it in the **Cloudflare dashboard**:
> 1. **Workers & Pages → `basecampyvr` → Domains** — check the status of `basecampyvr.ca`. If the
>    certificate is *Pending/Initializing*, wait (minutes up to ~1 hour). If it is stuck or errored,
>    **remove** the custom domain and **re-add** it to re-issue the certificate.
> 2. **SSL/TLS → Edge Certificates** — confirm **Universal SSL** is enabled and the cert pack for
>    `basecampyvr.ca` is *Active*; set **Minimum TLS Version** to **1.0** or **1.2** (not 1.3-only)
>    and keep **TLS 1.3** on.

## Forms

The site has two forms:

- **Application form** — for prospective residents (name, email, discipline, preferred dates, housing preference, project description)
- **Contact form** — for general questions, sponsorship opportunities, partnership opportunities, and media inquiries

Both currently use `mailto:scoutmontero@gmail.com` — when submitted, they open the user's email client pre-filled with the form data.

### Upgrading to Tally (recommended)

For a proper submission dashboard with filtering, export, and email notifications:

1. Sign up at [tally.so](https://tally.so) (free, unlimited submissions).
2. Create two forms: **Basecamp Applications** and **Basecamp Contact**.
3. In each Tally form's settings, enable email notifications to `scoutmontero@gmail.com`.
4. In `index.html`, replace the `onsubmit="sub(event,'af','ao')"` and `onsubmit="sub(event,'cf','co')"` handlers with Tally's embed or API endpoints.

Tally also integrates with Google Sheets, Notion, Airtable, and Slack for real-time tracking.

## Housing

| Option | Price | Details |
|--------|-------|---------|
| Shared Pod | $600/month | Privacy-enclosed pod, shared with one other person. All utilities included. |
| Private Room | Inquire | Limited availability. Pricing varies by room type and duration. |

Both options include: utilities, Wi-Fi, kitchen access, home theatre, lounge and common areas, on-site laundry, and secure storage.

## Key Dates

| When | What |
|------|------|
| Now – September 2026 | Applications open (rolling review) |
| October 1, 2026 | Program begins, first cohort arrives |
| October 2026 – May 2027 | Rolling cohorts (4–8 week stays) |
| May 1, 2027 | Season closes |

## Tech Stack

- **Hosting:** Cloudflare Worker (`basecampyvr`) on `basecampyvr.ca` (Cloudflare Registrar + DNS + TLS)
- **Architecture:** Single self-contained HTML file (no build step, no framework)
- **Forms:** mailto fallback (upgradeable to Tally.so)
- **Fonts:** [Fraunces](https://fonts.google.com/specimen/Fraunces) + [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) via Google Fonts
- **Images:** Base64-encoded inline (BC landscape photography + Basecamp logo)
- **Dependencies:** None

## License

MPL-2.0
