import { IBoard } from "../../models/board";

/**
 * Column Service Interface
 * Defines the public contract for column operations
 */
export interface IColumnService {
    /**
     * Add a new column to the board
     * @param colName - Name of the column to add
     * @returns Updated board object
     */
    addColumn(colName: string): Promise<IBoard>;

    /**
     * Remove an existing column from the board
     * @param colName - Name of the column to remove
     * @returns true if removed successfully
     */
    removeColumn(colName: string): Promise<boolean>;

    /**
     * Move a column to a different position
     * @param colName - Name of the column to move
     * @param destIndex - Destination index for the column
     * @returns true if moved successfully
     */
    moveColumn(colName: string, destIndex: number): Promise<boolean>;
}
