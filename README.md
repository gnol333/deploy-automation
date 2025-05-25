# Deployment Automation Tool

A Next.js application that automates deployment from GitHub repositories. Select any commit from your repository and deploy it automatically to your server.

## Features

- 🔍 **GitHub Integration**: Fetch commits from any GitHub repository
- 📋 **Commit Selection**: View commit messages, authors, and timestamps
- 🚀 **Automated Deployment**: One-click deployment of selected commits
- 🔧 **Configurable**: Custom build commands and deployment paths
- 🔒 **Private Repository Support**: Optional GitHub token for private repos
- 📊 **Real-time Status**: Live deployment progress and status updates

## Prerequisites

- Node.js 18+ installed
- Git installed on your system
- Access to the target deployment directory
- GitHub repository (public or private with token)

## Installation

1. Clone this repository:
```bash
git clone <this-repo-url>
cd deploy-automation
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### 1. Configure Repository Settings

Fill in the following fields in the configuration section:

- **Repository Owner**: GitHub username or organization (e.g., `facebook`)
- **Repository Name**: Repository name (e.g., `react`)
- **Repository URL**: Full Git clone URL (e.g., `https://github.com/facebook/react.git`)
- **GitHub Token**: (Optional) Personal access token for private repositories
- **Deployment Path**: Target directory for deployment (e.g., `/var/www/html`)
- **Build Command**: Command to build your project (default: `npm run build`)

### 2. Fetch Commits

Click the "Fetch Commits" button to retrieve the latest 20 commits from your repository.

### 3. Deploy a Commit

1. Browse the commits table
2. Review commit messages and authors
3. Click "Deploy" on the desired commit
4. Monitor the deployment status

## GitHub Token Setup

For private repositories, you'll need a GitHub Personal Access Token:

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` scope
3. Copy the token and paste it in the GitHub Token field

## Deployment Process

When you deploy a commit, the system:

1. **Clones** the repository to a temporary directory
2. **Checks out** the specific commit
3. **Installs** dependencies (`npm install`)
4. **Builds** the project (using your build command)
5. **Copies** build files to the deployment path
6. **Cleans up** temporary files

## Security Considerations

- The application runs Git and npm commands on your server
- Ensure the deployment path has proper permissions
- Use GitHub tokens securely (consider environment variables for production)
- Validate repository URLs to prevent malicious repositories

## Customization

### Build Commands

Common build commands for different frameworks:

- **Next.js**: `npm run build`
- **React**: `npm run build`
- **Vue.js**: `npm run build`
- **Angular**: `npm run build --prod`
- **Custom**: Any valid npm script

### Deployment Paths

Examples of deployment paths:

- **Apache**: `/var/www/html`
- **Nginx**: `/usr/share/nginx/html`
- **Custom**: Any directory with write permissions

## API Endpoints

### GET `/api/github/commits`

Fetch commits from a GitHub repository.

**Query Parameters:**
- `owner` (required): Repository owner
- `repo` (required): Repository name
- `token` (optional): GitHub access token

### POST `/api/deploy`

Deploy a specific commit.

**Body:**
```json
{
  "repoUrl": "https://github.com/owner/repo.git",
  "commitSha": "abc123...",
  "deployPath": "/var/www/html",
  "buildCommand": "npm run build"
}
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure the deployment path has write permissions
2. **Git Clone Failed**: Check repository URL and network connectivity
3. **Build Failed**: Verify build command and dependencies
4. **GitHub API Rate Limit**: Use a GitHub token to increase rate limits

### Logs

Check the browser console and server logs for detailed error messages.

## Development

To extend this application:

1. **Add new build tools**: Modify the deployment API to support additional build systems
2. **Add webhooks**: Implement GitHub webhooks for automatic deployments
3. **Add rollback**: Store previous deployments for easy rollback
4. **Add notifications**: Integrate with Slack, Discord, or email notifications

## License

MIT License - feel free to use this in your projects!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Note**: This tool is designed for development and staging environments. For production use, consider additional security measures and testing.
