// Знімає перший екран кожного сайту з tools/shots.json → assets/img/work/*.jpg
// Запускається в GitHub Actions (.github/workflows/screenshots.yml).
import { chromium } from 'playwright';
import { readFile, mkdir } from 'node:fs/promises';

const list = JSON.parse(await readFile(new URL('./shots.json', import.meta.url), 'utf8'));
await mkdir('assets/img/work', { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, locale: 'uk-UA' });
let failed = 0;
for (const { url, file } of list) {
  const page = await ctx.newPage();
  try {
    try { await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }); }
    catch { await page.goto(url, { waitUntil: 'load', timeout: 45000 }); }
    // ховаємо типові банери cookies, щоб не перекривали перший екран
    await page.addStyleTag({ content: '[id*="cookie" i],[class*="cookie" i],[id*="consent" i],[class*="consent" i],#CybotCookiebotDialog{display:none!important}' }).catch(() => {});
    await page.mouse.wheel(0, 300); await page.waitForTimeout(800);
    await page.mouse.wheel(0, -300); await page.waitForTimeout(2500);
    await page.screenshot({ path: `assets/img/work/${file}`, type: 'jpeg', quality: 72 });
    console.log('ok', url);
  } catch (e) {
    failed++;
    console.log('fail', url, e.message);
  }
  await page.close();
}
await browser.close();
console.log(`done, failed: ${failed}`);
