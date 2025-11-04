import { Task } from "../models/task";
import { taskRepo } from "../repos/taskRepo";

export const addTask = async (task: Task): Promise<Record<number, Task>> => {

    // add new date
    task.createdDate ?? new Date().toISOString();

    // add into taskList and columnList
    const board = await taskRepo.add(task);
    return board;
}

export const removeTask = async (id: number, column: string): Promise<Task> => {

    const deletedTask:Task = await taskRepo.remove(id, column);
    return deletedTask;
}

export const relocateTask = async (id: number, index: number, currCol: string, destCol: string): Promise<Task> => {

    const relocatedTask:Task = await taskRepo.updateColumn(id, index, currCol, destCol);
    return relocatedTask;
}