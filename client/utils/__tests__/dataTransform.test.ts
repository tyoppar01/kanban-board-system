import {
  transformBackendToFrontend,
  transformTaskToBackend,
  extractTaskNumber,
} from '../dataTransform';
import { BackendBoard } from '../../services/api';

describe('dataTransform utilities', () => {
  describe('transformBackendToFrontend', () => {
    it('transforms backend board to frontend format', () => {
      const backendBoard: BackendBoard = {
        taskList: {
          1: { id: 1, title: 'Task 1', description: 'Desc 1' },
          2: { id: 2, title: 'Task 2' },
        },
        columns: {
          todo: [1],
          ongoing: [2],
          done: [],
        },
        order: ['todo', 'ongoing', 'completed'],
      };

      const result = transformBackendToFrontend(backendBoard);

      expect(result.tasks).toEqual({
        'task-1': { id: 'task-1', content: 'Task 1' },
        'task-2': { id: 'task-2', content: 'Task 2' },
      });

      expect(result.columns['todo']).toEqual({
        id: 'todo',
        name: 'Todo',
        tasks: ['task-1'],
        columnColor: 'blue',
      });

      expect(result.columns['ongoing']).toEqual({
        id: 'ongoing',
        name: 'Ongoing',
        tasks: ['task-2'],
        columnColor: 'yellow',
      });

      expect(result.columns['completed']).toEqual({
        id: 'completed',
        name: 'Completed',
        tasks: [],
        columnColor: 'green',
      });

      expect(result.columnOrder).toEqual(['todo', 'ongoing', 'completed']);
    });

    it('handles empty board', () => {
      const backendBoard: BackendBoard = {
        taskList: {},
        columns: {
          todo: [],
          ongoing: [],
          done: [],
        },
        order: ['todo', 'ongoing', 'completed'],
      };

      const result = transformBackendToFrontend(backendBoard);

      expect(result.tasks).toEqual({});
      expect(result.columns['todo'].tasks).toEqual([]);
      expect(result.columns['ongoing'].tasks).toEqual([]);
      expect(result.columns['completed'].tasks).toEqual([]);
    });

    it('handles multiple tasks in same column', () => {
      const backendBoard: BackendBoard = {
        taskList: {
          1: { id: 1, title: 'Task 1' },
          2: { id: 2, title: 'Task 2' },
          3: { id: 3, title: 'Task 3' },
        },
        columns: {
          todo: [1, 2, 3],
          ongoing: [],
          done: [],
        },
        order: ['todo', 'ongoing', 'done'],
      };

      const result = transformBackendToFrontend(backendBoard);

      expect(result.columns['todo'].tasks).toEqual(['task-1', 'task-2', 'task-3']);
    });

    it('preserves task order within columns', () => {
      const backendBoard: BackendBoard = {
        taskList: {
          5: { id: 5, title: 'Task 5' },
          3: { id: 3, title: 'Task 3' },
          7: { id: 7, title: 'Task 7' },
        },
        columns: {
          todo: [5, 3, 7],
          ongoing: [],
          done: [],
        },
        order: ['todo', 'ongoing', 'done'],
      };

      const result = transformBackendToFrontend(backendBoard);

      expect(result.columns['todo'].tasks).toEqual(['task-5', 'task-3', 'task-7']);
    });

    it('handles tasks with special characters in title', () => {
      const backendBoard: BackendBoard = {
        taskList: {
          1: { id: 1, title: 'Task with "quotes" & <tags>' },
        },
        columns: {
          todo: [1],
          ongoing: [],
          done: [],
        },
        order: ['todo', 'ongoing', 'done'],
      };

      const result = transformBackendToFrontend(backendBoard);

      expect(result.tasks['task-1'].content).toBe('Task with "quotes" & <tags>');
    });
  });

  describe('transformTaskToBackend', () => {
    it('converts frontend task to backend format', () => {
      const result = transformTaskToBackend('task-5', 'My Task', 5);

      expect(result.id).toBe(5);
      expect(result.title).toBe('My Task');
      expect(result.description).toBe('');
      expect(result.createdDate).toBeInstanceOf(Date);
    });

    it('handles empty content', () => {
      const result = transformTaskToBackend('task-1', '', 1);

      expect(result.title).toBe('');
    });

    it('handles special characters', () => {
      const result = transformTaskToBackend('task-10', 'Task with <html> & "quotes"', 10);

      expect(result.title).toBe('Task with <html> & "quotes"');
    });

    it('uses provided counter as task ID', () => {
      const result1 = transformTaskToBackend('task-1', 'Task 1', 100);
      const result2 = transformTaskToBackend('task-2', 'Task 2', 200);

      expect(result1.id).toBe(100);
      expect(result2.id).toBe(200);
    });
  });

  describe('extractTaskNumber', () => {
    it('extracts number from task ID', () => {
      expect(extractTaskNumber('task-1')).toBe(1);
      expect(extractTaskNumber('task-42')).toBe(42);
      expect(extractTaskNumber('task-999')).toBe(999);
    });

    it('handles single digit numbers', () => {
      expect(extractTaskNumber('task-5')).toBe(5);
    });

    it('handles large numbers', () => {
      expect(extractTaskNumber('task-123456')).toBe(123456);
    });

    it('returns NaN for invalid format', () => {
      expect(extractTaskNumber('invalid')).toBeNaN();
      expect(extractTaskNumber('task-')).toBeNaN();
    });
  });
});
