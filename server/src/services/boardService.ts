import { Board } from "../models/board";
import { BoardRepo } from "../repos/boardRepo";


const boardRepo = BoardRepo.getInstance();

export class BoardService {

      private static instance: BoardService;

      constructor() {}

      static getInstance(): BoardService {
            if (!BoardService.instance) {
                  BoardService.instance = new BoardService();
            }
            return BoardService.instance;
            }

      async getFullBoard(): Promise<Board> { 
            return await boardRepo.get();
      };

}



