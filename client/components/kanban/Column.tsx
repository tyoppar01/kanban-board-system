import { Droppable } from '@hello-pangea/dnd';
import { Column as ColumnType, Task } from '../../types/kanban.types';
import { TaskCard } from './TaskCard';
import { colorClasses } from '../../hooks/useKanban';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  editingTaskId: string | null;
  editingContent: string;
  setEditingTaskId: (id: string | null) => void;
  setEditingContent: (content: string) => void;
  onUpdateTask: (taskId: string, content: string) => void;
}

export const Column: React.FC<ColumnProps> = ({ 
  column, 
  tasks,
  editingTaskId,
  editingContent,
  setEditingTaskId,
  setEditingContent,
  onUpdateTask
}) => {
  return (
    <div key={column.id} className="flex flex-col">
      {/* Column header */}
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
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                columnColor={column.columnColor || 'gray'}
                editingTaskId={editingTaskId}
                editingContent={editingContent}
                setEditingTaskId={setEditingTaskId}
                setEditingContent={setEditingContent}
                onUpdateTask={onUpdateTask}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};