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

    // Step 3: Install dependencies
    console.log('Installing dependencies...');
    await execAsync('npm install', { cwd: tempDir });

    // Step 4: Build the project
    console.log('Building project...');
    await execAsync(buildCommand, { cwd: tempDir });

    // Step 5: Copy build to deployment path
    console.log('Copying to deployment path...');
    const buildDir = path.join(tempDir, '.next'); // For Next.js builds
    const staticDir = path.join(tempDir, 'public');
    
    // Ensure deployment directory exists
    await fs.mkdir(deployPath, { recursive: true });

    // Copy build files
    await execAsync(`cp -r ${buildDir}/* ${deployPath}/`);
    
    // Copy static files if they exist
    try {
      await execAsync(`cp -r ${staticDir}/* ${deployPath}/`);
    } catch (error) {
      console.log('No static files to copy or error copying static files');
    }

    // Step 6: Cleanup temporary directory
    console.log('Cleaning up...');
    await execAsync(`rm -rf ${tempDir}`);

    return NextResponse.json({
      success: true,
      message: `Successfully deployed commit ${commitSha} to ${deployPath}`,
      commitSha,
      deployPath,
    });

  } catch (error) {
    console.error('Deployment error:', error);
    return NextResponse.json(
      { 
        error: 'Deployment failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 