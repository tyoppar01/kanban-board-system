import { Board } from "../models/board";
import { Task } from "../models/task";

// ================== Dummy Data =================== //
const board: Board = {
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

// ================== Board Repo =================== //

export const boardRepo = {

  get: async (): Promise<Board> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(board), 100); 
    });
  },

};
