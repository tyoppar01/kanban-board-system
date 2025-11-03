import { Draggable } from '@hello-pangea/dnd';
import { Task } from '../../types/kanban.types';
import { colorClasses } from '../../hooks/useKanban';

interface TaskCardProps {
  task: Task;
  index: number;
  columnColor: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index, columnColor }) => {
  return (
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
          <div className={`text-xs ${colorClasses[columnColor as keyof typeof colorClasses]?.text || 'text-gray-500'} font-semibold mb-2`}>
            {task.id}
          </div>
          <div className="text-gray-900 font-medium">
            {task.content}
          </div>
        </div>
      )}
    </Draggable>
  );
};