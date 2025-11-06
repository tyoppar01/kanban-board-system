import { render, screen, fireEvent } from '@testing-library/react';
import { LastActions } from '../LastActions';
import { Action } from '../../../types/kanban.types';

describe('LastActions', () => {
  const mockOnClose = jest.fn();
  const now = Date.now();

  const mockActions: Action[] = [
    {
      id: '1',
      type: 'created',
      taskId: 'task-1',
      taskContent: 'New task',
      toColumn: 'todo',
      timestamp: now - 30000, // 30 seconds ago
    },
    {
      id: '2',
      type: 'moved',
      taskId: 'task-1',
      taskContent: 'New task',
      fromColumn: 'todo',
      toColumn: 'in-progress',
      timestamp: now - 120000, // 2 minutes ago
    },
    {
      id: '3',
      type: 'edited',
      taskId: 'task-1',
      taskContent: 'Updated task',
      oldContent: 'New task',
      toColumn: 'in-progress',
      timestamp: now - 7200000, // 2 hours ago
    },
    {
      id: '4',
      type: 'deleted',
      taskId: 'task-1',
      taskContent: 'Updated task',
      fromColumn: 'in-progress',
      toColumn: '',
      timestamp: now - 172800000, // 2 days ago
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Rendering Tests
  it('renders modal title', () => {
    render(<LastActions actions={[]} onClose={mockOnClose} />);
    expect(screen.getByText('Last Actions')).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<LastActions actions={[]} onClose={mockOnClose} />);
    const closeButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'));
    expect(closeButton).toBeInTheDocument();
  });

  it('shows "No actions yet" when actions array is empty', () => {
    render(<LastActions actions={[]} onClose={mockOnClose} />);
    expect(screen.getByText('No actions yet')).toBeInTheDocument();
  });

  // Action Type Tests
  it('renders created action correctly', () => {
    const createdAction = [mockActions[0]];
    render(<LastActions actions={createdAction} onClose={mockOnClose} />);
    
    expect(screen.getByText(/Created/i)).toBeInTheDocument();
    expect(screen.getByText(/"New task"/i)).toBeInTheDocument();
    expect(screen.getByText(/in todo/i)).toBeInTheDocument();
  });

  it('renders moved action correctly', () => {
    const movedAction = [mockActions[1]];
    render(<LastActions actions={movedAction} onClose={mockOnClose} />);
    
    expect(screen.getByText(/Moved/i)).toBeInTheDocument();
    expect(screen.getByText(/from todo to in-progress/i)).toBeInTheDocument();
  });

  it('renders edited action correctly', () => {
    const editedAction = [mockActions[2]];
    render(<LastActions actions={editedAction} onClose={mockOnClose} />);
    
    expect(screen.getByText(/Edited/i)).toBeInTheDocument();
    expect(screen.getByText(/"Updated task"/i)).toBeInTheDocument();
  });

  it('renders deleted action correctly', () => {
    const deletedAction = [mockActions[3]];
    render(<LastActions actions={deletedAction} onClose={mockOnClose} />);
    
    expect(screen.getByText(/Deleted/i)).toBeInTheDocument();
    expect(screen.getByText(/from in-progress/i)).toBeInTheDocument();
  });

  // Time Formatting Tests
  it('formats time as "just now" for recent actions', () => {
    const recentAction: Action[] = [{
      id: '1',
      type: 'created',
      taskId: 'task-1',
      taskContent: 'New task',
      toColumn: 'todo',
      timestamp: Date.now() - 10000, // 10 seconds ago
    }];
    
    render(<LastActions actions={recentAction} onClose={mockOnClose} />);
    expect(screen.getByText('just now')).toBeInTheDocument();
  });

  it('formats time in minutes for actions less than an hour old', () => {
    render(<LastActions actions={[mockActions[1]]} onClose={mockOnClose} />);
    expect(screen.getByText(/2m ago/i)).toBeInTheDocument();
  });

  it('formats time in hours for actions less than a day old', () => {
    render(<LastActions actions={[mockActions[2]]} onClose={mockOnClose} />);
    expect(screen.getByText(/2h ago/i)).toBeInTheDocument();
  });

  it('formats time in days for older actions', () => {
    render(<LastActions actions={[mockActions[3]]} onClose={mockOnClose} />);
    expect(screen.getByText(/2d ago/i)).toBeInTheDocument();
  });

  // Interaction Tests
  it('calls onClose when close button is clicked', () => {
    render(<LastActions actions={mockActions} onClose={mockOnClose} />);
    
    const closeButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'));
    fireEvent.click(closeButton!);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking outside modal', () => {
    render(<LastActions actions={mockActions} onClose={mockOnClose} />);
    
    // Click on the backdrop (the fixed inset-0 div)
    const backdrop = screen.getByText('Last Actions').closest('.fixed');
    fireEvent.click(backdrop!);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside modal', () => {
    render(<LastActions actions={mockActions} onClose={mockOnClose} />);
    
    // Click on the modal content
    const modalContent = screen.getByText('Last Actions').closest('.bg-white');
    fireEvent.click(modalContent!);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  // Display Limit Test
  it('only displays first 3 actions when more than 3 exist', () => {
    render(<LastActions actions={mockActions} onClose={mockOnClose} />);
    
    // Should show first 3 actions
    expect(screen.getByText(/Created/i)).toBeInTheDocument();
    expect(screen.getByText(/Moved/i)).toBeInTheDocument();
    expect(screen.getByText(/Edited/i)).toBeInTheDocument();
    
    // Should NOT show 4th action (deleted)
    expect(screen.queryByText(/Deleted/i)).not.toBeInTheDocument();
  });

  // Color Indicator Tests
  it('renders correct color indicators for different action types', () => {
    render(<LastActions actions={mockActions.slice(0, 3)} onClose={mockOnClose} />);
    
    const container = screen.getByText('Last Actions').closest('.bg-white');
    
    // Check for colored dots (bg-blue-500 for created, bg-green-500 for moved, bg-yellow-500 for edited)
    expect(container?.querySelector('.bg-blue-500')).toBeInTheDocument();
    expect(container?.querySelector('.bg-green-500')).toBeInTheDocument();
    expect(container?.querySelector('.bg-yellow-500')).toBeInTheDocument();
  });
});
