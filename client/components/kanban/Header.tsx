import { useState } from 'react';
import { LastActions } from './LastActions';
import { Action } from '../../types/kanban.types';
import UserProfile from '../auth/UserProfile';

interface HeaderProps {
  actions: Action[];
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ actions, onReset }) => {
  const [showLastActions, setShowLastActions] = useState(false);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all data? This will clear all tasks and actions from localStorage.')) {
      onReset();
    }
  };

  return (
    <>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-5xl font-bold text-gray-900 mb-2">My Kanban</h1>
          <p className="text-gray-600">A simple board to keep track of tasks.</p>
        </div>
        <div className="flex gap-4 items-center">
          <UserProfile />
          <button 
            onClick={() => setShowLastActions(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            Last Actions
          </button>
          <button 
            onClick={handleReset}
            className="text-red-600 hover:text-red-900"
          >
            Reset
          </button>
        </div>
      </div>

      {showLastActions && (
        <LastActions 
          actions={actions}
          onClose={() => setShowLastActions(false)}
        />
      )}
    </>
  );
};
