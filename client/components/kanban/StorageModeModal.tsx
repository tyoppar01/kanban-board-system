"use client"

import { StorageMode } from '@/types/kanban.types';

interface StorageModeModalProps {
  onSelect: (mode: StorageMode) => void;
}

export function StorageModeModal({ onSelect }: StorageModeModalProps) {
  return (
    <div className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">
          Welcome to My Kanban
        </h2>
        <p className="text-gray-600 mb-8 text-center">
          Choose how you want to store your data:
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Browser Only Option */}
          <button
            onClick={() => onSelect('browser')}
            className="group relative bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-300 hover:border-blue-500 rounded-xl p-6 text-left transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-2xl">
                💾
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700">
                  Browser Only
                </h3>
              </div>
            </div>
          </button>

          {/* Backend Option */}
          <button
            onClick={() => onSelect('backend')}
            className="group relative bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-green-300 hover:border-green-500 rounded-xl p-6 text-left transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white text-2xl">
                🌐
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700">
                  Backend
                </h3>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
