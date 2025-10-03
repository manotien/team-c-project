const { test, expect } = require('@playwright/test');

test('should load the homepage', async ({ page }) => {
  await page.goto('https://www.google.com/');
  await expect(page).toHaveTitle(/Google/);

  // Type "tqm ประกัน" in the search box
  await page.fill('textarea[name="q"]', 'tqm ประกัน');

  // Press Enter to search
  await page.press('textarea[name="q"]', 'Enter');

  // Wait for search results and click the first result
  await page.waitForSelector('h3');
  await page.click('h3');
});
