import { gql } from '@apollo/client';
import { boardApi, taskApi, columnApi } from '../api';

// Mock Apollo Client
jest.mock('../apolloClient', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    mutate: jest.fn(),
  },
}));

import client from '../apolloClient';

describe('GraphQL API - boardApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBoard', () => {
    it('should fetch board successfully', async () => {
      const mockBoard = {
        taskList: [
          { id: 1, title: 'Task 1', description: 'Description 1', createdDate: new Date() }
        ],
        columns: [
          { id: 'todo', taskIds: [1] }
        ],
        order: ['todo', 'in-progress', 'completed']
      };

      (client.query as jest.Mock).mockResolvedValue({
        data: { board: mockBoard }
      });

      const result = await boardApi.getBoard();

      expect(client.query).toHaveBeenCalledWith({
        query: expect.any(Object),
        fetchPolicy: 'network-only'
      });
      expect(result).toBeDefined();
      expect(result.order).toEqual(['todo', 'in-progress', 'completed']);
    });

    it('should handle loading state', async () => {
      const mockBoard = {
        taskList: [{ id: 1, title: 'Task', description: '', createdDate: new Date() }],
        columns: [{ id: 'todo', taskIds: [1] }],
        order: ['todo']
      };
      
      (client.query as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { board: mockBoard } }), 100))
      );

      const promise = boardApi.getBoard();
      expect(promise).toBeInstanceOf(Promise);
      await promise;
    });

    it('should handle error when fetching board fails', async () => {
      const mockError = new Error('Network error');
      (client.query as jest.Mock).mockRejectedValue(mockError);

      await expect(boardApi.getBoard()).rejects.toThrow('Network error');
    });

    it('should handle empty board data', async () => {
      (client.query as jest.Mock).mockResolvedValue({
        data: { board: { taskList: [], columns: [], order: [] } }
      });

      const result = await boardApi.getBoard();
      expect(result.taskList).toEqual({});
      expect(result.columns).toEqual({});
      expect(result.order).toEqual([]);
    });
  });
});

describe('GraphQL API - taskApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create task successfully', async () => {
      const newTask = { id: 1, title: 'New Task', description: 'Test', createdDate: new Date() };
      const mockBoard = {
        taskList: [newTask],
        columns: [{ id: 'todo', taskIds: [1] }],
        order: ['todo']
      };
      
      (client.mutate as jest.Mock).mockResolvedValue({
        data: { addTask: newTask }
      });
      
      (client.query as jest.Mock).mockResolvedValue({
        data: { board: mockBoard }
      });

      const result = await taskApi.createTask(newTask);

      expect(client.mutate).toHaveBeenCalledWith({
        mutation: expect.any(Object),
        variables: { task: expect.objectContaining({ id: 1, title: 'New Task' }) }
      });
      expect(result).toBeDefined();
      expect(result.taskList).toBeDefined();
    });

    it('should handle error when creating task fails', async () => {
      const mockError = new Error('Mutation error');
      (client.mutate as jest.Mock).mockRejectedValue(mockError);

      await expect(taskApi.createTask({ id: 1, title: 'Task' })).rejects.toThrow();
    });

    it('should handle validation error', async () => {
      (client.mutate as jest.Mock).mockRejectedValue(
        new Error('GraphQL error: Title is required')
      );

      await expect(taskApi.createTask({ id: 1, title: '' })).rejects.toThrow();
    });
  });

  describe('moveTask', () => {
    it('should move task successfully', async () => {
      (client.mutate as jest.Mock).mockResolvedValue({
        data: { relocateTask: true }
      });

      const result = await taskApi.moveTask(1, 0, 'todo', 'in-progress');

      expect(client.mutate).toHaveBeenCalledWith({
        mutation: expect.any(Object),
        variables: {
          taskId: 1,
          index: 0,
          currCol: 'todo',
          destCol: 'in-progress'
        }
      });
      // moveTask returns a BackendTask object, not boolean
      expect(result).toHaveProperty('id', 1);
    });

    it('should handle error when moving task fails', async () => {
      (client.mutate as jest.Mock).mockRejectedValue(new Error('Move failed'));

      await expect(taskApi.moveTask(1, 0, 'todo', 'done')).rejects.toThrow('Move failed');
    });

    it('should handle invalid column names', async () => {
      (client.mutate as jest.Mock).mockRejectedValue(
        new Error('GraphQL error: Column not found')
      );

      await expect(taskApi.moveTask(1, 0, 'invalid', 'invalid2')).rejects.toThrow();
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      (client.mutate as jest.Mock).mockResolvedValue({
        data: { removeTask: { id: 1, title: 'Deleted Task' } }
      });

      const result = await taskApi.deleteTask(1, 'todo');

      expect(client.mutate).toHaveBeenCalledWith({
        mutation: expect.any(Object),
        variables: { id: 1, column: 'todo' }
      });
      // deleteTask returns BackendTask object, not boolean
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('title', 'Deleted Task');
    });

    it('should handle error when deleting task fails', async () => {
      (client.mutate as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      await expect(taskApi.deleteTask(1, 'todo')).rejects.toThrow('Delete failed');
    });

    it('should handle task not found error', async () => {
      (client.mutate as jest.Mock).mockRejectedValue(
        new Error('GraphQL error: Task not found')
      );

      await expect(taskApi.deleteTask(999, 'todo')).rejects.toThrow();
    });
  });

  describe('editTask', () => {
    it('should edit task successfully', async () => {
      const updatedTask = { id: 1, title: 'Updated', description: 'New desc' };
      
      (client.mutate as jest.Mock).mockResolvedValue({
        data: { editTask: true }
      });

      const result = await taskApi.editTask(updatedTask);

      expect(client.mutate).toHaveBeenCalledWith({
        mutation: expect.any(Object),
        variables: { 
          task: expect.objectContaining({
            id: 1,
            title: 'Updated',
            description: 'New desc'
          })
        }
      });
      expect(result).toBe(true);
    });

    it('should handle error when editing task fails', async () => {
      (client.mutate as jest.Mock).mockRejectedValue(new Error('Edit failed'));

      await expect(taskApi.editTask({ id: 1, title: 'Test' })).rejects.toThrow('Edit failed');
    });
  });
});

