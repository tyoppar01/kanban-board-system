import { IBoard } from "../../models/interface/board";
import { BoardService } from "../../services/boardService";
import { ClassName, MethodName, logProcess, logResponse } from "../../utils/loggerResponse";

export const boardResolver = {

    Query: {

        board: async () => {

            const board: IBoard = await BoardService.getInstance().getFullBoard();

            logProcess(MethodName.GET_BOARD, ClassName.RESOLVE, board);

            const taskList = Object.values(board.taskList || {})
                .filter(task => task != null) 
                .map(task => ({
                    id: String(task.id),
                    title: task.title,
                    description: task.description,
                    createdDate: task.createdDate?.toISOString() ?? null,
                    modifiedDate: task.modifiedDate?.toISOString() ?? null,
                }));

            logProcess(MethodName.GET_BOARD, ClassName.RESOLVE, taskList);
            
            const columns = Object.entries(board.columns)
                .filter(column => column != null)
                .map(([id, taskIds]) => ({ id, taskIds})
            );

            logProcess(MethodName.GET_BOARD, ClassName.RESOLVE, columns);
            logResponse(MethodName.GET_BOARD, { taskList, columns, order: board.order })
            
            return { taskList, columns, order: board.order };
        },

    },

}