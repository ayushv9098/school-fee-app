import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  const email = 'e2e-test-user@example.com';
  const password = 'e2e-test-password123';

  // Go to login page
  await page.goto('/login');

  // Fill email and password
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();

  // Wait to see if we navigate to dashboard or get an error
  try {
    // Wait for either the dashboard to load or an error message to appear
    await Promise.race([
      page.waitForURL('**/dashboard'),
      page.getByText('Invalid login credentials').waitFor(),
      page.getByText('Invalid email or password').waitFor()
    ]);
  } catch (e) {
    // Timeout
  }

  // If we are still on login page and see an error, we need to sign up
  if (page.url().includes('/login')) {
    console.log('User not found, attempting signup...');
    // Switch to signup mode
    await page.getByText("Don't have an account? Sign Up").click();
    
    // Fill signup form
    await page.getByLabel('Full Name').fill('E2E Test User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    
    // Submit signup
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    // Wait for navigation
    await page.waitForURL('**/dashboard');
  }

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
