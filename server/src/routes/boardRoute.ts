import express, { Request, Response } from "express";
import { getFullBoard } from "../services/boardService";

const boardRouter = express.Router();

// GET /api/board/
boardRouter.get("/", async (_, res: Response) => {
      console.log("GET /api/board called");
      try {
            console.log("GET successss");
            return res.json(await getFullBoard());
      } catch (err: any) {
            return res.status(404).json({ success: false, message: err.mes });
      }
});

export default boardRouter;