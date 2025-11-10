export enum ErrorCode {
    INVALID_INPUT = "Input is invalid, please try again",
    SYSTEM_ERROR  = "System Error, please try again later",
    UNKNOWN_ID    = "Unknown ID cannot be proceed",
    INVALID_INDEX = "Index is not given, unable to update",
    ACTION_FAILED = "Operation has failed, please try again",
    RECORD_NOT_FOUND = "reocrd is not found",
    DUPLICATED_ID = "id cannot be repeated, please try another id",
    TASK_EXISTED = "task has already existed",
    OUT_OF_RANGE = "index provided has exceed the range limit"
}