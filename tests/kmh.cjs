const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { htmlPath, launchOptions } = require('./helpers.cjs');

(async () => {
  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.route('http://localhost:8765/**', r => r.fulfill({ contentType: 'text/html', body: fs.readFileSync(htmlPath, 'utf8') }));
    await page.clock.install();
    await page.goto('http://localhost:8765/?debug=1');
    const result = await page.evaluate(() => {
      const api = YYN_DEBUG, s = api.normalize(), endpoint = { x: 0, y: 1 };
      const withDrag = api.solveFlight(endpoint, 80, s);
      const noDrag = api.solveFlight(endpoint, 80, { ...s, airResistance: false });
      const distance = Math.hypot(s.moundDistance - s.releaseExtension, 0.22), dy = 1 - s.releaseHeight, v = 80 / 3.6, g = api.constants.GRAVITY;
      const a = v * v - g * dy, c = distance * distance + dy * dy;
      const analyticMs = Math.sqrt(2 * c / (a + Math.sqrt(a * a - g * g * c))) * 1000;
      const norm = q => Math.hypot(q.x, q.y, q.z) * 3.6;
      const generated = api.generate(s), repeated = api.generate(s);
      let unreachable = false;
      try { api.solveFlight(endpoint, 40, { ...s, moundDistance: 24, releaseExtension: 0 }); } catch { unreachable = true; }
      const near = api.classify({ x: api.constants.HALF_PLATE + 0.03, y: 1 }, s);
      const outside = api.classify({ x: api.constants.HALF_PLATE + 0.04, y: 1 }, s);
      const corner = api.classify({ x: api.constants.HALF_PLATE + 0.03, y: s.zoneTop + 0.03 }, s);
      const protect = api.classify({ x: 0.23, y: 1 }, { ...s, twoStrikes: true });
      const danger = api.classify({ x: 0.75, y: 1 }, { ...s, twoStrikes: true, protectScale: 135 });
      const positions = generated.map(p => ({
        speed: p.releaseSpeedKmh,
        norm: norm(p.initialVelocity),
        start: api.sampleFlight(p, 0),
        end: api.sampleFlight(p, p.pitchDurationMs),
        endpoint: p.endpoint,
        tMonotone: p.samples.every((q, i, points) => i === 0 || q.t > points[i - 1].t),
        zMonotone: p.samples.every((q, i, points) => i === 0 || q.z < points[i - 1].z),
        startScale: api.project(p.release, s, 1000, 600).rScale,
        endScale: api.project({ ...p.endpoint, z: 0 }, s, 1000, 600).rScale
      }));
      return {
        same: JSON.stringify(generated) === JSON.stringify(repeated),
        strikes: generated.filter(p => p.isStrike).length,
        zeroRatio: api.generate({ ...s, strikeRatio: 0 }).filter(p => p.isStrike).length,
        fullRatio: api.generate({ ...s, strikeRatio: 100 }).filter(p => p.isStrike).length,
        narrow: api.generate({ ...s, zoneBottom: 1, zoneTop: 1.05 }).filter(p => p.isStrike).length,
        noDragMs: noDrag.pitchDurationMs,
        analyticMs,
        dragMs: withDrag.pitchDurationMs,
        noDragEnergy: Math.pow(norm(noDrag.arrivalVelocity) / 3.6, 2) - (v * v + 2 * g * (s.releaseHeight - endpoint.y)),
        dragEnd: withDrag.arrivalSpeedKmh,
        near, outside, corner, protect, danger, unreachable, positions,
        zeroSamples: api.personalStats([]),
        stanceIndependent: JSON.stringify(api.generate({ ...s, stance: 'left', eyeHeight: 1.9 })) === JSON.stringify(generated)
      };
    });
    assert(result.same && result.stanceIndependent && result.unreachable);
    assert.equal(result.strikes, 12);
    assert.equal(result.zeroRatio, 0);
    assert.equal(result.fullRatio, 20);
    assert.equal(result.narrow, 12);
    assert(Math.abs(result.noDragMs - result.analyticMs) < 0.2);
    assert(Math.abs(result.noDragEnergy) < 0.001);
    assert(result.dragMs > result.noDragMs);
    assert(result.dragEnd < 80);
    assert(result.near.isStrike && !result.outside.isStrike && !result.corner.isStrike);
    assert(result.protect.isProtectable && result.protect.systemRecommendation === 'GO');
    assert(result.danger.dangerous && result.danger.systemRecommendation === 'NO');
    for (const p of result.positions) {
      assert(p.speed >= 50 && p.speed <= 80);
      assert(Math.abs(p.norm - p.speed) < 1e-9);
      assert(p.tMonotone && p.zMonotone);
      assert.equal(p.start.z, 16.64);
      assert.equal(p.end.x, p.endpoint.x);
      assert.equal(p.end.y, p.endpoint.y);
      assert.equal(p.end.z, 0);
      assert(p.endScale > p.startScale);
    }
    assert.equal(result.zeroSamples.rated, 0);
    await page.locator('#speedMin').fill('150');
    await page.locator('#speedMax').fill('150');
    await page.getByRole('button', { name: '開始這組訓練' }).click();
    const timing = await page.evaluate(() => { const p = YYN_DEBUG.snapshot().pitch; return { duration: p.pitchDurationMs, follow: p.followMs }; });
    assert(timing.duration < 500);
    await page.keyboard.press('Enter');
    await page.clock.runFor(Math.floor(1100 + timing.duration - 30));
    assert.equal(await page.evaluate(() => YYN_DEBUG.snapshot().state), 'BALL_IN_FLIGHT');
    assert.equal(await page.evaluate(() => YYN_DEBUG.snapshot().session.pitches.length), 0);
    await page.clock.runFor(Math.ceil(30 + timing.follow + 50));
    assert.equal(await page.evaluate(() => YYN_DEBUG.snapshot().state), 'REVIEW');
    assert.equal(await page.evaluate(() => YYN_DEBUG.snapshot().session.pitches.length), 1);
    console.log('PASS: release speed equals 3-D velocity; flight time checked against independent ballistic solution; drag; continuous trajectories; perspective; sphere/strike-zone edge and corner; seed and ratios; unreachable settings rejected');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
