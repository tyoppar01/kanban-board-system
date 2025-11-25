import { prisma } from '../config/database';
import { Task } from '@prisma/client';

export interface ITaskCreate {
  id?: number; // Optional: frontend-provided random ID
  title: string;
  description?: string;
  boardId: number;
  columnId: number;
  position: number;
}

export interface ITaskUpdate {
  id: number;
  title?: string;
  description?: string;
}

/**
 * Task Repository
 * Handles all database operations for tasks
 */
export class TaskRepository {
  private static instance: TaskRepository;

  private constructor() {}

  static getInstance(): TaskRepository {
    if (!TaskRepository.instance) {
      TaskRepository.instance = new TaskRepository();
    }
    return TaskRepository.instance;
  }

  /**
   * Add a new task to a column
   */
  async add(taskData: ITaskCreate): Promise<Task> {
    try {
      const task = await prisma.task.create({
        data: {
          id: taskData.id, // Use frontend-provided ID if available
          title: taskData.title,
          description: taskData.description,
          position: taskData.position,
          boardId: taskData.boardId,
          columnId: taskData.columnId
        }
      });

      return task;
    } catch (error) {
      console.error('Failed to add task:', error);
      throw new Error('Failed to add task');
    }
  }

  /**
   * Remove a task
   */
  async remove(taskId: number): Promise<boolean> {
    try {
      await prisma.task.delete({
        where: { id: taskId }
      });

      return true;
    } catch (error) {
      console.error('Failed to remove task:', error);
      throw new Error('Failed to remove task');
    }
  }

  /**
   * Update task details (title, description)
   */
  async update(taskData: ITaskUpdate): Promise<boolean> {
    try {
      await prisma.task.update({
        where: { id: taskData.id },
        data: {
          title: taskData.title,
          description: taskData.description,
          modifiedDate: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw new Error('Failed to update task');
    }
  }

  /**
   * Move task to a different column and/or position
   */
  async updateColumn(
    taskId: number,
    destColumnId: number,
    destPosition: number
  ): Promise<boolean> {
    try {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          columnId: destColumnId,
          position: destPosition,
          modifiedDate: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to update task column:', error);
      throw new Error('Failed to update task column');
    }
  }

  /**
   * Update positions of multiple tasks in a column
   */
  async updateTaskPositions(
    tasks: Array<{ id: number; position: number }>
  ): Promise<boolean> {
    try {
      await prisma.$transaction(
        tasks.map(task =>
          prisma.task.update({
            where: { id: task.id },
            data: { position: task.position }
          })
        )
      );

      return true;
    } catch (error) {
      console.error('Failed to update task positions:', error);
      throw new Error('Failed to update task positions');
    }
  }

  /**
   * Get task by ID
   */
  async getById(taskId: number): Promise<Task | null> {
    try {
      return await prisma.task.findUnique({
        where: { id: taskId }
      });
    } catch (error) {
      console.error('Failed to get task:', error);
      throw new Error('Failed to get task');
    }
  }

  /**
   * Get all tasks in a column
   */
  async getByColumn(columnId: number): Promise<Task[]> {
    try {
      return await prisma.task.findMany({
        where: { columnId },
        orderBy: { position: 'asc' }
      });
    } catch (error) {
      console.error('Failed to get tasks by column:', error);
      throw new Error('Failed to get tasks by column');
    }
  }
}
