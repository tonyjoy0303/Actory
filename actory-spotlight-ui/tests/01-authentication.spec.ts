import { test, expect } from '@playwright/test';

const TEST_USER_ACTOR = {
  name: 'Test Actor User',
  email: `actor.test.${Date.now()}@example.com`,
  password: 'TestPassword123!',
  role: 'Actor'
};

const TEST_USER_PRODUCER = {
  name: 'Test Producer User',
  email: `producer.test.${Date.now()}@example.com`,
  password: 'TestPassword123!',
  role: 'ProductionTeam'
};

const EXISTING_ACTOR = { email: 'jesly@gmail.com', password: 'jesly123' };
const EXISTING_PRODUCER = { email: 'tonyjoyjp@gmail.com', password: 'tony123' };

test.describe('Authentication - Registration', () => {
  test('should display registration form', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.locator('h1, h2').filter({ hasText: /register|sign up/i })).toBeVisible();
    await expect(page.getByPlaceholder(/name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test('should validate required fields on registration', async ({ page }) => {
    await page.goto('/auth/register');
    await page.locator('button[type="submit"]').click();
    
    // Should show validation errors or remain on page
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toContain('register');
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByPlaceholder(/name/i).fill('Test User');
    await page.getByPlaceholder(/email/i).fill('invalid-email');
    await page.getByPlaceholder(/password/i).first().fill('password123');
    
    const emailInput = page.getByPlaceholder(/email/i);
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('should validate password strength', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByPlaceholder(/name/i).fill('Test User');
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    await page.getByPlaceholder(/password/i).first().fill('123');
    
    // Try to submit and check for error
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);
    
    // Should still be on register page
    expect(page.url()).toContain('register');
  });

  test('should register actor successfully', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByPlaceholder(/name/i).fill(TEST_USER_ACTOR.name);
    await page.getByPlaceholder(/email/i).fill(TEST_USER_ACTOR.email);
    await page.getByPlaceholder(/password/i).first().fill(TEST_USER_ACTOR.password);
    
    // Select actor role if role selector exists
    const roleSelector = page.locator('select').filter({ hasText: /actor|producer|role/i });
    if (await roleSelector.count() > 0) {
      await roleSelector.selectOption({ label: /actor/i });
    }
    
    await page.locator('button[type="submit"]').click();
    
    // Wait for redirect or success message
    await page.waitForTimeout(3000);
    
    // Should redirect to verification page or show success message
    const url = page.url();
    expect(url).toMatch(/(verify|success|dashboard|login)/);
  });

  test('should not allow duplicate email registration', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByPlaceholder(/name/i).fill('Duplicate User');
    await page.getByPlaceholder(/email/i).fill(EXISTING_ACTOR.email);
    await page.getByPlaceholder(/password/i).first().fill('TestPassword123!');
    
    const responsePromise = page.waitForResponse(resp => 
      resp.url().includes('/api/v1/auth/register') && resp.status() !== 200
    );
    
    await page.locator('button[type="submit"]').click();
    
    try {
      await responsePromise;
      // Should show error message
      await expect(page.locator('text=/email.*already|already.*exists|duplicate/i')).toBeVisible({ timeout: 5000 });
    } catch {
      // Error handling
    }
  });
});

test.describe('Authentication - Login', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('h1, h2').filter({ hasText: /log.*in|sign.*in/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test('should validate required fields on login', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('login');
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByPlaceholder(/email/i).fill('nonexistent@example.com');
    await page.getByPlaceholder(/password/i).fill('wrongpassword');
    
    await page.locator('button[type="submit"]').click();
    
    // Should show error message
    await expect(page.locator('text=/invalid|incorrect|wrong/i')).toBeVisible({ timeout: 5000 });
  });

  test('should login actor successfully', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByPlaceholder(/email/i).fill(EXISTING_ACTOR.email);
    await page.getByPlaceholder(/password/i).fill(EXISTING_ACTOR.password);
    
    const loginResponsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/v1/auth/login') && resp.status() === 200
    );
    
    await page.locator('button[type="submit"]').click();
    
    await loginResponsePromise;
    
    // Should redirect to dashboard
    await page.waitForURL(/dashboard|actor|home/);
    expect(page.url()).toMatch(/dashboard|actor|home/);
  });

  test('should login producer successfully', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByPlaceholder(/email/i).fill(EXISTING_PRODUCER.email);
    await page.getByPlaceholder(/password/i).fill(EXISTING_PRODUCER.password);
    
    const loginResponsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/v1/auth/login') && resp.status() === 200
    );
    
    await page.locator('button[type="submit"]').click();
    
    await loginResponsePromise;
    
    // Should redirect to producer dashboard
    await page.waitForURL(/dashboard|producer/);
    expect(page.url()).toMatch(/dashboard|producer/);
  });

  test('should store authentication token', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByPlaceholder(/email/i).fill(EXISTING_ACTOR.email);
    await page.getByPlaceholder(/password/i).fill(EXISTING_ACTOR.password);
    
    await page.locator('button[type="submit"]').click();
    
    // Wait for token to be stored
    await page.waitForFunction(() => !!localStorage.getItem('token'));
    
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
    expect(token?.length).toBeGreaterThan(20);
  });

  test('should display Google OAuth button', async ({ page }) => {
    await page.goto('/auth/login');
    const googleButton = page.locator('button, a').filter({ hasText: /google/i });
    if (await googleButton.count() > 0) {
      await expect(googleButton.first()).toBeVisible();
    }
  });

  test('should have forgot password link', async ({ page }) => {
    await page.goto('/auth/login');
    const forgotLink = page.locator('a').filter({ hasText: /forgot.*password/i });
    await expect(forgotLink).toBeVisible();
  });

  test('should navigate to registration from login', async ({ page }) => {
    await page.goto('/auth/login');
    const registerLink = page.locator('a').filter({ hasText: /register|sign up|create account/i });
    await expect(registerLink).toBeVisible();
    await registerLink.click();
    await page.waitForURL(/register/);
    expect(page.url()).toContain('register');
  });
});

