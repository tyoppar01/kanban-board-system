import { Request, Response } from "express";
import boardService = require("../services/boardService");
import { ApiResponse } from "../../types/response";
import { sendSuccessResponse, sendFailedResponse } from "../../utils/apiResponse";

export const getBoard = async function (_req: Request, res: Response){

    try {
        const board = await boardService.getFullBoard();

        // create a generic response
        const response: ApiResponse<typeof board> = {
                success: true,
                message: "Board fetched successfully",
                data: board
        };
        sendSuccessResponse(res, response);

    } catch (err: any) {

        // create a generic error response
        const errorResponse: ApiResponse<any> = {
                success: false,
                message: "Internal Server Error"
        };
        sendFailedResponse(res, errorResponse);
    }

}