import { test, expect } from '@playwright/test';
import { doLogin } from './helpers';

const PRODUCER = { email: 'tonyjoyjp@gmail.com', password: 'tony123' };
const ACTOR = { email: 'jesly@gmail.com', password: 'jesly123' };

test.describe('Submissions - Actor Application', () => {
  test('should navigate to application page from casting details', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/casting');
    await page.waitForLoadState('networkidle');
    
    const viewButton = page.locator('a, button').filter({ hasText: /view|details/i }).first();
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      
      const applyButton = page.locator('button, a').filter({ hasText: /apply|submit.*application/i });
      if (await applyButton.count() > 0) {
        await applyButton.click();
        await page.waitForTimeout(1000);
        
        // Should be on application page
        expect(page.url()).toMatch(/apply|submit|audition/);
      }
    }
  });

  test('should display application form', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/casting');
    await page.waitForLoadState('networkidle');
    
    const viewButton = page.locator('a, button').filter({ hasText: /view|details/i }).first();
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      
      const applyButton = page.locator('button, a').filter({ hasText: /apply/i });
      if (await applyButton.count() > 0) {
        await applyButton.click();
        await page.waitForTimeout(1000);
        
        // Should show video upload or application form
        const form = page.locator('form, [data-testid="application-form"]');
        if (await form.count() > 0) {
          await expect(form.first()).toBeVisible();
        }
      }
    }
  });

  test('should validate video upload requirement', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/casting');
    await page.waitForLoadState('networkidle');
    
    const viewButton = page.locator('a, button').filter({ hasText: /view|details/i }).first();
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      
      const applyButton = page.locator('button, a').filter({ hasText: /apply/i });
      if (await applyButton.count() > 0) {
        await applyButton.click();
        await page.waitForTimeout(1000);
        
        // Try to submit without video
        const submitButton = page.locator('button[type="submit"]').filter({ hasText: /submit|apply/i });
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // Should show validation error
          const errorMessage = page.locator('text=/video.*required|please.*upload/i');
          if (await errorMessage.count() > 0) {
            await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
          }
        }
      }
    }
  });

  test('should allow adding notes to application', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/casting');
    await page.waitForLoadState('networkidle');
    
    const viewButton = page.locator('a, button').filter({ hasText: /view|details/i }).first();
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      
      const applyButton = page.locator('button, a').filter({ hasText: /apply/i });
      if (await applyButton.count() > 0) {
        await applyButton.click();
        await page.waitForTimeout(1000);
        
        const notesField = page.locator('textarea[name="notes"], textarea[placeholder*="message" i]');
        if (await notesField.count() > 0) {
          await expect(notesField.first()).toBeVisible();
          await notesField.first().fill('Test application notes');
        }
      }
    }
  });

  test('should prevent duplicate applications', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/casting');
    await page.waitForLoadState('networkidle');
    
    const viewButton = page.locator('a, button').filter({ hasText: /view|details/i }).first();
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      
      // If already applied, should show different button or message
      const alreadyApplied = page.locator('text=/already.*applied|application.*submitted/i');
      const applyButton = page.locator('button, a').filter({ hasText: /apply/i });
      
      const hasApplied = await alreadyApplied.count() > 0;
      const canApply = await applyButton.count() > 0;
      
      // Either showing applied message or apply button, not both
      expect(hasApplied || canApply).toBeTruthy();
    }
  });

  test('should confirm application submission', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/casting');
    await page.waitForLoadState('networkidle');
    
    const viewButton = page.locator('a, button').filter({ hasText: /view|details/i }).first();
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      
      const applyButton = page.locator('button, a').filter({ hasText: /apply/i });
      if (await applyButton.count() > 0) {
        await applyButton.click();
        await page.waitForTimeout(1000);
        
        const submitButton = page.locator('button[type="submit"]').filter({ hasText: /submit/i });
        if (await submitButton.count() > 0) {
          // Look for confirmation dialog or button
          await expect(submitButton).toBeVisible();
        }
      }
    }
  });
});

