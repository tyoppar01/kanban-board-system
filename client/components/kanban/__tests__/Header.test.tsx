import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from '../Header';
import { Action } from '../../../types/kanban.types';

// Mock window.confirm
const mockConfirm = jest.fn();
global.confirm = mockConfirm;

describe('Header', () => {
  const mockActions: Action[] = [
    {
      id: '1',
      type: 'created',
      taskId: 'task-1',
      taskContent: 'New task',
      toColumn: 'todo',
      timestamp: Date.now(),
    },
    {
      id: '2',
      type: 'moved',
      taskId: 'task-1',
      taskContent: 'New task',
      fromColumn: 'todo',
      toColumn: 'in-progress',
      timestamp: Date.now(),
    },
  ];

  const mockOnReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Rendering Tests
  it('renders header title', () => {
    render(<Header actions={[]} onReset={mockOnReset} />);
    expect(screen.getByText('My Kanban')).toBeInTheDocument();
  });

  it('renders subtitle/description', () => {
    render(<Header actions={[]} onReset={mockOnReset} />);
    expect(screen.getByText('A simple board to keep track of tasks.')).toBeInTheDocument();
  });

  it('renders "Last Actions" button', () => {
    render(<Header actions={[]} onReset={mockOnReset} />);
    expect(screen.getByRole('button', { name: /last actions/i })).toBeInTheDocument();
  });

  it('renders "Reset" button', () => {
    render(<Header actions={[]} onReset={mockOnReset} />);
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  // Interaction Tests - Last Actions
  it('LastActions modal is hidden by default', () => {
    render(<Header actions={mockActions} onReset={mockOnReset} />);
    // LastActions component should not be visible initially (check for "Created" text which appears in actions)
    expect(screen.queryByText(/Created/i)).not.toBeInTheDocument();
  });

  it('clicking "Last Actions" button shows LastActions modal', () => {
    render(<Header actions={mockActions} onReset={mockOnReset} />);
    
    const lastActionsButton = screen.getByRole('button', { name: /last actions/i });
    fireEvent.click(lastActionsButton);
    
    // Check if LastActions modal is now visible by looking for "Created" action text
    expect(screen.getByText(/Created/i)).toBeInTheDocument();
  });

  it('closing LastActions modal hides it', () => {
    render(<Header actions={mockActions} onReset={mockOnReset} />);
    
    // Open modal
    const lastActionsButton = screen.getByRole('button', { name: /last actions/i });
    fireEvent.click(lastActionsButton);
    expect(screen.getByText(/Created/i)).toBeInTheDocument();
    
    // Close modal - find by the X icon's parent button
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => btn.querySelector('svg'));
    fireEvent.click(closeButton!);
    
    // Modal should be hidden
    expect(screen.queryByText(/Created/i)).not.toBeInTheDocument();
  });

  // Interaction Tests - Reset
  it('clicking "Reset" button shows confirmation dialog', () => {
    render(<Header actions={[]} onReset={mockOnReset} />);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);
    
    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to reset all data? This will clear all tasks and actions from localStorage.'
    );
  });

  it('confirming reset calls onReset callback', () => {
    mockConfirm.mockReturnValue(true);
    render(<Header actions={[]} onReset={mockOnReset} />);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);
    
    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it('canceling reset does not call onReset callback', () => {
    mockConfirm.mockReturnValue(false);
    render(<Header actions={[]} onReset={mockOnReset} />);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);
    
    expect(mockOnReset).not.toHaveBeenCalled();
  });

  // Props Tests
  it('passes actions prop to LastActions component', () => {
    render(<Header actions={mockActions} onReset={mockOnReset} />);
    
    // Open modal
    const lastActionsButton = screen.getByRole('button', { name: /last actions/i });
    fireEvent.click(lastActionsButton);
    
    // Check if actions are displayed (both Created and Moved actions should appear)
    expect(screen.getByText(/Created/i)).toBeInTheDocument();
    expect(screen.getByText(/Moved/i)).toBeInTheDocument();
  });
});
