import { useState } from 'react';
import { LastActions } from './LastActions';
import { Action } from '../../hooks/useKanban';

interface HeaderProps {
  actions: Action[];
}

export const Header: React.FC<HeaderProps> = ({ actions }) => {
  const [showLastActions, setShowLastActions] = useState(false);

  return (
    <>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-5xl font-bold text-gray-900 mb-2">My Kanban</h1>
          <p className="text-gray-600">A simple board to keep track of tasks.</p>
        </div>
        <button 
          onClick={() => setShowLastActions(true)}
          className="text-gray-600 hover:text-gray-900"
        >
          Last Actions
        </button>
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
