import { useState } from 'react';
import { Board, Task, ColorClasses } from '../types/kanban.types';
import { DropResult } from '@hello-pangea/dnd';

export interface Action {
  id: string;
  type: 'created' | 'moved';
  taskId: string;
  taskContent: string;
  fromColumn?: string;
  toColumn: string;
  timestamp: number;
}

// Initial data
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
      tasks: ['task-2', 'task-3', 'task-4'],
      columnColor: 'blue'
    },
    'in-progress': {
      id: 'in-progress',
      name: 'In Progress',
      tasks: ['task-1'],
      columnColor: 'yellow'
    },
    'completed': {
      id: 'completed',
      name: 'Completed',
      tasks: [],
      columnColor: 'green'
    },
  },
  columnOrder: ['todo', 'in-progress', 'completed'],
};

// Color mapping
export const colorClasses: ColorClasses = {
  'blue': {
    bg: 'bg-blue-600',
    text: 'text-blue-600',
    border: 'border-blue-600'
  },
  'yellow': {
    bg: 'bg-yellow-500',
    text: 'text-yellow-500',
    border: 'border-yellow-500'
  },
  'green': {
    bg: 'bg-green-600',
    text: 'text-green-600',
    border: 'border-green-600'
  }
};

export const useKanban = () => {
  const [data, setData] = useState<Board>(initialData);
  const [taskCounter, setTaskCounter] = useState<number>(7);
  const [actions, setActions] = useState<Action[]>([]);

  // Function to add a new task
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
    };

    setData({
      ...data,
      tasks: updatedTasks,
      columns: updatedColumns
    });

    // Add action to history
    const newAction: Action = {
      id: `action-${Date.now()}`,
      type: 'created',
      taskId: newTaskId,
      taskContent: 'New task',
      toColumn: 'To Do',
      timestamp: Date.now()
    };
    setActions([newAction, ...actions].slice(0, 10)); // Keep last 10 actions

    setTaskCounter(taskCounter + 1);
  };

  // Handle drag and drop
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If no destination, do nothing
    if (!destination) return;

    // If dropped in the same position, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];

    // Moving within the same column
    if (startColumn === finishColumn) {
      const newTaskIds = Array.from(startColumn.tasks);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...startColumn,
        tasks: newTaskIds,
      };

      const newData = {
        ...data,
        columns: {
          ...data.columns,
          [newColumn.id]: newColumn,
        },
      };

      setData(newData);
      return;
    }

    // Moving from one column to another
    const startTaskIds = Array.from(startColumn.tasks);
    startTaskIds.splice(source.index, 1);
    const newStartColumn = {
      ...startColumn,
      tasks: startTaskIds,
    };

    const finishTaskIds = Array.from(finishColumn.tasks);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinishColumn = {
      ...finishColumn,
      tasks: finishTaskIds,
    };

    const newData = {
      ...data,
      columns: {
        ...data.columns,
        [newStartColumn.id]: newStartColumn,
        [newFinishColumn.id]: newFinishColumn,
      },
    };

    setData(newData);

    // Add action to history
    const task = data.tasks[draggableId];
    const newAction: Action = {
      id: `action-${Date.now()}`,
      type: 'moved',
      taskId: draggableId,
      taskContent: task.content,
      fromColumn: startColumn.name,
      toColumn: finishColumn.name,
      timestamp: Date.now()
    };
    setActions([newAction, ...actions].slice(0, 10)); // Keep last 10 actions
  };

  return {
    data,
    taskCounter,
    addTask,
    onDragEnd,
    actions,
  };
};