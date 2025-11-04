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
  add: async (task: Task): Promise<Record<number, Task>> => {

    // ================================= GET OPERATION ================================= //

    // get board object
    const board = await boardRepo.get();

    // get todo column list where consists of todo ids
    const todoColumnList = board.columns["todo"] ?? [];

    // ============================== INSERT OPERATION ============================== //

    // append id into todo column list
    todoColumnList.push(task.id);

    // get taskList where consists of tasks
    board.taskList[task.id] = task;

    // ============================= COMPLETED OPERATION ============================= //

    return board.taskList;
  },

  /**
   * Remove an existing task
   * @param taskId 
   * @param column 
   * @returns 
   */
  remove: async (taskId: number, column: string): Promise<Task> => {
    
    // get board object
    const board = await boardRepo.get();

    // iterate the column list to remove task id
    // NOTE: task is preserved in taskList for further restore implementation
    const colList = board.columns[column]
    
    // throw Error if column is not exist
    if (!colList) {
      throw new Error(`Column ${column} not found!`);
    }

    // remove taskId from the column list
    board.columns[column] = colList.filter((id) => id !== taskId);


    // persist changes

    // return the object
    const removedTask = board.taskList[taskId];

    // ensure that it is preserved, unless implement otherwise
    if (!removedTask) {
      throw new Error(`Task ${taskId} is not found in task list`);
    }

    return removedTask;
  },

  /**
   * Update Task (Drag and Drop feature)
   * @param taskId 
   * @param index 
   * @param currCol 
   * @param destCol 
   * @returns 
   */
  updateColumn: async (taskId: number, index: number, currCol: string, destCol: string): Promise<Task> => {
    
    // ================================= GET OPERATION ================================= //

    const board = await boardRepo.get();

    const currentList = board.columns[currCol];
    const destinationList = board.columns[destCol];
    
    // =============================== VALIDATION OPERATION =============================== //

    // if current list not exist or task id not found in list
    if (!currentList || !currentList.includes(taskId)) throw new Error(`Column ${currCol} not found!`);
    
    // if destination list not exist
    if (!destinationList) throw new Error(`Column ${destCol} not found!`);
  
    // if index out of bound
    if (index < 0 || index > destinationList.length) throw new Error(`Invalid index ${index}: must be between 0 and ${destinationList.length}`);
    
    // ============================== UPDATE OPERATION ============================== //

    // remove taskId from the column list
    board.columns[currCol] = currentList.filter((id) => id !== taskId);

    // insert task id at selected index at destination list
    const newDestinationList: number[] = [
      ...destinationList.slice(0, index),
      taskId,
      ...destinationList.slice(index)
    ];

    board.columns[destCol] = newDestinationList;

    // ============================= COMPLETED OPERATION ============================= //

    const updatedTask = board.taskList[taskId];

    // ensure that it is preserved, unless implement otherwise
    if (!updatedTask) {
      throw new Error(`Task ${taskId} is not found in task list`);
    }

    return updatedTask;
  },

};