describe('GraphQL API - columnApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addColumn', () => {
    it('should add column successfully', async () => {
      const mockBoard = {
        taskList: [],
        columns: [{ id: 'new-column', taskIds: [] }],
        order: ['todo', 'in-progress', 'completed', 'new-column']
      };

      (client.mutate as jest.Mock).mockResolvedValue({
        data: { addColumn: mockBoard }
      });

      const result = await columnApi.addColumn('New Column');

      expect(client.mutate).toHaveBeenCalledWith({
        mutation: expect.any(Object),
        variables: { name: 'New Column' }
      });
      expect(result.order).toContain('new-column');
    });

    it('should handle error when adding column fails', async () => {
      (client.mutate as jest.Mock).mockRejectedValue(new Error('Add column failed'));

      await expect(columnApi.addColumn('Test')).rejects.toThrow('Add column failed');
    });

    it('should handle duplicate column name', async () => {
      (client.mutate as jest.Mock).mockRejectedValue(
        new Error('GraphQL error: Column already exists')
      );

      await expect(columnApi.addColumn('todo')).rejects.toThrow();
    });
  });

  describe('deleteColumn', () => {
    it('should delete column successfully', async () => {
      const mockBoard = {
        taskList: [{ id: 1, title: 'New Task', description: 'Test', createdDate: new Date() }],
        columns: [{ id: 'todo', taskIds: [1] }],
        order: ['todo']
      };
      
      (client.mutate as jest.Mock).mockResolvedValue({
        data: { removeColumn: true }
      });
      
      (client.query as jest.Mock).mockResolvedValue({
        data: { board: mockBoard }
      });

      const result = await columnApi.deleteColumn('old-column');

      expect(client.mutate).toHaveBeenCalledWith({
        mutation: expect.any(Object),
        variables: { name: 'old-column' }
      });
      // deleteColumn returns BackendBoard after fetching updated board
      expect(result).toHaveProperty('taskList');
      expect(result).toHaveProperty('columns');
      expect(result).toHaveProperty('order');
    });

    it('should handle error when deleting column fails', async () => {
      (client.mutate as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      await expect(columnApi.deleteColumn('test')).rejects.toThrow('Delete failed');
    });
  });

  describe('moveColumn', () => {
    it('should move column successfully', async () => {
      const mockBoard = {
        taskList: [{ id: 1, title: 'Task', description: 'Test', createdDate: new Date() }],
        columns: [{ id: 'todo', taskIds: [1] }, { id: 'done', taskIds: [] }],
        order: ['done', 'todo']
      };
      
      (client.mutate as jest.Mock).mockResolvedValue({
        data: { moveColumn: true }
      });
      
      (client.query as jest.Mock).mockResolvedValue({
        data: { board: mockBoard }
      });

      const result = await columnApi.moveColumn('in-progress', 2);

      expect(client.mutate).toHaveBeenCalledWith({
        mutation: expect.any(Object),
        variables: { name: 'in-progress', destIndex: 2 }
      });
      // moveColumn returns BackendBoard after fetching updated board
      expect(result).toHaveProperty('taskList');
      expect(result).toHaveProperty('columns');
      expect(result).toHaveProperty('order');
      expect(result.order).toEqual(['done', 'todo']);
    });

    it('should handle error when moving column fails', async () => {
      (client.mutate as jest.Mock).mockRejectedValue(new Error('Move failed'));

      await expect(columnApi.moveColumn('test', 1)).rejects.toThrow('Move failed');
    });

    it('should handle invalid index', async () => {
      (client.mutate as jest.Mock).mockRejectedValue(
        new Error('GraphQL error: Invalid index')
      );

      await expect(columnApi.moveColumn('todo', -1)).rejects.toThrow();
    });
  });
});

describe('GraphQL API - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle network timeout', async () => {
    (client.query as jest.Mock).mockRejectedValue(new Error('Network timeout'));

    await expect(boardApi.getBoard()).rejects.toThrow('Network timeout');
  });

  it('should handle GraphQL errors', async () => {
    const error = new Error('Invalid input');
    (error as any).graphQLErrors = [{ message: 'Invalid input' }];
    
    (client.mutate as jest.Mock).mockRejectedValue(error);

    await expect(taskApi.createTask({ id: 1, title: '' })).rejects.toThrow('Invalid input');
  });

  it('should handle network errors', async () => {
    const error = new Error('Failed to fetch');
    (error as any).networkError = { message: 'Failed to fetch' };
    
    (client.query as jest.Mock).mockRejectedValue(error);

    await expect(boardApi.getBoard()).rejects.toThrow('Failed to fetch');
  });
});

describe('GraphQL API - Loading States', () => {
  it('should handle sequential mutations', async () => {
    const mockBoard = {
      taskList: [],
      columns: [],
      order: []
    };
    
    (client.mutate as jest.Mock).mockResolvedValue({
      data: { addTask: { id: 1 } }
    });
    
    (client.query as jest.Mock).mockResolvedValue({
      data: { board: mockBoard }
    });

    await taskApi.createTask({ id: 1, title: 'Task 1' });
    await taskApi.createTask({ id: 2, title: 'Task 2' });

    expect(client.mutate).toHaveBeenCalledTimes(2);
  });
});
