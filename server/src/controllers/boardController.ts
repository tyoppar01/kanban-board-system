import express, { Request, Response } from "express";
import boardService = require("../services/boardService");

export const getBoard = async function (req: Request, res: Response){

    try {
        const board = await boardService.getFullBoard();
        console.log(JSON.stringify(board));
        return res.status(200).json({ success: false, statusCode: 200, message: board });
    } catch (err: any) {
        return res.status(500).json({ success: false, statusCode: 500, message: err.message });
    }

}