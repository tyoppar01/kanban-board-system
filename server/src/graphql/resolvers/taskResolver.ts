import { Task } from "../../models/task";
import { TaskService } from "../../services/taskService";

const service: TaskService = TaskService.getInstance();

export const taskResolver = {

  Mutation: {

    addTask: async (_: any, { task }: { task: Task }) => {
      return await service.addTask(task);
    },

    removeTask: async (_: any, { id, column }: { id: number; column: string }) => {
      return await service.removeTask(id, column);
    },

    relocateTask: async (_: any, { taskId, index, currCol, destCol }: any) => {
      return await service.relocateTask(taskId, index, currCol, destCol);
    },

    editTask: async (_: any, { task }: { task: Task }) => {
      return await service.editTask(task);
    },

  },
};
