import { IBoard } from "../models/interface/board";
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

      async getFullBoard(): Promise<IBoard> { 
            const board = await this.boardRepo.get();
            const output: IBoard = {
                  id: board.id,
                  taskList: board.taskList,
                  columns: board.columns,
                  order: board.order
            } as IBoard;
            return output;
      };

}