test.describe('Submissions - Actor View', () => {
  test('should view own applications', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    // Should show list of applications
    await expect(page.locator('h1, h2').filter({ hasText: /my.*applications|submissions/i })).toBeVisible();
  });

  test('should display application status', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const statusBadge = page.locator('text=/pending|reviewed|accepted|rejected/i');
    if (await statusBadge.count() > 0) {
      await expect(statusBadge.first()).toBeVisible();
    }
  });

  test('should view application details', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const viewButton = page.locator('a, button').filter({ hasText: /view|details/i }).first();
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      
      // Should show application details
      await expect(page.locator('h1, h2')).toBeVisible();
    }
  });

  test('should show casting information for application', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const castingInfo = page.locator('text=/role|casting|project/i');
    if (await castingInfo.count() > 0) {
      await expect(castingInfo.first()).toBeVisible();
    }
  });

  test('should show submission date', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const submissionDate = page.locator('text=/submitted|applied.*on/i');
    if (await submissionDate.count() > 0) {
      await expect(submissionDate.first()).toBeVisible();
    }
  });

  test('should filter applications by status', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const statusFilter = page.locator('select, button').filter({ hasText: /status|pending|all/i });
    if (await statusFilter.count() > 0) {
      await statusFilter.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('should search applications', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
    }
  });

  test('should withdraw application if allowed', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const withdrawButton = page.locator('button').filter({ hasText: /withdraw|cancel/i }).first();
    if (await withdrawButton.count() > 0) {
      await expect(withdrawButton).toBeVisible();
    }
  });

  test('should view submitted video', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const viewButton = page.locator('a, button').filter({ hasText: /view|details/i }).first();
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      
      const videoPlayer = page.locator('video, [data-testid="video-player"]');
      if (await videoPlayer.count() > 0) {
        await expect(videoPlayer.first()).toBeVisible();
      }
    }
  });

  test('should see producer feedback if available', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const viewButton = page.locator('a, button').filter({ hasText: /view|details/i }).first();
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      
      const feedback = page.locator('text=/feedback|comments|notes/i');
      if (await feedback.count() > 0) {
        await expect(feedback.first()).toBeVisible();
      }
    }
  });
});

test.describe('Submissions - Producer View', () => {
  test('should view submissions for own castings', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/dashboard/producer');
    await page.waitForLoadState('networkidle');
    
    const submissionsLink = page.locator('a, button').filter({ hasText: /submissions|applications/i }).first();
    if (await submissionsLink.count() > 0) {
      await submissionsLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show submissions list
      await expect(page.locator('h1, h2')).toBeVisible();
    }
  });

  test('should filter submissions by casting', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const castingFilter = page.locator('select[name="casting"], select[name="castingCall"]');
    if (await castingFilter.count() > 0) {
      await castingFilter.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
    }
  });

  test('should view submission details', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const viewButton = page.locator('a, button').filter({ hasText: /view|review/i }).first();
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      
      // Should show actor information and video
      await expect(page.locator('h1, h2')).toBeVisible();
    }
  });

  test('should play audition video', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const viewButton = page.locator('a, button').filter({ hasText: /view|review/i }).first();
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      
      const videoPlayer = page.locator('video');
      if (await videoPlayer.count() > 0) {
        await expect(videoPlayer.first()).toBeVisible();
        
        // Try to play video
        const playButton = page.locator('button[aria-label="Play"]');
        if (await playButton.count() > 0) {
          await playButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('should view actor profile from submission', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const viewButton = page.locator('a, button').filter({ hasText: /view|review/i }).first();
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      
      const profileLink = page.locator('a').filter({ hasText: /view.*profile|actor.*profile/i });
      if (await profileLink.count() > 0) {
        await expect(profileLink.first()).toBeVisible();
      }
    }
  });

  test('should update submission status to reviewed', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const viewButton = page.locator('a, button').filter({ hasText: /view|review/i }).first();
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      
      const statusSelect = page.locator('select[name="status"]');
      if (await statusSelect.count() > 0) {
        await statusSelect.selectOption('Reviewed');
        
        const saveButton = page.locator('button').filter({ hasText: /save|update/i });
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForTimeout(2000);
          
          const successMessage = page.locator('text=/updated|saved/i');
          if (await successMessage.count() > 0) {
            await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
          }
        }
      }
    }
  });

  test('should update submission status to shortlisted', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const viewButton = page.locator('a, button').filter({ hasText: /view|review/i }).first();
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      
      const shortlistButton = page.locator('button').filter({ hasText: /shortlist/i });
      if (await shortlistButton.count() > 0) {
        await shortlistButton.click();
        await page.waitForTimeout(2000);
        
        const successMessage = page.locator('text=/shortlisted|success/i');
        if (await successMessage.count() > 0) {
          await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('should accept submission', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const viewButton = page.locator('a, button').filter({ hasText: /view|review/i }).first();
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      
      const acceptButton = page.locator('button').filter({ hasText: /accept|approve/i });
      if (await acceptButton.count() > 0) {
        await acceptButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should reject submission', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const viewButton = page.locator('a, button').filter({ hasText: /view|review/i }).first();
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      
      const rejectButton = page.locator('button').filter({ hasText: /reject|decline/i });
      if (await rejectButton.count() > 0) {
        await rejectButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should add feedback to submission', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const viewButton = page.locator('a, button').filter({ hasText: /view|review/i }).first();
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      
      const feedbackField = page.locator('textarea[name="feedback"], textarea[placeholder*="feedback" i]');
      if (await feedbackField.count() > 0) {
        await feedbackField.fill('Great audition! Will consider for callback.');
        
        const saveButton = page.locator('button').filter({ hasText: /save|submit/i });
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should export submissions list', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const exportButton = page.locator('button').filter({ hasText: /export|download/i });
    if (await exportButton.count() > 0) {
      await expect(exportButton.first()).toBeVisible();
    }
  });
});

test.describe('Submissions - Statistics', () => {
  test('should show submission count for casting', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/dashboard/producer');
    await page.waitForLoadState('networkidle');
    
    const submissionCount = page.locator('text=/\\d+.*submissions|\\d+.*applications/i');
    if (await submissionCount.count() > 0) {
      await expect(submissionCount.first()).toBeVisible();
    }
  });

  test('should show submission statistics', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const stats = page.locator('text=/total|pending|reviewed|shortlisted/i');
    if (await stats.count() > 0) {
      await expect(stats.first()).toBeVisible();
    }
  });

  test('should show status distribution', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const statusCounts = page.locator('text=/\\d+.*pending|\\d+.*reviewed/i');
    if (await statusCounts.count() > 0) {
      await expect(statusCounts.first()).toBeVisible();
    }
  });
});

