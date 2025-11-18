import { DynamoBoardRepo } from "../../../external-infra/src/dynamodb/dynamodb_board";
import { IBoard } from "../models/interface/board";

export class BoardService {

      private static instance: BoardService;

      constructor(private boardRepo: DynamoBoardRepo = DynamoBoardRepo.getInstance()) {}

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



