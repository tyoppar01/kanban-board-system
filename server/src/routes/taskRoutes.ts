import express from "express";
import { createTask } from "../controllers/taskController";

const taskRouter = express.Router();

// POST /api/task/
taskRouter.post("/", createTask)

export default taskRouter;
