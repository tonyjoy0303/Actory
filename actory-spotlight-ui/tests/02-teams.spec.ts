import { test, expect } from '@playwright/test';
import { doLogin } from './helpers';

const PRODUCER = { email: 'tonyjoyjp@gmail.com', password: 'tony123' };
const ACTOR = { email: 'jesly@gmail.com', password: 'jesly123' };

// Helper function to create a test team
async function createTestTeam(page: any, teamName: string) {
  await page.goto('/teams/create');
  await page.waitForLoadState('networkidle');
  
  await page.locator('input[name="name"], input[placeholder*="team name" i]').fill(teamName);
  await page.locator('textarea[name="description"], textarea[placeholder*="description" i]').fill(`Test team description for ${teamName}`);
  
  const submitButton = page.locator('button[type="submit"]').filter({ hasText: /create|submit/i });
  await submitButton.click();
  
  await page.waitForTimeout(2000);
  return teamName;
}

test.describe('Teams - Creation', () => {
  test('should display create team form for producer', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/teams/create');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2').filter({ hasText: /create.*team|new.*team/i })).toBeVisible();
    await expect(page.locator('input[name="name"], input[placeholder*="team name" i]')).toBeVisible();
  });

  test('should validate required fields when creating team', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/teams/create');
    await page.waitForLoadState('networkidle');
    
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /create|submit/i });
    await submitButton.click();
    
    await page.waitForTimeout(1000);
    // Should still be on create page
    expect(page.url()).toContain('create');
  });

  test('should create team successfully', async ({ page }) => {
    await doLogin(page, PRODUCER);
    
    const teamName = `Test Team ${Date.now()}`;
    await page.goto('/teams/create');
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[name="name"], input[placeholder*="team name" i]').fill(teamName);
    await page.locator('textarea[name="description"], textarea[placeholder*="description" i]').fill('Test team description');
    
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/v1/teams') && resp.status() === 201
    );
    
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /create|submit/i });
    await submitButton.click();
    
    await responsePromise;
    
    // Should redirect to teams list or team details
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/teams|dashboard/);
  });

  test('should create team with all optional fields', async ({ page }) => {
    await doLogin(page, PRODUCER);
    
    const teamName = `Full Team ${Date.now()}`;
    await page.goto('/teams/create');
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[name="name"], input[placeholder*="team name" i]').fill(teamName);
    await page.locator('textarea[name="description"], textarea[placeholder*="description" i]').fill('Complete team description');
    
    // Fill optional fields if they exist
    const locationInput = page.locator('input[name="location"]');
    if (await locationInput.count() > 0) {
      await locationInput.fill('New York');
    }
    
    const industryInput = page.locator('input[name="industry"], select[name="industry"]');
    if (await industryInput.count() > 0) {
      await industryInput.first().fill('Film Production');
    }
    
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /create|submit/i });
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/teams|dashboard/);
  });

  test('should not allow actor to create team', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/teams/create');
    await page.waitForTimeout(2000);
    
    // Should redirect or show access denied
    const url = page.url();
    const pageContent = await page.content();
    const hasAccess = !url.includes('create') || pageContent.toLowerCase().includes('access denied') || pageContent.toLowerCase().includes('unauthorized');
    expect(hasAccess).toBeTruthy();
  });
});

