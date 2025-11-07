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
export const sendSuccessResponse = <T extends ApiResponse<any>>(res: Response, response:T) => {
  console.log(response);
  return res.status(ApiStatus.SUCCESS).json(response);
};

// =============================================================================== //

/**
 * Send the ERROR response with reasonable information
 * @param res         response object
 * @param status      status of api call
 * @param errorCode   reason of api call has failed
 * @returns 
 */
export const sendFailedResponse = <T extends ErrorCode>(res: Response, status: ApiStatus, errorCode: T) => {
  console.log(errorCode);
  return res.status(status).json( { success: false, message: errorCode } );
};
