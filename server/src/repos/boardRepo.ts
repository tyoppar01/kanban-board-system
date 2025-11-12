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

};
