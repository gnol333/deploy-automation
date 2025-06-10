import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  DeploymentPreset,
  DeploymentConfig,
  UsePresetsReturn,
  PresetManagerState,
  PresetValidationError,
} from '@/types';

const PRESETS_STORAGE_KEY = 'deployment-presets';
const ACTIVE_PRESET_STORAGE_KEY = 'active-preset-id';

// Validation regex patterns
const VALIDATION_PATTERNS = {
  // Git URL patterns - supports HTTPS, SSH, and GitHub URLs
  GIT_URL: /^(https?:\/\/(www\.)?github\.com\/[\w\-_.]+\/[\w\-_.]+\.git?(\?.*)?|https?:\/\/[\w\-.]+\/[\w\-_.\/]+\.git|git@[\w\-.]+:[\w\-_.\/]+\.git)$/i,
  // Repository owner/name - alphanumeric, hyphens, underscores, dots
  REPO_NAME: /^[\w\-_.]+$/,
  // Basic deployment path - starts with / or alphanumeric
  DEPLOY_PATH: /^(\/[\w\-_.\/]*|[a-zA-Z]:[\\\/][\w\-_.\\\/]*)$/,
  // Preset name - letters, numbers, spaces, hyphens, underscores, parentheses
  PRESET_NAME: /^[\w\s\-_().]+$/
} as const;

/**
 * Validation helper functions using early returns
 */
const validationHelpers = {
  /**
   * Validate preset name with early returns
   */
  validateName: (name: string): PresetValidationError | null => {
    const trimmed = name.trim();
    
    if (!trimmed) {
      return { field: 'name', message: 'Preset name is required' };
    }
    
    if (trimmed.length < 2) {
      return { field: 'name', message: 'Preset name must be at least 2 characters' };
    }
    
    if (trimmed.length > 50) {
      return { field: 'name', message: 'Preset name must be less than 50 characters' };
    }
    
    if (!VALIDATION_PATTERNS.PRESET_NAME.test(trimmed)) {
      return { field: 'name', message: 'Preset name contains invalid characters' };
    }
    
    return null;
  },

  /**
   * Validate repository owner with early returns
   */
  validateOwner: (owner: string): PresetValidationError | null => {
    const trimmed = owner.trim();
    
    if (!trimmed) {
      return { field: 'owner', message: 'Repository owner is required' };
    }
    
    if (!VALIDATION_PATTERNS.REPO_NAME.test(trimmed)) {
      return { field: 'owner', message: 'Repository owner contains invalid characters' };
    }
    
    return null;
  },

  /**
   * Validate repository name with early returns
   */
  validateRepo: (repo: string): PresetValidationError | null => {
    const trimmed = repo.trim();
    
    if (!trimmed) {
      return { field: 'repo', message: 'Repository name is required' };
    }
    
    if (!VALIDATION_PATTERNS.REPO_NAME.test(trimmed)) {
      return { field: 'repo', message: 'Repository name contains invalid characters' };
    }
    
    return null;
  },

  /**
   * Validate repository URL with early returns and comprehensive regex
   */
  validateRepoUrl: (repoUrl: string): PresetValidationError | null => {
    const trimmed = repoUrl.trim();
    
    if (!trimmed) {
      return { field: 'repoUrl', message: 'Repository URL is required' };
    }
    
    if (!VALIDATION_PATTERNS.GIT_URL.test(trimmed)) {
      return { field: 'repoUrl', message: 'Invalid repository URL format. Use HTTPS or SSH format.' };
    }
    
    return null;
  },

  /**
   * Validate deployment path with early returns
   */
  validateDeployPath: (deployPath: string): PresetValidationError | null => {
    const trimmed = deployPath.trim();
    
    if (!trimmed) {
      return { field: 'deployPath', message: 'Deployment path is required' };
    }
    
    if (!VALIDATION_PATTERNS.DEPLOY_PATH.test(trimmed)) {
      return { field: 'deployPath', message: 'Invalid deployment path format' };
    }
    
    return null;
  },

  /**
   * Validate build command (optional field)
   */
  validateBuildCommand: (buildCommand?: string): PresetValidationError | null => {
    if (!buildCommand?.trim()) {
      return null; // Optional field
    }
    
    const trimmed = buildCommand.trim();
    
    if (trimmed.length > 200) {
      return { field: 'buildCommand', message: 'Build command is too long (max 200 characters)' };
    }
    
    return null;
  }
} as const;

/**
 * Custom hook for managing deployment presets
 * Provides CRUD operations, validation, and state management for presets
 */
