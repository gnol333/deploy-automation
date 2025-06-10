'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Plus, 
  Edit, 
  Copy, 
  Trash2, 
  Download, 
  Upload,
  BookmarkIcon,
  Play
} from 'lucide-react';
import { usePresets } from '@/hooks';
import { DeploymentConfig } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface PresetSelectorProps {
  currentConfig: DeploymentConfig;
  onConfigLoad: (config: DeploymentConfig) => void;
  onCreatePreset: () => void;
  onEditPreset: (presetId: string) => void;
  className?: string;
}

export function PresetSelector({
  currentConfig,
  onConfigLoad,
  onCreatePreset,
  onEditPreset,
  className = '',
}: PresetSelectorProps) {
  const {
    presets,
    activePreset,
    isLoading,
    error,
    selectPreset,
    deletePreset,
    duplicatePreset,
    exportPresets,
    importPresets,
  } = usePresets();

  const [showManagement, setShowManagement] = useState(false);

  const handlePresetSelect = (presetId: string) => {
    if (presetId === 'create-new') {
      onCreatePreset();
      return;
    }

    if (presetId === 'manage') {
      setShowManagement(true);
      return;
    }

    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      selectPreset(presetId);
      onConfigLoad(preset.config);
    }
  };

  const handleDelete = async (presetId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const preset = presets.find(p => p.id === presetId);
    const presetName = preset?.name || 'this preset';
    
    if (window.confirm(`Are you sure you want to delete "${presetName}"? This action cannot be undone.`)) {
      try {
        const success = await deletePreset(presetId);
        if (success) {
          // Optional: Show success feedback
          console.log(`Preset "${presetName}" deleted successfully`);
        } else {
          // Show error if deletion failed
          alert(`Failed to delete preset "${presetName}". ${error || 'Please try again.'}`);
        }
      } catch (err) {
        console.error('Failed to delete preset:', err);
        alert(`Error deleting preset "${presetName}". Please try again.`);
      }
    }
  };

  const handleDuplicate = async (presetId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      const newName = `${preset.name} (Copy)`;
      try {
        const success = await duplicatePreset(presetId, newName);
        if (success) {
          console.log(`Preset duplicated successfully`);
        }
      } catch (error) {
        console.error('Failed to duplicate preset:', error);
      }
    }
  };

  const handleEdit = (presetId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onEditPreset(presetId);
  };

  const handleExport = () => {
    const data = exportPresets();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployment-presets-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        const success = await importPresets(text);
        if (success) {
          alert('Presets imported successfully!');
        }
      }
    };
    input.click();
  };

  const isConfigChanged = () => {
    if (!activePreset) return false;
    return JSON.stringify(currentConfig) !== JSON.stringify(activePreset.config);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Main Preset Selector */}
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <Select 
            value={activePreset?.id || ''} 
            onValueChange={handlePresetSelect}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <div className="flex items-center space-x-2">
                <BookmarkIcon className="h-4 w-4 text-gray-500" />
                <SelectValue placeholder="Select a preset or create new..." />
              </div>
            </SelectTrigger>
            <SelectContent>
              {/* Create New Option */}
              <SelectItem value="create-new" className="text-blue-600 font-medium">
                <div className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create New Preset</span>
                </div>
              </SelectItem>
              
              {presets.length > 0 && (
                <>
                  {/* Separator */}
                  <div className="border-t my-1" />
                  
                  {/* Existing Presets - Simple List without action buttons */}
                  {presets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{preset.name}</span>
                        <span className="text-xs text-gray-500">
                          {preset.config.owner}/{preset.config.repo}
                        </span>
                        {preset.description && (
                          <span className="text-xs text-gray-400 truncate max-w-60">
                            {preset.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  
                  {/* Management Options */}
                  <div className="border-t my-1" />
                  <div className="p-2 space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={handleExport}
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Export Presets
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={handleImport}
                    >
                      <Upload className="h-3 w-3 mr-2" />
                      Import Presets
                    </Button>
                  </div>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Action Buttons */}
        {activePreset && (
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleEdit(activePreset.id, e)}
              disabled={isLoading}
              title="Edit preset"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleDuplicate(activePreset.id, e)}
              disabled={isLoading}
              title="Duplicate preset"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleDelete(activePreset.id, e)}
              disabled={isLoading}
              className="text-red-500 hover:text-red-700 hover:border-red-300"
              title="Delete preset"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectPreset(null)}
              disabled={isLoading}
              title="Clear selection"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Preset Management Section for when no preset is active but presets exist */}
      {!activePreset && presets.length > 0 && (
        <div className="border rounded-lg p-3 bg-gray-50">
          <h4 className="text-sm font-medium mb-2 text-gray-700">Manage Presets</h4>
          <div className="space-y-2">
            {presets.map((preset) => (
              <div key={preset.id} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex flex-col flex-1">
                  <span className="font-medium text-sm">{preset.name}</span>
                  <span className="text-xs text-gray-500">
                    {preset.config.owner}/{preset.config.repo}
                  </span>
                  {preset.description && (
                    <span className="text-xs text-gray-400 truncate">
                      {preset.description}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      selectPreset(preset.id);
                      onConfigLoad(preset.config);
                    }}
                    title="Load preset"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => handleEdit(preset.id, e)}
                    title="Edit preset"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => handleDuplicate(preset.id, e)}
                    title="Duplicate preset"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    onClick={(e) => handleDelete(preset.id, e)}
                    title="Delete preset"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Preset Info */}
      {activePreset && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Active Preset
              </Badge>
              <span className="font-medium text-blue-900">{activePreset.name}</span>
              {isConfigChanged() && (
                <Badge variant="destructive" className="text-xs">
                  Modified
                </Badge>
              )}
            </div>
            <span className="text-xs text-blue-600">
              Updated {formatDistanceToNow(new Date(activePreset.updatedAt))} ago
            </span>
          </div>
          
          {activePreset.description && (
            <p className="text-sm text-blue-700">{activePreset.description}</p>
          )}
          
          <div className="text-xs text-blue-600 space-y-1">
            <div><strong>Repository:</strong> {activePreset.config.owner}/{activePreset.config.repo}</div>
            <div><strong>Deploy Path:</strong> {activePreset.config.deployPath}</div>
            {activePreset.config.buildCommand && (
              <div><strong>Build Command:</strong> {activePreset.config.buildCommand}</div>
            )}
          </div>

          {isConfigChanged() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
              <strong>Notice:</strong> Current form values differ from the selected preset. 
              Save as a new preset or update the existing one to keep your changes.
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      {presets.length > 0 && (
        <div className="text-xs text-gray-500 flex items-center justify-between">
          <span>{presets.length} preset{presets.length !== 1 ? 's' : ''} available</span>
          {isLoading && <span>Loading...</span>}
        </div>
      )}
    </div>
  );
} 