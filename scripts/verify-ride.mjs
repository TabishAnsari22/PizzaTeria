import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const journeySource = await readFile(new URL('../lib/journeyMotion.js', import.meta.url), 'utf8');
const {
  JOURNEY_HEIGHT_VH, ORIGINAL_TRAVEL_VH, DEPARTURE_START,
  getStoryProgress, getScrollProgress,
} = await import(`data:text/javascript;base64,${Buffer.from(journeySource).toString('base64')}`);
const url = process.argv[2] || 'http://127.0.0.1:3001';
const report = { viewports: [], errors: [] };
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
});
try {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
    page.setDefaultTimeout(60000);
    page.on('pageerror', error => report.errors.push(`${viewport.name}: ${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error') report.errors.push(`${viewport.name}: ${message.text()}`);
    });
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
      await page.locator('.journey-scene canvas').waitFor({ state: 'attached' });
      const story = await page.locator('.journey').evaluate(el => ({ top: el.offsetTop, height: el.offsetHeight }));
      assert.equal(story.height, Math.round(viewport.height * JOURNEY_HEIGHT_VH / 100), `${viewport.name}: extended section height`);
      const travel = story.height - viewport.height;
      const originalRidePixels = viewport.height * ORIGINAL_TRAVEL_VH / 100 * (1 - DEPARTURE_START);
      const ridePixels = travel * (1 - getScrollProgress(DEPARTURE_START));
      assert.ok(ridePixels > 3 * originalRidePixels, `${viewport.name}: added riding must exceed three times the old scroll duration`);
      const result = { viewport: viewport.name, ridePixels, originalRidePixels, rideRatio: ridePixels / originalRidePixels, stages: [] };
      report.viewports.push(result);
      for (const [name, progress] of [
        ['parked', 0.95], ['moving', 0.975], ['delivered', 1],
        ['reverse-moving', 0.975], ['reverse-parked', 0.95],
      ]) {
        const raw = getScrollProgress(progress);
        await page.evaluate(({ top, travel, raw }) => window.scrollTo({ top: top + travel * raw, behavior: 'instant' }), { top: story.top, travel, raw });
        await page.waitForTimeout(1500);
        assert.match(await page.locator('.journey-timeline button.active').innerText(), /05\s*Your table/, `${viewport.name}: delivery chapter remains active while riding`);
        assert.equal(await page.locator('.scene-fallback').count(), 0, `${viewport.name}: WebGL scene remains active`);
        const canvas = await page.locator('.journey-scene canvas').boundingBox();
        assert.ok(canvas && canvas.width > 0 && canvas.height > 0, `${viewport.name}: scene has a rendered canvas`);
        assert.ok(canvas.x >= -1 && canvas.x + canvas.width <= viewport.width + 1, `${viewport.name}: complete camera frame stays inside the viewport horizontally`);
        assert.ok(canvas.y >= -1 && canvas.y + canvas.height <= viewport.height + 1, `${viewport.name}: complete camera frame stays inside the viewport vertically`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${viewport.name}: no horizontal overflow`);
        const scrollY = await page.evaluate(() => window.scrollY);
        const actualProgress = getStoryProgress((scrollY - story.top) / travel);
        assert.ok(Math.abs(actualProgress - progress) < 0.001, `${viewport.name}: actual scroll reaches requested story pose ${progress}`);
        await page.screenshot({ path: `artifacts/ride-${viewport.name}-${name}.png`, timeout: 60000 });
        result.stages.push({ name, progress, raw, scrollY, actualProgress });
        console.log(`Ride checked: ${viewport.name} ${name}`);
      }
      const [parked, moving, delivered, reverseMoving, reverseParked] = result.stages;
      assert.ok(parked.scrollY < moving.scrollY && moving.scrollY < delivered.scrollY, `${viewport.name}: riding advances through the added scroll range`);
      assert.ok(delivered.scrollY > reverseMoving.scrollY && reverseMoving.scrollY > reverseParked.scrollY, `${viewport.name}: reverse scrolling retraces the route`);
      assert.ok(Math.abs(parked.scrollY - reverseParked.scrollY) <= 1, `${viewport.name}: reverse parked position matches the forward position`);
      assert.ok(Math.abs(moving.scrollY - reverseMoving.scrollY) <= 1, `${viewport.name}: reverse riding position matches the forward position`);
    } finally {
      await page.close();
    }
  }
  assert.deepEqual(report.errors.filter(error => !error.includes('Download the React DevTools')), [], 'The longer ride must not introduce runtime or asset errors');
  console.log('PASS: desktop/mobile longer ride, delivery chapter, viewport framing, forward/reverse positions, and no browser errors.');
  console.log(JSON.stringify(report.viewports.map(({ stages, ...viewport }) => viewport)));
} finally {
  await writeFile('artifacts/ride-report.json', JSON.stringify(report, null, 2));
  await browser.close();
}
