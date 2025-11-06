"use client"

import { DragDropContext } from '@hello-pangea/dnd';
import { useKanban } from '../../hooks/useKanban';
import { Column } from './Column';
import { Header } from './Header';
import { AddTaskButton } from './AddTaskButton';

export default function KanbanBoard() {
  // Use the custom hook for all kanban logic
  const { 
    data, 
    addTask, 
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
  } = useKanban();
  
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
        {/* board container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Footer */}
      <footer className="mt-auto pt-16 text-center text-gray-500 text-sm max-w-7xl mx-auto w-full">
        Built by Jasper and Najiha
      </footer>

      <AddTaskButton onAddTask={addTask} />
    </div>
  );
}