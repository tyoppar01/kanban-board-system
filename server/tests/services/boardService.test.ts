import { DynamoBoardRepo } from "../../../external-infra/src/dynamodb/dynamodb_board";
import { BoardService } from "../../src/services/boardService";
import { IBoard } from "../../src/models/interface/board";

// Mock DynamoBoardRepo
jest.mock("../../../external-infra/src/dynamodb/dynamodb_board", () => ({
  DynamoBoardRepo: {
    getInstance: jest.fn(),
  },
}));

describe("BoardService", () => {

  let mockBoardRepo: { get: jest.Mock };
  let boardService: BoardService;

  beforeEach(() => {
    // Mock repo instance and its methods
    mockBoardRepo = { get: jest.fn() };

    // When DynamoBoardRepo.getInstance() is called, return mockBoardRepo
    (DynamoBoardRepo.getInstance as jest.Mock).mockReturnValue(mockBoardRepo);
    
    // Reset singleton instance
    (BoardService as any).instance = null;
    boardService = BoardService.getInstance();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return the same instance (singleton)", () => {
    const instance1 = BoardService.getInstance();
    const instance2 = BoardService.getInstance();
    expect(instance1).toBe(instance2);
  });
  
  describe("getFullBoard", () => {
    it("should call boardRepo.get() and return its result", async () => {
      const mockBoard: IBoard = { 
        id: 1,
        taskList: {}, 
        columns: {}, 
        order: [] 
      };
      mockBoardRepo.get.mockResolvedValue(mockBoard);

      const result = await boardService.getFullBoard();

      expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: 1,
        taskList: {},
        columns: {},
        order: []
      });
    });

    it("should handle board with populated data", async () => {
      const mockBoard: IBoard = {
        id: 1,
        taskList: {
          1: { id: 1, title: "Test Task", createdDate: new Date("2023-01-01") },
          2: { id: 2, title: "Another Task", createdDate: new Date("2023-01-02") }
        },
        columns: {
          "todo": [1],
          "ongoing": [],
          "done": [2]
        },
        order: ["todo", "ongoing", "done"]
      };
      mockBoardRepo.get.mockResolvedValue(mockBoard);

      const result = await boardService.getFullBoard();

      expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBoard);
      expect(result.taskList).toHaveProperty("1");
      expect(result.taskList).toHaveProperty("2");
      expect(result.columns).toHaveProperty("todo");
      expect(result.order).toEqual(["todo", "ongoing", "done"]);
    });

    it("should handle database errors gracefully", async () => {
      const error = new Error("Database connection failed");
      mockBoardRepo.get.mockRejectedValue(error);

      await expect(boardService.getFullBoard())
        .rejects
        .toThrow("Database connection failed");

      expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
    });

    it("should handle empty board data", async () => {
      const mockBoard: IBoard = {
        id: 0,
        taskList: {},
        columns: {},
        order: []
      };
      mockBoardRepo.get.mockResolvedValue(mockBoard);

      const result = await boardService.getFullBoard();

      expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBoard);
      expect(Object.keys(result.taskList)).toHaveLength(0);
      expect(Object.keys(result.columns)).toHaveLength(0);
      expect(result.order).toHaveLength(0);
    });

    it("should preserve board data structure", async () => {
      const mockBoard: IBoard = {
        id: 123,
        taskList: {
          101: {
            id: 101,
            title: "Important Task",
            description: "This is a test task",
            createdDate: new Date("2023-11-18T10:00:00Z"),
            modifiedDate: new Date("2023-11-20T17:00:00Z")
          }
        },
        columns: {
          "todo": [101],
          "in-progress": [],
          "review": [],
          "done": []
        },
        order: ["todo", "in-progress", "review", "done"]
      };
      mockBoardRepo.get.mockResolvedValue(mockBoard);

      const result = await boardService.getFullBoard();

      expect(result).toStrictEqual(mockBoard);
      expect(result.id).toBe(123);
      expect(result.taskList[101]?.title).toBe("Important Task");
      expect(result.taskList[101]?.description).toBe("This is a test task");
      expect(result.columns["todo"]).toContain(101);
    });

    it("should handle null/undefined values in board data", async () => {
      const mockBoard: IBoard = {
        id: 1,
        taskList: null as any,
        columns: undefined as any,
        order: null as any
      };
      mockBoardRepo.get.mockResolvedValue(mockBoard);

      const result = await boardService.getFullBoard();

      expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(1);
      expect(result.taskList).toBeNull();
      expect(result.columns).toBeUndefined();
      expect(result.order).toBeNull();
    });

    it("should handle repository returning partial data", async () => {
      const partialBoard = {
        id: 1,
        taskList: { 1: { id: 1, title: "Test" } },
        // Missing columns and order
      } as any;
      mockBoardRepo.get.mockResolvedValue(partialBoard);

      const result = await boardService.getFullBoard();

      expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(1);
      expect(result.taskList).toBeDefined();
      expect(result.columns).toBeUndefined();
      expect(result.order).toBeUndefined();
    });
  });
});