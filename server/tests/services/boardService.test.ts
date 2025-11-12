import { BoardService } from "../../src/services/boardService";
import { Board } from "../../src/models/interface/board";
import { BoardRepo } from "../../src/repos/boardRepo";

jest.mock("../../src/repos/boardRepo", () => ({
  BoardRepo: {
    getInstance: jest.fn(),
  },
}));

describe("BoardService", () => {

  let mockBoardRepo: { get: jest.Mock };

  beforeEach(async () => {

    // Mock repo instance and its methods
    mockBoardRepo = { get: jest.fn() };

    // When BoardRepo.getInstance() is called, return mockBoardRepo
    (BoardRepo.getInstance as jest.Mock).mockReturnValue(mockBoardRepo);

    (BoardService as any).instance = null;
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return the same instance (singleton)", () => {
    const instance1 = BoardService.getInstance();
    const instance2 = BoardService.getInstance();
    expect(instance1).toBe(instance2);
  });
  
  it("should call boardRepo.get() and return its result", async () => {
    const mockBoard: Board = { taskList: {}, columns: {}, order: [] };
    mockBoardRepo.get.mockResolvedValue(mockBoard);

    const service = BoardService.getInstance();
    const result = await service.getFullBoard();

    expect(mockBoardRepo.get).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockBoard);
  });


});