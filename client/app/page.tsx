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
      tasks: ['task-2', 'task-3', 'task-4'],
    },
    'in-progress': {
      id: 'in-progress',
      name: 'In Progress',
      tasks: ['task-1'],
    },
    'completed': {
      id: 'completed',
      name: 'Completed',
      tasks: [],
    },
  },
  columnOrder: ['todo', 'in-progress', 'completed'],
};

export default function KanbanBoard() {
  return (
    <div>
      <h1>Kanban Board</h1>
      {initialData.columnOrder.map(columnId => {
        const column = initialData.columns[columnId];
        return (
          <div key={column.id}>
            <h2>{column.name}</h2>
            <ul>
              {column.tasks.map(taskId => {
                const task = initialData.tasks[taskId];
                return <li key={task.id}>{task.content}</li>;
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
