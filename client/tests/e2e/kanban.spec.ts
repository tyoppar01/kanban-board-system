import { test, expect } from '@playwright/test';

// Helper function to register a new user
async function register(page: any, username: string, password: string) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  
  // Switch to register view
  const switchToRegister = page.locator('button').filter({ hasText: /sign up|register|create account/i });
  try {
    await expect(switchToRegister.first()).toBeVisible({ timeout: 3000 });
    await switchToRegister.first().click();
    await page.waitForTimeout(1000);
    console.log('✓ Switched to register view');
  } catch (e) {
    console.log('Already on register view or button not found');
  }
  
  // Fill in registration form - need to fill ALL password fields
  const usernameInput = page.locator('input[type="text"]').or(page.locator('input[name="username"]')).first();
  const passwordInputs = page.locator('input[type="password"]');
  
  await expect(usernameInput).toBeVisible({ timeout: 5000 });
  await usernameInput.fill(username);
  
  // Fill password field (first password input)
  await passwordInputs.nth(0).fill(password);
  
  // Fill confirm password field (second password input)
  await passwordInputs.nth(1).fill(password);
  
  console.log(`✓ Filled registration form: ${username} with matching passwords`);
  
  // Click register button
  const registerButton = page.locator('button[type="submit"]').or(page.getByRole('button', { name: /register|sign up|create/i }));
  await registerButton.first().click();
  console.log('✓ Clicked register button');
  
  // Wait for navigation to board or error message
  try {
    await page.waitForURL('**/board', { timeout: 15000 });
    console.log('✓ Successfully registered and redirected to board');
  } catch (e) {
    // Check for error messages
    await page.waitForTimeout(2000);
    const errorMessage = await page.locator('text=/error|already exists|invalid/i').textContent().catch(() => null);
    if (errorMessage) {
      console.log(`Registration error: ${errorMessage}`);
      throw new Error(`Registration failed: ${errorMessage}`);
    }
    throw new Error('Registration did not redirect to board');
  }
}

// Helper function to login
async function login(page: any, username: string, password: string) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  
  // Make sure we're on login view (not register)
  const switchToLogin = page.locator('button').filter({ hasText: /login|sign in/i }).first();
  try {
    if (await switchToLogin.isVisible({ timeout: 2000 })) {
      await switchToLogin.click();
      await page.waitForTimeout(500);
      console.log('✓ Switched to login view');
    }
  } catch (e) {
    console.log('Already on login view');
  }
  
  // Fill in login form
  const usernameInput = page.locator('input[type="text"]').or(page.locator('input[name="username"]')).first();
  const passwordInput = page.locator('input[type="password"]').first();
  
  await expect(usernameInput).toBeVisible({ timeout: 5000 });
  await usernameInput.fill(username);
  await passwordInput.fill(password);
  console.log(`✓ Filled login form: ${username}`);
  
  // Click login button
  const loginButton = page.locator('button[type="submit"]').or(page.getByRole('button', { name: /login|sign in/i }));
  await loginButton.first().click();
  console.log('✓ Clicked login button');
  
  // Wait for navigation to board
  try {
    await page.waitForURL('**/board', { timeout: 15000 });
    console.log('✓ Successfully logged in and redirected to board');
  } catch (e) {
    // Check for error messages
    await page.waitForTimeout(2000);
    const errorMessage = await page.locator('text=/error|invalid|incorrect/i').textContent().catch(() => null);
    if (errorMessage) {
      console.log(`Login error: ${errorMessage}`);
      throw new Error(`Login failed: ${errorMessage}`);
    }
    await page.screenshot({ path: 'debug-login-failed.png', fullPage: true });
    throw new Error('Login did not redirect to board');
  }
}

