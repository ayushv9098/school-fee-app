import { test, expect } from '@playwright/test';

test.describe('E2E Page Smoke Tests', () => {

  test('Dashboard page loads', async ({ page }) => {
    await page.goto('/dashboard');
    // Ensure we actually landed on dashboard (meaning auth works)
    await expect(page).toHaveURL(/.*\/dashboard/);
    // Basic check for heading or content to ensure it didn't crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('Students page loads', async ({ page }) => {
    await page.goto('/students');
    await expect(page).toHaveURL(/.*\/students/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Attendance page loads', async ({ page }) => {
    await page.goto('/attendance');
    await expect(page).toHaveURL(/.*\/attendance/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Payments page loads', async ({ page }) => {
    await page.goto('/payments');
    await expect(page).toHaveURL(/.*\/payments/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Expenses page loads', async ({ page }) => {
    await page.goto('/expenses');
    await expect(page).toHaveURL(/.*\/expenses/);
    await expect(page.locator('body')).toBeVisible();
  });

  // Adding basic check for the student attendance public/scanner routes
  test('Student attendance scanner page loads (unauthenticated check)', async ({ browser }) => {
    // Use a fresh context for unauthenticated pages if needed, though they should load regardless
    const context = await browser.newContext();
    const newPage = await context.newPage();
    await newPage.goto('/student-attendance');
    await expect(newPage.locator('body')).toBeVisible();
    await context.close();
  });

});
