"use client"

import { Plus } from 'lucide-react';
import { DragDropContext } from '@hello-pangea/dnd';
import { useKanban } from '../../hooks/useKanban';
import { Column } from './Column';

export default function KanbanBoard() {
  const { data, addTask, onDragEnd } = useKanban();
  
  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col">
      <div className="max-w-7xl mx-auto flex-1 w-full">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-2">My Kanban</h1>
            <p className="text-gray-600">A simple board to keep track of tasks.</p>
          </div>
          <button className="text-gray-600 hover:text-gray-900">
            Last Actions
          </button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.columnOrder.map(columnId => (
              <Column 
                key={columnId} 
                column={data.columns[columnId]} 
                tasks={data.columns[columnId].tasks.map(taskId => data.tasks[taskId])} 
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      <footer className="mt-auto pt-16 text-center text-gray-500 text-sm max-w-7xl mx-auto w-full">
        Built by Jasper and Najiha
      </footer>

      <button
        onClick={addTask} 
        className="fixed bottom-8 right-8 w-16 h-16 bg-gray-700 hover:bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center text-3xl transition-colors"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}