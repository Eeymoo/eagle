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
await page.waitForTimeout(400);
await page.getByText('M3U Tuner').last().click();
await page.waitForTimeout(300);
await page.getByPlaceholder('http://example.com/playlist.m3u').fill('https://iptv-org.github.io/iptv/countries/cn.m3u');
await page.getByText('添加', { exact: true }).click();
// sample the health hint over time
const samples = [];
for (let i = 0; i < 10; i++) {
  await page.waitForTimeout(1500);
  const txt = await page.evaluate(() => document.body.innerText);
  const m = txt.match(/剩余 (\d+) 个频道/);
  samples.push(m ? m[1] : (txt.includes('体检') ? 'running-no-count' : 'done/none'));
  if (!m && !txt.includes('体检中')) break;
}
console.log('inflight samples:', samples.join(' → '));
console.log('pageerrors:', errors.length ? errors : 'none');
await browser.close();
