import { Page } from '@playwright/test';

/**
 * Reusable helper function to login
 */
export async function doLogin(page: Page, credentials: { email: string; password: string }) {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Wait for navigation to complete
  await page.waitForLoadState('networkidle');
}

/**
 * Test user credentials
 */
export const TEST_USERS = {
  ACTOR: { email: 'jesly@gmail.com', password: 'jesly123' },
  PRODUCER: { email: 'tonyjoyjp@gmail.com', password: 'tony123' },
  ADMIN: { email: 'admin@actory.com', password: 'admin123' }
};
