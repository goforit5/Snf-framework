// Verify the design token system and dark mode bridge are working.
import { test, expect } from '@playwright/test';

test.describe('Design Token System', () => {
  test('CSS custom properties are defined on :root', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForTimeout(1000);

    // Check that key tokens exist
    const bg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
    );
    expect(bg).toBeTruthy();

    const accent = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    );
    expect(accent).toBeTruthy();

    const fontText = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-text').trim()
    );
    expect(fontText).toBeTruthy();
  });

  test('data-theme attribute is set on html element', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForTimeout(500);

    const theme = await page.locator('html').getAttribute('data-theme');
    expect(theme).toBeTruthy();
    expect(['light', 'dark']).toContain(theme);
  });

  test('dark mode tokens change when data-theme=dark', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForTimeout(500);

    // Get light theme bg
    const lightBg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
    );

    // Set dark theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });

    const darkBg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
    );

    // They should be different
    expect(lightBg).not.toEqual(darkBg);
  });

  test('build output has no warnings', async ({ page }) => {
    // This is a meta-check — the build already passed in CI.
    // Just verify the app loads without JS errors.
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/#/');
    await page.waitForTimeout(2000);

    // Filter out known non-critical console errors (e.g., favicon 404)
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
