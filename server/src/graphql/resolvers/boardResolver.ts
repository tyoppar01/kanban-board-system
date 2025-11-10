import { BoardService } from "../../services/boardService";

export const boardResolver = {

    Query: {

        // get full board
        board: async () => await BoardService.getInstance().getFullBoard()

        

    }

}