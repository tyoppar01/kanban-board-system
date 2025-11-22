import { initializeFaro, Faro } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

let faro: Faro | null = null;

export function initFaro(): Faro | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (faro) {
    return faro;
  }

  // Only initialize if collector URL is provided
  const collectorUrl = process.env.NEXT_PUBLIC_FARO_URL;
  
  // Skip initialization in development if no URL is set
  if (!collectorUrl) {
    console.log('Faro: No collector URL configured, skipping initialization');
    return null;
  }
  
  // Initialize with Grafana Cloud collector
  faro = initializeFaro({
    url: collectorUrl,
    app: {
      name: 'kanban-board-client',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
    instrumentations: [
      new TracingInstrumentation(),
    ],
  });

  return faro;
}

export function getFaro(): Faro | null {
  return faro;
}

// Helper functions for tracking custom events
export function trackTaskCreated(taskId: string) {
  if (faro) {
    faro.api.pushEvent('task_created', { task_id: taskId });
  }
}

export function trackTaskDeleted(taskId: string) {
  if (faro) {
    faro.api.pushEvent('task_deleted', { task_id: taskId });
  }
}

export function trackTaskMoved(taskId: string, fromColumn: string, toColumn: string) {
  if (faro) {
    faro.api.pushEvent('task_moved', { 
      task_id: taskId,
      from_column: fromColumn,
      to_column: toColumn 
    });
  }
}

export function trackTaskUpdated(taskId: string) {
  if (faro) {
    faro.api.pushEvent('task_updated', { task_id: taskId });
  }
}

export function trackColumnCreated(columnId: string) {
  if (faro) {
    faro.api.pushEvent('column_created', { column_id: columnId });
  }
}

export function trackColumnDeleted(columnId: string) {
  if (faro) {
    faro.api.pushEvent('column_deleted', { column_id: columnId });
  }
}

export function trackBoardView() {
  if (faro) {
    faro.api.pushEvent('board_viewed');
  }
}

export function trackError(error: Error, context?: Record<string, any>) {
  if (faro) {
    faro.api.pushError(error, { context });
  }
}