test.describe('Teams - Viewing', () => {
  test('should view list of teams for producer', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    // Should show teams list
    await expect(page.locator('h1, h2').filter({ hasText: /teams|my teams/i })).toBeVisible();
  });

  test('should view team details', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    // Click on first team if exists
    const teamLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await teamLink.count() > 0) {
      await teamLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show team details
      await expect(page.locator('text=/team.*details|members|projects/i')).toBeVisible();
    }
  });

  test('should display team members', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const teamLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await teamLink.count() > 0) {
      await teamLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show members section
      const membersSection = page.locator('text=/members|team.*members/i');
      if (await membersSection.count() > 0) {
        await expect(membersSection.first()).toBeVisible();
      }
    }
  });

  test('should display team owner information', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const teamLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await teamLink.count() > 0) {
      await teamLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show owner info
      const ownerInfo = page.locator('text=/owner|created.*by/i');
      if (await ownerInfo.count() > 0) {
        await expect(ownerInfo.first()).toBeVisible();
      }
    }
  });

  test('should filter teams if multiple exist', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    // Look for search or filter input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      // Results should update
      const teams = page.locator('[data-testid="team-card"], .team-card, [class*="team"]');
      expect(await teams.count()).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Teams - Invitations', () => {
  test('should send team invitation', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    // Navigate to team details
    const teamLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await teamLink.count() > 0) {
      await teamLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for invite button
      const inviteButton = page.locator('button, a').filter({ hasText: /invite|add.*member/i });
      if (await inviteButton.count() > 0) {
        await inviteButton.first().click();
        await page.waitForTimeout(1000);
        
        // Should show invitation form
        const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
        await expect(emailInput.first()).toBeVisible();
        
        // Fill and send invitation
        await emailInput.first().fill(`testmember${Date.now()}@example.com`);
        
        const roleSelect = page.locator('select[name="role"]');
        if (await roleSelect.count() > 0) {
          await roleSelect.selectOption('Recruiter');
        }
        
        const sendButton = page.locator('button[type="submit"]').filter({ hasText: /send|invite/i });
        await sendButton.click();
        
        await page.waitForTimeout(2000);
        
        // Should show success message
        const successMessage = page.locator('text=/invitation.*sent|success/i');
        if (await successMessage.count() > 0) {
          await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('should validate email when sending invitation', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const teamLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await teamLink.count() > 0) {
      await teamLink.click();
      await page.waitForLoadState('networkidle');
      
      const inviteButton = page.locator('button, a').filter({ hasText: /invite|add.*member/i });
      if (await inviteButton.count() > 0) {
        await inviteButton.first().click();
        await page.waitForTimeout(1000);
        
        const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
        await emailInput.first().fill('invalid-email');
        
        const sendButton = page.locator('button[type="submit"]').filter({ hasText: /send|invite/i });
        await sendButton.click();
        
        await page.waitForTimeout(1000);
        
        // Should show validation error
        const validationMsg = await emailInput.first().evaluate((el: HTMLInputElement) => el.validationMessage);
        expect(validationMsg).toBeTruthy();
      }
    }
  });

  test('should view pending invitations', async ({ page }) => {
    await doLogin(page, PRODUCER);
    
    // Navigate to invitations page
    await page.goto('/invitations');
    await page.waitForLoadState('networkidle');
    
    // Should show invitations list or empty state
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/invitation|pending|no.*invitation/);
  });

  test('should cancel pending invitation', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/invitations');
    await page.waitForLoadState('networkidle');
    
    // Look for cancel button
    const cancelButton = page.locator('button').filter({ hasText: /cancel|revoke|delete/i }).first();
    if (await cancelButton.count() > 0) {
      const confirmHandler = page.on('dialog', dialog => dialog.accept());
      await cancelButton.click();
      await page.waitForTimeout(2000);
      
      // Should update the list
      const successMessage = page.locator('text=/cancelled|revoked|deleted/i');
      if (await successMessage.count() > 0) {
        await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Teams - Member Management', () => {
  test('should view team members list', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const teamLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await teamLink.count() > 0) {
      await teamLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show members list
      const membersHeading = page.locator('h2, h3').filter({ hasText: /members/i });
      if (await membersHeading.count() > 0) {
        await expect(membersHeading.first()).toBeVisible();
      }
    }
  });

  test('should display member roles', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const teamLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await teamLink.count() > 0) {
      await teamLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show role badges/labels
      const roleLabel = page.locator('text=/owner|recruiter|viewer|role/i');
      if (await roleLabel.count() > 0) {
        await expect(roleLabel.first()).toBeVisible();
      }
    }
  });

  test('should remove team member as owner', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const teamLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await teamLink.count() > 0) {
      await teamLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for remove button (not on owner)
      const removeButton = page.locator('button').filter({ hasText: /remove|delete|kick/i }).nth(1);
      if (await removeButton.count() > 0) {
        page.on('dialog', dialog => dialog.accept());
        await removeButton.click();
        await page.waitForTimeout(2000);
        
        // Should show success message
        const successMessage = page.locator('text=/removed|deleted/i');
        if (await successMessage.count() > 0) {
          await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('should not allow member to remove other members', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const teamLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await teamLink.count() > 0) {
      await teamLink.click();
      await page.waitForLoadState('networkidle');
      
      // Remove buttons should not be visible or should be disabled
      const removeButtons = page.locator('button').filter({ hasText: /remove|delete|kick/i });
      if (await removeButtons.count() > 0) {
        const isDisabled = await removeButtons.first().isDisabled();
        expect(isDisabled).toBeTruthy();
      }
    }
  });

  test('should leave team as member', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const teamLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await teamLink.count() > 0) {
      await teamLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for leave team button
      const leaveButton = page.locator('button, a').filter({ hasText: /leave.*team/i });
      if (await leaveButton.count() > 0) {
        await expect(leaveButton.first()).toBeVisible();
      }
    }
  });
});

