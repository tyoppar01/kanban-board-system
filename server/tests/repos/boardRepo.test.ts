import { BoardRepo } from '../../src/repos/boardRepo';
import { Board } from '../../src/models/schemaModel';

// Mock the entire Board model with constructor and static methods
jest.mock('../../src/models/schemaModel', () => {

  const MockBoard: any = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({})
  }));

  MockBoard.findOne = jest.fn(() => ({ lean: jest.fn() }));

  MockBoard.findOneAndUpdate = jest.fn(() => ({ lean: jest.fn() }));

  return { Board: MockBoard };

});

// Get reference to the mocked Board
const MockedBoard = Board as any;

describe('BoardRepo', () => {
  let repo: BoardRepo;

  beforeEach(() => {
    // Reset singleton instance
    (BoardRepo as any).instance = null;
    repo = BoardRepo.getInstance();
    
    // Clear all mocks and stubs
    jest.clearAllMocks();
  });

  it('should achieve singleton instance of boardRepo', () => {
    const a = BoardRepo.getInstance();
    const b = BoardRepo.getInstance();
    expect(a).toBe(b);
  });

  it('should return a board with expected structure', async () => {
    const mockBoardData = {
      taskList: {
        1: { id: 1, title: "Setup project structure" },
        2: { id: 2, title: "Implement Express routes" },
      },
      columns: {
        todo: [1, 2],
        ongoing: [],
        done: [],
      },
      order: ['todo', 'ongoing', 'done'],
    };

    // Mock successful findOne
    MockedBoard.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockBoardData)
    } as any);

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

    // Verify MongoDB was called
    expect(MockedBoard.findOne).toHaveBeenCalledTimes(1);
  });

  it('should create a new board if none exists', async () => {
    const mockBoardData = {
      taskList: {},
      columns: {
        todo: [],
        ongoing: [],
        completed: [],
      },
      order: ['todo', 'ongoing', 'completed'],
    };

    // Mock first board is empty, thus create first mock board
    MockedBoard.findOne
      .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null)} as any)
      .mockReturnValueOnce({lean: jest.fn().mockResolvedValue(mockBoardData)} as any);

    // Mock the Board constructor's save method
    const mockSave = jest.fn().mockResolvedValue(mockBoardData);
    MockedBoard.mockImplementation(() => ({
      save: mockSave
    }));

    const board = await repo.get();

    expect(board).toEqual(mockBoardData);
    expect(MockedBoard.findOne).toHaveBeenCalledTimes(2);
    expect(MockedBoard).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it('should handle database errors gracefully', async () => {
    
    // Mock findOne to throw an error
    MockedBoard.findOne.mockReturnValue({
      lean: jest.fn().mockRejectedValue(new Error('Database connection failed'))
    } as any);

    await expect(repo.get()).rejects.toThrow('Failed to retrieve board');
    expect(MockedBoard.findOne).toHaveBeenCalledTimes(1);
  });

  describe('setColumn', () => {
    it('should add a new column to the board', async () => {
      const boardData = {
        taskList: {},
        columns: { todo: [], ongoing: [] },
        order: ['todo', 'ongoing'],
      } as any; // Type assertion to avoid Document interface conflicts

      const updatedBoardData = {
        taskList: {},
        columns: { todo: [], ongoing: [], newColumn: [] },
        order: ['todo', 'ongoing', 'newColumn'],
      };

      MockedBoard.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedBoardData)
      } as any);

      const result = await repo.setColumn('newColumn', boardData);

      expect(result).toEqual(updatedBoardData);
      expect(MockedBoard.findOneAndUpdate).toHaveBeenCalledWith(
        {},
        {
          $set: {
            'columns.newColumn': [],
            order: ['todo', 'ongoing', 'newColumn']
          }
        },
        { new: true }
      );
    });

    it('should handle errors when adding column', async () => {
      const boardData = { taskList: {}, columns: {}, order: [] } as any;

      MockedBoard.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Database error'))
      } as any);

      await expect(repo.setColumn('newColumn', boardData))
        .rejects.toThrow('Failed to add column to board');
    });
  });

  describe('removeColumn', () => {
    it('should remove column from the board', async () => {
      MockedBoard.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue({})
      } as any);

      const result = await repo.removeColumn('oldColumn');

      expect(result).toBe(true);
      expect(MockedBoard.findOneAndUpdate).toHaveBeenCalledWith(
        {},
        {
          $pull: { order: 'oldColumn' },
          $unset: { 'columns.oldColumn': '' }
        },
        { new: true }
      );
    });

    it('should handle errors when removing column', async () => {
      MockedBoard.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Database error'))
      } as any);

      await expect(repo.removeColumn('oldColumn'))
        .rejects.toThrow('Failed to remove column from board');
    });
  });

  describe('moveCol', () => {
    it('should move column to new position', async () => {
      const orderArr = ['todo', 'ongoing', 'done'];

      MockedBoard.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue({})
      } as any);

      const result = await repo.moveCol('ongoing', 0, orderArr);

      expect(result).toBe(true);
      expect(MockedBoard.findOneAndUpdate).toHaveBeenCalledWith(
        {},
        {
          $set: { order: ['ongoing', 'todo', 'done'] }
        },
        { new: true }
      );
    });

    it('should throw error for non-existent column', async () => {
      const orderArr = ['todo', 'done'];

      await expect(repo.moveCol('huh', 0, orderArr))
        .rejects.toThrow('Failed to move column');
    });

    it('should handle database errors when moving column', async () => {
      const orderArr = ['todo', 'ongoing', 'done'];

      MockedBoard.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Database error'))
      } as any);

      await expect(repo.moveCol('ongoing', 0, orderArr))
        .rejects.toThrow('Failed to move column');
    });
  });

});