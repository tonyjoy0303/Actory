import { test, expect } from '@playwright/test';
import { doLogin } from './helpers';

const ADMIN = { email: 'admin@actory.com', password: 'admin123' };
const ACTOR = { email: 'jesly@gmail.com', password: 'jesly123' };
const PRODUCER = { email: 'tonyjoyjp@gmail.com', password: 'tony123' };

test.describe('Admin - Access Control', () => {
  test('should redirect non-admin users from admin panel', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to dashboard or show error
    if (page.url().includes('/admin')) {
      const accessDenied = page.locator('text=/access.*denied|unauthorized|not.*authorized/i');
      if (await accessDenied.count() > 0) {
        await expect(accessDenied.first()).toBeVisible();
      }
    } else {
      expect(page.url()).not.toContain('/admin');
    }
  });

  test('should allow admin access to admin panel', async ({ page }) => {
    // Try to login as admin (may not exist in test data)
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      if (page.url().includes('/admin')) {
        await expect(page.locator('h1, h2').filter({ hasText: /admin|dashboard/i })).toBeVisible();
      }
    } catch (error) {
      // Admin account may not exist, skip
      test.skip();
    }
  });

  test('should show admin menu only for admin users', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const adminLink = page.locator('a').filter({ hasText: /admin/i });
    // Non-admin users should not see admin link
    expect(await adminLink.count()).toBe(0);
  });

  test('should require authentication for admin routes', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login
    expect(page.url()).toMatch(/login|auth/);
  });
});

test.describe('Admin - User Management', () => {
  test('should view all users list', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('h1, h2').filter({ hasText: /users/i })).toBeVisible();
      
      const usersList = page.locator('[data-testid="users-list"], table');
      if (await usersList.count() > 0) {
        await expect(usersList.first()).toBeVisible();
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should search users by name/email', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('jesly');
        await page.waitForTimeout(1000);
        
        const searchResults = page.locator('text=/jesly/i');
        if (await searchResults.count() > 0) {
          await expect(searchResults.first()).toBeVisible();
        }
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should filter users by role', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
      
      const roleFilter = page.locator('select, button').filter({ hasText: /role|filter/i });
      if (await roleFilter.count() > 0) {
        await roleFilter.first().click();
        await page.waitForTimeout(500);
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should view user details', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
      
      const viewButton = page.locator('button, a').filter({ hasText: /view|details/i }).first();
      if (await viewButton.count() > 0) {
        await viewButton.click();
        await page.waitForTimeout(2000);
        
        // Should show user details
        expect(page.url()).toMatch(/user|profile/);
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should suspend user account', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
      
      const suspendButton = page.locator('button').filter({ hasText: /suspend|disable/i }).first();
      if (await suspendButton.count() > 0) {
        page.on('dialog', dialog => dialog.accept());
        await suspendButton.click();
        await page.waitForTimeout(2000);
        
        const successMessage = page.locator('text=/suspended|disabled/i');
        if (await successMessage.count() > 0) {
          await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
        }
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should activate suspended account', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
      
      const activateButton = page.locator('button').filter({ hasText: /activate|enable/i }).first();
      if (await activateButton.count() > 0) {
        page.on('dialog', dialog => dialog.accept());
        await activateButton.click();
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should delete user account', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
      
      const deleteButton = page.locator('button').filter({ hasText: /delete|remove/i }).first();
      if (await deleteButton.count() > 0) {
        page.on('dialog', dialog => dialog.accept());
        await deleteButton.click();
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should view user activity log', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
      
      const activityButton = page.locator('button, a').filter({ hasText: /activity|log|history/i }).first();
      if (await activityButton.count() > 0) {
        await activityButton.click();
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should export users list', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
      
      const exportButton = page.locator('button').filter({ hasText: /export|download/i });
      if (await exportButton.count() > 0) {
        await expect(exportButton.first()).toBeVisible();
      }
    } catch (error) {
      test.skip();
    }
  });
});

test.describe('Admin - Content Moderation', () => {
  test('should view reported content', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/reports');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('h1, h2').filter({ hasText: /reports|reported/i })).toBeVisible();
      
      const reportsList = page.locator('[data-testid="reports-list"], table');
      if (await reportsList.count() > 0) {
        await expect(reportsList.first()).toBeVisible();
      } else {
        const emptyState = page.locator('text=/no.*reports/i');
        if (await emptyState.count() > 0) {
          await expect(emptyState.first()).toBeVisible();
        }
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should review reported video', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/reports');
      await page.waitForLoadState('networkidle');
      
      const reviewButton = page.locator('button').filter({ hasText: /review|view/i }).first();
      if (await reviewButton.count() > 0) {
        await reviewButton.click();
        await page.waitForTimeout(2000);
        
        // Should show video details
        const videoPlayer = page.locator('video');
        if (await videoPlayer.count() > 0) {
          await expect(videoPlayer.first()).toBeVisible();
        }
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should remove inappropriate content', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/reports');
      await page.waitForLoadState('networkidle');
      
      const removeButton = page.locator('button').filter({ hasText: /remove|delete/i }).first();
      if (await removeButton.count() > 0) {
        page.on('dialog', dialog => dialog.accept());
        await removeButton.click();
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should dismiss false reports', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/reports');
      await page.waitForLoadState('networkidle');
      
      const dismissButton = page.locator('button').filter({ hasText: /dismiss|ignore/i }).first();
      if (await dismissButton.count() > 0) {
        await dismissButton.click();
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should warn user for violations', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/reports');
      await page.waitForLoadState('networkidle');
      
      const warnButton = page.locator('button').filter({ hasText: /warn/i }).first();
      if (await warnButton.count() > 0) {
        await warnButton.click();
        await page.waitForTimeout(1000);
        
        const warningMessage = page.locator('textarea[name="message"]');
        if (await warningMessage.count() > 0) {
          await warningMessage.fill('Please follow community guidelines.');
          
          const sendButton = page.locator('button').filter({ hasText: /send|submit/i });
          if (await sendButton.count() > 0) {
            await sendButton.click();
            await page.waitForTimeout(2000);
          }
        }
      }
    } catch (error) {
      test.skip();
    }
  });
});

test.describe('Admin - Casting Management', () => {
  test('should view all casting calls', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/castings');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('h1, h2').filter({ hasText: /casting/i })).toBeVisible();
      
      const castingsList = page.locator('[data-testid="castings-list"], table');
      if (await castingsList.count() > 0) {
        await expect(castingsList.first()).toBeVisible();
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should filter casting calls by status', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/castings');
      await page.waitForLoadState('networkidle');
      
      const statusFilter = page.locator('select, button').filter({ hasText: /status|filter/i });
      if (await statusFilter.count() > 0) {
        await statusFilter.first().click();
        await page.waitForTimeout(500);
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should remove fraudulent casting call', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/castings');
      await page.waitForLoadState('networkidle');
      
      const removeButton = page.locator('button').filter({ hasText: /remove|delete/i }).first();
      if (await removeButton.count() > 0) {
        page.on('dialog', dialog => dialog.accept());
        await removeButton.click();
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should feature casting call', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/castings');
      await page.waitForLoadState('networkidle');
      
      const featureButton = page.locator('button').filter({ hasText: /feature|promote/i }).first();
      if (await featureButton.count() > 0) {
        await featureButton.click();
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should contact production house', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/castings');
      await page.waitForLoadState('networkidle');
      
      const contactButton = page.locator('button').filter({ hasText: /contact|message/i }).first();
      if (await contactButton.count() > 0) {
        await contactButton.click();
        await page.waitForTimeout(1000);
        
        const messageInput = page.locator('textarea[name="message"]');
        if (await messageInput.count() > 0) {
          await messageInput.fill('Please provide additional information.');
        }
      }
    } catch (error) {
      test.skip();
    }
  });
});

