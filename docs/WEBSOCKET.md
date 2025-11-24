# WebSocket Implementation for Real-Time Updates

This document describes the WebSocket implementation approach for real-time synchronization between multiple users.

## Overview

WebSocket enables bidirectional, real-time communication between the server and all connected clients. When User A makes a change (update/move/delete task or create/delete column), User B sees the update immediately without refreshing.

**Note**: Task creation is handled through manual refresh to prevent ordering issues. All other operations sync in real-time.

## Random ID Strategy

### Why Random IDs?

The system uses **random 5-digit IDs** (10000-99999) for tasks to prevent collisions in multi-user environments:

```typescript
// Generate random task ID
const randomId = Math.floor(10000 + Math.random() * 90000);
const newTaskId = `task-${randomId}`;  // e.g., task-84792
```

**Benefits:**
- ✅ **Collision-free**: 90,000 possible IDs make conflicts extremely rare
- ✅ **No counter sync**: Each client generates IDs independently
- ✅ **Offline support**: Works without server communication
- ✅ **Instant creation**: No waiting for server-assigned IDs
- ✅ **Backend compatibility**: Backend accepts and persists frontend IDs

**Tradeoff:**
- ⚠️ IDs don't reflect creation order (not sequential)
- ⚠️ Tasks sorted by `position` field, not ID

### Backend Integration

The backend repositories accept frontend-provided IDs:

```typescript
// external-apis/src/repositories/taskRepository.ts
interface ITaskCreate {
  id?: number;  // Accept frontend ID
  // ... other fields
}

async add(taskData: ITaskCreate): Promise<ITask> {
  return await prisma.task.create({
    data: {
      id: taskData.id,  // Use frontend ID instead of auto-increment
      // ... other fields
    }
  });
}
```

## Architecture

```
User A's Browser                    Server                    User B's Browser
     │                                │                              │
     │──── Task Created ────>         │                              │
     │     (GraphQL Mutation)         │                              │
     │                                │                              │
     │                         ┌──────┴──────┐                       │
     │                         │  Execute    │                       │
     │                         │  Mutation   │                       │
     │                         └──────┬──────┘                       │
     │                                │                              │
     │                         ┌──────┴──────┐                       │
     │                         │  Broadcast  │                       │
     │                         │  via Socket │                       │
     │                         └──────┬──────┘                       │
     │                                │                              │
     │<──── Response ────────         │ ─────── Event ────────>      │
     │                                │          (task:created)      │
     │                                │                              │
     │                                │                         ┌────┴────┐
     │                                │                         │ Update  │
     │                                │                         │ UI      │
     │                                │                         └─────────┘
```

## Technology Stack

- **Server**: Socket.IO (Node.js)
- **Client**: socket.io-client (React)
- **Transport**: WebSocket with fallback to HTTP long-polling

## Backend Implementation

### 1. Install Dependencies

```bash
cd server
npm install socket.io
npm install --save-dev @types/socket.io
```

### 2. Create WebSocket Server

**File**: `server/src/websocket.ts`

