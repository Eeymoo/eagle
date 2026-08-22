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
await page.getByText('⚙︎').click();
await page.waitForTimeout(400);
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

// --- 1. library home --------------------------------------------------------
await page.evaluate(() => history.pushState(null, '', '/library'));
await page.getByText('📚 媒体库').click();
await page.waitForTimeout(6000);
const home = await text();
console.log('1. 我的媒体 电视剧:', home.includes('电视剧'), '| 电影:', home.includes('电影'));
console.log('1b. 最近添加:', home.includes('最近添加'));
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
await page.waitForTimeout(2500);
const mounted = (await page.locator('.player-root').count()) > 0;
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

console.log('errors:', errors.length ? errors.slice(0, 3) : 'none');
await browser.close();
