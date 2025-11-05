const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface BackendTask {
  id: number;
  title: string;
  description?: string;
  createdDate?: Date;
}

interface BackendBoard {
  taskList: Record<number, BackendTask>;
  columns: Record<string, number[]>;
  order: string[];
}

export const boardApi = {
  // GET /api/board - Fetch the entire board
  async getBoard(): Promise<BackendBoard> {
    const response = await fetch(`${API_BASE_URL}/board`);
    if (!response.ok) {
      throw new Error('Failed to fetch board');
    }
    const result: ApiResponse<BackendBoard> = await response.json();
    return result.data;
  }
};

export const taskApi = {
  // POST /api/task - Create a new task
  async createTask(task: BackendTask): Promise<BackendBoard> {
    const response = await fetch(`${API_BASE_URL}/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    
    const result: ApiResponse<BackendBoard> = await response.json();
    return result.data;
  },

  // PUT /api/task/move - Move a task
  async moveTask(taskId: number, index: number, currentColumn: string, newColumn: string): Promise<BackendTask> {
    const response = await fetch(`${API_BASE_URL}/task/move`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: taskId,
        index,
        currentColumn,
        newColumn
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Move task failed:', response.status, errorText);
      throw new Error(`Failed to move task: ${response.status}`);
    }
    
    const result: ApiResponse<BackendTask> = await response.json();
    return result.data;
  }
};

// Export types for use in components
export type { BackendTask, BackendBoard };
