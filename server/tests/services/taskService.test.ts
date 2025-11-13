import { ITask } from "../../src/models/interface/task";
import { BoardRepo } from "../../src/repos/boardRepo";
import { TaskRepo } from "../../src/repos/taskRepo";
import { TaskService } from "../../src/services/taskService";

// Mock Repos
jest.mock("../../src/repos/taskRepo", () => ({
  TaskRepo: { getInstance: jest.fn() },
}));

jest.mock("../../src/repos/boardRepo", () => ({
  BoardRepo: { getInstance: jest.fn() },
}));

describe("TaskService", () => {
    
  let mockTaskRepo: any;
  let mockBoardRepo: any;
  let taskService: TaskService;

  beforeEach(() => {
    mockTaskRepo = {
      add: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
      updateColumn: jest.fn(),
    };

    mockBoardRepo = { get: jest.fn() };

    (TaskRepo.getInstance as jest.Mock).mockReturnValue(mockTaskRepo);
    (BoardRepo.getInstance as jest.Mock).mockReturnValue(mockBoardRepo);

    // reset singleton
    (TaskService as any).instance = null;

    taskService = TaskService.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe("ADD TASK", () => {

    it("should add a new task successfully", async () => {
      const board = {
        taskList: {},
        columns: { todo: [] },
        order: [],
      };
      const newTask: ITask = { id: 1, title: "New Task" };

      mockBoardRepo.get.mockResolvedValue(board);
      mockTaskRepo.add.mockReturnValue({ 1: newTask });

      const result = await taskService.addTask(newTask);

      expect(mockBoardRepo.get).toHaveBeenCalled();
      expect(mockTaskRepo.add).toHaveBeenCalledWith(newTask);
      expect(result).toEqual(newTask);
    });

    it("should throw if 'todo' column does not exist", async () => {
      mockBoardRepo.get.mockResolvedValue({
        taskList: {},
        columns: {},
        order: [],
      });

      const newTask: ITask = { id: 1, title: "Task" };

      await expect(taskService.addTask(newTask))
        .rejects
        .toThrow("Column [todo] reocrd is not found");
    });

    it("should throw if task ID already exists", async () => {
      mockBoardRepo.get.mockResolvedValue({
        taskList: { 1: { id: 1, title: "Old Task" } },
        columns: { todo: [] },
        order: [],
      });

      const newTask: ITask = { id: 1, title: "Duplicate Task" };

      await expect(taskService.addTask(newTask))
        .rejects
        .toThrow("task has already existed");
    });
  });


  describe("REMOVE TASK", () => {

    it("should remove an existing task successfully", async () => {
      const board = { columns: { todo: [1] }, taskList: { 1: { id: 1 } } };
      mockBoardRepo.get.mockResolvedValue(board);
      mockTaskRepo.remove.mockReturnValue({ id: 1 });

      const result = await taskService.removeTask(1, "todo");

      expect(mockBoardRepo.get).toHaveBeenCalled();
      expect(mockTaskRepo.remove).toHaveBeenCalledWith(1, "todo", board);
      expect(result).toEqual({ id: 1 });
    });

    it("should throw if column does not exist", async () => {
      mockBoardRepo.get.mockResolvedValue({ columns: {}, taskList: {} });

      await expect(taskService.removeTask(1, "todo"))
        .rejects
        .toThrow("Column todo reocrd is not found");
    });

    it("should throw if task not found", async () => {
      const board = { columns: { todo: [1] }, taskList: {} };
      mockBoardRepo.get.mockResolvedValue(board);
      mockTaskRepo.remove.mockReturnValue(undefined);

      await expect(taskService.removeTask(1, "todo"))
        .rejects
        .toThrow("Task 1 reocrd is not found");
    });
  });


  describe("RELOCATE TASK", () => {

    it("should relocate task within same column", async () => {
      const board = {
        columns: { todo: [1, 2, 3] },
        taskList: { 1: {}, 2: {}, 3: {} },
      };
      mockBoardRepo.get.mockResolvedValue(board);
      mockTaskRepo.updateColumn.mockReturnValue(true);

      const result = await taskService.relocateTask(1, 2, "todo", "todo");

      expect(mockTaskRepo.updateColumn).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should relocate task between different columns", async () => {
      const board = {
        columns: { todo: [1], done: [] },
        taskList: { 1: {} },
      };
      mockBoardRepo.get.mockResolvedValue(board);
      mockTaskRepo.updateColumn.mockReturnValue(true);

      const result = await taskService.relocateTask(1, 0, "todo", "done");

      expect(mockTaskRepo.updateColumn).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should throw if current column does not exist", async () => {
      mockBoardRepo.get.mockResolvedValue({ columns: {}, taskList: {} });

      await expect(taskService.relocateTask(1, 0, "todo", "done"))
        .rejects
        .toThrow("Column todo reocrd is not found");
    });

    it("should throw if destination column does not exist", async () => {
      const board = { columns: { todo: [1] }, taskList: { 1: {} } };
      mockBoardRepo.get.mockResolvedValue(board);

      await expect(taskService.relocateTask(1, 0, "todo", "done"))
        .rejects
        .toThrow("Column done reocrd is not found");
    });

    it("should throw on invalid index", async () => {
      const board = {
        columns: { todo: [1], done: [] },
        taskList: { 1: {} },
      };
      mockBoardRepo.get.mockResolvedValue(board);

      await expect(taskService.relocateTask(1, 1, "todo", "done"))
        .rejects
        .toThrow("index provided has exceed the range limit Invalid index: 1: Expected index: [0, 0]");
    });
  });


  describe("EDIT TASK", () => {

    it("should update an existing task", async () => {

      const board = { taskList: { 1: { id: 1, title: "Old Title", description: "Desc" } } };

      mockBoardRepo.get.mockResolvedValue(board);
      mockTaskRepo.update.mockReturnValue(true);

      const updatedTask: ITask = { id: 1, title: "New Title" };

      const result = await taskService.editTask(updatedTask);

      expect(mockTaskRepo.update).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should throw if task not found", async () => {
      const board = { taskList: {} };
      mockBoardRepo.get.mockResolvedValue(board);

      await expect(taskService.editTask({ id: 1 } as ITask))
        .rejects
        .toThrow("Input is invalid, please try again");
    });

    it("should throw error when update has failed", async () => {

      const board = { taskList: { 1: { id: 1, title: "Old Task" } } };
      mockBoardRepo.get.mockResolvedValue(board);
      mockTaskRepo.update.mockReturnValue(false);

      await expect(taskService.editTask({ id: 1, title: "New Task" } as any))
        .rejects
        .toThrow("Task 1  reocrd is not found");
    });

  });

});
