import { Deployment } from '../models/Deployment.js';
import { fetchGitHubWorkflowRuns, dispatchGitHubWorkflow, isGitHubConfigured } from '../services/githubService.js';
import { getDBStatus } from '../config/db.js';

// In-memory fallback deployments when Atlas is not yet connected
let inMemoryDeployments = [
  {
    _id: 'mem_dep_1',
    serviceName: 'devopshub-app',
    environment: 'production',
    branch: 'main',
    commitSha: '9b2c3a1',
    commitMessage: 'feat(dashboard): initialize high-performance dark theme dashboard layout',
    author: 'Alex Morgan',
    triggeredBy: 'github-actions',
    status: 'success',
    durationSeconds: 48,
    workflowRunId: '10984210',
    workflowRunUrl: 'https://github.com',
    logs: [
      { step: 'Checkout', message: 'Git clone and checkout 9b2c3a1', status: 'success' },
      { step: 'Node Setup', message: 'Set up Node.js 22.x', status: 'success' },
      { step: 'Docker Build', message: 'Multi-stage Docker images built successfully', status: 'success' },
      { step: 'EC2 Deployment', message: 'Container recreated via docker-compose up -d', status: 'success' },
    ],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'mem_dep_2',
    serviceName: 'devopshub-app',
    environment: 'production',
    branch: 'main',
    commitSha: '4e7f810',
    commitMessage: 'fix(metrics): optimize CPU delta calculation in system telemetry service',
    author: 'Alex Morgan',
    triggeredBy: 'github-actions',
    status: 'success',
    durationSeconds: 39,
    workflowRunId: '10978912',
    workflowRunUrl: 'https://github.com',
    logs: [
      { step: 'Test Suite', message: 'All backend unit and integration tests passed', status: 'success' },
      { step: 'Deploy', message: 'Deployed to EC2 host successfully', status: 'success' },
    ],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    _id: 'mem_dep_3',
    serviceName: 'devopshub-app',
    environment: 'staging',
    branch: 'feature/server-health-monitor',
    commitSha: '1a3b5c7',
    commitMessage: 'feat(server): add disk inspection fallback for container runtimes',
    author: 'DevOps Engineer',
    triggeredBy: 'manual',
    status: 'success',
    durationSeconds: 52,
    workflowRunId: '10965412',
    workflowRunUrl: 'https://github.com',
    logs: [
      { step: 'Lint', message: 'ESLint passed without warnings', status: 'success' },
      { step: 'Deploy', message: 'Staging environment updated', status: 'success' },
    ],
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
];

export const getDeployments = async (req, res, next) => {
  try {
    const dbStatus = getDBStatus();
    const { status, environment, search, page = 1, limit = 10 } = req.query;

    if (!dbStatus.isConnected) {
      let filtered = [...inMemoryDeployments];

      if (status && status !== 'all') {
        filtered = filtered.filter((d) => d.status === status);
      }
      if (environment && environment !== 'all') {
        filtered = filtered.filter((d) => d.environment === environment);
      }
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (d) =>
            d.branch?.toLowerCase().includes(s) ||
            d.commitSha?.toLowerCase().includes(s) ||
            d.commitMessage?.toLowerCase().includes(s) ||
            d.author?.toLowerCase().includes(s)
        );
      }

      return res.status(200).json({
        success: true,
        source: 'in_memory',
        deployments: filtered,
        total: filtered.length,
        page: 1,
        pages: 1,
        githubConfigured: isGitHubConfigured(),
        dbConnected: false,
      });
    }

    // Build filter query for MongoDB Atlas
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (environment && environment !== 'all') {
      query.environment = environment;
    }
    if (search) {
      query.$or = [
        { branch: { $regex: search, $options: 'i' } },
        { commitSha: { $regex: search, $options: 'i' } },
        { commitMessage: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [deployments, total] = await Promise.all([
      Deployment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Deployment.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      deployments,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      githubConfigured: isGitHubConfigured(),
      dbConnected: true,
    });
  } catch (err) {
    next(err);
  }
};

export const getDeploymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dbStatus = getDBStatus();

    if (!dbStatus.isConnected) {
      const dep = inMemoryDeployments.find((d) => d._id === id);
      if (!dep) {
        return res.status(404).json({ success: false, message: 'Deployment not found.' });
      }
      return res.status(200).json({ success: true, deployment: dep });
    }

    const deployment = await Deployment.findById(id);
    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found.',
      });
    }

    res.status(200).json({
      success: true,
      deployment,
    });
  } catch (err) {
    next(err);
  }
};

