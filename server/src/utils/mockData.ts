// src/utils/db.ts
import { Board } from "../models/board"

export const board: Board = {
  taskList: {
    1: { id: 1, title: "Setup project structure" },
    2: { id: 2, title: "Implement Express routes" },
    3: { id: 3, title: "Add service layer" },
    4: { id: 4, title: "Test API endpoints" },
  },
  columns: {
    todo: [1, 2],
    ongoing: [3],
    done: [4],
  },
  order: ["todo", "ongoing", "done"],
};