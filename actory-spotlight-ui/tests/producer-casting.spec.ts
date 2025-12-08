import { test, expect, Page } from '@playwright/test';

const PRODUCER_CREDENTIALS = {
  email: 'tonyjoyjp@gmail.com',
  password: 'tony123',
  role: 'Producer',
  name: 'Test Producer',
  companyName: 'Test Production Company',
  phone: '1234567890',
  location: 'Test City'
};

async function loginUser(page: Page, creds: any) {
  const response = await page.request.post('http://localhost:5000/api/v1/auth/login', {
    data: {
      email: creds.email,
      password: creds.password
    }
  });
  
  if (response.status() === 200) {
    const result = await response.json();
    return result.token;
  }
  return null;
}

test.describe('Producer Casting Creation UI', () => {
  test('producer can create new casting call', async ({ page }) => {
    console.log('🎬 Testing Producer Casting Creation UI');
    
    // Login as producer
    const token = await loginUser(page, PRODUCER_CREDENTIALS);
    expect(token).toBeTruthy();
    
    // Set token in localStorage for the page
    await page.goto('http://localhost:8080');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, token);
    
    // Navigate to casting creation page
    await page.goto('http://localhost:8080/casting/new');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify casting creation form is visible
    await expect(page.locator('h1, h2').filter({ hasText: /create|new|casting/i })).toBeVisible();
    
    // Fill in casting details
    await page.fill('input[name="roleTitle"]', 'Test Role for Feature Film');
    await page.fill('textarea[name="description"]', 
      'We are looking for a talented actor for a leading role in our upcoming feature film. This is a paid position with great exposure.');
    
    // Set location
    await page.fill('input[name="location"]', 'Los Angeles');
    
    // Set project details
    await page.fill('input[name="projectName"]', 'Summer Dreams Feature Film');
    await page.fill('input[name="productionCompany"]', PRODUCER_CREDENTIALS.companyName);
    
    // Set audition details
    await page.fill('input[name="auditionDate"]', '2024-11-25');
    await page.fill('input[name="auditionLocation"]', 'Los Angeles Studio');
    
    // Set shoot dates
    await page.fill('input[name="shootStartDate"]', '2024-11-26');
    await page.fill('input[name="shootEndDate"]', '2024-11-30');
    
    // Set compensation
    await page.selectOption('select[name="compensationType"]', 'Paid');
    await page.fill('input[name="salary"]', '500');
    
    // Add requirements
    await page.fill('textarea[name="requirements"]', 
      'Must have previous acting experience. Available for full-day shoot. Must be 18+ years old.');
    
    // Set application deadline
    await page.fill('input[name="submissionDeadline"]', '2024-11-24');
    
    // Upload script or sides (if upload button exists)
    const uploadButton = page.locator('input[type="file"]');
    if (await uploadButton.isVisible()) {
      // Note: In real test, you would upload an actual file
      console.log('Upload button found, skipping file upload in test');
    }
    
    // Submit the form
    await page.click('button[type="submit"], button:has-text("Create"), button:has-text("Publish")');
    
    // Wait for submission to complete
    await page.waitForTimeout(2000);
    
    // Verify success - either redirect to casting details or success message
    const successMessage = page.locator('.success, .alert-success, [role="alert"]').filter({ hasText: /created|published|success/i });
    const castingTitle = page.locator('h1, h2').filter({ hasText: 'Test Role for Feature Film' });
    
    if (await successMessage.isVisible()) {
      console.log('✓ Casting created successfully - success message visible');
      await expect(successMessage).toBeVisible();
    } else if (await castingTitle.isVisible()) {
      console.log('✓ Casting created successfully - redirected to casting details');
      await expect(castingTitle).toBeVisible();
    } else {
      // Check if we're on casting list page with new casting
      await page.goto('http://localhost:8080/casting');
      await page.waitForLoadState('networkidle');
      const newCasting = page.locator('text=Test Role for Feature Film');
      await expect(newCasting).toBeVisible();
      console.log('✓ Casting created successfully - found in casting list');
    }
    
    // Take screenshot for documentation
    await page.screenshot({ path: 'test-results/producer-casting-created.png', fullPage: true });
  });

  test('producer can view and manage their castings', async ({ page }) => {
    console.log('📋 Testing Producer Casting Management UI');
    
    // Login as producer
    const token = await loginUser(page, PRODUCER_CREDENTIALS);
    expect(token).toBeTruthy();
    
    // Set token and navigate
    await page.goto('http://localhost:8080');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, token);
    
    // Go to producer's casting dashboard
    await page.goto('http://localhost:8080/dashboard/producer');
    await page.waitForLoadState('networkidle');
    
    // Verify casting list is visible
    await expect(page.locator('h1, h2').filter({ hasText: /my|casting|manage/i })).toBeVisible();
    
    // Check for casting cards/list items
    const castingItems = page.locator('.casting-card, .casting-item, [data-testid="casting-item"]');
    const itemCount = await castingItems.count();
    
    if (itemCount > 0) {
      console.log(`✓ Found ${itemCount} casting(s) for producer`);
      
      // Click on first casting to view details
      await castingItems.first().click();
      await page.waitForLoadState('networkidle');
      
      // Verify casting details page
      await expect(page.locator('h1, h2').first()).toBeVisible();
      
      // Check for application management section
      const applicationsSection = page.locator('text=Applications, .applications, [data-testid="applications"]');
      if (await applicationsSection.isVisible()) {
        console.log('✓ Applications section visible');
        
        // Check for actor applications
        const applicationItems = page.locator('.application-card, .actor-application');
        const appCount = await applicationItems.count();
        console.log(`✓ Found ${appCount} application(s) for this casting`);
      }
      
      // Test editing functionality
      const editButton = page.locator('button:has-text("Edit"), button:has-text("Update"), [data-testid="edit-casting"]');
      if (await editButton.isVisible()) {
        console.log('✓ Edit button found');
        // Note: We won't actually edit in this test to avoid modifying data
      }
      
      // Test status management
      const statusButtons = page.locator('button:has-text("Close"), button:has-text("Cancel"), button:has-text("Archive")');
      if (await statusButtons.isVisible()) {
        console.log('✓ Status management buttons found');
      }
    } else {
      console.log('ℹ️ No castings found - producer dashboard is empty');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/producer-casting-management.png', fullPage: true });
  });

  test('producer can review actor applications', async ({ page }) => {
    console.log('👥 Testing Producer Application Review UI');
    
    // Login as producer
    const token = await loginUser(page, PRODUCER_CREDENTIALS);
    expect(token).toBeTruthy();
    
    // Set token and navigate
    await page.goto('http://localhost:8080');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, token);
    
    // Go to applications page
    await page.goto('http://localhost:8080/dashboard/producer');
    await page.waitForLoadState('networkidle');
    
    // Verify applications page
    await expect(page.locator('h1, h2').filter({ hasText: /applications|actor/i })).toBeVisible();
    
    // Look for application items
    const applicationItems = page.locator('.application-item, .actor-card, [data-testid="application"]');
    const appCount = await applicationItems.count();
    
    if (appCount > 0) {
      console.log(`✓ Found ${appCount} application(s) to review`);
      
      // Click on first application
      await applicationItems.first().click();
      await page.waitForLoadState('networkidle');
      
      // Verify application details
      await expect(page.locator('h1, h2').first()).toBeVisible();
      
      // Check for actor information
      const actorInfo = page.locator('.actor-info, .profile-info');
      if (await actorInfo.isVisible()) {
        console.log('✓ Actor information visible');
      }
      
      // Check for video/portfolio
      const videoSection = page.locator('video, .video-player, .portfolio-video');
      if (await videoSection.isVisible()) {
        console.log('✓ Actor video/portfolio visible');
      }
      
      // Check for action buttons
      const actionButtons = page.locator('button:has-text("Accept"), button:has-text("Reject"), button:has-text("Schedule")');
      if (await actionButtons.isVisible()) {
        console.log('✓ Action buttons (Accept/Reject/Schedule) available');
      }
      
      // Check for messaging/contact
      const messageSection = page.locator('.message-section, .contact-actor, button:has-text("Message")');
      if (await messageSection.isVisible()) {
        console.log('✓ Messaging/contact options available');
      }
    } else {
      console.log('ℹ️ No applications found to review');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/producer-application-review.png', fullPage: true });
  });
});
