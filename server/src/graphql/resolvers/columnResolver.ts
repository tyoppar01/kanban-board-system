import { IBoard } from "../../models/interface/board";
import { ColumnService } from "../../services/columnService";
import { ClassName, MethodName, logProcess, logResponse } from "../../utils/loggerResponse";

export const columnResolver = { 

      Mutation: {

        addColumn: async (_: any, { name }: { name: string }) => {

            const board: IBoard = await ColumnService.getInstance().addColumn(name);
            logProcess(MethodName.ADD_COL, ClassName.RESOLVE, board);

            const taskList = Object.values(board.taskList || {})
                .filter(task => task != null) 
                .map(task => ({
                    id: String(task.id),
                    title: task.title,
                    description: task.description,
                    createdDate: task.createdDate?.toISOString() ?? null,
                    modifiedDate: task.modifiedDate?.toISOString() ?? null,
                }));

            const columns = Object.entries(board.columns)
                .filter(column => column != null)
                .map(([id, taskIds]) => ({ id, taskIds})
            );

            logResponse(MethodName.ADD_COL, { taskList, columns, order: board.order })
            return { taskList, columns, order: board.order };
        },

        removeColumn: async (_: any, { name }: { name: string }) => {

            logProcess(MethodName.REMOVE_COL, ClassName.RESOLVE, name);
            const board: IBoard = await ColumnService.getInstance().removeColumn(name);

            const taskList = Object.values(board.taskList || {})
                .filter(task => task != null) 
                .map(task => ({
                    id: String(task.id),
                    title: task.title,
                    description: task.description,
                    createdDate: task.createdDate?.toISOString() ?? null,
                    modifiedDate: task.modifiedDate?.toISOString() ?? null,
                }));

            const columns = Object.entries(board.columns)
                .filter(column => column != null)
                .map(([id, taskIds]) => ({ id, taskIds})
            );

            logResponse(MethodName.REMOVE_COL, { taskList, columns, order: board.order });
            return { taskList, columns, order: board.order };
        }
    }

}