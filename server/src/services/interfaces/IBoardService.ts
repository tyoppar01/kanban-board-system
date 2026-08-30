import { IBoard } from "../../models/board";

/**
 * Board Service Interface
 * Defines the public contract for board operations
 */
export interface IBoardService {
    /**
     * Get full board with all columns and tasks
     * @returns Complete board object
     */
    getFullBoard(): Promise<IBoard>;
}
