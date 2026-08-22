import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e).slice(0, 100)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 100)); });
await page.goto('http://localhost:1420/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
const rail = await page.evaluate(() => {
  const railEl = Array.from(document.querySelectorAll('div')).find((d) => {
    const st = getComputedStyle(d);
    return st.position === 'absolute' && st.left === '0px' && Math.round(d.getBoundingClientRect().width) === 92;
  });
  if (!railEl) return { found: false };
  const svgs = railEl.querySelectorAll('svg').length;
  const lucidePaths = railEl.querySelectorAll('svg.lucide, svg [stroke]').length;
  const labels = Array.from(railEl.querySelectorAll('span,div')).filter((e) => e.childElementCount === 0).map((e) => e.textContent?.trim()).filter(Boolean);
  return { found: true, svgCount: svgs, strokeAttrs: lucidePaths, labels: labels.join('|') };
});
console.log('I1. rail icons (lucide svg):', JSON.stringify(rail));
// player keeps nav: navigate to a live-less state — just check route renders shell with nav
await page.goto('http://localhost:1420/settings', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
const navOnSettings = await page.evaluate(() => !!Array.from(document.querySelectorAll('div')).find((d) => {
  const st = getComputedStyle(d);
  return st.position === 'absolute' && Math.round(d.getBoundingClientRect().width) === 92;
}));
console.log('I2. nav present on settings:', navOnSettings);
console.log('I3. errors:', errors.length, errors.slice(0, 2));
// series page keeps nav (common navigation, not just fullscreen)
await browser.close();
