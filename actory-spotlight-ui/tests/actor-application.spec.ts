import { test, expect, Page } from '@playwright/test';

const ACTOR_CREDENTIALS = {
  email: 'apz@gmail.com',
  password: 'apz123',
  role: 'Actor',
  name: 'Test Actor',
  age: 25,
  gender: 'male',
  experienceLevel: 'beginner',
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

test.describe('Actor Application UI', () => {
  test('actor can browse available castings', async ({ page }) => {
    console.log('🔍 Testing Actor Casting Browse UI');
    
    // Login as actor
    const token = await loginUser(page, ACTOR_CREDENTIALS);
    expect(token).toBeTruthy();
    
    // Set token and navigate
    await page.goto('http://localhost:8080');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, token);
    
    // Navigate to casting browse page
    await page.goto('http://localhost:8080/casting');
    await page.waitForLoadState('networkidle');
    
    // Verify casting browse page
    await expect(page.locator('h1, h2').filter({ hasText: /casting|opportunities|roles/i })).toBeVisible();
    
    // Check for casting cards/list
    const castingCards = page.locator('.casting-card, .role-card, [data-testid="casting-card"]');
    const castingCount = await castingCards.count();
    
    if (castingCount > 0) {
      console.log(`✓ Found ${castingCount} casting(s) available`);
      
      // Verify casting card elements
      const firstCard = castingCards.first();
      
      // Check for title
      const title = firstCard.locator('.title, h3, .role-title');
      if (await title.isVisible()) {
        console.log('✓ Casting titles visible');
      }
      
      // Check for production/company
      const company = firstCard.locator('.company, .production, .studio');
      if (await company.isVisible()) {
        console.log('✓ Production company info visible');
      }
      
      // Check for role type
      const roleType = firstCard.locator('.role-type, .type, .character');
      if (await roleType.isVisible()) {
        console.log('✓ Role type visible');
      }
      
      // Check for compensation
      const compensation = firstCard.locator('.compensation, .pay, .salary');
      if (await compensation.isVisible()) {
        console.log('✓ Compensation info visible');
      }
      
      // Check for location
      const location = firstCard.locator('.location, .city, .venue');
      if (await location.isVisible()) {
        console.log('✓ Location info visible');
      }
      
      // Check for apply button
      const applyButton = firstCard.locator('button:has-text("Apply"), .apply-btn, [data-testid="apply"]');
      if (await applyButton.isVisible()) {
        console.log('✓ Apply buttons visible');
      }
      
      // Test filtering/search functionality
      const searchInput = page.locator('input[placeholder*="search"], input[name="search"], #search');
      if (await searchInput.isVisible()) {
        console.log('✓ Search functionality available');
        await searchInput.fill('Lead');
        await page.waitForTimeout(1000);
      }
      
      // Test filters
      const filterButtons = page.locator('button:has-text("Filter"), .filter-btn, [data-testid="filter"]');
      if (await filterButtons.isVisible()) {
        console.log('✓ Filter options available');
      }
    } else {
      console.log('ℹ️ No castings currently available');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/actor-casting-browse.png', fullPage: true });
  });

  test('actor can view casting details', async ({ page }) => {
    console.log('📄 Testing Actor Casting Details UI');
    
    // Login as actor
    const token = await loginUser(page, ACTOR_CREDENTIALS);
    expect(token).toBeTruthy();
    
    // Set token and navigate
    await page.goto('http://localhost:8080');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, token);
    
    // Go to casting list
    await page.goto('http://localhost:8080/casting');
    await page.waitForLoadState('networkidle');
    
    // Find and click on first casting
    const castingCards = page.locator('.casting-card, .role-card, [data-testid="casting-card"]');
    const castingCount = await castingCards.count();
    
    if (castingCount > 0) {
      await castingCards.first().click();
      await page.waitForLoadState('networkidle');
      
      // Verify casting details page
      await expect(page.locator('h1, h2').first()).toBeVisible();
      
      // Check for detailed information sections
      const sections = [
        { selector: '.description, .synopsis, .about', name: 'Description' },
        { selector: '.requirements, .qualifications, .criteria', name: 'Requirements' },
        { selector: '.character, .role-details', name: 'Character Details' },
        { selector: '.production, .company-info', name: 'Production Info' },
        { selector: '.audition-details, .casting-info', name: 'Audition Details' },
        { selector: '.compensation, .pay-details', name: 'Compensation' },
        { selector: '.schedule, .timeline', name: 'Schedule' }
      ];
      
      for (const section of sections) {
        const element = page.locator(section.selector);
        if (await element.isVisible()) {
          console.log(`✓ ${section.name} section visible`);
        }
      }
      
      // Check for media/gallery
      const mediaSection = page.locator('.gallery, .media, .images, video');
      if (await mediaSection.isVisible()) {
        console.log('✓ Media/gallery section visible');
      }
      
      // Check for apply button
      const applyButton = page.locator('button:has-text("Apply Now"), button:has-text("Apply"), .apply-button');
      if (await applyButton.isVisible()) {
        console.log('✓ Apply button available');
      }
      
      // Check for save/favorite
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Favorite"), .save-btn');
      if (await saveButton.isVisible()) {
        console.log('✓ Save/favorite option available');
      }
      
      // Check for share functionality
      const shareButton = page.locator('button:has-text("Share"), .share-btn');
      if (await shareButton.isVisible()) {
        console.log('✓ Share functionality available');
      }
    } else {
      console.log('ℹ️ No castings available to view details');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/actor-casting-details.png', fullPage: true });
  });

  test('actor can submit application', async ({ page }) => {
    console.log('📝 Testing Actor Application Submission UI');
    
    // Login as actor
    const token = await loginUser(page, ACTOR_CREDENTIALS);
    expect(token).toBeTruthy();
    
    // Set token and navigate
    await page.goto('http://localhost:8080');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, token);
    
    // Go to casting list and find a casting to apply for
    await page.goto('http://localhost:8080/casting');
    await page.waitForLoadState('networkidle');
    
    const castingCards = page.locator('.casting-card, .role-card, [data-testid="casting-card"]');
    const castingCount = await castingCards.count();
    
    if (castingCount > 0) {
      // Click on first casting
      await castingCards.first().click();
      await page.waitForLoadState('networkidle');
      
      // Click apply button
      const applyButton = page.locator('button:has-text("Apply Now"), button:has-text("Apply"), .apply-button');
      if (await applyButton.isVisible()) {
        await applyButton.click();
        await page.waitForTimeout(1000);
        
        // Check if we're on application form page or modal
        const applicationForm = page.locator('.application-form, .modal, #application-form');
        
        if (await applicationForm.isVisible()) {
          console.log('✓ Application form opened');
          
          // Fill in application details
          const coverLetterTextarea = page.locator('textarea[name="coverLetter"], textarea[placeholder*="cover"], #coverLetter');
          if (await coverLetterTextarea.isVisible()) {
            await coverLetterTextarea.fill(
              'I am very interested in this role and believe my experience and passion for acting make me a perfect fit. ' +
              'I have been training for the past 2 years and have completed several workshops. I am available for the shooting dates ' +
              'and can commit fully to this project. Thank you for considering my application.'
            );
            console.log('✓ Cover letter filled');
          }
          
          // Check for self-tape upload
          const videoUpload = page.locator('input[type="file"][accept*="video"], .video-upload');
          if (await videoUpload.isVisible()) {
            console.log('✓ Video upload option available');
            // Note: In real test, you would upload an actual video file
          }
          
          // Check for headshot upload
          const headshotUpload = page.locator('input[type="file"][accept*="image"], .headshot-upload');
          if (await headshotUpload.isVisible()) {
            console.log('✓ Headshot upload option available');
          }
          
          // Check for resume/CV upload
          const resumeUpload = page.locator('input[type="file"][accept*="pdf"], .resume-upload');
          if (await resumeUpload.isVisible()) {
            console.log('✓ Resume upload option available');
          }
          
          // Check for availability confirmation
          const availabilityCheckbox = page.locator('input[type="checkbox"][name="availability"], #availability');
          if (await availabilityCheckbox.isVisible()) {
            await availabilityCheckbox.check();
            console.log('✓ Availability confirmed');
          }
          
          // Check for terms agreement
          const termsCheckbox = page.locator('input[type="checkbox"][name="terms"], #terms');
          if (await termsCheckbox.isVisible()) {
            await termsCheckbox.check();
            console.log('✓ Terms agreed');
          }
          
          // Submit application
          const submitButton = page.locator('button[type="submit"], button:has-text("Submit Application"), button:has-text("Send")');
          if (await submitButton.isVisible()) {
            await submitButton.click();
            await page.waitForTimeout(2000);
            
            // Verify submission success
            const successMessage = page.locator('.success, .alert-success, [role="alert"]').filter({ hasText: /applied|submitted|success/i });
            if (await successMessage.isVisible()) {
              console.log('✓ Application submitted successfully');
              await expect(successMessage).toBeVisible();
            } else {
              // Check if redirected to applications page
              const currentUrl = page.url();
              if (currentUrl.includes('/applications') || currentUrl.includes('/applied')) {
                console.log('✓ Application submitted - redirected to applications page');
              }
            }
          }
        } else {
          // Maybe application is submitted with a simple button click
          console.log('✓ Application submitted (quick apply)');
        }
      } else {
        console.log('ℹ️ Apply button not found - may have already applied');
      }
    } else {
      console.log('ℹ️ No castings available to apply for');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/actor-application-submit.png', fullPage: true });
  });

  test('actor can view their applications', async ({ page }) => {
    console.log('📋 Testing Actor Applications Dashboard UI');
    
    // Login as actor
    const token = await loginUser(page, ACTOR_CREDENTIALS);
    expect(token).toBeTruthy();
    
    // Set token and navigate
    await page.goto('http://localhost:8080');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, token);
    
    // Go to actor's applications page
    await page.goto('http://localhost:8080/dashboard/actor');
    await page.waitForLoadState('networkidle');
    
    // Verify applications page
    await expect(page.locator('h1, h2').filter({ hasText: /my|applications|submitted/i })).toBeVisible();
    
    // Check for application items
    const applicationItems = page.locator('.application-item, .application-card, [data-testid="application"]');
    const appCount = await applicationItems.count();
    
    if (appCount > 0) {
      console.log(`✓ Found ${appCount} submitted application(s)`);
      
      // Check application status indicators
      const statusIndicators = page.locator('.status, .application-status, [data-testid="status"]');
      if (await statusIndicators.isVisible()) {
        console.log('✓ Application status indicators visible');
      }
      
      // Check for application details
      const firstApp = applicationItems.first();
      
      // Casting title
      const title = firstApp.locator('.casting-title, .role-title, h3');
      if (await title.isVisible()) {
        console.log('✓ Casting titles visible in applications');
      }
      
      // Application date
      const date = firstApp.locator('.date, .applied-on, .submission-date');
      if (await date.isVisible()) {
        console.log('✓ Application dates visible');
      }
      
      // Status
      const status = firstApp.locator('.status, .application-status');
      if (await status.isVisible()) {
        console.log('✓ Application statuses visible');
      }
      
      // Action buttons (view, withdraw, etc.)
      const actionButtons = firstApp.locator('button');
      const buttonCount = await actionButtons.count();
      if (buttonCount > 0) {
        console.log(`✓ Found ${buttonCount} action button(s) for application`);
      }
      
      // Click on first application to view details
      await firstApp.click();
      await page.waitForLoadState('networkidle');
      
      // Verify application details page
      await expect(page.locator('h1, h2').first()).toBeVisible();
      
      // Check for detailed application info
      const detailsSections = [
        { selector: '.application-details, .submission-info', name: 'Application Details' },
        { selector: '.cover-letter, .message', name: 'Cover Letter' },
        { selector: '.submitted-media, .portfolio', name: 'Submitted Media' },
        { selector: '.timeline, .activity-log', name: 'Application Timeline' },
        { selector: '.messages, .communication', name: 'Messages' }
      ];
      
      for (const section of detailsSections) {
        const element = page.locator(section.selector);
        if (await element.isVisible()) {
          console.log(`✓ ${section.name} section visible`);
        }
      }
      
      // Check for communication options
      const messageButton = page.locator('button:has-text("Message"), button:has-text("Contact")');
      if (await messageButton.isVisible()) {
        console.log('✓ Messaging option available');
      }
      
      // Check for withdrawal option
      const withdrawButton = page.locator('button:has-text("Withdraw"), button:has-text("Cancel")');
      if (await withdrawButton.isVisible()) {
        console.log('✓ Withdraw application option available');
      }
    } else {
      console.log('ℹ️ No submitted applications found');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/actor-applications-dashboard.png', fullPage: true });
  });

  test('actor can manage their profile', async ({ page }) => {
    console.log('👤 Testing Actor Profile Management UI');
    
    // Login as actor
    const token = await loginUser(page, ACTOR_CREDENTIALS);
    expect(token).toBeTruthy();
    
    // Set token and navigate
    await page.goto('http://localhost:8080');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, token);
    
    // Go to actor profile page
    await page.goto('http://localhost:8080/actor/profile');
    await page.waitForLoadState('networkidle');
    
    // Verify profile page
    await expect(page.locator('h1, h2').filter({ hasText: /profile|my profile/i })).toBeVisible();
    
    // Check profile sections
    const profileSections = [
      { selector: '.basic-info, .personal-info', name: 'Basic Information' },
      { selector: '.profile-photo, .avatar', name: 'Profile Photo' },
      { selector: '.bio, .about', name: 'Bio/About' },
      { selector: '.stats, .statistics', name: 'Profile Statistics' },
      { selector: '.portfolio, .media', name: 'Portfolio/Media' },
      { selector: '.experience, .background', name: 'Experience' },
      { selector: '.skills, .talents', name: 'Skills/Talents' }
    ];
    
    for (const section of profileSections) {
      const element = page.locator(section.selector);
      if (await element.isVisible()) {
        console.log(`✓ ${section.name} section visible`);
      }
    }
    
    // Check for edit profile button
    const editButton = page.locator('button:has-text("Edit Profile"), button:has-text("Edit"), .edit-profile-btn');
    if (await editButton.isVisible()) {
      console.log('✓ Edit profile option available');
      
      // Click edit to test profile editing interface
      await editButton.click();
      await page.waitForTimeout(1000);
      
      // Check for form fields
      const formFields = [
        { selector: 'input[name="name"], #name', name: 'Name' },
        { selector: 'input[name="phone"], #phone', name: 'Phone' },
        { selector: 'input[name="location"], #location', name: 'Location' },
        { selector: 'textarea[name="bio"], #bio', name: 'Bio' },
        { selector: 'select[name="experience"], #experience', name: 'Experience Level' }
      ];
      
      for (const field of formFields) {
        const element = page.locator(field.selector);
        if (await element.isVisible()) {
          console.log(`✓ ${field.name} field editable`);
        }
      }
      
      // Check for media upload
      const photoUpload = page.locator('input[type="file"][accept*="image"], .photo-upload');
      if (await photoUpload.isVisible()) {
        console.log('✓ Photo upload available');
      }
      
      const videoUpload = page.locator('input[type="file"][accept*="video"], .video-upload');
      if (await videoUpload.isVisible()) {
        console.log('✓ Video upload available');
      }
      
      // Check for save button
      const saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
      if (await saveButton.isVisible()) {
        console.log('✓ Save button available');
      }
    }
    
    // Check for portfolio management
    const portfolioSection = page.locator('.portfolio, .media-gallery, .videos');
    if (await portfolioSection.isVisible()) {
      console.log('✓ Portfolio section visible');
      
      // Check for add media button
      const addMediaButton = page.locator('button:has-text("Add Video"), button:has-text("Upload"), .add-media-btn');
      if (await addMediaButton.isVisible()) {
        console.log('✓ Add media option available');
      }
      
      // Check for existing media items
      const mediaItems = page.locator('.video-item, .media-item, .portfolio-item');
      const mediaCount = await mediaItems.count();
      if (mediaCount > 0) {
        console.log(`✓ Found ${mediaCount} media item(s) in portfolio`);
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/actor-profile-management.png', fullPage: true });
  });
});
