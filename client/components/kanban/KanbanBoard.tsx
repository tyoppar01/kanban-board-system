"use client"

import { Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useKanban, colorClasses } from '../../hooks/useKanban';

export default function KanbanBoard() {
  // Use the custom hook for all kanban logic
  const { data, addTask, onDragEnd } = useKanban();
  
  return (
    // main container
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col">

      <div className="max-w-7xl mx-auto flex-1 w-full">
        {/* header container */}
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
        {/* board container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* render columns */}
          {data.columnOrder.map(columnId => {
            const column = data.columns[columnId];
            const tasks = column.tasks.map(taskId => data.tasks[taskId]);

            return (
              // Individual column container
              <div key={column.id} className="flex flex-col">

                {/* column header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className={`${colorClasses[column.columnColor as keyof typeof colorClasses]?.bg || 'bg-gray-500'} text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm`}>
                    {tasks.length}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900">{column.name}</h2>
                </div>

                {/* Droppable area for tasks */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-200' : ''
                        }`}
                      >
                        {tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-move hover:shadow-md transition-all ${
                                  snapshot.isDragging ? 'rotate-3 shadow-lg' : ''
                                }`}
                              >
                          <div className={`text-xs ${colorClasses[column.columnColor as keyof typeof colorClasses]?.text || 'text-gray-500'} font-semibold mb-2`}>
                            {task.id}
                          </div>
                          <div className="text-gray-900 font-medium">
                            {task.content}
                          </div>
                        </div>
                       )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
              </div>
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