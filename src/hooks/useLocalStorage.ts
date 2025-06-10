import { useState, useCallback, useEffect } from 'react';
import { UseLocalStorageReturn } from '@/types';

/**
 * Generic localStorage hook with type safety and error handling
 * @param key - localStorage key
 * @param initialValue - fallback value if localStorage is empty
 * @returns {UseLocalStorageReturn<T>} localStorage operations and state
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): UseLocalStorageReturn<T> {
  const [error, setError] = useState<string | null>(null);
  
  // Initialize state with lazy initial state to avoid SSR issues
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      return JSON.parse(item);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      setError(`Failed to read from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setError(null);
        
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        setStoredValue(valueToStore);
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        const errorMessage = `Failed to save to localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`Error setting localStorage key "${key}":`, error);
        setError(errorMessage);
      }
    },
    [key, storedValue]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setError(null);
      setStoredValue(initialValue);
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      const errorMessage = `Failed to remove from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`Error removing localStorage key "${key}":`, error);
      setError(errorMessage);
    }
  }, [key, initialValue]);

  // Listen for changes in other tabs
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setError(null);
          const newValue = JSON.parse(e.newValue);
          setStoredValue(newValue);
        } catch (error) {
          console.warn(`Error parsing localStorage change for key "${key}":`, error);
          setError(`Failed to sync localStorage changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return {
    value: storedValue,
    setValue,
    removeValue,
    error,
  };
} 