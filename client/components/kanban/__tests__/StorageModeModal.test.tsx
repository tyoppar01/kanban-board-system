import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StorageModeModal } from '../StorageModeModal';

describe('StorageModeModal', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders modal with title and subtitle', () => {
      render(<StorageModeModal onSelect={mockOnSelect} />);

      expect(screen.getByText('Welcome to My Kanban')).toBeInTheDocument();
      expect(screen.getByText('Choose how you want to store your data:')).toBeInTheDocument();
    });

    it('renders both storage mode options', () => {
      render(<StorageModeModal onSelect={mockOnSelect} />);

      expect(screen.getByText('Browser Only')).toBeInTheDocument();
      expect(screen.getByText('Backend')).toBeInTheDocument();
    });

    it('renders with blur overlay', () => {
      const { container } = render(<StorageModeModal onSelect={mockOnSelect} />);
      
      const overlay = container.querySelector('.backdrop-blur-md');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('bg-white/30');
    });

    it('renders icons for both options', () => {
      render(<StorageModeModal onSelect={mockOnSelect} />);

      // Check for emoji icons (they're in divs with specific classes)
      const icons = screen.getAllByText(/💾|🌐/);
      expect(icons).toHaveLength(2);
    });
  });

  describe('User Interactions', () => {
    it('calls onSelect with "browser" when Browser Only is clicked', () => {
      render(<StorageModeModal onSelect={mockOnSelect} />);

      const browserButton = screen.getByText('Browser Only').closest('button');
      fireEvent.click(browserButton!);

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
      expect(mockOnSelect).toHaveBeenCalledWith('browser');
    });

    it('calls onSelect with "backend" when Backend is clicked', () => {
      render(<StorageModeModal onSelect={mockOnSelect} />);

      const backendButton = screen.getByText('Backend').closest('button');
      fireEvent.click(backendButton!);

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
      expect(mockOnSelect).toHaveBeenCalledWith('backend');
    });

    it('does not call onSelect multiple times when clicked once', () => {
      render(<StorageModeModal onSelect={mockOnSelect} />);

      const browserButton = screen.getByText('Browser Only').closest('button');
      fireEvent.click(browserButton!);

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Styling', () => {
    it('applies correct gradient classes to Browser Only button', () => {
      render(<StorageModeModal onSelect={mockOnSelect} />);

      const browserButton = screen.getByText('Browser Only').closest('button');
      expect(browserButton).toHaveClass('from-blue-50', 'to-blue-100');
      expect(browserButton).toHaveClass('border-blue-300');
    });

    it('applies correct gradient classes to Backend button', () => {
      render(<StorageModeModal onSelect={mockOnSelect} />);

      const backendButton = screen.getByText('Backend').closest('button');
      expect(backendButton).toHaveClass('from-green-50', 'to-green-100');
      expect(backendButton).toHaveClass('border-green-300');
    });

    it('centers the modal content', () => {
      const { container } = render(<StorageModeModal onSelect={mockOnSelect} />);
      
      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('applies proper spacing to modal card', () => {
      const { container } = render(<StorageModeModal onSelect={mockOnSelect} />);
      
      const card = container.querySelector('.bg-white.rounded-xl');
      expect(card).toHaveClass('p-8', 'max-w-2xl', 'w-full');
    });
  });

  describe('Layout', () => {
    it('uses responsive grid for options', () => {
      const { container } = render(<StorageModeModal onSelect={mockOnSelect} />);
      
      const grid = container.querySelector('.grid.md\\:grid-cols-2');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('gap-6');
    });

    it('centers title text', () => {
      render(<StorageModeModal onSelect={mockOnSelect} />);

      const title = screen.getByText('Welcome to My Kanban');
      expect(title).toHaveClass('text-center');
    });

    it('centers subtitle text', () => {
      render(<StorageModeModal onSelect={mockOnSelect} />);

      const subtitle = screen.getByText('Choose how you want to store your data:');
      expect(subtitle).toHaveClass('text-center');
    });
  });

  describe('Accessibility', () => {
    it('renders buttons that are keyboard accessible', () => {
      render(<StorageModeModal onSelect={mockOnSelect} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('has appropriate z-index for modal overlay', () => {
      const { container } = render(<StorageModeModal onSelect={mockOnSelect} />);
      
      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toHaveClass('z-50');
    });
  });
});
