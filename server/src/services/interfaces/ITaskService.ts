import { ITask } from "../../models/task";

/**
 * Task Service Interface
 * Defines the public contract for task operations
 */
export interface ITaskService {
    /**
     * Add a new task
     * @param task - Task object to add
     * @returns Created task object
     */
    addTask(task: ITask): Promise<ITask>;

    /**
     * Remove an existing task
     * @param id - Task ID
     * @param column - Column name containing the task
     * @returns true if removed successfully
     */
    removeTask(id: number, column: string): Promise<boolean>;

    /**
     * Relocate a task with drag and drop
     * @param taskId - Task ID to move
     * @param index - Destination index in the column
     * @param currCol - Current column name
     * @param destCol - Destination column name
     * @returns true if relocated successfully
     */
    relocateTask(taskId: number, index: number, currCol: string, destCol: string): Promise<boolean>;

    /**
     * Edit an existing task
     * @param target - Task object with updated fields
     * @returns true if edited successfully
     */
    editTask(target: ITask): Promise<boolean>;
}
