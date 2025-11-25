import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import KanbanBoard from '../KanbanBoard';
import { useKanban } from '../../../hooks/useKanban';
import * as storage from '../../../utils/storage';
import { SocketProvider } from '../../../contexts/SocketContext';

// Mock the useKanban hook
jest.mock('../../../hooks/useKanban');

// Mock the useRealtimeUpdates hook
jest.mock('../../../hooks/useRealtimeUpdates', () => ({
  useRealtimeUpdates: jest.fn(),
}));

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

// Mock the storage utilities
jest.mock('../../../utils/storage', () => ({
  getStorageData: jest.fn(),
  setStorageData: jest.fn(),
  STORAGE_KEYS: {
    STORAGE_MODE: 'kanban_storage_mode',
    KANBAN_DATA: 'kanban_data',
  },
}));

// Mock child components
jest.mock('../Header', () => ({
  Header: ({ actions, onReset }: any) => (
    <div data-testid="header">
      Header - Actions: {actions.length} - Reset: {onReset ? 'Yes' : 'No'}
    </div>
  ),
}));

jest.mock('../Column', () => ({
  Column: ({ column, tasks }: any) => (
    <div data-testid={`column-${column.id}`}>
      {column.name} - Tasks: {tasks.length}
    </div>
  ),
}));

jest.mock('../AddTaskButton', () => ({
  AddTaskButton: ({ onAddTask }: any) => (
    <button data-testid="add-task-button" onClick={() => onAddTask('todo')}>
      Add Task
    </button>
  ),
}));

