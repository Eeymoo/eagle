import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
await page.goto('http://localhost:1420/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
// settings → toggle 隐藏坏台 off → back
await page.getByText('⚙︎').click();
await page.waitForTimeout(600);
const switches = page.locator('input[type="checkbox"]');
const count = await switches.count();
// second switch is 隐藏坏台 (first is 刷新时自动体检)
if (count >= 2) await switches.nth(1).click();
await page.waitForTimeout(400);
await page.getByText('‹ 返回').click();
await page.waitForTimeout(2500);
console.log('1. rows after unhide:', await page.evaluate(() => {
  const t = document.body.innerText;
  return { anhui: t.includes('Anhui TV'), cctv: t.includes('CCTV') };
}));
await page.getByText('Anhui TV', { exact: true }).first().click({ timeout: 8000 });
await page.waitForTimeout(6000);
const hasVideo = await page.locator('video').count();
const state = hasVideo ? await page.evaluate(() => { const v = document.querySelector('video'); return { readyState: v.readyState, w: v.videoWidth, h: v.videoHeight }; }) : null;
console.log('2. video:', hasVideo, JSON.stringify(state));
console.log('3. pageerrors:', errors.length ? errors : 'none');
await browser.close();
