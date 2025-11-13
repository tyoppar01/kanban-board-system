import { IBoard } from "../models/interface/board";
import { Board } from "../models/schemaModel";

// ================== Board Repo =================== //

export class BoardRepo {

  private static instance: BoardRepo;

  constructor() {}

  static getInstance(): BoardRepo {
    if (!BoardRepo.instance) BoardRepo.instance = new BoardRepo();
    return BoardRepo.instance;
  }

  async get(): Promise<IBoard> {
    try {
      let board = await Board.findOne().lean();

      if (!board) {
        const newBoard = new Board();
        await newBoard.save();
        board = await Board.findOne().lean();
      }

      return board as IBoard;

    } catch (error) {
      throw new Error("Failed to retrieve board");
    }
  }

  async setColumn(colName: string, board: IBoard): Promise<IBoard> {
    try {
      const updatedBoard = await Board.findOneAndUpdate(
        {},
        {
          $set: {
            [`columns.${colName}`]: [],
            order: [...board.order, colName]
          }
        },
        { new: true }
      ).lean();

      return updatedBoard as IBoard;
      
    } catch (error) {
      throw new Error("Failed to add column to board");
    }
  }

  async removeColumn(colName: string): Promise<boolean> {
    try {
      const updatedBoard = await Board.findOneAndUpdate(
        {},
        {
          $pull: { order: colName },
          $unset: { [`columns.${colName}`]: "" }
        },
        { new: true }
      ).lean();

      return true;

    } catch (error) {
      throw new Error("Failed to remove column from board");
    }
  }

  async moveCol(colName: string, destIndex: number, orderArr: string[]): Promise<boolean> {
    try {
      const newOrder = [...orderArr];
      const currIndex = newOrder.indexOf(colName);
      
      if (currIndex === -1) {
        throw new Error(`Column ${colName} not found in order`);
      }

      // Remove column from current position
      newOrder.splice(currIndex, 1);
      
      // Insert column at destination index
      newOrder.splice(destIndex, 0, colName);

      // Update the board with new order
      const updatedBoard = await Board.findOneAndUpdate(
        {},
        {
          $set: { order: newOrder }
        },
        { new: true }
      ).lean();

      return true;

    } catch (error) {
      throw new Error("Failed to move column");
    }
  }

};
