"use client"

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// Task
interface Task {  
  id: string;
  content: string;
}

// Column
interface Column {  
  id: string;
  name: string;
  tasks: string[];
  columnColor?: string;
}

// Board
interface Board {  
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  columnOrder: string[];
}

// to be fetch from server
const initialData: Board = {  
  tasks: {
    'task-1': { id: 'task-1', content: 'Take out the garbage' },
    'task-2': { id: 'task-2', content: 'Watch my favorite show' },
    'task-3': { id: 'task-3', content: 'Charge my phone' },
    'task-4': { id: 'task-4', content: 'Cook dinner' },
  },
  columns: {
    'todo': {
      id: 'todo',
      name: 'To Do',
      tasks: ['task-2', 'task-3', 'task-4'],     columnColor: 'blue-600'
    },
    'in-progress': {
      id: 'in-progress',
      name: 'In Progress',
      tasks: ['task-1'],
      columnColor: 'yellow-600'
    },
    'completed': {
      id: 'completed',
      name: 'Completed',
      tasks: [],
      columnColor: 'green-600'
    },
  },
  columnOrder: ['todo', 'in-progress', 'completed'],
};

export default function KanbanBoard() {

  const [data, setData] = useState<Board>(initialData);
  const [taskCounter, setTaskCounter] = useState<number>(7);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');

  // color mapping to ensure tailwind classes are included in build
  const colorClasses = {
    'blue-600': {
      bg: 'bg-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-600'
    },
    'yellow-500': {
      bg: 'bg-yellow-500',
      text: 'text-yellow-600',
      border: 'border-yellow-500'
    },
    'green-600': {
      bg: 'bg-green-600',
      text: 'text-green-600',
      border: 'border-green-600'
    }
  };

  // function to add a new task
  const addTask = () => {

    const newTaskId = `task-${taskCounter}`;
    const newTask: Task = { id: newTaskId, content: 'New task' };

    const todoColumn = data.columns['todo'];
    const newTaskIds = [...todoColumn.tasks, newTaskId];

    const updatedTasks = {
      ...data.tasks,
      [newTaskId]: newTask,
    };

    const updatedColumns = {
        ...data.columns,
        todo: {
          ...todoColumn,
          tasks: newTaskIds
        }
      }

    setData({
      ...data,
      tasks: updatedTasks,
      columns: updatedColumns
    });

    // Put the new task in editing mode
    setEditingTaskId(newTaskId);
    setEditingContent(newTask.content);

    setTaskCounter(taskCounter + 1);
  }
  
  return (
    // main container
    <div className="min-h-screen bg-gray-50 p-8">

      <div className="max-w-7xl mx-auto">
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

                {/* Task list for each column */}
                <div className="flex-1 space-y-3 min-h-[200px] p-2 rounded-lg">
                    {tasks.map(task => {
                      return (
                        <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow">
                          <div className={`text-xs ${colorClasses[column.columnColor as keyof typeof colorClasses]?.text || 'text-gray-500'} font-semibold mb-2`}>
                            {task.id}
                          </div>
                          <div className="text-gray-900 font-medium">
                            {task.content}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={addTask} 
          className="fixed bottom-8 right-8 w-16 h-16 bg-gray-700 hover:bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center text-3xl transition-colors"
        >
          <Plus className="w-6 h-6 text-white-700" />
        </button>
      </div>
    </div>
  );
}
