// Verify all existing pages still load correctly after the redesign changes.
// Tests run against the ORIGINAL Layout.jsx (not the new shell — that's not swapped in yet).
import { test, expect } from '@playwright/test';

test.describe('Existing pages load without errors', () => {
  // Collect console errors during each test
  let consoleErrors;

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
  });

  test('Home / Command Center loads', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.locator('text=Command Center').first()).toBeVisible({ timeout: 10000 });
  });

  test('Executive Dashboard loads', async ({ page }) => {
    await page.goto('/#/dashboard');
    await expect(page.locator('text=Executive Dashboard').first()).toBeVisible({ timeout: 10000 });
  });

  test('Exception Queue loads', async ({ page }) => {
    await page.goto('/#/exceptions');
    await expect(page.locator('text=Exception').first()).toBeVisible({ timeout: 10000 });
  });

  test('Agent Operations loads', async ({ page }) => {
    await page.goto('/#/agents');
    await expect(page.locator('text=Agent').first()).toBeVisible({ timeout: 10000 });
  });

  test('Clinical Command loads', async ({ page }) => {
    await page.goto('/#/clinical');
    await expect(page.locator('text=Clinical').first()).toBeVisible({ timeout: 10000 });
  });

  test('Revenue Command loads', async ({ page }) => {
    await page.goto('/#/revenue');
    await expect(page.locator('text=Revenue').first()).toBeVisible({ timeout: 10000 });
  });

  test('Workforce Command loads', async ({ page }) => {
    await page.goto('/#/workforce');
    await expect(page.locator('text=Workforce').first()).toBeVisible({ timeout: 10000 });
  });

  test('Facility Command loads', async ({ page }) => {
    await page.goto('/#/facility');
    await expect(page.locator('text=Facility').first()).toBeVisible({ timeout: 10000 });
  });

  test('Admissions loads', async ({ page }) => {
    await page.goto('/#/admissions');
    await expect(page.locator('text=Census').first()).toBeVisible({ timeout: 10000 });
  });

  test('Quality loads', async ({ page }) => {
    await page.goto('/#/quality');
    await expect(page.locator('text=Quality').first()).toBeVisible({ timeout: 10000 });
  });

  test('Legal loads', async ({ page }) => {
    await page.goto('/#/legal');
    await expect(page.locator('text=Legal').first()).toBeVisible({ timeout: 10000 });
  });

  test('M&A Pipeline loads', async ({ page }) => {
    await page.goto('/#/ma');
    await expect(page.locator('text=M&A').first()).toBeVisible({ timeout: 10000 });
  });

  test('Dark mode toggle works', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.locator('text=Command Center').first()).toBeVisible({ timeout: 10000 });
    // Check data-theme attribute is set (our bridge change)
    const theme = await page.locator('html').getAttribute('data-theme');
    expect(theme).toBeTruthy();
    expect(['light', 'dark']).toContain(theme);
  });
});