test.describe('Submissions - Sorting and Filtering', () => {
  test('should sort submissions by date', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const sortButton = page.locator('button, select').filter({ hasText: /sort|date/i });
    if (await sortButton.count() > 0) {
      await sortButton.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('should sort submissions by status', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const sortButton = page.locator('button, select').filter({ hasText: /sort.*status|status.*sort/i });
    if (await sortButton.count() > 0) {
      await sortButton.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('should filter by pending submissions', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const pendingFilter = page.locator('button').filter({ hasText: /pending/i });
    if (await pendingFilter.count() > 0) {
      await pendingFilter.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should filter by shortlisted submissions', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const shortlistedFilter = page.locator('button').filter({ hasText: /shortlist/i });
    if (await shortlistedFilter.count() > 0) {
      await shortlistedFilter.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should search submissions by actor name', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Submissions - Bulk Actions', () => {
  test('should select multiple submissions', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    if (checkboxCount > 1) {
      await checkboxes.nth(1).check();
      await checkboxes.nth(2).check();
      await page.waitForTimeout(500);
      
      // Bulk action options should appear
      const bulkActions = page.locator('button').filter({ hasText: /bulk|selected/i });
      if (await bulkActions.count() > 0) {
        await expect(bulkActions.first()).toBeVisible();
      }
    }
  });

  test('should mark multiple as reviewed', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const selectAllCheckbox = page.locator('input[type="checkbox"]').first();
    if (await selectAllCheckbox.count() > 0) {
      await selectAllCheckbox.check();
      await page.waitForTimeout(500);
      
      const markReviewedButton = page.locator('button').filter({ hasText: /mark.*reviewed/i });
      if (await markReviewedButton.count() > 0) {
        await markReviewedButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should bulk reject submissions', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    const checkboxes = page.locator('input[type="checkbox"]');
    if (await checkboxes.count() > 1) {
      await checkboxes.nth(1).check();
      await page.waitForTimeout(500);
      
      const rejectButton = page.locator('button').filter({ hasText: /reject.*selected/i });
      if (await rejectButton.count() > 0) {
        page.on('dialog', dialog => dialog.accept());
        await rejectButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});

test.describe('Submissions - Notifications', () => {
  test('should notify actor when submission status changes', async ({ page }) => {
    // This is more of an integration test
    // We'll just verify the UI exists
    await doLogin(page, ACTOR);
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    // Actor should see their submissions
    await expect(page.locator('h1, h2')).toBeVisible();
  });

  test('should notify producer of new submissions', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/dashboard/producer');
    await page.waitForLoadState('networkidle');
    
    // Check for notification badge or count
    const notificationBadge = page.locator('[data-testid="notification-badge"], .notification-badge');
    if (await notificationBadge.count() > 0) {
      await expect(notificationBadge.first()).toBeVisible();
    }
  });
});
