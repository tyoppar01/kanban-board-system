import { boardApi, taskApi, BackendTask, BackendBoard } from '../api';

// Mock fetch
global.fetch = jest.fn();

describe('API Services', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  const API_BASE_URL = 'http://localhost:8080/api';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('boardApi', () => {
    describe('getBoard', () => {
      const mockBackendBoard: BackendBoard = {
        taskList: {
          1: { id: 1, title: 'Task 1', description: 'Description 1' },
          2: { id: 2, title: 'Task 2' },
        },
        columns: {
          todo: [1],
          ongoing: [2],
          done: [],
        },
        order: ['todo', 'ongoing', 'done'],
      };

      it('fetches board successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Board fetched',
            data: mockBackendBoard,
          }),
        } as Response);

        const result = await boardApi.getBoard();

        expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/board`);
        expect(result).toEqual(mockBackendBoard);
      });

      it('throws error when fetch fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response);

        await expect(boardApi.getBoard()).rejects.toThrow('Failed to fetch board');
        expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/board`);
      });

      it('throws error when network request fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(boardApi.getBoard()).rejects.toThrow('Network error');
      });
    });
  });

  describe('taskApi', () => {
    describe('createTask', () => {
      const mockTask: BackendTask = {
        id: 1,
        title: 'New Task',
        description: 'Task description',
        createdDate: new Date(),
      };

      const mockBoardResponse: BackendBoard = {
        taskList: {
          1: mockTask,
        },
        columns: {
          todo: [1],
          ongoing: [],
          done: [],
        },
        order: ['todo', 'ongoing', 'done'],
      };

      it('creates task successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Task created',
            data: mockBoardResponse,
          }),
        } as Response);

        const result = await taskApi.createTask(mockTask);

        expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/task`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockTask),
        });
        expect(result).toEqual(mockBoardResponse);
      });

      it('throws error when creation fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
        } as Response);

        await expect(taskApi.createTask(mockTask)).rejects.toThrow('Failed to create task');
      });

      it('sends task without optional fields', async () => {
        const minimalTask: BackendTask = {
          id: 2,
          title: 'Minimal Task',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Task created',
            data: mockBoardResponse,
          }),
        } as Response);

        await taskApi.createTask(minimalTask);

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/task`,
          expect.objectContaining({
            body: JSON.stringify(minimalTask),
          })
        );
      });
    });

    describe('moveTask', () => {
      const mockTask: BackendTask = {
        id: 1,
        title: 'Moved Task',
      };

      it('moves task successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Task moved',
            data: mockTask,
          }),
        } as Response);

        const result = await taskApi.moveTask(1, 0, 'todo', 'ongoing');

        expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/task/move`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: 1,
            index: 0,
            currentColumn: 'todo',
            newColumn: 'ongoing',
          }),
        });
        expect(result).toEqual(mockTask);
      });

      it('throws error when move fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Task not found',
        } as Response);

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        await expect(taskApi.moveTask(999, 0, 'todo', 'ongoing')).rejects.toThrow(
          'Failed to move task: 404'
        );

        expect(consoleErrorSpy).toHaveBeenCalledWith('Move task failed:', 404, 'Task not found');
        consoleErrorSpy.mockRestore();
      });

      it('handles moving to same column (reorder)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Task reordered',
            data: mockTask,
          }),
        } as Response);

        await taskApi.moveTask(1, 2, 'todo', 'todo');

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/task/move`,
          expect.objectContaining({
            body: JSON.stringify({
              id: 1,
              index: 2,
              currentColumn: 'todo',
              newColumn: 'todo',
            }),
          })
        );
      });
    });

    describe('deleteTask', () => {
      const mockTask: BackendTask = {
        id: 1,
        title: 'Deleted Task',
      };

      it('deletes task successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Task deleted',
            data: mockTask,
          }),
        } as Response);

        const result = await taskApi.deleteTask(1, 'todo');

        expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/task/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: 1,
            column: 'todo',
          }),
        });
        expect(result).toEqual(mockTask);
      });

      it('throws error when deletion fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as Response);

        await expect(taskApi.deleteTask(999, 'todo')).rejects.toThrow('Failed to delete task');
      });

      it('handles deletion from different columns', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Task deleted',
            data: mockTask,
          }),
        } as Response);

        await taskApi.deleteTask(1, 'completed');

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/task/delete`,
          expect.objectContaining({
            body: JSON.stringify({
              id: 1,
              column: 'completed',
            }),
          })
        );
      });
    });

    describe('editTask', () => {
      const mockTask: BackendTask = {
        id: 1,
        title: 'Updated Task',
        description: 'Updated description',
      };

      it('edits task successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Task updated',
            data: null,
          }),
        } as Response);

        const result = await taskApi.editTask(mockTask);

        expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/task/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ task: mockTask }),
        });
        expect(result).toBe(true);
      });

      it('throws error when edit fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
        } as Response);

        await expect(taskApi.editTask(mockTask)).rejects.toThrow('Failed to edit task');
      });

      it('returns false when success is false', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: false,
            message: 'Validation error',
            data: null,
          }),
        } as Response);

        const result = await taskApi.editTask(mockTask);

        expect(result).toBe(false);
      });

      it('handles editing task title only', async () => {
        const minimalTask: BackendTask = {
          id: 1,
          title: 'New Title',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Task updated',
            data: null,
          }),
        } as Response);

        await taskApi.editTask(minimalTask);

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/task/update`,
          expect.objectContaining({
            body: JSON.stringify({ task: minimalTask }),
          })
        );
      });
    });
  });

  describe('API URL Configuration', () => {
    it('uses default API URL when env variable is not set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Board fetched',
          data: {
            taskList: {},
            columns: { todo: [], ongoing: [], done: [] },
            order: ['todo', 'ongoing', 'done'],
          },
        }),
      } as Response);

      await boardApi.getBoard();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/api/board');
    });
  });

  describe('Error Handling', () => {
    it('handles JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockRejectedValueOnce(new Error('Invalid JSON')),
      } as unknown as Response);

      await expect(boardApi.getBoard()).rejects.toThrow('Invalid JSON');
    });

    it('handles network timeout', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(taskApi.createTask({ id: 1, title: 'Test' })).rejects.toThrow(
        'Request timeout'
      );
    });
  });
});
