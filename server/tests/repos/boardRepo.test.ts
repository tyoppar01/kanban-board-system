import { BoardRepo } from '../../src/repos/boardRepo';


describe('BoardRepo', () => {
  let repo: BoardRepo;

  beforeEach(() => {
    repo = BoardRepo.getInstance();
  });

  it('should achieve singleton instance of boardRepo', () => {
    const a = BoardRepo.getInstance();
    const b = BoardRepo.getInstance();
    expect(a).toBe(b);
  });

  it('should return a board with expected structure', async () => {
    const board = await repo.get();

    // Basic structure checks
    expect(board).toHaveProperty('taskList');
    expect(board).toHaveProperty('columns');
    expect(board).toHaveProperty('order');

    // Task content check
    expect(board.taskList).toBeDefined();
    expect(board.taskList[1]!.title).toBe('Setup project structure');
    expect(board.columns.todo).toContain(1);
    expect(board.order).toEqual(['todo', 'ongoing', 'done']);
  });

  it('should resolve asynchronously (after ~100ms)', async () => {
    const start = Date.now();
    await repo.get();
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(90);
  });
});