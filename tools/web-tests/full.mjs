import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
await page.goto('http://localhost:1420/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
// add source
await page.getByText('⚙︎').click();
await page.waitForTimeout(500);
await page.getByText('M3U Tuner').last().click();
await page.waitForTimeout(400);
await page.getByPlaceholder('http://example.com/playlist.m3u').fill('https://iptv-org.github.io/iptv/countries/cn.m3u');
await page.getByText('添加', { exact: true }).click();
await page.waitForTimeout(8000);
// rows should be on list during health check
console.log('1. rows visible:', await page.evaluate(() => document.body.innerText.includes('Anhui TV')));
// play
await page.getByText('Anhui TV', { exact: true }).first().click({ timeout: 8000 });
await page.waitForTimeout(6000);
const hasVideo = await page.locator('video').count();
const state = hasVideo ? await page.evaluate(() => { const v = document.querySelector('video'); return { readyState: v.readyState, w: v.videoWidth, h: v.videoHeight }; }) : null;
const bodyText = (await page.evaluate(() => document.body.innerText)).slice(0, 100);
console.log('2. video:', hasVideo, JSON.stringify(state), '| text:', JSON.stringify(bodyText));
console.log('3. pageerrors:', errors.length ? errors : 'none');
await browser.close();