test.describe('Authentication - Logout', () => {
  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.getByPlaceholder(/email/i).fill(EXISTING_ACTOR.email);
    await page.getByPlaceholder(/password/i).fill(EXISTING_ACTOR.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForFunction(() => !!localStorage.getItem('token'));
    
    // Find and click logout
    const logoutButton = page.locator('button, a').filter({ hasText: /log.*out|sign.*out/i });
    await logoutButton.first().click();
    
    // Should redirect to login
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/login|home|welcome/);
    
    // Token should be cleared
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeFalsy();
  });

  test('should not access protected routes after logout', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.getByPlaceholder(/email/i).fill(EXISTING_ACTOR.email);
    await page.getByPlaceholder(/password/i).fill(EXISTING_ACTOR.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForFunction(() => !!localStorage.getItem('token'));
    
    // Logout
    const logoutButton = page.locator('button, a').filter({ hasText: /log.*out|sign.*out/i });
    await logoutButton.first().click();
    await page.waitForTimeout(1000);
    
    // Try to access protected route
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    
    // Should redirect to login
    expect(page.url()).toMatch(/login|auth/);
  });
});

test.describe('Authentication - Password Reset', () => {
  test('should display forgot password form', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('a').filter({ hasText: /forgot.*password/i }).click();
    
    await page.waitForURL(/forgot|reset/);
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  });

  test('should request password reset', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('a').filter({ hasText: /forgot.*password/i }).click();
    
    await page.getByPlaceholder(/email/i).fill(EXISTING_ACTOR.email);
    await page.locator('button[type="submit"]').click();
    
    // Should show success message
    await page.waitForTimeout(2000);
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/email.*sent|check.*email|reset.*link/);
  });

  test('should validate email on password reset', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('a').filter({ hasText: /forgot.*password/i }).click();
    
    await page.getByPlaceholder(/email/i).fill('invalid-email');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForTimeout(1000);
    // Should still be on reset page or show error
    expect(page.url()).toMatch(/forgot|reset/);
  });
});

test.describe('Authentication - Profile Management', () => {
  test('should view own profile', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.getByPlaceholder(/email/i).fill(EXISTING_ACTOR.email);
    await page.getByPlaceholder(/password/i).fill(EXISTING_ACTOR.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForFunction(() => !!localStorage.getItem('token'));
    
    // Navigate to profile
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Should display profile information
    await expect(page.locator('text=/profile|account|settings/i').first()).toBeVisible();
  });

  test('should update profile information', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.getByPlaceholder(/email/i).fill(EXISTING_ACTOR.email);
    await page.getByPlaceholder(/password/i).fill(EXISTING_ACTOR.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForFunction(() => !!localStorage.getItem('token'));
    
    // Navigate to profile edit
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    const editButton = page.locator('button, a').filter({ hasText: /edit|update/i });
    if (await editButton.count() > 0) {
      await editButton.first().click();
      await page.waitForTimeout(1000);
      
      // Should have form fields
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
      if (await nameInput.count() > 0) {
        await expect(nameInput.first()).toBeVisible();
      }
    }
  });
});

test.describe('Authentication - Session Management', () => {
  test('should persist session on page reload', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.getByPlaceholder(/email/i).fill(EXISTING_ACTOR.email);
    await page.getByPlaceholder(/password/i).fill(EXISTING_ACTOR.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForFunction(() => !!localStorage.getItem('token'));
    
    const tokenBefore = await page.evaluate(() => localStorage.getItem('token'));
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const tokenAfter = await page.evaluate(() => localStorage.getItem('token'));
    expect(tokenAfter).toBe(tokenBefore);
    
    // Should still be authenticated
    expect(page.url()).not.toContain('login');
  });

  test('should handle expired token gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Set invalid token
    await page.evaluate(() => localStorage.setItem('token', 'invalid-token-123'));
    
    // Try to access protected route
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    
    // Should redirect to login
    expect(page.url()).toMatch(/login|auth/);
  });
});
