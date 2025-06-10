'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GitBranch, Play, RefreshCw, AlertCircle, CheckCircle, Clock, Save } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Commit, DeploymentConfig, DeploymentStatus } from '@/types';
import { PresetSelector, PresetModal } from '@/components/presets';

export default function DeploymentDashboard() {
  const [config, setConfig] = useState<DeploymentConfig>({
    repoUrl: '',
    owner: '',
    repo: '',
    token: '',
    deployPath: '',
    buildCommand: 'npm run build',
  });

  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
    isDeploying: false,
  });

  // Preset state management
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetModalMode, setPresetModalMode] = useState<'create' | 'edit'>('create');
  const [editingPresetId, setEditingPresetId] = useState<string | undefined>();
  const [showSavePresetPrompt, setShowSavePresetPrompt] = useState(false);
  const [hasConfigChanged, setHasConfigChanged] = useState(false);

  // Track config changes to show save prompt
  useEffect(() => {
    const hasValidConfig = config.owner && config.repo && config.repoUrl && config.deployPath;
    setHasConfigChanged(Boolean(hasValidConfig));
  }, [config]);

  const fetchCommits = async () => {
    if (!config.owner || !config.repo) {
      alert('Please enter repository owner and name');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        owner: config.owner,
        repo: config.repo,
        ...(config.token && { token: config.token }),
      });

      const response = await fetch(`/api/github/commits?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCommits(data.commits);
        
        // Show save preset prompt after successful fetch if config has changed
        if (hasConfigChanged && data.commits.length > 0) {
          setShowSavePresetPrompt(true);
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to fetch commits');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deployCommit = async (commit: Commit) => {
    if (!config.deployPath) {
      alert('Please enter deployment path');
      return;
    }

    setDeploymentStatus({
      isDeploying: true,
      currentStep: 'Starting deployment...',
      progress: 0,
    });

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoUrl: config.repoUrl,
          commitSha: commit.sha,
          deployPath: config.deployPath,
          buildCommand: config.buildCommand,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDeploymentStatus({
          isDeploying: false,
          success: true,
          deployedCommit: commit.sha,
        });
      } else {
        setDeploymentStatus({
          isDeploying: false,
          error: data.error || 'Deployment failed',
        });
      }
    } catch (error) {
      setDeploymentStatus({
        isDeploying: false,
        error: 'Network error during deployment',
      });
    }
  };

  // Preset handlers
  const handleConfigLoad = (newConfig: DeploymentConfig) => {
    setConfig(newConfig);
    setShowSavePresetPrompt(false);
  };

  const handleCreatePreset = () => {
    setPresetModalMode('create');
    setEditingPresetId(undefined);
    setShowPresetModal(true);
    setShowSavePresetPrompt(false);
  };

  const handleEditPreset = (presetId: string) => {
    setPresetModalMode('edit');
    setEditingPresetId(presetId);
    setShowPresetModal(true);
  };

  const handleClosePresetModal = () => {
    setShowPresetModal(false);
    setEditingPresetId(undefined);
  };

  const dismissSavePrompt = () => {
    setShowSavePresetPrompt(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <GitBranch className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Deployment Automation</h1>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Repository Configuration</CardTitle>
          <CardDescription>
            Configure your GitHub repository and deployment settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preset Selector */}
          <PresetSelector
            currentConfig={config}
            onConfigLoad={handleConfigLoad}
            onCreatePreset={handleCreatePreset}
            onEditPreset={handleEditPreset}
            className="mb-4"
          />

          {/* Save Preset Prompt */}
          {showSavePresetPrompt && (
            <Alert className="border-blue-500 bg-blue-50">
              <Save className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  Great! Your configuration worked. Would you like to save it as a preset for future use?
                </span>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    size="sm"
                    onClick={handleCreatePreset}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Save as Preset
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={dismissSavePrompt}
                  >
                    Not Now
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner">Repository Owner</Label>
              <Input
                id="owner"
                placeholder="e.g., facebook"
                value={config.owner}
                onChange={(e) => setConfig({ ...config, owner: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo">Repository Name</Label>
              <Input
                id="repo"
                placeholder="e.g., react"
                value={config.repo}
                onChange={(e) => setConfig({ ...config, repo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repoUrl">Repository URL</Label>
              <Input
                id="repoUrl"
                placeholder="https://github.com/owner/repo.git"
                value={config.repoUrl}
                onChange={(e) => setConfig({ ...config, repoUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">GitHub Token (Optional)</Label>
              <Input
                id="token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={config.token}
                onChange={(e) => setConfig({ ...config, token: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deployPath">Deployment Path</Label>
              <Input
                id="deployPath"
                placeholder="/var/www/html"
                value={config.deployPath}
                onChange={(e) => setConfig({ ...config, deployPath: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buildCommand">Build Command</Label>
              <Input
                id="buildCommand"
                placeholder="npm run build"
                value={config.buildCommand}
                onChange={(e) => setConfig({ ...config, buildCommand: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={fetchCommits} disabled={loading} className="w-full md:w-auto">
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Fetching Commits...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Fetch Commits
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Deployment Status */}
      {(deploymentStatus.isDeploying || deploymentStatus.success || deploymentStatus.error) && (
        <Alert className={deploymentStatus.success ? 'border-green-500' : deploymentStatus.error ? 'border-red-500' : 'border-blue-500'}>
          {deploymentStatus.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : deploymentStatus.error ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          <AlertDescription>
            {deploymentStatus.isDeploying && deploymentStatus.currentStep}
            {deploymentStatus.success && `Successfully deployed commit ${deploymentStatus.deployedCommit?.substring(0, 7)}`}
            {deploymentStatus.error && `Deployment failed: ${deploymentStatus.error}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Commits Table */}
      {commits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Commits</CardTitle>
            <CardDescription>
              Select a commit to deploy to your server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commit</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commits.map((commit) => (
                  <TableRow key={commit.sha}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {commit.sha.substring(0, 7)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate" title={commit.message}>
                        {commit.message.split('\n')[0]}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {commit.author.avatar && (
                          <img
                            src={commit.author.avatar}
                            alt={commit.author.name}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <span className="text-sm">{commit.author.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(commit.date), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => deployCommit(commit)}
                        disabled={deploymentStatus.isDeploying}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Deploy
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Preset Modal */}
      <PresetModal
        isOpen={showPresetModal}
        onClose={handleClosePresetModal}
        currentConfig={config}
        editPresetId={editingPresetId}
        mode={presetModalMode}
      />
    </div>
  );
} 