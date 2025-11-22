import { useState } from 'react';
import { History, RotateCcw, MoreHorizontal, MoreVertical } from 'lucide-react';
import { LastActions } from './LastActions';
import { Action } from '../../types/kanban.types';
import UserProfile from '../auth/UserProfile';

interface HeaderProps {
  actions: Action[];
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ actions, onReset }) => {
  const [showLastActions, setShowLastActions] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const handleReset = () => {
    if (window.confirm('Reset data is going to clear localStorage. It won\'t delete any data from the server. Are you sure you want to proceed?')) {
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
        <div className="flex gap-3 items-center">
          <UserProfile />
          
          {/* dropdown menu for actions */}
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100"
              title="Actions"
            >
              <MoreHorizontal className="w-5 h-5 hidden sm:block" />
              <MoreVertical className="w-5 h-5 sm:hidden" />
            </button>

            {showActionsMenu && (
              <>
                {/* Backdrop to close menu */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowActionsMenu(false)}
                />
                
                {/* dropdown menu */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <button
                    onClick={() => {
                      setShowLastActions(true);
                      setShowActionsMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                  >
                    <History className="w-5 h-5" />
                    <span>Last Actions</span>
                  </button>
                  <button
                    onClick={() => {
                      handleReset();
                      setShowActionsMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-3"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Reset</span>
                  </button>
                </div>
              </>
            )}
          </div>
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
