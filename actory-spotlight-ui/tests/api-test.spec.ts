import { test, expect } from '@playwright/test';

test.describe('API Connectivity Test', () => {
  test('verify backend API is accessible', async ({ page }) => {
    // Test API connectivity directly
    const response = await page.request.post('http://localhost:5000/api/v1/auth/login', {
      data: {
        email: 'tonyjoyjp@gmail.com',
        password: 'tony123'
      }
    });
    
    console.log('API Response status:', response.status());
    console.log('API Response body:', await response.text());
    
    // If we get a response, the API is working
    expect(response.status()).toBeLessThan(500);
  });
});
