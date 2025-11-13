import { useState, useEffect, useCallback, useRef } from 'react';
import { Board, Task, ColorClasses, EditingState, StorageMode } from '../types/kanban.types';
import { DropResult } from '@hello-pangea/dnd';
import { Action, StorageState } from '../types/kanban.types';
import { getStorageData, setStorageData, STORAGE_KEYS, isLocalStorageAvailable } from '@/utils/storage';
import { boardApi, taskApi, columnApi } from '../graphql/api';
import { transformBackendToFrontend, transformTaskToBackend, frontendToBackendColumnId, normalizeColumnName, formatColumnName, getColumnColor } from '../utils/dataTransform';

// Empty initial data - will be loaded from backend
const initialData: Board = {
  tasks: {},
  columns: {
    'todo': {
      id: 'todo',
      name: 'To Do',
      tasks: [],
      columnColor: 'blue'
    },
    'in-progress': {
      id: 'in-progress',
      name: 'In Progress',
      tasks: [],
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
  },
  'pink': {
    bg: 'bg-pink-500',
    text: 'text-pink-500',
    border: 'border-pink-500'
  },
  'teal': {
    bg: 'bg-teal-500',
    text: 'text-teal-500',
    border: 'border-teal-500'
  },
  'indigo': {
    bg: 'bg-indigo-600',
    text: 'text-indigo-600',
    border: 'border-indigo-600'
  },
  'red': {
    bg: 'bg-red-600',
    text: 'text-red-600',
    border: 'border-red-600'
  }
};

export const useKanban = (storageMode: StorageMode = 'backend') => {
  const [data, setData] = useState<Board>(initialData);
  const [taskCounter, setTaskCounter] = useState<number>(7);
  const [actions, setActions] = useState<Action[]>([]);
  const [pendingNewTasks, setPendingNewTasks] = useState<Set<string>>(new Set());
  const hasLoadedInitialData = useRef(false);

  const [isHydrated, setIsHydrated] = useState(false);
  const [storageState, setStorageState] = useState<StorageState>({
    isLoading: true,
    isAvailable: false,
  });
  const [editingState, setEditingState] = useState<EditingState>({
    isEditing: false,
    taskId: null,
  });

  // Determine mode based on parameter
  const USE_BROWSER_ONLY = storageMode === 'browser';

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

    // Helper function to finish loading
    const finishLoading = () => {
      setStorageState(prev => ({
        ...prev,
        isLoading: false,
      }));
      hasLoadedInitialData.current = true;
    };

    if (USE_BROWSER_ONLY) {
      // Browser-only mode: Load from localStorage only
      if (available) {
        const savedData = getStorageData(STORAGE_KEYS.KANBAN_DATA, null);
        const savedCounter = getStorageData(STORAGE_KEYS.KANBAN_COUNTER, 7);
        const savedActions = getStorageData(STORAGE_KEYS.KANBAN_ACTIONS, []);

        if (savedData) setData(savedData);
        if (savedCounter) setTaskCounter(savedCounter);
        if (savedActions) setActions(savedActions);
      }
      
      finishLoading();
    } else {
      // Backend mode: Fetch from backend and save to localStorage
      const fetchBoardFromBackend = async () => {
        try {
          const backendBoard = await boardApi.getBoard();
          const frontendBoard = transformBackendToFrontend(backendBoard);
          setData(frontendBoard);
          
          // Update task counter based on highest task ID
          const taskIds = Object.keys(backendBoard.taskList).map(Number);
          const maxId = Math.max(...taskIds, 0);
          setTaskCounter(maxId + 1);
          
          // Load actions from localStorage (actions are client-side only)
          if (available) {
            const savedActions = getStorageData(STORAGE_KEYS.KANBAN_ACTIONS, []);
            console.log('Loading actions from localStorage:', savedActions);
            if (savedActions && savedActions.length > 0) {
              setActions(savedActions);
            }
            
            // Save board data to localStorage for offline support
            setStorageData(STORAGE_KEYS.KANBAN_DATA, frontendBoard);
            setStorageData(STORAGE_KEYS.KANBAN_COUNTER, maxId + 1);
          }
        } catch (error) {
          console.error('Failed to fetch board from backend:', error);
          // Fallback to localStorage if backend fails
          if (available) {
            const savedData = getStorageData(STORAGE_KEYS.KANBAN_DATA, null);
            const savedCounter = getStorageData(STORAGE_KEYS.KANBAN_COUNTER, 7);
            const savedActions = getStorageData(STORAGE_KEYS.KANBAN_ACTIONS, []);

            if (savedData) setData(savedData);
            if (savedCounter) setTaskCounter(savedCounter);
            if (savedActions) setActions(savedActions);
          }
        } finally {
          finishLoading();
        }
      };

      fetchBoardFromBackend();
    }
  }, [isHydrated]);

  // save to storage function
  const saveToStorage = useCallback(() => {
    // prevent saving data when storage is not available or initial load not done
    if (!storageState.isAvailable || !hasLoadedInitialData.current) return;

    console.log('Saving actions to localStorage:', actions);
    const success =
      setStorageData(STORAGE_KEYS.KANBAN_DATA, data) &&
      setStorageData(STORAGE_KEYS.KANBAN_COUNTER, taskCounter) &&
      setStorageData(STORAGE_KEYS.KANBAN_ACTIONS, actions);

    // if saving success is true
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
  const clearStorage = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.KANBAN_DATA);
      localStorage.removeItem(STORAGE_KEYS.KANBAN_COUNTER);
      localStorage.removeItem(STORAGE_KEYS.KANBAN_ACTIONS);

      // Clear actions and pending tasks
      setActions([]);
      setPendingNewTasks(new Set());
      
      // Fetch fresh data from backend
      if (!USE_BROWSER_ONLY) {
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
          // Fallback to empty board if backend fails
          setData(initialData);
          setTaskCounter(1);
        }
      } else {
        // Browser-only mode: reset to empty board
        setData(initialData);
        setTaskCounter(1);
      }
      
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
    // create new task with unique ID
    const newTaskId = `task-${taskCounter}`;
    const newTask: Task = { id: newTaskId, content: 'New task' };

    // get current todo column
    const todoColumn = data.columns['todo'];
    const newTaskIds = [...todoColumn.tasks, newTaskId];

    // create json object for new tasks for board
    const updatedTasks = {
      ...data.tasks,
      [newTaskId]: newTask,
    };

    // create json object for new columns for board
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
    
    // Mark this task as pending (newly created, not yet named)
    setPendingNewTasks(prev => new Set(prev).add(newTaskId));

    // Don't sync to backend yet - wait for user to enter task name
    // delay to ensure React finish rendering before focusing
    setTimeout(() => {
      startEditingTask(newTaskId);
      // setEditingState isEditing true for this taskId
    }, 100);
  };

  // update task content function
  const updateTask = async (taskId: string, newContent: string) => {
    console.log('🐛 updateTask called:', { taskId, newContent });
    console.log('🐛 Current tasks:', Object.keys(data.tasks));
    console.log('🐛 Pending tasks:', Array.from(pendingNewTasks));
    
    const oldContent = data.tasks[taskId]?.content || '';

    const updatedTasks = {
      ...data.tasks,
      [taskId]: {
        ...data.tasks[taskId],
        content: newContent
      }
    };
    
    console.log('🐛 Updated tasks:', Object.keys(updatedTasks));
    
    setData({
      ...data,
      tasks: updatedTasks
    });

    // Check if this is a newly created task being named for the first time
    if (pendingNewTasks.has(taskId)) {
      console.log('🐛 Task IS pending, removing from set:', taskId);
      
      // Remove from pending set
      setPendingNewTasks(prev => {
        const newSet = new Set(prev);
        console.log('🐛 Before delete:', Array.from(prev));
        newSet.delete(taskId);
        console.log('🐛 After delete:', Array.from(newSet));
        return newSet;
      });

      // Find which column the task is in
      let columnName = 'To Do';
      for (const [colId, column] of Object.entries(data.columns)) {
        if (column.tasks.includes(taskId)) {
          columnName = column.name;
          break;
        }
      }

      // Add "Created" action with the actual content (even if it's still "New task")
      const newAction: Action = {
        id: `action-${Date.now()}`,
        type: 'created',
        taskId: taskId,
        taskContent: newContent,  // Use the actual content the user entered
        toColumn: columnName,
        timestamp: Date.now()
      };
      setActions([newAction, ...actions].slice(0, 10));

      // NOW sync with backend after user enters the task name
      if (!USE_BROWSER_ONLY) {
        try {
          console.log('🐛 Syncing to backend:', { taskId, newContent });
          const numericId = parseInt(taskId.split('-')[1]);
          const backendTask = transformTaskToBackend(taskId, newContent, numericId);
          await taskApi.createTask(backendTask);
          console.log('🐛 Backend task created successfully');
        } catch (error) {
          console.error('🐛 Failed to create task on backend:', error);
          // Task is still saved locally, will sync later
        }
      }
    } 
    // otherwise, if content actually changed, record as edit
    else if (oldContent !== newContent) {
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

      // Sync edit with backend
      if (!USE_BROWSER_ONLY) {
        try {
          const numericId = parseInt(taskId.split('-')[1]);
          const backendTask = transformTaskToBackend(taskId, newContent, numericId);
          await taskApi.editTask(backendTask);
        } catch (error) {
          console.error('Failed to edit task on backend:', error);
          // Task is still saved locally, will sync later
        }
      }
    }
  };

  // Add a new column
  const addColumn = async (columnName: string) => {
    const currentColumnCount = Object.keys(data.columns).length;
    
    // Validation: max 6 columns
    if (currentColumnCount >= 6) {
      throw new Error('Maximum 6 columns allowed');
    }

    // Normalize column name to create column ID
    const columnId = normalizeColumnName(columnName);
    
    // Validation: check if column already exists
    if (data.columns[columnId]) {
      throw new Error('A column with this name already exists');
    }

    // Get the new column's order index
    const newOrderIndex = data.columnOrder.length;

    // Create new column
    const newColumn = {
      id: columnId,
      name: formatColumnName(columnId), // Use the formatted name
      tasks: [],
      columnColor: getColumnColor(columnId, newOrderIndex),
    };

    // Update local state immediately
    const updatedColumns = {
      ...data.columns,
      [columnId]: newColumn,
    };

    const updatedColumnOrder = [...data.columnOrder, columnId];

    setData({
      ...data,
      columns: updatedColumns,
      columnOrder: updatedColumnOrder,
    });

    // Sync with backend if not in browser-only mode
    if (!USE_BROWSER_ONLY) {
      try {
        const backendBoard = await columnApi.addColumn(columnId);
        const transformedBoard = transformBackendToFrontend(backendBoard);
        setData(transformedBoard);
      } catch (error) {
        console.error('Failed to add column on backend:', error);
        throw new Error('Failed to add column. Please try again.');
      }
    }
  };

  const deleteColumn = async (columnId: string) => {
    // Remove column from local state
    const {[columnId]: _, ...remainingColumns} = data.columns;
    const updatedColumnOrder = data.columnOrder.filter(id => id !== columnId);

    // Also remove tasks in that column
    const taskIdsToRemove = data.columns[columnId]?.tasks || [];
    const updatedTasks = { ...data.tasks };
    taskIdsToRemove.forEach(taskId => {
      delete updatedTasks[taskId];
    });

    setData({
      tasks: updatedTasks,
      columns: remainingColumns,
      columnOrder: updatedColumnOrder,
    });

    // Sync with backend if not in browser-only mode
    if (!USE_BROWSER_ONLY) {
      try {
        const backendBoard = await columnApi.deleteColumn(columnId);
        const transformedBoard = transformBackendToFrontend(backendBoard);
        setData(transformedBoard);
      } catch (error) {
        console.error('Failed to delete column on backend:', error);
        throw new Error('Failed to delete column. Please try again.');
      }
    }

    // add action for column deletion
    const newAction: Action = {
      id: `action-${Date.now()}`,
      type: 'deleted-column',
      taskId: '',
      taskContent: '',
      fromColumn: data.columns[columnId]?.name || '',
      toColumn: '',
      timestamp: Date.now()
    };
    setActions([newAction, ...actions].slice(0, 10));
  }; 

  // Function to start editing a task
  const startEditingTask = (taskId: string) => {
    setEditingState({ isEditing: true, taskId });
  };

  // Function to stop editing
  const stopEditingTask = () => {
    setEditingState({ isEditing: false, taskId: null });
  };

  const deleteTask = async (taskId: string, columnId: string) => {
    const column = data.columns[columnId];
    const newTaskIds = column.tasks.filter(id => id !== taskId);

    const updatedColumns = {
      ...data.columns,
      [columnId]: {
        ...column,
        tasks: newTaskIds
      }
    };

    const {[taskId]: _, ...remainingTasks} = data.tasks;

    setData({
      ...data,
      tasks: remainingTasks,
      columns: updatedColumns
    });

    // Add "Deleted" action
    const taskContent = data.tasks[taskId]?.content || '';
    const newAction: Action = {
      id: `action-${Date.now()}`,
      type: 'deleted',
      taskId: taskId,
      taskContent: taskContent,
      fromColumn: column.name,
      toColumn: '',
      timestamp: Date.now()
    };
    setActions([newAction, ...actions].slice(0, 10));

    // sync deletion to backend
    if (!USE_BROWSER_ONLY) {
      try {
        const numericId = parseInt(taskId.split('-')[1]);
        const backendColumnId = frontendToBackendColumnId(columnId);
        await taskApi.deleteTask(numericId, backendColumnId);
      } catch (error) {
        console.error('Failed to delete task on backend:', error);
        // Task is still deleted locally, will sync later
      }
    }
  };

  // Handle drag and drop
  const onDragEnd = async (result: DropResult) => {
    console.log('Drag end result:', result);
    const { destination, source, draggableId } = result;

    // If no destination, do nothing (dropped outside)
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

      // Sync move within same column to backend
      if (!USE_BROWSER_ONLY) {
        try {
          const numericId = parseInt(draggableId.split('-')[1]);
          const backendSourceColumn = frontendToBackendColumnId(source.droppableId);
          const backendDestColumn = frontendToBackendColumnId(destination.droppableId);
          await taskApi.moveTask(numericId, destination.index, backendSourceColumn, backendDestColumn);
        } catch (error) {
          console.error('Failed to sync move to backend:', error);
        }
      }
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

    // Sync move to backend
    if (!USE_BROWSER_ONLY) {
      try {
        const numericId = parseInt(draggableId.split('-')[1]);
        const backendSourceColumn = frontendToBackendColumnId(source.droppableId);
        const backendDestColumn = frontendToBackendColumnId(destination.droppableId);
        await taskApi.moveTask(numericId, destination.index, backendSourceColumn, backendDestColumn);
      } catch (error) {
        console.error('Failed to sync move to backend:', error);
      }
    }
  };

  return {
    data,
    taskCounter,
    addTask,
    addColumn,
    onDragEnd,
    actions,
    storageState,
    clearStorage,
    isHydrated,
    editingState,
    startEditingTask,
    stopEditingTask,
    updateTask,
    deleteTask,
    deleteColumn
  };
};