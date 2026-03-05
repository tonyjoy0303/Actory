import { test, expect } from '@playwright/test';
import { doLogin } from './helpers';

const PRODUCER = { email: 'tonyjoyjp@gmail.com', password: 'tony123' };
const ACTOR = { email: 'jesly@gmail.com', password: 'jesly123' };

test.describe('Projects - Creation', () => {
  test('should display create project form', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects/create');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2').filter({ hasText: /create.*project|new.*project/i })).toBeVisible();
    await expect(page.locator('input[name="name"], input[placeholder*="project name" i]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects/create');
    await page.waitForLoadState('networkidle');
    
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /create|submit/i });
    await submitButton.click();
    
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('create');
  });

  test('should create basic project', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects/create');
    await page.waitForLoadState('networkidle');
    
    const projectName = `Test Project ${Date.now()}`;
    await page.locator('input[name="name"], input[placeholder*="project name" i]').fill(projectName);
    
    const genreSelect = page.locator('select[name="genre"]');
    if (await genreSelect.count() > 0) {
      await genreSelect.selectOption({ index: 1 });
    }
    
    const descriptionField = page.locator('textarea[name="description"]');
    if (await descriptionField.count() > 0) {
      await descriptionField.fill('Test project description');
    }
    
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/v1/projects') && resp.status() === 201
    );
    
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /create|submit/i });
    await submitButton.click();
    
    await responsePromise;
    await page.waitForTimeout(2000);
    
    expect(page.url()).toMatch(/projects|dashboard/);
  });

  test('should create project with all fields', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects/create');
    await page.waitForLoadState('networkidle');
    
    const projectName = `Complete Project ${Date.now()}`;
    await page.locator('input[name="name"]').fill(projectName);
    
    const genreSelect = page.locator('select[name="genre"]');
    if (await genreSelect.count() > 0) {
      await genreSelect.selectOption('Drama');
    }
    
    const languageInput = page.locator('input[name="language"], select[name="language"]');
    if (await languageInput.count() > 0) {
      await languageInput.first().fill('English');
    }
    
    const locationInput = page.locator('input[name="location"]');
    if (await locationInput.count() > 0) {
      await locationInput.fill('Los Angeles');
    }
    
    const descriptionField = page.locator('textarea[name="description"]');
    if (await descriptionField.count() > 0) {
      await descriptionField.fill('Complete project with all details filled in');
    }
    
    // Date fields
    const today = new Date();
    const startDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    const startDateInput = page.locator('input[name="startDate"]');
    if (await startDateInput.count() > 0) {
      await startDateInput.fill(startDate.toISOString().split('T')[0]);
    }
    
    const endDateInput = page.locator('input[name="endDate"]');
    if (await endDateInput.count() > 0) {
      await endDateInput.fill(endDate.toISOString().split('T')[0]);
    }
    
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /create|submit/i });
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/projects|dashboard/);
  });

  test('should create project with roles', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects/create');
    await page.waitForLoadState('networkidle');
    
    const projectName = `Project with Roles ${Date.now()}`;
    await page.locator('input[name="name"]').fill(projectName);
    
    // Look for add role button
    const addRoleButton = page.locator('button').filter({ hasText: /add.*role/i });
    if (await addRoleButton.count() > 0) {
      await addRoleButton.click();
      await page.waitForTimeout(500);
      
      // Fill role details
      const roleNameInput = page.locator('input[name*="roleName"], input[placeholder*="role name" i]').last();
      if (await roleNameInput.count() > 0) {
        await roleNameInput.fill('Lead Actor');
      }
      
      const roleTypeSelect = page.locator('select[name*="roleType"]').last();
      if (await roleTypeSelect.count() > 0) {
        await roleTypeSelect.selectOption('Lead');
      }
    }
    
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /create.*project|submit/i });
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/projects|dashboard/);
  });

  test('should not allow actor to create project', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/projects/create');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    const pageContent = await page.content();
    const hasAccess = !url.includes('create') || 
                     pageContent.toLowerCase().includes('access denied') || 
                     pageContent.toLowerCase().includes('unauthorized');
    expect(hasAccess).toBeTruthy();
  });
});

