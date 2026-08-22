import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:1420/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
const dock = await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('div')).find((d) => {
    const st = getComputedStyle(d);
    return st.position === 'absolute' && Math.round(d.getBoundingClientRect().width) === 64;
  });
  if (!el) return { found: false };
  const st = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    found: true, w: Math.round(r.width), h: Math.round(r.height),
    left: Math.round(r.left), top: Math.round(r.top), bottom: Math.round(r.bottom),
    radius: st.borderRadius, glass: st.backdropFilter, border: st.borderWidth,
    centeredV: Math.abs(r.top - (900 - r.bottom)) < 4, svgs: el.querySelectorAll('svg').length,
  };
});
console.log('D1. dock:', JSON.stringify(dock));
// hover state via real pointer
const el2 = await page.evaluateHandle(() => Array.from(document.querySelectorAll('div')).find((d) => {
  const st = getComputedStyle(d);
  return st.position === 'absolute' && Math.round(d.getBoundingClientRect().width) === 64;
}));
const btns = await el2.asElement().$$('div[role="button"], [role="button"]');
if (btns.length > 1) {
  await btns[1].hover();
  await page.waitForTimeout(300);
  const bg = await btns[1].evaluate((b) => getComputedStyle(b).backgroundColor);
  console.log('D2. hover bg:', bg, '| count:', btns.length);
} else {
  console.log('D2. buttons found:', btns.length);
}
await browser.close();
