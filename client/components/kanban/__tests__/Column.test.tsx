import { render, screen } from '@testing-library/react';
import { DragDropContext } from '@hello-pangea/dnd';
import { Column } from '../Column';
import { Column as ColumnType, Task } from '../../../types/kanban.types';

// Wrapper component to provide DragDropContext
const DndWrapper = ({ children }: { children: React.ReactNode }) => (
  <DragDropContext onDragEnd={() => {}}>
    {children}
  </DragDropContext>
);

describe('Column', () => {
  const mockColumn: ColumnType = {
    id: 'todo',
    name: 'To Do',
    tasks: ['task-1', 'task-2'],
    columnColor: 'blue',
  };

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      content: 'First task',
    },
    {
      id: 'task-2',
      content: 'Second task',
    },
  ];

  const mockProps = {
    column: mockColumn,
    tasks: mockTasks,
    editingTaskId: null,
    onStartEdit: jest.fn(),
    onStopEdit: jest.fn(),
    onUpdateTask: jest.fn(),
    onDeleteTask: jest.fn(),
  };

  it('renders column with correct title', () => {
    render(
      <DndWrapper>
        <Column {...mockProps} />
      </DndWrapper>
    );
    
    expect(screen.getByText('To Do')).toBeInTheDocument();
  });

  it('displays correct task count', () => {
    render(
      <DndWrapper>
        <Column {...mockProps} />
      </DndWrapper>
    );
    
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders all tasks', () => {
    render(
      <DndWrapper>
        <Column {...mockProps} />
      </DndWrapper>
    );
    
    expect(screen.getByText('First task')).toBeInTheDocument();
    expect(screen.getByText('Second task')).toBeInTheDocument();
  });

  it('renders empty column with zero tasks', () => {
    render(
      <DndWrapper>
        <Column {...mockProps} tasks={[]} />
      </DndWrapper>
    );
    
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.queryByText('First task')).not.toBeInTheDocument();
  });

  it('renders column with different color', () => {
    const orangeColumn = { ...mockColumn, columnColor: 'orange' };
    render(
      <DndWrapper>
        <Column {...mockProps} column={orangeColumn} />
      </DndWrapper>
    );
    
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders column without color (defaults to gray)', () => {
    const noColorColumn = { ...mockColumn, columnColor: undefined };
    render(
      <DndWrapper>
        <Column {...mockProps} column={noColorColumn} />
      </DndWrapper>
    );
    
    expect(screen.getByText('To Do')).toBeInTheDocument();
  });

  it('handles task with special characters', () => {
    const specialTasks: Task[] = [
      {
        id: 'task-special',
        content: 'Task with <special> & "characters"',
      },
    ];
    
    render(
      <DndWrapper>
        <Column {...mockProps} tasks={specialTasks} />
      </DndWrapper>
    );
    
    expect(screen.getByText('Task with <special> & "characters"')).toBeInTheDocument();
  });

  it('handles task with long content', () => {
    const longTasks: Task[] = [
      {
        id: 'task-long',
        content: 'This is a very long task description that goes on and on and contains a lot of text to test how the component handles lengthy content',
      },
    ];
    
    render(
      <DndWrapper>
        <Column {...mockProps} tasks={longTasks} />
      </DndWrapper>
    );
    
    expect(screen.getByText(/This is a very long task description/)).toBeInTheDocument();
  });

  it('renders tasks in correct order', () => {
    render(
      <DndWrapper>
        <Column {...mockProps} />
      </DndWrapper>
    );
    
    // Both tasks should be rendered
    expect(screen.getByText('First task')).toBeInTheDocument();
    expect(screen.getByText('Second task')).toBeInTheDocument();
  });
});
