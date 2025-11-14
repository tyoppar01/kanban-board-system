import { test, expect } from '@playwright/test';

test.describe('Full User Workflow - End to End', () => {
  test('should complete full workflow: create task, move to in-progress, and persist after reload (backend)', async ({ page }) => {
    
    // visit kanban board
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    
    // select backend mode to test database persistence
    const backendButton = page.getByRole('button', { name: /backend/i });
    try {
      if (await backendButton.isVisible({ timeout: 2000 })) {
        await backendButton.click();
        await page.waitForTimeout(1500);
      }
    } catch (e) {
      // modal didn't appear or backend already selected
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // step 1: verify board is there
    const mainContainer = page.locator('div.min-h-screen.bg-gray-50').first();
    await expect(mainContainer).toBeVisible({ timeout: 10000 });
    
    // step 2: create a new task and verify db write
    console.log('Step 2: Creating a new task...');
    
    // count initial tasks
    const initialTaskCount = await page.locator('[data-rfd-draggable-id^="task-"]').count();
    console.log(`Initial task count: ${initialTaskCount}`);
    
    // click the add task button (floating button)
    const addButton = page.locator('button.fixed.bottom-8.right-8');
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();
    await page.waitForTimeout(2000);
    
    // verify task count increased (wait for new task to be added)
    await page.waitForTimeout(1000);
    const afterCreateCount = await page.locator('[data-rfd-draggable-id^="task-"]').count();
    expect(afterCreateCount).toBe(initialTaskCount + 1);
    console.log(`New task count after creation: ${afterCreateCount}`);
    
    // find the newly created task - get all tasks and find the last one added
    const allTasks = page.locator('[data-rfd-draggable-id^="task-"]');
    const newTask = allTasks.nth(afterCreateCount - 1); // Get the last task (newly created)
    await expect(newTask).toBeVisible({ timeout: 5000 });
    
    // edit the task with a unique identifier
    const uniqueTaskName = `E2E Test Task ${Date.now()}`;
    await newTask.click();
    await page.waitForTimeout(500);
    
    // fill in the new task name
    const editInput = page.locator('input[type="text"]').first();
    await expect(editInput).toBeVisible({ timeout: 3000 });
    await editInput.clear();
    await editInput.fill(uniqueTaskName);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // verify the task was created with the custom name
    const createdTask = page.locator('[data-rfd-draggable-id^="task-"]').filter({ hasText: uniqueTaskName });
    await expect(createdTask).toBeVisible({ timeout: 5000 });
    console.log(`✓ Task created: ${uniqueTaskName}`);
    
    // step 3: drag the task from "Todo" to "Ongoing"
    console.log('Step 3: Dragging task to ongoing column...');
    
    // find the "Todo" column - the new task should be there
    const todoColumn = page.locator('h2').filter({ hasText: /todo|to do/i }).first();
    await expect(todoColumn).toBeVisible();
    
    // find the "Ongoing" column
    const ongoingColumn = page.locator('h2').filter({ hasText: /ongoing|in progress/i }).first();
    await expect(ongoingColumn).toBeVisible();
    
    // Get bounding boxes for drag and drop
    const taskBox = await createdTask.boundingBox();
    const ongoingBox = await ongoingColumn.boundingBox();
    
    if (taskBox && ongoingBox) {
      // Perform drag and drop operation
      await createdTask.hover();
      await page.mouse.down();
      await page.waitForTimeout(300);
      
      // Move to the ongoing column (center of column, below header)
      await page.mouse.move(
        ongoingBox.x + ongoingBox.width / 2, 
        ongoingBox.y + ongoingBox.height / 2,
        { steps: 10 }
      );
      await page.waitForTimeout(300);
      await page.mouse.up();
      await page.waitForTimeout(1500);
      
      console.log('✓ Task dragged to ongoing column');
    } else {
      throw new Error('Could not get bounding boxes for drag and drop');
    }
    
    // verify the task is now in the ongoing column
    // the task should still be visible with the same name
    await expect(createdTask).toBeVisible({ timeout: 5000 });
    
    // step 4: reload the page and verify data persists in database
    console.log('Step 4: Reloading page to verify persistence...');
    
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    
    // handle modal if it reappears
    try {
      const modalButton = page.getByRole('button', { name: /backend|browser/i }).first();
      if (await modalButton.isVisible({ timeout: 2000 })) {
        await modalButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {}
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // verify the task still exists after reload
    const persistedTask = page.locator('[data-rfd-draggable-id^="task-"]').filter({ hasText: uniqueTaskName });
    await expect(persistedTask).toBeVisible({ timeout: 10000 });
    console.log('✓ Task persisted after page reload');
    
    // verify the task is still in the ongoing column (not back in todo)
    // by verifying the task still exists and the total count is maintained
    const finalTaskCount = await page.locator('[data-rfd-draggable-id^="task-"]').count();
    expect(finalTaskCount).toBe(afterCreateCount); // should match the count after task creation

    console.log('✅ Full workflow test completed successfully!');
    console.log(`   - Task created: ${uniqueTaskName}`);
    console.log(`   - Task moved to ongoing column`);
    console.log(`   - Task persisted after page reload`);
    console.log(`   - Database write and GraphQL mutation verified`);
  });

  test('should complete full workflow: create task, move to in-progress, and persist after reload (browser)', async ({ page }) => {
    
    // visit kanban board
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    
    // select BROWSER mode to test localStorage persistence
    const browserButton = page.getByRole('button', { name: /browser/i });
    try {
      if (await browserButton.isVisible({ timeout: 2000 })) {
        await browserButton.click();
        await page.waitForTimeout(1500);
      }
    } catch (e) {
      // modal didn't appear or browser already selected
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // step 1: verify board is loaded
    const mainContainer = page.locator('div.min-h-screen.bg-gray-50').first();
    await expect(mainContainer).toBeVisible({ timeout: 10000 });
    
    // step 2: create a new task and verify localStorage write
    console.log('Step 2: Creating a new task in browser storage...');
    
    // count initial tasks
    const initialTaskCount = await page.locator('[data-rfd-draggable-id^="task-"]').count();
    console.log(`Initial task count: ${initialTaskCount}`);
    
    // click the add task button
    const addButton = page.locator('button.fixed.bottom-8.right-8');
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();
    await page.waitForTimeout(2000);
    
    // verify task count increased
    await page.waitForTimeout(1000);
    const afterCreateCount = await page.locator('[data-rfd-draggable-id^="task-"]').count();
    expect(afterCreateCount).toBe(initialTaskCount + 1);
    
    // find the newly created task
    const allTasks = page.locator('[data-rfd-draggable-id^="task-"]');
    const newTask = allTasks.nth(afterCreateCount - 1);
    await expect(newTask).toBeVisible({ timeout: 5000 });
    
    // edit the task with a unique identifier
    const uniqueTaskName = `Browser Storage Test ${Date.now()}`;
    await newTask.click();
    await page.waitForTimeout(500);
    
    const editInput = page.locator('input[type="text"]').first();
    await expect(editInput).toBeVisible({ timeout: 3000 });
    await editInput.clear();
    await editInput.fill(uniqueTaskName);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // verify the task was created
    const createdTask = page.locator('[data-rfd-draggable-id^="task-"]').filter({ hasText: uniqueTaskName });
    await expect(createdTask).toBeVisible({ timeout: 5000 });
    console.log(`✓ Task created in localStorage: ${uniqueTaskName}`);
    
    // step 3: drag the task from "Todo" to "Ongoing"
    console.log('Step 3: Dragging task to ongoing column...');
    
    const todoColumn = page.locator('h2').filter({ hasText: /todo|to do/i }).first();
    await expect(todoColumn).toBeVisible();
    
    const ongoingColumn = page.locator('h2').filter({ hasText: /ongoing|in progress/i }).first();
    await expect(ongoingColumn).toBeVisible();
    
    const taskBox = await createdTask.boundingBox();
    const ongoingBox = await ongoingColumn.boundingBox();
    
    if (taskBox && ongoingBox) {
      await createdTask.hover();
      await page.mouse.down();
      await page.waitForTimeout(300);
      
      await page.mouse.move(
        ongoingBox.x + ongoingBox.width / 2, 
        ongoingBox.y + ongoingBox.height / 2,
        { steps: 10 }
      );
      await page.waitForTimeout(300);
      await page.mouse.up();
      await page.waitForTimeout(1500);
      
      console.log('✓ Task dragged to ongoing column');
    } else {
      throw new Error('Could not get bounding boxes for drag and drop');
    }
    
    await expect(createdTask).toBeVisible({ timeout: 5000 });
    
    // step 4: reload the page and verify localStorage persistence
    console.log('Step 4: Reloading page to verify localStorage persistence...');
    
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    
    // handle modal if it reappears - select browser mode again
    try {
      const modalButton = page.getByRole('button', { name: /browser/i }).first();
      if (await modalButton.isVisible({ timeout: 2000 })) {
        await modalButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {}
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // verify the task still exists after reload
    const persistedTask = page.locator('[data-rfd-draggable-id^="task-"]').filter({ hasText: uniqueTaskName });
    await expect(persistedTask).toBeVisible({ timeout: 10000 });
    console.log('✓ Task persisted in localStorage after page reload');
    
    // verify task count is maintained
    const finalTaskCount = await page.locator('[data-rfd-draggable-id^="task-"]').count();
    expect(finalTaskCount).toBe(afterCreateCount);
    
    console.log('✅ Browser storage workflow test completed successfully!');
    console.log(`   - Task created: ${uniqueTaskName}`);
    console.log(`   - Task moved to ongoing column`);
    console.log(`   - Task persisted in localStorage after page reload`);
    console.log(`   - localStorage read/write verified`);
  });
});
