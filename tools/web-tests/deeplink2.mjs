import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push('PAGE: ' + e.message.slice(0, 120)));
page.on('requestfailed', r => { const u = r.url(); if (u.includes('m3u8') || u.includes('.ts')) errors.push('REQFAIL: ' + u.slice(0, 120)); });
await page.goto('http://localhost:1420/', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(600);
// add jellyfin-video source (fresh token)
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
const text = await page.evaluate(() => document.body.innerText);
console.log('1. items listed:', text.includes('(2021)'));
// now deep-link to the player
await page.goto('http://localhost:1420/player/jfv%3Aa60540f4a285162480779c56c23c27e8', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(12000);
console.log('2. deep link url:', page.url());
console.log('3. body:', JSON.stringify((await page.evaluate(() => document.body.innerText)).slice(0, 120)));
const video = await page.locator('video').count();
console.log('4. video:', video);
console.log('5. errors:', errors.length ? errors.slice(0, 4) : 'none');
await browser.close();
