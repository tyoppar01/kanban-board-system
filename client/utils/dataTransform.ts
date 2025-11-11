import { Board, Task } from '../types/kanban.types';
import { BackendBoard, BackendTask } from '../services/api';

/**
 * Convert column ID to display name
 */
export function formatColumnName(columnId: string): string {
  return columnId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Assign color to column based on column ID and order index
 */
export function getColumnColor(columnId: string, orderIndex?: number): string {
  // Default columns always get specific colors
  const defaultColors: Record<string, string> = {
    'todo': 'blue',
    'ongoing': 'yellow',
    'done': 'green',
  };
  
  if (defaultColors[columnId]) {
    return defaultColors[columnId];
  }
  
  // For custom columns, use order index if provided, otherwise hash
  const customColors = ['pink', 'teal', 'indigo', 'red'];
  
  if (orderIndex !== undefined) {
    // Count how many default columns come before this one
    const defaultColumnCount = ['todo', 'ongoing', 'done'].filter((_, idx) => idx < orderIndex).length;
    const customIndex = orderIndex - defaultColumnCount;
    return customColors[customIndex % customColors.length];
  }
  
  // Fallback to hash if no index provided
  const hash = columnId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return customColors[hash % customColors.length];
}

/**
 * Normalize column name to create a valid column ID
 */
export function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '')  // remove special characters
    .replace(/-+/g, '-')         // replace multiple hyphens with single
    .replace(/^-|-$/g, '');      // remove leading/trailing hyphens
}

/**
 * Convert backend board structure to frontend board structure
 */
export function transformBackendToFrontend(backendBoard: BackendBoard): Board {
  // Transform tasks from Record<number, BackendTask> to Record<string, Task>
  const tasks: Record<string, Task> = {};
  Object.entries(backendBoard.taskList).forEach(([id, backendTask]) => {
    tasks[`task-${id}`] = {
      id: `task-${id}`,
      content: backendTask.title,
    };
  });

  // Transform columns - use backend column IDs directly, no mapping
  const columns: Board['columns'] = {};
  
  // Use order array to get proper index for color assignment
  backendBoard.order.forEach((columnId, orderIndex) => {
    const taskIds = backendBoard.columns[columnId] || [];
    
    columns[columnId] = {
      id: columnId,
      name: formatColumnName(columnId),
      tasks: taskIds.map(id => `task-${id}`),
      columnColor: getColumnColor(columnId, orderIndex),
    };
  });

  // Use backend order directly
  const frontendOrder = backendBoard.order;

  return {
    tasks,
    columns,
    columnOrder: frontendOrder,
  };
}

/**
 * Convert frontend task to backend task format
 */
export function transformTaskToBackend(taskId: string, content: string, taskCounter: number): BackendTask {
  return {
    id: taskCounter,
    title: content,
    description: '',
    createdDate: new Date(),
  };
}

/**
 * Extract task number from task ID (e.g., 'task-1' -> 1)
 */
export function extractTaskNumber(taskId: string): number {
  return parseInt(taskId.replace('task-', ''), 10);
}

/**
 * Convert frontend column ID to backend column ID
 * Since we're not mapping anymore, just return the same ID
 */
export function frontendToBackendColumnId(frontendColumnId: string): string {
  return frontendColumnId;
}
