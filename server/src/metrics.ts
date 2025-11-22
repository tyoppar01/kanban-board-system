import { Counter, Histogram, Gauge, register } from 'prom-client';

// Task metrics
export const taskCreated = new Counter({
  name: 'kanban_tasks_created_total',
  help: 'Total number of tasks created',
  labelNames: ['board_id'],
});

export const taskDeleted = new Counter({
  name: 'kanban_tasks_deleted_total',
  help: 'Total number of tasks deleted',
  labelNames: ['board_id'],
});

export const taskMoved = new Counter({
  name: 'kanban_tasks_moved_total',
  help: 'Total number of tasks moved between columns',
  labelNames: ['board_id', 'from_column', 'to_column'],
});

export const taskUpdated = new Counter({
  name: 'kanban_tasks_updated_total',
  help: 'Total number of tasks updated',
  labelNames: ['board_id'],
});

// Column metrics
export const columnCreated = new Counter({
  name: 'kanban_columns_created_total',
  help: 'Total number of columns created',
  labelNames: ['board_id'],
});

export const columnDeleted = new Counter({
  name: 'kanban_columns_deleted_total',
  help: 'Total number of columns deleted',
  labelNames: ['board_id'],
});

// User metrics
export const userLogins = new Counter({
  name: 'kanban_user_logins_total',
  help: 'Total number of user logins',
});

export const userRegistrations = new Counter({
  name: 'kanban_user_registrations_total',
  help: 'Total number of user registrations',
});

export const activeUsers = new Gauge({
  name: 'kanban_active_users',
  help: 'Number of currently active users',
});

// API performance metrics
export const apiDuration = new Histogram({
  name: 'kanban_api_duration_seconds',
  help: 'Duration of API requests in seconds',
  labelNames: ['operation', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const apiErrors = new Counter({
  name: 'kanban_api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['operation', 'error_type'],
});

// Board metrics
export const boardViews = new Counter({
  name: 'kanban_board_views_total',
  help: 'Total number of board views',
  labelNames: ['board_id'],
});

// Export the registry for /metrics endpoint
export { register };
