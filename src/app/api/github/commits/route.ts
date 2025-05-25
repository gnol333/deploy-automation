import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const token = searchParams.get('token');

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Owner and repo parameters are required' },
        { status: 400 }
      );
    }

    const octokit = new Octokit({
      auth: token || undefined, // Optional token for private repos
    });

    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: 20, // Get last 20 commits
    });

    const formattedCommits = commits.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author?.name || 'Unknown',
        email: commit.commit.author?.email || '',
        avatar: commit.author?.avatar_url || '',
      },
      date: commit.commit.author?.date || new Date().toISOString(),
      url: commit.html_url,
    }));

    return NextResponse.json({ commits: formattedCommits });
  } catch (error) {
    console.error('Error fetching commits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commits from GitHub' },
      { status: 500 }
    );
  }
} 