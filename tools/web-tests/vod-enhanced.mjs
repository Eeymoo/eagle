import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
await page.goto('http://localhost:1420/live', { waitUntil: 'domcontentloaded' });
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
  if (!i) return false;
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(i, val);
  i.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}, v);
await setByPh('http://192.168.1.10:8096', 'https://jf.onemue.cn');
await setByPh('admin', 'eeymoo');
await setPW('lmh1999.');
await page.getByText('添加', { exact: true }).click();
await page.waitForTimeout(20000);
console.log('0. items:', (await page.evaluate(() => document.body.innerText)).includes('(2021)'));
await page.goto('http://localhost:1420/player/jfv%3Aa60540f4a285162480779c56c23c27e8', { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 20; i++) { await page.waitForTimeout(1500); if (await page.locator('video').count()) break; }
if (!(await page.locator('.vod-bar').count())) { await page.locator('video').click({ position: { x: 100, y: 300 } }).catch(() => {}); await page.waitForTimeout(500); }
const ui = await page.evaluate(() => ({
  seek: !!document.querySelector('.vod-seek'),
  buffer: !!document.querySelector('.vod-buffer'),
  vol: !!document.querySelector('.vod-vol'),
  speed: document.querySelector('.vod-speed')?.textContent,
  fullscreen: !!document.querySelector('.vod-tool[title="全屏"]'),
  mute: !!document.querySelector('.vod-tool[title="静音"]'),
  times: Array.from(document.querySelectorAll('.vod-time')).map(e => e.textContent),
  seekMax: document.querySelector('.vod-seek')?.max,
}));
console.log('1. chrome:', JSON.stringify(ui));
// speed cycle
await page.locator('.vod-speed').click();
await page.waitForTimeout(500);
const rate = await page.evaluate(() => document.querySelector('video')?.playbackRate);
console.log('2. speed after cycle:', rate);
// volume
await page.evaluate(() => {
  const v = document.querySelector('.vod-vol');
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(v, '0.4');
  v.dispatchEvent(new Event('input', { bubbles: true }));
  v.dispatchEvent(new Event('change', { bubbles: true }));
});
await page.waitForTimeout(400);
const vol = await page.evaluate(() => ({ v: document.querySelector('video')?.volume, m: document.querySelector('video')?.muted }));
console.log('3. volume after set 0.4:', JSON.stringify(vol));
const bufw = await page.evaluate(() => document.querySelector('.vod-buffer')?.style.width);
console.log('4. buffered width:', bufw);
console.log('5. errors:', errors.length ? errors.slice(0, 3) : 'none');
await browser.close();
