import express = require("express");
import getBoard = require("../controllers/boardController");

const router = express.Router();

// GET /api/board/
router.get("/", getBoard);




export default router;