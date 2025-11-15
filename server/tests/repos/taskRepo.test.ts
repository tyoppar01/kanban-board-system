import { IBoard } from '../../src/models/interface/board';
import { ITask } from '../../src/models/interface/task';
import { TaskRepo } from '../../src/repos/taskRepo';
import { Board } from '../../src/models/schemaModel';

// Mock the Board model for MongoDB operations
jest.mock('../../src/models/schemaModel', () => {
  const MockBoard: any = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({})
  }));
  
  MockBoard.findOneAndUpdate = jest.fn(() => ({
    lean: jest.fn()
  }));
  
  return { Board: MockBoard };
});

// Get reference to the mocked Board
const MockedBoard = Board as any;

describe(`TaskRepo`, () => {

    let repo: TaskRepo;
    let board: IBoard;

    const mockBoard = {
        taskList: { 
            1: { id: 1, title: "Setup project" },
            2: { id: 2, title: "Build API" }
        },
        columns: { todo: [1, 2], ongoing: [], done: [] },
        order: ["todo", "ongoing", "done"],
    } as any; // Type assertion to avoid Document interface conflicts

    beforeEach(() => {
        // Reset singleton instance
        (TaskRepo as any).instance = null;
        repo = TaskRepo.getInstance();
        board = JSON.parse(JSON.stringify(mockBoard));
        
        // Clear all mocks
        jest.clearAllMocks();
    });

    it('should achieve singleton instance of taskRepo', () => {
        const a = TaskRepo.getInstance();
        const b = TaskRepo.getInstance();
        expect(a).toBe(b);
    });

    // Add Task
    it('should add a new task into the todo column', async () => {
        const newTask: ITask = { id: 3, title: "Write tests" };
        
        // Mock the MongoDB update operation
        MockedBoard.findOneAndUpdate.mockReturnValue({
            lean: jest.fn().mockResolvedValue(board)
        });

        const result = await repo.add(newTask);

        expect(result).toEqual(newTask);
        expect(MockedBoard.findOneAndUpdate).toHaveBeenCalledWith(
            {},
            {
                $push: { "columns.todo": 3 },
                $set: { "taskList.3": newTask }
            },
            { new: true }
        );
    });

    // Remove Task
    it('should remove a task from a specific column', async () => {
        const expected_res = true;
        
        // Mock the MongoDB update operation
        MockedBoard.findOneAndUpdate.mockReturnValue({
            lean: jest.fn().mockResolvedValue(board)
        });

        const removedTask = await repo.remove(1, 'todo', board);

        expect(removedTask).toEqual(expected_res);
        expect(MockedBoard.findOneAndUpdate).toHaveBeenCalledWith(
            {},
            {
                $pull: { "columns.todo": 1 },
                $unset: { "taskList.1": "" }
            },
            { new: true }
        );
    });

    // Update Column
    it('should update column lists correctly', async () => {
        const currList = [2]; // task 1 removed
        const destList = [1]; // task 1 moved to "ongoing"

        // Mock the MongoDB update operation
        MockedBoard.findOneAndUpdate.mockReturnValue({
            lean: jest.fn().mockResolvedValue(board)
        });

        const success = await repo.updateColumn(1, 'todo', currList, 'ongoing', destList);

        expect(success).toBe(true);
        expect(MockedBoard.findOneAndUpdate).toHaveBeenCalledWith(
            {},
            {
                $set: {
                    "columns.todo": currList,
                    "columns.ongoing": destList
                }
            },
            { new: true }
        );
    });

    // Update Column within same column
    it('should update column lists correctly with same column', async () => {
        const currList = [2, 1]; // reordered tasks
        const destList = [2, 1]; // same order after move

        // Mock the MongoDB update operation
        MockedBoard.findOneAndUpdate.mockReturnValue({
            lean: jest.fn().mockResolvedValue(board)
        });

        const success = await repo.updateColumn(1, 'todo', currList, 'todo', destList);

        expect(success).toBe(true);
        expect(MockedBoard.findOneAndUpdate).toHaveBeenCalledWith(
            {},
            {
                $set: {
                    "columns.todo": destList
                }
            },
            { new: true }
        );
    });

    // Edit Task Details
    it('should update task details in board', async () => {
        const updatedTask: ITask = { id: 2, title: "Build API + tests", description: "EDITABLE?" };

        // Mock the MongoDB update operation to resolve successfully
        MockedBoard.findOneAndUpdate.mockResolvedValue(board);

        const success = await repo.update(updatedTask);

        expect(success).toBe(true);
        expect(MockedBoard.findOneAndUpdate).toHaveBeenCalledWith(
            {},
            {
                $set: {
                    [`taskList.${updatedTask.id}`]: updatedTask
                }
            },
            { new: true }
        );
    });


});