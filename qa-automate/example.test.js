const { test, expect } = require('@playwright/test');

test('should load dashboard and click add button', async ({ page }) => {
  test.setTimeout(0); // Disable timeout

  await page.goto('https://a4472cc35549.ngrok-free.app/dashboard');

  // Click add button
  await page.click('button:has-text("add"), button:has-text("Add"), button:has-text("ADD")');

  // Keep browser open after test
  await page.waitForTimeout(999999999);
});
