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

export const logProcess = (methodName: MethodName, data: any, className: string = "DYNAMO_CLIENT") => {
    console.log(`[${methodName}] [${className}] [${Date}] [Data: ${data}]`);
}

export enum MethodName {
    GET_BOARD = "GET /BOARD",
    ADD_TASK =  "POST /TASK",
    EDIT_TASK = "PUT /TASK Edit",
    MOVE_TASK = "PUT /TASK DnD",
    REMOVE_TASK = "DELETE /TASK",
    ADD_COL = "POST /COLUMN",
    REMOVE_COL = "DELETE /COLUMN",
    MOVE_COL = "PUT /COLUMN DnD",
    INIT_TABLE = "CREATE /TABLE",
    TEST = "TEST CONNECTION"
}