export function usePresets(): UsePresetsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize default state
  const defaultPresetState: PresetManagerState = {
    presets: [],
    activePresetId: undefined,
  };

  // Use localStorage hooks for persistence
  const {
    value: presetState,
    setValue: setPresetState,
    error: storageError,
  } = useLocalStorage<PresetManagerState>(PRESETS_STORAGE_KEY, defaultPresetState);

  const {
    value: activePresetId,
    setValue: setActivePresetId,
  } = useLocalStorage<string | null>(ACTIVE_PRESET_STORAGE_KEY, null);

  // Combine storage errors
  const combinedError = error || storageError;

  // Get active preset
  const activePreset = useMemo(() => {
    if (!activePresetId) return null;
    return presetState.presets.find(preset => preset.id === activePresetId) || null;
  }, [activePresetId, presetState.presets]);

  /**
   * Validate preset data using helper functions and early returns
   */
  const validatePreset = useCallback((name: string, config: DeploymentConfig): PresetValidationError[] => {
    const errors: PresetValidationError[] = [];
    
    // Validate each field using helper functions
    const validationChecks = [
      validationHelpers.validateName(name),
      validationHelpers.validateOwner(config.owner),
      validationHelpers.validateRepo(config.repo),
      validationHelpers.validateRepoUrl(config.repoUrl),
      validationHelpers.validateDeployPath(config.deployPath),
      validationHelpers.validateBuildCommand(config.buildCommand)
    ];
    
    // Collect all validation errors
    validationChecks.forEach(error => {
      if (error) errors.push(error);
    });

    return errors;
  }, []);

  /**
   * Check for duplicate preset names
   */
  const isDuplicateName = useCallback((name: string, excludeId?: string): boolean => {
    const trimmedName = name.trim();
    return presetState.presets.some(preset => 
      preset.name.toLowerCase() === trimmedName.toLowerCase() &&
      preset.id !== excludeId
    );
  }, [presetState.presets]);

  /**
   * Generate unique ID for presets
   */
  const generateId = useCallback((): string => {
    return `preset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  /**
   * Create a new preset
   */
  const createPreset = useCallback(async (
    name: string,
    config: DeploymentConfig,
    description?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Early return for validation errors
      const validationErrors = validatePreset(name, config);
      if (validationErrors.length > 0) {
        setError(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
        return false;
      }

      // Early return for duplicate names
      if (isDuplicateName(name)) {
        setError('A preset with this name already exists');
        return false;
      }

      // Create new preset
      const newPreset: DeploymentPreset = {
        id: generateId(),
        name: name.trim(),
        config: { ...config },
        description: description?.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Update state
      setPresetState(prev => ({
        ...prev,
        presets: [...prev.presets, newPreset],
      }));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create preset';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [validatePreset, isDuplicateName, generateId, setPresetState]);

  /**
   * Update an existing preset
   */
  const updatePreset = useCallback(async (
    id: string,
    updates: Partial<Omit<DeploymentPreset, 'id' | 'createdAt'>>
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Early return if preset not found
      const existingPreset = presetState.presets.find(preset => preset.id === id);
      if (!existingPreset) {
        setError('Preset not found');
        return false;
      }

      // Validate if name or config is being updated
      if (updates.name || updates.config) {
        const nameToValidate = updates.name || existingPreset.name;
        const configToValidate = updates.config || existingPreset.config;
        
        // Early return for validation errors
        const validationErrors = validatePreset(nameToValidate, configToValidate);
        if (validationErrors.length > 0) {
          setError(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
          return false;
        }

        // Early return for duplicate names
        if (updates.name && isDuplicateName(updates.name, id)) {
          setError('A preset with this name already exists');
          return false;
        }
      }

      // Update preset
      const updatedPreset: DeploymentPreset = {
        ...existingPreset,
        ...updates,
        name: updates.name?.trim() || existingPreset.name,
        description: updates.description?.trim() || existingPreset.description,
        updatedAt: new Date().toISOString(),
      };

      setPresetState(prev => ({
        ...prev,
        presets: prev.presets.map(preset => 
          preset.id === id ? updatedPreset : preset
        ),
      }));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preset';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [presetState.presets, validatePreset, isDuplicateName, setPresetState]);

  /**
   * Delete a preset
   */
  const deletePreset = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Early return if preset doesn't exist
      const presetExists = presetState.presets.some(preset => preset.id === id);
      if (!presetExists) {
        setError('Preset not found');
        return false;
      }

      // Remove preset
      setPresetState(prev => ({
        ...prev,
        presets: prev.presets.filter(preset => preset.id !== id),
      }));

      // Clear active preset if it was deleted
      if (activePresetId === id) {
        setActivePresetId(null);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete preset';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [presetState.presets, setPresetState, activePresetId, setActivePresetId]);

  /**
   * Select a preset as active
   */
  const selectPreset = useCallback((id: string | null) => {
    setActivePresetId(id);
  }, [setActivePresetId]);

  /**
   * Duplicate a preset
   */
  const duplicatePreset = useCallback(async (id: string, newName: string): Promise<boolean> => {
    // Early return if preset not found
    const existingPreset = presetState.presets.find(preset => preset.id === id);
    if (!existingPreset) {
      setError('Preset not found');
      return false;
    }

    return createPreset(newName, existingPreset.config, existingPreset.description);
  }, [presetState.presets, createPreset]);

  /**
   * Export presets as JSON
   */
  const exportPresets = useCallback((): string => {
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      presets: presetState.presets,
    };
    return JSON.stringify(exportData, null, 2);
  }, [presetState.presets]);

  /**
   * Import presets from JSON
   */
  const importPresets = useCallback(async (jsonData: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const importData = JSON.parse(jsonData);
      
      // Early return for invalid format
      if (!importData.presets || !Array.isArray(importData.presets)) {
        setError('Invalid import format: presets array not found');
        return false;
      }

      // Validate imported presets
      const validPresets: DeploymentPreset[] = [];
      for (const preset of importData.presets) {
        // Skip invalid presets
        if (!preset.name || !preset.config) continue;
        
        const validationErrors = validatePreset(preset.name, preset.config);
        if (validationErrors.length === 0) {
          validPresets.push({
            ...preset,
            id: generateId(), // Generate new IDs to avoid conflicts
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      // Early return if no valid presets found
      if (validPresets.length === 0) {
        setError('No valid presets found in import data');
        return false;
      }

      // Add imported presets
      setPresetState(prev => ({
        ...prev,
        presets: [...prev.presets, ...validPresets],
      }));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import presets';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setPresetState, validatePreset, generateId]);

  return {
    presets: presetState.presets,
    activePreset,
    isLoading,
    error: combinedError,
    createPreset,
    updatePreset,
    deletePreset,
    selectPreset,
    duplicatePreset,
    exportPresets,
    importPresets,
  };
} 