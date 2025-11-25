import { IBoard } from '../../src/models/board';
import { ITask } from '../../src/models/task';
import { TaskRepo } from '../../src/repos/taskRepo';

// Create mock instances
const mockTaskRepoInstance = {
  add: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
  getByColumn: jest.fn(),
  updateColumn: jest.fn(),
  updateTaskPositions: jest.fn(),
};

const mockColumnRepoInstance = {
  getByName: jest.fn(),
  getById: jest.fn(),
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

const mockBoardRepoInstance = {
  getBoardId: jest.fn().mockResolvedValue(1),
};

// Mock the external-apis repositories
jest.mock('external-apis', () => ({
  TaskRepository: {
    getInstance: jest.fn(() => mockTaskRepoInstance),
  },
  ColumnRepository: {
    getInstance: jest.fn(() => mockColumnRepoInstance),
  },
  BoardRepository: {
    getInstance: jest.fn(() => mockBoardRepoInstance),
  },
}));

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
        const todoColumn = { id: 1, name: 'todo', position: 0, boardId: 1 };
        
        // Mock the column lookup and task creation
        mockColumnRepoInstance.getByName.mockResolvedValue(todoColumn as any);
        mockTaskRepoInstance.getByColumn.mockResolvedValue([]);
        mockTaskRepoInstance.add.mockResolvedValue(newTask as any);

        const result = await repo.add(newTask);

        expect(result).toEqual(newTask);
        expect(mockColumnRepoInstance.getByName).toHaveBeenCalledWith('todo', 1);
        expect(mockTaskRepoInstance.add).toHaveBeenCalled();
    });

    // Remove Task
    it('should remove a task from a specific column', async () => {
        const expected_res = true;
        
        // Mock the Prisma delete operation
        mockTaskRepoInstance.remove.mockResolvedValue(true);

        const removedTask = await repo.remove(1, 'todo', board);

        expect(removedTask).toEqual(expected_res);
        expect(mockTaskRepoInstance.remove).toHaveBeenCalledWith(1);
    });

    // Update Column
    it('should update column lists correctly', async () => {
        const taskId = 1;
        const sourceCol = 'todo';
        const destCol = 'ongoing';
        const sourceColumn = { id: 1, name: 'todo', position: 0, boardId: 1 };
        const destColumn = { id: 2, name: 'ongoing', position: 1, boardId: 1 };

        // Mock the column lookups and task update
        mockColumnRepoInstance.getByName.mockImplementation((name: string) => {
            if (name === 'todo') return Promise.resolve(sourceColumn as any);
            if (name === 'ongoing') return Promise.resolve(destColumn as any);
            return Promise.resolve(null);
        });
        mockTaskRepoInstance.updateColumn.mockResolvedValue(true);
        mockTaskRepoInstance.updateTaskPositions.mockResolvedValue(true);

        const success = await repo.updateColumn(taskId, sourceCol, [2], destCol, [1]);

        expect(success).toBe(true);
        expect(mockTaskRepoInstance.updateColumn).toHaveBeenCalled();
    });

    // Update Column within same column
    it('should update column lists correctly with same column', async () => {
        const taskId = 1;
        const column = 'todo';
        const todoColumn = { id: 1, name: 'todo', position: 0, boardId: 1 };

        // Mock the column lookup and task update
        mockColumnRepoInstance.getByName.mockResolvedValue(todoColumn as any);
        mockTaskRepoInstance.updateColumn.mockResolvedValue(true);
        mockTaskRepoInstance.updateTaskPositions.mockResolvedValue(true);

        const success = await repo.updateColumn(taskId, column, [2, 1], column, [2, 1]);

        expect(success).toBe(true);
        expect(mockTaskRepoInstance.updateColumn).toHaveBeenCalled();
    });

    // Edit Task Details
    it('should update task details in board', async () => {
        const updatedTask: ITask = { id: 2, title: "Build API + tests", description: "EDITABLE?" };

        // Mock the Prisma update operation to resolve successfully
        mockTaskRepoInstance.update.mockResolvedValue(true);

        const success = await repo.update(updatedTask);

        expect(success).toBe(true);
        expect(mockTaskRepoInstance.update).toHaveBeenCalledWith({
            id: updatedTask.id,
            title: updatedTask.title,
            description: updatedTask.description
        });
    });


});