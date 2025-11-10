import boardRouter from "../../routes/boardRoutes";

export const boardResolver = {

    Query: {
        boards: () => boardRouter
    }

}