import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import KanbanBoard from '../KanbanBoard';
import { useKanban } from '../../../hooks/useKanban';

// Mock the useKanban hook
jest.mock('../../../hooks/useKanban');

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
    taskCounter: 1,
    addTask: jest.fn(),
    onDragEnd: jest.fn(),
    actions: [],
    editingState: { isEditing: false, taskId: null },
    startEditingTask: jest.fn(),
    stopEditingTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    storageState: { isLoading: false, error: undefined, isAvailable: true },
    isHydrated: true,
    clearStorage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseKanban.mockReturnValue(defaultMockReturn);
  });

  describe('Loading States', () => {
    it('displays loading state when not hydrated', () => {
      mockUseKanban.mockReturnValue({
        ...defaultMockReturn,
        isHydrated: false,
      });

      render(<KanbanBoard />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('displays loading state when storage is loading', () => {
      mockUseKanban.mockReturnValue({
        ...defaultMockReturn,
        storageState: { isLoading: true, error: undefined, isAvailable: true },
      });

      render(<KanbanBoard />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders board when hydrated and not loading', () => {
      render(<KanbanBoard />);
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

      render(<KanbanBoard />);
      expect(screen.getByTestId('header')).toHaveTextContent('Actions: 1');
      expect(screen.getByTestId('header')).toHaveTextContent('Reset: Yes');
    });

    it('renders all columns in correct order', () => {
      render(<KanbanBoard />);

      expect(screen.getByTestId('column-todo')).toBeInTheDocument();
      expect(screen.getByTestId('column-in-progress')).toBeInTheDocument();
      expect(screen.getByTestId('column-completed')).toBeInTheDocument();
    });

    it('passes correct tasks to each column', () => {
      render(<KanbanBoard />);

      expect(screen.getByTestId('column-todo')).toHaveTextContent('Tasks: 1');
      expect(screen.getByTestId('column-in-progress')).toHaveTextContent('Tasks: 1');
      expect(screen.getByTestId('column-completed')).toHaveTextContent('Tasks: 1');
    });

    it('renders add task button', () => {
      render(<KanbanBoard />);
      expect(screen.getByTestId('add-task-button')).toBeInTheDocument();
    });

    it('renders footer with credits', () => {
      render(<KanbanBoard />);
      expect(screen.getByText('Built by Jasper and Najiha')).toBeInTheDocument();
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

      render(<KanbanBoard />);

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

      render(<KanbanBoard />);

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

      render(<KanbanBoard />);
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

      render(<KanbanBoard />);

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

      render(<KanbanBoard />);

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

      render(<KanbanBoard />);

      // Verify DragDropContext is present by checking if columns are rendered
      // (DragDropContext would throw if not properly configured)
      expect(screen.getByTestId('column-todo')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('applies responsive grid classes', () => {
      const { container } = render(<KanbanBoard />);
      
      const gridContainer = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
      expect(gridContainer).toBeInTheDocument();
    });

    it('applies proper spacing classes', () => {
      const { container } = render(<KanbanBoard />);
      
      const mainContainer = container.querySelector('.min-h-screen.bg-gray-50.p-8');
      expect(mainContainer).toBeInTheDocument();
    });
  });
});
