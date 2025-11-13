import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Column as ColumnType, Task } from '../../types/kanban.types';
import { TaskCard } from './TaskCard';
import { colorClasses } from '../../hooks/useKanban';
import { X } from 'lucide-react';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  editingTaskId: string | null;
  onStartEdit: (taskId: string) => void;
  onStopEdit: () => void;
  onUpdateTask: (taskId: string, content: string) => void;
  onDeleteTask: (taskId: string, columnId: string) => void;
  handleDelete: (columnId: string) => void;
  index: number; // Add index for draggable
}

export const Column: React.FC<ColumnProps> = ({ 
  column, 
  tasks,
  editingTaskId,
  onStartEdit,
  onStopEdit,
  onUpdateTask,
  onDeleteTask,
  handleDelete,
  index
}) => {
  return (
    <Draggable draggableId={`column-${column.id}`} index={index}>
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex flex-col ${snapshot.isDragging ? 'opacity-50' : ''}`}
        >
          {/* Column header - this is the drag handle */}
          <div 
            {...provided.dragHandleProps}
            className="group flex items-center justify-between w-full mb-4 cursor-move"
          >
            <div className="flex items-center gap-3">
              <span className={`${colorClasses[column.columnColor as keyof typeof colorClasses]?.bg || 'bg-gray-500'} text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm`}>
                {tasks.length}
              </span>
              <h2 className="text-2xl font-bold text-gray-900">{column.name}</h2>
            </div>
            <button 
              onClick={() => handleDelete(column.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 mr-2"
            >
              <X className="w-5 h-5" />
            </button>
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
                columnId={column.id}
                columnColor={column.columnColor || 'gray'}
                isEditing={editingTaskId === task.id}
                onStartEdit={() => onStartEdit(task.id)}
                onStopEdit={onStopEdit}
                onUpdate={(content) => onUpdateTask(task.id, content)}
                onDelete={() => onDeleteTask(task.id, column.id)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
        </div>
      )}
    </Draggable>
  );
};