import { Board } from "../models/board";
import { boardRepo } from "../repos/boardRepo";

export const getFullBoard = async (): Promise<Board> => { 
      return await boardRepo.get();
};





