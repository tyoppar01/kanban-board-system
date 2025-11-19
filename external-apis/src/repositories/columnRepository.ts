import { prisma } from '../config/database';
import { Column } from '@prisma/client';

export interface IColumnCreate {
  name: string;
  position: number;
  boardId: number;
}

export interface IColumnUpdate {
  id: number;
  name?: string;
  position?: number;
}

/**
 * Column Repository
 * Handles all database operations for columns
 */
export class ColumnRepository {
  private static instance: ColumnRepository;

  private constructor() {}

  static getInstance(): ColumnRepository {
    if (!ColumnRepository.instance) {
      ColumnRepository.instance = new ColumnRepository();
    }
    return ColumnRepository.instance;
  }

  /**
   * Get column by name
   */
  async getByName(name: string, boardId: number): Promise<Column | null> {
    try {
      return await prisma.column.findFirst({
        where: {
          name,
          boardId
        }
      });
    } catch (error) {
      console.error('Failed to get column:', error);
      throw new Error('Failed to get column');
    }
  }

  /**
   * Get column by ID
   */
  async getById(id: number): Promise<Column | null> {
    try {
      return await prisma.column.findUnique({
        where: { id }
      });
    } catch (error) {
      console.error('Failed to get column:', error);
      throw new Error('Failed to get column');
    }
  }

  /**
   * Get all columns for a board
   */
  async getAll(boardId: number): Promise<Column[]> {
    try {
      return await prisma.column.findMany({
        where: { boardId },
        orderBy: { position: 'asc' }
      });
    } catch (error) {
      console.error('Failed to get columns:', error);
      throw new Error('Failed to get columns');
    }
  }

  /**
   * Create a new column
   */
  async create(columnData: IColumnCreate): Promise<Column> {
    try {
      return await prisma.column.create({
        data: columnData
      });
    } catch (error) {
      console.error('Failed to create column:', error);
      throw new Error('Failed to create column');
    }
  }

  /**
   * Update a column
   */
  async update(columnData: IColumnUpdate): Promise<Column> {
    try {
      return await prisma.column.update({
        where: { id: columnData.id },
        data: {
          name: columnData.name,
          position: columnData.position
        }
      });
    } catch (error) {
      console.error('Failed to update column:', error);
      throw new Error('Failed to update column');
    }
  }

  /**
   * Delete a column
   */
  async delete(id: number): Promise<boolean> {
    try {
      await prisma.column.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Failed to delete column:', error);
      throw new Error('Failed to delete column');
    }
  }
}
