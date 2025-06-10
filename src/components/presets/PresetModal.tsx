'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Save, AlertCircle, CheckCircle, Edit, Plus } from 'lucide-react';
import { usePresets } from '@/hooks';
import { DeploymentConfig, PresetFormData } from '@/types';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: DeploymentConfig;
  editPresetId?: string;
  mode: 'create' | 'edit';
}

export function PresetModal({
  isOpen,
  onClose,
  currentConfig,
  editPresetId,
  mode,
}: PresetModalProps) {
  const {
    presets,
    createPreset,
    updatePreset,
    isLoading,
    error: hookError,
  } = usePresets();

  const [formData, setFormData] = useState<PresetFormData>({
    name: '',
    description: '',
    config: currentConfig,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && editPresetId) {
        const preset = presets.find(p => p.id === editPresetId);
        if (preset) {
          setFormData({
            name: preset.name,
            description: preset.description || '',
            config: preset.config,
          });
        }
      } else {
        setFormData({
          name: '',
          description: '',
          config: currentConfig,
        });
      }
      setErrors({});
      setSubmitError(null);
      setSubmitSuccess(false);
    }
  }, [isOpen, mode, editPresetId, presets, currentConfig]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Preset name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Preset name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Preset name must be less than 50 characters';
    } else {
      // Check for duplicate names (excluding current preset in edit mode)
      const nameExists = presets.some(preset => 
        preset.name.toLowerCase() === formData.name.trim().toLowerCase() &&
        (mode === 'create' || preset.id !== editPresetId)
      );
      if (nameExists) {
        newErrors.name = 'A preset with this name already exists';
      }
    }

    // Validate config fields
    if (!formData.config.owner.trim()) {
      newErrors.owner = 'Repository owner is required';
    }
    if (!formData.config.repo.trim()) {
      newErrors.repo = 'Repository name is required';
    }
    if (!formData.config.repoUrl.trim()) {
      newErrors.repoUrl = 'Repository URL is required';
    }
    if (!formData.config.deployPath.trim()) {
      newErrors.deployPath = 'Deployment path is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      let success = false;
      
      if (mode === 'create') {
        success = await createPreset(
          formData.name.trim(),
          formData.config,
          formData.description?.trim() || undefined
        );
      } else if (mode === 'edit' && editPresetId) {
        success = await updatePreset(editPresetId, {
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          config: formData.config,
        });
      }

      if (success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setSubmitError(hookError || 'Failed to save preset');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  const handleInputChange = (field: keyof PresetFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleConfigChange = (field: keyof DeploymentConfig, value: string) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [field]: value,
      },
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const isFormValid = Object.keys(errors).length === 0 && 
                     formData.name.trim() && 
                     formData.config.owner.trim() && 
                     formData.config.repo.trim() && 
                     formData.config.repoUrl.trim() && 
                     formData.config.deployPath.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {mode === 'create' ? (
              <>
                <Plus className="h-5 w-5" />
                <span>Create New Preset</span>
              </>
            ) : (
              <>
                <Edit className="h-5 w-5" />
                <span>Edit Preset</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Save your current configuration as a reusable preset.'
              : 'Update the preset with your changes.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preset Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">
                Preset Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="preset-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Production Deploy, Staging Setup"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preset-description">Description (Optional)</Label>
              <Textarea
                id="preset-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of what this preset is for..."
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          {/* Configuration Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-3 flex items-center space-x-2">
              <span>Configuration</span>
              <Badge variant="secondary" className="text-xs">
                {mode === 'create' ? 'From Current Form' : 'Editable'}
              </Badge>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="config-owner">
                  Repository Owner <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="config-owner"
                  value={formData.config.owner}
                  onChange={(e) => handleConfigChange('owner', e.target.value)}
                  placeholder="e.g., facebook"
                  className={errors.owner ? 'border-red-500' : ''}
                />
                {errors.owner && (
                  <p className="text-sm text-red-600">{errors.owner}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="config-repo">
                  Repository Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="config-repo"
                  value={formData.config.repo}
                  onChange={(e) => handleConfigChange('repo', e.target.value)}
                  placeholder="e.g., react"
                  className={errors.repo ? 'border-red-500' : ''}
                />
                {errors.repo && (
                  <p className="text-sm text-red-600">{errors.repo}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="config-repoUrl">
                  Repository URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="config-repoUrl"
                  value={formData.config.repoUrl}
                  onChange={(e) => handleConfigChange('repoUrl', e.target.value)}
                  placeholder="https://github.com/owner/repo.git"
                  className={errors.repoUrl ? 'border-red-500' : ''}
                />
                {errors.repoUrl && (
                  <p className="text-sm text-red-600">{errors.repoUrl}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="config-deployPath">
                  Deployment Path <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="config-deployPath"
                  value={formData.config.deployPath}
                  onChange={(e) => handleConfigChange('deployPath', e.target.value)}
                  placeholder="/var/www/html"
                  className={errors.deployPath ? 'border-red-500' : ''}
                />
                {errors.deployPath && (
                  <p className="text-sm text-red-600">{errors.deployPath}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="config-buildCommand">Build Command</Label>
                <Input
                  id="config-buildCommand"
                  value={formData.config.buildCommand || ''}
                  onChange={(e) => handleConfigChange('buildCommand', e.target.value)}
                  placeholder="npm run build"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="config-token">GitHub Token (Optional)</Label>
                <Input
                  id="config-token"
                  type="password"
                  value={formData.config.token || ''}
                  onChange={(e) => handleConfigChange('token', e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                />
                <p className="text-xs text-amber-600">
                  ⚠️ <strong>Team Note:</strong> Tokens will be saved with presets. Avoid sharing preset files outside the team.
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {submitError && (
            <Alert className="border-red-500">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {submitSuccess && (
            <Alert className="border-green-500">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Preset {mode === 'create' ? 'created' : 'updated'} successfully!
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid || isLoading || submitSuccess}
            >
              {isLoading ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : submitSuccess ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {mode === 'create' ? 'Created!' : 'Updated!'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {mode === 'create' ? 'Create Preset' : 'Update Preset'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 