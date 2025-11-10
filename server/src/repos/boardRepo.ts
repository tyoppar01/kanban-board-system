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

};
