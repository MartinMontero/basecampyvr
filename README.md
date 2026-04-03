# Basecamp — Creator & Entrepreneur Residency

A residency for creators, entrepreneurs, and community builders. Focused housing on Jericho Beach, Vancouver. From idea to launch — together.

**October 2026 – May 2027 · HI Jericho Beach · $600/month all-in**

## About

Basecamp is a live-and-build residency at HI Jericho Beach in Kitsilano, Vancouver BC. Residents join rolling cohorts of 4–8 weeks to take their work from idea to a fully working version one — with support from Vancouver's creative, entrepreneurial, open-source, and university communities.

The program structure draws from the [PIE Cookbook](https://github.com/MartinMontero/pie-cookbook) accelerator methodology, adapted for a residency format that serves founders, writers, artists, civic technologists, and anyone whose work demands sustained focus and extended runway.

Basecamp is the Vancouver continuation of a model first built in Philadelphia in 2014 ([Generocity coverage](https://generocity.org/philly/2014/02/25/former-halfway-house-becomes-shared-living-space-for-entrepreneurs-in-brewerytown/)).

## Site

The site is a single self-contained `index.html` file hosted on GitHub Pages. All images (photography and logo), CSS, and JavaScript are embedded directly — no external dependencies beyond Google Fonts.

### Repository structure

```
basecampyvr/
├── LICENSE
├── README.md
└── index.html    ← entire site (HTML + CSS + JS + images)
```

### Live site

`https://martinmontero.github.io/basecampyvr/`

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

- **Hosting:** GitHub Pages
- **Architecture:** Single self-contained HTML file (no build step, no framework)
- **Forms:** mailto fallback (upgradeable to Tally.so)
- **Fonts:** [Fraunces](https://fonts.google.com/specimen/Fraunces) + [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) via Google Fonts
- **Images:** Base64-encoded inline (BC landscape photography + Basecamp logo)
- **Dependencies:** None

## License

MPL-2.0
