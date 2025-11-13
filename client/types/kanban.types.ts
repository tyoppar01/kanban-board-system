// Task interface
export interface Task {
  id: string;
  content: string;
}

// Column interface
export interface Column {
  id: string;
  name: string;
  tasks: string[];
  columnColor?: string;
}

// Board interface
export interface Board {
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  columnOrder: string[];
}

// Color classes type
export type ColorClasses = {
  [key: string]: {
    bg: string;
    text: string;
    border: string;
  };
};

// Storage state interface
export interface StorageState {
  isLoading: boolean;
  isAvailable: boolean;
  lastSaved?: number;
  error?: string;
}

// Action interface
export interface Action {
  id: string;
  type: 'created' | 'moved' | 'edited' | 'deleted' | 'created-column' | 'deleted-column' | 'moved-column';
  taskId: string;
  taskContent: string;
  oldContent?: string;
  fromColumn?: string;
  toColumn: string;
  timestamp: number;
  newIndex?: number;
}

// editing state
export interface EditingState {
  isEditing: boolean;
  taskId: string | null; 
}

// Storage mode type
export type StorageMode = 'browser' | 'backend';