import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:1420/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
const rail = await page.evaluate(() => {
  const railEl = Array.from(document.querySelectorAll('div')).find((d) => {
    const st = getComputedStyle(d);
    return st.position === 'absolute' && st.left === '0px' && Math.round(d.getBoundingClientRect().width) === 92;
  });
  if (!railEl) return { found: false };
  const st = getComputedStyle(railEl);
  const r = railEl.getBoundingClientRect();
  const stack = railEl.firstElementChild?.getBoundingClientRect();
  const btns = Array.from(railEl.querySelectorAll('div')).filter((d) => {
    const st2 = getComputedStyle(d);
    return st2.display === 'flex' && st2.flexDirection === 'column' && (d.textContent ?? '').length < 8;
  });
  return {
    found: true, w: Math.round(r.width), pos: st.position, zIndex: st.zIndex,
    bg: st.backgroundColor,
    vCenter: stack ? Math.abs(stack.top + stack.height / 2 - 450) < 60 : false,
    labels: btns.map((b) => b.textContent?.trim()).join('|'),
    iconFirst: btns.map((b) => (b.textContent ?? '').trim().replace(/[媒体库直播设置]/g, '')).join(''),
  };
});
console.log('R1. rail:', JSON.stringify(rail));
// text safe: settings page text starts right of rail
await page.getByText('设置', { exact: true }).first().click();
await page.waitForTimeout(1200);
const safe = await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('div,span')).find((e) => e.childElementCount === 0 && (e.textContent ?? '').trim() === '数据源');
  return el ? { left: Math.round(el.getBoundingClientRect().left) } : null;
});
console.log('R2. settings text left (>=92):', JSON.stringify(safe));
await browser.close();
