import { Board } from '../../src/models/interface/board';
import { Task } from '../../src/models/interface/task';
import { TaskRepo } from '../../src/repos/taskRepo';

describe(`TaskRepo`, () => {

    let repo: TaskRepo;
    let board: Board;

    const mockBoard: Board = {
        taskList: { 1: { id: 1, title: "Setup project" },2: { id: 2, title: "Build API" },},
        columns: { todo: [1, 2], ongoing: [], done: [], },
        order: ["todo", "ongoing", "done"],
    };

    beforeEach(() => {
        repo = TaskRepo.getInstance();
        board = JSON.parse(JSON.stringify(mockBoard));
    });

    it('should achieve singleton instance of taskRepo', () => {
        const a = TaskRepo.getInstance();
        const b = TaskRepo.getInstance();
        expect(a).toBe(b);
    });

    // Add Task
    it('should add a new task into the todo column', () => {

        const newTask: Task = { id: 3, title: "Write tests" };
        const result = repo.add(newTask, board);

        expect(board.columns.todo).toContain(3);
        expect(result[3]).toEqual(newTask);
    });

    // Remove Task
    it('should remove a task from a specific column', () => {
        const removedTask = repo.remove(1, 'todo', board);

        expect(removedTask.id).toBe(1);
        expect(board.columns.todo).not.toContain(1);
    });

    // Update Column
    it('should update column lists correctly', () => {
        const currList = [2]; // task 1 removed
        const destList = [1]; // task 1 moved to "ongoing"

        const success = repo.updateColumn(1, 'todo', currList, 'ongoing', destList, board);

        expect(success).toBe(true);
        expect(board.columns.todo).toEqual([2]);
        expect(board.columns.ongoing).toEqual([1]);
    });

    // Update Column within same column
    it('should update column lists correctly with same column', () => {
        const currList = [2, 1]; // task 1 removed
        const destList = [2, 1]; // task 1 moved to "ongoing"

        const success = repo.updateColumn(1, 'todo', currList, 'todo', destList, board);

        expect(success).toBe(true);
        expect(board.columns.todo).toEqual(currList);
        expect(board.columns.todo).toEqual(destList);
    });

    // Edit Task Details
    it('should update task details in board', () => {
        const updatedTask: Task = { id: 2, title: "Build API + tests", description: "EDITABLE?" };

        const success = repo.update(updatedTask, board);

        expect(success).toBe(true);
        expect(board.taskList[2]!.title).toBe("Build API + tests");
        expect(board.taskList[2]!.description).toBe("EDITABLE?");
    });


});