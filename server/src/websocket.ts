import {Server as HTTPServer} from 'http';
import {Server as SocketIOServer} from 'socket.io';

let io: SocketIOServer | null = null;

export function initializeWebSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // join board room
    socket.on('join:board', (boardId: string) => {
      socket.join(`board:${boardId}`);
      console.log(`Client ${socket.id} joined board room: board:${boardId}`);
    });

    // leave board room
    socket.on('leave:board', (boardId: string) => {
      socket.leave(`board:${boardId}`);
      console.log(`Client ${socket.id} left board room: board:${boardId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('WebSocket server not initialized. Call initializeWebSocket first.');
  }
  return io;
}

// event emitters for resolvers
export function emitTaskCreated(boardId: string, task: any) {
  getIO().to(`board:${boardId}`).emit('task:created', { boardId, task });
}

export function emitTaskUpdated(boardId: string, task: any) {
  getIO().to(`board:${boardId}`).emit('task:updated', { boardId, task });
}

export function emitTaskDeleted(boardId: string, taskId: number) {
  getIO().to(`board:${boardId}`).emit('task:deleted', { boardId, taskId });
}

export function emitTaskMoved(boardId: string, taskId: number, fromColumn: string, toColumn: string) {
  getIO().to(`board:${boardId}`).emit('task:moved', { boardId, taskId, fromColumn, toColumn });
}

export function emitColumnCreated(boardId: string, column: any) {
    getIO().to(`board:${boardId}`).emit('column:created', { boardId, column });
}

export function emitColumnDeleted(boardId: string, columnId: string) {
    getIO().to(`board:${boardId}`).emit('column:deleted', { boardId, columnId });
}

export function emitColumnMoved(boardId: string, columnId: string, destIndex: number) {
    getIO().to(`board:${boardId}`).emit('column:moved', { boardId, columnId, destIndex });
}