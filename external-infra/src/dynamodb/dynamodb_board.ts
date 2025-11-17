import { DeleteCommand, GetCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { IBoard } from "../models/board";
import { logResponse, MethodName } from "../utils/loggerResponse";
import { docClient, TABLES } from "./dynamodb_init";

// ================== DynamoDB Board Repo =================== //

export class DynamoBoardRepo {

  private static instance: DynamoBoardRepo;

  constructor() {}

  static getInstance(): DynamoBoardRepo {
    if (!DynamoBoardRepo.instance) DynamoBoardRepo.instance = new DynamoBoardRepo();
    return DynamoBoardRepo.instance;
  }

  /**
   * Get board by ID, create if doesn't exist
   * @param boardId 
   * @returns 
   */
  async get(boardId: number = 1): Promise<IBoard> {
    try {
      const command = new GetCommand({
        TableName: TABLES.BOARDS,
        Key: { id: boardId }
      });

      const result = await docClient.send(command);

      if (!result.Item) {
        // Create new board if doesn't exist
        const newBoard: IBoard = {
          id: boardId,
          taskList: {},
          columns: {},
          order: []
        };

        await this.create(newBoard);
        return newBoard;
      }
      const board = result.Item as IBoard;
      logResponse(MethodName.GET_BOARD, `Board ${boardId} retrieved successfully`);
      return board;

    } catch (error) {
      logResponse(MethodName.GET_BOARD, error, false);
      throw new Error(`Failed to retrieve board: ${error}`);
    }
  }

  /**
   * Create a new board
   * @param board 
   * @returns 
   */
  async create(board: IBoard): Promise<IBoard> {
    try {
      const command = new PutCommand({
        TableName: TABLES.BOARDS,
        Item: board
      });

      await docClient.send(command);
      logResponse(MethodName.GET_BOARD, `Board ${board.id} created successfully`);
      return board;

    } catch (error) {
      logResponse(MethodName.GET_BOARD, error, false);
      throw new Error(`Failed to create board: ${error}`);
    }
  }

  /**
   * Add a new column to the board
   * @param colName 
   * @param boardId 
   * @returns 
   */
  async setColumn(colName: string, boardId: number = 1): Promise<IBoard> {
    try {
      // First get current board to update order array
      const currentBoard = await this.get(boardId);

      const command = new UpdateCommand({
        TableName: TABLES.BOARDS,
        Key: { id: boardId },
        UpdateExpression: "SET columns.#colName = :emptyArray, #order = :newOrder",
        ExpressionAttributeNames: {
          "#colName": colName,
          "#order": "order"
        },
        ExpressionAttributeValues: {
          ":emptyArray": [],
          ":newOrder": [...currentBoard.order, colName]
        },
        ReturnValues: "ALL_NEW"
      });

      const result = await docClient.send(command);
      const updatedBoard = result.Attributes as IBoard;
      logResponse(MethodName.ADD_COL, `Column '${colName}' added to board ${boardId}`);
      return updatedBoard;

    } catch (error) {
      logResponse(MethodName.ADD_COL, error, false);
      throw new Error(`Failed to add column to board: ${error}`);
    }
  }

  /**
   * Remove a column from the board
   * @param colName 
   * @param boardId 
   * @returns 
   */
  async removeColumn(colName: string, boardId: number = 1): Promise<boolean> {
    try {
      // First get current board to update order array
      const currentBoard = await this.get(boardId);
      const newOrder = currentBoard.order.filter((col: string) => col !== colName);

      const command = new UpdateCommand({
        TableName: TABLES.BOARDS,
        Key: { id: boardId },
        UpdateExpression: "REMOVE columns.#colName SET #order = :newOrder",
        ExpressionAttributeNames: {
          "#colName": colName,
          "#order": "order"
        },
        ExpressionAttributeValues: {
          ":newOrder": newOrder
        }
      });

      await docClient.send(command);
      logResponse(MethodName.REMOVE_COL, `Column '${colName}' removed from board ${boardId}`);
      return true;

    } catch (error) {
      logResponse(MethodName.REMOVE_COL, error, false);
      throw new Error(`Failed to remove column from board: ${error}`);
    }
  }

  /**
   * Move a column to a new position
   * @param colName 
   * @param destIndex 
   * @param orderArr 
   * @param boardId 
   * @returns 
   */
  async moveCol(colName: string, destIndex: number, orderArr: string[], boardId: number = 1): Promise<boolean> {
    try {
      const newOrder = [...orderArr];
      const currIndex = newOrder.indexOf(colName);

      if (currIndex === -1) {
        throw new Error(`Column ${colName} not found in order`);
      }

      // Remove column from current position
      newOrder.splice(currIndex, 1);

      // Insert column at destination index
      newOrder.splice(destIndex, 0, colName);

      const command = new UpdateCommand({
        TableName: TABLES.BOARDS,
        Key: { id: boardId },
        UpdateExpression: "SET #order = :newOrder",
        ExpressionAttributeNames: {
          "#order": "order"
        },
        ExpressionAttributeValues: {
          ":newOrder": newOrder
        }
      });

      await docClient.send(command);
      logResponse(MethodName.MOVE_COL, `Column '${colName}' moved to position ${destIndex} in board ${boardId}`);
      return true;

    } catch (error) {
      logResponse(MethodName.MOVE_COL, error, false);
      throw new Error(`Failed to move column: ${error}`);
    }
  }

  /**
   * Update entire board
   * @param board 
   * @returns 
   */
  async updateBoard(board: IBoard): Promise<IBoard> {
    try {
      const command = new PutCommand({
        TableName: TABLES.BOARDS,
        Item: board
      });

      await docClient.send(command);
      logResponse(MethodName.GET_BOARD, `Board ${board.id} updated successfully`);
      return board;

    } catch (error) {
      logResponse(MethodName.GET_BOARD, error, false);
      throw new Error(`Failed to update board: ${error}`);
    }
  }

  /**
   * Get all boards (for multi-board support)
   * @returns 
   */
  async getAllBoards(): Promise<IBoard[]> {
    try {
      const command = new ScanCommand({
        TableName: TABLES.BOARDS
      });

      const result = await docClient.send(command);
      const boards = (result.Items || []) as IBoard[];
      logResponse(MethodName.GET_BOARD, `Retrieved ${boards.length} boards successfully`);
      return boards;

    } catch (error) {
      logResponse(MethodName.GET_BOARD, error, false);
      throw new Error(`Failed to retrieve all boards: ${error}`);
    }
  }

  /**
   * Delete a board
   * @param boardId 
   * @returns 
   */
  async deleteBoard(boardId: number): Promise<boolean> {
    try {
      const command = new DeleteCommand({
        TableName: TABLES.BOARDS,
        Key: { id: boardId }
      });

      await docClient.send(command);
      logResponse(MethodName.GET_BOARD, `Board ${boardId} deleted successfully`);
      return true;

    } catch (error) {
      logResponse(MethodName.GET_BOARD, error, false);
      throw new Error(`Failed to delete board: ${error}`);
    }
  }

}
