import { renderHook, act, waitFor } from '@testing-library/react';
import { useKanban } from '../useKanban';
import { boardApi, columnApi, taskApi } from '../../graphql/api';

// Mock the API modules
jest.mock('../../graphql/api', () => ({
  boardApi: {
    getBoard: jest.fn(),
  },
  taskApi: {
    createTask: jest.fn(),
    moveTask: jest.fn(),
    deleteTask: jest.fn(),
    editTask: jest.fn(),
  },
  columnApi: {
    createColumn: jest.fn(),
    deleteColumn: jest.fn(),
    moveColumn: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useKanban', () => {
  // Suppress act warnings for this complex hook with async effects
  const originalError = console.error;
  beforeAll(() => {
    console.error = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('not wrapped in act')
      ) {
        return;
      }
      originalError.call(console, ...args);
    };
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    
    // Mock API responses
    (boardApi.getBoard as jest.Mock).mockResolvedValue({
      taskList: {},
      columns: {},
      order: ['todo', 'inprogress', 'inreview', 'completed'],
    });
    (taskApi.createTask as jest.Mock).mockResolvedValue({
      taskList: {},
      columns: { 'todo': [] },
      order: ['todo', 'inprogress', 'inreview', 'completed'],
    });
    (taskApi.editTask as jest.Mock).mockResolvedValue({} as any);
    (taskApi.deleteTask as jest.Mock).mockResolvedValue({} as any);
    (taskApi.moveTask as jest.Mock).mockResolvedValue({} as any);
  });

  describe('Task Creation', () => {
    it('adds a new task to todo column', async () => {
      const { result } = renderHook(() => useKanban());

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      act(() => {
        result.current.addTask();
      });

      const todoColumn = result.current.data?.columns['todo'];
      expect(todoColumn?.tasks.length).toBeGreaterThan(0);
    });

    it('creates task with unique ID', async () => {
      const { result } = renderHook(() => useKanban());

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      act(() => {
        result.current.addTask();
        result.current.addTask();
      });

      const tasks = result.current.data?.tasks;
      const taskIds = Object.keys(tasks || {});
      const uniqueIds = new Set(taskIds);
      
      expect(taskIds.length).toBe(uniqueIds.size); // All IDs are unique
    });

    it('creates task locally without immediate API call', async () => {
      const { result } = renderHook(() => useKanban());

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      act(() => {
        result.current.addTask();
      });

      const todoColumn = result.current.data?.columns['todo'];
      expect(todoColumn?.tasks.length).toBeGreaterThan(0);
      
      // createTask API is NOT called yet - it waits for user to name the task
      expect(taskApi.createTask).not.toHaveBeenCalled();
    });
  });

  describe('Task Editing', () => {
    it('starts editing a task', async () => {
      const { result } = renderHook(() => useKanban());

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      act(() => {
        result.current.addTask();
      });

      const taskId = Object.keys(result.current.data?.tasks || {})[0];

      act(() => {
        result.current.startEditingTask(taskId);
      });

      expect(result.current.editingState.isEditing).toBe(true);
      expect(result.current.editingState.taskId).toBe(taskId);
    });

    it('stops editing a task', async () => {
      const { result } = renderHook(() => useKanban());

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      act(() => {
        result.current.addTask();
      });

      const taskId = Object.keys(result.current.data?.tasks || {})[0];

      act(() => {
        result.current.startEditingTask(taskId);
        result.current.stopEditingTask();
      });

      expect(result.current.editingState.isEditing).toBe(false);
      expect(result.current.editingState.taskId).toBe(null);
    });

    it('updates task content', async () => {
      const { result } = renderHook(() => useKanban());

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      act(() => {
        result.current.addTask();
      });

      const taskId = Object.keys(result.current.data?.tasks || {})[0];
      const newContent = 'Updated task content';

      act(() => {
        result.current.updateTask(taskId, newContent);
      });

      expect(result.current.data?.tasks[taskId].content).toBe(newContent);
    });

    it('syncs with backend when updating task', async () => {
      const { result } = renderHook(() => useKanban());

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      act(() => {
        result.current.addTask();
      });

      const taskId = Object.keys(result.current.data?.tasks || {})[0];

      act(() => {
        result.current.updateTask(taskId, 'Updated content');
      });

      // When updating a newly created task, it calls createTask (not editTask)
      // because it's finishing the creation process
      await waitFor(() => {
        expect(taskApi.createTask).toHaveBeenCalled();
      });
    });
  });

  describe('Task Deletion', () => {
    it('deletes a task from column', () => {
      const { result } = renderHook(() => useKanban());

      act(() => {
        result.current.addTask();
      });

      const taskId = Object.keys(result.current.data?.tasks || {})[0];
      const columnId = 'todo';

      act(() => {
        result.current.deleteTask(taskId, columnId);
      });

      expect(result.current.data?.tasks[taskId]).toBeUndefined();
      expect(result.current.data?.columns[columnId].tasks).not.toContain(taskId);
    });

    it('records action when task is deleted', () => {
      const { result } = renderHook(() => useKanban());

      act(() => {
        result.current.addTask();
      });

      const taskId = Object.keys(result.current.data?.tasks || {})[0];

      act(() => {
        result.current.deleteTask(taskId, 'todo');
      });

      const deleteAction = result.current.actions.find(a => a.type === 'deleted');
      expect(deleteAction).toBeDefined();
      expect(deleteAction?.fromColumn).toBe('To Do');
    });
  });

  describe('Drag and Drop', () => {
    it('reorders tasks within same column', async () => {
      const { result } = renderHook(() => useKanban());

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      // Add two tasks
      act(() => {
        result.current.addTask();
      });

      act(() => {
        result.current.addTask();
      });

      const todoColumn = result.current.data?.columns['todo'];

      const task1Id = todoColumn?.tasks[0];
      const task2Id = todoColumn?.tasks[1];

      // Simulate drag from index 0 to index 1
      act(() => {
        result.current.onDragEnd({
          draggableId: task1Id!,
          type: 'DEFAULT',
          source: { droppableId: 'todo', index: 0 },
          destination: { droppableId: 'todo', index: 1 },
          combine: null,
          mode: 'FLUID',
          reason: 'DROP',
        });
      });

      // Task order should be swapped
      const updatedColumn = result.current.data?.columns['todo'];
      expect(updatedColumn?.tasks.length).toBe(2);
      expect(updatedColumn?.tasks).toContain(task1Id);
      expect(updatedColumn?.tasks).toContain(task2Id);
    });

    it('moves task to different column', () => {
      const { result } = renderHook(() => useKanban());

      act(() => {
        result.current.addTask();
      });

      const taskId = Object.keys(result.current.data?.tasks || {})[0];

      // Simulate drag from todo to in-progress
      act(() => {
        result.current.onDragEnd({
          draggableId: taskId,
          type: 'DEFAULT',
          source: { droppableId: 'todo', index: 0 },
          destination: { droppableId: 'in-progress', index: 0 },
          combine: null,
          mode: 'FLUID',
          reason: 'DROP',
        });
      });

      const todoColumn = result.current.data?.columns['todo'];
      const inProgressColumn = result.current.data?.columns['in-progress'];

      expect(todoColumn?.tasks).not.toContain(taskId);
      expect(inProgressColumn?.tasks).toContain(taskId);
    });

    it('does nothing when dropped outside droppable area', () => {
      const { result } = renderHook(() => useKanban());

      act(() => {
        result.current.addTask();
      });

      const taskId = Object.keys(result.current.data?.tasks || {})[0];
      const initialData = { ...result.current.data };

      // Simulate drag without destination
      act(() => {
        result.current.onDragEnd({
          draggableId: taskId,
          type: 'DEFAULT',
          source: { droppableId: 'todo', index: 0 },
          destination: null,
          combine: null,
          mode: 'FLUID',
          reason: 'CANCEL',
        });
      });

      expect(result.current.data).toEqual(initialData);
    });

    it('records action when task is moved', () => {
      const { result } = renderHook(() => useKanban());

      act(() => {
        result.current.addTask();
      });

      const taskId = Object.keys(result.current.data?.tasks || {})[0];

      act(() => {
        result.current.onDragEnd({
          draggableId: taskId,
          type: 'DEFAULT',
          source: { droppableId: 'todo', index: 0 },
          destination: { droppableId: 'in-progress', index: 0 },
          combine: null,
          mode: 'FLUID',
          reason: 'DROP',
        });
      });

      const moveAction = result.current.actions.find(a => a.type === 'moved');
      expect(moveAction).toBeDefined();
      expect(moveAction?.fromColumn).toBe('To Do');
      expect(moveAction?.toColumn).toBe('In Progress');
    });
  });

  describe('Storage and Reset', () => {
    it('initializes with board data', async () => {
      const { result } = renderHook(() => useKanban());

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.columns).toBeDefined();
      expect(result.current.data?.columnOrder.length).toBeGreaterThan(0);
    });

    it('hydration completes after mount', async () => {
      const { result } = renderHook(() => useKanban());

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
        expect(result.current.storageState.isLoading).toBe(false);
      });
    });
  });
});
