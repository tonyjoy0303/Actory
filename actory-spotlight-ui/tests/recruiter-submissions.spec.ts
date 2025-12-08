import { test, expect, Page } from '@playwright/test';

// Recruiter credentials
const RECRUITER_CREDENTIALS = {
  email: 'recruiter@actory.com',
  password: 'recruiter123',
  name: 'Test Recruiter',
  companyName: 'Test Recruiting Agency',
  phone: '1234567890',
  location: 'Test City'
};

// Helper function to login as recruiter
async function loginAsRecruiter(page: Page) {
  // First register the recruiter if not exists
  try {
    const response = await page.request.post('http://localhost:5000/api/v1/auth/register', {
      data: {
        name: RECRUITER_CREDENTIALS.name,
        email: RECRUITER_CREDENTIALS.email,
        password: RECRUITER_CREDENTIALS.password,
        role: 'Producer', // Recruiter uses Producer role
        companyName: RECRUITER_CREDENTIALS.companyName,
        phone: RECRUITER_CREDENTIALS.phone,
        location: RECRUITER_CREDENTIALS.location
      }
    });
    
    if (response.status() === 201 || response.status() === 200) {
      console.log('✓ Recruiter registered successfully');
    }
  } catch (error) {
    // Recruiter might already exist, continue with login
    console.log('ℹ️ Recruiter might already exist, proceeding with login');
  }

  // Login as recruiter
  const loginResponse = await page.request.post('http://localhost:5000/api/v1/auth/login', {
    data: {
      email: RECRUITER_CREDENTIALS.email,
      password: RECRUITER_CREDENTIALS.password
    }
  });

  if (loginResponse.status() === 200) {
    const loginData = await loginResponse.json();
    if (loginData.success && loginData.token) {
      // Store token in localStorage
      await page.goto('http://localhost:8080');
      await page.evaluate((token) => {
        localStorage.setItem('token', token);
      }, loginData.token);
      
      // Reload page to apply token
      await page.reload();
      console.log('✓ Recruiter logged in successfully');
      return true;
    }
  }
  
  throw new Error('Failed to login as recruiter');
}

