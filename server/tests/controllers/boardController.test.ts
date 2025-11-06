import { Request, Response } from "express";

jest.mock("../../src/utils/apiResponse", () => ({
  sendSuccessResponse: jest.fn(),
  sendFailedResponse: jest.fn()
}));

import { getBoard } from "../../src/controllers/boardController";
import { sendFailedResponse, sendSuccessResponse } from "../../src/utils/apiResponse";
import { BoardService } from "../../src/services/boardService";

jest.mock("../../src/services/boardService");

describe("getBoard", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockSend: jest.Mock;

  beforeEach(() => {
    mockSend = jest.fn();
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: mockSend
    };

    jest.clearAllMocks();
  });

  it("should call sendSuccessResponse on success", async () => {
    const mockBoard = { name: "Test Board" };
    (BoardService.getInstance as jest.Mock).mockReturnValue({
      getFullBoard: jest.fn().mockResolvedValue(mockBoard)
    });

    await getBoard(mockReq as Request, mockRes as Response);

    expect(sendSuccessResponse).toHaveBeenCalledWith(mockRes, {
      success: true,
      message: "board details has been received successfully",
      data: mockBoard
    });
  });

  it("should call sendFailedResponse on error", async () => {
    (BoardService.getInstance as jest.Mock).mockReturnValue({
      getFullBoard: jest.fn().mockRejectedValue(new Error("DB error"))
    });

    await getBoard(mockReq as Request, mockRes as Response);

    expect(sendFailedResponse).toHaveBeenCalled();
  });
});
