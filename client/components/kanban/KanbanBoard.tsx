"use client"

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { useKanban } from '../../hooks/useKanban';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { useSocket } from '@/contexts/SocketContext';
import { Column } from './Column';
import { Header } from './Header';
import { AddTaskButton } from './AddTaskButton';
import { AddColumnButton } from './AddColumnButton';
import { StorageModeModal } from './StorageModeModal';
import { StorageMode } from '@/types/kanban.types';
import { getStorageData, setStorageData, STORAGE_KEYS } from '@/utils/storage';

export default function KanbanBoard() {
  const [storageMode, setStorageMode] = useState<StorageMode | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isCheckingMode, setIsCheckingMode] = useState(true);

  // Check for saved storage mode preference on mount
  useEffect(() => {
    const savedMode = getStorageData<StorageMode | null>(STORAGE_KEYS.STORAGE_MODE, null);
    if (savedMode) {
      setStorageMode(savedMode);
    } else {
      setShowModal(true);
    }
    setIsCheckingMode(false);
  }, []);

  // Handle storage mode selection from modal
  const handleModeSelect = (mode: StorageMode) => {
    setStorageMode(mode);
    setStorageData(STORAGE_KEYS.STORAGE_MODE, mode);
    setShowModal(false);
  };

  // Use the custom hook for all kanban logic (always call hooks at top level)
  const { 
    data, 
    addTask,
    addColumn,
    onDragEnd, 
    actions,
    editingState,
    startEditingTask,
    stopEditingTask,
    updateTask,
    deleteTask,
    deleteColumn,
    storageState,
    isHydrated,
    clearStorage,
    refetchBoard
  } = useKanban(storageMode || 'backend');

  // WebSocket connection status
  const { isConnected } = useSocket();

  // real-time updates integration
  useRealtimeUpdates({
    boardId: 'default', // Using default board ID for now
    onTaskCreated: (task) => {
      console.log('[WebSocket] Task created by another user:', task);
      // temporarily disabled for debugging
      // refetchBoard(); // Refetch board to show new task
    },
    onTaskUpdated: (taskId, updates) => {
      console.log('[WebSocket] Task updated by another user:', taskId, updates);
      refetchBoard(); // refetch board to show updates
    },
    onTaskMoved: (taskId, fromColumn, toColumn, position) => {
      console.log('[WebSocket] Task moved by another user:', taskId, fromColumn, toColumn);
      refetchBoard(); // refetch board to show movement
    },
    onTaskDeleted: (taskId) => {
      console.log('[WebSocket] Task deleted by another user:', taskId);
      refetchBoard(); // refetch board to remove task
    },
    onColumnCreated: (column) => {
      console.log('[WebSocket] Column created by another user:', column);
      refetchBoard(); // refetch board to show new column
    },
    onColumnDeleted: (columnId) => {
      console.log('[WebSocket] Column deleted by another user:', columnId);
      refetchBoard(); // refetch board to remove column
    },
    onColumnMoved: (columnId, destIndex) => {
      console.log('[WebSocket] Column moved by another user:', columnId, destIndex);
      refetchBoard(); // refetch board to show column reorder
    }
  });
  
  // Show loading while checking for saved mode
  if (isCheckingMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Show modal if storage mode hasn't been selected
  if (showModal) {
    return <StorageModeModal onSelect={handleModeSelect} />;
  }

  // Show loading state until storage is loaded
  if (!isHydrated || storageState.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }
  
  return (
    // main container
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col">
      {/* WebSocket Connection Status Banner */}
      {!isConnected && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-400 text-yellow-800 px-4 py-2 text-sm text-center z-50">
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Reconnecting to real-time updates...
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto flex-1 w-full">
        <Header actions={actions} onReset={clearStorage} />

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="all-columns" direction="horizontal" type="column">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`grid gap-6 ${
                  data?.columnOrder?.length === 1 ? 'grid-cols-1' :
                  data?.columnOrder?.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                  data?.columnOrder?.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                  data?.columnOrder?.length === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
                  data?.columnOrder?.length === 5 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' :
                  'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
                }`}
              >
                {/* render columns */}
                {data && data.columnOrder && data.columnOrder.map((columnId, index) => {
                  const column = data.columns[columnId];
                  if (!column || !column.tasks) return null;
                  
                  const tasks = column.tasks.map(taskId => data.tasks[taskId]).filter(Boolean);

                  return (
                    <Column 
                      key={column.id} 
                      column={column} 
                      tasks={tasks}
                      index={index}
                      editingTaskId={editingState.taskId}
                      onStartEdit={startEditingTask}
                      onStopEdit={stopEditingTask}
                      onUpdateTask={updateTask}
                      onDeleteTask={deleteTask}
                      handleDelete={deleteColumn}
                    />
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Floating Add Column Button - appears on right side hover */}
      {data && (
        <AddColumnButton 
          onAddColumn={addColumn}
          columnCount={data.columnOrder?.length || 0}
          maxColumns={6}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto pt-16 text-center text-gray-500 text-sm max-w-7xl mx-auto w-full">
        &copy; 2025 Built by Jasper and Najiha. All rights reserved.
      </footer>

      <AddTaskButton onAddTask={addTask} />
    </div>
  );
}