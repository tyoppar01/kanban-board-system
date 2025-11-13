import { IBoard } from "../models/interface/board";
import { BoardRepo } from "../repos/boardRepo";
import { ErrorCode } from "../utils/errorCode";

export class ColumnService {

      private static instance: ColumnService;

      constructor(private boardRepo: BoardRepo = BoardRepo.getInstance()) {}

      static getInstance(): ColumnService {
            if (!ColumnService.instance) {
                  ColumnService.instance = new ColumnService();
            }
            return ColumnService.instance;
            }

      async addColumn(colName: string): Promise<IBoard> {
            const board: IBoard = await this.boardRepo.get();
            if (board.columns[colName]) throw new Error(ErrorCode.INVALID_INPUT);
            const output = this.boardRepo.setColumn(colName, board);
            return output;
      }

      async removeColumn(colName: string): Promise<IBoard> {
            const board: IBoard = await this.boardRepo.get();
            if (!board.columns[colName]) throw new Error(ErrorCode.INVALID_INPUT);
            const output = this.boardRepo.removeColumn(colName);
            return output;
      }

}



