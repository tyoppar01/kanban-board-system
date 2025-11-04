import React, { useState, useEffect, useRef } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task } from '../../types/kanban.types';
import { Pencil, Check, X } from 'lucide-react';
import { colorClasses } from '../../hooks/useKanban';

interface TaskCardProps {
  task: Task;
  index: number;
  columnColor: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onUpdate: (content: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  columnColor,
  isEditing,
  onStartEdit,
  onStopEdit,
  onUpdate
}) => {
  const [editContent, setEditContent] = useState(task.content);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus and select text when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Update local state when task content changes
  useEffect(() => {
    setEditContent(task.content);
  }, [task.content]);

  const handleSave = () => {
    if (editContent.trim()) {
      onUpdate(editContent.trim());
    } else {
      setEditContent(task.content); // Revert if empty
    }
    onStopEdit();
  };

  const handleCancel = () => {
    setEditContent(task.content); // Revert changes
    onStopEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-move hover:shadow-md transition-all ${
            snapshot.isDragging ? 'rotate-3 shadow-lg' : ''
          }`}
        >
          {isEditing ? (
            // EDITING MODE
            <div className="space-y-2">
              <div className={`text-xs ${colorClasses[columnColor as keyof typeof colorClasses]?.text || 'text-gray-500'} font-semibold mb-2`}>
                {task.id}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-2 py-1 text-gray-900 font-medium border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            // VIEW MODE - Original Design
            <>
              <div className="flex items-start justify-between mb-2">
                <div className={`text-xs ${colorClasses[columnColor as keyof typeof colorClasses]?.text || 'text-gray-500'} font-semibold`}>
                  {task.id}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEdit();
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                  title="Edit task"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
              
              <div className="text-gray-900 font-medium">
                {task.content}
              </div>
            </>
          )}
        </div>
      )}
    </Draggable>
  );
};