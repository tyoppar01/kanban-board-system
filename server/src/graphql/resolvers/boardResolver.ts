import { IBoard } from "../../models/interface/board";
import { BoardService } from "../../services/boardService";

export const boardResolver = {

    Query: {

        board: async () => {

            const board: IBoard = await BoardService.getInstance().getFullBoard();

            const taskList = Object.values(board.taskList || {})
                .filter(task => task != null) 
                .map(task => ({
                    id: String(task.id),
                    description: task.description,
                    createdDate: task.createdDate?.toISOString() ?? null,
                    modifiedDate: task.modifiedDate?.toISOString() ?? null,
                }));
            
            const columns = Object.entries(board.columns)
                .filter(column => column != null)
                .map(([id, taskIds]) => ({ id, taskIds})
            );

            return { taskList, columns, order: board.order };
        },

    },

    Mutation: {

        addColumn: async (_: any, { name }: { name: string }) => {

            const board: IBoard = await BoardService.getInstance().addColumn(name);

            return {
                id: board.id,
                taskList: Object.values(board.taskList),
                columns: Object.entries(board.columns).map(([id, taskIds]) => ({ id, taskIds })),
                order: board.order
            };

        }
    }


}