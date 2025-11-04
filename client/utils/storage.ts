/**
 * Utility functions for working with local storage
 */

export const STORAGE_KEYS = {
  KANBAN_DATA: 'kanban_board_data',
  KANBAN_ACTIONS: 'kanban_board_actions',
  KANBAN_COUNTER: 'kanban_board_task_counter',
} as const;

/**
 * safely GET data from local storage
 */

export function getStorageData<T>(key: string, defaultValue: T): T | null {
    if (typeof window === 'undefined') return defaultValue; // SSR safety

    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) as T : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage', error);
        return defaultValue;
    }
}

/**
 * safely SET data to local storage
 */
export function setStorageData<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined') return false; // SSR safety

    try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Error writing to localStorage', error);
        return false; 
    }
}

/**
 * safely CHECK if local storage is available
 */
export function isLocalStorageAvailable(): boolean {
    if (typeof window === 'undefined') return false; // SSR safety

    try {
        const testKey = '__storage_test__';
        window.localStorage.setItem(testKey, 'test');
        window.localStorage.removeItem(testKey);
        return true;
    } catch {
        return false;
    }
}