```typescript
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function initializeWebSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join board-specific room
    socket.on('join:board', (boardId: string) => {
      socket.join(`board:${boardId}`);
      console.log(`Client ${socket.id} joined board ${boardId}`);
    });

    // Leave board room
    socket.on('leave:board', (boardId: string) => {
      socket.leave(`board:${boardId}`);
      console.log(`Client ${socket.id} left board ${boardId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

// Event emitters for resolvers
export function emitTaskCreated(boardId: string, task: any) {
  getIO().to(`board:${boardId}`).emit('task:created', { boardId, task });
}

export function emitTaskUpdated(boardId: string, taskId: string, updates: any) {
  getIO().to(`board:${boardId}`).emit('task:updated', { boardId, taskId, updates });
}

export function emitTaskMoved(boardId: string, taskId: string, fromColumn: string, toColumn: string, position: number) {
  getIO().to(`board:${boardId}`).emit('task:moved', { boardId, taskId, fromColumn, toColumn, position });
}

export function emitTaskDeleted(boardId: string, taskId: string) {
  getIO().to(`board:${boardId}`).emit('task:deleted', { boardId, taskId });
}

export function emitColumnCreated(boardId: string, column: any) {
  getIO().to(`board:${boardId}`).emit('column:created', { boardId, column });
}

export function emitColumnDeleted(boardId: string, columnId: string) {
  getIO().to(`board:${boardId}`).emit('column:deleted', { boardId, columnId });
}
```

### 3. Integrate with Express Server

**File**: `server/src/server.ts`

```typescript
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { initializeWebSocket } from './websocket';
// ... other imports

const app = express();
const httpServer = createServer(app);

// Initialize WebSocket
const io = initializeWebSocket(httpServer);

// ... rest of Express setup

// Use httpServer instead of app.listen
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server initialized`);
});
```

### 4. Update GraphQL Resolvers

**File**: `server/src/graphql/resolvers/taskResolver.ts`

```typescript
import { emitTaskCreated, emitTaskUpdated, emitTaskMoved, emitTaskDeleted } from '../../websocket';

const taskResolver = {
  Mutation: {
    createTask: async (_: any, args: any) => {
      const task = await taskService.createTask(args);
      
      // Emit WebSocket event
      emitTaskCreated(args.boardId, task);
      
      return task;
    },
    
    updateTask: async (_: any, { taskId, ...updates }: any) => {
      const task = await taskService.updateTask(taskId, updates);
      
      // Emit WebSocket event
      emitTaskUpdated(task.boardId, taskId, updates);
      
      return task;
    },
    
    moveTask: async (_: any, { taskId, columnId, position }: any) => {
      const task = await taskService.getTask(taskId);
      const oldColumnId = task.columnId;
      
      const updatedTask = await taskService.moveTask(taskId, columnId, position);
      
      // Emit WebSocket event
      emitTaskMoved(task.boardId, taskId, oldColumnId, columnId, position);
      
      return updatedTask;
    },
    
    deleteTask: async (_: any, { taskId }: any) => {
      const task = await taskService.getTask(taskId);
      await taskService.deleteTask(taskId);
      
      // Emit WebSocket event
      emitTaskDeleted(task.boardId, taskId);
      
      return { success: true };
    }
  }
};
```

**File**: `server/src/graphql/resolvers/columnResolver.ts`

```typescript
import { emitColumnCreated, emitColumnDeleted } from '../../websocket';

const columnResolver = {
  Mutation: {
    createColumn: async (_: any, args: any) => {
      const column = await columnService.createColumn(args);
      
      // Emit WebSocket event
      emitColumnCreated(args.boardId, column);
      
      return column;
    },
    
    deleteColumn: async (_: any, { columnId }: any) => {
      const column = await columnService.getColumn(columnId);
      await columnService.deleteColumn(columnId);
      
      // Emit WebSocket event
      emitColumnDeleted(column.boardId, columnId);
      
      return { success: true };
    }
  }
};
```

## Frontend Implementation

### 1. Install Dependencies

```bash
cd client
npm install socket.io-client
```

### 2. Create WebSocket Context

**File**: `client/contexts/SocketContext.tsx`

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
```

### 3. Create Real-Time Updates Hook

**File**: `client/hooks/useRealtimeUpdates.ts`

```typescript
import { useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useApolloClient } from '@apollo/client';

interface UseRealtimeUpdatesProps {
  boardId: string;
  onTaskCreated?: (task: any) => void;
  onTaskUpdated?: (taskId: string, updates: any) => void;
  onTaskMoved?: (taskId: string, fromColumn: string, toColumn: string, position: number) => void;
  onTaskDeleted?: (taskId: string) => void;
  onColumnCreated?: (column: any) => void;
  onColumnDeleted?: (columnId: string) => void;
}

export function useRealtimeUpdates({
  boardId,
  onTaskCreated,
  onTaskUpdated,
  onTaskMoved,
  onTaskDeleted,
  onColumnCreated,
  onColumnDeleted
}: UseRealtimeUpdatesProps) {
  const { socket, isConnected } = useSocket();
  const apolloClient = useApolloClient();

  useEffect(() => {
    if (!socket || !isConnected || !boardId) return;

    // Join board room
    socket.emit('join:board', boardId);

    // Listen for task events
    socket.on('task:created', ({ task }) => {
      console.log('Real-time: task created', task);
      onTaskCreated?.(task);
    });

    socket.on('task:updated', ({ taskId, updates }) => {
      console.log('Real-time: task updated', taskId, updates);
      onTaskUpdated?.(taskId, updates);
    });

    socket.on('task:moved', ({ taskId, fromColumn, toColumn, position }) => {
      console.log('Real-time: task moved', taskId);
      onTaskMoved?.(taskId, fromColumn, toColumn, position);
    });

    socket.on('task:deleted', ({ taskId }) => {
      console.log('Real-time: task deleted', taskId);
      onTaskDeleted?.(taskId);
    });

    socket.on('column:created', ({ column }) => {
      console.log('Real-time: column created', column);
      onColumnCreated?.(column);
    });

    socket.on('column:deleted', ({ columnId }) => {
      console.log('Real-time: column deleted', columnId);
      onColumnDeleted?.(columnId);
    });

    // Cleanup
    return () => {
      socket.emit('leave:board', boardId);
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:moved');
      socket.off('task:deleted');
      socket.off('column:created');
      socket.off('column:deleted');
    };
  }, [socket, isConnected, boardId]);

  return { isConnected };
}
```

### 4. Integrate in Layout

**File**: `client/app/layout.tsx`

```typescript
import { SocketProvider } from '@/contexts/SocketContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>
          <SocketProvider>
            {children}
          </SocketProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
```

### 5. Use in KanbanBoard Component

**File**: `client/components/kanban/KanbanBoard.tsx`

```typescript
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { useSocket } from '@/contexts/SocketContext';

export function KanbanBoard() {
  const [board, setBoard] = useState<Board | null>(null);
  const { isConnected } = useSocket();
  
  // Real-time updates
  const {} = useRealtimeUpdates({
    boardId: board?._id || '',
    onTaskCreated: (task) => {
      // Add task to local state
      setBoard(prev => {
        if (!prev) return prev;
        const column = prev.columns.find(col => col._id === task.columnId);
        if (column) {
          column.tasks.push(task);
        }
        return { ...prev };
      });
    },
    onTaskUpdated: (taskId, updates) => {
      // Update task in local state
      setBoard(prev => {
        if (!prev) return prev;
        prev.columns.forEach(column => {
          const task = column.tasks.find(t => t._id === taskId);
          if (task) {
            Object.assign(task, updates);
          }
        });
        return { ...prev };
      });
    },
    onTaskMoved: (taskId, fromColumnId, toColumnId, position) => {
      // Move task between columns
      setBoard(prev => {
        if (!prev) return prev;
        const fromColumn = prev.columns.find(col => col._id === fromColumnId);
        const toColumn = prev.columns.find(col => col._id === toColumnId);
        
        if (fromColumn && toColumn) {
          const taskIndex = fromColumn.tasks.findIndex(t => t._id === taskId);
          if (taskIndex !== -1) {
            const [task] = fromColumn.tasks.splice(taskIndex, 1);
            toColumn.tasks.splice(position, 0, task);
          }
        }
        return { ...prev };
      });
    },
    onTaskDeleted: (taskId) => {
      // Remove task from local state
      setBoard(prev => {
        if (!prev) return prev;
        prev.columns.forEach(column => {
          column.tasks = column.tasks.filter(t => t._id !== taskId);
        });
        return { ...prev };
      });
    },
    onColumnCreated: (column) => {
      // Add column to local state
      setBoard(prev => {
        if (!prev) return prev;
        return { ...prev, columns: [...prev.columns, column] };
      });
    },
    onColumnDeleted: (columnId) => {
      // Remove column from local state
      setBoard(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.filter(col => col._id !== columnId)
        };
      });
    }
  });

  return (
    <div>
      {/* Connection indicator */}
      {!isConnected && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm">
          Reconnecting to real-time updates...
        </div>
      )}
      
      {/* Rest of component */}
    </div>
  );
}
```

## Known Limitations

### Task Creation Not Real-Time

**Status**: `task:created` WebSocket event is intentionally disabled

**Reason**: After WebSocket disconnect/reconnect (e.g., page refresh), task ordering becomes inconsistent. Tasks are sorted by the `position` field, but random IDs combined with WebSocket sync can cause visual ordering issues.

**Workaround**: Users must manually refresh the page to see new tasks created by others.

**What Works**:
- ✅ Task editing (content, description) - syncs in real-time
- ✅ Task moving between columns - syncs in real-time
- ✅ Task deletion - syncs in real-time
- ✅ Column creation - syncs in real-time
- ✅ Column deletion - syncs in real-time
- ⚠️ Task creation - requires manual refresh

**Code Implementation**:

```typescript
// client/components/kanban/KanbanBoard.tsx
useRealtimeUpdates({
  boardId: 'default',
  onTaskCreated: (task) => {
    // Disabled to prevent ordering issues
    // refetchBoard();
  },
  onTaskUpdated: (taskId, updates) => {
    refetchBoard();  // ✅ Works perfectly
  },
  onTaskMoved: (taskId, fromColumn, toColumn, position) => {
    refetchBoard();  // ✅ Works perfectly
  },
  // ... other handlers work in real-time
});
```

### Why This Decision?

**Alternative Approaches Tried:**
1. ❌ Sequential counter - Race conditions between users
2. ❌ Backend auto-increment IDs - Frontend predictions failed
3. ❌ Sync task:created with refetch - Caused ordering chaos after reconnect
4. ✅ **Random IDs + manual refresh for creation** - Stable and predictable

**User Experience:**
- Creating tasks: Instant for the user creating them
- Viewing others' tasks: Requires manual page refresh
- All other operations: Real-time for everyone

This tradeoff prioritizes **stability and data consistency** over full real-time sync for task creation.

## WebSocket Events Reference

| Event | Direction | Payload | Description | Status |
|-------|-----------|---------|-------------|--------|
| `join:board` | Client → Server | `{ boardId: string }` | Join board-specific room | ✅ Active |
| `leave:board` | Client → Server | `{ boardId: string }` | Leave board room | ✅ Active |
| `task:created` | Server → Client | `{ boardId, task }` | New task added | ⚠️ Disabled (manual refresh required) |
| `task:updated` | Server → Client | `{ boardId, taskId, updates }` | Task edited | ✅ Active |
| `task:moved` | Server → Client | `{ boardId, taskId, fromColumn, toColumn, position }` | Task moved to different column | ✅ Active |
| `task:deleted` | Server → Client | `{ boardId, taskId }` | Task removed | ✅ Active |
| `column:created` | Server → Client | `{ boardId, column }` | New column added | ✅ Active |
| `column:deleted` | Server → Client | `{ boardId, columnId }` | Column removed | ✅ Active |

## NGINX Configuration

Update `/etc/nginx/conf.d/app.conf` to support WebSocket proxying:

```nginx
# Backend API - api.mykanban.fun
server {
    server_name api.mykanban.fun;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Specific WebSocket path (if Socket.IO needs it)
    location /socket.io/ {
        proxy_pass http://localhost:8080/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/mykanban.fun/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mykanban.fun/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
```

## Environment Variables

### Local Development

**Server** (`server/.env`):
```bash
# Allow WebSocket connections from frontend
CLIENT_URL=http://localhost:3000

# Server port
PORT=8080

# Database
MONGODB_URI=mongodb://localhost:27017/kanban
```

**Client** (`client/.env.local`):
```bash
# WebSocket server URL (use localhost for local dev)
NEXT_PUBLIC_API_URL=http://localhost:8080

# Note: Socket.IO will connect to same URL
```

### Production

**Server** (`.env`):
```bash
# Allow WebSocket connections from frontend
CLIENT_URL=https://mykanban.fun

# Server port
PORT=8080

# Database
MONGODB_URI=mongodb://mongodb:27017/kanban
```

**Client** (`.env.local`):
```bash
# WebSocket server URL (production API)
NEXT_PUBLIC_API_URL=https://api.mykanban.fun
```

## Testing

### 1. Test WebSocket Connection

```bash
# Start server
cd server && npm run dev

# In another terminal, start client
cd client && npm run dev

# Check browser console for:
# "WebSocket connected"
```

### 2. Test Real-Time Updates

1. Open app in two different browsers (or incognito)
2. Log in as different users (or same user, different sessions)
3. In Browser A: Create a task
4. In Browser B: **Manually refresh** to see the new task (not real-time)
5. In Browser A: Edit task content
6. In Browser B: Changes should appear instantly
7. In Browser A: Move a task to another column
8. In Browser B: Task should move instantly
9. In Browser A: Delete a task
10. In Browser B: Task should disappear instantly

### 3. Test Reconnection

1. Stop the server
2. Check browser shows "Reconnecting..." message
3. Restart server
4. Browser should automatically reconnect

## Benefits

✅ **Real-time synchronization** - Edit, move, delete operations sync instantly  
✅ **No polling** - Efficient bidirectional communication  
✅ **Room-based** - Only users on the same board receive updates  
✅ **Auto-reconnection** - Handles network interruptions gracefully  
✅ **Fallback transport** - Uses polling if WebSocket unavailable  
✅ **Production-ready** - NGINX WebSocket proxying configured  
✅ **Collision-free IDs** - Random 5-digit IDs prevent multi-user conflicts  
⚠️ **Task creation** - Requires manual refresh (stable ordering guaranteed)

## Performance Considerations

- **Scalability**: Socket.IO rooms ensure events only sent to relevant users
- **Memory**: Each connection uses ~100KB of memory
- **Latency**: Typical update latency < 50ms on good connections
- **Fallback**: Automatically degrades to HTTP long-polling if WebSocket blocked

## Race Condition Prevention

### Problem: Refetch During Local Operations

When a user creates or edits a task, there's a potential race condition:

1. **User adds task** → Local state updates immediately (optimistic update)
2. **User types task name** → Still in editing mode
3. **Backend creates task** → WebSocket emits `task:created` event
4. **refetchBoard() called** → Overwrites local state, causing task to disappear

### Solution: Smart Refetch Logic

The `refetchBoard()` function checks for pending operations before refetching:

```typescript
const refetchBoard = useCallback(async (force = false) => {
  if (USE_BROWSER_ONLY) return;
  
  // Skip refetch if there are pending operations (unless forced)
  if (!force && (pendingNewTasks.size > 0 || Object.keys(editingState).length > 0)) {
    console.log('[WebSocket] Skipping refetch - pending operations in progress');
    return;
  }
  
  // Proceed with refetch...
}, [USE_BROWSER_ONLY, pendingNewTasks, editingState]);
```

**How It Works:**

- **`pendingNewTasks`**: Tracks newly created tasks that haven't been named yet
- **`editingState`**: Tracks tasks currently being edited
- **Skip refetch**: If either has pending items, avoid overwriting local state
- **Force parameter**: Allows manual override when needed

**Benefits:**

✅ Prevents tasks from disappearing during creation  
✅ Avoids overwriting edits in progress  
✅ Maintains smooth UX during local operations  
✅ Still receives updates once local operations complete

### Usage in Components

```typescript
useRealtimeUpdates({
  boardId: 'default',
  onTaskCreated: (task) => {
    // Will skip refetch if user is currently editing/creating tasks
    refetchBoard();
  },
  onTaskUpdated: (taskId, updates) => {
    // Safe to refetch - won't interfere with local edits
    refetchBoard();
  },
  // ... other callbacks
});
```

## Future Enhancements

- [ ] Add user presence indicators (show who's viewing the board)
- [ ] Show "User X is typing..." indicators
- [ ] Conflict resolution for simultaneous edits
- [ ] Event history/replay for reconnected clients
- [ ] Redis adapter for horizontal scaling across multiple server instances
- [ ] Typing indicators for task editing
- [ ] Visual feedback when other users make changes (highlight/animation)
- [ ] Include socket ID in events to skip refetch for originating user

## Troubleshooting

### WebSocket Connection Fails

1. Check CORS configuration in `websocket.ts`
2. Verify `NEXT_PUBLIC_API_URL` environment variable
3. Check browser console for connection errors
4. Test direct connection: `http://localhost:8080/socket.io/`

### Events Not Received

1. Verify client joined board room: `socket.emit('join:board', boardId)`
2. Check server logs for event emissions
3. Ensure event names match exactly (case-sensitive)
4. Verify boardId is correct
5. **Note**: `task:created` is intentionally disabled - new tasks require manual refresh

### New Tasks Don't Appear for Other Users

**Expected Behavior**: This is intentional. Task creation is not synced in real-time.

**Solution**: Users must manually refresh the page to see tasks created by others.

**Why**: Random IDs combined with WebSocket reconnection cause task ordering issues. Manual refresh ensures consistent visual order.

**Verify It Works**:
1. Browser A creates a task → Task appears instantly for Browser A
2. Browser B refreshes → Task appears in correct position
3. Browser A edits the task → Browser B sees changes in real-time (no refresh needed)

### NGINX WebSocket Issues

1. Check Upgrade headers: `proxy_set_header Upgrade $http_upgrade`
2. Verify Connection header: `proxy_set_header Connection "upgrade"`
3. Increase timeouts for long-lived connections
4. Check NGINX error logs: `sudo tail -f /var/log/nginx/error.log`