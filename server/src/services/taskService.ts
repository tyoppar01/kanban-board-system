import { Task } from "../models/task";
import { boardRepo } from "../repos/boardRepo";
import { taskRepo } from "../repos/taskRepo";

type EditableTaskFields = Omit<Task, "id" | "createdDate">;

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
export const relocateTask = async (taskId: number, index: number, currCol: string, destCol: string): Promise<boolean> => {

    const board = await boardRepo.get();

    const currentList = board.columns[currCol];
    const destinationList = board.columns[destCol];

    // pre-validation of existing task is located at appropriate location

    // if current list not exist or task id not found in list
    if (!currentList || !currentList.includes(taskId)) throw new Error(`Column ${currCol} not found!`);
    
    // if destination list not exist
    if (!destinationList) throw new Error(`Column ${destCol} not found!`);
  
    // if index out of bound
    if (index < 0 || index > destinationList.length) throw new Error(`Invalid index ${index}: must be between 0 and ${destinationList.length}`);
    

    // copy version of column only (used by both cases)
    const columnList = [...board.columns[currCol]!];

    // If is moved within same column, reorder the sequence only
    if (currCol === destCol) {

      // Find current position
      const currentIndex = columnList.findIndex(id => id === taskId);

      if (currentIndex === -1) throw new Error(`Task ${taskId} not found in column ${currCol}`);

      // reorder current array
      columnList.splice(currentIndex, 1);
      columnList.splice(index, 0, taskId);

      const result: boolean = taskRepo.updateColumn(taskId, currCol, columnList, destCol, columnList, board);

      if (!result) throw new Error(`Task ${taskId} is not moved in task list, operation has failed`);

      return result;
    }

    // Else, arrange on 2 different columns
    const newOriginList: number[] = columnList.filter((id) => id !== taskId);

    // create new column to insert task id at selected index at destination list
    const newDestList: number[] = [
      ...destinationList.slice(0, index),
      taskId,
      ...destinationList.slice(index)
    ];

    // update column
    const result: boolean = taskRepo.updateColumn(taskId, currCol, newOriginList, destCol, newDestList, board);

    // ensure that it is preserved, unless implement otherwise
    if (!result) throw new Error(`Task ${taskId} is not moved in task list, operation has failed`);
    
    return result;
}

export const editTask = async (target: Task): Promise<boolean> => {

  const board = await boardRepo.get();

  target.modifiedDate ?? new Date().toISOString();

  // modify targeted task via id in dictionary
  const currTask = board.taskList[target.id];

  if (!currTask) throw new Error(`Task ${target.id} not found!`);

  // restrict changes based on EditableTaskFields
  const partialUpdate: EditableTaskFields = {
    title: target.title ?? currTask!.title,
    description: target.description ?? currTask?.description,
    modifiedDate: target.modifiedDate,
  }

  // updated object task
  const updatedTask: Task = { 
    ...currTask, 
    ...partialUpdate 
  } as Task;

  const result: boolean = taskRepo.update(updatedTask, board);

  if (!result) {
    throw new Error(`Task ${target.id} is not found in task list`);
  }

  return result;
}