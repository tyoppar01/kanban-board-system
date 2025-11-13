import { BoardRepo } from "../../src/repos/boardRepo";
import { ColumnService } from "../../src/services/columnService";

// Mock BoardRepo
jest.mock("../../src/repos/boardRepo", () => ({
  BoardRepo: {
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

            (BoardRepo.getInstance as jest.Mock).mockReturnValue(mockBoardRepo);

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
                  expect(mockBoardRepo.setColumn).toHaveBeenCalledWith("newColumn", mockBoard);
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
                  .toThrow("Input is invalid, please try again");

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
                  .toThrow("Input is invalid, please try again");

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
                  .toThrow("reocrd is not found");

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
                  .toThrow("Input is invalid, please try again");

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
                  .toThrow("Input is invalid, please try again");

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
      });

});