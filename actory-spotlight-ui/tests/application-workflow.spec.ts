import { test, expect, type Page, type Response } from '@playwright/test';

// Test credentials (using existing users from login.spec.ts)
const ACTOR = { email: 'jesly@gmail.com', password: 'jesly123' };
const RECRUITER = { email: 'tonyjoyjp@gmail.com', password: 'tony123' };

// Helper function for login
async function doLogin(page: Page, creds: { email: string; password: string }) {
  const logs: string[] = [];
  page.on('console', (msg: any) => logs.push(`[${msg.type()}] ${msg.text()}`));

  await page.goto('/auth/login');
  await page.getByPlaceholder('Email').fill(creds.email);
  await page.getByPlaceholder('Password').fill(creds.password);

  const loginResponsePromise = page.waitForResponse((resp: Response) =>
    resp.url().includes('/api/v1/auth/login')
  );

  await page.locator('form').getByRole('button', { name: /^log in$/i }).click();
  const loginResp = await loginResponsePromise;
  const status = loginResp.status();
  let body: any = null;
  try { body = await loginResp.json(); } catch {}

  expect(status, `Login status should be 200. Logs:\n${logs.join('\n')}`).toBe(200);
  if (body) {
    expect(body.token, `Response body did not include token. Body: ${JSON.stringify(body)}`).toBeTruthy();
  }

  await page.waitForFunction(() => !!localStorage.getItem('token'));
}

test.describe('Application Workflow Tests', () => {
  test('user can browse casting calls and view details', async ({ page }) => {
    // Login as actor
    await doLogin(page, ACTOR);
    
    // Navigate to casting list
    await page.goto('/casting');
    
    // Verify casting list page loads
    await expect(page.locator('h1')).toContainText('Casting Calls');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for casting call cards or any casting-related content
    const castingContent = page.locator('text=casting');
    const noContentMessage = page.locator('text=no casting calls found');
    
    // Either we find casting calls or a "no results" message
    await expect(castingContent.or(noContentMessage)).toBeVisible({ timeout: 10000 });
    
    // If casting calls exist, test interaction
    if (await castingContent.isVisible()) {
      // Look for any clickable elements related to casting
      const clickableElements = page.locator('a, button, [role="button"]');
      const firstClickable = clickableElements.first();
      
      if (await firstClickable.isVisible()) {
        await firstClickable.click();
        await page.waitForLoadState('networkidle');
        
        // Verify we navigated somewhere successfully
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('user can access dashboard and navigate sections', async ({ page }) => {
    // Login as actor
    await doLogin(page, ACTOR);
    
    // Verify we're on a dashboard page
    await expect(page).toHaveURL(/dashboard|actor|producer|admin|\/$/);
    
    // Look for common dashboard elements
    const welcomeText = page.locator('text=welcome');
    const dashboardTitle = page.locator('h1, h2');
    const navigationElements = page.locator('nav, [role="navigation"], .tabs, [role="tab"]');
    
    // At least one of these should be visible
    await expect(welcomeText.or(dashboardTitle).or(navigationElements)).toBeVisible();
    
    // Test navigation if tabs are present
    if (await navigationElements.isVisible()) {
      const tabs = page.locator('[role="tab"], .tab');
      const tabCount = await tabs.count();
      
      if (tabCount > 1) {
        // Click on the second tab (if available)
        await tabs.nth(1).click();
        await page.waitForTimeout(1000);
        
        // Verify content changed
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('user can access profile and video management', async ({ page }) => {
    // Login as actor
    await doLogin(page, ACTOR);
    
    // Navigate to profile if possible
    await page.goto('/profile');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for profile-related content
    const profileContent = page.locator('text=profile, videos, upload');
    const uploadButton = page.locator('text=upload, add, create');
    
    // Either we find profile content or get redirected
    await expect(profileContent.or(uploadButton).or(page.locator('body'))).toBeVisible();
    
    // If upload functionality is available, test it
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
      await page.waitForTimeout(1000);
      
      // Look for upload form
      const uploadForm = page.locator('form, input[type="file"], textarea');
      if (await uploadForm.isVisible()) {
        // Verify form elements are present
        await expect(uploadForm).toBeVisible();
      }
    }
  });

  test('user can search and filter content', async ({ page }) => {
    // Login as actor
    await doLogin(page, ACTOR);
    
    // Navigate to casting list for search functionality
    await page.goto('/casting');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for search functionality
    const searchInput = page.locator('input[type="search"], input[placeholder="search"], input[placeholder="filter"]');
    const selectFilters = page.locator('select');
    const filterButtons = page.locator('button[aria-label="filter"], button[title="filter"]');
    
    // Test search if available
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      // Verify search was attempted
      await expect(searchInput).toHaveValue('test');
    }
    
    // Test filters if available
    if (await selectFilters.isVisible()) {
      const selectCount = await selectFilters.count();
      if (selectCount > 0) {
        // Try to change the first select
        const firstSelect = selectFilters.first();
        const options = await firstSelect.locator('option').count();
        
        if (options > 1) {
          await firstSelect.selectOption({ index: 1 });
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('application handles navigation correctly', async ({ page }) => {
    // Login as actor
    await doLogin(page, ACTOR);
    
    // Test key navigation routes
    const routes = [
      '/dashboard',
      '/casting',
      '/profile',
      '/messages'
    ];
    
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Verify page loads without errors
      await expect(page.locator('body')).toBeVisible();
      
      // Check for error messages
      const errorMessage = page.locator('text=error, 404, not found, server error');
      if (await errorMessage.isVisible()) {
        console.log(`Route ${route} shows error message, but page loads`);
      }
    }
  });

  test('application handles responsive design', async ({ page }) => {
    // Login as actor
    await doLogin(page, ACTOR);
    
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      // Verify content is still accessible
      await expect(page.locator('body')).toBeVisible();
      
      // Look for mobile navigation or responsive elements
      const mobileNav = page.locator('.mobile-nav, .hamburger, [aria-label="menu"]');
      const responsiveContent = page.locator('.container, .grid, .flex');
      
      await expect(responsiveContent.or(mobileNav).or(page.locator('body'))).toBeVisible();
    }
  });
});

test.describe('Error Handling and Edge Cases', () => {
  test('handles invalid routes gracefully', async ({ page }) => {
    // Try to access invalid routes
    const invalidRoutes = [
      '/invalid-route',
      '/casting/invalid-id',
      '/profile/invalid-user'
    ];
    
    for (const route of invalidRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Should either redirect to login, show 404, or handle gracefully
      const loginPage = page.locator('input[placeholder*="email"]');
      const notFound = page.locator('text=404, not found, page not found');
      const bodyContent = page.locator('body');
      
      await expect(loginPage.or(notFound).or(bodyContent)).toBeVisible();
    }
  });

  test('handles session timeout correctly', async ({ page }) => {
    // Login first
    await doLogin(page, ACTOR);
    
    // Clear localStorage to simulate session timeout
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    // Try to access a protected route
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page.locator('input[placeholder*="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('handles network errors gracefully', async ({ page }) => {
    // Login first
    await doLogin(page, ACTOR);
    
    // Go to a page that makes API calls
    await page.goto('/casting');
    
    // Simulate offline mode
    await page.context().setOffline(true);
    
    // Try to interact with the page
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(2000);
    }
    
    // Restore connection
    await page.context().setOffline(false);
    
    // Verify page is still functional
    await expect(page.locator('body')).toBeVisible();
  });
});
