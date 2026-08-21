import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
await page.goto('http://localhost:1420/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000); // during health check
// all inputs with widths
const inputs = await page.evaluate(() => Array.from(document.querySelectorAll('input')).map(i => ({ ph: i.placeholder, w: i.getBoundingClientRect().width })));
console.log('inputs:', JSON.stringify(inputs));
// click first channel row (Pressable renders as div with click)
const row = page.getByText('Anhui TV', { exact: true }).first();
console.log('row visible:', await row.isVisible().catch(()=>false));
await row.click({ timeout: 5000 }).catch(e => console.log('click failed:', e.message.slice(0,80)));
await page.waitForTimeout(4000);
const hasVideo = await page.locator('video').count();
const bodyText = (await page.evaluate(() => document.body.innerText)).slice(0, 150);
console.log('video:', hasVideo, '| text:', JSON.stringify(bodyText));
console.log('pageerrors:', errors.length ? errors : 'none');
await browser.close();
