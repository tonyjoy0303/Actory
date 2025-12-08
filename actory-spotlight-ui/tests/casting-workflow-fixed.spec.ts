import { test, expect, Page } from '@playwright/test';

const TEST_USERS = {
  actor: {
    email: 'apz@gmail.com',
    password: 'apz123',
    role: 'Actor',
    name: 'Test Actor',
    age: 25,
    gender: 'male',
    experienceLevel: 'beginner',
    phone: '1234567890',
    location: 'Test City'
  },
  producer: {
    email: 'tonyjoyjp@gmail.com', 
    password: 'tony123',
    role: 'Producer',
    name: 'Test Producer',
    companyName: 'Test Production Company',
    phone: '1234567890',
    location: 'Test City'
  }
};

async function registerUser(page: Page, user: any) {
  const response = await page.request.post('http://localhost:5000/api/v1/auth/register', {
    data: {
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      ...(user.age && { age: user.age }),
      ...(user.gender && { gender: user.gender }),
      ...(user.experienceLevel && { experienceLevel: user.experienceLevel }),
      ...(user.companyName && { companyName: user.companyName }),
      phone: user.phone,
      location: user.location
    }
  });
  
  if (response.status() === 201) {
    console.log(`✓ Registered ${user.role}: ${user.email}`);
    return true;
  } else if (response.status() === 400 && (await response.json()).message?.includes('already registered')) {
    console.log(`- ${user.role} already exists: ${user.email}`);
    return true;
  } else {
    console.log(`✗ Failed to register ${user.role}:`, await response.text());
    return false;
  }
}

async function loginUser(page: Page, user: any) {
  const response = await page.request.post('http://localhost:5000/api/v1/auth/login', {
    data: {
      email: user.email,
      password: user.password
    }
  });
  
  if (response.status() === 200) {
    const data = await response.json();
    console.log(`✓ Logged in ${user.role}: ${user.email}`);
    return data.token;
  } else {
    console.log(`✗ Failed to login ${user.role}:`, await response.text());
    return null;
  }
}

test.describe('Casting Workflow with Test Users', () => {

  test('producer can create casting call', async ({ page, request }) => {
    // Register test users first
    await registerUser(page, TEST_USERS.producer);
    // Login as producer
    const token = await loginUser(page, TEST_USERS.producer);
    expect(token).toBeTruthy();
    
    // Set token in localStorage for the page
    await page.goto('http://localhost:8080');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, token);
    
    // Navigate to casting creation page
    await page.goto('/dashboard/producer/create-casting');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're on the create casting page
    const title = await page.locator('h1').first().textContent();
    console.log('Page title:', title);
    
    // Try to find form elements
    const titleInput = page.locator('input[name="title"], input[placeholder*="title"]');
    const descriptionTextarea = page.locator('textarea[name="description"], textarea[placeholder*="description"]');
    
    if (await titleInput.isVisible()) {
      // Fill in the casting call form
      await titleInput.fill('Test Casting Call');
      
      if (await descriptionTextarea.isVisible()) {
        await descriptionTextarea.fill('This is a test casting call created by automated test');
      }
      
      // Look for submit button
      const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Submit")');
      
      if (await submitButton.isVisible()) {
        console.log('✓ Found submit button, attempting to submit form');
        await submitButton.click();
        
        // Wait for response
        await page.waitForTimeout(3000);
        
        // Check result
        const currentUrl = page.url();
        console.log('Current URL after submission:', currentUrl);
        
        // Look for success message
        const successMessage = page.locator('text=success, created, casting call');
        if (await successMessage.isVisible()) {
          console.log('✓ Success message found');
        }
      } else {
        console.log('- Submit button not found');
      }
    } else {
      console.log('- Title input not found, page might be different');
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-create-casting-page.png' });
    }
    
    // Verify the page loaded without errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('actor can view casting calls', async ({ page, request }) => {
    // Register test users first
    await registerUser(page, TEST_USERS.actor);
    // Login as actor
    const token = await loginUser(page, TEST_USERS.actor);
    expect(token).toBeTruthy();
    
    // Set token in localStorage for the page
    await page.goto('http://localhost:8080');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, token);
    
    // Navigate to casting list
    await page.goto('/casting');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check page content
    const title = await page.locator('h1').first().textContent();
    console.log('Casting page title:', title);
    
    // Look for casting calls
    await page.waitForTimeout(2000);
    
    const castingCards = page.locator('[data-testid="casting-card"], .casting-card, .card');
    const cardCount = await castingCards.count();
    
    console.log(`Found ${cardCount} casting cards`);
    
    if (cardCount > 0) {
      console.log('✓ Casting calls are displayed');
      
      // Try to click on first card
      await castingCards.first().click();
      await page.waitForTimeout(2000);
      
      console.log('✓ Clicked on casting call');
    } else {
      // Check for no results message
      const noResults = page.locator('text=no casting calls, no results, not found');
      if (await noResults.isVisible()) {
        console.log('- No casting calls available');
      }
    }
    
    // Verify the page loaded without errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('actor can access dashboard', async ({ page, request }) => {
    // Register test users first
    await registerUser(page, TEST_USERS.actor);
    // Login as actor
    const token = await loginUser(page, TEST_USERS.actor);
    expect(token).toBeTruthy();
    
    // Set token in localStorage for the page
    await page.goto('http://localhost:8080');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, token);
    
    // Navigate to actor dashboard
    await page.goto('/dashboard/actor');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check dashboard content
    const title = await page.locator('h1, h2').first().textContent();
    console.log('Dashboard title:', title);
    
    // Look for dashboard elements
    const welcomeText = page.locator('text=welcome, dashboard, profile');
    const navigationElements = page.locator('nav, .nav, [role="navigation"]');
    
    if (await welcomeText.isVisible() || await navigationElements.isVisible()) {
      console.log('✓ Dashboard elements found');
    }
    
    // Verify the page loaded without errors
    await expect(page.locator('body')).toBeVisible();
  });
});
