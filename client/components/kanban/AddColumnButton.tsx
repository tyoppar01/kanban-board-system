"use client"

import { Plus } from 'lucide-react';
import { useState } from 'react';

interface AddColumnButtonProps {
  onAddColumn: (columnName: string) => void;
  columnCount: number;
  maxColumns?: number;
}

export function AddColumnButton({ onAddColumn, columnCount, maxColumns = 6 }: AddColumnButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [columnName, setColumnName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMaxReached = columnCount >= maxColumns;

  const handleOpenModal = () => {
    if (!isMaxReached) {
      setIsModalOpen(true);
      setColumnName('');
      setError('');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setColumnName('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = columnName.trim();
    
    // Validation
    if (!trimmedName) {
      setError('Column name cannot be empty');
      return;
    }
    
    if (trimmedName.length > 30) {
      setError('Column name must be 30 characters or less');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onAddColumn(trimmedName);
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || 'Failed to add column');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Hover Zone - appears on right side */}
      <div className="group fixed right-0 top-0 h-full w-16 z-10 pointer-events-none">
        <div className="absolute right-0 top-1/4 -translate-y-1/2 pointer-events-auto">
          <button
            onClick={handleOpenModal}
            disabled={isMaxReached}
            className={`
              flex items-center gap-2 px-4 py-3
              bg-white border-2 border-r-0 
              rounded-l-lg shadow-lg
              transition-all duration-300
              transform translate-x-full group-hover:translate-x-0
              ${isMaxReached 
                ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                : 'border-blue-500 text-blue-600 hover:bg-blue-50 cursor-pointer'
              }
            `}
            title={isMaxReached ? `Maximum ${maxColumns} columns reached` : 'Add new column'}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium whitespace-nowrap">
              {isMaxReached ? `Max ${maxColumns}` : ''}
            </span>
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Column</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="columnName" className="block text-sm font-medium text-gray-700 mb-2">
                  Column Name
                </label>
                <input
                  id="columnName"
                  type="text"
                  value={columnName}
                  onChange={(e) => setColumnName(e.target.value)}
                  placeholder="e.g., In Review, Testing, Deployed"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  maxLength={30}
                  disabled={isSubmitting}
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Maximum 30 characters. Column {columnCount + 1} of {maxColumns}.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Adding...' : 'Add Column'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
