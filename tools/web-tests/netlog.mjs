import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage();
page.on('response', r => { if (r.status() >= 400) console.log(r.status(), r.url().slice(0, 110)); });
await page.goto('http://localhost:1420/', { waitUntil: 'load' });
await page.waitForTimeout(2000);
await browser.close();
