import {
  STORAGE_KEYS,
  getStorageData,
  setStorageData,
  isLocalStorageAvailable,
} from '../storage';

describe('storage utilities', () => {
  // Mock localStorage
  let localStorageMock: {
    getItem: jest.Mock;
    setItem: jest.Mock;
    removeItem: jest.Mock;
    clear: jest.Mock;
  };

  beforeEach(() => {
    // Create a fresh mock for each test
    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };

    // Replace window.localStorage with our mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('STORAGE_KEYS', () => {
    it('has correct key for KANBAN_DATA', () => {
      expect(STORAGE_KEYS.KANBAN_DATA).toBe('kanban_board_data');
    });

    it('has correct key for KANBAN_ACTIONS', () => {
      expect(STORAGE_KEYS.KANBAN_ACTIONS).toBe('kanban_board_actions');
    });

    it('has correct key for KANBAN_COUNTER', () => {
      expect(STORAGE_KEYS.KANBAN_COUNTER).toBe('kanban_board_task_counter');
    });

    it('is defined as const object', () => {
      // In TypeScript, 'as const' makes it readonly at compile time
      // At runtime in JavaScript, the object is still mutable
      // This test verifies the keys exist and are strings
      expect(typeof STORAGE_KEYS.KANBAN_DATA).toBe('string');
      expect(typeof STORAGE_KEYS.KANBAN_ACTIONS).toBe('string');
      expect(typeof STORAGE_KEYS.KANBAN_COUNTER).toBe('string');
    });
  });

  describe('getStorageData', () => {
    it('retrieves existing data from localStorage', () => {
      const testData = { task: 'test', completed: false };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(testData));

      const result = getStorageData('test-key', {});
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(testData);
    });

    it('parses JSON correctly', () => {
      const complexData = {
        tasks: ['task1', 'task2'],
        count: 42,
        nested: { value: true },
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(complexData));

      const result = getStorageData('complex-key', {});
      expect(result).toEqual(complexData);
    });

    it('returns default value when key does not exist', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const defaultValue = { default: true };
      
      const result = getStorageData('missing-key', defaultValue);
      expect(result).toEqual(defaultValue);
    });

    it('handles null as default value', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = getStorageData('missing-key', null);
      expect(result).toBeNull();
    });

    it('handles object data types', () => {
      const objectData = { name: 'Test', value: 123 };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(objectData));

      const result = getStorageData('object-key', {});
      expect(result).toEqual(objectData);
    });

    it('handles array data types', () => {
      const arrayData = [1, 2, 3, 4, 5];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(arrayData));

      const result = getStorageData('array-key', []);
      expect(result).toEqual(arrayData);
    });

    it('handles string data types', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify('test string'));

      const result = getStorageData('string-key', '');
      expect(result).toBe('test string');
    });

    it('handles number data types', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(42));

      const result = getStorageData('number-key', 0);
      expect(result).toBe(42);
    });

    it('handles boolean data types', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(true));

      const result = getStorageData('boolean-key', false);
      expect(result).toBe(true);
    });

    it('returns default value when JSON parsing fails', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      localStorageMock.getItem.mockReturnValue('invalid json {');
      const defaultValue = { safe: true };
      
      const result = getStorageData('bad-json', defaultValue);
      expect(result).toEqual(defaultValue);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('logs error to console when parsing fails', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      localStorageMock.getItem.mockReturnValue('not valid json');
      
      getStorageData('bad-json', {});
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error reading from localStorage',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('returns default value when localStorage throws error', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const defaultValue = { error: 'handled' };
      const result = getStorageData('error-key', defaultValue);
      
      expect(result).toEqual(defaultValue);
    });

    it('returns default value when window is undefined (SSR)', () => {
      // Mock the module to simulate SSR where window check fails
      // We can't actually delete window in jsdom, so we test the error path instead
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('window is not defined');
      });

      const result = getStorageData('test', { default: true });
      expect(result).toEqual({ default: true });
    });
  });

  describe('setStorageData', () => {
    it('saves data to localStorage successfully', () => {
      const testData = { task: 'test', id: 1 };
      
      const result = setStorageData('test-key', testData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testData)
      );
      expect(result).toBe(true);
    });

    it('stringifies JSON correctly', () => {
      const complexData = {
        nested: { deep: { value: 'test' } },
        array: [1, 2, 3],
      };
      
      setStorageData('complex', complexData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'complex',
        JSON.stringify(complexData)
      );
    });

    it('returns true on success', () => {
      const result = setStorageData('key', { value: 'data' });
      expect(result).toBe(true);
    });

    it('handles object data types', () => {
      const objectData = { name: 'Test', count: 5 };
      setStorageData('object-key', objectData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'object-key',
        JSON.stringify(objectData)
      );
    });

    it('handles array data types', () => {
      const arrayData = ['a', 'b', 'c'];
      setStorageData('array-key', arrayData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'array-key',
        JSON.stringify(arrayData)
      );
    });

    it('handles primitive values', () => {
      setStorageData('string', 'hello');
      setStorageData('number', 42);
      setStorageData('boolean', true);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('string', JSON.stringify('hello'));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('number', JSON.stringify(42));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('boolean', JSON.stringify(true));
    });

    it('returns false when localStorage is full (quota exceeded)', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const result = setStorageData('test-key', { large: 'data' });
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('logs error to console on failure', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      setStorageData('test', { data: 'test' });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error writing to localStorage',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('returns false when localStorage throws error', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = setStorageData('error-key', { data: 'test' });
      expect(result).toBe(false);
    });

    it('returns false when window is undefined (SSR)', () => {
      // Mock the module to simulate SSR where window check fails
      // We can't actually delete window in jsdom, so we test the error path instead
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('window is not defined');
      });

      const result = setStorageData('test', { data: 'test' });
      expect(result).toBe(false);
    });
  });

  describe('isLocalStorageAvailable', () => {
    it('returns true when localStorage is available', () => {
      const result = isLocalStorageAvailable();
      expect(result).toBe(true);
    });

    it('uses __storage_test__ as test key', () => {
      isLocalStorageAvailable();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('__storage_test__', 'test');
    });

    it('removes test key after check', () => {
      isLocalStorageAvailable();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('__storage_test__');
    });

    it('returns false when localStorage is disabled', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage is disabled');
      });

      const result = isLocalStorageAvailable();
      expect(result).toBe(false);
    });

    it('returns false when localStorage throws error (private browsing)', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Private browsing mode');
      });

      const result = isLocalStorageAvailable();
      expect(result).toBe(false);
    });

    it('returns false when window is undefined (SSR)', () => {
      // Mock the module to simulate SSR where window check fails
      // We can't actually delete window in jsdom, so we test the error path instead
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('window is not defined');
      });

      const result = isLocalStorageAvailable();
      expect(result).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should work together: set then get data', () => {
      const testData = { task: 'integration test', id: 99 };
      
      // Store data in our mock
      localStorageMock.setItem.mockImplementation((key, value) => {
        localStorageMock.getItem.mockReturnValue(value);
      });

      const setResult = setStorageData('integration-key', testData);
      expect(setResult).toBe(true);

      const getData = getStorageData('integration-key', {});
      expect(getData).toEqual(testData);
    });

    it('should handle overwriting existing data', () => {
      const originalData = { version: 1 };
      const updatedData = { version: 2 };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(originalData));
      
      localStorageMock.setItem.mockImplementation((key, value) => {
        localStorageMock.getItem.mockReturnValue(value);
      });

      setStorageData('version-key', updatedData);
      const result = getStorageData('version-key', {});

      expect(result).toEqual(updatedData);
    });

    it('should handle multiple keys independently', () => {
      const storage: Record<string, string> = {};

      localStorageMock.setItem.mockImplementation((key, value) => {
        storage[key] = value;
      });

      localStorageMock.getItem.mockImplementation((key) => {
        return storage[key] || null;
      });

      setStorageData('key1', { data: 'first' });
      setStorageData('key2', { data: 'second' });
      setStorageData('key3', { data: 'third' });

      expect(getStorageData('key1', {})).toEqual({ data: 'first' });
      expect(getStorageData('key2', {})).toEqual({ data: 'second' });
      expect(getStorageData('key3', {})).toEqual({ data: 'third' });
    });
  });
});
