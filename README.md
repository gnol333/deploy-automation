# Deployment Automation Tool

A Next.js application for **local team use** that automates deployment from GitHub repositories. Select any commit from your repository and deploy it automatically to your development/staging servers.

## ⚠️ **For Internal Team Use Only**

This tool is designed for development teams to streamline their deployment workflow in controlled environments. It provides direct server access and should only be used in trusted, internal networks.

## Features

- 🔍 **GitHub Integration**: Fetch commits from any GitHub repository
- 📋 **Commit Selection**: View commit messages, authors, and timestamps
- 🚀 **Automated Deployment**: One-click deployment of selected commits
- 💾 **Preset Management**: Save and reuse deployment configurations
- 🔧 **Multi-Framework Support**: Works with Next.js, React, Vue, Angular, and static sites
- 🎯 **Smart Build Detection**: Automatically detects build outputs (.next, build, dist, out)
- 🔒 **Private Repository Support**: GitHub token support for private repos
- 📊 **Real-time Status**: Live deployment progress and status updates
- 🧹 **Flexible Deployment**: Handles projects with or without build steps

## Prerequisites

- Node.js 18+ installed
- Git installed on your system
- Access to the target deployment directory
- GitHub repository (public or private with token)
- **Internal network environment** (not for production internet-facing use)

## Installation

1. Clone this repository:
```bash
git clone https://github.com/gnol333/deploy-automation.git
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

4. Open [http://localhost:3020](http://localhost:3020) in your browser

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

## Supported Project Types

The deployment system automatically detects and handles various project types:

### **Next.js Projects**
- Detects `.next/` build output
- Handles both static and server-side builds
- Copies build files and static assets

### **React/Vue Projects**
- Detects `build/` directory (Create React App, Vue CLI)
- Handles production builds
- Copies optimized static files

### **Vite/Webpack Projects**
- Detects `dist/` directory
- Handles modern build tools
- Copies bundled assets

### **Static Sites**
- Detects `public/` or `out/` directories
- Handles Jekyll, Hugo, or custom static sites
- Copies static files directly

### **Any Project**
- Fallback: copies entire project (excluding node_modules, .git)
- Works with custom build setups
- Flexible deployment for any framework

## GitHub Token Setup

For private repositories, you'll need a GitHub Personal Access Token:

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` scope
3. Copy the token and paste it in the GitHub Token field

## Team Setup Recommendations

### For Small Teams (2-5 developers)
- Share one GitHub token across the team
- Use presets to standardize deployment configs  
- Each developer can save their own presets locally

### For Larger Teams (5+ developers)
- Consider individual GitHub tokens per developer
- Standardize preset naming conventions
- Use export/import to share useful presets

### Security Notes for Teams
- GitHub tokens are saved in browser localStorage for convenience
- Avoid sharing preset export files outside your team
- Use tokens with minimal required scopes (just `repo` access)
- Consider token rotation on a regular schedule

## Deployment Process

When you deploy a commit, the system:

1. **Clones** the repository to a temporary directory
2. **Checks out** the specific commit
3. **Installs** dependencies (if package.json exists)
4. **Builds** the project (if build command provided)
5. **Detects** the appropriate build output directory
6. **Copies** files to the deployment path
7. **Cleans up** temporary files

## Build Detection Logic

The system automatically searches for build outputs in this order:

1. `.next/` - Next.js builds
2. `build/` - React/Vue builds  
3. `dist/` - Vite/Webpack builds
4. `out/` - Next.js static exports
5. `public/` - Static files
6. **Fallback**: Entire project (excluding node_modules, .git, temp files)

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
- **Vite**: `npm run build`
- **Custom**: Any valid npm script
- **Static Sites**: Leave empty (no build needed)

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

**Response:**
```json
{
  "success": true,
  "message": "Successfully deployed commit abc123 to /var/www/html",
  "commitSha": "abc123...",
  "deployPath": "/var/www/html",
  "buildDirectory": ".next"
}
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure the deployment path has write permissions
2. **Git Clone Failed**: Check repository URL and network connectivity
3. **Build Failed**: Verify build command and dependencies (deployment continues without build)
4. **GitHub API Rate Limit**: Use a GitHub token to increase rate limits
5. **No Build Output**: System will copy entire project as fallback

### Logs

Check the browser console and server logs for detailed error messages.

## Recent Improvements

### v1.1.0 - Multi-Framework Support
- ✅ **Smart Build Detection**: Automatically detects build outputs for different frameworks
- ✅ **Flexible Deployment**: Works with or without build steps
- ✅ **Better Error Handling**: Continues deployment even if build fails
- ✅ **Universal Compatibility**: Supports any project type with intelligent fallbacks

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

**Note**: This tool is designed for **development teams in controlled environments**. For production internet-facing deployments, consider additional security measures including access controls, audit logging, and proper secrets management.
