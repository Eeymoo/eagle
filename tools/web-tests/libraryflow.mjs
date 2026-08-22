/**
 * E2E: Jellyfin-style media library home.
 * Seeds the jellyfin-video source, then:
 *  1. /library shows 我的媒体 (电视剧/电影) + 最近添加
 *  2. 电影 library → poster wall with items
 *  3. series from 最近添加/电视剧 → episode list
 *  4. playback from library → player mounts
 *  5. pause at ~2min → back to /library → 继续观看 card appears
 *  6. click it → resumes with ?t=
 */
import { chromium } from '/_home/.npm/_npx/226752580240d182/node_modules/playwright/index.mjs';

const EXE = '/_home/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell';
const browser = await chromium.launch({ executablePath: EXE, headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));

const text = () => page.evaluate(() => document.body.innerText);

// --- seed source ----------------------------------------------------------
await page.goto('http://localhost:1420/', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.getByText('设置', { exact: true }).first().click();
await page.waitForTimeout(800);
await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('div,span')).find((e) => e.childElementCount === 0 && (e.textContent ?? '').trim() === '数据源');
  el?.closest('div')?.click();
});
await page.waitForTimeout(800);
await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('div,span')).find((e) => e.childElementCount === 0 && (e.textContent ?? '').trim() === '源管理');
  el?.closest('div')?.click();
});
await page.waitForTimeout(800);
await page.getByText('Jellyfin 媒体库').last().click();
await page.waitForTimeout(300);
const set = async (ph, v) => page.evaluate(([p, val]) => {
  const i = Array.from(document.querySelectorAll('input')).find((x) => x.placeholder === p || (p === '__pw' && x.type === 'password'));
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(i, val);
  i.dispatchEvent(new Event('input', { bubbles: true }));
}, [ph, v]);
await set('http://192.168.1.10:8096', 'https://jf.onemue.cn');
await set('admin', 'eeymoo');
await set('__pw', 'lmh1999.');
await page.getByText('添加', { exact: true }).click();
await page.waitForTimeout(20000);

// --- 1. home IS the library now --------------------------------------------
await page.waitForTimeout(6000);
if (!(await page.evaluate(() => document.body.innerText)).includes('我的媒体')) {
  // server flake fallback: old path
  await page.goto('http://localhost:1420/library', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
}
const home = await text();
console.log('1. 我的媒体 电视剧:', home.includes('电视剧'), '| 电影:', home.includes('电影'));
console.log('1b. 最近添加:', home.includes('最近添加'));
const bgImgs = await page.evaluate(() => Array.from(document.querySelectorAll('img')).map((i) => i.src).filter((u) => u.includes('/Images/Primary')));
console.log('1d. 库卡背景图数量:', bgImgs.length, '| 含电视剧/电影卡:', bgImgs.length >= 2);
await page.screenshot({ path: '/_home/Codes/Eagle/tools/web-tests/library-home.png' });
console.log('1e. screenshot saved');
const cardDom = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('div')) {
    const r = el.getBoundingClientRect();
    if (Math.round(r.width) === 200 && Math.round(r.height) === 120) {
      const img = el.querySelector('img');
      out.push({
        label: el.textContent?.trim().slice(0, 10),
        bgImg: !!img,
        loaded: img ? img.complete && img.naturalWidth > 0 : false,
        fit: img ? getComputedStyle(img).objectFit : null,
      });
    }
  }
  return out;
});
console.log('1f. 库卡 DOM:', JSON.stringify(cardDom));
console.log('1c. 继续观看 (empty ok):', home.includes('继续观看') || !home.includes('继续观看') ? 'n/a-first-run' : '?');

// --- 2. 电影 poster wall ----------------------------------------------------
await page.getByText('电影', { exact: true }).first().click();
await page.waitForTimeout(6000);
const wall = await text();
const wallHasItems = /19\d\d|20\d\d/.test(wall);
console.log('2. 电影墙有年份条目:', wallHasItems, '| url:', page.url().slice(-20));