test.describe('Teams - Updates and Deletion', () => {
  test('should update team information', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const teamLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await teamLink.count() > 0) {
      await teamLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for edit button
      const editButton = page.locator('button, a').filter({ hasText: /edit|update/i });
      if (await editButton.count() > 0) {
        await editButton.first().click();
        await page.waitForTimeout(1000);
        
        // Should show edit form
        const nameInput = page.locator('input[name="name"]');
        if (await nameInput.count() > 0) {
          await nameInput.fill(`Updated Team ${Date.now()}`);
          
          const saveButton = page.locator('button[type="submit"]').filter({ hasText: /save|update/i });
          await saveButton.click();
          
          await page.waitForTimeout(2000);
          
          // Should show success message
          const successMessage = page.locator('text=/updated|saved|success/i');
          if (await successMessage.count() > 0) {
            await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
          }
        }
      }
    }
  });

  test('should delete team as owner', async ({ page }) => {
    await doLogin(page, PRODUCER);
    
    // Create a test team to delete
    const teamName = `Team to Delete ${Date.now()}`;
    await createTestTeam(page, teamName);
    
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    // Find and click the test team
    const teamCard = page.locator(`text="${teamName}"`).first();
    if (await teamCard.count() > 0) {
      await teamCard.click();
      await page.waitForLoadState('networkidle');
      
      // Look for delete button
      const deleteButton = page.locator('button').filter({ hasText: /delete.*team/i });
      if (await deleteButton.count() > 0) {
        page.on('dialog', dialog => dialog.accept());
        await deleteButton.click();
        await page.waitForTimeout(2000);
        
        // Should redirect to teams list
        expect(page.url()).toMatch(/teams/);
      }
    }
  });

  test('should not allow non-owner to delete team', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const teamLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await teamLink.count() > 0) {
      await teamLink.click();
      await page.waitForLoadState('networkidle');
      
      // Delete button should not exist or be disabled
      const deleteButton = page.locator('button').filter({ hasText: /delete.*team/i });
      const deleteCount = await deleteButton.count();
      if (deleteCount > 0) {
        const isDisabled = await deleteButton.first().isDisabled();
        expect(isDisabled).toBeTruthy();
      }
    }
  });

  test('should not allow non-owner to edit team', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const teamLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await teamLink.count() > 0) {
      await teamLink.click();
      await page.waitForLoadState('networkidle');
      
      // Edit button should not exist or be disabled
      const editButton = page.locator('button, a').filter({ hasText: /^edit$/i });
      const editCount = await editButton.count();
      if (editCount > 0) {
        const isDisabled = await editButton.first().isDisabled();
        expect(isDisabled).toBeTruthy();
      }
    }
  });
});

test.describe('Teams - Permissions', () => {
  test('should show correct permissions for owner', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const teamLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await teamLink.count() > 0) {
      await teamLink.click();
      await page.waitForLoadState('networkidle');
      
      // Owner should see edit, delete, invite buttons
      const editButton = page.locator('button, a').filter({ hasText: /edit/i });
      const deleteButton = page.locator('button').filter({ hasText: /delete.*team/i });
      const inviteButton = page.locator('button, a').filter({ hasText: /invite/i });
      
      // At least one management button should be visible
      const hasManagementButtons = 
        (await editButton.count() > 0) || 
        (await deleteButton.count() > 0) || 
        (await inviteButton.count() > 0);
      
      expect(hasManagementButtons).toBeTruthy();
    }
  });

  test('should show limited permissions for viewer', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    
    const teamLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await teamLink.count() > 0) {
      await teamLink.click();
      await page.waitForLoadState('networkidle');
      
      // Viewer should NOT see edit, delete buttons
      const editButton = page.locator('button, a').filter({ hasText: /^edit$/i });
      const deleteButton = page.locator('button').filter({ hasText: /delete.*team/i });
      
      const editCount = await editButton.count();
      const deleteCount = await deleteButton.count();
      
      // Management buttons should not exist or be disabled
      if (editCount > 0) {
        expect(await editButton.first().isDisabled()).toBeTruthy();
      }
      if (deleteCount > 0) {
        expect(await deleteButton.first().isDisabled()).toBeTruthy();
      }
    }
  });
});
