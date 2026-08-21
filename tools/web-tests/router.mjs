import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
await page.goto('http://localhost:1420/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
console.log('1. list at /:', (await page.evaluate(() => document.body.innerText)).includes('Eagle'));
// gear → settings URL
await page.getByText('⚙︎').click();
await page.waitForTimeout(600);
console.log('2. settings URL:', page.url());
// back → list
await page.goBack();
await page.waitForTimeout(600);
console.log('3. back to /:', page.url(), (await page.evaluate(() => document.body.innerText)).includes('Eagle'));
// deep link to unknown player → redirect home
await page.goto('http://localhost:1420/player/jfv:nonexistent', { waitUntil: 'networkidle' }).catch(()=>{});
await page.waitForTimeout(3000);
console.log('4. bad deep link redirects:', page.url());
console.log('5. errors:', errors.length ? errors.slice(0,3) : 'none');
await browser.close();
