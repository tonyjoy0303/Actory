import { test, expect, type Page, type Response } from '@playwright/test';

// Test credentials (using existing users from login.spec.ts)
const PRODUCER = { email: 'tonyjoyjp@gmail.com', password: 'tony123' }; // Using recruiter as producer equivalent
const ACTOR = { email: 'jesly@gmail.com', password: 'jesly123' };

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

test.describe('Casting Call Management', () => {
  test('producer can create a new casting call', async ({ page }) => {
    // Login as producer
    await doLogin(page, PRODUCER);
    
    // Navigate to producer dashboard
    await expect(page).toHaveURL(/dashboard/);
    
    // Navigate to create casting call page
    await page.goto('/casting/create');
    
    // Verify we're on the create casting call page
    await expect(page.locator('h1')).toContainText('Create New Casting Call');
    
    // Fill in casting call details
    const castingData = {
      title: 'Lead Actor for Drama Film',
      description: 'Looking for a talented male actor for lead role in upcoming drama film',
      roleTitle: 'John Doe - Lead Actor',
      projectType: 'Film',
      genre: 'Drama',
      experienceLevel: 'professional',
      ageRange: '25-35',
      gender: 'Male',
      language: 'English',
      location: 'Mumbai',
      auditionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      submissionDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      shootStartDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      shootEndDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      paymentDetails: 'Rs. 50,000 per day',
      contactInfo: 'contact@production.com',
      requirements: 'Must have previous acting experience in films'
    };
    
    // Fill form fields
    await page.getByLabel(/title/i).fill(castingData.title);
    await page.getByLabel(/description/i).fill(castingData.description);
    await page.getByLabel(/role title/i).fill(castingData.roleTitle);
    
    // Select project type
    await page.getByLabel(/project type/i).selectOption({ label: castingData.projectType });
    
    // Select genre
    await page.getByLabel(/genre/i).selectOption({ label: castingData.genre });
    
    // Select experience level
    await page.getByLabel(/experience level/i).selectOption({ label: castingData.experienceLevel });
    
    // Fill age range
    await page.getByLabel(/age range/i).fill(castingData.ageRange);
    
    // Select gender
    await page.getByLabel(/gender/i).selectOption({ label: castingData.gender });
    
    // Select language
    await page.getByLabel(/language/i).selectOption({ label: castingData.language });
    
    // Fill location
    await page.getByLabel(/location/i).fill(castingData.location);
    
    // Fill dates (format as YYYY-MM-DD for date inputs)
    const auditionDateStr = castingData.auditionDate.toISOString().split('T')[0];
    const submissionDeadlineStr = castingData.submissionDeadline.toISOString().split('T')[0];
    const shootStartDateStr = castingData.shootStartDate.toISOString().split('T')[0];
    const shootEndDateStr = castingData.shootEndDate.toISOString().split('T')[0];
    
    await page.getByLabel(/audition date/i).fill(auditionDateStr);
    await page.getByLabel(/submission deadline/i).fill(submissionDeadlineStr);
    await page.getByLabel(/shoot start date/i).fill(shootStartDateStr);
    await page.getByLabel(/shoot end date/i).fill(shootEndDateStr);
    
    // Fill payment and contact details
    await page.getByLabel(/payment/i).fill(castingData.paymentDetails);
    await page.getByLabel(/contact/i).fill(castingData.contactInfo);
    await page.getByLabel(/requirements/i).fill(castingData.requirements);
    
    // Submit the form
    const submitButton = page.getByRole('button', { name: /create casting call|submit/i });
    await expect(submitButton).toBeVisible();
    
    // Wait for API response
    const createResponsePromise = page.waitForResponse((resp: Response) =>
      resp.url().includes('/api/casting')
    );
    
    await submitButton.click();
    
    // Verify API response
    const createResponse = await createResponsePromise;
    expect(createResponse.status()).toBe(200);
    
    // Verify success message
    await expect(page.locator('text=Success')).toBeVisible();
    await expect(page.locator('text=Casting call created successfully')).toBeVisible();
    
    // Wait for redirect to dashboard
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/dashboard\/producer/);
  });

  test('producer can view and manage created casting calls', async ({ page }) => {
    // Login as producer
    await doLogin(page, PRODUCER);
    
    // Navigate to casting list
    await page.goto('/casting');
    
    // Verify casting list page loads
    await expect(page.locator('h1')).toContainText('Casting Calls');
    
    // Wait for casting calls to load
    await page.waitForSelector('[data-testid="casting-card"]', { timeout: 10000 });
    
    // Verify at least one casting call exists
    const castingCards = page.locator('[data-testid="casting-card"]');
    await expect(castingCards.first()).toBeVisible();
    
    // Click on the first casting call to view details
    await castingCards.first().click();
    
    // Verify casting details page loads
    await expect(page.locator('h1')).toContainText(/casting call details/i);
    
    // Verify key information is displayed
    await expect(page.locator('text=Lead Actor for Drama Film')).toBeVisible();
    await expect(page.locator('text=John Doe - Lead Actor')).toBeVisible();
    await expect(page.locator('text=Drama')).toBeVisible();
    await expect(page.locator('text=Professional')).toBeVisible();
  });
});

