import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://localhost:1420/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const info = await page.evaluate(() => {
  const i = document.querySelector('input[placeholder="搜索频道"]');
  if (!i) return 'no input';
  const cs = getComputedStyle(i);
  const parent = i.parentElement;
  const pcs = parent ? getComputedStyle(parent) : null;
  return {
    self: { width: cs.width, flex: cs.flex, maxWidth: cs.maxWidth, display: cs.display, border: cs.border },
    parent: parent ? { tag: parent.tagName, cls: parent.className.slice(0, 60), width: pcs?.width, flex: pcs?.flex, display: pcs?.display, flexBasis: pcs?.flexBasis, overflow: pcs?.overflow } : null,
    grandparent: parent?.parentElement ? { tag: parent.parentElement.tagName, width: getComputedStyle(parent.parentElement).width, display: getComputedStyle(parent.parentElement).display } : null,
  };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