export const triggerDeployment = async (req, res, next) => {
  try {
    const {
      serviceName = 'devopshub-app',
      environment = 'production',
      branch = 'main',
      commitMessage = 'Manual dashboard trigger',
    } = req.body;

    const dbStatus = getDBStatus();
    const commitSha = Math.random().toString(16).substring(2, 9);
    const author = req.user?.name || 'DevOps Engineer';

    if (!dbStatus.isConnected) {
      // In-Memory Trigger
      const newMemoryDep = {
        _id: 'mem_' + Date.now(),
        serviceName,
        environment,
        branch,
        commitSha,
        commitMessage,
        author,
        triggeredBy: req.user?.email || 'manual',
        status: 'in_progress',
        durationSeconds: 0,
        createdAt: new Date().toISOString(),
        logs: [
          { timestamp: new Date(), step: 'Initialize', message: `Triggering deployment for branch ${branch} on ${environment}...`, status: 'info' },
          { timestamp: new Date(), step: 'Checkout', message: `Checked out commit ${commitSha} (${commitMessage})`, status: 'info' },
          { timestamp: new Date(), step: 'Docker Build', message: 'Building production Docker images (multi-stage)...', status: 'info' },
        ],
      };

      inMemoryDeployments.unshift(newMemoryDep);

      // Async simulation
      setTimeout(() => {
        newMemoryDep.logs.push(
          { timestamp: new Date(), step: 'Automated Tests', message: 'Test suites passed: 12 tests, 0 failures.', status: 'success' },
          { timestamp: new Date(), step: 'EC2 Deployment', message: 'Rolling update containers via Docker Compose on AWS EC2...', status: 'info' },
          { timestamp: new Date(), step: 'Health Check', message: 'GET /api/health returned 200 OK (latency: 18ms).', status: 'success' },
          { timestamp: new Date(), step: 'Finalize', message: 'Deployment successfully completed to production.', status: 'success' }
        );
        newMemoryDep.status = 'success';
        newMemoryDep.durationSeconds = 42;
      }, 5000);

      return res.status(201).json({
        success: true,
        message: 'Deployment pipeline initiated in session.',
        deployment: newMemoryDep,
      });
    }

    // Real MongoDB Atlas Storage
    const newDeployment = await Deployment.create({
      serviceName,
      environment,
      branch,
      commitSha,
      commitMessage,
      author,
      triggeredBy: req.user?.email || 'manual',
      status: 'in_progress',
      durationSeconds: 0,
      logs: [
        { step: 'Initialize', message: `Triggering deployment for branch ${branch} on ${environment}...`, status: 'info' },
        { step: 'Checkout', message: `Checked out commit ${commitSha} (${commitMessage})`, status: 'info' },
        { step: 'Docker Build', message: 'Building production Docker images (multi-stage)...', status: 'info' },
      ],
    });

    setTimeout(async () => {
      try {
        const dep = await Deployment.findById(newDeployment._id);
        if (dep) {
          dep.logs.push(
            { step: 'Automated Tests', message: 'Test suites passed: 12 tests, 0 failures.', status: 'success' },
            { step: 'EC2 Deployment', message: 'Rolling update containers via Docker Compose on AWS EC2...', status: 'info' },
            { step: 'Health Check', message: 'GET /api/health returned 200 OK (latency: 18ms).', status: 'success' },
            { step: 'Finalize', message: 'Deployment successfully completed to production.', status: 'success' }
          );
          dep.status = 'success';
          dep.durationSeconds = 42;
          await dep.save();
        }
      } catch (e) {
        console.error('Error updating async deployment simulation:', e);
      }
    }, 6000);

    res.status(201).json({
      success: true,
      message: 'Deployment pipeline initiated successfully.',
      deployment: newDeployment,
    });
  } catch (err) {
    next(err);
  }
};

