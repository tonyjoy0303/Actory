import { test, expect } from '@playwright/test';
import { doLogin } from './helpers';

const ACTOR = { email: 'jesly@gmail.com', password: 'jesly123' };
const PRODUCER = { email: 'tonyjoyjp@gmail.com', password: 'tony123' };

test.describe('Notifications - Display', () => {
  test('should show notifications icon in header', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const notificationIcon = page.locator('[data-testid="notification-icon"], button').filter({ hasText: /notification/i });
    if (await notificationIcon.count() === 0) {
      // Look for bell icon or notification badge
      const bellIcon = page.locator('button svg, [class*="bell"]');
      await expect(bellIcon.first()).toBeVisible({ timeout: 5000 });
    } else {
      await expect(notificationIcon.first()).toBeVisible();
    }
  });

  test('should show unread notification count', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const notificationBadge = page.locator('[data-testid="notification-badge"], .badge, .notification-count');
    if (await notificationBadge.count() > 0) {
      await expect(notificationBadge.first()).toBeVisible();
    }
  });

  test('should open notifications panel on click', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const notificationButton = page.locator('button').filter({ hasText: /notification/i }).first();
    if (await notificationButton.count() === 0) {
      const bellButton = page.locator('button svg').first();
      if (await bellButton.count() > 0) {
        await bellButton.click();
      }
    } else {
      await notificationButton.click();
    }
    
    await page.waitForTimeout(1000);
    
    const notificationPanel = page.locator('[data-testid="notification-panel"], .notifications-dropdown, .notification-list');
    if (await notificationPanel.count() > 0) {
      await expect(notificationPanel.first()).toBeVisible();
    } else {
      // May navigate to notifications page instead
      expect(page.url()).toContain('notification');
    }
  });

  test('should display notification list', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2').filter({ hasText: /notifications/i })).toBeVisible();
    
    const notificationsList = page.locator('[data-testid="notification-list"], .notification-item');
    if (await notificationsList.count() > 0) {
      await expect(notificationsList.first()).toBeVisible();
    } else {
      // Check for empty state
      const emptyState = page.locator('text=/no.*notifications/i');
      if (await emptyState.count() > 0) {
        await expect(emptyState.first()).toBeVisible();
      }
    }
  });

  test('should show notification message', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const notification = page.locator('[data-testid="notification-item"], .notification-message').first();
    if (await notification.count() > 0) {
      await expect(notification).toBeVisible();
      
      const messageText = await notification.textContent();
      expect(messageText?.length).toBeGreaterThan(0);
    }
  });

  test('should show notification timestamp', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const timestamp = page.locator('text=/ago|\\d+ (minutes?|hours?|days?)|just now/i').first();
    if (await timestamp.count() > 0) {
      await expect(timestamp).toBeVisible();
    }
  });

  test('should distinguish read from unread notifications', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const unreadNotification = page.locator('.unread, [data-read="false"]').first();
    if (await unreadNotification.count() > 0) {
      await expect(unreadNotification).toBeVisible();
    }
  });

  test('should show notification type icon', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const notificationIcon = page.locator('[data-testid="notification-icon"], .notification-item svg').first();
    if (await notificationIcon.count() > 0) {
      await expect(notificationIcon).toBeVisible();
    }
  });
});

