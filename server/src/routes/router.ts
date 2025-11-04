import express from "express";
import { getBoard } from "../controllers/boardController";

const kanbanBoardRouter = express.Router();

// GET /api/board/
kanbanBoardRouter.get("/", getBoard);

export default kanbanBoardRouter;
