import { Plus } from 'lucide-react';
import { useState } from 'react';

interface AddTaskButtonProps {
  onAddTask: () => void;
}

export const AddTaskButton: React.FC<AddTaskButtonProps> = ({ onAddTask }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded whitespace-nowrap pointer-events-none">
          Add new task
        </div>
      )}
      
      {/* Button */}
      <button
        onClick={onAddTask}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="w-16 h-16 bg-gray-700 hover:bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center text-3xl transition-colors"
        aria-label="Add new task"
      >
        <Plus className="w-6 h-6 text-white-700" />
      </button>
    </div>
  );
};