import { test, expect } from '@playwright/test';

const ACTOR = { email: 'jesly@gmail.com', password: 'jesly123' };
const RECRUITER = { email: 'tonyjoyjp@gmail.com', password: 'tony123' };

export async function doLogin(page, creds: { email: string; password: string }) {
  // Capture console logs to aid debugging if login fails
  const logs: string[] = [];
  page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));

  await page.goto('/auth/login');
  await page.getByPlaceholder('Email').fill(creds.email);
  await page.getByPlaceholder('Password').fill(creds.password);

  // Start waiting for the login API response before clicking submit
  const loginResponsePromise = page.waitForResponse((resp) =>
    resp.url().includes('/api/v1/auth/login')
  );

  await page.locator('form').getByRole('button', { name: /^log in$/i }).click();

  const loginResp = await loginResponsePromise;
  const status = loginResp.status();
  let body: any = null;
  try { body = await loginResp.json(); } catch {}

  // Hard assert success and presence of token in response body if available
  expect(status, `Login status should be 200. Logs:\n${logs.join('\n')}`).toBe(200);
  if (body) {
    expect(body.token, `Response body did not include token. Body: ${JSON.stringify(body)}`).toBeTruthy();
  }

  // Also wait until token is stored client-side
  await page.waitForFunction(() => !!localStorage.getItem('token'));
}

test('actor can login and reaches dashboard or home', async ({ page }) => {
  await doLogin(page, ACTOR);
  await expect(page).toHaveURL(/(dashboard|actor|producer|admin|\/)$/);
});

test('recruiter can login and reaches dashboard or home', async ({ page }) => {
  await doLogin(page, RECRUITER);
  await expect(page).toHaveURL(/(dashboard|actor|producer|admin|\/)$/);
});