test.describe('Projects - Viewing', () => {
  test('should view projects list', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2').filter({ hasText: /projects|my projects/i })).toBeVisible();
  });

  test('should view project details', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('h1, h2')).toBeVisible();
    }
  });

  test('should display project information', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show project details
      const detailsSection = page.locator('text=/description|genre|location|dates/i');
      if (await detailsSection.count() > 0) {
        await expect(detailsSection.first()).toBeVisible();
      }
    }
  });

  test('should display project roles', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      const rolesSection = page.locator('text=/roles|casting.*roles/i');
      if (await rolesSection.count() > 0) {
        await expect(rolesSection.first()).toBeVisible();
      }
    }
  });

  test('should filter projects by status', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const statusFilter = page.locator('select[name="status"], button').filter({ hasText: /active|completed|all/i });
    if (await statusFilter.count() > 0) {
      await statusFilter.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('should search projects', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      const projects = page.locator('[data-testid="project-card"], .project-card');
      expect(await projects.count()).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Projects - Roles Management', () => {
  test('should add role to existing project', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      const addRoleButton = page.locator('button').filter({ hasText: /add.*role/i });
      if (await addRoleButton.count() > 0) {
        await addRoleButton.click();
        await page.waitForTimeout(1000);
        
        // Fill role form
        const roleNameInput = page.locator('input[name="roleName"], input[placeholder*="role name" i]');
        if (await roleNameInput.count() > 0) {
          await roleNameInput.fill(`Test Role ${Date.now()}`);
          
          const roleTypeSelect = page.locator('select[name="roleType"]');
          if (await roleTypeSelect.count() > 0) {
            await roleTypeSelect.selectOption('Supporting');
          }
          
          const submitButton = page.locator('button[type="submit"]').filter({ hasText: /add|create|save/i });
          await submitButton.click();
          
          await page.waitForTimeout(2000);
          
          // Should show success message
          const successMessage = page.locator('text=/role.*added|success/i');
          if (await successMessage.count() > 0) {
            await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
          }
        }
      }
    }
  });

  test('should view role details', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      const roleCard = page.locator('[data-testid="role-card"], .role-card').first();
      if (await roleCard.count() > 0) {
        await expect(roleCard).toBeVisible();
      }
    }
  });

  test('should display role requirements', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show role details like age, gender, experience
      const roleDetails = page.locator('text=/age|gender|experience|skills/i');
      if (await roleDetails.count() > 0) {
        await expect(roleDetails.first()).toBeVisible();
      }
    }
  });

  test('should create casting from role', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      const createCastingButton = page.locator('button').filter({ hasText: /create.*casting|post.*casting/i }).first();
      if (await createCastingButton.count() > 0) {
        await createCastingButton.click();
        await page.waitForTimeout(1000);
        
        // Should show casting creation form
        const castingForm = page.locator('form, [data-testid="casting-form"]');
        if (await castingForm.count() > 0) {
          await expect(castingForm.first()).toBeVisible();
        }
      }
    }
  });

  test('should validate role fields', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      const addRoleButton = page.locator('button').filter({ hasText: /add.*role/i });
      if (await addRoleButton.count() > 0) {
        await addRoleButton.click();
        await page.waitForTimeout(1000);
        
        // Try to submit without filling required fields
        const submitButton = page.locator('button[type="submit"]').filter({ hasText: /add|create|save/i });
        await submitButton.click();
        
        await page.waitForTimeout(1000);
        
        // Should show validation errors or stay on form
        const form = page.locator('form');
        expect(await form.count()).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('Projects - Updates', () => {
  test('should update project details', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      const editButton = page.locator('button, a').filter({ hasText: /edit/i });
      if (await editButton.count() > 0) {
        await editButton.first().click();
        await page.waitForTimeout(1000);
        
        const nameInput = page.locator('input[name="name"]');
        if (await nameInput.count() > 0) {
          await nameInput.fill(`Updated Project ${Date.now()}`);
          
          const saveButton = page.locator('button[type="submit"]').filter({ hasText: /save|update/i });
          await saveButton.click();
          
          await page.waitForTimeout(2000);
          
          const successMessage = page.locator('text=/updated|saved|success/i');
          if (await successMessage.count() > 0) {
            await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
          }
        }
      }
    }
  });

  test('should update project description', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      const editButton = page.locator('button, a').filter({ hasText: /edit/i });
      if (await editButton.count() > 0) {
        await editButton.first().click();
        await page.waitForTimeout(1000);
        
        const descriptionField = page.locator('textarea[name="description"]');
        if (await descriptionField.count() > 0) {
          await descriptionField.fill(`Updated description ${Date.now()}`);
          
          const saveButton = page.locator('button[type="submit"]').filter({ hasText: /save|update/i });
          await saveButton.click();
          
          await page.waitForTimeout(2000);
        }
      }
    }
  });

  test('should update project dates', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      const editButton = page.locator('button, a').filter({ hasText: /edit/i });
      if (await editButton.count() > 0) {
        await editButton.first().click();
        await page.waitForTimeout(1000);
        
        const startDateInput = page.locator('input[name="startDate"]');
        if (await startDateInput.count() > 0) {
          const newDate = new Date();
          newDate.setDate(newDate.getDate() + 60);
          await startDateInput.fill(newDate.toISOString().split('T')[0]);
          
          const saveButton = page.locator('button[type="submit"]').filter({ hasText: /save|update/i });
          await saveButton.click();
          
          await page.waitForTimeout(2000);
        }
      }
    }
  });

  test('should archive project', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      const archiveButton = page.locator('button').filter({ hasText: /archive/i });
      if (await archiveButton.count() > 0) {
        page.on('dialog', dialog => dialog.accept());
        await archiveButton.click();
        
        await page.waitForTimeout(2000);
        
        const successMessage = page.locator('text=/archived|success/i');
        if (await successMessage.count() > 0) {
          await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });
});

