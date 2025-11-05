import { useState, useEffect, useCallback } from 'react';
import { Board, Task, ColorClasses, EditingState } from '../types/kanban.types';
import { DropResult } from '@hello-pangea/dnd';
import { Action, StorageState } from '../types/kanban.types';
import { getStorageData, setStorageData, STORAGE_KEYS, isLocalStorageAvailable } from '@/utils/storage';
import { boardApi, taskApi } from '../services/api';
import { transformBackendToFrontend, transformTaskToBackend } from '../utils/dataTransform';


// Initial data
const initialData: Board = {
  tasks: {
    'task-1': { id: 'task-1', content: 'Take out the garbage' },
    'task-2': { id: 'task-2', content: 'Watch my favorite show' },
    'task-3': { id: 'task-3', content: 'Charge my phone' },
    'task-4': { id: 'task-4', content: 'Cook dinner' },
  },
  columns: {
    'todo': {
      id: 'todo',
      name: 'To Do',
      tasks: ['task-2', 'task-3', 'task-4'],
      columnColor: 'blue'
    },
    'in-progress': {
      id: 'in-progress',
      name: 'In Progress',
      tasks: ['task-1'],
      columnColor: 'yellow'
    },
    'completed': {
      id: 'completed',
      name: 'Completed',
      tasks: [],
      columnColor: 'green'
    },
  },
  columnOrder: ['todo', 'in-progress', 'completed'],
};

// Color mapping
export const colorClasses: ColorClasses = {
  'blue': {
    bg: 'bg-blue-600',
    text: 'text-blue-600',
    border: 'border-blue-600'
  },
  'yellow': {
    bg: 'bg-yellow-500',
    text: 'text-yellow-500',
    border: 'border-yellow-500'
  },
  'green': {
    bg: 'bg-green-600',
    text: 'text-green-600',
    border: 'border-green-600'
  }
};

