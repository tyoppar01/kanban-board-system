import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from '../Header';
import { Action } from '../../../types/kanban.types';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock window.confirm
const mockConfirm = jest.fn();
global.confirm = mockConfirm;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Wrapper component with AuthProvider
const renderWithAuth = (ui: React.ReactElement) => {
  return render(<AuthProvider>{ui}</AuthProvider>);
};

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
    renderWithAuth(<Header actions={[]} onReset={mockOnReset} />);
    expect(screen.getByText('My Kanban')).toBeInTheDocument();
  });

  it('renders subtitle/description', () => {
    renderWithAuth(<Header actions={[]} onReset={mockOnReset} />);
    expect(screen.getByText('A simple board to keep track of tasks.')).toBeInTheDocument();
  });

  it('renders "Last Actions" button', () => {
    renderWithAuth(<Header actions={[]} onReset={mockOnReset} />);
    // Open actions menu first
    const menuButton = screen.getByTitle('Actions');
    fireEvent.click(menuButton);
    expect(screen.getByRole('button', { name: /last actions/i })).toBeInTheDocument();
  });

  it('renders "Reset" button', () => {
    renderWithAuth(<Header actions={[]} onReset={mockOnReset} />);
    // Open actions menu first
    const menuButton = screen.getByTitle('Actions');
    fireEvent.click(menuButton);
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  // Interaction Tests - Last Actions
  it('LastActions modal is hidden by default', () => {
    renderWithAuth(<Header actions={mockActions} onReset={mockOnReset} />);
    // LastActions component should not be visible initially (check for "Created" text which appears in actions)
    expect(screen.queryByText(/Created/i)).not.toBeInTheDocument();
  });

  it('clicking "Last Actions" button shows LastActions modal', () => {
    renderWithAuth(<Header actions={mockActions} onReset={mockOnReset} />);
    
    // Open actions menu first
    const menuButton = screen.getByTitle('Actions');
    fireEvent.click(menuButton);
    
    const lastActionsButton = screen.getByRole('button', { name: /last actions/i });
    fireEvent.click(lastActionsButton);
    
    // Check if LastActions modal is now visible by looking for "Created" action text
    expect(screen.getByText(/Created/i)).toBeInTheDocument();
  });

  it('closing LastActions modal hides it', async () => {
    renderWithAuth(<Header actions={mockActions} onReset={mockOnReset} />);
    
    // Open actions menu
    const menuButton = screen.getByTitle('Actions');
    fireEvent.click(menuButton);
    
    // Open modal
    const lastActionsButton = screen.getByRole('button', { name: /last actions/i });
    fireEvent.click(lastActionsButton);
    expect(screen.getByText(/Created/i)).toBeInTheDocument();
    
    // Click backdrop to close (backdrop is the outer div with fixed inset-0)
    const backdrop = screen.getByText(/Created/i).closest('.fixed');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    
    // Wait for modal to close
    await waitFor(() => {
      expect(screen.queryByText(/Created/i)).not.toBeInTheDocument();
    });
  });

  // Interaction Tests - Reset
  it('clicking "Reset" button shows confirmation dialog', () => {
    renderWithAuth(<Header actions={[]} onReset={mockOnReset} />);
    
    // Open actions menu first
    const menuButton = screen.getByTitle('Actions');
    fireEvent.click(menuButton);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);
    
    expect(mockConfirm).toHaveBeenCalledWith(
      'Reset data is going to clear localStorage. It won\'t delete any data from the server. Are you sure you want to proceed?'
    );
  });

  it('confirming reset calls onReset callback', () => {
    mockConfirm.mockReturnValue(true);
    renderWithAuth(<Header actions={[]} onReset={mockOnReset} />);
    
    // Open actions menu first
    const menuButton = screen.getByTitle('Actions');
    fireEvent.click(menuButton);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);
    
    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it('canceling reset does not call onReset callback', () => {
    mockConfirm.mockReturnValue(false);
    renderWithAuth(<Header actions={[]} onReset={mockOnReset} />);
    
    // Open actions menu first
    const menuButton = screen.getByTitle('Actions');
    fireEvent.click(menuButton);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);
    
    expect(mockOnReset).not.toHaveBeenCalled();
  });

  // Props Tests
  it('passes actions prop to LastActions component', () => {
    renderWithAuth(<Header actions={mockActions} onReset={mockOnReset} />);
    
    // Open actions menu first
    const menuButton = screen.getByTitle('Actions');
    fireEvent.click(menuButton);
    
    // Open modal
    const lastActionsButton = screen.getByRole('button', { name: /last actions/i });
    fireEvent.click(lastActionsButton);
    
    // Check if actions are displayed (both Created and Moved actions should appear)
    expect(screen.getByText(/Created/i)).toBeInTheDocument();
    expect(screen.getByText(/Moved/i)).toBeInTheDocument();
  });
});
