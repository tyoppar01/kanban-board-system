import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { TaskCard } from '../TaskCard';
import { Task } from '../../../types/kanban.types';

// Wrapper to provide DragDropContext and Droppable
const DndWrapper = ({ children }: { children: React.ReactNode }) => (
  <DragDropContext onDragEnd={() => {}}>
    <Droppable droppableId="test-droppable">
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          {children}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </DragDropContext>
);

describe('TaskCard', () => {
  const mockTask: Task = {
    id: 'task-1',
    content: 'Test task content',
  };

  const mockProps = {
    task: mockTask,
    index: 0,
    columnId: 'todo',
    columnColor: 'blue',
    isEditing: false,
    onStartEdit: jest.fn(),
    onStopEdit: jest.fn(),
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Rendering Tests
  it('renders task content', () => {
    render(
      <DndWrapper>
        <TaskCard {...mockProps} />
      </DndWrapper>
    );
    
    expect(screen.getByText('Test task content')).toBeInTheDocument();
  });

  it('renders task ID', () => {
    render(
      <DndWrapper>
        <TaskCard {...mockProps} />
      </DndWrapper>
    );
    
    expect(screen.getByText('task-1')).toBeInTheDocument();
  });

  it('renders edit button', () => {
    render(
      <DndWrapper>
        <TaskCard {...mockProps} />
      </DndWrapper>
    );
    
    const editButton = screen.getByTitle('Edit task');
    expect(editButton).toBeInTheDocument();
  });

  it('renders delete button', () => {
    render(
      <DndWrapper>
        <TaskCard {...mockProps} />
      </DndWrapper>
    );
    
    const deleteButton = screen.getByTitle('Delete task');
    expect(deleteButton).toBeInTheDocument();
  });

  // Interaction Tests - Edit
  it('calls onStartEdit when edit button is clicked', () => {
    render(
      <DndWrapper>
        <TaskCard {...mockProps} />
      </DndWrapper>
    );
    
    const editButton = screen.getByTitle('Edit task');
    fireEvent.click(editButton);
    
    expect(mockProps.onStartEdit).toHaveBeenCalledTimes(1);
  });

  it('shows input field when isEditing is true', () => {
    render(
      <DndWrapper>
        <TaskCard {...mockProps} isEditing={true} />
      </DndWrapper>
    );
    
    const input = screen.getByDisplayValue('Test task content');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('hides edit and delete buttons when in edit mode', () => {
    render(
      <DndWrapper>
        <TaskCard {...mockProps} isEditing={true} />
      </DndWrapper>
    );
    
    expect(screen.queryByTitle('Edit task')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Delete task')).not.toBeInTheDocument();
  });

  it('updates input value when typing', () => {
    render(
      <DndWrapper>
        <TaskCard {...mockProps} isEditing={true} />
      </DndWrapper>
    );
    
    const input = screen.getByDisplayValue('Test task content') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Updated content' } });
    
    expect(input.value).toBe('Updated content');
  });

  it('calls onUpdate and onStopEdit when pressing Enter', () => {
    render(
      <DndWrapper>
        <TaskCard {...mockProps} isEditing={true} />
      </DndWrapper>
    );
    
    const input = screen.getByDisplayValue('Test task content');
    fireEvent.change(input, { target: { value: 'Updated content' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith('Updated content');
    expect(mockProps.onStopEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onStopEdit when pressing Escape without saving', () => {
    render(
      <DndWrapper>
        <TaskCard {...mockProps} isEditing={true} />
      </DndWrapper>
    );
    
    const input = screen.getByDisplayValue('Test task content');
    fireEvent.change(input, { target: { value: 'Updated content' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    
    expect(mockProps.onUpdate).not.toHaveBeenCalled();
    expect(mockProps.onStopEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onUpdate and onStopEdit when input loses focus', () => {
    render(
      <DndWrapper>
        <TaskCard {...mockProps} isEditing={true} />
      </DndWrapper>
    );
    
    const input = screen.getByDisplayValue('Test task content');
    fireEvent.change(input, { target: { value: 'Updated content' } });
    fireEvent.blur(input);
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith('Updated content');
    expect(mockProps.onStopEdit).toHaveBeenCalledTimes(1);
  });

  it('trims whitespace before saving', () => {
    render(
      <DndWrapper>
        <TaskCard {...mockProps} isEditing={true} />
      </DndWrapper>
    );
    
    const input = screen.getByDisplayValue('Test task content');
    fireEvent.change(input, { target: { value: '  Updated content  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith('Updated content');
  });

  it('does not save empty content', () => {
    render(
      <DndWrapper>
        <TaskCard {...mockProps} isEditing={true} />
      </DndWrapper>
    );
    
    const input = screen.getByDisplayValue('Test task content');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockProps.onUpdate).not.toHaveBeenCalled();
    expect(mockProps.onStopEdit).toHaveBeenCalledTimes(1);
  });

  // Interaction Tests - Delete
  it('calls onDelete when delete button is clicked', () => {
    render(
      <DndWrapper>
        <TaskCard {...mockProps} />
      </DndWrapper>
    );
    
    const deleteButton = screen.getByTitle('Delete task');
    fireEvent.click(deleteButton);
    
    expect(mockProps.onDelete).toHaveBeenCalledTimes(1);
  });

  // Color Tests
  it('applies correct color class based on columnColor', () => {
    const { container } = render(
      <DndWrapper>
        <TaskCard {...mockProps} columnColor="blue" />
      </DndWrapper>
    );
    
    expect(container.querySelector('.text-blue-600')).toBeInTheDocument();
  });

  it('applies different color for different columns', () => {
    const { container } = render(
      <DndWrapper>
        <TaskCard {...mockProps} columnColor="green" />
      </DndWrapper>
    );
    
    expect(container.querySelector('.text-green-600')).toBeInTheDocument();
  });

  // Edge Cases
  it('handles task with long content', () => {
    const longTask = {
      ...mockTask,
      content: 'This is a very long task description that goes on and on and contains a lot of text to test how the component handles lengthy content',
    };
    
    render(
      <DndWrapper>
        <TaskCard {...mockProps} task={longTask} />
      </DndWrapper>
    );
    
    expect(screen.getByText(/This is a very long task description/)).toBeInTheDocument();
  });

  it('handles task with special characters', () => {
    const specialTask = {
      ...mockTask,
      content: 'Task with <special> & "characters"',
    };
    
    render(
      <DndWrapper>
        <TaskCard {...mockProps} task={specialTask} />
      </DndWrapper>
    );
    
    expect(screen.getByText('Task with <special> & "characters"')).toBeInTheDocument();
  });

  it('prevents event propagation when clicking edit button', () => {
    const mockParentClick = jest.fn();
    
    const { container } = render(
      <div onClick={mockParentClick}>
        <DndWrapper>
          <TaskCard {...mockProps} />
        </DndWrapper>
      </div>
    );
    
    const editButton = screen.getByTitle('Edit task');
    fireEvent.click(editButton);
    
    expect(mockProps.onStartEdit).toHaveBeenCalledTimes(1);
    // Parent click should not fire due to stopPropagation
  });

  it('prevents event propagation when clicking delete button', () => {
    const mockParentClick = jest.fn();
    
    const { container } = render(
      <div onClick={mockParentClick}>
        <DndWrapper>
          <TaskCard {...mockProps} />
        </DndWrapper>
      </div>
    );
    
    const deleteButton = screen.getByTitle('Delete task');
    fireEvent.click(deleteButton);
    
    expect(mockProps.onDelete).toHaveBeenCalledTimes(1);
    // Parent click should not fire due to stopPropagation
  });
});
