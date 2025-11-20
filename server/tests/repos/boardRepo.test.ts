import { BoardRepo } from '../../src/repos/boardRepo';
import { BoardRepository } from 'external-apis';

// Mock the external-apis BoardRepository
jest.mock('external-apis', () => ({
  BoardRepository: {
    getInstance: jest.fn(() => ({
      get: jest.fn(),
      getBoardId: jest.fn().mockResolvedValue(1),
      setColumn: jest.fn(),
      removeColumn: jest.fn(),
      moveColumn: jest.fn(),
    })),
  },
  TaskRepository: {
    getInstance: jest.fn(() => ({}))
  },
  ColumnRepository: {
    getInstance: jest.fn(() => ({}))
  },
}));

const mockBoardRepoInstance = {
  get: jest.fn(),
  getBoardId: jest.fn().mockResolvedValue(1),
  setColumn: jest.fn(),
  removeColumn: jest.fn(),
  moveColumn: jest.fn(),
  moveCol: jest.fn(),
};

(BoardRepository.getInstance as jest.Mock).mockReturnValue(mockBoardRepoInstance);

describe('BoardRepo', () => {
  let repo: BoardRepo;

  beforeEach(() => {
    // Reset singleton instance
    (BoardRepo as any).instance = null;
    repo = BoardRepo.getInstance();
    
    // Clear all mocks
    jest.clearAllMocks();
    mockBoardRepoInstance.getBoardId.mockResolvedValue(1);
  });

  it('should achieve singleton instance of boardRepo', () => {
    const a = BoardRepo.getInstance();
    const b = BoardRepo.getInstance();
    expect(a).toBe(b);
  });

  it('should return a board with expected structure', async () => {
    const mockBoardData = {
      id: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      columns: [
        {
          id: 1,
          name: 'todo',
          position: 0,
          boardId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [
            { id: 1, title: "Setup project structure", description: null, position: 0, columnId: 1, boardId: 1, createdDate: new Date(), modifiedDate: new Date() },
            { id: 2, title: "Implement Express routes", description: null, position: 1, columnId: 1, boardId: 1, createdDate: new Date(), modifiedDate: new Date() },
          ]
        },
        { id: 2, name: 'ongoing', position: 1, boardId: 1, createdAt: new Date(), updatedAt: new Date(), tasks: [] },
        { id: 3, name: 'done', position: 2, boardId: 1, createdAt: new Date(), updatedAt: new Date(), tasks: [] },
      ]
    };

    // Mock successful get
    mockBoardRepoInstance.get.mockResolvedValue(mockBoardData as any);

    const board = await repo.get();

    // Basic structure checks
    expect(board).toHaveProperty('taskList');
    expect(board).toHaveProperty('columns');
    expect(board).toHaveProperty('order');

    // Task content check
    expect(board.taskList).toBeDefined();
    expect(board.taskList[1]!.title).toBe('Setup project structure');
    expect(board.columns.todo).toContain(1);
    expect(board.order).toEqual(['todo', 'ongoing', 'done']);

    // Verify repository was called
    expect(mockBoardRepoInstance.get).toHaveBeenCalledTimes(1);
  });

  it('should create a new board if none exists', async () => {
    const mockBoardData = {
      id: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      columns: [
        { id: 1, name: 'todo', position: 0, boardId: 1, createdAt: new Date(), updatedAt: new Date(), tasks: [] },
        { id: 2, name: 'ongoing', position: 1, boardId: 1, createdAt: new Date(), updatedAt: new Date(), tasks: [] },
        { id: 3, name: 'completed', position: 2, boardId: 1, createdAt: new Date(), updatedAt: new Date(), tasks: [] },
      ]
    };

    // BoardRepository.get() creates the board automatically if it doesn't exist
    mockBoardRepoInstance.get.mockResolvedValue(mockBoardData as any);

    const board = await repo.get();

    expect(board).toHaveProperty('columns');
    expect(board).toHaveProperty('order');
    expect(board.order).toEqual(['todo', 'ongoing', 'completed']);
    expect(mockBoardRepoInstance.get).toHaveBeenCalledTimes(1);
  });

  it('should handle database errors gracefully', async () => {
    
    // Mock get to throw an error
    mockBoardRepoInstance.get.mockRejectedValue(new Error('Database connection failed'));

    await expect(repo.get()).rejects.toThrow('Failed to retrieve board');
    expect(mockBoardRepoInstance.get).toHaveBeenCalledTimes(1);
  });

  describe('setColumn', () => {
    it('should add a new column to the board', async () => {
      const mockBoardData = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        columns: [
          { id: 1, name: 'todo', position: 0, boardId: 1, createdAt: new Date(), updatedAt: new Date(), tasks: [] },
          { id: 2, name: 'newColumn', position: 1, boardId: 1, createdAt: new Date(), updatedAt: new Date(), tasks: [] },
        ]
      };
      
      mockBoardRepoInstance.setColumn.mockResolvedValue(undefined);
      mockBoardRepoInstance.get.mockResolvedValue(mockBoardData as any);

      const result = await repo.setColumn('newColumn');

      expect(result).toHaveProperty('columns');
      expect(mockBoardRepoInstance.setColumn).toHaveBeenCalledWith('newColumn');
      expect(mockBoardRepoInstance.get).toHaveBeenCalled();
    });

    it('should handle errors when adding column', async () => {
      mockBoardRepoInstance.setColumn.mockRejectedValue(new Error('Database error'));

      await expect(repo.setColumn('newColumn'))
        .rejects.toThrow('Failed to add column to board');
    });
  });

  describe('removeColumn', () => {
    it('should remove column from the board', async () => {
      mockBoardRepoInstance.removeColumn.mockResolvedValue(true);

      const result = await repo.removeColumn('oldColumn');

      expect(result).toBe(true);
      expect(mockBoardRepoInstance.removeColumn).toHaveBeenCalledWith('oldColumn');
    });

    it('should handle errors when removing column', async () => {
      mockBoardRepoInstance.removeColumn.mockRejectedValue(new Error('Database error'));

      await expect(repo.removeColumn('oldColumn'))
        .rejects.toThrow('Failed to remove column from board');
    });
  });

  describe('moveCol', () => {
    it('should move column to new position', async () => {
      mockBoardRepoInstance.moveCol.mockResolvedValue(true);

      const result = await repo.moveCol('ongoing', 0);

      expect(result).toBe(true);
      expect(mockBoardRepoInstance.moveCol).toHaveBeenCalledWith('ongoing', 0);
    });

    it('should handle database errors when moving column', async () => {
      mockBoardRepoInstance.moveCol.mockRejectedValue(new Error('Database error'));

      await expect(repo.moveCol('ongoing', 0))
        .rejects.toThrow('Failed to move column');
    });
  });

});