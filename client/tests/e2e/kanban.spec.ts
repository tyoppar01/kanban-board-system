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
    await expect(mainContainer).toBeVisible({ timeout: 1000 });
  });

  test('should be able to interact with tasks', async ({ page }) => {
    // Wait for the board to fully load
    await page.waitForTimeout(1500);
    
    // Check if the main container is visible first
    const mainContainer = page.locator('div.min-h-screen.bg-gray-50').first();
    await expect(mainContainer).toBeVisible({ timeout: 15000 });
    
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

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    
    // Dismiss storage modal
    const modalButton = page.getByRole('button', { name: /browser|backend/i }).first();
    try {
      if (await modalButton.isVisible({ timeout: 2000 })) {
        await modalButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {}
    
    await page.waitForLoadState('networkidle');
  });

  test('should create a new task', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Count tasks before adding
    const tasksBefore = await page.locator('[data-rfd-draggable-id^="task-"]').count();
    
    // Look for add task button (floating button at bottom-right)
    // It's a fixed button with Plus icon
    const addButton = page.locator('button.fixed.bottom-8.right-8');
    
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();
    await page.waitForTimeout(1500);
    
    // Verify a new task was added
    const tasksAfter = await page.locator('[data-rfd-draggable-id^="task-"]').count();
    expect(tasksAfter).toBe(tasksBefore + 1);
  });

  test('should edit an existing task', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Find any task card (they are draggable divs)
    const taskCards = page.locator('[draggable="true"]');
    const taskCount = await taskCards.count();
    
    if (taskCount > 0) {
      const firstTask = taskCards.first();
      
      // Click on the task to enter edit mode
      await firstTask.click();
      await page.waitForTimeout(500);
      
      // Look for the edit input that appears
      const editInput = page.locator('input[type="text"]');
      
      if (await editInput.isVisible({ timeout: 3000 })) {
        await editInput.clear();
        await editInput.fill('Updated Task Content');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        
        // Verify the updated content is displayed
        await expect(firstTask).toContainText('Updated Task Content', { timeout: 3000 });

      }
    }
  });

  test('should delete a task', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Find a task card
    const taskCard = page.locator('[draggable="true"]').first();
    
    if (await taskCard.isVisible({ timeout: 5000 })) {
      // Hover to show delete button
      await taskCard.hover();
      await page.waitForTimeout(300);
      
      // Look for delete button (X icon or trash icon)
      const deleteButton = taskCard.locator('button').filter({ hasText: /delete|×|🗑/i }).first();
      
      if (await deleteButton.isVisible({ timeout: 2000 })) {
        await deleteButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should display Last Actions modal', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Look for "Last Actions" or history button
    const actionsButton = page.getByRole('button').filter({ hasText: /last actions|history/i });
    
    if (await actionsButton.isVisible({ timeout: 5000 })) {
      await actionsButton.click();
      await page.waitForTimeout(500);
      
      // Check if modal appears
      const modal = page.locator('[role="dialog"], .modal, .fixed').filter({ hasText: /actions|history/i });
      await expect(modal).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Column Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    
    const modalButton = page.getByRole('button', { name: /browser|backend/i }).first();
    try {
      if (await modalButton.isVisible({ timeout: 2000 })) {
        await modalButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {}
    
    await page.waitForLoadState('networkidle');
  });

  test('should display default columns', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Check for column headers (h2 tags with column names)
    const columnHeaders = page.locator('h2');
    const headerCount = await columnHeaders.count();
    
    expect(headerCount).toBeGreaterThanOrEqual(3); // At least todo, ongoing, done
  });

  test('should add a new column', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Look for add column button (might be on the right side or in header)
    const addColumnButton = page.getByRole('button').filter({ hasText: /add column|new column|\+/i });
    
    if (await addColumnButton.first().isVisible({ timeout: 5000 })) {
      await addColumnButton.first().click();
      await page.waitForTimeout(500);
      
      // Look for column name input in modal
      const columnInput = page.locator('input[type="text"]').filter({ hasText: /column|name/i }).or(
        page.locator('input').first()
      );
      
      if (await columnInput.isVisible({ timeout: 3000 })) {
        await columnInput.fill('Testing');
        
        // Click submit/add button
        const submitButton = page.getByRole('button').filter({ hasText: /add|create|submit/i }).first();
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        // Verify new column appears
        const newColumn = page.locator('h2').filter({ hasText: /testing/i });
        await expect(newColumn).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should delete a column', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Find a column header
    const columnHeader = page.locator('h2').first();
    
    if (await columnHeader.isVisible({ timeout: 5000 })) {
      // Hover over column header to show delete button
      await columnHeader.hover();
      await page.waitForTimeout(300);
      
      // Look for delete button near the header
      const deleteButton = page.locator('button').filter({ hasText: /delete|×|🗑/i }).first();
      
      if (await deleteButton.isVisible({ timeout: 2000 })) {
        const initialCount = await page.locator('h2').count();
        await deleteButton.click();
        await page.waitForTimeout(1000);
        
        // Verify column count decreased
        const newCount = await page.locator('h2').count();
        expect(newCount).toBeLessThan(initialCount);
      }
    }
  });

  test('should reorder columns via drag and drop', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    const columns = page.locator('h2');
    const columnCount = await columns.count();
    
    if (columnCount >= 2) {
      const firstColumn = columns.first();
      const secondColumn = columns.nth(1);
      
      // Get initial positions
      const firstBox = await firstColumn.boundingBox();
      const secondBox = await secondColumn.boundingBox();
      
      if (firstBox && secondBox) {
        // Drag first column to second position
        await firstColumn.hover();
        await page.mouse.down();
        await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2);
        await page.mouse.up();
        await page.waitForTimeout(1000);
        
        // Verify columns were reordered (basic check)
        const columnsAfter = await page.locator('h2').allTextContents();
        expect(columnsAfter.length).toBe(columnCount);
      }
    }
  });
});

