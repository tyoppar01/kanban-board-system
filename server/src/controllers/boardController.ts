import { Request, Response } from "express";
import { ApiResponse } from "../types/response";
import { sendFailedResponse, sendSuccessResponse } from "../utils/apiResponse";
import { ApiStatus } from "../utils/apiStatus";
import { ErrorCode } from "../utils/errorCode";
import { BoardService } from "../services/boardService";

const boardService = BoardService.getInstance();

export const getBoard = async function (_req: Request, _res: Response){

    try {
        // GET board
        const board = await boardService.getFullBoard();

        // Generate GOOD Response
        const response: ApiResponse<any> = {
            success: true,
            message: "board details has been received successfully",
            data: board
        }

        // Return Response
        sendSuccessResponse(_res, response);

    } catch (err: any) {
        sendFailedResponse(_res, ApiStatus.SYSTEM_ERROR, ErrorCode.SYSTEM_ERROR);
    }

}