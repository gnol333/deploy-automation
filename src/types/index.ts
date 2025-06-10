export interface Commit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    avatar: string;
  };
  date: string;
  url: string;
}

export interface DeploymentConfig {
  repoUrl: string;
  owner: string;
  repo: string;
  token?: string;
  deployPath: string;
  buildCommand?: string;
}

export interface DeploymentStatus {
  isDeploying: boolean;
  currentStep?: string;
  progress?: number;
  error?: string;
  success?: boolean;
  deployedCommit?: string;
}

// Preset-related types
export interface DeploymentPreset {
  id: string;
  name: string;
  config: DeploymentConfig;
  createdAt: string;
  updatedAt: string;
  description?: string;
}

export interface PresetManagerState {
  presets: DeploymentPreset[];
  activePresetId?: string;
}

// Hook return types
export interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
  error: string | null;
}

export interface UsePresetsReturn {
  presets: DeploymentPreset[];
  activePreset: DeploymentPreset | null;
  isLoading: boolean;
  error: string | null;
  createPreset: (name: string, config: DeploymentConfig, description?: string) => Promise<boolean>;
  updatePreset: (id: string, updates: Partial<Omit<DeploymentPreset, 'id' | 'createdAt'>>) => Promise<boolean>;
  deletePreset: (id: string) => Promise<boolean>;
  selectPreset: (id: string | null) => void;
  duplicatePreset: (id: string, newName: string) => Promise<boolean>;
  exportPresets: () => string;
  importPresets: (jsonData: string) => Promise<boolean>;
}

// Validation types
export interface PresetValidationError {
  field: string;
  message: string;
}

export interface PresetFormData {
  name: string;
  description?: string;
  config: DeploymentConfig;
} 