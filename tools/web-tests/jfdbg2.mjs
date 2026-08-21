import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGE: ' + e.message.slice(0, 120)));
page.on('console', m => { if (m.type() === 'error') errs.push('CON: ' + m.text().slice(0, 120)); });
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
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(i, val);
  i.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}, v);
await setByPh('http://192.168.1.10:8096', 'https://jf.onemue.cn');
await setByPh('admin', 'eeymoo');
await setPW('lmh1999.');
await page.getByText('添加', { exact: true }).click();
await page.waitForTimeout(5000);
const clicked = await page.evaluate(() => {
  const els = Array.from(document.querySelectorAll('span,div')).filter(e => e.childElementCount === 0 && /TV|CCTV|\(720p\)|\(1080p\)/.test(e.textContent ?? '') && (e.textContent ?? '').length > 3);
  const el = els[0];
  if (!el) return 'no-el';
  let n = el;
  for (let i = 0; i < 6 && n; i++) { n.dispatchEvent(new MouseEvent('click', { bubbles: true })); n = n.parentElement; }
  return el.textContent;
});
console.log('clicked:', clicked);
await page.waitForTimeout(6000);
console.log('body:', JSON.stringify((await page.evaluate(() => document.body.innerText)).slice(0, 200)));
console.log('errs:', errs.length ? errs.slice(0, 5) : 'none');
await browser.close();
