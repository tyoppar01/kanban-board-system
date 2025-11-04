import express from "express";
import { getBoard } from "../controllers/boardController";

const boardRouter = express.Router();

// GET /api/board/
boardRouter.get("/", getBoard);

export default boardRouter;