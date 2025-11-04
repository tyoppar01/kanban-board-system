import { Board } from "../models/board";

// for testing purpose
const board: Board = {
  taskList: {
    1: { id: 1, content: "Setup project structure" },
    2: { id: 2, content: "Implement Express routes" },
    3: { id: 3, content: "Add service layer" },
    4: { id: 4, content: "Test API endpoints" },
  },
  columns: {
    todo: [1, 2],
    ongoing: [3],
    done: [4],
  },
  order: ["todo", "ongoing", "done"],
};

export const boardRepo = {

  get: async (): Promise<Board> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(board), 100); 
    });
  },

  

};
