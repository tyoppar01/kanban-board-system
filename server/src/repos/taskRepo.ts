import { IBoard } from "../models/interface/board";
import { ITask } from "../models/interface/task";
import { Board } from "../models/schemaModel";

// ==================== Task Repo ===================== //

export class TaskRepo {

  private static instance: TaskRepo;

  constructor() {}

  static getInstance(): TaskRepo {
    if (!TaskRepo.instance) TaskRepo.instance = new TaskRepo();
    return TaskRepo.instance;
  }

  /**
   * Add New Task
   * @param task 
   * @returns 
   */
  async add(task: ITask): Promise<ITask> {
    try {
      await Board.findOneAndUpdate(
        {},
        {
          $push: { "columns.todo": task.id },
          $set: { [`taskList.${task.id}`]: task }
        },
        { new: true }
      ).lean();

      return task;

    } catch (error) {
      throw new Error("Failed to add task");
    }
  }

  /**
   * Remove an existing task
   * @param taskId 
   * @param column 
   * @param board 
   * @returns 
   */
  async remove(taskId: number, column: string, board: IBoard): Promise<boolean> {
    try {
      // Get the task before removing it
      const task = board.taskList[taskId];

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Remove taskId from the column and from taskList
      await Board.findOneAndUpdate(
        {},
        {
          $pull: { [`columns.${column}`]: taskId },
          $unset: { [`taskList.${taskId}`]: "" }
        },
        { new: true }
      );

      return true;

    } catch (error) {
      throw new Error("Failed to remove task");
    }
  }


  /**
   * Update Column
   * @param taskId 
   * @param currCol 
   * @param currList 
   * @param destCol 
   * @param destList 
   * @returns 
   */
  async updateColumn(
        taskId: number, 
        currCol: string, 
        currList: number[], 
        destCol: string, 
        destList: number[]): Promise<boolean>{
    try {
      const updateFields: any = {};
      updateFields[`columns.${currCol}`] = currList;
      updateFields[`columns.${destCol}`] = destList;

      await Board.findOneAndUpdate(
        {},
        {
          $set: updateFields
        },
        { new: true }
      );

      return true;

    } catch (error) {
      throw new Error("Failed to update columns");
    }
  }

  /**
   * Update Task (Details)
   * @param target 
   * @returns 
   */
  async update(target: ITask):Promise<boolean> {
    try {
      await Board.findOneAndUpdate(
        {},
        {
          $set: {
            [`taskList.${target.id}`]: target
          }
        },
        { new: true }
      );

      return true;

    } catch (error) {
      throw new Error("Failed to update task");
    }
  }

};