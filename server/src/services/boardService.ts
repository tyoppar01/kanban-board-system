import { Board } from "../models/board";
import { BoardRepo } from "../repos/boardRepo";

export class BoardService {

      private static instance: BoardService;

      constructor(private boardRepo: BoardRepo = BoardRepo.getInstance()) {}

      static getInstance(): BoardService {
            if (!BoardService.instance) {
                  BoardService.instance = new BoardService();
            }
            return BoardService.instance;
            }

      async getFullBoard(): Promise<Board> { 
            return await this.boardRepo.get();
      };

}



