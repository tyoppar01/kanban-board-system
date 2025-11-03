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
    // main container
    <div className="min-h-screen bg-gray-50 p-8">

      <div className="max-w-7xl mx-auto">
        {/* header container */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900">Kanban Board</h1>
          <p className="text-gray-600">A simple board to keep track of tasks.</p>
        </div>
      
        {/* board container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* render columns */}
          {initialData.columnOrder.map(columnId => {
            const column = initialData.columns[columnId];
            const tasks = column.tasks.map(taskId => initialData.tasks[taskId]);

            return (
              // Individual column container
              <div key={column.id} className="flex flex-col">

                {/* column header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className={`bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm`}>
                    {tasks.length}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900">{column.name}</h2>
                </div>

                {/* Task list for this column */}
                <div className="flex-1 space-y-3 min-h-[200px] p-2 rounded-lg">
                    {tasks.map(task => {
                      
                      return (
                        <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow">
                          <div className="text-xs text-blue-600 font-semibold mb-2">
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

      </div>
    </div>
  );
}
