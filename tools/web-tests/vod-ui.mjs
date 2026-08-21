import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 150)); });
page.on('requestfailed', r => errors.push('REQFAIL: ' + r.url().slice(0, 130)));
page.on('response', r => { const u = r.url(); if (u.includes('PlaybackInfo') || u.includes('stream.') || u.includes('master.m3u8')) console.log('REQ:', r.status(), u.slice(0, 110)); });
await page.goto('http://localhost:1420/', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.getByText('⚙︎').click();
await page.waitForTimeout(500);
await page.getByText('Jellyfin 媒体库').last().click();
await page.waitForTimeout(400);
const setByPh = async (ph, v) => page.evaluate(([p, val]) => {
  const i = Array.from(document.querySelectorAll('input')).find(x => x.placeholder === p);
  if (!i) return false;
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(i, val);
  i.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}, [ph, v]);
const setPW = async (v) => page.evaluate((val) => {
  const i = Array.from(document.querySelectorAll('input')).find(x => x.type === 'password');
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(i, val);
  i.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}, v);
await setByPh('http://192.168.1.10:8096', 'https://jf.onemue.cn');
await setByPh('admin', 'eeymoo');
await setPW('lmh1999.');
await page.getByText('添加', { exact: true }).click();
await page.waitForTimeout(20000);
console.log('0. items listed:', (await page.evaluate(() => document.body.innerText)).includes('(2021)'));
// open the VOD player
await page.goto('http://localhost:1420/player/jfv%3Aa60540f4a285162480779c56c23c27e8', { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 6; i++) { await page.waitForTimeout(5000); console.log(`poll${i}:`, (await page.evaluate(() => document.body.innerHTML)).replace(/\s+/g, ' ').slice(0, 220)); if (await page.locator('video').count()) break; }

// controls auto-hide after 3s — re-show via a synthetic root-target click
await page.evaluate(() => document.querySelector('.player-root')?.click());
await page.waitForTimeout(400);
console.log('1. seek bar present:', await page.locator('.vod-seek').count());
console.log('2. LIVE badge absent for VOD:', (await page.locator('.live').count()) === 0);
const times = await page.locator('.vod-time').allTextContents();
console.log('3. time labels:', JSON.stringify(times));
const dur = await page.locator('.vod-seek').getAttribute('max').catch(() => null);
console.log('4. seek max (duration):', dur);
// seek interaction: set slider to ~50%
const v = await page.evaluate(() => { const vid = document.querySelector('video'); return vid ? { t: vid.currentTime, d: vid.duration } : null; });
console.log('5. video pos/dur:', JSON.stringify(v));
console.log('errors:', errors.length ? errors.slice(0, 5) : 'none');
await browser.close();