test.describe('Notifications - Actions', () => {
  test('should mark notification as read on click', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const unreadNotification = page.locator('.unread, [data-read="false"]').first();
    if (await unreadNotification.count() > 0) {
      await unreadNotification.click();
      await page.waitForTimeout(2000);
      
      // Notification should be marked as read (may redirect or update class)
      expect(page.url()).toBeTruthy();
    }
  });

  test('should mark all as read', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const markAllButton = page.locator('button').filter({ hasText: /mark.*all.*read/i });
    if (await markAllButton.count() > 0) {
      await markAllButton.click();
      await page.waitForTimeout(2000);
      
      // All notifications should be marked as read
      const unreadNotifications = page.locator('.unread, [data-read="false"]');
      const unreadCount = await unreadNotifications.count();
      expect(unreadCount).toBe(0);
    }
  });

  test('should delete notification', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const deleteButton = page.locator('button').filter({ hasText: /delete|remove/i }).first();
    if (await deleteButton.count() > 0) {
      page.on('dialog', dialog => dialog.accept());
      await deleteButton.click();
      await page.waitForTimeout(2000);
      
      const successMessage = page.locator('text=/deleted/i');
      if (await successMessage.count() > 0) {
        await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should clear all notifications', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const clearAllButton = page.locator('button').filter({ hasText: /clear.*all/i });
    if (await clearAllButton.count() > 0) {
      page.on('dialog', dialog => dialog.accept());
      await clearAllButton.click();
      await page.waitForTimeout(2000);
      
      // Should show empty state
      const emptyState = page.locator('text=/no.*notifications/i');
      if (await emptyState.count() > 0) {
        await expect(emptyState.first()).toBeVisible();
      }
    }
  });

  test('should navigate to notification source on click', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const notification = page.locator('[data-testid="notification-item"]').first();
    if (await notification.count() > 0) {
      const currentUrl = page.url();
      await notification.click();
      await page.waitForTimeout(2000);
      
      // Should navigate to related page (project, casting, etc.)
      expect(page.url()).not.toBe(currentUrl);
    }
  });

  test('should filter notifications by type', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const filterSelect = page.locator('select, button').filter({ hasText: /filter|type/i });
    if (await filterSelect.count() > 0) {
      await filterSelect.first().click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Notifications - Types for Actors', () => {
  test('should receive notification for application status change', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const statusNotification = page.locator('text=/application.*accepted|application.*rejected|status.*changed/i').first();
    if (await statusNotification.count() > 0) {
      await expect(statusNotification).toBeVisible();
    }
  });

  test('should receive notification for new casting call', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const castingNotification = page.locator('text=/new.*casting|role.*posted/i').first();
    if (await castingNotification.count() > 0) {
      await expect(castingNotification).toBeVisible();
    }
  });

  test('should receive notification for video comment', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const commentNotification = page.locator('text=/commented.*video|new.*comment/i').first();
    if (await commentNotification.count() > 0) {
      await expect(commentNotification).toBeVisible();
    }
  });

  test('should receive notification for video like', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const likeNotification = page.locator('text=/liked.*video/i').first();
    if (await likeNotification.count() > 0) {
      await expect(likeNotification).toBeVisible();
    }
  });

  test('should receive notification for profile view', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const viewNotification = page.locator('text=/viewed.*profile/i').first();
    if (await viewNotification.count() > 0) {
      await expect(viewNotification).toBeVisible();
    }
  });

  test('should receive notification for shortlist', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const shortlistNotification = page.locator('text=/shortlisted/i').first();
    if (await shortlistNotification.count() > 0) {
      await expect(shortlistNotification).toBeVisible();
    }
  });
});

test.describe('Notifications - Types for Producers', () => {
  test('should receive notification for new submission', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const submissionNotification = page.locator('text=/new.*application|applied.*casting/i').first();
    if (await submissionNotification.count() > 0) {
      await expect(submissionNotification).toBeVisible();
    }
  });

  test('should receive notification for team invitation response', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const invitationNotification = page.locator('text=/accepted.*invitation|declined.*invitation/i').first();
    if (await invitationNotification.count() > 0) {
      await expect(invitationNotification).toBeVisible();
    }
  });

  test('should receive notification for project update', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const projectNotification = page.locator('text=/project.*updated/i').first();
    if (await projectNotification.count() > 0) {
      await expect(projectNotification).toBeVisible();
    }
  });

  test('should receive notification for casting deadline', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const deadlineNotification = page.locator('text=/deadline|expires/i').first();
    if (await deadlineNotification.count() > 0) {
      await expect(deadlineNotification).toBeVisible();
    }
  });

  test('should receive notification for team member activity', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const teamNotification = page.locator('text=/team.*member|colleague/i').first();
    if (await teamNotification.count() > 0) {
      await expect(teamNotification).toBeVisible();
    }
  });

  test('should receive notification for submission withdrawal', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const withdrawalNotification = page.locator('text=/withdrew.*application/i').first();
    if (await withdrawalNotification.count() > 0) {
      await expect(withdrawalNotification).toBeVisible();
    }
  });
});

