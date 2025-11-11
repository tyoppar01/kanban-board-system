"use client"

import { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { useKanban } from '../../hooks/useKanban';
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
    storageState,
    isHydrated,
    clearStorage
  } = useKanban(storageMode || 'backend');
  
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

      <div className="max-w-7xl mx-auto flex-1 w-full">
        <Header actions={actions} onReset={clearStorage} />

        <DragDropContext onDragEnd={onDragEnd}>
        {/* board container - dynamic grid based on column count */}
        <div 
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
          {data && data.columnOrder && data.columnOrder.map(columnId => {
            const column = data.columns[columnId];
            if (!column || !column.tasks) return null;
            
            const tasks = column.tasks.map(taskId => data.tasks[taskId]).filter(Boolean);

            return (
              <Column 
                key={column.id} 
                column={column} 
                tasks={tasks}
                editingTaskId={editingState.taskId}
                onStartEdit={startEditingTask}
                onStopEdit={stopEditingTask}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
              />
            );
          })}
        </div>
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