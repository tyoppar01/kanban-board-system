import express from "express";
import { createTask, deleteTask, moveTask } from "../controllers/taskController";

const taskRouter = express.Router();

// POST /api/task/
taskRouter.post("/", createTask);

// DELETE /api/task/id/column
taskRouter.delete("/:id/:column", deleteTask);

// PUT /api/task/id/index/arrayName
taskRouter.put("/:id/:index/:arrayName", moveTask);

export default taskRouter;
