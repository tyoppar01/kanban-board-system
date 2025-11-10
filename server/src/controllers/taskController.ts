import { Request, Response } from "express";
import { ApiResponse } from "../types/response";
import { sendFailedResponse, sendSuccessResponse } from "../utils/apiResponse";
import { ApiStatus } from "../utils/apiStatus";
import { ErrorCode } from "../utils/errorCode";
import { Task } from "../models/task";
import { TaskService } from "../services/taskService";


/**
 * Create New Task
 * @param _req 
 * @param _res 
 */
export const createTask = async (_req: Request, _res: Response) => {
    
    console.log("Receiving request to create task");

    try {
        // pre-validation on mandatory field
        const { id, title, description, createdDate }:Task = _req.body;

        // validation of input
        if (!id || !title) sendFailedResponse(_res, ApiStatus.BAD_REQUEST, ErrorCode.INVALID_INPUT);
        
        // get todolist from services
        const taskService: TaskService = TaskService.getInstance();
        const newTask = await taskService.addTask(_req.body);

        // Generate GOOD Response
        const response: ApiResponse<any> = {
            success: true,
            message: "new task has been created successfully",
            data: newTask
        }
        sendSuccessResponse(_res, response);

    } catch (err: any) {
        sendFailedResponse(_res, ApiStatus.SYSTEM_ERROR, err.message);
    }
}

/**
 * Delete Existing Task
 * @param _req 
 * @param _res 
 */
export const deleteTask = async (_req: Request, _res: Response) => {
    
    console.log("Receiving request to delete task");

    try {
        // pre-validation on mandatory field
        const { column, id } = _req.body;

        // validation of input
        if (!id || !column) sendFailedResponse(_res, ApiStatus.BAD_REQUEST, ErrorCode.UNKNOWN_ID);
        
        // get board from services
        const taskId = Number(id);
        const taskService: TaskService = TaskService.getInstance();
        const task = await taskService.removeTask(taskId, column as string);

        // Generate GOOD Response
        const response: ApiResponse<any> = {
            success: true,
            message: `task of ${id} has been deleted successfully`,
            data: task
        }
        sendSuccessResponse(_res, response);

    } catch (err: any) {
        sendFailedResponse(_res, ApiStatus.SYSTEM_ERROR, err.message);
    }
    
}

/**
 * Move Existing Task
 * @param _req 
 * @param _res 
 * @returns 
 */
export const moveTask = async (_req: Request, _res: Response) => {

    console.log("Receiving request to move task");
    
    try {
        // pre-validation on mandatory field
        const { id, index, currentColumn, newColumn } = _req.body;

        // validation of input strings
        if (![currentColumn, newColumn, index].every(v => v !== undefined && v !== "")) {
            return sendFailedResponse(_res, ApiStatus.BAD_REQUEST, ErrorCode.INVALID_INPUT);
        }

        // validation of input numbers
        const taskId = Number(id);
        const newIndex = Number(index);
        if (!Number.isInteger(newIndex) || newIndex < 0 || !Number.isInteger(taskId) || taskId < 0) {
            return sendFailedResponse(_res, ApiStatus.BAD_REQUEST, ErrorCode.INVALID_INDEX);
        }

        // get board from services
        const curr: string = currentColumn as string;
        const dest: string = newColumn as string;
        const taskService: TaskService = TaskService.getInstance();
        const task = await taskService.relocateTask(taskId, newIndex, curr, dest);

        // Generate GOOD Response
        const response: ApiResponse<any> = {
            success: true,
            message: `task of ${id} has been moved successfully from column: ${currentColumn} to column: ${newColumn}`,
            data: task
        }
        sendSuccessResponse(_res, response);

    } catch (err: any) {
        sendFailedResponse(_res, ApiStatus.SYSTEM_ERROR, err.message);
    }
    
}

/**
 * Update Existing Task
 * @param _req 
 * @param _res 
 */
export const updateTask = async (_req: Request, _res: Response) => {
    
    console.log("Receiving request to update task");

    try {
        // retrieve a task object
        const { task } = _req.body as { task: Task};

        // validation of input where title and id are not empty
        if (!task.id || !task.title) sendFailedResponse(_res, ApiStatus.BAD_REQUEST, ErrorCode.INVALID_INPUT);
        
        // get updated task from services
        const taskService: TaskService = TaskService.getInstance();
        const result: boolean = await taskService.editTask(task);

        if (!result) sendFailedResponse(_res, ApiStatus.SYSTEM_ERROR, ErrorCode.ACTION_FAILED);

        // Generate GOOD Response
        const response: ApiResponse<any> = {
            success: true,
            message: `task ${task.id} has been updated successfully`,
        }
        sendSuccessResponse(_res, response);

    } catch (err: any) {
        sendFailedResponse(_res, ApiStatus.SYSTEM_ERROR, err.message);
    }
    
}