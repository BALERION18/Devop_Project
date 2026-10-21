import axios from 'axios';
import { config } from '../config/env.js';

export const isGitHubConfigured = () => {
  return Boolean(config.githubToken && config.githubRepo);
};

export const fetchGitHubWorkflowRuns = async (limit = 10) => {
  if (!isGitHubConfigured()) {
    return {
      configured: false,
      message: 'GitHub Actions integration is not configured. Provide GITHUB_TOKEN and GITHUB_REPO in environment to sync live workflows.',
      runs: [],
    };
  }

  try {
    const [owner, repo] = config.githubRepo.split('/');
    if (!owner || !repo) {
      return {
        configured: false,
        error: 'Invalid GITHUB_REPO format. Expected "owner/repo".',
        runs: [],
      };
    }

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs`,
      {
        params: { per_page: limit },
        headers: {
          Authorization: `Bearer ${config.githubToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'DevOpsHub-Dashboard',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        timeout: 10000,
      }
    );

    const rawRuns = response.data.workflow_runs || [];
    const formattedRuns = rawRuns.map((run) => {
      let status = 'queued';
      if (run.status === 'completed') {
        status = run.conclusion === 'success' ? 'success' : 'failed';
      } else if (run.status === 'in_progress') {
        status = 'in_progress';
      }

      return {
        workflowRunId: String(run.id),
        workflowName: run.name,
        serviceName: repo,
        environment: 'production',
        branch: run.head_branch,
        commitSha: run.head_sha ? run.head_sha.substring(0, 7) : 'HEAD',
        fullCommitSha: run.head_sha,
        commitMessage: run.head_commit?.message || 'Triggered via GitHub',
        author: run.triggering_actor?.login || run.head_commit?.author?.name || 'GitHub Actions',
        status,
        event: run.event,
        durationSeconds: run.run_started_at && run.updated_at
          ? Math.max(0, Math.floor((new Date(run.updated_at) - new Date(run.run_started_at)) / 1000))
          : 0,
        workflowRunUrl: run.html_url,
        deployedAt: run.created_at,
        source: 'github_actions',
      };
    });

    return {
      configured: true,
      repository: config.githubRepo,
      totalCount: response.data.total_count,
      runs: formattedRuns,
    };
  } catch (err) {
    console.error('[GitHub API Error]:', err.response?.data?.message || err.message);
    return {
      configured: true,
      error: err.response?.data?.message || err.message,
      statusCode: err.response?.status,
      runs: [],
    };
  }
};

export const dispatchGitHubWorkflow = async (workflowId = 'ci-cd.yml', ref = 'main', inputs = {}) => {
  if (!isGitHubConfigured()) {
    throw new Error('GitHub Actions integration is not configured. Set GITHUB_TOKEN and GITHUB_REPO in backend environment.');
  }

  const [owner, repo] = config.githubRepo.split('/');
  const response = await axios.post(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
    {
      ref,
      inputs,
    },
    {
      headers: {
        Authorization: `Bearer ${config.githubToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DevOpsHub-Dashboard',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      timeout: 10000,
    }
  );

  return { success: true, status: response.status };
};