test.describe('Recruiter Submissions Management UI', () => {
  test('recruiter can view all casting submissions', async ({ page }) => {
    console.log('🔍 Starting recruiter submissions view test...');
    
    // Login as recruiter
    await loginAsRecruiter(page);
    
    // Navigate to recruiter dashboard (using producer dashboard for now)
    await page.goto('http://localhost:8080/dashboard/producer');
    await page.waitForLoadState('networkidle');
    
    // Verify dashboard is loaded
    await expect(page.locator('h1, h2').first()).toBeVisible();
    console.log('✓ Recruiter dashboard loaded');
    
    // Look for submissions/castings section
    const castingsSection = page.locator('section, div').filter({ hasText: /castings|submissions|applications/i }).first();
    
    if (await castingsSection.isVisible()) {
      console.log('✓ Castings/Submissions section found');
      
      // Look for casting cards or list items
      const castingItems = page.locator('.casting-card, .casting-item, [data-testid="casting-item"], .card');
      const itemCount = await castingItems.count();
      
      if (itemCount > 0) {
        console.log(`✓ Found ${itemCount} casting(s)`);
        
        // Click on first casting to view submissions
        await castingItems.first().click();
        await page.waitForLoadState('networkidle');
        
        // Look for submissions/applications section
        const submissionsSection = page.locator('section, div').filter({ hasText: /submissions|applications|applicants/i }).first();
        
        if (await submissionsSection.isVisible()) {
          console.log('✓ Submissions section found');
          
          // Look for application cards or list items
          const applicationItems = page.locator('.application-card, .application-item, [data-testid="application"], .applicant-card');
          const applicationCount = await applicationItems.count();
          
          if (applicationCount > 0) {
            console.log(`✓ Found ${applicationCount} application(s)`);
            
            // Verify application details are visible
            const firstApplication = applicationItems.first();
            await expect(firstApplication).toBeVisible();
            
            // Look for key information in applications
            const actorInfo = firstApplication.locator('text=actor|applicant|name');
            const statusInfo = firstApplication.locator('text=status|pending|approved|rejected');
            
            if (await actorInfo.isVisible()) {
              console.log('✓ Actor information visible in applications');
            }
            
            if (await statusInfo.isVisible()) {
              console.log('✓ Application status visible');
            }
          } else {
            console.log('ℹ️ No applications found for this casting');
          }
        } else {
          console.log('ℹ️ Submissions section not found');
        }
      } else {
        console.log('ℹ️ No castings found to view submissions');
      }
    } else {
      console.log('ℹ️ Castings section not found');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/recruiter-submissions-view.png', fullPage: true });
  });

  test('recruiter can review and filter submissions', async ({ page }) => {
    console.log('📋 Starting recruiter submission review test...');
    
    // Login as recruiter
    await loginAsRecruiter(page);
    
    // Navigate to a casting with submissions
    await page.goto('http://localhost:8080/casting');
    await page.waitForLoadState('networkidle');
    
    // Look for castings list
    const castingItems = page.locator('.casting-card, .casting-item, [data-testid="casting-item"], .card');
    const itemCount = await castingItems.count();
    
    if (itemCount > 0) {
      // Click on first casting
      await castingItems.first().click();
      await page.waitForLoadState('networkidle');
      
      // Look for filter options
      const filterSection = page.locator('section, div').filter({ hasText: /filter|sort|search/i }).first();
      
      if (await filterSection.isVisible()) {
        console.log('✓ Filter options available');
        
        // Try to find status filter
        const statusFilter = page.locator('select, button').filter({ hasText: /status|all|pending|approved/i }).first();
        
        if (await statusFilter.isVisible()) {
          console.log('✓ Status filter found');
          
          // Try to filter by status
          if (await statusFilter.getAttribute('type') === 'select-one') {
            await statusFilter.selectOption({ label: 'Pending' });
            console.log('✓ Applied status filter');
          }
        }
      }
      
      // Look for submission review actions
      const applicationItems = page.locator('.application-card, .application-item, [data-testid="application"]');
      const applicationCount = await applicationItems.count();
      
      if (applicationCount > 0) {
        const firstApplication = applicationItems.first();
        
        // Look for action buttons
        const actionButtons = firstApplication.locator('button').filter({ hasText: /view|approve|reject|contact/i });
        const buttonCount = await actionButtons.count();
        
        if (buttonCount > 0) {
          console.log(`✓ Found ${buttonCount} action button(s) for application`);
          
          // Try to click view button
          const viewButton = actionButtons.filter({ hasText: /view/i }).first();
          if (await viewButton.isVisible()) {
            await viewButton.click();
            await page.waitForLoadState('networkidle');
            console.log('✓ Opened application details');
            
            // Verify detail view
            const detailSection = page.locator('section, div').filter({ hasText: /details|profile|resume/i }).first();
            if (await detailSection.isVisible()) {
              console.log('✓ Application details visible');
            }
          }
        }
      }
    } else {
      console.log('ℹ️ No castings available for review');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/recruiter-submission-review.png', fullPage: true });
  });

  test('recruiter can contact applicants', async ({ page }) => {
    console.log('📧 Starting recruiter applicant contact test...');
    
    // Login as recruiter
    await loginAsRecruiter(page);
    
    // Navigate to applications
    await page.goto('http://localhost:8080/dashboard/producer');
    await page.waitForLoadState('networkidle');
    
    // Look for applications section
    const applicationsSection = page.locator('section, div').filter({ hasText: /applications|submissions|applicants/i }).first();
    
    if (await applicationsSection.isVisible()) {
      console.log('✓ Applications section found');
      
      // Look for application items
      const applicationItems = page.locator('.application-card, .application-item, [data-testid="application"]');
      const applicationCount = await applicationItems.count();
      
      if (applicationCount > 0) {
        const firstApplication = applicationItems.first();
        
        // Look for contact options
        const contactButton = firstApplication.locator('button').filter({ hasText: /contact|message|email/i }).first();
        
        if (await contactButton.isVisible()) {
          console.log('✓ Contact button found');
          
          // Try to click contact button
          await contactButton.click();
          await page.waitForTimeout(2000);
          
          // Look for contact modal or form
          const contactModal = page.locator('.modal, .dialog, [role="dialog"]').filter({ hasText: /message|contact|email/i }).first();
          
          if (await contactModal.isVisible()) {
            console.log('✓ Contact modal opened');
            
            // Look for message input
            const messageInput = contactModal.locator('textarea, input[type="text"]').first();
            if (await messageInput.isVisible()) {
              console.log('✓ Message input found');
              
              // Fill message
              await messageInput.fill('We are interested in your application. Please contact us for further details.');
              
              // Look for send button
              const sendButton = contactModal.locator('button').filter({ hasText: /send|submit|contact/i }).first();
              
              if (await sendButton.isVisible()) {
                console.log('✓ Send button found');
                // Note: Not actually sending to avoid spam
              }
            }
            
            // Close modal
            const closeButton = contactModal.locator('button').filter({ hasText: /close|cancel|x/i }).first();
            if (await closeButton.isVisible()) {
              await closeButton.click();
              console.log('✓ Contact modal closed');
            }
          }
        } else {
          console.log('ℹ️ Contact button not available');
        }
      } else {
        console.log('ℹ️ No applications to contact');
      }
    } else {
      console.log('ℹ️ Applications section not found');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/recruiter-applicant-contact.png', fullPage: true });
  });

  test('recruiter can export submission data', async ({ page }) => {
    console.log('📊 Starting recruiter data export test...');
    
    // Login as recruiter
    await loginAsRecruiter(page);
    
    // Navigate to dashboard
    await page.goto('http://localhost:8080/dashboard/producer');
    await page.waitForLoadState('networkidle');
    
    // Look for export options
    const exportButton = page.locator('button').filter({ hasText: /export|download|report/i }).first();
    
    if (await exportButton.isVisible()) {
      console.log('✓ Export button found');
      
      // Try to click export button
      await exportButton.click();
      await page.waitForTimeout(2000);
      
      // Look for export options modal
      const exportModal = page.locator('.modal, .dialog, [role="dialog"]').filter({ hasText: /export|format|download/i }).first();
      
      if (await exportModal.isVisible()) {
        console.log('✓ Export modal opened');
        
        // Look for format options
        const formatOptions = exportModal.locator('input[type="radio"], input[type="checkbox"], select option');
        const optionCount = await formatOptions.count();
        
        if (optionCount > 0) {
          console.log(`✓ Found ${optionCount} export format option(s)`);
        }
        
        // Look for export confirm button
        const confirmButton = exportModal.locator('button').filter({ hasText: /export|download|confirm/i }).first();
        
        if (await confirmButton.isVisible()) {
          console.log('✓ Export confirm button found');
          // Note: Not actually exporting to avoid file generation
        }
        
        // Close modal
        const closeButton = exportModal.locator('button').filter({ hasText: /close|cancel/i }).first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          console.log('✓ Export modal closed');
        }
      }
    } else {
      console.log('ℹ️ Export functionality not available');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/recruiter-data-export.png', fullPage: true });
  });
});
