import { ITask } from "../../models/interface/task";
import { TaskService } from "../../services/taskService";
import { ClassName, logProcess, logResponse, MethodName } from "../../utils/loggerResponse";

const service: TaskService = TaskService.getInstance();

export const taskResolver = {

  Mutation: {

    addTask: async (_: any, { task }: { task: ITask }): Promise<ITask> => {
      logProcess(MethodName.ADD_TASK, ClassName.RESOLVE, task);
      const res = await service.addTask(task);
      logResponse(MethodName.ADD_TASK, res);
      return res;
    },

    removeTask: async (_: any, { id, column }: { id: number; column: string }): Promise<boolean> => {
      logProcess(MethodName.REMOVE_TASK, ClassName.RESOLVE, {id, column});
      const res = await service.removeTask(id, column);
      logResponse(MethodName.REMOVE_TASK, res);
      return res;
    },

    relocateTask: async (_: any, { taskId, index, currCol, destCol }: any): Promise<boolean> => {
      logProcess(MethodName.MOVE_TASK, ClassName.RESOLVE, { taskId, index, currCol, destCol });
      const res = await service.relocateTask(taskId, index, currCol, destCol);
      logResponse(MethodName.MOVE_TASK, res);
      return res;
    },

    editTask: async (_: any, { task }: { task: ITask }): Promise<boolean> => {
      logProcess(MethodName.EDIT_TASK, ClassName.RESOLVE, task);
      const res = await service.editTask(task);
      logResponse(MethodName.EDIT_TASK, res);
      return res;
    },

  },
};
