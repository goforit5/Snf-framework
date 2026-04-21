// Verify all 5 new agent collaboration pages load and render correctly.
import { test, expect } from '@playwright/test';

test.describe('Agent Collaboration Pages', () => {
  test('Agent Directory loads and shows agents', async ({ page }) => {
    await page.goto('/#/agents/directory');
    await expect(page.locator('text=Agent Directory').first()).toBeVisible({ timeout: 10000 });
    // Should show domain groups with agent cards
    await expect(page.locator('text=Clinical').first()).toBeVisible();
  });

  test('Agent Inspector loads for a specific agent', async ({ page }) => {
    await page.goto('/#/agents/inspect/clinical-monitor');
    // Should show the agent name
    await expect(page.locator('text=Clinical Monitoring').first()).toBeVisible({ timeout: 10000 });
  });

  test('Agent Inspector handles unknown agent gracefully', async ({ page }) => {
    await page.goto('/#/agents/inspect/nonexistent');
    await expect(page.locator('text=not found').first()).toBeVisible({ timeout: 10000 });
  });

  test('Team Chat loads and shows threads', async ({ page }) => {
    await page.goto('/#/agents/flows');
    // Should show the agent chat header
    await expect(page.locator('text=Agent Chat').first()).toBeVisible({ timeout: 10000 });
  });

  test('Escalation Card loads', async ({ page }) => {
    await page.goto('/#/agents/escalation/ESC-001');
    // Should show the escalation title
    await expect(page.locator('text=Agent').first()).toBeVisible({ timeout: 10000 });
  });

  test('Policy Console loads and shows policies', async ({ page }) => {
    await page.goto('/#/agents/policies');
    await expect(page.locator('text=Policy Console').first()).toBeVisible({ timeout: 10000 });
    // Should show at least one policy ID
    await expect(page.locator('text=P-001').first()).toBeVisible();
  });

  test('Agent Ledger still loads at /agents', async ({ page }) => {
    await page.goto('/#/agents');
    await expect(page.locator('text=Agent').first()).toBeVisible({ timeout: 10000 });
  });

  test('Agent Ledger also loads at /agents/ledger', async ({ page }) => {
    await page.goto('/#/agents/ledger');
    await expect(page.locator('text=Agent').first()).toBeVisible({ timeout: 10000 });
  });
});
