import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message.slice(0, 150)));
page.on('console', m => { if (m.type() === 'error') errors.push('C: ' + m.text().slice(0, 120)); });

// Scenario A: fresh load at /
await page.goto('http://localhost:1420/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
console.log('A1 / renders list:', (await page.evaluate(() => document.body.innerText)).includes('Eagle'));

// Scenario B: click gear → settings
await page.getByText('⚙︎').click().catch(e => console.log('gear click failed'));
await page.waitForTimeout(800);
console.log('B1 url after gear:', page.url());
console.log('B2 settings form visible:', (await page.evaluate(() => document.body.innerText)).includes('服务器地址'));

// Scenario C: back button
await page.goBack().catch(() => {});
await page.waitForTimeout(800);
console.log('C1 url after back:', page.url());

// Scenario D: click gear AGAIN (second navigation settings)
await page.getByText('⚙︎').click().catch(e => console.log('gear2 failed'));
await page.waitForTimeout(800);
console.log('D1 url second gear:', page.url());
console.log('D2 form visible:', (await page.evaluate(() => document.body.innerText)).includes('服务器地址'));

// Scenario E: direct reload at /settings
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
console.log('E1 after reload url:', page.url());
console.log('E2 form visible:', (await page.evaluate(() => document.body.innerText)).includes('服务器地址'));

console.log('errors:', errors.length ? errors.slice(0, 4) : 'none');
await browser.close();
