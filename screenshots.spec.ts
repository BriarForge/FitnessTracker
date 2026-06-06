import { test, expect } from '@playwright/test';

test('dashboard shows timezone', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshots/dashboard-after.png', fullPage: true });
  
  // Check that timezone is displayed above exercises
  const timezoneText = await page.locator('text=Timezone:').textContent();
  console.log('Timezone label found:', timezoneText);
  expect(timezoneText).toBeTruthy();
  expect(timezoneText).toContain('Timezone:');
});

test('settings shows timezone picker', async ({ page }) => {
  await page.goto('http://localhost:3000/settings');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshots/settings-after.png', fullPage: true });
  
  // Check that timezone picker is visible
  const timezoneSelect = await page.locator('select[name="timezone"]');
  expect(timezoneSelect).toBeTruthy();
  expect(await timezoneSelect.isVisible()).toBe(true);
  
  // Check that timezone options include Australia/Perth
  const options = await page.locator('select[name="timezone"] option').allTextContents();
  console.log('Timezone options:', options);
  expect(options).toContain('Australia/Perth');
  expect(options).toContain('America/New_York');
  expect(options).toContain('Europe/London');
});
