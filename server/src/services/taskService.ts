import { Task } from "../models/task";
import { taskRepo } from "../repos/taskRepo";

export const addTask = async (task: Task): Promise<Record<number, Task>> => {

    // add new date
    task.createdDate ?? new Date().toISOString();

    // add into taskList and columnList
    const board = await taskRepo.add(task);
    return board;
}