import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://localhost:1420/', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.getByText('⚙︎').click();
await page.waitForTimeout(400);
await page.getByText('Jellyfin').last().click();
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
await page.waitForTimeout(5000);
// click FIRST visible channel row immediately (before health marks it bad)
const first = await page.evaluate(() => {
  const t = document.body.innerText;
  const rows = t.split('\n').filter(l => l && !l.includes('Eagle') && !l.includes('体检') && !l.includes('⚙')).slice(0, 6);
  return rows;
});
console.log('first rows:', JSON.stringify(first));
const clicked = await page.evaluate(() => {
  const els = Array.from(document.querySelectorAll('span,div')).filter(e => e.childElementCount === 0 && /TV|CCTV|卫视|\(720p\)|\(1080p\)/.test(e.textContent ?? '') && (e.textContent ?? '').length > 3);
  const el = els[0];
  if (!el) return 'no-el';
  let n = el;
  for (let i = 0; i < 6 && n; i++) { n.dispatchEvent(new MouseEvent('click', { bubbles: true })); n = n.parentElement; }
  return el.textContent;
});
console.log('clicked:', clicked);
await page.waitForTimeout(10000);
const video = await page.locator('video').count();
const vstate = video ? await page.evaluate(() => { const v = document.querySelector('video'); return { ready: v.readyState, w: v.videoWidth }; }) : null;
const m3u8Reqs = [];
await browser.close();
console.log('video:', video, JSON.stringify(vstate));
