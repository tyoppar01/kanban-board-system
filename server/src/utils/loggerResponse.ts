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
        console.log(`[${methodName}] [SUCCESS] [${Date}]\n [Output: ${data}]`);
    } else {
        console.error(`[${methodName}] [FAILED] [${Date}]\n [Output: ${data}]`);
    }
};

export const logProcess = (methodName: MethodName, className: ClassName, data: any) => {
    console.log(`[${methodName}] [${className}] [${Date}] [Data: ${data}]`);
}

export enum MethodName {
    GET_BOARD = "GET /BOARD",
    ADD_TASK =  "POST /TASK",
    EDIT_TASK = "PUT /TASK Edit",
    MOVE_TASK = "PUT /TASK DnD",
    REMOVE_TASK = "DELETE /TASK",
    ADD_COL = "POST /COLUMN"
}

export enum ClassName {
    SERVICE = "SERVICE",
    REPO = "REPOSITORY",
    RESOLVE = "RESOLVER"
}