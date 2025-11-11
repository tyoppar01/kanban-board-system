import { Board } from "../models/board";
import { board } from "../utils/mockData"

// ================== Board Repo =================== //

export class BoardRepo {

  private static instance: BoardRepo;

  constructor() {}

  static getInstance(): BoardRepo {
    if (!BoardRepo.instance) {
      BoardRepo.instance = new BoardRepo();
    }
    return BoardRepo.instance;
  }

  async get(): Promise<Board> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(board), 100); 
    });
  }

  async setColumn(colName: string, board: Board): Promise<Board> {

    board.columns[colName] = []
    board.order.push(colName)

    return board;
  }

};
