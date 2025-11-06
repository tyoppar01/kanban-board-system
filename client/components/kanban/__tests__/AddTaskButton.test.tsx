import { render, screen, fireEvent } from '@testing-library/react';
import { AddTaskButton } from '../AddTaskButton';

describe('AddTaskButton', () => {
  it('renders button', () => {
    render(<AddTaskButton onAddTask={() => {}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onAddTask when clicked', () => {
    const mockAdd = jest.fn();
    render(<AddTaskButton onAddTask={mockAdd} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockAdd).toHaveBeenCalledTimes(1);
  });
});