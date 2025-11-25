// Main entry point for external-apis package

// Export database connection
export { prisma, connectDatabase, disconnectDatabase } from './config/database';

// Export repositories
export { BoardRepository } from './repositories/boardRepository';
export { TaskRepository } from './repositories/taskRepository';
export { ColumnRepository } from './repositories/columnRepository';
export { AuthRepository } from './repositories/authRepository';
export { TokenRepository } from './repositories/tokenRepository';

// Re-export Prisma types for convenience
export type { Board, Column, Task, UserProfile, Token } from '@prisma/client';