import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';

const url = process.argv[2] || 'http://127.0.0.1:3001';
const browser = await chromium.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const report = {};
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.addInitScript(() => {
    window.__sceneFrames = [];
    const targets = new WeakMap();
    for (const Type of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
      if (!Type) continue;
      const proto = Type.prototype;
      const bind = proto.bindFramebuffer;
      const clear = proto.clear;
      proto.bindFramebuffer = function(target, framebuffer) {
        if (target === this.FRAMEBUFFER || target === this.DRAW_FRAMEBUFFER) targets.set(this, framebuffer);
        return bind.apply(this, arguments);
      };
      proto.clear = function(mask) {
        if ((mask & this.COLOR_BUFFER_BIT) && !targets.get(this)) window.__sceneFrames.push(performance.now());
        return clear.apply(this, arguments);
      };
    }
  });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await page.waitForTimeout(1800);
  const story = await page.locator('.journey').evaluate(el => ({ top: el.offsetTop, height: el.offsetHeight }));
  const count = () => page.evaluate(() => window.__sceneFrames.length);
  const reset = () => page.evaluate(() => { window.__sceneFrames = []; });
  // Cold shaders and Canvas's debounced scroll measurement can add a final
  // frame after smoothing. Require two quiet windows instead of assuming a
  // software renderer has settled after an arbitrary wall-clock delay.
  const waitForQuiet = async label => {
    const windows = [];
    let quiet = 0;
    for (let attempt = 0; attempt < 16; attempt++) {
      await reset();
      await page.waitForTimeout(400);
      const frames = await count();
      windows.push(frames);
      quiet = frames === 0 ? quiet + 1 : 0;
      if (quiet === 2) {
        report[`${label}Windows`] = windows;
        return frames;
      }
    }
    report[`${label}Windows`] = windows;
    assert.fail(`${label}: scene did not stop rendering after settling (${windows.join(', ')} clears per window)`);
  };
  const scroll = progress => page.evaluate(({ top, height, progress }) => window.scrollTo({ top: top + (height - innerHeight) * progress, behavior: 'instant' }), { ...story, progress });
  await scroll(.2);
  report.idleFrames = await waitForQuiet('idle');
  await reset();
  await scroll(.25);
  await page.waitForTimeout(40);
  report.earlyFrames = await count();
  await page.waitForTimeout(850);
  report.forwardFrames = await count();
  assert.ok(report.forwardFrames >= 3, 'A scroll jump must interpolate across multiple rendered frames');
  assert.ok(report.forwardFrames > report.earlyFrames, 'Movement must continue easing after the input');
  report.settledFrames = await waitForQuiet('settled');
  await reset();
  await scroll(.2);
  await page.waitForTimeout(900);
  report.reverseFrames = await count();
  assert.ok(report.reverseFrames >= 3, 'Reverse scrolling must also interpolate');
  await scroll(.4);
  await page.waitForTimeout(1500);
  await reset();
  await page.waitForTimeout(450);
  report.visibleFireFrames = await count();
  assert.ok(report.visibleFireFrames >= 2, 'Visible embers must stay animated');
  await page.evaluate(({ top, height }) => window.scrollTo({ top: top + height + 300, behavior: 'instant' }), story);
  report.offscreenFrames = await waitForQuiet('offscreen');
  await mkdir('artifacts', { recursive: true });
  await writeFile('artifacts/motion-report.json', JSON.stringify(report, null, 2));
  console.log('PASS: forward/reverse input eases over multiple frames, motion settles, visible fire animates, and offscreen rendering pauses.');
  console.log(JSON.stringify(report));
} finally {
  await mkdir('artifacts', { recursive: true });
  await writeFile('artifacts/motion-report.json', JSON.stringify(report, null, 2));
  await browser.close();
}
