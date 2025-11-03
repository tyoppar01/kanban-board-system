import { Plus } from 'lucide-react';

interface AddTaskButtonProps {
  onAddTask: () => void;
}

export const AddTaskButton: React.FC<AddTaskButtonProps> = ({ onAddTask }) => {
  return (
    <button
      onClick={onAddTask}
      className="fixed bottom-8 right-8 w-16 h-16 bg-gray-700 hover:bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center text-3xl transition-colors"
    >
      <Plus className="w-6 h-6 text-white-700" />
    </button>
  );
};