test.describe('Actor Casting Applications', () => {
  test('actor can browse and apply for casting calls', async ({ page }) => {
    // Login as actor
    await doLogin(page, ACTOR);
    
    // Navigate to casting list
    await page.goto('/casting');
    
    // Verify casting list page loads
    await expect(page.locator('h1')).toContainText('Casting Calls');
    
    // Wait for casting calls to load
    await page.waitForSelector('[data-testid="casting-card"]', { timeout: 10000 });
    
    // Verify casting calls are displayed
    const castingCards = page.locator('[data-testid="casting-card"]');
    await expect(castingCards.first()).toBeVisible();
    
    // Click on the first casting call to view details
    await castingCards.first().click();
    
    // Verify casting details page loads
    await expect(page.locator('h1')).toContainText(/casting call details/i);
    
    // Verify "Apply Now" button is visible
    const applyButton = page.getByRole('button', { name: /apply now|apply/i });
    await expect(applyButton).toBeVisible();
    
    // Click apply button
    await applyButton.click();
    
    // Verify we're redirected to audition submission page
    await expect(page).toHaveURL(/audition\/submit/);
    
    // Fill audition form
    const auditionData = {
      title: 'Audition for Lead Actor Role',
      height: '175',
      weight: '70',
      age: '28',
      permanentAddress: '123 Main St, Mumbai, Maharashtra',
      livingCity: 'Mumbai',
      dateOfBirth: '1995-06-15',
      phoneNumber: '+919876543210',
      email: 'actor@example.com',
      skills: ['Acting', 'Dancing', 'Voice Acting'],
      comments: 'Experienced actor with 5+ years in film and television'
    };
    
    // Wait for form to load
    await page.waitForSelector('form');
    
    // Fill personal details
    await page.getByLabel(/title/i).fill(auditionData.title);
    await page.getByLabel(/height/i).fill(auditionData.height);
    await page.getByLabel(/weight/i).fill(auditionData.weight);
    await page.getByLabel(/age/i).fill(auditionData.age);
    await page.getByLabel(/permanent address/i).fill(auditionData.permanentAddress);
    await page.getByLabel(/living city/i).fill(auditionData.livingCity);
    await page.getByLabel(/date of birth/i).fill(auditionData.dateOfBirth);
    await page.getByLabel(/phone/i).fill(auditionData.phoneNumber);
    await page.getByLabel(/email/i).fill(auditionData.email);
    
    // Add skills
    for (const skill of auditionData.skills) {
      await page.getByLabel(/skill/i).fill(skill);
      await page.getByRole('button', { name: /add skill/i }).click();
    }
    
    // Add comments
    await page.getByLabel(/comments|additional info/i).fill(auditionData.comments);
    
    // Upload video file (simulate file upload)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'audition-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content')
    });
    
    // Submit application
    const submitButton = page.getByRole('button', { name: /submit application|submit/i });
    
    // Wait for API response
    const submitResponsePromise = page.waitForResponse((resp: Response) =>
      resp.url().includes('/api/videos')
    );
    
    await submitButton.click();
    
    // Verify API response
    const submitResponse = await submitResponsePromise;
    expect(submitResponse.status()).toBe(200);
    
    // Verify success message
    await expect(page.locator('text=Application submitted successfully')).toBeVisible();
    
    // Verify redirect to actor dashboard
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/dashboard\/actor/);
  });

  test('actor can view their submissions in dashboard', async ({ page }) => {
    // Login as actor
    await doLogin(page, ACTOR);
    
    // Navigate to actor dashboard
    await expect(page).toHaveURL(/dashboard/);
    
    // Click on "My Submissions" tab
    await page.getByRole('tab', { name: /my submissions/i }).click();
    
    // Verify submissions section loads
    await expect(page.locator('text=My Submissions')).toBeVisible();
    
    // Wait for submissions to load
    await page.waitForSelector('[data-testid="submission-card"]', { timeout: 10000 });
    
    // Verify submission is displayed
    const submissionCards = page.locator('[data-testid="submission-card"]');
    if (await submissionCards.count() > 0) {
      await expect(submissionCards.first()).toBeVisible();
      
      // Verify submission details
      await expect(page.locator('text=Audition for Lead Actor Role')).toBeVisible();
      await expect(page.locator('text=Pending')).toBeVisible();
    }
  });
});

test.describe('Video Upload and Management', () => {
  test('actor can upload and manage profile videos', async ({ page }) => {
    // Login as actor
    await doLogin(page, ACTOR);
    
    // Navigate to actor dashboard
    await expect(page).toHaveURL(/dashboard/);
    
    // Click on "My Videos" tab (should be default)
    await expect(page.locator('text=My Videos')).toBeVisible();
    
    // Click "Showcase Your Skills" button to upload video
    await page.getByRole('button', { name: /showcase your skills|upload/i }).click();
    
    // Verify upload form is displayed
    await expect(page.locator('text=Upload Video')).toBeVisible();
    
    // Fill video details
    const videoData = {
      title: 'Professional Acting Reel',
      description: 'Collection of my best acting performances from films and TV shows'
    };
    
    await page.getByLabel(/title/i).fill(videoData.title);
    await page.getByLabel(/description/i).fill(videoData.description);
    
    // Upload video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'acting-reel.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content')
    });
    
    // Submit upload
    const uploadButton = page.getByRole('button', { name: /upload|submit/i });
    
    // Wait for API response
    const uploadResponsePromise = page.waitForResponse((resp: Response) =>
      resp.url().includes('/api/videos')
    );
    
    await uploadButton.click();
    
    // Verify API response
    const uploadResponse = await uploadResponsePromise;
    expect(uploadResponse.status()).toBe(200);
    
    // Verify success message
    await expect(page.locator('text=Video uploaded successfully')).toBeVisible();
    
    // Verify video appears in the list
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Professional Acting Reel')).toBeVisible();
    
    // Test video playback
    const playButton = page.locator('[data-testid="play-video-button"]').first();
    if (await playButton.isVisible()) {
      await playButton.click();
      
      // Verify video player modal opens
      await expect(page.locator('[data-testid="video-player-modal"]')).toBeVisible();
      
      // Close video player
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="video-player-modal"]')).not.toBeVisible();
    }
  });
});
