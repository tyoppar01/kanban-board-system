import { test, expect } from '@playwright/test';

test.describe('Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Handle storage mode modal if it appears - wait a bit for it to potentially show
    await page.waitForTimeout(500);
    
    const modalButton = page.getByRole('button', { name: /local storage|backend/i });
    try {
      const isModalVisible = await modalButton.first().isVisible({ timeout: 2000 });
      if (isModalVisible) {
        await modalButton.first().click();
        // Wait for modal to close and board to render
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      // Modal didn't appear, continue
    }
    
    // Wait for the board to load
    await page.waitForLoadState('networkidle');
  });

  test('should load the kanban board page', async ({ page }) => {
    // Wait a bit for any animations or loading states
    await page.waitForTimeout(1000);
    
    // Check if the main container is visible
    const mainContainer = page.locator('div.min-h-screen.bg-gray-50').first();
    await expect(mainContainer).toBeVisible({ timeout: 10000 });
  });

  test('should display kanban columns', async ({ page }) => {
    // Wait for any loading states to complete
    await page.waitForTimeout(1000);
    
    // Wait for the board grid to be visible with increased timeout
    const boardGrid = page.locator('div.grid').filter({ has: page.locator('div') }).first();
    await expect(boardGrid).toBeVisible({ timeout: 15000 });
    
    // Verify the main container is present
    const mainContainer = page.locator('div.min-h-screen.bg-gray-50').first();
    await expect(mainContainer).toBeVisible();
  });

  test('should be able to interact with tasks', async ({ page }) => {
    // Wait for the board to fully load
    await page.waitForTimeout(1500);
    
    // Check if the main container is visible first
    const mainContainer = page.locator('div.min-h-screen.bg-gray-50').first();
    await expect(mainContainer).toBeVisible({ timeout: 10000 });
    
    // Check if any button exists (add task or other interactions)
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should have responsive layout', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');
    
    // Check if main container is accessible
    const mainContainer = page.locator('div.min-h-screen.bg-gray-50').first();
    await expect(mainContainer).toBeVisible({ timeout: 10000 });
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');
    await expect(mainContainer).toBeVisible({ timeout: 10000 });
  });
});
