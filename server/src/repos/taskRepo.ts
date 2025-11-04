import { Board } from "../models/board";
import { Task } from "../models/task";
import { boardRepo } from "./boardRepo";

// ==================== Task Repo ===================== //

export const taskRepo = {

  add: async (task: Task): Promise<Record<number, Task>> => {

    // get board object
    const board = await boardRepo.get();

    // get todo column list where consists of todo ids
    const todoColumnList = board.columns["todo"] ?? [];

    // append id into todo column list
    todoColumnList.push(task.id);

    // get taskList where consists of tasks
    board.taskList[task.id] = task;

    return board.taskList;
  }

};