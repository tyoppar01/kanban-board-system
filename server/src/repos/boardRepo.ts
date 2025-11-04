import { Board } from "../models/board";
import { dummyData } from "../utils/dummyData";

// for testing purpose
const board = dummyData;

export const boardRepo = {
  get: async (): Promise<Board> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(board), 100); 
    });
  },
};
