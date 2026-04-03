# Basecamp — Creator & Entrepreneur Residency

Website for the Basecamp residency program at HI Jericho Beach, Vancouver BC. October 2026 – May 2027.

## Project Structure

```
basecamp-site/
├── index.html
├── README.md
├── assets/
│   ├── css/style.css
│   ├── js/main.js
│   └── images/
│       ├── logo.png
│       ├── hero-forest.jpg
│       ├── howe-sound.jpg
│       ├── lions-gate.jpg
│       ├── mountains.jpg
│       └── snowpeak.jpg
```

## Deploy to GitHub Pages

### 1. Create and push the repository

```bash
cd basecamp-site
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/basecamp-site.git
git branch -M main
git push -u origin main
```

### 2. Enable GitHub Pages

Go to Settings → Pages → Source → Deploy from branch → select main / root → Save.

Live at: `https://YOUR_USERNAME.github.io/basecamp-site/`

### 3. Custom domain (optional)

Create a `CNAME` file with your domain. Add a CNAME DNS record pointing to `YOUR_USERNAME.github.io`. Enable HTTPS in Pages settings.

## Form Backend Setup (Formspree)

Both forms use Formspree for submission storage and email forwarding.

### Setup

1. Sign up at [formspree.io](https://formspree.io) (free: 50 submissions/month).
2. Create two forms: one for applications, one for contact. Set both to forward to `scoutmontero@gmail.com`.
3. In `index.html`, replace `https://formspree.io/f/placeholder` in both form `action` attributes with your actual Formspree endpoint IDs.

### How it works

Submissions are stored in the Formspree dashboard (searchable, CSV export) and forwarded to email. If Formspree is unreachable, forms fall back to a mailto: link pre-filled with submission data.

### Quick alternative (no account)

Replace form actions with `https://formspree.io/scoutmontero@gmail.com` — forwards directly to email, no dashboard. Formspree sends a one-time verification email.

## Tech Stack

Hosting: GitHub Pages. Forms: Formspree + mailto fallback. Fonts: Fraunces + Bricolage Grotesque (Google Fonts). Zero dependencies — vanilla HTML/CSS/JS.
