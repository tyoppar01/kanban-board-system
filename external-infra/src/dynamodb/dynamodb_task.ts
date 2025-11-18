import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ITask } from "../models/task";
import { logResponse, MethodName } from "../utils/loggerResponse";
import { docClient, TABLES } from "./client";
import { DynamoBoardRepo } from "./dynamodb_board";

// ==================== DynamoDB Task Repo ===================== //

export class DynamoTaskRepo {

  private static instance: DynamoTaskRepo;

  constructor() {}

  static getInstance(): DynamoTaskRepo {
    if (!DynamoTaskRepo.instance) DynamoTaskRepo.instance = new DynamoTaskRepo();
    return DynamoTaskRepo.instance;
  }

  /**
   * Add New Task
   * @param task 
   * @param boardId 
   * @returns 
   */
  async add(task: ITask, boardId: number = 1): Promise<ITask> {
    try {
      // Get current board
      const board = await DynamoBoardRepo.getInstance().get(boardId);

      // Add task to todo column if it doesn't exist, otherwise add to existing todo column
      const todoColumn = board.columns?.todo || [];
      const updatedTodoColumn = [...todoColumn, task.id];

      // Update board with new task in taskList and add to todo column
      const command = new UpdateCommand({
        TableName: TABLES.BOARDS,
        Key: { id: boardId },
        UpdateExpression: "SET taskList.#taskId = :task, #columns.todo = :todoColumn",
        ExpressionAttributeNames: {
          "#taskId": task.id.toString(),
          "#columns": "columns"
        },
        ExpressionAttributeValues: {
          ":task": task,
          ":todoColumn": updatedTodoColumn
        }
      });

      await docClient.send(command);
      logResponse(MethodName.ADD_TASK, `Task ${task.id} added successfully to board ${boardId}`);
      
      return task;

    } catch (error) {
      logResponse(MethodName.ADD_TASK, error, false);
      throw new Error("Failed to add task");
    }
  }

  /**
   * Remove an existing task
   * @param taskId 
   * @param column 
   * @param boardId
   * @returns 
   */
  async remove(taskId: number, column: string, boardId: number = 1): Promise<boolean> {
    try {
      // Get current board
      const board = await DynamoBoardRepo.getInstance().get(boardId);

      // Check if task exists
      if (!board.taskList[taskId]) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Remove taskId from the specified column
      const updatedColumn = board.columns?.[column]?.filter(id => id !== taskId) || [];

      // Create update expression to remove task from taskList and update column
      const command = new UpdateCommand({
        TableName: TABLES.BOARDS,
        Key: { id: boardId },
        UpdateExpression: "REMOVE taskList.#taskId SET #columns.#columnName = :updatedColumn",
        ExpressionAttributeNames: {
          "#taskId": taskId.toString(),
          "#columnName": column,
          "#columns": "columns"
        },
        ExpressionAttributeValues: {
          ":updatedColumn": updatedColumn
        }
      });

      await docClient.send(command);
      logResponse(MethodName.REMOVE_TASK, `Task ${taskId} removed successfully from board ${boardId}`);
      
      return true;

    } catch (error) {
      logResponse(MethodName.REMOVE_TASK, error, false);
      throw new Error("Failed to remove task");
    }
  }

  /**
   * Update Column (Move task between columns)
   * @param taskId 
   * @param currCol 
   * @param currList 
   * @param destCol 
   * @param destList 
   * @param boardId
   * @returns 
   */
  async updateColumn(
        taskId: number, 
        currCol: string, 
        currList: number[], 
        destCol: string, 
        destList: number[],
        boardId: number = 1): Promise<boolean> {
    try {
      
      const command = new UpdateCommand({
        TableName: TABLES.BOARDS,
        Key: { id: boardId },
        UpdateExpression: "SET #columns.#currCol = :currList, #columns.#destCol = :destList",
        ExpressionAttributeNames: {
          "#currCol": currCol,
          "#destCol": destCol,
          "#columns": "columns"
        },
        ExpressionAttributeValues: {
          ":currList": currList,
          ":destList": destList
        }
      });

      await docClient.send(command);
      logResponse(MethodName.MOVE_TASK, `Task ${taskId} moved from ${currCol} to ${destCol} in board ${boardId}`);
      
      return true;

    } catch (error) {
      logResponse(MethodName.MOVE_TASK, error, false);
      throw new Error("Failed to update columns");
    }
  }

  /**
   * Update Task (Details)
   * @param target 
   * @param boardId
   * @returns 
   */
  async update(target: ITask, boardId: number = 1): Promise<boolean> {
    try {
      const command = new UpdateCommand({
        TableName: TABLES.BOARDS,
        Key: { id: boardId },
        UpdateExpression: "SET taskList.#taskId = :task",
        ExpressionAttributeNames: {
          "#taskId": target.id.toString()
        },
        ExpressionAttributeValues: {
          ":task": target
        }
      });

      await docClient.send(command);
      logResponse(MethodName.EDIT_TASK, `Task ${target.id} updated successfully in board ${boardId}`);
      
      return true;

    } catch (error) {
      logResponse(MethodName.EDIT_TASK, error, false);
      throw new Error("Failed to update task");
    }
  }

}