import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
await page.goto('http://localhost:1420/', { waitUntil: 'networkidle' });
await page.waitForTimeout(15000); // wait for health check to settle
// search box width (desktop proportion check)
const search = page.locator('input[placeholder*="搜索"], input[placeholder*="search" i]').first();
const sw = await search.evaluate ? await (await search.elementHandle()).boundingBox() : null;
console.log('1. search box width:', sw?.width ?? 'not found');
// click first playable channel row
const rows = await page.locator('div[role="button"]').all();
let clicked = false;
for (const r of rows.slice(0, 30)) {
  const txt = await r.innerText().catch(() => '');
  if (txt.includes('CCTV') || txt.includes('Anhui')) { await r.click(); clicked = true; break; }
}
console.log('2. clicked channel row:', clicked);
await page.waitForTimeout(4000);
const hasVideo = await page.locator('video').count();
const bodyText = (await page.evaluate(() => document.body.innerText)).slice(0, 120);
console.log('3. video element:', hasVideo, '| text:', JSON.stringify(bodyText));
console.log('4. pageerrors:', errors.length ? errors : 'none');
await browser.close();