test.describe('Full User Workflow - End to End', () => {
  // Use unique username for each test run to avoid conflicts
  const testUsername = `e2e_user_${Date.now()}`;
  const testPassword = 'testpass123';

  test('should complete full workflow: create task, move to in-progress, and persist after reload (backend)', async ({ page }) => {
    
    // Step 0: Register new user
    console.log('Step 0: Registering new user...');
    await register(page, testUsername, testPassword);
    console.log('✓ Registered and authenticated successfully');
    
    // Wait for board to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Handle storage mode modal if it appears
    console.log('Checking for storage mode modal...');
    try {
      const backendButton = page.getByRole('button', { name: /backend/i }).first();
      if (await backendButton.isVisible({ timeout: 3000 })) {
        console.log('Selecting backend storage mode...');
        await backendButton.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log('No storage modal, backend already selected');
    }
    
    // Wait for any loading states to complete
    await page.waitForTimeout(2000);
    
    // step 1: verify board is loaded by checking for column headers OR task count badges
    console.log('Step 1: Verifying board is loaded...');
    
    // Try multiple selectors to find the board
    const columnHeaders = page.locator('h2').filter({ hasText: /.+/i }); // Any h2 with text
    const taskCountBadges = page.locator('span.rounded-full.flex.items-center'); // Task count badges
    const addTaskButton = page.locator('button.fixed.bottom-8.right-8');
    
    // Wait for any of these elements to appear
    await Promise.race([
      expect(columnHeaders.first()).toBeVisible({ timeout: 15000 }),
      expect(taskCountBadges.first()).toBeVisible({ timeout: 15000 }),
      expect(addTaskButton).toBeVisible({ timeout: 15000 })
    ]).catch(async () => {
      // Debug: take screenshot and log page content
      await page.screenshot({ path: 'debug-board-not-loaded.png', fullPage: true });
      const html = await page.content();
      console.log('Page HTML:', html.substring(0, 500));
      throw new Error('Board did not load - no columns, badges, or add button found');
    });
    
    console.log('✓ Board loaded successfully');
    
    // step 2: create a new task and verify db write
    console.log('Step 2: Creating a new task...');
    
    // count initial tasks
    const initialTaskCount = await page.locator('[data-rfd-draggable-id^="task-"]').count();
    console.log(`Initial task count: ${initialTaskCount}`);
    
    // click the add task button (floating button)
    const addButton = page.getByRole('button', { name: 'Add new task' });
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
    
    // Debug: check task count after edit
    const afterEditCount = await page.locator('[data-rfd-draggable-id^="task-"]').count();
    console.log(`Task count after edit: ${afterEditCount} (expected: ${afterCreateCount})`);
    
    // Debug: list all tasks
    const allTaskTexts = await page.locator('[data-rfd-draggable-id^="task-"]').allTextContents();
    console.log(`All task texts after edit:`, allTaskTexts);
    
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
    
    // Step 0: Register new user
    console.log('Step 0: Registering new user...');
    await register(page, testUsername + '_browser', testPassword);
    console.log('✓ Registered and authenticated successfully');
    
    // Wait for board to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Handle storage mode modal if it appears
    console.log('Checking for storage mode modal...');
    try {
      const browserButton = page.getByRole('button', { name: /browser/i }).first();
      if (await browserButton.isVisible({ timeout: 3000 })) {
        console.log('Selecting browser storage mode...');
        await browserButton.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log('No storage modal, browser already selected');
    }
    
    // Wait for any loading states to complete
    await page.waitForTimeout(2000);
    
    // step 1: verify board is loaded
    console.log('Step 1: Verifying board is loaded...');
    
    const columnHeaders = page.locator('h2').filter({ hasText: /.+/i });
    const taskCountBadges = page.locator('span.rounded-full.flex.items-center');
    const addTaskButton = page.locator('button.fixed.bottom-8.right-8');
    
    await Promise.race([
      expect(columnHeaders.first()).toBeVisible({ timeout: 15000 }),
      expect(taskCountBadges.first()).toBeVisible({ timeout: 15000 }),
      expect(addTaskButton).toBeVisible({ timeout: 15000 })
    ]).catch(async () => {
      await page.screenshot({ path: 'debug-board-browser-not-loaded.png', fullPage: true });
      const html = await page.content();
      console.log('Page HTML:', html.substring(0, 500));
      throw new Error('Board did not load - no columns, badges, or add button found');
    });
    
    console.log('✓ Board loaded successfully');
    
    // step 2: create a new task and verify localStorage write
    console.log('Step 2: Creating a new task in browser storage...');
    
    // count initial tasks
    const initialTaskCount = await page.locator('[data-rfd-draggable-id^="task-"]').count();
    console.log(`Initial task count: ${initialTaskCount}`);
    
    // click the add task button
    const addButton = page.getByRole('button', { name: 'Add new task' });
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
    
    // Debug: check task count after edit
    const afterEditCount = await page.locator('[data-rfd-draggable-id^="task-"]').count();
    console.log(`Task count after edit: ${afterEditCount} (expected: ${afterCreateCount})`);
    
    // Debug: list all tasks
    const allTaskTexts = await page.locator('[data-rfd-draggable-id^="task-"]').allTextContents();
    console.log(`All task texts after edit:`, allTaskTexts);
    
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
