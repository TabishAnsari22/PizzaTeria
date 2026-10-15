import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const expectWarning = process.argv.includes('--expect-warning');
const url = process.argv.find(value => value.startsWith('http')) || 'http://127.0.0.1:3000';
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const outcomes = [];
  for (const reducedMotion of expectWarning ? ['no-preference'] : ['no-preference', 'reduce']) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.emulateMedia({ reducedMotion });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  // Reproduce the exact browser-extension mutation BEFORE any React code runs.
  await page.route('**/*', async route => {
    const request = route.request();
    if (request.isNavigationRequest() && request.resourceType() === 'document') {
      const response = await route.fetch();
      const html = await response.text();
      await route.fulfill({ response, body: html.replace(/<body([^>]*)>/, '<body$1 cz-shortcut-listen="true">') });
    } else await route.continue();
  });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  await page.getByRole('button', { name: 'Open bag, 0 items' }).click();
  await page.getByRole('dialog').waitFor();
  assert.equal(await page.locator('body').getAttribute('cz-shortcut-listen'), 'true');
  const hydration = errors.filter(error => /hydration|hydrated|server rendered|server-rendered/i.test(error));
  outcomes.push({ reducedMotion, expectWarning, hydration, errors });
  await writeFile(`artifacts/hydration-${expectWarning ? 'baseline' : 'fixed'}.json`, JSON.stringify(outcomes, null, 2));
  assert.equal(hydration.length > 0, expectWarning, expectWarning ? 'The original extension-attribute mismatch must reproduce' : 'Extension-injected body attributes must not cause a hydration warning');
  console.log(expectWarning ? 'PASS: reproduced the original cz-shortcut-listen hydration warning.' : `PASS: ${reducedMotion} motion — extension mutation produces no hydration warning; cart hydrates correctly.`);
  await page.close();
  }
} finally { await browser.close(); }