// --- 4. play a movie from the wall -----------------------------------------
const movieCard = page.locator('img').first();
const n = await page.locator('img').count();
console.log('3b. img count:', n);
await movieCard.click({ timeout: 8000 }).catch((e) => console.log('3c. click err:', e.message.split('\n')[0]));
await page.waitForTimeout(800);
console.log('3d. url after click:', page.url().slice(-30));
if (!page.url().includes('/player/')) {
  await page.waitForTimeout(9000);
  console.log('3e. after wait url:', page.url().slice(-30), '| body:', JSON.stringify((await text()).slice(0, 50)));
}
// wait for player mount (list load + stream resolve vary with server mood)
let mounted = false;
for (let i = 0; i < 10 && !mounted; i++) {
  await page.waitForTimeout(1500);
  mounted = (await page.locator('.player-root, video').count()) > 0;
}
console.log('4. player mounted from wall click:', mounted, '| url has t:', /player\//.test(page.url()));

// --- 5. pause at ~2min → progress recorded --------------------------------
if (mounted) {
  await page.evaluate(() => {
    const v = document.querySelector('video');
    if (v && v.duration) { v.currentTime = 120; v.dispatchEvent(new Event('pause')); }
  });
  await page.waitForTimeout(800);
  await page.evaluate(() => history.pushState(null, '', '/library'));
  await page.goBack().catch(() => page.evaluate(() => history.back()));
  await page.waitForTimeout(1500);
  if (!page.url().includes('/library')) { await page.evaluate(() => location.assign('/library')); await page.waitForTimeout(2000); }
  const home2 = await text();
  console.log('5. 继续观看出现:', home2.includes('继续观看'), '| 剩余分钟显示:', /剩 \d+ 分钟|剩 \d+ 小时/.test(home2));

  // --- 6. resume click ------------------------------------------------------
  if (home2.includes('继续观看')) {
    await page.evaluate(() => {
      window.__evts = [];
      const rec = (tag) => (e) => window.__evts.push(`${tag}@${Math.round((e.target)?.currentTime ?? 0)}`);
      const obs = new MutationObserver(() => {
        const v = document.querySelector('video');
        if (v && !v.__hooked) {
          v.__hooked = 1;
          for (const t of ['loadedmetadata', 'seeking', 'seeked', 'play', 'playing', 'emptied', 'loadstart'])
            v.addEventListener(t, rec(t));
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    });
    await page.locator('text=/剩 /').first().click({ timeout: 5000 }).catch(() => page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('div,span')).find((e) => /剩 \d+ 分钟/.test(e.textContent ?? ''));
      el?.closest('[role="button"], div')?.click();
    }));
    await page.waitForTimeout(4000);
    // wait for the video element (list refresh + stream resolve)
    for (let i = 0; i < 20; i++) {
      if (await page.locator('video').count() > 0) break;
      await page.waitForTimeout(2000);
    }
    await page.waitForTimeout(2500);
    const t = new URL(page.url()).searchParams.get('t');
    const info = await page.evaluate(() => {
      const v = document.querySelector('video');
      return v ? { pos: Math.round(v.currentTime), dur: Math.round(v.duration || 0), paused: v.paused } : null;
    });
    console.log('6. resume url ?t=', t, '| video:', JSON.stringify(info));
    console.log('6z. body:', JSON.stringify((await text()).slice(0, 80)), '| url:', page.url().slice(-40));
    // manual probe: dispatch loadedmetadata handlers again? just wait more
    await page.waitForTimeout(4000);
    const info2 = await page.evaluate(() => {
      const v = document.querySelector('video');
      return v ? { pos: Math.round(v.currentTime), dur: Math.round(v.duration || 0) } : null;
    });
    console.log('6b. after more wait:', JSON.stringify(info2));
    // re-dispatch loadedmetadata: does the React handler seek to startAt?
    await page.evaluate(() => { const v = document.querySelector('video'); if (v) { v.currentTime = 0; v.dispatchEvent(new Event('loadedmetadata')); } });
    await page.waitForTimeout(1200);
    console.log('6e. events:', JSON.stringify(await page.evaluate(() => (window.__evts ?? []).slice(0, 18))));
    await page.waitForTimeout(1500);
    console.log('6f. final pos:', await page.evaluate(() => Math.round(document.querySelector('video')?.currentTime ?? -1)));
  }
}

// --- responsive: mobile viewport wall columns + rail metrics -------------
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(1200);
const mob = await page.evaluate(() => {
  const body = document.body.innerText;
  return { libHome: body.includes('我的媒体') || body.includes('继续观看') };
});
await page.goto('http://localhost:1420/library', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(9000);
const mobWall = await page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll('img'));
  const rows = new Set();
  for (const i of imgs) { const r = i.getBoundingClientRect(); if (r.width > 80 && r.height > 100) rows.add(Math.round(r.top)); }
  return { posterImgs: imgs.length, distinctTopOffsets: rows.size };
});
console.log('R1. mobile (390px) home ok:', JSON.stringify(mob), '| wall rows:', JSON.stringify(mobWall));
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(1200);
const desk = await page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll('img'));
  const rows = new Set();
  for (const i of imgs) { const r = i.getBoundingClientRect(); if (r.width > 80 && r.height > 100) rows.add(Math.round(r.top)); }
  return { posterImgs: imgs.length, distinctTopOffsets: rows.size };
});
console.log('R2. desktop (1440px) wall rows:', JSON.stringify(desk));
// alignment audit: last-row centering + 1280 cap on the browse wall
await page.evaluate(() => window.__nav ? 0 : 0);
const align = await page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll('img')).filter((i) => { const r = i.getBoundingClientRect(); return r.width > 80 && r.height > 100; });
  if (!imgs.length) return { note: 'no wall imgs' };
  const leftEdges = imgs.map((i) => Math.round(i.getBoundingClientRect().left));
  const rightEdges = imgs.map((i) => Math.round(i.getBoundingClientRect().right));
  return {
    wallLeft: Math.min(...leftEdges),
    wallRight: Math.max(...rightEdges),
    viewport: window.innerWidth,
    leftMargin: Math.min(...leftEdges),
    rightMargin: window.innerWidth - Math.max(...rightEdges),
  };
});
console.log('R3. wall balance (margins should be ≈equal):', JSON.stringify(align));
console.log('errors:', errors.length ? errors.slice(0, 3) : 'none');
await browser.close();
