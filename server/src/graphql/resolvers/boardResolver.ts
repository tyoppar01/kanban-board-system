import { Board } from "../../models/board";
import { BoardService } from "../../services/boardService";

export const boardResolver = {

    Query: {

        // get full board
        board: async () => {

            const board: Board = await BoardService.getInstance().getFullBoard()

            return {
                id: board.id,
                taskList: Object.values(board.taskList),
                columns: Object.entries(board.columns).map(([id, taskIds]) => ({ id, taskIds })),
                order: board.order
            };
        },
         
    },

    Mutation: {

        addColumn: async (_: any, { name }: { name: string }) => {

            const board: Board = await BoardService.getInstance().addColumn(name);

            return {
                id: board.id,
                taskList: Object.values(board.taskList),
                columns: Object.entries(board.columns).map(([id, taskIds]) => ({ id, taskIds })),
                order: board.order
            };

        }
    }


}