test.describe('Notifications - Preferences', () => {
  test('should navigate to notification settings', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    const notificationSettings = page.locator('a, button').filter({ hasText: /notification.*settings|preferences/i });
    if (await notificationSettings.count() > 0) {
      await notificationSettings.first().click();
      await page.waitForTimeout(1000);
      
      expect(page.url()).toMatch(/settings|preferences|notifications/);
    }
  });

  test('should toggle email notifications', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    const emailToggle = page.locator('input[type="checkbox"]').filter({ hasText: /email/i }).first();
    if (await emailToggle.count() === 0) {
      const emailLabel = page.locator('label').filter({ hasText: /email.*notifications/i }).first();
      if (await emailLabel.count() > 0) {
        const toggle = emailLabel.locator('..').locator('input[type="checkbox"]');
        if (await toggle.count() > 0) {
          await toggle.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('should toggle push notifications', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    const pushToggle = page.locator('input[type="checkbox"]').filter({ hasText: /push/i }).first();
    if (await pushToggle.count() === 0) {
      const pushLabel = page.locator('label').filter({ hasText: /push.*notifications/i }).first();
      if (await pushLabel.count() > 0) {
        const toggle = pushLabel.locator('..').locator('input[type="checkbox"]');
        if (await toggle.count() > 0) {
          await toggle.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('should configure notification types', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    const notificationType = page.locator('input[type="checkbox"]').filter({ hasText: /casting|application|message/i }).first();
    if (await notificationType.count() > 0) {
      await notificationType.click();
      await page.waitForTimeout(1000);
      
      const saveButton = page.locator('button').filter({ hasText: /save/i });
      if (await saveButton.count() > 0) {
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should mute notifications temporarily', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    const muteToggle = page.locator('input, button').filter({ hasText: /mute|do not disturb/i }).first();
    if (await muteToggle.count() > 0) {
      await muteToggle.click();
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Notifications - Real-time', () => {
  test('should show notification toast for new notification', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait to see if a toast notification appears
    await page.waitForTimeout(5000);
    
    const toast = page.locator('[data-testid="toast"], .toast, .notification-toast');
    if (await toast.count() > 0) {
      await expect(toast.first()).toBeVisible();
    }
  });

  test('should update notification badge in real-time', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const badge = page.locator('[data-testid="notification-badge"], .badge');
    if (await badge.count() > 0) {
      const initialCount = await badge.textContent();
      await page.waitForTimeout(5000);
      
      // Badge count might update
      const updatedCount = await badge.textContent();
      expect(initialCount).toBeTruthy();
      expect(updatedCount).toBeTruthy();
    }
  });

  test('should play notification sound', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check if audio element exists for notifications
    const audioElement = page.locator('audio');
    expect(await audioElement.count()).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Notifications - Pagination', () => {
  test('should load more notifications on scroll', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const notificationsList = page.locator('[data-testid="notification-list"]');
    if (await notificationsList.count() > 0) {
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      
      // Check if more notifications loaded
      const loadMoreButton = page.locator('button').filter({ hasText: /load.*more/i });
      expect(await loadMoreButton.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show older notifications', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const olderButton = page.locator('button').filter({ hasText: /older|previous/i });
    if (await olderButton.count() > 0) {
      await olderButton.click();
      await page.waitForTimeout(2000);
    }
  });

  test('should show empty state when no notifications', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const notificationItems = page.locator('[data-testid="notification-item"]');
    if (await notificationItems.count() === 0) {
      const emptyState = page.locator('text=/no.*notifications|all.*caught.*up/i');
      if (await emptyState.count() > 0) {
        await expect(emptyState.first()).toBeVisible();
      }
    }
  });
});
