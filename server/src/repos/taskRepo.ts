import { TaskRepository, ColumnRepository, BoardRepository } from 'external-apis';
import { IBoard } from "../models/board";
import { ITask } from "../models/task";

/**
 * TaskRepo Adapter
 * Adapts the Prisma-based TaskRepository to work with existing server code
 */
export class TaskRepo {

  private static instance: TaskRepo;
  private taskRepository: TaskRepository;
  private columnRepository: ColumnRepository;
  private boardRepository: BoardRepository;

  constructor() {
    this.taskRepository = TaskRepository.getInstance();
    this.columnRepository = ColumnRepository.getInstance();
    this.boardRepository = BoardRepository.getInstance();
  }

  static getInstance(): TaskRepo {
    if (!TaskRepo.instance) TaskRepo.instance = new TaskRepo();
    return TaskRepo.instance;
  }

  /**
   * Add New Task
   * @param task 
   * @returns 
   */
  async add(task: ITask): Promise<ITask> {
    try {
      const boardId = await this.boardRepository.getBoardId();
      
      // Get 'todo' column
      const todoColumn = await this.columnRepository.getByName('todo', boardId);
      if (!todoColumn) {
        throw new Error("Column 'todo' not found");
      }

      // Get current tasks in todo column to determine position
      const tasks = await this.taskRepository.getByColumn(todoColumn.id);
      const position = tasks.length;

      // Create task in Prisma with frontend-provided ID
      await this.taskRepository.add({
        id: task.id, // Pass the random ID from frontend
        title: task.title,
        description: task.description,
        boardId,
        columnId: todoColumn.id,
        position
      });

      return task;

    } catch (error) {
      console.error('Failed to add task:', error);
      throw new Error("Failed to add task");
    }
  }

  /**
   * Remove an existing task
   * @param taskId 
   * @param column 
   * @param board 
   * @returns 
   */
  async remove(taskId: number, column: string, board: IBoard): Promise<boolean> {
    try {
      // Check if task exists in board
      const task = board.taskList[taskId];
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Remove task from Prisma
      await this.taskRepository.remove(taskId);

      return true;

    } catch (error) {
      console.error('Failed to remove task:', error);
      throw new Error("Failed to remove task");
    }
  }

  /**
   * Update Column (move task between columns)
   * @param taskId 
   * @param currCol 
   * @param currList 
   * @param destCol 
   * @param destList 
   * @returns 
   */
  async updateColumn(
        taskId: number, 
        currCol: string, 
        currList: number[], 
        destCol: string, 
        destList: number[]): Promise<boolean>{
    try {
      const boardId = await this.boardRepository.getBoardId();
      
      // Get destination column
      const destColumn = await this.columnRepository.getByName(destCol, boardId);
      if (!destColumn) {
        throw new Error(`Column ${destCol} not found`);
      }

      // Find the new position in destination list
      const newPosition = destList.indexOf(taskId);
      if (newPosition === -1) {
        throw new Error('Task not found in destination list');
      }

      // Update task's column and position
      await this.taskRepository.updateColumn(taskId, destColumn.id, newPosition);

      // Update positions of other tasks in the same column
      const tasksToUpdate = destList
        .map((id, index) => ({ id, position: index }))
        .filter(t => t.id !== taskId);

      if (tasksToUpdate.length > 0) {
        await this.taskRepository.updateTaskPositions(tasksToUpdate);
      }

      return true;

    } catch (error) {
      console.error('Failed to update columns:', error);
      throw new Error("Failed to update columns");
    }
  }

  /**
   * Update Task (Details)
   * @param target 
   * @returns 
   */
  async update(target: ITask):Promise<boolean> {
    try {
      await this.taskRepository.update({
        id: target.id,
        title: target.title,
        description: target.description
      });

      return true;

    } catch (error) {
      console.error('Failed to update task:', error);
      throw new Error("Failed to update task");
    }
  }

}
