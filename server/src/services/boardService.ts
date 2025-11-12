import { IBoard } from "../models/interface/board";
import { BoardRepo } from "../repos/boardRepo";
import { ErrorCode } from "../utils/errorCode";
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

      async addColumn(colName: string): Promise<IBoard> {
            const board: IBoard = await this.boardRepo.get();
            if (board.columns[colName]) throw new Error(ErrorCode.INVALID_INPUT);
            const output = this.boardRepo.setColumn(colName, board);
            return output;
      }

}



