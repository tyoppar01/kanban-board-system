import { Board } from "../models/board";
import { Task } from "../models/task";
import { boardRepo } from "./boardRepo";

// ==================== Task Repo ===================== //

export const taskRepo = {

  /**
   * Add New Task
   * @param task 
   * @returns 
   */
  add: (board: Board, task: Task): Record<number, Task> => {

    // append id into todo column list
    board.columns["todo"]!.push(task.id);

    // get taskList where consists of tasks
    board.taskList[task.id] = task;

    return board.taskList;
  },

  /**
   * Remove an existing task
   * @param taskId 
   * @param column 
   * @returns 
   */
  remove: (taskId: number, column: string, board: Board): Task => {
    
    // remove taskId from the column list
    board.columns[column] = board.columns[column]!.filter((id) => id !== taskId);

    // return the object
    return board.taskList[taskId]!;
  },

  /**
   * Update Task (Drag and Drop feature)
   * @param taskId 
   * @param index 
   * @param currCol 
   * @param destCol 
   * @returns 
   */
  updateColumn: (taskId: number, index: number, currCol: string, destCol: string, board: Board): Task => {
    
    // retrieve current and destination arrays
    const currentList = board.columns[currCol]!;
    const destinationList = board.columns[destCol]!;

    // remove taskId from the column list
    board.columns[currCol] = currentList.filter((id) => id !== taskId);

    // insert task id at selected index at destination list
    const newDestinationList: number[] = [
      ...destinationList.slice(0, index),
      taskId,
      ...destinationList.slice(index)
    ];

    board.columns[destCol] = newDestinationList;

    return board.taskList[taskId]!;
  },

};