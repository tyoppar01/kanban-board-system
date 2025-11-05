import { Action } from '../../types/kanban.types';
import { X } from 'lucide-react';

interface LastActionsProps {
  actions: Action[];
  onClose: () => void;
}

export const LastActions: React.FC<LastActionsProps> = ({ actions, onClose }) => {
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000); // seconds

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div 
      className="fixed inset-0 flex items-start justify-end p-8 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-96 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Last Actions</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
          {actions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No actions yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {actions.slice(0, 3).map((action) => (
                <div key={action.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      action.type === 'created' ? 'bg-blue-500' :
                      action.type === 'edited' ? 'bg-yellow-500': 
                      'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        {action.type === 'created' ? (
                          <>
                            Created <span className="font-semibold">"{action.taskContent}"</span> in {action.toColumn}
                          </>
                        ) : action.type === 'edited' ? (
                          <>
                            Edited <span className="font-semibold">"{action.oldContent}"</span> to <span className="font-semibold">"{action.taskContent}"</span>
                          </>
                        ) : action.type === 'moved' ? (
                          <>
                            Moved <span className="font-semibold">"{action.taskContent}"</span> from {action.fromColumn} to {action.toColumn}
                          </>
                        ) : (
                          <>
                            Deleted <span className="font-semibold">"{action.taskContent}"</span> from {action.fromColumn}
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(action.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
