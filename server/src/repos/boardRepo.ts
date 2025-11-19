import { BoardRepository } from 'external-apis';
import { IBoard } from "../models/board";

/**
 * BoardRepo Adapter
 * Adapts the Prisma-based BoardRepository to work with existing server code
 * This maintains the same interface as the old Mongoose-based BoardRepo
 */
export class BoardRepo {

  private static instance: BoardRepo;
  private boardRepository: BoardRepository;

  constructor() {
    this.boardRepository = BoardRepository.getInstance();
  }

  static getInstance(): BoardRepo {
    if (!BoardRepo.instance) BoardRepo.instance = new BoardRepo();
    return BoardRepo.instance;
  }

  /**
   * Get board with all columns and tasks
   * Transforms Prisma data structure to match IBoard interface
   */
  async get(): Promise<IBoard> {
    try {

      // retrieve from prisma ORM
      const board = await this.boardRepository.get();
      
      // Transform Prisma structure to IBoard format
      const taskList: Record<number, any> = {};
      const columns: Record<string, number[]> = {};
      const order: string[] = [];

      // Build columns object and order array
      board.columns.forEach((column: any) => {
        columns[column.name] = column.tasks.map((task: any) => task.id);
        order.push(column.name);
      });

      // Build taskList object
      board.columns.forEach((column: any) => {
        column.tasks.forEach((task: any) => {
          taskList[task.id] = {
            id: task.id,
            title: task.title
          };
        });
      });

      // return typed IBoard
      return {
        id: board.id,
        taskList,
        columns,
        order
      } as IBoard;

    } catch (error) {
      throw new Error("Failed to retrieve board");
    }
  }

  /**
   * Add a new column to the board
   */
  async setColumn(colName: string): Promise<IBoard> {
    try {
      await this.boardRepository.setColumn(colName);
      return await this.get();
    } catch (error) {
      throw new Error("Failed to add column to board");
    }
  }

  /**
   * Remove a column from the board
   */
  async removeColumn(colName: string): Promise<boolean> {
    try {
      return await this.boardRepository.removeColumn(colName);
    } catch (error) {
      throw new Error("Failed to remove column from board");
    }
  }

  /**
   * Move a column to a new position
   */
  async moveCol(colName: string, destIndex: number): Promise<boolean> {
    try {
      return await this.boardRepository.moveCol(colName, destIndex);
    } catch (error) {
      throw new Error("Failed to move column");
    }
  }

}