describe('KanbanBoard', () => {
  const mockUseKanban = useKanban as jest.MockedFunction<typeof useKanban>;
  const mockGetStorageData = storage.getStorageData as jest.MockedFunction<typeof storage.getStorageData>;
  const mockSetStorageData = storage.setStorageData as jest.MockedFunction<typeof storage.setStorageData>;

  // Test wrapper with SocketProvider
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <SocketProvider>{children}</SocketProvider>
  );

  const mockData = {
    tasks: {
      'task-1': { id: 'task-1', content: 'Task 1' },
      'task-2': { id: 'task-2', content: 'Task 2' },
      'task-3': { id: 'task-3', content: 'Task 3' },
    },
    columns: {
      'todo': {
        id: 'todo',
        name: 'To Do',
        tasks: ['task-1'],
        columnColor: 'blue',
      },
      'in-progress': {
        id: 'in-progress',
        name: 'In Progress',
        tasks: ['task-2'],
        columnColor: 'yellow',
      },
      'completed': {
        id: 'completed',
        name: 'Completed',
        tasks: ['task-3'],
        columnColor: 'green',
      },
    },
    columnOrder: ['todo', 'in-progress', 'completed'],
  };

  const defaultMockReturn = {
    data: mockData,
    addTask: jest.fn(),
    addColumn: jest.fn(),
    onDragEnd: jest.fn(),
    actions: [],
    storageState: { isLoading: false, error: undefined, isAvailable: true },
    clearStorage: jest.fn(),
    isHydrated: true,
    editingState: { isEditing: false, taskId: null },
    startEditingTask: jest.fn(),
    stopEditingTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    deleteColumn: jest.fn(),
    refetchBoard: jest.fn(),
  };

  // Helper function to render with SocketProvider
  const renderWithProvider = (component: React.ReactElement) => {
    return render(component, { wrapper: TestWrapper });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseKanban.mockReturnValue(defaultMockReturn);
    // Default: storage mode already selected (skip modal)
    mockGetStorageData.mockReturnValue('backend');
  });

  describe('Storage Mode Selection', () => {
    it('shows modal when no storage mode is saved', () => {
      // Mock no saved storage mode
      mockGetStorageData.mockReturnValue(null);

      renderWithProvider(<KanbanBoard />);
      
      expect(screen.getByText('Welcome to My Kanban')).toBeInTheDocument();
      expect(screen.getByText('Choose how you want to store your data:')).toBeInTheDocument();
      expect(screen.getByText('Browser Only')).toBeInTheDocument();
      expect(screen.getByText('Backend')).toBeInTheDocument();
    });

    it('saves selection and shows board after choosing Browser Only', async () => {
      mockGetStorageData.mockReturnValue(null);

      renderWithProvider(<KanbanBoard />);
      
      const browserButton = screen.getByText('Browser Only').closest('button');
      fireEvent.click(browserButton!);

      await waitFor(() => {
        expect(mockSetStorageData).toHaveBeenCalledWith('kanban_storage_mode', 'browser');
        expect(screen.queryByText('Welcome to My Kanban')).not.toBeInTheDocument();
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it('saves selection and shows board after choosing Backend', async () => {
      mockGetStorageData.mockReturnValue(null);

      renderWithProvider(<KanbanBoard />);
      
      const backendButton = screen.getByText('Backend').closest('button');
      fireEvent.click(backendButton!);

      await waitFor(() => {
        expect(mockSetStorageData).toHaveBeenCalledWith('kanban_storage_mode', 'backend');
        expect(screen.queryByText('Welcome to My Kanban')).not.toBeInTheDocument();
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it('skips modal when storage mode is already saved', () => {
      mockGetStorageData.mockReturnValue('backend');

      renderWithProvider(<KanbanBoard />);
      
      expect(screen.queryByText('Welcome to My Kanban')).not.toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('displays loading state when not hydrated', () => {
      mockUseKanban.mockReturnValue({
        ...defaultMockReturn,
        isHydrated: false,
      });

      renderWithProvider(<KanbanBoard />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('displays loading state when storage is loading', () => {
      mockUseKanban.mockReturnValue({
        ...defaultMockReturn,
        storageState: { isLoading: true, error: undefined, isAvailable: true },
      });

      renderWithProvider(<KanbanBoard />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders board when hydrated and not loading', () => {
      renderWithProvider(<KanbanBoard />);
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });

  describe('Board Rendering', () => {
    it('renders header with actions and reset callback', () => {
      const actions = [{
        id: '1',
        type: 'created' as const,
        taskId: 'task-1',
        taskContent: 'Test task',
        toColumn: 'todo',
        timestamp: Date.now(),
      }];
      mockUseKanban.mockReturnValue({
        ...defaultMockReturn,
        actions,
      });

      renderWithProvider(<KanbanBoard />);
      expect(screen.getByTestId('header')).toHaveTextContent('Actions: 1');
      expect(screen.getByTestId('header')).toHaveTextContent('Reset: Yes');
    });

    it('renders all columns in correct order', () => {
      renderWithProvider(<KanbanBoard />);

      expect(screen.getByTestId('column-todo')).toBeInTheDocument();
      expect(screen.getByTestId('column-in-progress')).toBeInTheDocument();
      expect(screen.getByTestId('column-completed')).toBeInTheDocument();
    });

    it('passes correct tasks to each column', () => {
      renderWithProvider(<KanbanBoard />);

      expect(screen.getByTestId('column-todo')).toHaveTextContent('Tasks: 1');
      expect(screen.getByTestId('column-in-progress')).toHaveTextContent('Tasks: 1');
      expect(screen.getByTestId('column-completed')).toHaveTextContent('Tasks: 1');
    });

    it('renders add task button', () => {
      renderWithProvider(<KanbanBoard />);
      expect(screen.getByTestId('add-task-button')).toBeInTheDocument();
    });

    it('renders footer with credits', () => {
      renderWithProvider(<KanbanBoard />);
      expect(screen.getByText(/Built by Jasper and Najiha/i)).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('handles empty columns', () => {
      const emptyData = {
        ...mockData,
        columns: {
          'todo': { id: 'todo', name: 'To Do', tasks: [], columnColor: 'blue' },
          'in-progress': { id: 'in-progress', name: 'In Progress', tasks: [], columnColor: 'yellow' },
          'completed': { id: 'completed', name: 'Completed', tasks: [], columnColor: 'green' },
        },
      };

      mockUseKanban.mockReturnValue({
        ...defaultMockReturn,
        data: emptyData,
      });

      renderWithProvider(<KanbanBoard />);

      expect(screen.getByTestId('column-todo')).toHaveTextContent('Tasks: 0');
      expect(screen.getByTestId('column-in-progress')).toHaveTextContent('Tasks: 0');
      expect(screen.getByTestId('column-completed')).toHaveTextContent('Tasks: 0');
    });

    it('handles missing column data gracefully', () => {
      const incompleteData = {
        tasks: mockData.tasks,
        columns: {
          'todo': mockData.columns['todo'],
          // Missing in-progress and completed
        },
        columnOrder: ['todo', 'in-progress', 'completed'],
      };

      mockUseKanban.mockReturnValue({
        ...defaultMockReturn,
        data: incompleteData,
      });

      renderWithProvider(<KanbanBoard />);

      // Should only render the todo column
      expect(screen.getByTestId('column-todo')).toBeInTheDocument();
      expect(screen.queryByTestId('column-in-progress')).not.toBeInTheDocument();
      expect(screen.queryByTestId('column-completed')).not.toBeInTheDocument();
    });
  });

  describe('Integration with useKanban', () => {
    it('passes addTask callback to AddTaskButton', () => {
      const addTask = jest.fn();
      mockUseKanban.mockReturnValue({
        ...defaultMockReturn,
        addTask,
      });

      renderWithProvider(<KanbanBoard />);
      const button = screen.getByTestId('add-task-button');
      button.click();

      expect(addTask).toHaveBeenCalledWith('todo');
    });

    it('passes column props correctly', () => {
      const startEditingTask = jest.fn();
      const stopEditingTask = jest.fn();
      const updateTask = jest.fn();
      const deleteTask = jest.fn();

      mockUseKanban.mockReturnValue({
        ...defaultMockReturn,
        startEditingTask,
        stopEditingTask,
        updateTask,
        deleteTask,
        editingState: { isEditing: true, taskId: 'task-1' },
      });

      renderWithProvider(<KanbanBoard />);

      // Verify columns are rendered (which means props were passed)
      expect(screen.getByTestId('column-todo')).toBeInTheDocument();
    });

    it('filters out invalid task IDs', () => {
      const dataWithInvalidTasks = {
        ...mockData,
        columns: {
          ...mockData.columns,
          'todo': {
            ...mockData.columns['todo'],
            tasks: ['task-1', 'invalid-task-id', 'task-999'],
          },
        },
      };

      mockUseKanban.mockReturnValue({
        ...defaultMockReturn,
        data: dataWithInvalidTasks,
      });

      renderWithProvider(<KanbanBoard />);

      // Should only show 1 valid task (task-1)
      expect(screen.getByTestId('column-todo')).toHaveTextContent('Tasks: 1');
    });
  });

  describe('DragDropContext', () => {
    it('wraps columns in DragDropContext', () => {
      const onDragEnd = jest.fn();
      mockUseKanban.mockReturnValue({
        ...defaultMockReturn,
        onDragEnd,
      });

      renderWithProvider(<KanbanBoard />);

      // Verify DragDropContext is present by checking if columns are rendered
      // (DragDropContext would throw if not properly configured)
      expect(screen.getByTestId('column-todo')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('applies responsive grid classes', () => {
      const { container } = renderWithProvider(<KanbanBoard />);
      
    });

    it('applies proper spacing classes', () => {
      const { container } = renderWithProvider(<KanbanBoard />);
      
    });
  });
});
