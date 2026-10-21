import { Deployment } from '../models/Deployment.js';
import { getDBStatus } from '../config/db.js';
import { collectSystemMetrics } from '../services/systemMetricService.js';
import { isGitHubConfigured } from '../services/githubService.js';
import { getInMemoryDeployments } from './deploymentController.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const dbStatus = getDBStatus();
    const systemMetrics = await collectSystemMetrics();
    const githubReady = isGitHubConfigured();

    if (!dbStatus.isConnected) {
      const memoryDeps = getInMemoryDeployments();
      const total = memoryDeps.length;
      const successCount = memoryDeps.filter((d) => d.status === 'success').length;
      const failedCount = memoryDeps.filter((d) => d.status === 'failed').length;
      const inProgressCount = memoryDeps.filter((d) => d.status === 'in_progress').length;
      const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0;

      return res.status(200).json({
        success: true,
        stats: {
          totalDeployments: total,
          successfulDeployments: successCount,
          failedDeployments: failedCount,
          inProgressDeployments: inProgressCount,
          successRate,
        },
        latestDeployment: memoryDeps[0] || null,
        recentDeployments: memoryDeps.slice(0, 5),
        serverHealth: {
          status: 'online',
          uptimeSeconds: systemMetrics.server.uptimeSeconds,
          cpuUsagePercent: systemMetrics.metrics.cpu.usagePercent,
          memoryUsagePercent: systemMetrics.metrics.memory.usagePercent,
          isContainer: systemMetrics.server.isContainer,
          environmentType: systemMetrics.server.environmentType,
        },
        integrations: {
          database: {
            status: 'disconnected',
            configured: false,
            message: 'MongoDB Atlas is not connected. Add MONGODB_URI in your .env configuration to persist records permanently.',
          },
          github: {
            configured: githubReady,
            message: githubReady ? 'Connected to GitHub Actions API' : 'Not configured (Optional)',
          },
        },
      });
    }

    // Database is connected: fetch real aggregations
    const [total, successCount, failedCount, inProgressCount, recentDeployments, latestDeployment] =
      await Promise.all([
        Deployment.countDocuments(),
        Deployment.countDocuments({ status: 'success' }),
        Deployment.countDocuments({ status: 'failed' }),
        Deployment.countDocuments({ status: 'in_progress' }),
        Deployment.find().sort({ createdAt: -1 }).limit(5),
        Deployment.findOne().sort({ createdAt: -1 }),
      ]);

    const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalDeployments: total,
        successfulDeployments: successCount,
        failedDeployments: failedCount,
        inProgressDeployments: inProgressCount,
        successRate,
      },
      latestDeployment,
      recentDeployments,
      serverHealth: {
        status: 'online',
        uptimeSeconds: systemMetrics.server.uptimeSeconds,
        cpuUsagePercent: systemMetrics.metrics.cpu.usagePercent,
        memoryUsagePercent: systemMetrics.metrics.memory.usagePercent,
        isContainer: systemMetrics.server.isContainer,
        environmentType: systemMetrics.server.environmentType,
      },
      integrations: {
        database: {
          status: 'connected',
          configured: true,
          host: dbStatus.host,
          databaseName: dbStatus.databaseName,
        },
        github: {
          configured: githubReady,
          message: githubReady ? 'Connected to GitHub Actions API' : 'Not configured (Optional)',
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
