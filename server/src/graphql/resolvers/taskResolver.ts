import taskRouter from "../../routes/taskRoutes";
import boardRouter from "../../routes/taskRoutes";

export const taskResolver = {

    Query: {
        task: () => taskRouter
    }

}