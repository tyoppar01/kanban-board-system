/**
 * Test Helper for Mock Services
 * Provides reusable mock service instances and context setup for tests
 */

export interface MockContext {
  services: {
    authService?: any;
    boardService?: any;
    columnService?: any;
    taskService?: any;
  };
}

/**
 * Create a mock context with services for testing resolvers
 */
export function createMockContext(services: Partial<MockContext['services']> = {}): MockContext {
  return {
    services: {
      ...services,
    },
  };
}

/**
 * Helper to create mock repository methods
 */
export function createMockRepo(methods: Record<string, jest.Mock>) {
  return {
    getInstance: jest.fn(),
    ...methods,
  };
}
