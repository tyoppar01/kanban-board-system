import { prisma } from '../config/database';
import { Board, Column } from '@prisma/client';

export class BoardRepository {

  private static instance: BoardRepository;

  private constructor() {}

  static getInstance(): BoardRepository {
    if (!BoardRepository.instance) {
      BoardRepository.instance = new BoardRepository();
    }
    return BoardRepository.instance;
  }

  /**
   * Get the board with all columns and tasks
   * Creates a new board if none exists
   */
  async get(): Promise<Board & { columns: Column[] }> {
    try {
      let board = await prisma.board.findFirst({
        include: {
          columns: {
            orderBy: { position: 'asc' },
            include: {
              tasks: {
                orderBy: { position: 'asc' }
              }
            }
          }
        }
      });

      // If no board exists, create one with default columns
      if (!board) {
        board = await prisma.board.create({
          data: {
            columns: {
              create: [
                { name: 'todo', position: 0 },
                { name: 'ongoing', position: 1 },
                { name: 'completed', position: 2 }
              ]
            }
          },
          include: {
            columns: {
              orderBy: { position: 'asc' },
              include: {
                tasks: {
                  orderBy: { position: 'asc' }
                }
              }
            }
          }
        });
      }

      return board;

    } catch (error) {
      throw new Error('Failed to retrieve board');
    }
  }

  /**
   * Get board ID (creates board if not exists)
   */
  async getBoardId(): Promise<number> {
    const board = await this.get();
    return board.id;
  }

  /**
   * Add a new column to the board
   */
  async setColumn(colName: string): Promise<boolean> {
    try {
      const boardId = await this.getBoardId();
      
      // Get the current max position
      const maxPosition = await prisma.column.findFirst({
        where: { boardId },
        orderBy: { position: 'desc' },
        select: { position: true }
      });

      const newPosition = (maxPosition?.position ?? -1) + 1;

      // Create the new column
      await prisma.column.create({
        data: {
          name: colName,
          position: newPosition,
          boardId
        }
      });

      // Return updated board
      return true;

    } catch (error) {
      throw new Error('Failed to add column to board');
    }
  }

  /**
   * Remove a column from the board
   */
  async removeColumn(colName: string): Promise<boolean> {
    try {
      const boardId = await this.getBoardId();

      // Find and delete the column (tasks will be cascade deleted)
      await prisma.column.deleteMany({
        where: {
          boardId,
          name: colName
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to remove column from board:', error);
      throw new Error('Failed to remove column from board');
    }
  }

  /**
   * Move a column to a new position
   */
  async moveCol(colName: string, destIndex: number): Promise<boolean> {
    try {
      const boardId = await this.getBoardId();

      // Get all columns in order
      const columns = await prisma.column.findMany({
        where: { boardId },
        orderBy: { position: 'asc' }
      });

      const columnToMove = columns.find(col => col.name === colName);
      if (!columnToMove) {
        throw new Error(`Column ${colName} not found`);
      }

      const currIndex = columns.findIndex(col => col.name === colName);
      
      // Remove from current position
      columns.splice(currIndex, 1);
      
      // Insert at destination
      columns.splice(destIndex, 0, columnToMove);

      // Update positions for all columns
      await prisma.$transaction(
        columns.map((col, index) =>
          prisma.column.update({
            where: { id: col.id },
            data: { position: index }
          })
        )
      );

      return true;
      
    } catch (error) {
      throw new Error('Failed to move column');
    }
  }
}
