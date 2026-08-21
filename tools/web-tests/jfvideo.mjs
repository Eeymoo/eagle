import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
await page.goto('http://localhost:1420/', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.getByText('⚙︎').click();
await page.waitForTimeout(500);
const tabTexts = await page.evaluate(() => document.body.innerText);
console.log('1. new tab present:', tabTexts.includes('Jellyfin 媒体库'));
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
console.log('2. fill:', await setByPh('http://192.168.1.10:8096', 'https://jf.onemue.cn'), await setByPh('admin', 'eeymoo'), await setPW('lmh1999.'));
await page.getByText('添加', { exact: true }).click();
await page.waitForTimeout(25000); // big library (7884 items, internal paging)
const text = await page.evaluate(() => document.body.innerText);
const hasItems = text.includes('变形记') || text.includes('电影') || text.includes('肥皂');
console.log('3. library items listed:', hasItems, '| bodylen:', text.length, '| sample:', JSON.stringify(text.slice(0, 150)));
// click first item row
const clicked = await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('span,div')).find(e => e.childElementCount === 0 && /\(2021\)\s*$/.test((e.textContent ?? '').trim()));
  if (!el) return false;
  let n = el;
  for (let i = 0; i < 6 && n; i++) { n.dispatchEvent(new MouseEvent('click', { bubbles: true })); n = n.parentElement; }
  return true;
});
console.log('4. clicked item:', clicked);
await page.waitForTimeout(12000);
const video = await page.locator('video').count();
const vstate = video ? await page.evaluate(() => { const v = document.querySelector('video'); return { ready: v.readyState, w: v.videoWidth }; }) : null;
const bodyNow = (await page.evaluate(() => document.body.innerText)).slice(0, 100);
console.log('5. video:', video, JSON.stringify(vstate), '| body:', JSON.stringify(bodyNow));
console.log('6. errors:', errors.length ? errors.slice(0, 3) : 'none');
await browser.close();
