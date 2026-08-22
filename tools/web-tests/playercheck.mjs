import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:1420/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
// rail: partial height, centered
const rail = await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('div')).find((d) => {
    const st = getComputedStyle(d);
    return st.position === 'absolute' && Math.round(d.getBoundingClientRect().width) === 64 && st.borderRadius !== '0px';
  });
  if (!el) return { found: false };
  const r = el.getBoundingClientRect();
  return {
    found: true, h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom),
    centered: Math.abs(r.top - (900 - r.bottom)) < 4,
    partial: r.top > 100 && r.bottom < 800,
    svgs: el.querySelectorAll('svg').length,
  };
});
console.log('P1. rail partial+centered:', JSON.stringify(rail));
// player fixed to screen: intercept the redirect by checking the shell
// container style on any player URL while the channel resolves
await page.goto('http://localhost:1420/player/jfv%3Atest', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
const shell = await page.evaluate(() => {
  // find the content View (parent chain of the loading text / player)
  const el = Array.from(document.querySelectorAll('div')).find((d) => {
    const r = d.getBoundingClientRect();
    const st = getComputedStyle(d);
    return Math.round(r.width) === 1440 && Math.round(r.height) >= 900 && st.overflow === 'hidden';
  });
  return el ? { w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height), of: getComputedStyle(el).overflow } : null;
});
console.log('P2. edge-to-edge shell (want 1440x900, hidden):', JSON.stringify(shell));
const scrollable = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight + 4);
console.log('P3. no page scroll on player:', !scrollable);
await browser.close();
