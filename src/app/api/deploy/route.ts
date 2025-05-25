import { NextRequest, NextResponse } from 'next/server';
import simpleGit from 'simple-git';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoUrl, commitSha, deployPath, buildCommand = 'npm run build' } = body;

    if (!repoUrl || !commitSha || !deployPath) {
      return NextResponse.json(
        { error: 'repoUrl, commitSha, and deployPath are required' },
        { status: 400 }
      );
    }

    // Create temporary directory for cloning
    const tempDir = path.join(process.cwd(), 'temp', `deploy-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    const git = simpleGit();

    // Step 1: Clone the repository
    console.log('Cloning repository...');
    await git.clone(repoUrl, tempDir);

    // Step 2: Checkout specific commit
    console.log(`Checking out commit ${commitSha}...`);
    const repoGit = simpleGit(tempDir);
    await repoGit.checkout(commitSha);

    // Step 3: Install dependencies (if package.json exists)
    const packageJsonPath = path.join(tempDir, 'package.json');
    try {
      await fs.access(packageJsonPath);
      console.log('Installing dependencies...');
      await execAsync('npm install', { cwd: tempDir });

      // Step 4: Build the project (if build command is provided)
      if (buildCommand && buildCommand.trim() !== '') {
        console.log('Building project...');
        try {
          await execAsync(buildCommand, { cwd: tempDir });
        } catch (buildError) {
          console.log('Build command failed, proceeding without build...');
        }
      }
    } catch (error) {
      console.log('No package.json found, skipping npm install and build...');
    }

    // Step 5: Determine what to copy
    console.log('Determining build output...');
    const possibleBuildDirs = [
      path.join(tempDir, '.next'),     // Next.js
      path.join(tempDir, 'build'),     // React/Vue
      path.join(tempDir, 'dist'),      // Vite/Webpack
      path.join(tempDir, 'out'),       // Next.js static export
      path.join(tempDir, 'public'),    // Static files
      tempDir                          // Fallback: copy everything
    ];

    let buildDir = tempDir; // Default to copying everything
    let buildDirFound = false;

    // Find the first existing build directory
    for (const dir of possibleBuildDirs) {
      try {
        const stats = await fs.stat(dir);
        if (stats.isDirectory()) {
          buildDir = dir;
          buildDirFound = true;
          console.log(`Found build directory: ${dir}`);
          break;
        }
      } catch (error) {
        // Directory doesn't exist, continue
      }
    }

    if (!buildDirFound) {
      console.log('No specific build directory found, copying entire project...');
    }

    // Step 6: Copy build to deployment path
    console.log(`Copying from ${buildDir} to ${deployPath}...`);
    
    // Ensure deployment directory exists
    await fs.mkdir(deployPath, { recursive: true });

    // Copy files
    if (buildDir === tempDir) {
      // Copy everything except node_modules, .git, and temp files
      await execAsync(`rsync -av --exclude='node_modules' --exclude='.git' --exclude='temp' --exclude='.env*' ${tempDir}/ ${deployPath}/`);
    } else {
      // Copy specific build directory
      await execAsync(`cp -r ${buildDir}/* ${deployPath}/`);
    }

    // Step 7: Cleanup temporary directory
    console.log('Cleaning up...');
    await execAsync(`rm -rf ${tempDir}`);

    return NextResponse.json({
      success: true,
      message: `Successfully deployed commit ${commitSha} to ${deployPath}`,
      commitSha,
      deployPath,
      buildDirectory: buildDir === tempDir ? 'entire project' : path.basename(buildDir),
    });

  } catch (error) {
    console.error('Deployment error:', error);
    
    // Cleanup on error
    try {
      const tempDir = path.join(process.cwd(), 'temp');
      await execAsync(`rm -rf ${tempDir}`);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    return NextResponse.json(
      { 
        error: 'Deployment failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 