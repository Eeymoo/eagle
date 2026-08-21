import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://localhost:1420/', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.getByText('⚙︎').click();
await page.waitForTimeout(400);
await page.getByText('HDHomeRun').last().click();
await page.waitForTimeout(300);
await page.getByPlaceholder('http://192.168.1.50').fill('http://127.0.0.1:1954');
await page.getByText('添加', { exact: true }).click();
await page.waitForTimeout(3500);
// find the row containing the channel name, click its ancestor
const clicked = await page.evaluate(() => {
  const els = Array.from(document.querySelectorAll('span,div'));
  const el = els.find(e => e.childElementCount === 0 && e.textContent === 'CCTV-1 综合');
  if (!el) return 'name-not-found';
  const row = el.closest('div[class*="css-view"] , div')?.parentElement;
  // walk up to a clickable-looking row (flex row with logo/img sibling)
  let node = el;
  for (let i = 0; i < 6 && node; i++) {
    node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    node = node.parentElement;
  }
  return 'dispatched';
});
console.log('click:', clicked);
await page.waitForTimeout(3000);
console.log('video mounted:', (await page.locator('video').count()) === 1);
console.log('text now:', JSON.stringify((await page.evaluate(() => document.body.innerText)).slice(0, 80)));
await browser.close();
