import { useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useApolloClient } from "@apollo/client/react";

interface UseRealtimeUpdatesProps {
  boardId: string;
  onTaskCreated?: (task: any) => void;
  onTaskUpdated?: (taskId: string, updates: any) => void;
  onTaskMoved?: (taskId: string, fromColumn: string, toColumn: string, position: number) => void;
  onTaskDeleted?: (taskId: string) => void;
  onColumnCreated?: (column: any) => void;
  onColumnDeleted?: (columnId: string) => void;
  onColumnMoved?: (columnId: string, destIndex: number) => void;
}

export function useRealtimeUpdates({
  boardId,
  onTaskCreated,
  onTaskUpdated,
  onTaskMoved,
  onTaskDeleted,
  onColumnCreated,
  onColumnDeleted,
  onColumnMoved
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

    socket.on('column:moved', ({ columnId, destIndex }) => {
      console.log('Real-time: column moved', columnId, destIndex);
      onColumnMoved?.(columnId, destIndex);
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
      socket.off('column:moved');
    };
  }, [socket, isConnected, boardId]);

  return { isConnected };
}