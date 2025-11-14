import { ITask } from "../models/interface/task";
import { BoardRepo } from "../repos/boardRepo";
import { TaskRepo } from "../repos/taskRepo";
import { ErrorCode } from "../utils/errorCode";
import { logResponse, MethodName } from "../utils/loggerResponse";

type EditableTaskFields = Omit<ITask, "id" | "createdDate">;

export class TaskService {

  private static instance: TaskService;

  constructor(private taskRepo: TaskRepo = TaskRepo.getInstance(), private boardRepo: BoardRepo = BoardRepo.getInstance()) {}

  static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  /**
   * Add New Task (Service)
   * @param task 
   * @returns 
   */
  async addTask(task: ITask): Promise<ITask> {

    if (!task.id || !task.title) throw new Error(ErrorCode.INVALID_INPUT)

    // add new date
    task.createdDate ?? new Date().toISOString();

    // get board object
    const board = await this.boardRepo.get();

    // ensure todo column list before entering repo to add task
    if (! board.columns["todo"]) {
      throw new Error(`Column [todo] ${ErrorCode.RECORD_NOT_FOUND}`);
    }

    // ensure no task existed with duplicated id
    if (board.taskList[task.id]) {
      throw new Error(ErrorCode.TASK_EXISTED);
    }

    // add into taskList and columnList
    const output = this.taskRepo.add(task);
    logResponse(MethodName.ADD_TASK, output);
    return task;
  }

  /**
   * Remove an existing Task (Service)
   * @param id 
   * @param column 
   * @returns 
   */
  async removeTask(id: number, column: string): Promise<boolean>{

    if (!id || !column) {
      throw new Error(ErrorCode.INVALID_INPUT);
    }

    // get board object
    const board = await this.boardRepo.get();

    // iterate the column list to remove task id
    // NOTE: task is preserved in taskList for further restore implementation
    // throw Error if column is not exist
    if (!board.columns[column]) {
      throw new Error(`Column ${column} ${ErrorCode.RECORD_NOT_FOUND}`);
    }

    // remove task from column and taskList
    const deletedTask: boolean = await this.taskRepo.remove(id, column, board);

    // ensure that it is preserved, unless implement otherwise
    if (!deletedTask) {
      throw new Error(`Task ${id} ${ErrorCode.RECORD_NOT_FOUND}`);
    }
    logResponse(MethodName.REMOVE_TASK, deletedTask);
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
  async relocateTask(taskId: number, index: number, currCol: string, destCol: string): Promise<boolean> {

      if (![currCol, destCol, index].every(v => v !== undefined && v !== "")) {
        throw new Error(ErrorCode.INVALID_INPUT)
      }

      const board = await this.boardRepo.get();

      const currentList = board.columns[currCol];
      const destinationList = board.columns[destCol];

      // pre-validation of existing task is located at appropriate location

      // if current list not exist or task id not found in list
      if (!currentList || !currentList.includes(taskId)) throw new Error(`Column ${currCol} ${ErrorCode.RECORD_NOT_FOUND}`);
      
      // if destination list not exist
      if (!destinationList) throw new Error(`Column ${destCol} ${ErrorCode.RECORD_NOT_FOUND}`);
    
      // if index out of bound
      if (index < 0 || index > destinationList.length) throw new Error(`${ErrorCode.OUT_OF_RANGE} Invalid index: ${index}: Expected index: [0, ${destinationList.length}]`);
      

      // copy version of column only (used by both cases)
      const columnList = [...board.columns[currCol]!];

      // If is moved within same column, reorder the sequence only
      if (currCol === destCol) {

        // Find current position
        const currentIndex = columnList.findIndex(id => id === taskId);

        if (currentIndex === -1) throw new Error(`Task ${taskId} ${ErrorCode.RECORD_NOT_FOUND}`);

        // reorder current array
        columnList.splice(currentIndex, 1);
        columnList.splice(index, 0, taskId);

        const result = await this.taskRepo.updateColumn(taskId, currCol, columnList, destCol, columnList);

        if (!result) throw new Error(ErrorCode.ACTION_FAILED);
        logResponse(MethodName.MOVE_TASK, result);
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
      const result = await this.taskRepo.updateColumn(taskId, currCol, newOriginList, destCol, newDestList);

      // ensure that it is preserved, unless implement otherwise
      if (!result) throw new Error(ErrorCode.ACTION_FAILED);
      logResponse(MethodName.MOVE_TASK, result);
      return result;
  }

  /**
   * Edit an existing task
   * @param target 
   * @returns 
   */
  async editTask(target: ITask): Promise<boolean> {

    if (!target.id || !target.title) {
      throw new Error(ErrorCode.INVALID_INPUT)
    }

    const board = await this.boardRepo.get();

    target.modifiedDate ?? new Date().toISOString();

    // modify targeted task via id in dictionary
    const currTask = board.taskList[target.id];

    if (!currTask) throw new Error(`Task ${target.id}  ${ErrorCode.RECORD_NOT_FOUND}`);

    // restrict changes based on EditableTaskFields
    const partialUpdate: EditableTaskFields = {
      title: target.title ?? currTask!.title,
      description: target.description ?? currTask?.description,
      modifiedDate: target.modifiedDate,
    }

    // updated object task
    const updatedTask: ITask = { 
      ...currTask, 
      ...partialUpdate 
    } as ITask;

    const result = await this.taskRepo.update(updatedTask);

    if (!result) {
      throw new Error(`Task ${target.id}  ${ErrorCode.RECORD_NOT_FOUND}`);
    }

    logResponse(MethodName.EDIT_TASK, result);

    return result;
  }

}