import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
await page.goto('http://localhost:1420/player/jfv%3Anonexistent', { waitUntil: 'networkidle' });
for (let i = 0; i < 5; i++) {
  await page.waitForTimeout(2000);
  console.log(`t+${(i+1)*2}s url:`, page.url(), '| text:', JSON.stringify((await page.evaluate(() => document.body.innerText)).slice(0, 40)));
  if (page.url().endsWith('/')) break;
}
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