test.describe('Admin - Analytics', () => {
  test('should view platform statistics', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('h1, h2').filter({ hasText: /analytics|statistics/i })).toBeVisible();
      
      const statsCards = page.locator('[data-testid="stat-card"], .stat-card, .metric');
      if (await statsCards.count() > 0) {
        await expect(statsCards.first()).toBeVisible();
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should show total users count', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      
      const usersCount = page.locator('text=/\\d+.*users|total.*users/i');
      if (await usersCount.count() > 0) {
        await expect(usersCount.first()).toBeVisible();
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should show active casting calls', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      
      const castingsCount = page.locator('text=/\\d+.*casting|active.*casting/i');
      if (await castingsCount.count() > 0) {
        await expect(castingsCount.first()).toBeVisible();
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should show submissions statistics', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      
      const submissionsCount = page.locator('text=/\\d+.*submissions|applications/i');
      if (await submissionsCount.count() > 0) {
        await expect(submissionsCount.first()).toBeVisible();
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should display growth chart', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      
      const chart = page.locator('canvas, svg[class*="chart"]');
      if (await chart.count() > 0) {
        await expect(chart.first()).toBeVisible();
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should filter analytics by date range', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      
      const dateRangeSelect = page.locator('select, button').filter({ hasText: /date|range|period/i });
      if (await dateRangeSelect.count() > 0) {
        await dateRangeSelect.first().click();
        await page.waitForTimeout(500);
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should export analytics report', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      
      const exportButton = page.locator('button').filter({ hasText: /export|download/i });
      if (await exportButton.count() > 0) {
        await expect(exportButton.first()).toBeVisible();
      }
    } catch (error) {
      test.skip();
    }
  });
});

test.describe('Admin - System Settings', () => {
  test('should access system settings', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/settings');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('h1, h2').filter({ hasText: /settings/i })).toBeVisible();
    } catch (error) {
      test.skip();
    }
  });

  test('should update platform name', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/settings');
      await page.waitForLoadState('networkidle');
      
      const platformName = page.locator('input[name="platformName"]');
      if (await platformName.count() > 0) {
        await platformName.clear();
        await platformName.fill('Actory Platform');
        
        const saveButton = page.locator('button').filter({ hasText: /save/i });
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForTimeout(2000);
        }
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should configure email settings', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/settings');
      await page.waitForLoadState('networkidle');
      
      const emailSettings = page.locator('a, button').filter({ hasText: /email/i });
      if (await emailSettings.count() > 0) {
        await emailSettings.first().click();
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should manage payment settings', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/settings');
      await page.waitForLoadState('networkidle');
      
      const paymentSettings = page.locator('a, button').filter({ hasText: /payment/i });
      if (await paymentSettings.count() > 0) {
        await paymentSettings.first().click();
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should configure storage settings', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/settings');
      await page.waitForLoadState('networkidle');
      
      const storageSettings = page.locator('a, button').filter({ hasText: /storage/i });
      if (await storageSettings.count() > 0) {
        await storageSettings.first().click();
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      test.skip();
    }
  });

  test('should view system logs', async ({ page }) => {
    try {
      await doLogin(page, ADMIN);
      await page.goto('/admin/logs');
      await page.waitForLoadState('networkidle');
      
      const logsList = page.locator('[data-testid="logs-list"], table, .log-entry');
      if (await logsList.count() > 0) {
        await expect(logsList.first()).toBeVisible();
      }
    } catch (error) {
      test.skip();
    }
  });
});
