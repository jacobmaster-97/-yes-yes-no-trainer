const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { htmlPath, launchOptions } = require('./helpers.cjs');

(async () => {
  const browser = await chromium.launch(launchOptions);
  try {
    const context = await browser.newContext();
    const errors = [];
    await context.route('http://localhost:8765/**', route => {
      const name = new URL(route.request().url()).pathname;
      const source = name.endsWith('/yes-yes-no-trainer.html') ? htmlPath :
        path.join(path.dirname(htmlPath), 'index.html');
      return route.fulfill({ contentType: 'text/html', body: fs.readFileSync(source, 'utf8') });
    });
    await context.setOffline(true);
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:8765/-yes-yes-no-trainer/');
    await page.waitForURL('http://localhost:8765/-yes-yes-no-trainer/yes-yes-no-trainer.html');
    assert(await page.getByRole('button', { name: '開始這組訓練' }).isVisible());
    assert.equal(await page.locator('#speedMin').inputValue(), '50');
    assert.equal(await page.locator('#speedMax').inputValue(), '80');
    assert.deepEqual(errors, []);
    console.log('PASS: Pages project-path entry opens the canonical V2 application using relative paths.');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
