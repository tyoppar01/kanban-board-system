import { DynamoBoardRepo } from "../../../external-infra/src/dynamodb/dynamodb_board";
import { IBoard } from "../models/interface/board";
import { ErrorCode } from "../utils/errorCode";

export class ColumnService {

      private static instance: ColumnService;

      constructor(private boardRepo: DynamoBoardRepo = DynamoBoardRepo.getInstance()) {}

      static getInstance(): ColumnService {
            if (!ColumnService.instance) ColumnService.instance = new ColumnService();
            return ColumnService.instance;
      }

      async addColumn(colName: string): Promise<IBoard> {
            const board: IBoard = await this.boardRepo.get();
            if (board.columns[colName]) throw new Error(ErrorCode.INVALID_INPUT);
            const output = await this.boardRepo.setColumn(colName);
            return output;
      }

      async removeColumn(colName: string): Promise<boolean> {
            const board: IBoard = await this.boardRepo.get();
            if (!board.columns[colName]) throw new Error(ErrorCode.INVALID_INPUT);
            const output = await this.boardRepo.removeColumn(colName);
            return output;
      }

      async moveColumn(colName: string, destIndex: number): Promise<boolean> {
            const board: IBoard = await this.boardRepo.get();
            
            if (!board.order) throw new Error(ErrorCode.RECORD_NOT_FOUND);
            
            // Validate destIndex is within valid range
            if (destIndex < 0 || destIndex >= board.order.length) {
                  throw new Error(ErrorCode.INVALID_INPUT);
            }
            
            const output: boolean = await this.boardRepo.moveCol(colName, destIndex, board.order);
            return output;
      }

}



