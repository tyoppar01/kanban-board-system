"use client"

import { Plus } from 'lucide-react';
import { DragDropContext } from '@hello-pangea/dnd';
import { useKanban } from '../../hooks/useKanban';
import { Column } from './Column';
import { Header } from './Header';

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
    updateTask
  } = useKanban();
  
  return (
    // main container
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col">

      <div className="max-w-7xl mx-auto flex-1 w-full">
        <Header actions={actions} />

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

      <button
        onClick={addTask} 
        className="fixed bottom-8 right-8 w-16 h-16 bg-gray-700 hover:bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center text-3xl transition-colors"
      >
        <Plus className="w-6 h-6 text-white-700" />
      </button>
    </div>
  );
}