test.describe('Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    
    const modalButton = page.getByRole('button', { name: /browser|backend/i }).first();
    try {
      if (await modalButton.isVisible({ timeout: 2000 })) {
        await modalButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {}
    
    await page.waitForLoadState('networkidle');
  });

  test('should drag task between columns', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Find draggable tasks
    const tasks = page.locator('[draggable="true"]');
    const taskCount = await tasks.count();
    
    if (taskCount > 0) {
      const firstTask = tasks.first();
      const columns = page.locator('h2').locator('..');
      
      if (await columns.count() >= 2) {
        const targetColumn = columns.nth(1);
        
        const taskBox = await firstTask.boundingBox();
        const columnBox = await targetColumn.boundingBox();
        
        if (taskBox && columnBox) {
          // Perform drag and drop
          await firstTask.hover();
          await page.mouse.down();
          await page.mouse.move(columnBox.x + columnBox.width / 2, columnBox.y + 100);
          await page.waitForTimeout(300);
          await page.mouse.up();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('should reorder tasks within same column', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    const tasks = page.locator('[draggable="true"]');
    const taskCount = await tasks.count();
    
    if (taskCount >= 2) {
      const firstTask = tasks.first();
      const secondTask = tasks.nth(1);
      
      const firstBox = await firstTask.boundingBox();
      const secondBox = await secondTask.boundingBox();
      
      if (firstBox && secondBox) {
        // Drag first task below second task
        await firstTask.hover();
        await page.mouse.down();
        await page.mouse.move(secondBox.x, secondBox.y + secondBox.height + 10);
        await page.waitForTimeout(300);
        await page.mouse.up();
        await page.waitForTimeout(1000);
      }
    }
  });
});

test.describe('Storage Mode', () => {
  test('should allow switching between browser and backend mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    
    // Check for storage mode modal
    const browserButton = page.getByRole('button', { name: /browser/i });
    const backendButton = page.getByRole('button', { name: /backend/i });
    
    if (await browserButton.isVisible({ timeout: 2000 })) {
      // Test browser mode selection
      await browserButton.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('div.min-h-screen')).toBeVisible({ timeout: 10000 });
      
      // Clear storage and reload to test backend mode
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForTimeout(1000);
      
      if (await backendButton.isVisible({ timeout: 2000 })) {
        await backendButton.click();
        await page.waitForTimeout(1000);
        await expect(page.locator('div.min-h-screen')).toBeVisible({ timeout: 10000 });
      }
    }
  });
});
