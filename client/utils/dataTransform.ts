import { Board, Task } from '../types/kanban.types';
import { BackendBoard, BackendTask } from '../services/api';

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

  // Map backend column IDs to frontend column IDs
  const columnMapping: Record<string, string> = {
    'todo': 'todo',
    'ongoing': 'in-progress',
    'done': 'completed'
  };

  // Transform columns
  const columns: Board['columns'] = {};
  Object.entries(backendBoard.columns).forEach(([backendColumnId, taskIds]) => {
    const frontendColumnId = columnMapping[backendColumnId] || backendColumnId;
    
    const columnName = frontendColumnId === 'todo' ? 'To Do' 
                      : frontendColumnId === 'in-progress' ? 'In Progress'
                      : 'Completed';
    
    const columnColor = frontendColumnId === 'todo' ? 'blue'
                       : frontendColumnId === 'in-progress' ? 'yellow'
                       : 'green';

    columns[frontendColumnId] = {
      id: frontendColumnId,
      name: columnName,
      tasks: taskIds.map(id => `task-${id}`),
      columnColor: columnColor,
    };
  });

  // Transform order array
  const frontendOrder = backendBoard.order.map(
    backendId => columnMapping[backendId] || backendId
  );

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