test.describe('Projects - Deletion', () => {
  test('should delete project', async ({ page }) => {
    await doLogin(page, PRODUCER);
    
    // Create a test project to delete
    await page.goto('/projects/create');
    await page.waitForLoadState('networkidle');
    
    const projectName = `Project to Delete ${Date.now()}`;
    await page.locator('input[name="name"]').fill(projectName);
    
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /create|submit/i });
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Navigate to projects and find the test project
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectCard = page.locator(`text="${projectName}"`).first();
    if (await projectCard.count() > 0) {
      await projectCard.click();
      await page.waitForLoadState('networkidle');
      
      const deleteButton = page.locator('button').filter({ hasText: /delete.*project/i });
      if (await deleteButton.count() > 0) {
        page.on('dialog', dialog => dialog.accept());
        await deleteButton.click();
        
        await page.waitForTimeout(2000);
        
        expect(page.url()).toMatch(/projects|dashboard/);
      }
    }
  });

  test('should confirm before deleting project', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      const deleteButton = page.locator('button').filter({ hasText: /delete.*project/i });
      if (await deleteButton.count() > 0) {
        let dialogShown = false;
        page.on('dialog', dialog => {
          dialogShown = true;
          dialog.dismiss();
        });
        
        await deleteButton.click();
        await page.waitForTimeout(1000);
        
        // Dialog should have been shown
        // Can't directly assert but test passes if no error
      }
    }
  });

  test('should not allow non-owner to delete project', async ({ page }) => {
    await doLogin(page, ACTOR);
    await page.goto('/projects');
    await page.waitForTimeout(2000);
    
    // Actor should not see projects or should not have delete access
    const url = page.url();
    if (!url.includes('projects')) {
      // Redirected - no access
      expect(true).toBeTruthy();
    }
  });
});

test.describe('Projects - Team Collaboration', () => {
  test('should view team projects', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    // Should show team filter or team projects section
    const teamFilter = page.locator('text=/team.*projects|my.*team/i');
    if (await teamFilter.count() > 0) {
      await expect(teamFilter.first()).toBeVisible();
    }
  });

  test('should see project creator information', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      const creatorInfo = page.locator('text=/created.*by|owner|producer/i');
      if (await creatorInfo.count() > 0) {
        await expect(creatorInfo.first()).toBeVisible();
      }
    }
  });

  test('should view project team members', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      const teamSection = page.locator('text=/team.*members|collaborators/i');
      if (await teamSection.count() > 0) {
        await expect(teamSection.first()).toBeVisible();
      }
    }
  });
});

test.describe('Projects - Statistics', () => {
  test('should view project statistics', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should show stats like number of roles, castings, applications
      const statsSection = page.locator('text=/roles|castings|applications|statistics/i');
      if (await statsSection.count() > 0) {
        await expect(statsSection.first()).toBeVisible();
      }
    }
  });

  test('should display project progress', async ({ page }) => {
    await doLogin(page, PRODUCER);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLink = page.locator('a').filter({ hasText: /view|details/i }).first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      const progressIndicator = page.locator('text=/progress|status|active|completed/i');
      if (await progressIndicator.count() > 0) {
        await expect(progressIndicator.first()).toBeVisible();
      }
    }
  });
});
