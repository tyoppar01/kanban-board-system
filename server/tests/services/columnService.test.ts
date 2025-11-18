import { DynamoBoardRepo } from "../../../external-infra/src/dynamodb/dynamodb_board";
import { ColumnService } from "../../src/services/columnService";
import { ErrorCode } from "../../src/utils/errorCode";

// Mock DynamoBoardRepo
jest.mock("../../../external-infra/src/dynamodb/dynamodb_board", () => ({
  DynamoBoardRepo: {
    getInstance: jest.fn(),
  },
}));

describe("ColumnService", () => {

      let mockBoardRepo: {
            get: jest.Mock;
            setColumn: jest.Mock;
            removeColumn: jest.Mock;
            moveCol: jest.Mock;
      };

      let columnService: ColumnService;

      beforeEach(() => {

            mockBoardRepo = {
                  get: jest.fn(),
                  setColumn: jest.fn(),
                  removeColumn: jest.fn(),
                  moveCol: jest.fn(),
            };

            (DynamoBoardRepo.getInstance as jest.Mock).mockReturnValue(mockBoardRepo);

            // Reset singleton instance
            (ColumnService as any).instance = null;
            columnService = ColumnService.getInstance();
      });

      afterEach(() => {
            jest.clearAllMocks();
      });

      it("should return the same instance (singleton)", () => {
            const instance1 = ColumnService.getInstance();
            const instance2 = ColumnService.getInstance();
            expect(instance1).toBe(instance2);
      });

      // ADD COLUMN SERVICE
      describe("ADD COLUMN", () => {

            it("should add a new column successfully", async () => {

                  const mockBoard = {
                  taskList: {},
                  columns: { todo: [], ongoing: [] },
                  order: ["todo", "ongoing"],
                  };

                  const updatedBoard = {
                  taskList: {},
                  columns: { todo: [], ongoing: [], newColumn: [] },
                  order: ["todo", "ongoing", "newColumn"],
                  };

                  mockBoardRepo.get.mockResolvedValue(mockBoard);
                  mockBoardRepo.setColumn.mockResolvedValue(updatedBoard);

                  const result = await columnService.addColumn("newColumn");

                  expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
                  expect(mockBoardRepo.setColumn).toHaveBeenCalledWith("newColumn");
                  expect(result).toEqual(updatedBoard);
            });

            it("should throw error if column already exists", async () => {
                  const mockBoard = {
                  taskList: {},
                  columns: { todo: [], ongoing: [] },
                  order: ["todo", "ongoing"],
                  };

                  mockBoardRepo.get.mockResolvedValue(mockBoard);

                  await expect(columnService.addColumn("todo"))
                  .rejects
                  .toThrow(ErrorCode.INVALID_INPUT);

                  expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
                  expect(mockBoardRepo.setColumn).not.toHaveBeenCalled();
            });

            it("should handle database errors gracefully", async () => {
                  mockBoardRepo.get.mockRejectedValue(new Error("Database error"));

                  await expect(columnService.addColumn("newColumn"))
                  .rejects
                  .toThrow("Database error");

                  expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
                  expect(mockBoardRepo.setColumn).not.toHaveBeenCalled();
            });

            it("should handle setColumn repository failures", async () => {
                  const mockBoard = {
                        taskList: {},
                        columns: { todo: [] },
                        order: ["todo"],
                  };

                  mockBoardRepo.get.mockResolvedValue(mockBoard);
                  mockBoardRepo.setColumn.mockRejectedValue(new Error("Repository error"));

                  await expect(columnService.addColumn("newColumn"))
                  .rejects
                  .toThrow("Repository error");

                  expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
                  expect(mockBoardRepo.setColumn).toHaveBeenCalledWith("newColumn");
            });

            it("should handle empty column name", async () => {
                  const mockBoard = {
                        taskList: {},
                        columns: {},
                        order: [],
                  };

                  mockBoardRepo.get.mockResolvedValue(mockBoard);
                  mockBoardRepo.setColumn.mockResolvedValue(mockBoard);

                  // Empty string is treated as a valid column name in current implementation
                  const result = await columnService.addColumn("");
                  
                  expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
                  expect(mockBoardRepo.setColumn).toHaveBeenCalledWith("");
                  expect(result).toEqual(mockBoard);
            });

      });

      describe("REMOVE COLUMN", () => {

            it("should remove an existing column successfully", async () => {
                  const mockBoard = {
                  taskList: {},
                  columns: { todo: [], ongoing: [], done: [] },
                  order: ["todo", "ongoing", "done"],
                  };

                  mockBoardRepo.get.mockResolvedValue(mockBoard);
                  mockBoardRepo.removeColumn.mockResolvedValue(true);

                  const result = await columnService.removeColumn("done");

                  expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
                  expect(mockBoardRepo.removeColumn).toHaveBeenCalledWith("done");
                  expect(result).toBe(true);
            });

            it("should throw error if column does not exist", async () => {
                  const mockBoard = {
                  taskList: {},
                  columns: { todo: [], ongoing: [] },
                  order: ["todo", "ongoing"],
                  };

                  mockBoardRepo.get.mockResolvedValue(mockBoard);

                  await expect(columnService.removeColumn("nonexistent"))
                  .rejects
                  .toThrow(ErrorCode.INVALID_INPUT);

                  expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
                  expect(mockBoardRepo.removeColumn).not.toHaveBeenCalled();
            });

            it("should handle database errors gracefully", async () => {
                  mockBoardRepo.get.mockRejectedValue(new Error("Database error"));

                  await expect(columnService.removeColumn("done"))
                  .rejects
                  .toThrow("Database error");

                  expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
                  expect(mockBoardRepo.removeColumn).not.toHaveBeenCalled();
            });

            it("should handle removeColumn repository failures", async () => {
                  const mockBoard = {
                        taskList: {},
                        columns: { todo: [], done: [] },
                        order: ["todo", "done"],
                  };

                  mockBoardRepo.get.mockResolvedValue(mockBoard);
                  mockBoardRepo.removeColumn.mockRejectedValue(new Error("Repository error"));

                  await expect(columnService.removeColumn("done"))
                  .rejects
                  .toThrow("Repository error");

                  expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
                  expect(mockBoardRepo.removeColumn).toHaveBeenCalledWith("done");
            });

            it("should handle board with no columns object", async () => {
                  const mockBoard = {
                        taskList: {},
                        columns: null,
                        order: [],
                  };

                  mockBoardRepo.get.mockResolvedValue(mockBoard);

                  await expect(columnService.removeColumn("done"))
                  .rejects
                  .toThrow("Cannot read properties of null (reading 'done')");

                  expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
                  expect(mockBoardRepo.removeColumn).not.toHaveBeenCalled();
            });
      });

      describe("MOVE COLUMN", () => {

            it("should move column to new position successfully", async () => {
                  const mockBoard = {
                  taskList: {},
                  columns: { todo: [], ongoing: [], done: [] },
                  order: ["todo", "ongoing", "done"],
                  };

                  mockBoardRepo.get.mockResolvedValue(mockBoard);
                  mockBoardRepo.moveCol.mockResolvedValue(true);

                  const result = await columnService.moveColumn("ongoing", 0);

                  expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
                  expect(mockBoardRepo.moveCol).toHaveBeenCalledWith("ongoing", 0, ["todo", "ongoing", "done"]);
                  expect(result).toBe(true);
            });

            it("should throw error if board has no order array", async () => {
                  const mockBoard = {
                  taskList: {},
                  columns: { todo: [], ongoing: [] },
                  order: null, // No order array
                  };

                  mockBoardRepo.get.mockResolvedValue(mockBoard);

                  await expect(columnService.moveColumn("ongoing", 0))
                  .rejects
                  .toThrow(ErrorCode.RECORD_NOT_FOUND);

                  expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
                  expect(mockBoardRepo.moveCol).not.toHaveBeenCalled();
            });

            it("should throw error for invalid destination index (negative)", async () => {
                  const mockBoard = {
                  taskList: {},
                  columns: { todo: [], ongoing: [], done: [] },
                  order: ["todo", "ongoing", "done"],
                  };

                  mockBoardRepo.get.mockResolvedValue(mockBoard);

                  await expect(columnService.moveColumn("ongoing", -1))
                  .rejects
                  .toThrow(ErrorCode.INVALID_INPUT);

                  expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
                  expect(mockBoardRepo.moveCol).not.toHaveBeenCalled();
            });

            it("should throw error for invalid destination index (too high)", async () => {
                  const mockBoard = {
                  taskList: {},
                  columns: { todo: [], ongoing: [], done: [] },
                  order: ["todo", "ongoing", "done"],
                  };

                  mockBoardRepo.get.mockResolvedValue(mockBoard);

                  await expect(columnService.moveColumn("ongoing", 5))
                  .rejects
                  .toThrow(ErrorCode.INVALID_INPUT);

                  expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
                  expect(mockBoardRepo.moveCol).not.toHaveBeenCalled();
            });

            it("should handle database errors gracefully", async () => {
                  mockBoardRepo.get.mockRejectedValue(new Error("Database error"));

                  await expect(columnService.moveColumn("ongoing", 0))
                  .rejects
                  .toThrow("Database error");

                  expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
                  expect(mockBoardRepo.moveCol).not.toHaveBeenCalled();
            });

            it("should handle board repo moveCol failures", async () => {
                  const mockBoard = {
                  taskList: {},
                  columns: { todo: [], ongoing: [], done: [] },
                  order: ["todo", "ongoing", "done"],
                  };

                  mockBoardRepo.get.mockResolvedValue(mockBoard);
                  mockBoardRepo.moveCol.mockResolvedValue(false);

                  const result = await columnService.moveColumn("ongoing", 1);

                  expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
                  expect(mockBoardRepo.moveCol).toHaveBeenCalledWith("ongoing", 1, ["todo", "ongoing", "done"]);
                  expect(result).toBe(false);
            });

            it("should handle moveCol repository failures", async () => {
                  const mockBoard = {
                        taskList: {},
                        columns: { todo: [], ongoing: [], done: [] },
                        order: ["todo", "ongoing", "done"],
                  };

                  mockBoardRepo.get.mockResolvedValue(mockBoard);
                  mockBoardRepo.moveCol.mockRejectedValue(new Error("Repository error"));

                  await expect(columnService.moveColumn("ongoing", 1))
                  .rejects
                  .toThrow("Repository error");

                  expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
                  expect(mockBoardRepo.moveCol).toHaveBeenCalledWith("ongoing", 1, ["todo", "ongoing", "done"]);
            });

            it("should handle edge case where destIndex equals array length", async () => {
                  const mockBoard = {
                        taskList: {},
                        columns: { todo: [], ongoing: [], done: [] },
                        order: ["todo", "ongoing", "done"],
                  };

                  mockBoardRepo.get.mockResolvedValue(mockBoard);

                  await expect(columnService.moveColumn("ongoing", 3)) // Length is 3, so index 3 is invalid
                  .rejects
                  .toThrow(ErrorCode.INVALID_INPUT);

                  expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
                  expect(mockBoardRepo.moveCol).not.toHaveBeenCalled();
            });

            it("should successfully move column to same position", async () => {
                  const mockBoard = {
                        taskList: {},
                        columns: { todo: [], ongoing: [], done: [] },
                        order: ["todo", "ongoing", "done"],
                  };

                  mockBoardRepo.get.mockResolvedValue(mockBoard);
                  mockBoardRepo.moveCol.mockResolvedValue(true);

                  const result = await columnService.moveColumn("ongoing", 1); // Same position

                  expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
                  expect(mockBoardRepo.moveCol).toHaveBeenCalledWith("ongoing", 1, ["todo", "ongoing", "done"]);
                  expect(result).toBe(true);
            });
      });

});