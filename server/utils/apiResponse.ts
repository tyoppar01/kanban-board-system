import { Response } from "express";
import { ApiResponse } from "../types/response";
import { ApiStatus } from "./apiStatus";

export const sendSuccessResponse = <T extends Object>(res: Response, response: ApiResponse<T>) => {
  return res.status(ApiStatus.SUCCESS).json(response);
};

export const sendFailedResponse = <T extends Object>(res: Response, response: ApiResponse<T>) => {
  return res.status(ApiStatus.INTERNAL_ERROR).json(response);
};