import { Request, Response } from "express";
import { ApiResponse } from "../../types/response";
import { sendFailedResponse, sendSuccessResponse } from "../../utils/apiResponse";
import { ApiStatus } from "../../utils/apiStatus";
import { ErrorCode } from "../../utils/errorCode";
import { Task } from "../models/task";
import { addTask } from "../services/taskService";

export const createTask = async (_req: Request, _res: Response) => {
    
    try {
        // pre-validation on mandatory field
        const { id, title, description, createdDate }:Task = _req.body;

        // validation of input
        if (!id || !title) sendFailedResponse(_res, ApiStatus.BAD_REQUEST, ErrorCode.INVALID_INPUT);
        
        // get board from services
        const board = await addTask(_req.body);

        // Generate GOOD Response
        const response: ApiResponse<any> = {
            success: true,
            message: "new task has been created successfully",
            data: board
        }
        sendSuccessResponse(_res, response);

    } catch (err: any) {
        sendFailedResponse(_res, ApiStatus.SYSTEM_ERROR, ErrorCode.SYSTEM_ERROR);
    }
}