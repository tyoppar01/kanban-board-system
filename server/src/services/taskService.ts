import { Task } from "../models/task";
import { boardRepo } from "../repos/boardRepo";
import { taskRepo } from "../repos/taskRepo";

/**
 * Add New Task (Service)
 * @param task 
 * @returns 
 */
export const addTask = async (task: Task): Promise<Record<number, Task>> => {

    // add new date
    task.createdDate ?? new Date().toISOString();

    // get board object
    const board = await boardRepo.get();

    // ensure todo column list before entering repo to add task
    if (! board.columns["todo"]) {
        throw new Error("board has no todo list, check in-memory cache");
    }

    // add into taskList and columnList
    const taskList = taskRepo.add(task, board);
    return taskList;
}

/**
 * Remove an existing Task (Service)
 * @param id 
 * @param column 
 * @returns 
 */
export const removeTask = async (id: number, column: string): Promise<Task> => {

    // get board object
    const board = await boardRepo.get();

    // iterate the column list to remove task id
    // NOTE: task is preserved in taskList for further restore implementation
    // throw Error if column is not exist
    if (!board.columns[column]) {
      throw new Error(`Column ${column} not found!`);
    }

    // remove task from task list only
    const deletedTask:Task = taskRepo.remove(id, column, board);

    // ensure that it is preserved, unless implement otherwise
    if (!deletedTask) {
      throw new Error(`Task ${id} is not found in task list`);
    }

    return deletedTask;
}

/**
 * Relocate a task with DnD feature (Service)
 * @param id 
 * @param index 
 * @param currCol 
 * @param destCol 
 * @returns 
 */
export const relocateTask = async (id: number, index: number, currCol: string, destCol: string): Promise<Task> => {

    const board = await boardRepo.get();

    const currentList = board.columns[currCol];
    const destinationList = board.columns[destCol];

    // if current list not exist or task id not found in list
    if (!currentList || !currentList.includes(id)) throw new Error(`Column ${currCol} not found!`);
    
    // if destination list not exist
    if (!destinationList) throw new Error(`Column ${destCol} not found!`);
  
    // if index out of bound
    if (index < 0 || index > destinationList.length) throw new Error(`Invalid index ${index}: must be between 0 and ${destinationList.length}`);
    

    const relocatedTask:Task = taskRepo.updateColumn(id, index, currCol, destCol, board);

    // ensure that it is preserved, unless implement otherwise
    if (!relocatedTask) {
      throw new Error(`Task ${id} is not found in task list`);
    }

    return relocatedTask;
}

export const editTask = async (task: Task): Promise<Task> => {

  const board = await boardRepo.get();

  task.modifiedDate ?? new Date().toISOString();

  const targetTask = board.taskList[task.id];

  if (!targetTask) throw new Error(`Task ${task.id} not found!`);

  const updatedTask = taskRepo.update(task, board);

  if (!updatedTask) {
    throw new Error(`Task ${task.id} is not found in task list`);
  }

  return updatedTask;
}