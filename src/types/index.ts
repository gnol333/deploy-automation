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