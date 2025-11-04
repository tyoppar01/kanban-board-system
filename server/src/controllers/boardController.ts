import type { Request, Response } from "express";
import boardService = require("../services/boardService")

export const getBoard = async function (req: Request, res: Response){

    try {
        const boards = await boardService.getFullBoard();
        res.status(200).json({ success: false, statusCode: 200, message: board });
    } catch (err: any) {
        res.status(500).json({ success: false, statusCode: 500, message: err.message });
    }

}