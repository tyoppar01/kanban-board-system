import { IBoard } from "../models/interface/board";
import { ITask } from "../models/interface/task";

// ==================== Task Repo ===================== //

export class TaskRepo {

  private static instance: TaskRepo;

  constructor() {}

  static getInstance(): TaskRepo {
    if (!TaskRepo.instance) {
      TaskRepo.instance = new TaskRepo();
    }
    return TaskRepo.instance;
  }

  /**
   * Add New Task
   * @param task 
   * @returns 
   */
  add(task: ITask, board: IBoard): Record<number, ITask> {

    // append id into todo column list
    board.columns["todo"]!.push(task.id);

    // get taskList where consists of tasks
    board.taskList[task.id] = task;

    return board.taskList;
  }

  /**
   * Remove an existing task
   * @param taskId 
   * @param column 
   * @returns 
   */
  remove(taskId: number, column: string, board: IBoard): ITask {
    
    // remove taskId from the column list
    board.columns[column] = board.columns[column]!.filter((id) => id !== taskId);

    // return the object
    return board.taskList[taskId]!;
  }


  /**
   * Update Column
   * @param taskId 
   * @param currCol 
   * @param currList 
   * @param destCol 
   * @param destList 
   * @param board 
   * @returns 
   */
  updateColumn(
        taskId: number, 
        currCol: string, 
        currList: number[], 
        destCol: string, 
        destList: number[], 
        board: IBoard): boolean{

    board.columns[currCol] = currList;
    board.columns[destCol] = destList;

    return true;
  }

  /**
   * Update Task (Details)
   * @param target 
   * @param board 
   * @returns 
   */
  update(target: ITask, board: IBoard):boolean {

    board.taskList[target.id] = target;
    return true;
  }

};