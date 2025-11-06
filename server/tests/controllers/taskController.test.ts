import { Request, Response } from "express";

jest.mock("../../src/utils/apiResponse", () => ({
  sendSuccessResponse: jest.fn(),
  sendFailedResponse: jest.fn(),
}));

import { sendFailedResponse, sendSuccessResponse } from "../../src/utils/apiResponse";
import { ApiStatus } from "../../src/utils/apiStatus";
import { ErrorCode } from "../../src/utils/errorCode";
import { TaskService } from "../../src/services/taskService";
import * as taskController from "../../src/controllers/taskController";


jest.mock("../../src/services/taskService");

describe("taskController - createTask", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  const mockAddTask = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {
        id: 1,
        title: "Test Task",
        description: "demo",
        createdDate: new Date(),
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    (TaskService.getInstance as jest.Mock).mockReturnValue({
      addTask: mockAddTask,
    });
  });

  it("should send success response when task is created", async () => {
    const mockTasks = {
      1: { id: 1, title: "Test Task", description: "demo", createdDate: new Date() },
    };

    mockAddTask.mockResolvedValue(mockTasks);

    await taskController.createTask(mockReq as Request, mockRes as Response);

    expect(sendSuccessResponse).toHaveBeenCalledWith(mockRes, {
      success: true,
      message: "new task has been created successfully",
      data: mockTasks,
    });
  });

  it("should send failed response if id or title is missing", async () => {
    mockReq.body = { description: "demo" };

    await taskController.createTask(mockReq as Request, mockRes as Response);

    expect(sendFailedResponse).toHaveBeenCalledWith(
      mockRes,
      ApiStatus.BAD_REQUEST,
      ErrorCode.INVALID_INPUT
    );
  });

  it("should send failed response if addTask throws error", async () => {
    mockAddTask.mockRejectedValue(new Error("DB error"));

    await taskController.createTask(mockReq as Request, mockRes as Response);

    expect(sendFailedResponse).toHaveBeenCalledWith(
      mockRes,
      ApiStatus.SYSTEM_ERROR,
      "DB error"
    );
  });
});


describe("taskController - deleteTask", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  const mockRemoveTask = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {
        id: 1,
        column: "todo",
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    (TaskService.getInstance as jest.Mock).mockReturnValue({
      removeTask: mockRemoveTask,
    });
  });

  it("should send success response when task is deleted", async () => {
    const mockTaskResult = { success: true, removedId: 1 };

    mockRemoveTask.mockResolvedValue(mockTaskResult);

    await taskController.deleteTask(mockReq as Request, mockRes as Response);

    expect(sendSuccessResponse).toHaveBeenCalledWith(mockRes, {
      success: true,
      message: "task of 1 has been deleted successfully",
      data: mockTaskResult,
    });

    expect(sendFailedResponse).not.toHaveBeenCalled();
  });

  it("should send failed response if id or column is missing", async () => {
    mockReq.body = { id: 1 }; // missing column

    await taskController.deleteTask(mockReq as Request, mockRes as Response);

    expect(sendFailedResponse).toHaveBeenCalledWith(
      mockRes,
      ApiStatus.BAD_REQUEST,
      ErrorCode.UNKNOWN_ID
    );
  });

  it("should send failed response if removeTask throws error", async () => {
    mockRemoveTask.mockRejectedValue(new Error("DB delete error"));

    await taskController.deleteTask(mockReq as Request, mockRes as Response);

    expect(sendFailedResponse).toHaveBeenCalledWith(
      mockRes,
      ApiStatus.SYSTEM_ERROR,
      "DB delete error"
    );
  });
});


describe("taskController - moveTask", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  const mockRelocateTask = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {
        id: 1,
        index: 0,
        currentColumn: "todo",
        newColumn: "doing",
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    (TaskService.getInstance as jest.Mock).mockReturnValue({
      relocateTask: mockRelocateTask,
    });
  });

  it("should send success response when task is moved successfully", async () => {
    const mockMovedTask = {
      id: 1,
      title: "Test Task",
      from: "todo",
      to: "doing",
    };

    mockRelocateTask.mockResolvedValue(mockMovedTask);

    await taskController.moveTask(mockReq as Request, mockRes as Response);

    expect(sendSuccessResponse).toHaveBeenCalledWith(mockRes, {
      success: true,
      message:
        "task of 1 has been moved successfully from column: todo to column: doing",
      data: mockMovedTask,
    });

    expect(sendFailedResponse).not.toHaveBeenCalled();
  });

  it("should send failed response if currentColumn or newColumn or index is missing", async () => {
    mockReq.body = { id: 1, currentColumn: "", newColumn: "done", index: undefined };

    await taskController.moveTask(mockReq as Request, mockRes as Response);

    expect(sendFailedResponse).toHaveBeenCalledWith(
      mockRes,
      ApiStatus.BAD_REQUEST,
      ErrorCode.INVALID_INPUT
    );
  });

  it("should send failed response if id or index are invalid numbers", async () => {
    mockReq.body = {
      id: "abc",
      index: -1,
      currentColumn: "todo",
      newColumn: "done",
    };

    await taskController.moveTask(mockReq as Request, mockRes as Response);

    expect(sendFailedResponse).toHaveBeenCalledWith(
      mockRes,
      ApiStatus.BAD_REQUEST,
      ErrorCode.INVALID_INDEX
    );
  });

  it("should send failed response if relocateTask throws error", async () => {
    mockRelocateTask.mockRejectedValue(new Error("Relocation failed"));

    await taskController.moveTask(mockReq as Request, mockRes as Response);

    expect(sendFailedResponse).toHaveBeenCalledWith(
      mockRes,
      ApiStatus.SYSTEM_ERROR,
      "Relocation failed"
    );
  });
});


describe("taskController - updateTask", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  const mockEditTask = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {
        task: {
          id: 1,
          title: "Updated Task",
          description: "Some description",
          createdDate: new Date(),
        },
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    (TaskService.getInstance as jest.Mock).mockReturnValue({
      editTask: mockEditTask,
    });
  });

  it("should send success response when task is updated successfully", async () => {
    mockEditTask.mockResolvedValue(true);

    await taskController.updateTask(mockReq as Request, mockRes as Response);

    expect(sendSuccessResponse).toHaveBeenCalledWith(mockRes, {
      success: true,
      message: "task 1 has been updated successfully",
    });

    expect(sendFailedResponse).not.toHaveBeenCalled();
  });

  it("should send failed response if id or title is missing", async () => {
    mockReq.body = { task: { description: "no id or title" } };

    await taskController.updateTask(mockReq as Request, mockRes as Response);

    expect(sendFailedResponse).toHaveBeenCalledWith(
      mockRes,
      ApiStatus.BAD_REQUEST,
      ErrorCode.INVALID_INPUT
    );
  });

  it("should send failed response if editTask returns false", async () => {
    mockEditTask.mockResolvedValue(false);

    await taskController.updateTask(mockReq as Request, mockRes as Response);

    expect(sendFailedResponse).toHaveBeenCalledWith(
      mockRes,
      ApiStatus.SYSTEM_ERROR,
      ErrorCode.ACTION_FAILED
    );
  });

  it("should send failed response if editTask throws an error", async () => {
    mockEditTask.mockRejectedValue(new Error("DB update error"));

    await taskController.updateTask(mockReq as Request, mockRes as Response);

    expect(sendFailedResponse).toHaveBeenCalledWith(
      mockRes,
      ApiStatus.SYSTEM_ERROR,
      "DB update error"
    );
  });
});