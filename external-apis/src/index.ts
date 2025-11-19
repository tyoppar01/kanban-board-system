// Main entry point for external-apis package

// Export database connection
export { prisma, disconnectDatabase } from './config/database';

// Export repositories
export { BoardRepository } from './repositories/boardRepository';
export { TaskRepository } from './repositories/taskRepository';
export { ColumnRepository } from './repositories/columnRepository';

// Re-export Prisma types for convenience
export type { Board, Column, Task } from '@prisma/client';