export const useKanban = () => {
  const [data, setData] = useState<Board>(initialData);
  const [taskCounter, setTaskCounter] = useState<number>(7);
  const [actions, setActions] = useState<Action[]>([]);

  const [isHydrated, setIsHydrated] = useState(false);
  const [storageState, setStorageState] = useState<StorageState>({
    isLoading: true,
    isAvailable: false,
  });
  const [editingState, setEditingState] = useState<EditingState>({
    isEditing: false,
    taskId: null,
  });

  // hydration effect
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // load from storage or backend after hydration
  useEffect(() => {
    if (!isHydrated) return;

    const available = isLocalStorageAvailable();
    setStorageState(prev => ({
      ...prev,
      isAvailable: available,
    }));

    // Try to load from localStorage first for offline support
    if (available) {
      const savedData = getStorageData(STORAGE_KEYS.KANBAN_DATA, null);
      const savedCounter = getStorageData(STORAGE_KEYS.KANBAN_COUNTER, 7);
      const savedActions = getStorageData(STORAGE_KEYS.KANBAN_ACTIONS, []);

      if (savedData) {
        setData(savedData);
      }
      if (savedCounter) {
        setTaskCounter(savedCounter);
      }
      if (savedActions) {
        setActions(savedActions);
      }
    }

    // Fetch from backend API
    const fetchBoardFromBackend = async () => {
      try {
        const backendBoard = await boardApi.getBoard();
        const frontendBoard = transformBackendToFrontend(backendBoard);
        setData(frontendBoard);
        
        // Update task counter based on highest task ID
        const taskIds = Object.keys(backendBoard.taskList).map(Number);
        const maxId = Math.max(...taskIds, 0);
        setTaskCounter(maxId + 1);
      } catch (error) {
        console.error('Failed to fetch board from backend:', error);
        // If backend fails, we'll use localStorage data or initialData
      } finally {
        setStorageState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    };

    fetchBoardFromBackend();
  }, [isHydrated]);

  // save to storage function
  const saveToStorage = useCallback(() => {
    if (!storageState.isAvailable) return;

    const success =
      setStorageData(STORAGE_KEYS.KANBAN_DATA, data) &&
      setStorageData(STORAGE_KEYS.KANBAN_COUNTER, taskCounter) &&
      setStorageData(STORAGE_KEYS.KANBAN_ACTIONS, actions);

    if (success) {
      setStorageState(prev => ({
        ...prev,
        lastSaved: Date.now(),
        error: undefined,
      }));
    } else {
      setStorageState(prev => ({
        ...prev,
        error: 'Failed to save data to local storage.',
      }));
    }

    return success;
  }, [data, taskCounter, actions, storageState.isAvailable]);


  // auto save when data changes
  useEffect(() => {
    if (isHydrated) {
      saveToStorage();
    }
  }, [data, taskCounter, actions, isHydrated, saveToStorage]);

  // clear storage function
  const clearStorage = useCallback(() => {
    if (typeof window === 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.KANBAN_DATA);
      localStorage.removeItem(STORAGE_KEYS.KANBAN_COUNTER);
      localStorage.removeItem(STORAGE_KEYS.KANBAN_ACTIONS);

      // reset to intial state
      setData(initialData);
      setTaskCounter(7);
      setActions([]); 
      setStorageState(prev => ({
        ...prev,
        lastSaved: undefined,
        error: undefined,
      }));

      return true;
    }
    return false;
  }, []);

  // Function to add a new task
  const addTask = async () => {
    const newTaskId = `task-${taskCounter}`;
    const newTask: Task = { id: newTaskId, content: 'New task' };

    const todoColumn = data.columns['todo'];
    const newTaskIds = [...todoColumn.tasks, newTaskId];

    const updatedTasks = {
      ...data.tasks,
      [newTaskId]: newTask,
    };

    const updatedColumns = {
      ...data.columns,
      todo: {
        ...todoColumn,
        tasks: newTaskIds
      }
    };

    // Update local state immediately for responsive UI
    setData({
      ...data,
      tasks: updatedTasks,
      columns: updatedColumns
    });

    setTaskCounter(taskCounter + 1);

    // Sync with backend
    try {
      const backendTask = transformTaskToBackend(newTaskId, 'New task', taskCounter);
      await taskApi.createTask(backendTask);
    } catch (error) {
      console.error('Failed to create task on backend:', error);
      // Task is still saved locally, will sync later
    }

    setTimeout(() => {
      startEditingTask(newTaskId);
    }, 100);
  };

  // update task content function
  const updateTask = (taskId: string, newContent: string) => {
    const oldContent = data.tasks[taskId]?.content || '';

    const updatedTasks = {
      ...data.tasks,
      [taskId]: {
        ...data.tasks[taskId],
        content: newContent
      }
    };
    setData({
      ...data,
      tasks: updatedTasks
    });

    // Check if this is a newly created task being named for the first time
    if (oldContent === 'New task' && newContent !== 'New task') {
      // Find which column the task is in
      let columnName = 'To Do';
      for (const [colId, column] of Object.entries(data.columns)) {
        if (column.tasks.includes(taskId)) {
          columnName = column.name;
          break;
        }
      }

      // Add "Created" action
      const newAction: Action = {
        id: `action-${Date.now()}`,
        type: 'created',
        taskId: taskId,
        taskContent: newContent,
        toColumn: columnName,
        timestamp: Date.now()
      };
      setActions([newAction, ...actions].slice(0, 10));
    } 
    // otherwise, if content actually changed and it's not a new task, record as edit
    else if (oldContent !== newContent && oldContent !== 'New task') {
      // Add "Edited" action
      const newAction: Action = {
        id: `action-${Date.now()}`,
        type: 'edited',
        taskId: taskId,
        taskContent: newContent,
        oldContent: oldContent,
        toColumn: '',
        timestamp: Date.now()
      };
      setActions([newAction, ...actions].slice(0, 10));
    }
  };

  // Function to start editing a task
const startEditingTask = (taskId: string) => {
  setEditingState({ isEditing: true, taskId });
};

// Function to stop editing
const stopEditingTask = () => {
  setEditingState({ isEditing: false, taskId: null });
};

  // Handle drag and drop
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If no destination, do nothing
    if (!destination) return;

    // If dropped in the same position, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];

    // Moving within the same column
    if (startColumn === finishColumn) {
      const newTaskIds = Array.from(startColumn.tasks);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...startColumn,
        tasks: newTaskIds,
      };

      const newData = {
        ...data,
        columns: {
          ...data.columns,
          [newColumn.id]: newColumn,
        },
      };

      setData(newData);
      return;
    }

    // Moving from one column to another
    const startTaskIds = Array.from(startColumn.tasks);
    startTaskIds.splice(source.index, 1);
    const newStartColumn = {
      ...startColumn,
      tasks: startTaskIds,
    };

    const finishTaskIds = Array.from(finishColumn.tasks);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinishColumn = {
      ...finishColumn,
      tasks: finishTaskIds,
    };

    const newData = {
      ...data,
      columns: {
        ...data.columns,
        [newStartColumn.id]: newStartColumn,
        [newFinishColumn.id]: newFinishColumn,
      },
    };

    setData(newData);

    // Add action to history
    const task = data.tasks[draggableId];
    const newAction: Action = {
      id: `action-${Date.now()}`,
      type: 'moved',
      taskId: draggableId,
      taskContent: task.content,
      fromColumn: startColumn.name,
      toColumn: finishColumn.name,
      timestamp: Date.now()
    };
    setActions([newAction, ...actions].slice(0, 10)); // Keep last 10 actions
  };

  return {
    data,
    taskCounter,
    addTask,
    onDragEnd,
    actions,
    storageState,
    clearStorage,
    isHydrated,
    editingState,
    startEditingTask,
    stopEditingTask,
    updateTask,
  };
};