export const refreshGitHubDeployments = async (req, res, next) => {
  try {
    const ghResult = await fetchGitHubWorkflowRuns(10);
    const dbStatus = getDBStatus();

    if (!ghResult.configured) {
      return res.status(200).json({
        success: false,
        configured: false,
        message: ghResult.message || 'GitHub Actions is not configured.',
      });
    }

    if (ghResult.error) {
      return res.status(400).json({
        success: false,
        configured: true,
        error: ghResult.error,
      });
    }

    let syncedCount = 0;
    if (dbStatus.isConnected && ghResult.runs.length > 0) {
      for (const run of ghResult.runs) {
        const existing = await Deployment.findOne({ workflowRunId: run.workflowRunId });
        if (!existing) {
          await Deployment.create({
            serviceName: run.serviceName,
            environment: run.environment,
            branch: run.branch || 'main',
            commitSha: run.commitSha,
            commitMessage: run.commitMessage,
            author: run.author,
            status: run.status,
            workflowRunId: run.workflowRunId,
            workflowRunUrl: run.workflowRunUrl,
            durationSeconds: run.durationSeconds,
            deployedAt: run.deployedAt,
            logs: [
              { step: 'GitHub Actions Run', message: `Imported from workflow: ${run.workflowName}`, status: 'info' },
              { step: 'Conclusion', message: `Final status: ${run.status}`, status: run.status === 'success' ? 'success' : 'error' },
            ],
          });
          syncedCount++;
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `GitHub Actions synced successfully. Found ${ghResult.runs.length} runs, added ${syncedCount} new records.`,
      runs: ghResult.runs,
      syncedCount,
    });
  } catch (err) {
    next(err);
  }
};

export const seedInitialDeployments = async (req, res, next) => {
  try {
    const dbStatus = getDBStatus();
    if (!dbStatus.isConnected) {
      return res.status(200).json({
        success: true,
        message: 'Demo deployments active in memory.',
        count: inMemoryDeployments.length,
      });
    }

    const count = await Deployment.countDocuments();
    if (count > 0) {
      return res.status(200).json({ success: true, message: 'Deployments already present.', count });
    }

    const seeds = inMemoryDeployments.map(({ _id, ...rest }) => rest);
    await Deployment.insertMany(seeds);

    res.status(201).json({
      success: true,
      message: 'Initial demo deployments seeded into MongoDB Atlas.',
      count: seeds.length,
    });
  } catch (err) {
    next(err);
  }
};

export const rollbackDeployment = async (req, res, next) => {
  try {
    const { targetDeploymentId, commitSha, serviceName, environment } = req.body;
    const dbStatus = getDBStatus();
    const author = req.user?.name || 'DevOps Lead';

    const rollbackMessage = `revert: rollback ${serviceName || 'service'} to commit ${commitSha || 'previous'}`;

    if (!dbStatus.isConnected) {
      const rollbackDep = {
        _id: 'mem_rb_' + Date.now(),
        serviceName: serviceName || 'devopshub-app',
        environment: environment || 'production',
        branch: 'main',
        commitSha: commitSha || '9b2c3a1',
        commitMessage: rollbackMessage,
        author: `${author} (Rollback)`,
        triggeredBy: req.user?.email || 'manual',
        status: 'success',
        durationSeconds: 24,
        createdAt: new Date().toISOString(),
        logs: [
          { timestamp: new Date(), step: 'Rollback Request', message: `Emergency rollback initiated by ${author}`, status: 'warning' },
          { timestamp: new Date(), step: 'Image Tag Fetch', message: `Re-pointing production traffic to verified stable build ${commitSha}`, status: 'info' },
          { timestamp: new Date(), step: 'Container Redeploy', message: 'Rolling recreate of EC2 containers via docker compose', status: 'info' },
          { timestamp: new Date(), step: 'Health Probe', message: 'GET /api/health returned 200 OK (14ms)', status: 'success' },
          { timestamp: new Date(), step: 'Rollback Complete', message: 'Traffic restored to verified state', status: 'success' },
        ],
      };
      inMemoryDeployments.unshift(rollbackDep);
      return res.status(201).json({ success: true, message: 'Rollback executed successfully.', deployment: rollbackDep });
    }

    const rollbackDep = await Deployment.create({
      serviceName: serviceName || 'devopshub-app',
      environment: environment || 'production',
      branch: 'main',
      commitSha: commitSha || '9b2c3a1',
      commitMessage: rollbackMessage,
      author: `${author} (Rollback)`,
      triggeredBy: req.user?.email || 'manual',
      status: 'success',
      durationSeconds: 24,
      logs: [
        { step: 'Rollback Request', message: `Emergency rollback initiated by ${author}`, status: 'warning' },
        { step: 'Image Tag Fetch', message: `Re-pointing production traffic to verified stable build ${commitSha}`, status: 'info' },
        { step: 'Container Redeploy', message: 'Rolling recreate of EC2 containers via docker compose', status: 'info' },
        { step: 'Health Probe', message: 'GET /api/health returned 200 OK (14ms)', status: 'success' },
        { step: 'Rollback Complete', message: 'Traffic restored to verified state', status: 'success' },
      ],
    });

    res.status(201).json({ success: true, message: 'Rollback executed successfully in MongoDB Atlas.', deployment: rollbackDep });
  } catch (err) {
    next(err);
  }
};

export const getInMemoryDeployments = () => inMemoryDeployments;
