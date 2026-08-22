import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', headless: true });

// Desktop: left rail
const desk = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await desk.goto('http://localhost:1420/', { waitUntil: 'domcontentloaded' });
await desk.waitForTimeout(2500);
const rail = await desk.evaluate(() => {
  const els = Array.from(document.querySelectorAll('div')).filter((d) => {
    const st = getComputedStyle(d);
    return st.borderRightWidth === '1px' && Math.round(d.getBoundingClientRect().width) === 168;
  });
  const nav = els[0];
  if (!nav) return { found: false, body: document.body.innerText.slice(0, 60) };
  const r = nav.getBoundingClientRect();
  return { found: true, w: Math.round(r.width), left: Math.round(r.left), labels: nav.textContent?.trim().replace(/\s+/g, '|') };
});
console.log('D1. desktop rail:', JSON.stringify(rail));
// settings hub
await desk.getByText('设置', { exact: true }).first().click();
await desk.waitForTimeout(1500);
console.log('D2. settings hub url:', desk.url().slice(-16), '| sections:', (await desk.evaluate(() => document.body.innerText)).includes('数据源'));
// section level
await desk.getByText('播放与健康检查').click();
await desk.waitForTimeout(1200);
const sec = await desk.evaluate(() => {
  const t = document.body.innerText;
  return { toggle: t.includes('刷新时体检'), select: t.includes('优先流类型'), multi: t.includes('播放器快捷功能'), chips: t.includes('直连') };
});
console.log('D3. section controls:', JSON.stringify(sec), '| url:', desk.url().slice(-24));
// toggle interaction
await desk.getByText('隐藏坏台', { exact: true }).click();
await desk.waitForTimeout(800);
console.log('D4. toggle tapped (persisted async)');
// custom page
await desk.goto('http://localhost:1420/settings', { waitUntil: 'domcontentloaded' });
await desk.waitForTimeout(1000);
await desk.evaluate(() => {
  const el = Array.from(document.querySelectorAll('div,span')).find((e) => e.childElementCount === 0 && (e.textContent ?? '').trim() === '数据源');
  el?.closest('div')?.click();
});
await desk.waitForTimeout(1000);
await desk.evaluate(() => {
  const el = Array.from(document.querySelectorAll('div,span')).find((e) => e.childElementCount === 0 && (e.textContent ?? '').trim() === '源管理');
  el?.closest('div')?.click();
});
await desk.waitForTimeout(1500);
console.log('D5. sources page url:', desk.url().slice(-20), '| form:', (await desk.evaluate(() => document.body.innerText)).includes('Jellyfin'));
await desk.close();

// Mobile: bottom tabs
const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mob.goto('http://localhost:1420/', { waitUntil: 'domcontentloaded' });
await mob.waitForTimeout(2500);
const tabs = await mob.evaluate(() => {
  // bottom tab bar: any div containing exactly the 3 nav labels, pinned near the bottom
  const cands = Array.from(document.querySelectorAll('div')).filter((d) => {
    const t = (d.textContent ?? '');
    const r = d.getBoundingClientRect();
    return t.includes('媒体库') && t.includes('直播') && t.includes('设置') && t.replace(/[媒体库直播设置]/g, '').length < 4 && r.top > 640;
  });
  const nav = cands.sort((a, b) => (b.getBoundingClientRect().top - a.getBoundingClientRect().top))[0];
  if (!nav) return { found: false, body: document.body.innerText.slice(0, 80) };
  const r = nav.getBoundingClientRect();
  return { found: true, top: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width), labels: nav.textContent?.trim().replace(/\s+/g, '|') };
});
console.log('M1. mobile bottom tabs:', JSON.stringify(tabs));
await browser.close();
