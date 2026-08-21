import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:1420/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
const ls = await page.evaluate(() => {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    const v = localStorage.getItem(k) ?? '';
    out[k] = v.length > 150 ? v.slice(0, 150) + `…(${v.length})` : v;
  }
  return out;
});
console.log(JSON.stringify(ls, null, 1));
await browser.close();
