const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.APP_URL || 'http://127.0.0.1:8000';
const solutions = [
  ['main', 'on'], ['heater_off', 'restore'],
  ['kitchen_kettle', 'kitchen_microwave', 'restore'],
  ['off', 'reset', 'one', 'isolate', 'recover', 'call'], ['safe', 'wait']
];
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'bundenban-test-'));
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base);
    assert.equal(await page.title(), '分電盤しらべる君');
    assert.equal(await page.locator('[data-id]').count(), 5);
    assert.equal(await page.locator('a[href*="teiden-tenken-kun"]').count(), 0);
    // Removing a selected action renumbers the remaining sequence.
    for (const id of ['main', 'on', 'main']) await page.locator(`[data-id="${id}"]`).click();
    assert.match(await page.locator('[data-id="on"]').innerText(), /^1/);
    await page.locator('#decide').click();
    assert.match(await page.locator('#feedback').innerText(), /不正解/);
    await page.locator('#reset').click();
    for (let stage = 0; stage < 5; stage++) {
      // All unnecessary operations must be rejected, even alongside a correct solution.
      const extras = await page.locator('[data-id^="decoy_"]').evaluateAll(es => es.map(e => e.dataset.id));
      assert.ok(extras.length);
      for (const extra of extras) {
        for (const id of [...solutions[stage], extra]) await page.locator(`[data-id="${id}"]`).click();
        await page.locator('#decide').click();
        assert.match(await page.locator('#feedback').innerText(), /不正解/);
        await page.locator('#reset').click();
      }
      // A missing prerequisite must fail.
      await page.locator(`[data-id="${solutions[stage].at(-1)}"]`).click();
      await page.locator('#decide').click();
      assert.match(await page.locator('#feedback').innerText(), /不正解/);
      await page.locator('#reset').click();
      if (stage === 1) {
        await page.locator('#hintButton').click();
        await page.locator('#closeHint').click();
        await page.locator('#reset').click();
        assert.match(await page.locator('#hintButton').innerText(), /使用済み/);
      }
      for (const id of solutions[stage]) await page.locator(`[data-id="${id}"]`).click();
      await page.locator('#decide').click();
      await page.locator('#success').waitFor({ state: 'visible' });
      assert.match(await page.locator('#successTitle').innerText(), stage === 1 ? /1点/ : /2点/);
      await page.locator('#closeSuccess').click();
      await page.waitForFunction(i => document.body.dataset.case === String(Math.min(i + 1, 4)), stage);
    }
    assert.match(await page.locator('#progress').innerText(), /9 \/ 10点/);
    await page.locator('#decide').click();
    assert.match(await page.locator('#progress').innerText(), /0 \/ 10点/);
    // Save a played session, then verify the saved app starts clean without networking.
    const saveEvent = page.waitForEvent('download');
    page.once('dialog', d => d.accept());
    await page.locator('#download').click();
    const saved = await saveEvent;
    assert.equal(saved.suggestedFilename(), '分電盤しらべる君.html');
    const savedPath = path.join(temp, saved.suggestedFilename());
    await saved.saveAs(savedPath);
    const offline = await browser.newContext({ offline: true });
    const local = await offline.newPage();
    // Managed Chromium blocks file:// navigation. Load the exact saved document
    // into an offline context to verify it has no required network resources.
    await local.setContent(fs.readFileSync(savedPath, 'utf8'));
    await local.locator('#licenseButton').click();
    assert.match(await local.locator('#licenseDialog').innerText(), /非商用利用/);
    assert.match(await local.locator('#licenseDialog').innerText(), /bundenban_shiraberu_kun/);
    await local.locator('#closeLicense').click();
    for (const id of solutions[0]) await local.locator(`[data-id="${id}"]`).click();
    await local.locator('#decide').click();
    assert.match(await local.locator('#successTitle').innerText(), /2点/);
    await offline.close();
    // Download-page cancellation and confirmation use the same complete HTML.
    await page.goto(base + '/download.html');
    page.once('dialog', d => d.dismiss());
    await page.locator('#download').click();
    assert.equal(await page.locator('#status').innerText(), 'ダウンロードする場合は、下のボタンを押してください。確認画面で「OK」を選ぶと保存を開始します。');
    page.once('dialog', d => d.accept());
    const downloadEvent = page.waitForEvent('download');
    await page.locator('#download').click();
    const download = await downloadEvent;
    const downloadedText = fs.readFileSync(await download.path(), 'utf8');
    assert.equal(downloadedText, fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8'));
    // Wide, tablet and phone layouts must keep controls in the page.
    const layoutIssues = [];
    for (const [width, height] of [[1280, 800], [1024, 600], [768, 1024], [390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.goto(base);
      for (let stage = 0; stage < 5; stage++) {
        const overflow = await page.evaluate(() => ({
          horizontal: document.documentElement.scrollWidth > innerWidth + 1,
          clipped: [...document.querySelectorAll('.area')].flatMap(area => [...area.querySelectorAll('.act')].filter(el => {
            if (!el.getClientRects().length) return false;
            const box = el.getBoundingClientRect(), parent = area.getBoundingClientRect();
            return box.bottom > parent.bottom + 2 || box.right > parent.right + 2;
          }).map(el => el.dataset.id))
        }));
        if (overflow.horizontal || overflow.clipped.length) layoutIssues.push({ width, height, stage, ...overflow });
        if (width === 1280 && stage === 0) await page.screenshot({ path: path.join(__dirname, '..', 'docs', 'app-screenshot.png'), fullPage: true });
        for (const id of solutions[stage]) await page.locator(`[data-id="${id}"]`).click();
        await page.locator('#decide').click();
        await page.locator('#closeSuccess').click();
      }
    }
    assert.deepEqual(layoutIssues, [], JSON.stringify(layoutIssues));
    assert.deepEqual(errors, []);
    console.log('PASS: all stages, unnecessary actions, prerequisites, scoring, hints, automatic progression, restart, offline HTML, license, download confirmation, four viewport sizes.');
  } finally {
    await browser.close();
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
