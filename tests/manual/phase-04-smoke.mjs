// Phase 04 local UI acceptance smoke; GUIDE_MODE=mock must be set on the dev server.
import { chromium, expect } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
const base = 'http://127.0.0.1:3101';
(async () => {
  // Use the existing Windows browser; no Playwright browser download is needed.
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
    errors.push(`Unexpected external request: ${url.hostname}`);
    return route.abort();
  });
  mkdirSync('test-results/phase-04', { recursive: true });
  async function width(name) {
    const size = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth }));
    expect(size.scroll, `${name} horizontal overflow`).toBeLessThanOrEqual(size.viewport);
    await page.screenshot({ path: `test-results/phase-04/${name}.png`, fullPage: true });
  }
  try {
    await page.goto(base);
    await page.getByRole('radio', { name: "I'm just curious about fish farming" }).check();
    await page.reload();
    await expect(page.getByRole('radio', { name: "I'm just curious about fish farming" })).toBeChecked();
    await width('welcome');
    await page.getByRole('link', { name: 'Continue where you left off' }).click();
    await expect(page.getByRole('heading', { name: /Is there enough good water/ })).toBeVisible();
    await page.getByText('Sources', { exact: true }).first().click();
    await expect(page.locator('details').first().getByRole('link')).toBeVisible();
    await page.getByRole('button', { name: 'Stuck?', exact: true }).first().click();
    await expect(page.getByText(/Try reading just wa-03/)).toBeVisible();
    const radios = page.getByRole('radio');
    await radios.nth(1).check(); await radios.nth(4).check(); await radios.nth(7).check();
    await page.reload();
    await expect(radios.nth(1)).toBeChecked();
    await expect(radios.nth(4)).toBeChecked();
    await expect(radios.nth(7)).toBeChecked();
    const guide = page.locator('[aria-labelledby="guide-title"]');
    await guide.getByLabel('Your question').fill('Why does the dry season matter for a fish pond?');
    await guide.getByRole('button', { name: 'Ask guide', exact: true }).click();
    await expect(guide.getByRole('heading', { name: 'From the lesson' })).toBeVisible();
    await expect(guide.getByRole('link', { name: /^wa-03/ })).toBeVisible();
    await guide.getByRole('link', { name: /^wa-03/ }).click();
    expect(new URL(page.url()).hash).toBe('#wa-03');
    await guide.getByLabel('Your question').fill('What dose of medicine should I give sick catfish?');
    await guide.getByRole('button', { name: 'Ask guide', exact: true }).click();
    await expect(guide.getByRole('heading', { name: 'Not covered in this lesson' })).toBeVisible();
    await expect(guide.getByText(/Find out if there is a fisheries extension agent/)).toBeVisible();
    await width('lesson');
    await page.getByRole('link', { name: 'Try the activity', exact: true }).click();
    const activity = JSON.parse(readFileSync('content/activity.json', 'utf8'));
    for (const path of activity.paths.filter(path => path.example)) {
      await page.getByRole('radio', { name: path.label, exact: true }).check();
      await page.locator('summary:visible').filter({ hasText: 'See an example' }).click();
      await expect(page.locator('details:visible').getByText(path.example, { exact: true })).toBeVisible();
      await page.getByLabel('Your answer', { exact: true }).fill(path.example);
      await page.getByRole('button', { name: 'Get feedback', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Activity completed', exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByRole('radio', { name: path.label, exact: true })).toBeChecked();
      await expect(page.getByRole('heading', { name: 'Activity completed', exact: true })).toBeVisible();
    }
    await page.getByRole('radio', { name: "I don't have access to any site" }).check();
    await page.getByRole('button', { name: 'Stuck?', exact: true }).click();
    await expect(page.getByText(/Re-read Amina's story and look for three facts/)).toBeVisible();
    await page.getByLabel('Your answer', { exact: true }).fill('idk');
    await page.getByRole('button', { name: 'Get feedback', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Let’s try a little more' })).toBeVisible();
    const answer = "Amina's well ran low in the dry season. She needs to find out about testing the water.";
    await page.getByLabel('Your answer', { exact: true }).fill(answer);
    await page.reload();
    await expect(page.getByLabel('Your answer', { exact: true })).toHaveValue(answer);
    await page.getByRole('button', { name: 'Get feedback', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Activity completed', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Activity completed', exact: true })).toBeVisible();
    await width('activity');
    await page.getByRole('link', { name: 'See my next steps' }).click();
    await expect(page.getByText('Understanding check: 3/3 correct')).toBeVisible();
    await expect(page.getByText('Activity: Completed', { exact: true })).toBeVisible();
    await expect(page.getByText('Guide questions asked: 2', { exact: true })).toBeVisible();
    await page.getByRole('checkbox').check();
    await page.getByRole('radio', { name: 'Maybe', exact: true }).check();
    await page.reload();
    await expect(page.getByRole('checkbox')).toBeChecked();
    await expect(page.getByRole('radio', { name: 'Maybe', exact: true })).toBeChecked();
    await expect(page.getByText('Demo: reminders are not sent in this prototype')).toBeVisible();
    await expect(page.getByText(/Hi! Last week you looked/)).toBeVisible();
    await width('next');
    await page.getByRole('link', { name: 'Fish Farming Basics', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Continue where you left off' })).toHaveAttribute('href', '/next');
    await page.getByRole('link', { name: 'Continue where you left off' }).click();
    await page.getByRole('link', { name: 'Start over', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Continue where you left off' })).toHaveCount(0);
    await expect(page.getByRole('radio', { name: "I'm just curious about fish farming" })).not.toBeChecked();
    expect(errors).toEqual([]);
    console.log('PASS: 375px full mock flow, all three activity paths, all page reloads, sources, cited/unsupported guide, hints, idk retry, saved draft/feedback, 3/3 score, reminder, return choice, resume/reset; no horizontal overflow, browser errors or external requests.');
  } catch (error) {
    await page.screenshot({ path: 'test-results/phase-04/failure.png', fullPage: true });
    console.log(await page.locator('summary').evaluateAll(elements => elements.filter(element => element.textContent.includes('See an example')).map(element => ({
      html: element.parentElement.outerHTML,
      parent: element.parentElement.parentElement.outerHTML.slice(0, 450),
    }))));
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
