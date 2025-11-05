import express from "express";
import { createTask, deleteTask, moveTask } from "../controllers/taskController";

const taskRouter = express.Router();

// POST /api/task/
taskRouter.post("/", createTask);

// DELETE /api/task/id/column
taskRouter.delete("/delete", deleteTask);

// PUT /api/task/move
taskRouter.put("/move", moveTask);

export default taskRouter;
