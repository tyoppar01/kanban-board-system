import { Response } from "express";
import { ApiResponse } from "../types/response";
import { ApiStatus } from "./apiStatus";
import { ErrorCode } from "./errorCode";


// =============================================================================== //

/**
 * Send the SUCCESS response with reasonable information
 * @param res        response object
 * @param response   custom response object with essential information
 * @returns 
 */
export const logResponse = (methodName: MethodName, data: any, success: boolean = true) => {

    if (success) {
        console.log(`[${methodName}] Operation has conducted successfully\n [Output: ${data}]`);
    } else {
        console.error(`[${methodName}] Operation has failed to be executed\n [Output: ${data}]`);
    }
};

export enum MethodName {
    GET_BOARD = "GET /BOARD",
    ADD_TASK =  "POST /TASK",
    EDIT_TASK = "PUT /TASK Edit",
    MOVE_TASK = "PUT /TASK DnD",
    REMOVE_TASK = "DELETE /TASK"
}