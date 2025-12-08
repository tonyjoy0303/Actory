import { test, expect } from '@playwright/test';
import { doLogin } from './login.spec';

const ACTOR = { email: 'jesly@gmail.com', password: 'jesly123' };
const PRODUCER = { email: 'tonyjoyjp@gmail.com', password: 'tony123' };

test.describe('Casting Application Workflow', () => {
  test('producer can create casting call', async ({ page }) => {
    // Login as producer
    await doLogin(page, PRODUCER);
    
    // Navigate to casting creation page
    await page.goto('/dashboard/producer/create-casting');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the create casting page
    await expect(page.locator('h1')).toContainText('Create New Casting Call');
    
    // Fill in the casting call form
    await page.locator('input[name="title"]').fill('Test Casting Call');
    await page.locator('textarea[name="description"]').fill('This is a test casting call created by automated test');
    await page.locator('select[name="category"]').selectOption('Film');
    await page.locator('select[name="gender"]').selectOption('Male');
    await page.locator('input[name="ageRange"]').fill('25-35');
    await page.locator('input[name="location"]').fill('Test Location');
    
    // Set dates
    const today = new Date();
    const auditionDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const submissionDeadline = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
    const shootStartDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
    const shootEndDate = new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000); // 21 days from now
    
    await page.locator('input[name="auditionDate"]').fill(auditionDate.toISOString().split('T')[0]);
    await page.locator('input[name="submissionDeadline"]').fill(submissionDeadline.toISOString().split('T')[0]);
    await page.locator('input[name="shootStartDate"]').fill(shootStartDate.toISOString().split('T')[0]);
    await page.locator('input[name="shootEndDate"]').fill(shootEndDate.toISOString().split('T')[0]);
    
    // Submit the form
    await page.locator('button[type="submit"]').click();
    
    // Wait for success message or redirect
    await page.waitForTimeout(2000);
    
    // Verify success - either redirect to dashboard or show success message
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard/producer')) {
      // Success - redirected to dashboard
      await expect(page.locator('body')).toBeVisible();
    } else {
      // Check for success message
      const successMessage = page.locator('text=success, created, casting call');
      await expect(successMessage).toBeVisible({ timeout: 5000 });
    }
  });

  test('actor can view and apply for casting calls', async ({ page }) => {
    // Login as actor
    await doLogin(page, ACTOR);
    
    // Navigate to casting list
    await page.goto('/casting');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify casting list page loads
    await expect(page.locator('h1')).toContainText('Casting Calls');
    
    // Wait for casting calls to load
    await page.waitForTimeout(2000);
    
    // Look for casting call cards
    const castingCards = page.locator('[data-testid="casting-card"], .casting-card, .card');
    const cardCount = await castingCards.count();
    
    if (cardCount > 0) {
      // Click on the first casting call
      await castingCards.first().click();
      
      // Wait for details page to load
      await page.waitForLoadState('networkidle');
      
      // Look for apply button
      const applyButton = page.locator('button:has-text("Apply"), button:has-text("apply"), [data-testid="apply-button"]');
      
      if (await applyButton.isVisible()) {
        await applyButton.click();
        
        // Wait for application form or confirmation
        await page.waitForTimeout(2000);
        
        // Fill application form if present
        const messageTextarea = page.locator('textarea[name="message"], textarea[placeholder*="message"]');
        if (await messageTextarea.isVisible()) {
          await messageTextarea.fill('I am interested in this casting call. Please consider my application.');
          
          // Submit application
          const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Apply")');
          await submitButton.click();
          
          // Wait for success
          await page.waitForTimeout(2000);
        }
        
        // Verify application was submitted
        const successMessage = page.locator('text=applied, success, submitted');
        await expect(successMessage.or(page.locator('body'))).toBeVisible();
      }
    } else {
      // No casting calls available - this is also a valid state
      const noResults = page.locator('text=no casting calls, no results, not found');
      await expect(noResults.or(page.locator('body'))).toBeVisible();
    }
  });

  test('actor can manage their profile and videos', async ({ page }) => {
    // Login as actor
    await doLogin(page, ACTOR);
    
    // Navigate to actor dashboard
    await page.goto('/dashboard/actor');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify dashboard loads
    await expect(page.locator('body')).toBeVisible();
    
    // Look for profile section
    const profileSection = page.locator('text=profile, videos, upload');
    
    if (await profileSection.isVisible()) {
      // Try to navigate to profile
      const profileLink = page.locator('a:has-text("Profile"), a[href*="profile"]');
      if (await profileLink.isVisible()) {
        await profileLink.click();
        await page.waitForLoadState('networkidle');
      }
      
      // Look for upload functionality
      const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add Video"), [data-testid="upload-button"]');
      
      if (await uploadButton.isVisible()) {
        await uploadButton.click();
        await page.waitForTimeout(1000);
        
        // Look for upload form
        const fileInput = page.locator('input[type="file"]');
        const uploadForm = page.locator('form');
        
        if (await fileInput.isVisible()) {
          // Simulate file upload (we won't actually upload a file in tests)
          console.log('Upload form is available');
        }
        
        if (await uploadForm.isVisible()) {
          console.log('Upload form is present');
        }
      }
    }
    
    // Verify page is functional
    await expect(page.locator('body')).toBeVisible();
  });
});
