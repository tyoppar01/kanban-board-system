export const taskRepo = {

  addTask: async (): Promise<Board> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(board), 100); 
    });
  },

};