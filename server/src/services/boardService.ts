import { Board } from "../models/board";
import { BoardRepo } from "../repos/boardRepo";
import { logResponse, MethodName } from "../utils/loggerResponse";

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
            const output = await this.boardRepo.get();
            logResponse(MethodName.GET_BOARD, output);
            return output;
      };

}



