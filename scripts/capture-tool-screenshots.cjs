// Captures the four screenshots used in the "Tools you can use" section of index.html.
//
// Usage (from the repository root):
//   npm install playwright          (once, anywhere Node can resolve it)
//   npx playwright install chromium (once)
//   node scripts/capture-tool-screenshots.cjs
//
// Output: media/tools/<name>.jpg, 1280 x 800 viewport, JPEG quality 80.
// Each site gets one retry. A site that still fails is skipped and any existing
// screenshot for it is left untouched. The script exits with code 1 if any site failed
// or any file is 250 KB or larger. This folder is listed in .assetsignore, so it is not served.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SITES = [
  { name: 'We Can Just Build Things', url: 'https://wecanjustbuildthings.dev', file: 'wecanjustbuildthings.jpg' },
  { name: 'Builder Workshop', url: 'https://builderworkshop.ca', file: 'builderworkshop.jpg' },
  { name: 'BC AI Compass', url: 'https://bc-aicompass.ca', file: 'bc-aicompass.jpg' },
  { name: "Founder's Quest", url: 'https://play.foundersquest.ca', file: 'foundersquest.jpg' }
];

const OUT_DIR = path.resolve(__dirname, '..', 'media', 'tools');
const MAX_BYTES = 250 * 1024;
const QUALITY = 80;

async function capture(browser, site) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  try {
    await page.goto(site.url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1500); // let late animations and fonts settle
    const buf = await page.screenshot({ type: 'jpeg', quality: QUALITY });
    return buf;
  } finally {
    await context.close();
  }
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  let failed = 0;

  for (const site of SITES) {
    let buf = null;
    for (let attempt = 1; attempt <= 2 && !buf; attempt++) {
      try {
        buf = await capture(browser, site);
      } catch (err) {
        console.error(`[${site.name}] attempt ${attempt} failed: ${String(err.message).split('\n')[0]}`);
      }
    }
    if (!buf) {
      failed++;
      console.error(`[${site.name}] SKIPPED: ${site.url} did not load after one retry`);
      continue;
    }
    const out = path.join(OUT_DIR, site.file);
    fs.writeFileSync(out, buf);
    const kb = (buf.length / 1024).toFixed(1);
    console.log(`[${site.name}] saved ${path.relative(process.cwd(), out)} (${kb} KB)`);
    if (buf.length >= MAX_BYTES) {
      failed++;
      console.error(`[${site.name}] WARNING: ${kb} KB is over the 250 KB limit`);
    }
  }

  await browser.close();
  process.exit(failed ? 1 : 0);
})();
