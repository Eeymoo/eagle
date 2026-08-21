import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message.slice(0, 150)));
page.on('requestfailed', r => { const u = r.url(); if (u.includes('m3u8')) errors.push('REQFAIL: ' + u.slice(0, 100) + ' ' + (r.failure()?.errorText ?? '')); });
await page.goto('http://localhost:1420/', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.getByText('⚙︎').click();
await page.waitForTimeout(400);
await page.getByText('Jellyfin').last().click();
await page.waitForTimeout(400);
// fields: serverUrl (placeholder http://...:8096), username (admin), password (type password)
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
console.log('fill:', await setByPh('http://192.168.1.10:8096', 'https://jf.onemue.cn'), await setByPh('admin', 'eeymoo'), await setPW('lmh1999.'));
await page.getByText('添加', { exact: true }).click();
await page.waitForTimeout(12000);
const text = await page.evaluate(() => document.body.innerText);
console.log('1. channels listed:', text.includes('黑龙江') || text.includes('卫视'), '| len:', text.length, '| sample:', JSON.stringify(text.slice(0, 140)));
const clicked = await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('span,div')).find(e => e.childElementCount === 0 && e.textContent?.includes('黑龙江'));
  if (!el) return false;
  let n = el;
  for (let i = 0; i < 6 && n; i++) { n.dispatchEvent(new MouseEvent('click', { bubbles: true })); n = n.parentElement; }
  return true;
});
console.log('2. clicked 黑龙江 row:', clicked);
await page.waitForTimeout(10000);
const video = await page.locator('video').count();
const vstate = video ? await page.evaluate(() => { const v = document.querySelector('video'); return { ready: v.readyState, w: v.videoWidth, h: v.videoHeight }; }) : null;
console.log('3. video:', video, JSON.stringify(vstate));
console.log('4. errors:', errors.length ? errors.slice(0, 4) : 'none');
await browser.close();
